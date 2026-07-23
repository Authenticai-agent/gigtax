/**
 * Form 2210 — the underpayment penalty for not paying enough tax during the year.
 *
 * The safe-harbor test comes straight from the dataset (pay the lesser of 90% of
 * this year's tax or 100%/110% of last year's), and the quarterly mechanics
 * mirror the legacy engine: each quarter needs a cumulative 25% of the required
 * annual amount, withholding is treated as paid evenly across the four periods,
 * and the penalty runs on whatever is still short.
 *
 * The one figure that is not in the dataset is the IRS underpayment rate. It is
 * the federal short-term rate plus three points and the IRS republishes it every
 * quarter, so it is an input here, not a baked-in constant — the caller supplies
 * the published rate for the period rather than this file inventing one.
 */
import { calcQuarterly } from './tax-engine';

export interface PenaltyInput {
  currentYearTax: number;
  priorYearTax: number;
  priorYearAGI: number;
  withholding: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  /** IRS underpayment rate for the period, as a decimal (e.g. 0.08). Published quarterly. */
  irsRate: number;
}

export interface QuarterResult {
  quarter: number;
  required: number;
  paid: number;
  underpayment: number;
  penalty: number;
}

export interface PenaltyResult {
  requiredCurrent: number;
  requiredPrior: number;
  priorPct: number;
  safeHarbor: number;
  perQuarter: number;
  quarters: QuarterResult[];
  totalPaid: number;
  totalUnderpayment: number;
  totalPenalty: number;
  /** True when payments met the safe harbor and no penalty is due. */
  safe: boolean;
}

/**
 * The whole calculation. Uses the same safe-harbor helper the quarterly-tax
 * calculator uses, so the two pages can never disagree on what "enough" is.
 */
export function estimatedTaxPenalty(input: PenaltyInput): PenaltyResult {
  const { currentYearTax, priorYearTax, priorYearAGI, withholding, q1, q2, q3, q4, irsRate } = input;

  const requiredCurrent = currentYearTax * 0.9;
  const priorPct = priorYearAGI > 150000 ? 110 : 100;
  const requiredPrior = priorYearTax * (priorPct / 100);
  // calcQuarterly already encodes "lesser of 90% current or 100%/110% prior".
  const { target: safeHarbor, perQuarter } = calcQuarterly(currentYearTax, priorYearTax, priorYearAGI);

  // Withholding is deemed paid in four equal instalments regardless of when it
  // was actually withheld — the taxpayer-favorable default the IRS allows.
  const wPerQ = withholding / 4;
  const cumulativePaid = [
    q1 + wPerQ,
    q1 + q2 + wPerQ * 2,
    q1 + q2 + q3 + wPerQ * 3,
    q1 + q2 + q3 + q4 + wPerQ * 4,
  ];

  const quarters: QuarterResult[] = cumulativePaid.map((paid, i) => {
    const required = perQuarter * (i + 1);
    const underpayment = Math.max(0, required - paid);
    // Simplified: each quarter's shortfall accrues for a quarter of a year.
    const penalty = underpayment * irsRate * 0.25;
    return { quarter: i + 1, required, paid, underpayment, penalty };
  });

  const totalPaid = q1 + q2 + q3 + q4 + withholding;
  const totalPenalty = quarters.reduce((s, q) => s + q.penalty, 0);
  const totalUnderpayment = Math.max(0, safeHarbor - totalPaid);

  return {
    requiredCurrent,
    requiredPrior,
    priorPct,
    safeHarbor,
    perQuarter,
    quarters,
    totalPaid,
    totalUnderpayment,
    totalPenalty,
    safe: totalPenalty === 0,
  };
}
