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
import type { StateData } from '../data/types';

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
  sCorpTax: number;
  /** Positive means the election saves money after admin cost. */
  saving: number;
  /** The salary split the optimiser landed on. */
  salary: number;
  salaryPct: number;
  distribution: number;
}

export function scorpOutcome(netProfit: number, stateCode: string, status = 'single'): ScorpOutcome {
  const cmp = compareEntities(netProfit, 0, status, stateCode);
  const opt = optimizeSCorpSalary(netProfit, 0, status, stateCode, undefined, PAYROLL_ADMIN_COST);
  const atDefensible = opt.results.find((r) => r.pct === DEFENSIBLE_SALARY_PCT) ?? opt.best;
  return {
    netProfit,
    solePropTax: cmp.soleProp.totalTax,
    sCorpTax: atDefensible.totalTax,
    saving: cmp.soleProp.totalTax - atDefensible.totalTax,
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
 * because the choice is a judgement about defensible compensation, not an
 * optimisation — the cheapest row is always the riskiest one.
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
 * INCOMPLETE — do not put this on a page yet. It counts federal payroll tax
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
export function breakEvenProfit(stateCode: string, status = 'single'): number | null {
  let low = 20000;
  let high = 400000;
  if (scorpOutcome(high, stateCode, status).saving <= 0) return null;
  if (scorpOutcome(low, stateCode, status).saving > 0) return low;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (scorpOutcome(mid, stateCode, status).saving > 0) high = mid;
    else low = mid;
  }
  return Math.round(high / 1000) * 1000;
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
