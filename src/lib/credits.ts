/**
 * Refundable and non-refundable credits: earned income credit, child tax credit,
 * child & dependent care credit, and the saver's credit.
 *
 * Every figure is read from src/data/federal.ts — bracket amounts, phase-out
 * starts and rates, the care-credit step, all sourced there. Two honest limits,
 * both surfaced in the UI rather than papered over:
 *
 * EITC and the saver's credit are both exact for every filing status: the 2026
 * married-filing-jointly EIC phase-out figures and the saver's-credit 50/20/10
 * tier thresholds were researched from Rev. Proc. 2025-32 and Notice 2025-67 and
 * added to the dataset with their citations.
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
  /** True when investment income disqualifies the filer. */
  investmentDisqualified: boolean;
}

/**
 * Earned income tax credit, exact for every filing status. Married filing jointly
 * uses its own 2026 phase-out start and income limit per bracket; all other
 * statuses use the single/HOH figures.
 */
export function eitc(
  earnedIncome: number, investmentIncome: number, children: number, status = 'single',
): EICResult {
  const kids = Math.min(Math.max(0, children), 3);
  const bracket = EIC.brackets.find((b: any) => b.children === kids);
  const phaseoutStart = status === 'mfj' ? bracket.mfjPhaseoutStart : bracket.phaseoutStart;
  const incomeLimit = status === 'mfj' ? bracket.mfjIncomeLimit : bracket.incomeLimit;
  const base = {
    maxCredit: bracket.maxCredit, phaseoutStart, incomeLimit,
    investmentDisqualified: false,
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
  /** The 50/20/10 rate this filer's AGI lands in (0 if over the limit). */
  rate: number;
  /** Contribution that counts, after the cap. */
  eligibleContribution: number;
  /** The actual credit — rate × eligible contribution. */
  credit: number;
}

/**
 * Saver's credit, exact. The rate is 50%, 20% or 10% of up to $2,000 ($4,000 MFJ)
 * of retirement contributions, by AGI tier (§25B), zero above the top limit. The
 * 2026 tier thresholds come from the dataset (researched from Notice 2025-67).
 */
export function saversCredit(agi: number, status: string, contribution: number): SaversResult {
  const tier50 = status === 'mfj' ? SAVERS.tier50MaxMFJ : status === 'hoh' ? SAVERS.tier50MaxHOH : SAVERS.tier50MaxSingle;
  const tier20 = status === 'mfj' ? SAVERS.tier20MaxMFJ : status === 'hoh' ? SAVERS.tier20MaxHOH : SAVERS.tier20MaxSingle;
  const incomeLimit = status === 'mfj' ? SAVERS.mfj_max : status === 'hoh' ? SAVERS.hoh_max : SAVERS.single_max;
  const contributionCap = status === 'mfj' ? 4000 : 2000;
  const a = Math.max(0, agi);
  const rate = a <= tier50 ? 0.5 : a <= tier20 ? 0.2 : a <= incomeLimit ? 0.1 : 0;
  const eligibleContribution = Math.min(Math.max(0, contribution), contributionCap);
  return {
    eligible: rate > 0,
    incomeLimit,
    contributionCap,
    rate,
    eligibleContribution,
    credit: Math.round(eligibleContribution * rate),
  };
}
