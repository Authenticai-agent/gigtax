/**
 * S-corp election: does it pay for itself, and at what profit?
 *
 * The whole question is that a sole proprietor pays self-employment tax on all
 * net profit, while an S-corp owner pays payroll tax only on the salary they
 * take — the rest comes out as a distribution. Against that sits real cost:
 * payroll admin, a separate 1120-S return, and in some states a tax the
 * election creates rather than avoids.
 *
 * Everything computed here comes from the ported engine's optimizeSCorpSalary
 * and compareEntities, which the parity check confirms match legacy's, plus
 * stateMetadata for the state-level wrinkles.
 */
import { compareEntities, optimizeSCorpSalary, calcStateTax, formatMoney } from './tax-engine';
import { states, stateMetadata } from '../data/states';
import scorpTax from '../data/overrides/state-scorp-tax-2026.json';
import type { StateData } from '../data/types';

export interface StateScorpTax {
  recognizesFederalSElection: boolean;
  separateStateElectionRequired: boolean | string;
  /** Rate the state charges the CORPORATION on its net income. */
  entityLevelIncomeTaxRate: number | null;
  /** Owed regardless of profit. */
  minimumAnnualTax: number | null;
  grossReceiptsTax: string | null;
  annualReportFee: number | null;
  notes: string;
  confidence: 'high' | 'medium' | 'low';
  /** Deduction against the entity-level base, where a state grants one. */
  entityTaxDeduction?: number | null;
  /** True when the minimum replaces the income-based charge rather than adding to it. */
  minimumIsAlternative?: boolean;
}

/** The researched entry for a state, or null when we have not confirmed it. */
export function stateScorpTax(code: string): StateScorpTax | null {
  const entry = (scorpTax as Record<string, any>)[code];
  return entry && !code.startsWith('_') ? (entry as StateScorpTax) : null;
}

export interface Disclosure {
  /** What the charge is. */
  label: string;
  /** Why it is not in the number, in terms the reader can act on. */
  why: string;
}

export interface EntityTax {
  /** What we can actually compute from net profit alone. */
  amount: number;
  /** True when the state has not been researched at all. */
  unknown: boolean;
  basis: string;
  /**
   * Charges that are real but not computable from net profit — a gross receipts
   * tax needs turnover, a net worth tax needs a balance sheet. Silently omitting
   * them would make the number look complete when it is not, so they are listed
   * on the page instead.
   */
  disclosures: Disclosure[];
  /** True when the election creates a tax rather than avoiding one. */
  taxedAsCCorp: boolean;
}

/**
 * What the state charges the corporation itself on this profit.
 *
 * Returns unknown rather than zero when the state has not been researched. A
 * missing figure silently treated as zero is how a calculator ends up telling
 * someone an election saves money when it costs them.
 */
export function entityLevelTax(code: string, netProfit: number): EntityTax {
  const t = stateScorpTax(code);
  if (!t) {
    return {
      amount: 0, unknown: true, basis: 'not yet researched for this state',
      disclosures: [], taxedAsCCorp: false,
    };
  }
  const disclosures: Disclosure[] = [];
  const state = states[code]?.name ?? code;
  const raw = t as unknown as Record<string, unknown>;

  // A gross receipts tax needs turnover, which this calculator does not ask for.
  if (t.grossReceiptsTax) {
    disclosures.push({
      label: `${state} gross receipts tax`,
      why: `${t.grossReceiptsTax}. It is charged on turnover rather than profit, so it cannot be worked `
        + `out from net profit alone — and it is owed whether or not the business made money.`,
    });
  }
  // Net worth and capital taxes need a balance sheet.
  if (/net worth|capital employed|paid-in surplus|capital and paid/i.test(t.notes)) {
    disclosures.push({
      label: `${state} net worth or capital tax`,
      why: `${state} charges the company on its net worth or capital rather than its income. That needs a `
        + `balance sheet, so it is not in the figure above.`,
    });
  }
  // Thresholds that switch a charge on above a size this calculator cannot see.
  const above = raw.appliesAboveGrossReceipts ?? raw.rateAppliesAboveReceipts ?? raw.minimumAppliesAboveBase;
  if (typeof above === 'number') {
    disclosures.push({
      label: 'A threshold this calculator cannot check',
      why: `Part of ${state}'s charge only applies above ${formatMoney(above)} of receipts or base, which `
        + `depends on turnover rather than profit. The figure above assumes you are below it.`,
    });
  }
  // Nonresident shareholder obligations are an entity-level cash cost.
  if (/nonresident/i.test(t.notes)) {
    disclosures.push({
      label: 'Withholding for out-of-state shareholders',
      why: `${state} makes the company withhold or pay on behalf of shareholders who live elsewhere. It is `
        + `a real obligation of the company, not of you personally, and it depends on who owns it.`,
    });
  }

  const deduction = t.entityTaxDeduction ?? 0;
  const base = Math.max(0, netProfit - deduction);
  const onIncome = t.entityLevelIncomeTaxRate === null ? 0 : base * t.entityLevelIncomeTaxRate;
  const minimum = t.minimumAnnualTax ?? 0;

  // Whether the minimum replaces the income-based charge or stacks on top of it
  // is an explicit field. It was briefly inferred by looking for "greater of" in
  // the notes, which found the phrase inside Tennessee's description of a
  // DIFFERENT tax and quietly dropped $100 from the answer. Prose is not a
  // specification.
  const greaterOf = t.minimumIsAlternative === true;
  const amount = greaterOf ? Math.max(onIncome, minimum) : onIncome + minimum;

  const parts: string[] = [];
  if (t.entityLevelIncomeTaxRate) {
    parts.push(`${(t.entityLevelIncomeTaxRate * 100).toFixed(2).replace(/\.?0+$/, '')}% of net income`
      + (deduction ? ` above ${formatMoney(deduction)}` : ''));
  }
  if (minimum) parts.push(`${greaterOf ? 'or' : 'plus'} a ${formatMoney(minimum)} minimum`);

  return {
    amount,
    unknown: false,
    basis: parts.join(' ') || 'nothing on net income',
    disclosures,
    taxedAsCCorp: t.recognizesFederalSElection === false,
  };
}

