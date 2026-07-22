/**
 * Where should I form my business? — the comparison engine.
 *
 * Every other calculator here takes income and returns tax. This one compares
 * jurisdictions, and it exists because the popular answer is wrong: forming in
 * Delaware, Wyoming or Nevada while operating somewhere else almost always ADDS
 * cost rather than removing it.
 *
 * THE EDITORIAL SPINE, WHICH IS ALSO THE MATH. If you operate in Ohio, a
 * Wyoming LLC still owes Ohio foreign registration, Ohio taxes on Ohio-source
 * income, and a Wyoming registered agent on top of all of it. So a column for a
 * state you do not operate in NEVER drops the operating state's obligations —
 * it adds its own on top. If this engine ever produces a Wyoming total below
 * the home-state total for a business physically operating elsewhere, treat it
 * as a bug until proven otherwise. There is a unit test for exactly that.
 *
 * WHY STATE INCOME TAX IS THE SAME IN EVERY COLUMN. Pass-through income is
 * taxed where the owner lives and where the income is sourced — not where the
 * paperwork was filed. A California resident forming a Wyoming LLC still owes
 * California. That is verified: Cal. R&TC 17041 taxes residents on entire
 * income and 17951 limits source rules to non-residents; neither mentions the
 * state of organization. So the income tax line is computed once and reported
 * as invariant, which is more honest than letting it wobble between columns and
 * implying that filing somewhere else moves it.
 *
 * WHAT VARIES is compliance cost: formation fees, annual reports, franchise and
 * gross-receipts regimes, the registered agent, and — the honest row — foreign
 * registration in the state where the work actually happens.
 *
 * NULLS ARE LOAD-BEARING. A cost that is known to exist but has no confirmed
 * figure computes null and surfaces as "+ unquantified", never as zero. A total
 * that silently omits a real cost is worse than one that admits it does not
 * know, because it looks complete.
 */
// The UI-facing projection, not the full overrides file. The audit trail in
// that file is half its bytes and no browser needs it — see gen-data.mjs.
import formationData from '../data/formation-fees';
import { states } from '../data/states';
import {
  calcFederalTax, calcSETax, calcFICA, calcQBI, calcStateTax,
  calcDelawareFranchiseTax, getStandardDeduction,
} from './tax-engine';

const DATA = formationData as Record<string, any>;

/** The fixed comparison set, per the specification. */
export const FIXED_COMPARISON_STATES = ['DE', 'WY', 'NV', 'TX', 'FL', 'SD'] as const;

/**
 * Registered agent tiers.
 *
 * MARKET PRICES, not government fees. Copy must call this a typical market
 * range and never present it as an official figure. Self-agent is $0 but is
 * only lawful where the owner actually has an address in that state, which is
 * why the engine refuses it on any column that is not the home or work state.
 */
export const AGENT_TIERS = {
  self: { label: 'Act as your own agent', cost: 0 },
  basic: { label: 'Basic service', cost: 50 },
  standard: { label: 'Standard service', cost: 100 },
  premium: { label: 'Premium service', cost: 200 },
} as const;
export type AgentTier = keyof typeof AGENT_TIERS;

export type EntityChoice = 'llc' | 'llc-s-elect' | 's-corp' | 'c-corp' | 'sole-prop';

export interface FormationInput {
  /** Where the owner lives. Drives personal income tax. */
  homeState: string;
  /** Where the work is physically performed. Drives foreign registration. */
  workState: string;
  entity: EntityChoice;
  annualRevenue: number;
  annualProfit: number;
  ownerSalary: number;
  ownerDistributions: number;
  numberOfOwners: number;
  numberOfEmployees: number;
  /** An extra state the user wants to see. */
  candidateState?: string;
  agentTier: AgentTier;
  filingStatus?: string;
  /** Group B — drives warnings only, never math. */
  presence?: 'online' | 'physical' | 'mixed';
  customerStates?: string[];
  expectsInvestors?: boolean;
  ownsProperty?: boolean;
  licensedProfession?: boolean;
}

