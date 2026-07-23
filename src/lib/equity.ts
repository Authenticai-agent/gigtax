/**
 * Equity compensation: RSUs, ISOs, NSOs, ESPP and QSBS.
 *
 * Every instrument creates two taxable events — ordinary income when the shares
 * arrive or the option is exercised, and capital gain when they are sold — and
 * the expensive mistakes all come from treating that as one event. The figures
 * here come from equityCompensation in the verified dataset and the ported
 * engine; nothing about rates or thresholds is authored in this file.
 */
import { equityCompensation } from '../data/federal';
import { calcFederalTax, calcStateTax, calcSETax, getStandardDeduction, formatMoney } from './tax-engine';
import type { StateData } from '../data/types';

/** Employee FICA rate (SS 6.2% + Medicare 1.45%) — one side of the payroll tax. */
const EMPLOYEE_FICA_RATE = 0.0765;

const eq = equityCompensation as Record<string, any>;

export interface EquityInstrument {
  slug: string;
  key: string;
  label: string;
  /** The one thing people get wrong about this instrument. */
  trap: string;
  lead: string;
}

export const INSTRUMENTS: EquityInstrument[] = [
  {
    slug: 'rsu-tax-calculator',
    key: 'rsu',
    label: 'RSU',
    trap: 'under-withholding at vest',
    lead: 'RSUs are taxed as wages the moment they vest, whether or not you sell. The trap is the withholding rate: your employer takes a flat percentage that is usually too little.',
  },
  {
    slug: 'iso-tax-calculator',
    key: 'iso',
    label: 'ISO',
    trap: 'AMT on an exercise you never sold',
    lead: 'Incentive stock options cost nothing in regular tax when you exercise. They can still generate a tax bill through the alternative minimum tax, on a paper gain you have not realized and may never realize.',
  },
  {
    slug: 'nso-tax-calculator',
    key: 'nso',
    label: 'NSO',
    trap: 'tax due on exercise with no cash to pay it',
    lead: 'Non-qualified options are taxed as ordinary income on the spread the day you exercise, whether or not you sell a single share. Exercise and hold, and you owe cash tax on a gain that exists only on paper.',
  },
  {
    slug: 'espp-tax-calculator',
    key: 'espp',
    label: 'ESPP',
    trap: 'selling one day too early',
    lead: 'An employee stock purchase plan gives you a discount, and how long you hold decides whether that discount is taxed as ordinary income or as capital gain. Two holding periods have to be cleared, not one.',
  },
  {
    slug: 'qsbs-tax-calculator',
    key: 'qsbs',
    label: 'QSBS',
    trap: 'assuming five years when the rules just changed',
    lead: 'Qualified small business stock can exclude millions of gain from federal tax entirely. The 2025 rules changed both the cap and the holding period, and which set applies depends on when the stock was issued.',
  },
  {
    slug: 'phantom-stock-tax-calculator',
    key: 'phantom',
    label: 'Phantom stock & SARs',
    trap: 'expecting capital-gains treatment on a cash bonus',
    lead: 'Phantom stock and stock appreciation rights pay cash tied to share value, but you never own a share. That means no capital-gains rate ever — the whole payout is ordinary income at settlement, plus payroll tax, exactly like a bonus.',
  },
];

export function instrumentFor(slug: string): EquityInstrument | null {
  return INSTRUMENTS.find((i) => i.slug === slug) ?? null;
}

/** Raw dataset entry for an instrument, for pages that quote specifics. */
export function equityData(key: string): Record<string, any> {
  return eq[key] ?? {};
}

/* ---------------------------------------------------------------- RSU ---- */

export interface RsuOutcome {
  vestValue: number;
  salary: number;
  totalIncome: number;
  /** What the employer actually withheld at the flat supplemental rate. */
  withheld: number;
  /** What the vest really costs at this person's marginal rate. */
  actualFederal: number;
  /** Positive means you owe more in April than was taken. */
  shortfall: number;
  stateTax: number;
  supplementalRate: number;
}

/**
 * The withholding gap.
 *
 * An employer withholds federal tax on a vest at a flat supplemental rate —
 * 22% below $1m, 37% above. That is not your marginal rate. Anyone in the 32%
 * bracket or higher is under-withheld on every vest, and finds out in April.
 * This computes the size of that gap, which is the whole point of the page.
 */
