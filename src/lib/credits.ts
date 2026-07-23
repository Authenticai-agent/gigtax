/**
 * Refundable and non-refundable credits: earned income credit, child tax credit,
 * child & dependent care credit, and the saver's credit.
 *
 * Every figure is read from src/data/federal.ts — bracket amounts, phase-out
 * starts and rates, the care-credit step, all sourced there. Two honest limits,
 * both surfaced in the UI rather than papered over:
 *
 *  - EITC married-filing-jointly: the dataset's brackets are the single/HOH
 *    figures, and its note gives the MFJ phase-out as "approximately $7,270
 *    higher". So single/HOH are exact and MFJ is returned with approximate:true.
 *  - Saver's credit: the 50/20/10 tier AGI thresholds are annually adjusted and
 *    are not in the dataset, so this returns eligibility and the MAXIMUM possible
 *    credit (the 50% tier), never a fabricated exact tier.
 */
import { federal, retirement } from '../data/federal';

const EIC = (federal as any).earnedIncomeCredit;
const CTC = (federal as any).childTaxCredit;
const DCARE = (federal as any).childDependentCareCredit;
const SAVERS = (retirement as any).saversCredit;

/* ------------------------------- earned income ----------------------------- */

export interface EICResult {
  credit: number;
  maxCredit: number;
  phaseoutStart: number;
  incomeLimit: number;
  /** True for MFJ, where the dataset's phase-out shift is an approximation. */
  approximate: boolean;
  /** True when investment income disqualifies the filer. */
  investmentDisqualified: boolean;
}

/**
 * Earned income tax credit. Exact for single and head of household; for married
 * filing jointly the phase-out start and income limit are each raised by the
 * dataset's stated shift and the result is marked approximate.
 */
export function eitc(
  earnedIncome: number, investmentIncome: number, children: number, status = 'single',
): EICResult {
  const kids = Math.min(Math.max(0, children), 3);
  const bracket = EIC.brackets.find((b: any) => b.children === kids);
  const shift = status === 'mfj' ? EIC.mfjPhaseoutShift : 0;
  const phaseoutStart = bracket.phaseoutStart + shift;
  const incomeLimit = bracket.incomeLimit + shift;
  const base = {
    maxCredit: bracket.maxCredit, phaseoutStart, incomeLimit,
    approximate: status === 'mfj', investmentDisqualified: false,
  };
  if (investmentIncome > EIC.investmentIncomeLimit) return { ...base, credit: 0, investmentDisqualified: true };
  const earned = Math.max(0, earnedIncome);
  if (earned > incomeLimit) return { ...base, credit: 0 };
  // Phase in at the statutory credit rate until the plateau, then phase out
  // linearly from the phase-out start to the income limit.
  if (earned <= phaseoutStart) {
    return { ...base, credit: Math.min(Math.round(bracket.phaseInRate * earned), bracket.maxCredit) };
  }
  const pct = (earned - phaseoutStart) / (incomeLimit - phaseoutStart);
  return { ...base, credit: Math.max(0, Math.round(bracket.maxCredit * (1 - pct))) };
}

/* ------------------------------- child tax credit -------------------------- */

export interface CTCResult {
  credit: number;
  perChild: number;
  /** Refundable portion (ACTC) — the part you can get back even with no tax. */
  refundablePortion: number;
  phaseoutStart: number;
  fullyPhasedOut: boolean;
}

/** Child tax credit with the $200k/$400k phase-out and the refundable cap. */
export function childTaxCredit(children: number, agi: number, status = 'single'): CTCResult {
  const kids = Math.max(0, children);
  const phaseoutStart = status === 'mfj' ? CTC.phaseoutStartMFJ : CTC.phaseoutStartSingle;
  let credit = kids * CTC.amountPerChild;
  if (agi > phaseoutStart) {
    const steps = Math.ceil((agi - phaseoutStart) / 1000);
    credit = Math.max(0, credit - steps * (CTC.phaseoutRate * 1000));
  }
  return {
    credit,
    perChild: CTC.amountPerChild,
    refundablePortion: Math.min(credit, kids * CTC.refundableAmount),
    phaseoutStart,
    fullyPhasedOut: kids > 0 && credit === 0,
  };
}

/* --------------------------- child & dependent care ------------------------ */

export interface DependentCareResult {
  rate: number;
  cappedExpenses: number;
  maxExpense: number;
  credit: number;
}

/**
 * Child & dependent care credit. The rate starts at 35% and drops one point per
 * $2,000 of AGI over $15,000, to a 20% floor. Expenses are capped at $3,000 for
 * one qualifying person, $6,000 for two or more. Non-refundable.
 */
export function dependentCareCredit(
  qualifyingExpenses: number, qualifyingPersons: number, agi: number,
): DependentCareResult {
  const persons = Math.max(0, qualifyingPersons);
  if (persons === 0) return { rate: 0, cappedExpenses: 0, maxExpense: 0, credit: 0 };
  const maxExpense = persons >= 2 ? DCARE.maxExpenseTwoPlus : DCARE.maxExpenseOneChild;
  const cappedExpenses = Math.min(Math.max(0, qualifyingExpenses), maxExpense);
  let rate = DCARE.creditRateMax;
  if (agi > DCARE.phaseoutStartIncome) {
    const steps = Math.ceil((agi - DCARE.phaseoutStartIncome) / DCARE.phaseoutStep);
    rate = Math.max(DCARE.creditRateMin, DCARE.creditRateMax - steps * DCARE.phaseoutRatePerStep);
  }
  return { rate, cappedExpenses, maxExpense, credit: Math.round(cappedExpenses * rate) };
}

/* ------------------------------- saver's credit ---------------------------- */

export interface SaversResult {
  eligible: boolean;
  incomeLimit: number;
  contributionCap: number;
  /** The most this filer could get — the 50% tier. The actual tier needs the
   *  2026 AGI thresholds, which are not in the dataset. */
  maxPossibleCredit: number;
}

/**
 * Saver's credit — eligibility and the MAXIMUM possible credit only. The credit
 * is 50%, 20% or 10% of up to $2,000 ($4,000 MFJ) of retirement contributions
 * depending on AGI tier; the exact 2026 tier thresholds are not in the dataset,
 * so this returns the 50%-tier ceiling and the copy states the actual amount
 * depends on the tier your AGI falls in.
 */
export function saversCredit(agi: number, status: string, contribution: number): SaversResult {
  const incomeLimit = status === 'mfj' ? SAVERS.mfj_max : status === 'hoh' ? SAVERS.hoh_max : SAVERS.single_max;
  const contributionCap = status === 'mfj' ? 4000 : 2000;
  const maxCredit = status === 'mfj' ? SAVERS.maxCreditMFJ : SAVERS.maxCredit;
  const eligible = Math.max(0, agi) <= incomeLimit;
  const eligibleContribution = Math.min(Math.max(0, contribution), contributionCap);
  const maxPossibleCredit = eligible ? Math.min(eligibleContribution * 0.5, maxCredit) : 0;
  return { eligible, incomeLimit, contributionCap, maxPossibleCredit };
}