export interface Money { amount: number | null; note?: string | null }

export interface FormationColumn {
  state: string;
  stateName: string;
  isOperatingState: boolean;
  formationFee: Money;
  annualReport: Money;
  franchiseTax: { amount: number | null; method?: string; note?: string | null };
  grossReceiptsTax: { amount: number | null; thresholdMet: boolean | null; note?: string | null };
  agentCost: number;
  foreignRegistration: { oneTime: number | null; operatingState: string | null; note?: string | null };
  /** Identical in every column, by construction. Reported, not varied. */
  stateIncomeTax: number;
  annualTotal: number;
  /** Costs known to exist here with no confirmed figure. */
  unquantified: string[];
  takeHome: number;
  fiveYearTotal: number;
  flags: string[];
}

export interface Warning { kind: string; text: string }

export interface FormationResult {
  /** Computed once. A state cannot change federal tax and the layout must not imply it can. */
  federal: { tax: number; seTax: number; breakdown: string };
  columns: FormationColumn[];
  warnings: Warning[];
  /** Set when the entity choice makes the whole question moot. */
  shortCircuit?: string;
}

/* ------------------------------------------------------------------ data ---- */

/** Which fee row to read. An S-elected LLC is still an LLC at the state counter. */
function feeKind(entity: EntityChoice): 'llc' | 'corp' {
  return entity === 's-corp' || entity === 'c-corp' ? 'corp' : 'llc';
}

function row(state: string, entity: EntityChoice) {
  return DATA[state]?.[feeKind(entity)] ?? null;
}

/**
 * Annualised report cost.
 *
 * A biennial report is not half a cost you can ignore — it is half a cost per
 * year across a five-year window. Alaska and Nebraska file every two years and
 * a projection that charged them annually would overstate both.
 */
function annualisedReport(r: any): number | null {
  if (!r?.annualReport) return null;
  const { amount, frequency } = r.annualReport;
  if (amount === null || amount === undefined) return null;
  if (frequency === 'none') return 0;
  return frequency === 'biennial' ? amount / 2 : amount;
}

/* ------------------------------------------------------------- franchise ---- */

/**
 * Franchise tax where real arithmetic is possible.
 *
 * Delaware is the only one with two methods and a genuine choice between them,
 * so it is computed properly and the cheaper one flagged. Everything else is
 * either a flat minimum or prose — and prose computes null.
 */
function franchiseFor(state: string, entity: EntityChoice, input: FormationInput) {
  const ft = DATA[state]?.franchiseTax;

  if (state === 'DE' && feeKind(entity) === 'corp') {
    // Authorized shares are not an input to this tool, so a representative
    // small-company share structure is used and said so out loud.
    const de = calcDelawareFranchiseTax(5_000_000, Math.max(0, input.annualProfit), 4_000_000);
    return {
      amount: de.best,
      method: de.best === de.parValueMethod ? 'assumed par value' : 'authorized shares',
      note: `Delaware bills the authorized shares method by default ($${Math.round(de.authMethod).toLocaleString('en-US')}); the assumed par value method here is $${Math.round(de.parValueMethod).toLocaleString('en-US')}. Assumes 5,000,000 authorized and 4,000,000 issued shares — your own share structure changes this.`,
    };
  }
  if (state === 'DE' && feeKind(entity) === 'llc') {
    const t = DATA.DE.llc?.annualTax?.amount ?? null;
    return { amount: t, note: DATA.DE.llc?.annualTax?.note ?? null };
  }

  // A flat annual tax the state charges the entity — California's $800, Nevada's license.
  const flat = row(state, entity)?.annualTax?.amount ?? null;
  if (flat !== null) {
    return { amount: flat, note: row(state, entity)?.annualTax?.note ?? null };
  }
  if (ft?.structured?.capitalBased === false || ft?.structured?.repealed) {
    return { amount: 0, note: ft.note ?? null };
  }
  // Structure known, figures not. Null, with the note surfaced.
  return { amount: null, note: ft?.note ?? null };
}