export function rsuOutcome(vestValue: number, salary: number, stateCode: string, status = 'single'): RsuOutcome {
  const rsu = eq.rsu.taxEvent1_vesting;
  const supplementalRate = vestValue > 1_000_000
    ? rsu.withholdingRate_supplemental_over1M
    : rsu.withholdingRate_supplemental_under1M;
  const withheld = vestValue * supplementalRate;

  const stdDed = getStandardDeduction(status, false);
  const withoutVest = Math.max(0, salary - stdDed);
  const withVest = Math.max(0, salary + vestValue - stdDed);
  // The vest's real federal cost is the difference it makes on top of salary —
  // it stacks into the top brackets, it does not start at the bottom.
  const actualFederal = calcFederalTax(withVest, status) - calcFederalTax(withoutVest, status);

  const stateTax = calcStateTax(salary + vestValue, stateCode, undefined, status).tax
    - calcStateTax(salary, stateCode, undefined, status).tax;

  return {
    vestValue,
    salary,
    totalIncome: salary + vestValue,
    withheld,
    actualFederal,
    shortfall: actualFederal - withheld,
    stateTax,
    supplementalRate,
  };
}

/** The same vest at three salary levels — the gap widens as salary rises. */
export function rsuLadder(vestValue: number, stateCode: string, status = 'single'): RsuOutcome[] {
  return [90000, 160000, 260000].map((s) => rsuOutcome(vestValue, s, stateCode, status));
}

/**
 * What a state does to a vest, and the sourcing question that catches movers.
 * The dataset names three states that source aggressively.
 */
export function describeRsuState(code: string, state: StateData, ex: RsuOutcome): string[] {
  const out: string[] = [];
  const aggressive = (eq.multiStateAllocation?.aggressiveSourceingStates ?? []) as string[];
  const noTax = state.noIncomeTax === true || state.type === 'none';

  if (noTax) {
    out.push(
      `${state.name} has no personal income tax, so a vest is a federal-only event here — ` +
        `${formatMoney(ex.actualFederal)} of federal tax on ${formatMoney(ex.vestValue)} of vesting ` +
        `stock, and nothing to the state.`,
    );
  } else {
    out.push(
      `${state.name} taxes a vest as ordinary income like any other wages, adding ` +
        `${formatMoney(ex.stateTax)} on top of the federal bill for ${formatMoney(ex.vestValue)} of ` +
        `vesting stock.`,
    );
  }

  if (aggressive.includes(code)) {
    out.push(
      `${state.name} is one of the states that sources equity income aggressively. If any part of the ` +
        `vesting period was worked here, ${state.name} will claim its share of the vest even if you had ` +
        `moved away by the time the shares actually landed. ${eq.multiStateAllocation.rsuMethod}`,
    );
  } else if (!noTax) {
    out.push(
      `If you moved during the vesting period, the income is split between the states you worked in ` +
        `across it: ${eq.multiStateAllocation.rsuMethod} That is worked out day by day, not by where ` +
        `you lived on the vesting date.`,
    );
  }

  return out;
}

/* ------------------------------------------------------ Phantom / SAR ---- */

export interface PhantomOutcome {
  payout: number;
  recipient: 'employee' | 'contractor';
  /** Extra federal income tax the payout adds on top of other income. */
  incrementalFederal: number;
  /** FICA (employee) — 0 for a contractor. */
  fica: number;
  /** Self-employment tax (contractor) — 0 for an employee. */
  seTax: number;
  totalExtraTax: number;
  /** What is left of the payout after its own tax. */
  net: number;
}

/**
 * Phantom stock and SARs settle in cash and are taxed as ordinary income, never
 * at a capital-gains rate. An employee also pays FICA on it; a contractor gets a
 * 1099-NEC and pays self-employment tax. The federal income-tax cost is marginal
 * — the payout stacks on top of other income, it does not start at the bottom.
 */
export function phantomOutcome(
  payout: number, otherIncome: number, recipient: 'employee' | 'contractor' = 'employee', status = 'single',
): PhantomOutcome {
  const stdDed = getStandardDeduction(status, false);
  const withoutPayout = Math.max(0, otherIncome - stdDed);
  const withPayout = Math.max(0, otherIncome + payout - stdDed);
  const incrementalFederal = calcFederalTax(withPayout, status) - calcFederalTax(withoutPayout, status);

  const fica = recipient === 'employee' ? payout * EMPLOYEE_FICA_RATE : 0;
  const seTax = recipient === 'contractor' ? calcSETax(payout).totalSE : 0;

  const totalExtraTax = incrementalFederal + fica + seTax;
  return {
    payout,
    recipient,
    incrementalFederal,
    fica,
    seTax,
    totalExtraTax,
    net: payout - totalExtraTax,
  };
}