const meta = stateMetadata as {
  passthroughEntityTaxStates: { note: string; statesWithPTET: string[]; howItWorks: string };
};

/**
 * A realistic annual cost of running the payroll an S-corp requires.
 *
 * NOT a tax figure — it is what a payroll service and a 1120-S preparer cost,
 * which varies by provider. It is here rather than in the verified dataset for
 * exactly that reason, and pages say so. It matters because leaving it out
 * makes the election look worthwhile at profits where it is not.
 */
export const PAYROLL_ADMIN_COST = 1500;

/**
 * The salary share used for every headline figure on these pages.
 *
 * optimizeSCorpSalary searches 20%–60% and returns whichever costs least, which
 * is ALWAYS the 20% floor — less salary is always less payroll tax. Presenting
 * that as "the optimal salary" would be advising a split the IRS treats as a
 * red flag: compensation has to be reasonable for the work done, and the
 * penalty for getting it wrong is reclassification plus back payroll tax.
 *
 * So the headline uses 40%, the same split compareEntities uses, and the range
 * is shown as a table with the trade-off stated rather than a single number
 * dressed up as an answer. Legacy did the same thing and was right to.
 */
export const DEFENSIBLE_SALARY_PCT = 40;

export interface ScorpOutcome {
  netProfit: number;
  solePropTax: number;
  /** Federal + personal state tax under the election, before the entity tax. */
  sCorpTaxBeforeEntity: number;
  entityTax: EntityTax;
  sCorpTax: number;
  /** Positive means the election saves money once everything is counted. */
  saving: number;
  /** The saving the federal payroll maths alone would suggest. */
  federalOnlySaving: number;
  salary: number;
  salaryPct: number;
  distribution: number;
}

export function scorpOutcome(netProfit: number, stateCode: string, status = 'single'): ScorpOutcome {
  const cmp = compareEntities(netProfit, 0, status, stateCode);
  const opt = optimizeSCorpSalary(netProfit, 0, status, stateCode, undefined, PAYROLL_ADMIN_COST);
  const atDefensible = opt.results.find((r) => r.pct === DEFENSIBLE_SALARY_PCT) ?? opt.best;
  const entityTax = entityLevelTax(stateCode, netProfit);
  const federalOnlySaving = cmp.soleProp.totalTax - atDefensible.totalTax;
  return {
    netProfit,
    solePropTax: cmp.soleProp.totalTax,
    sCorpTaxBeforeEntity: atDefensible.totalTax,
    entityTax,
    sCorpTax: atDefensible.totalTax + entityTax.amount,
    saving: federalOnlySaving - entityTax.amount,
    federalOnlySaving,
    salary: atDefensible.salary,
    salaryPct: atDefensible.pct,
    distribution: atDefensible.distribution,
  };
}

export interface SplitRow {
  pct: number;
  salary: number;
  distribution: number;
  totalTax: number;
  /** Saving against sole proprietorship at this split. */
  saving: number;
}

/**
 * Every salary split from 20% to 60%, with what each costs. Shown as a range
 * because the choice is a judgment about defensible compensation, not an
 * optimization — the cheapest row is always the riskiest one.
 */
export function salarySplits(netProfit: number, stateCode: string, status = 'single'): SplitRow[] {
  const soleProp = compareEntities(netProfit, 0, status, stateCode).soleProp.totalTax;
  const opt = optimizeSCorpSalary(netProfit, 0, status, stateCode, undefined, PAYROLL_ADMIN_COST);
  return opt.results
    .filter((r) => r.pct % 10 === 0)
    .map((r) => ({
      pct: r.pct,
      salary: r.salary,
      distribution: r.distribution,
      totalTax: r.totalTax,
      saving: soleProp - r.totalTax,
    }));
}