/* --------------------------------------------------------- gross receipts ---- */

/**
 * Threshold-aware gross receipts and margin taxes.
 *
 * Below a threshold this is genuinely zero and should say so with the reason,
 * not be left blank. Above it, a regime with no single rate — Nevada varies by
 * industry, Washington by classification, California by tier — computes null
 * rather than inventing a rate.
 */
function grossReceiptsFor(state: string, input: FormationInput) {
  const g = DATA[state]?.grossReceiptsTax;
  if (!g || g.applies === false || g.applies === null) {
    return { amount: 0, thresholdMet: null, note: g?.note ?? null };
  }
  const threshold = g.threshold ?? null;
  if (threshold !== null && input.annualRevenue <= threshold) {
    return {
      amount: 0,
      thresholdMet: false,
      note: `No tax due — revenue is at or below the $${threshold.toLocaleString('en-US')} threshold. ${g.note ?? ''}`.trim(),
    };
  }
  if (g.rate === null || g.rate === undefined) {
    return { amount: null, thresholdMet: threshold === null ? null : true, note: g.note ?? null };
  }
  const base = threshold !== null ? Math.max(0, input.annualRevenue - threshold) : input.annualRevenue;
  return { amount: base * g.rate, thresholdMet: threshold === null ? null : true, note: g.note ?? null };
}

/* -------------------------------------------------------------- federal ----- */

function federalFor(input: FormationInput) {
  const status = input.filingStatus ?? 'single';
  const std = getStandardDeduction(status, false);
  const profit = Math.max(0, input.annualProfit);

  if (input.entity === 'c-corp') {
    const salary = Math.max(0, input.ownerSalary);
    const fica = calcFICA(salary, undefined, 0, status);
    const corporate = Math.max(0, profit - salary) * 0.21;
    const personal = calcFederalTax(Math.max(0, salary - std), status);
    return { tax: corporate + personal + fica.totalFICA, seTax: 0,
      breakdown: 'Corporation tax at 21% on retained profit, plus payroll tax and personal income tax on your salary.' };
  }
  if (input.entity === 's-corp' || input.entity === 'llc-s-elect') {
    const salary = Math.max(0, input.ownerSalary);
    const dist = Math.max(0, profit - salary);
    const fica = calcFICA(salary, undefined, 0, status);
    const beforeQbi = Math.max(0, salary + dist - std);
    const qbi = calcQBI(dist, beforeQbi, status);
    return { tax: calcFederalTax(Math.max(0, beforeQbi - qbi), status) + fica.totalFICA, seTax: fica.totalFICA,
      breakdown: 'Payroll tax on your salary only, plus federal income tax on salary and distribution together.' };
  }
  const se = calcSETax(profit, undefined, 0, status);
  const beforeQbi = Math.max(0, profit - se.deductibleHalf - std);
  const qbi = calcQBI(profit, beforeQbi, status);
  return { tax: calcFederalTax(Math.max(0, beforeQbi - qbi), status) + se.totalSE, seTax: se.totalSE,
    breakdown: 'Self-employment tax on the whole profit, plus federal income tax after the qualified business income deduction.' };
}

/* ------------------------------------------------------------- the engine --- */

export function compareFormationStates(input: FormationInput): FormationResult {
  const warnings: Warning[] = [];
  const status = input.filingStatus ?? 'single';

  if (input.entity === 'sole-prop') {
    return {
      federal: federalFor(input),
      columns: [],
      warnings: [{ kind: 'entity',
        text: 'A sole proprietorship is not formed in any state — there is nothing to file and no state to choose. The question you are asking is about entity type, not location.' }],
      shortCircuit: 'A sole proprietor has no formation state. Compare entity types instead.',
    };
  }

  const federal = federalFor(input);
  const operatingState = input.workState || input.homeState;

  /*
   * The comparison set. Home first, then work if different, then the user's
   * candidate, then the fixed six — deduplicated, order preserved.
   */
  const set: string[] = [];
  for (const s of [input.homeState, input.workState, input.candidateState, ...FIXED_COMPARISON_STATES]) {
    if (s && DATA[s] && !set.includes(s)) set.push(s);
  }

  /*
   * State income tax, computed ONCE on the operating state.
   *
   * This does not vary by column and must not be made to look as though it
   * does. Where you file the paperwork has no bearing on which state taxes
   * pass-through income.
   */
  const stateIncomeTax = operatingState
    ? calcStateTax(Math.max(0, input.annualProfit), operatingState, undefined, status).tax
    : 0;

  const columns: FormationColumn[] = set.map((state) => {
    const r = row(state, input.entity);
    const isOperating = state === operatingState;
    const flags: string[] = [];
    const unquantified: string[] = [];

    const formationFee: Money = { amount: r?.formationFee ?? null, note: r?.feeVariesNote ?? null };
    if (r?.feeVaries) {
      flags.push('fee-varies');
      unquantified.push(`${states[state]?.name} formation fee scales — the figure shown is a minimum`);
    }
    if (formationFee.amount === null) unquantified.push(`${states[state]?.name} formation fee`);
    if (r?.legacyLead) flags.push('legacy-lead-unverified');
    if (r?.recheckIdenticalForeignFee) flags.push('foreign-fee-needs-recheck');

    const reportAnnual = annualisedReport(r);
    const annualReport: Money = { amount: reportAnnual, note: r?.annualReport?.note ?? null };
    if (reportAnnual === null && r?.annualReport?.frequency !== 'none') {
      unquantified.push(`${states[state]?.name} annual report`);
    }

    const franchiseTax = franchiseFor(state, input.entity, input);
    if (franchiseTax.amount === null) {
      flags.push('prose-only-franchise');
      unquantified.push(`${states[state]?.name} franchise tax`);
    }

    const grossReceiptsTax = grossReceiptsFor(state, input);
    if (grossReceiptsTax.amount === null) {
      flags.push('prose-only-grt');
      unquantified.push(`${states[state]?.name} gross receipts tax`);
    }

    /*
     * Registered agent. Self-agent is only lawful where you have an address,
     * so it is refused anywhere that is not the home or work state — silently
     * substituting a paid tier would be the wrong fix, so it warns.
     */
    let agentCost = AGENT_TIERS[input.agentTier].cost;
    const canSelfAgent = state === input.homeState || state === input.workState;
    if (input.agentTier === 'self' && !canSelfAgent) {
      agentCost = AGENT_TIERS.basic.cost;
      flags.push('self-agent-unavailable');
    }

    /*
     * THE HONEST ROW. Forming outside the operating state does not replace that
     * state's obligations, it adds to them: its foreign qualification fee once,
     * and its annual report and taxes every year thereafter.
     */
    let foreignOneTime: number | null = 0;
    let operatingAnnualAdded = 0;
    let foreignNote: string | null = null;

    if (!isOperating && operatingState) {
      const opRow = row(operatingState, input.entity);
      foreignOneTime = opRow?.foreignQualificationFee ?? null;
      if (foreignOneTime === null) {
        unquantified.push(`${states[operatingState]?.name} foreign registration fee`);
      }
      const opReport = annualisedReport(opRow);
      if (opReport === null) {
        unquantified.push(`${states[operatingState]?.name} annual report (still owed)`);
      } else {
        operatingAnnualAdded += opReport;
      }
      const opFranchise = franchiseFor(operatingState, input.entity, input);
      if (opFranchise.amount === null) {
        unquantified.push(`${states[operatingState]?.name} franchise tax (still owed)`);
      } else {
        operatingAnnualAdded += opFranchise.amount;
      }
      flags.push('operating-state-obligations-added');
      foreignNote = `Forming in ${states[state]?.name} does not remove ${states[operatingState]?.name}'s requirements. You register there as a foreign entity and keep filing and paying there as well.`;
    }

    const oneTimeExtra = r?.oneTimeAtRegistration?.amount ?? 0;
    if (r?.oneTimeAtRegistration) flags.push('one-time-at-registration');

    const annualTotal =
      (annualReport.amount ?? 0) +
      (franchiseTax.amount ?? 0) +
      (grossReceiptsTax.amount ?? 0) +
      agentCost +
      operatingAnnualAdded;

    const fiveYearTotal =
      (formationFee.amount ?? 0) + oneTimeExtra + (foreignOneTime ?? 0) + annualTotal * 5;

    return {
      state,
      stateName: states[state]?.name ?? state,
      isOperatingState: isOperating,
      formationFee,
      annualReport,
      franchiseTax,
      grossReceiptsTax,
      agentCost,
      foreignRegistration: { oneTime: foreignOneTime, operatingState: isOperating ? null : operatingState, note: foreignNote },
      stateIncomeTax,
      annualTotal,
      unquantified,
      takeHome: Math.max(0, input.annualProfit - federal.tax - stateIncomeTax - annualTotal),
      fiveYearTotal,
      flags,
    };
  });

  /* ------------------------------------------------------------ warnings --- */

  if (input.workState && input.workState !== input.homeState) {
    warnings.push({ kind: 'two-states',
      text: `You live in ${states[input.homeState]?.name} and work in ${states[input.workState]?.name}. Both have a claim, and forming somewhere else adds a third set of obligations rather than replacing either.` });
  }
  if (input.numberOfEmployees > 0) {
    warnings.push({ kind: 'payroll-nexus',
      text: `Employees create a presence wherever they work. With ${input.numberOfEmployees} on payroll you register in each state where they are, whatever the formation state says.` });
  }
  if (input.numberOfOwners > 100 && (input.entity === 's-corp' || input.entity === 'llc-s-elect')) {
    warnings.push({ kind: 'sCorp-owner-limit',
      text: 'An S corporation cannot have more than 100 shareholders. At this number the election is unavailable.' });
  }
  if (input.numberOfOwners > 1 && input.entity === 'llc') {
    warnings.push({ kind: 'classification',
      text: 'With more than one owner an LLC is taxed as a partnership by default rather than as a disregarded entity. The figures here follow the primary owner only.' });
  }
  if (input.licensedProfession) {
    warnings.push({ kind: 'licensing',
      text: 'Licensed professions usually have to form in the state of licensure, often as a professional entity. Several columns here may simply be unavailable to you, and your licensing board\'s answer beats this calculator.' });
  }
  if (input.ownsProperty) {
    warnings.push({ kind: 'property',
      text: 'Owning property creates a presence in that state and a registration requirement. Property tax is not modeled here at all.' });
  }
  if (input.customerStates?.length) {
    warnings.push({ kind: 'customer-nexus',
      text: `Customers in ${input.customerStates.map((s) => states[s]?.name ?? s).join(', ')} can create sales tax obligations. This calculator does not compute sales tax or economic nexus and no figure here includes them.` });
  }
  if (input.presence === 'physical') {
    warnings.push({ kind: 'physical-presence',
      text: 'A physical presence settles the question: you are doing business where the premises are, and you register there regardless of where the entity was formed.' });
  }
  if (input.ownerSalary + input.ownerDistributions > input.annualProfit) {
    warnings.push({ kind: 'input',
      text: 'Salary and distributions together exceed the profit entered. The figures below still compute, but the inputs describe a business paying out more than it made.' });
  }
  if (columns.some((c) => c.flags.includes('self-agent-unavailable'))) {
    warnings.push({ kind: 'self-agent',
      text: 'Acting as your own registered agent needs an address in that state, so it is only available where you live or work. Other columns use the basic service tier instead.' });
  }

  return { federal, columns, warnings };
}

/** The cheapest column over five years, for ranking. */
export function rankByFiveYear(result: FormationResult): FormationColumn[] {
  return [...result.columns].sort((a, b) => a.fiveYearTotal - b.fiveYearTotal);
}