/**
 * The profit at which the election starts paying for itself in this state.
 *
 * Now counts the state entity-level tax, so it is meaningful where that state
 * has been researched. Returns null when the state is unresearched OR when the
 * election never pays inside the searched range — callers must distinguish the
 * two via entityLevelTax().unknown, because "we do not know" and "never worth
 * it" are very different answers.
 *
 * Previously INCOMPLETE — do not put this on a page yet. It counts federal payroll tax
 * against a payroll admin cost, and nothing else. Several states levy a tax the
 * S-corp election itself creates: California charges 1.5% of net income with an
 * $800 minimum, and others have fixed-dollar minimums or franchise fees. None of
 * that is in the verified dataset, which carries entity-level detail only for
 * Delaware and Wyoming.
 *
 * The omission is not cosmetic. On $100,000 of California profit the model says
 * the election saves $4,985; California's own entity-level tax would take
 * $1,500 of that back before anything else, and the break-even moves with it.
 * Ground rule 2 says a missing figure means stop and ask, so this stays unused
 * until the per-state figures are researched the way the brackets were.
 */
export interface WorthwhileBand {
  /** Lowest profit at which the election pays, or null if it never does. */
  from: number | null;
  /** Profit above which it stops paying, or null if it keeps paying. */
  until: number | null;
  /** True when the state has not been researched, so the band is federal-only. */
  unknownState: boolean;
}

/**
 * The band of profit over which the election actually pays for itself.
 *
 * A single break-even point is the wrong shape for this question. It assumes the
 * saving only ever grows with profit, and in states that tax the corporation on
 * its income that is false: the federal payroll saving plateaus at the Social
 * Security wage base while the state's charge keeps scaling, so the election can
 * be worth it at $100,000 and cost money at $250,000. Tennessee does exactly
 * that. A break-even search returned null there, which reads as "never worth it"
 * and is wrong in the opposite direction.
 */
export function worthwhileBand(stateCode: string, status = 'single'): WorthwhileBand {
  const STEP = 5000;
  const MAX = 500000;
  const pays = (p: number) => scorpOutcome(p, stateCode, status).saving > 0;

  let from: number | null = null;
  let until: number | null = null;
  for (let p = 20000; p <= MAX; p += STEP) {
    if (pays(p)) {
      if (from === null) from = p;
      until = null;
    } else if (from !== null && until === null) {
      until = p;
      break;
    }
  }
  return { from, until, unknownState: entityLevelTax(stateCode, 100000).unknown };
}

/** Profit levels for the comparison table. */
export function scorpLadder(stateCode: string, status = 'single'): ScorpOutcome[] {
  return [60000, 100000, 150000, 250000].map((p) => scorpOutcome(p, stateCode, status));
}

export interface StateScorpFacts {
  hasPTET: boolean;
  ptetNote: string;
  ptetHow: string;
  noIncomeTax: boolean;
}

export function stateScorpFacts(code: string, state: StateData): StateScorpFacts {
  return {
    hasPTET: meta.passthroughEntityTaxStates.statesWithPTET.includes(code),
    ptetNote: meta.passthroughEntityTaxStates.note,
    ptetHow: meta.passthroughEntityTaxStates.howItWorks,
    noIncomeTax: state.noIncomeTax === true || state.type === 'none',
  };
}

/**
 * What the election means in this particular state, beyond the federal saving.
 * Only facts true of this state are emitted.
 */
export function describeStateScorp(code: string, state: StateData, ex: ScorpOutcome): string[] {
  const f = stateScorpFacts(code, state);
  const out: string[] = [];

  if (f.noIncomeTax) {
    out.push(
      `${state.name} levies no personal income tax, so the entire question here is federal. The ` +
        `election saves payroll tax on the distribution and nothing else — there is no state layer ` +
        `for it to move, and no state return for the S-corp's owners to reconcile.`,
    );
  } else {
    const stateOnProfit = calcStateTax(ex.netProfit, code, undefined, 'single').tax;
    out.push(
      `${state.name} taxes the profit either way. Whether you take it as self-employment income or as ` +
        `salary plus distribution, roughly ${formatMoney(stateOnProfit)} of ${state.name} income tax ` +
        `sits on ${formatMoney(ex.netProfit)} of profit — the election moves the payroll-tax half of ` +
        `the bill, not the state half.`,
    );
  }

  if (f.hasPTET) {
    out.push(
      `${state.name} is one of 31 states with a pass-through entity tax. ${f.ptetHow} That is a genuine ` +
        `reason to elect beyond the payroll-tax saving, and it is not in the figures on this page — ` +
        `the calculation below is federal payroll tax against ${state.name} income tax as an individual.`,
    );
  }

  return out;
}

/** Sentence naming where the break-even lands, in plain terms. */
export function describeBreakEven(state: StateData, breakEven: number | null): string {
  if (breakEven === null) {
    return (
      `In ${state.name} the election does not pay for itself at any profit up to $400,000 once the ` +
        `payroll cost is counted. The payroll-tax saving never grows enough to clear it.`
    );
  }
  return (
    `In ${state.name} the election starts paying for itself at roughly ${formatMoney(breakEven)} of ` +
      `net profit, after ${formatMoney(PAYROLL_ADMIN_COST)} a year of payroll and filing cost. Below ` +
      `that, electing costs more than it saves.`
  );
}
