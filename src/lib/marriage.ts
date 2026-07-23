/**
 * Marriage penalty / bonus — total tax as two single filers against the same
 * couple filing jointly.
 *
 * Ported from marriagePenaltyView. The penalty or bonus comes almost entirely
 * from bracket structure: the MFJ brackets are wider than the single brackets
 * but not twice as wide, so two similar incomes filing jointly spill into higher
 * rates (a penalty), while one large and one small income spreads across the
 * wider joint brackets (a bonus). FICA is identical either way — each person
 * keeps their own Social Security wage base — so it cancels out of the
 * difference, though it still sits in each scenario's absolute total.
 *
 * The 2026 standard deduction is exactly double for MFJ ($16,100 single,
 * $32,200 joint), so the deduction itself creates no penalty or bonus; the whole
 * effect is the brackets. The child tax credit is applied against federal tax in
 * both scenarios, capped at the federal tax available.
 */
import {
  calcFederalTax, calcStateTax, calcFICA, calcChildTaxCredit,
  getStandardDeduction, marginalRate,
} from './tax-engine';

export interface MarriageInput {
  incomeA: number;
  incomeB: number;
  age65A?: boolean;
  age65B?: boolean;
  retirement401kA?: number;
  retirement401kB?: number;
  stateCode: string;
  dependents?: number;
  itemize?: boolean;
  itemizedAmount?: number;
}

export interface FilerBreakdown {
  income: number;
  deduction: number;
  taxable: number;
  federalTax: number;
  stateTax: number;
  fica: number;
  marginalRate: number;
}

export interface MarriageResult {
  combinedIncome: number;
  single: {
    a: FilerBreakdown;
    b: FilerBreakdown;
    totalTax: number;
    takeHome: number;
    effectiveRate: number;
  };
  mfj: {
    deduction: number;
    taxable: number;
    federalTax: number;
    stateTax: number;
    fica: number;
    marginalRate: number;
    totalTax: number;
    takeHome: number;
    effectiveRate: number;
  };
  /** MFJ tax minus single tax. Positive = penalty, negative = bonus. */
  difference: number;
  outcome: 'penalty' | 'bonus' | 'neutral';
  /** Absolute size of the penalty or bonus. */
  amount: number;
}

/** Two single returns vs one joint return, on federal + state income tax. */
export function marriageTax(input: MarriageInput): MarriageResult {
  const aIncome = Math.max(0, input.incomeA);
  const bIncome = Math.max(0, input.incomeB);
  const aAge65 = input.age65A ?? false;
  const bAge65 = input.age65B ?? false;
  const a401k = Math.max(0, input.retirement401kA ?? 0);
  const b401k = Math.max(0, input.retirement401kB ?? 0);
  const state = input.stateCode;
  const dependents = Math.max(0, input.dependents ?? 0);
  const itemize = input.itemize ?? false;
  const itemizedAmount = Math.max(0, input.itemizedAmount ?? 0);

  const totalIncome = aIncome + bIncome;

  // FICA — identical in both scenarios; the employee half is what each pays.
  const aFica = calcFICA(aIncome).employeeFICA;
  const bFica = calcFICA(bIncome).employeeFICA;

  // ---- Two single filers ----
  const aStd = getStandardDeduction('single', aAge65);
  const bStd = getStandardDeduction('single', bAge65);
  // When itemizing, the legacy view splits the household itemized total in half
  // between the two single returns, taking whichever beats each one's standard.
  const aDeduction = itemize ? Math.max(aStd, itemizedAmount / 2) : aStd;
  const bDeduction = itemize ? Math.max(bStd, itemizedAmount / 2) : bStd;

  const aTaxable = Math.max(0, aIncome - a401k - aDeduction);
  const bTaxable = Math.max(0, bIncome - b401k - bDeduction);
  const aFed = calcFederalTax(aTaxable, 'single');
  const bFed = calcFederalTax(bTaxable, 'single');
  const aState = calcStateTax(aIncome - a401k, state, undefined, 'single').tax || 0;
  const bState = calcStateTax(bIncome - b401k, state, undefined, 'single').tax || 0;

  // Child tax credit. The legacy view used a flat per-child amount; this uses the
  // engine's credit so the income phase-out applies — and that phase-out is a
  // real marriage effect, since it begins at $200k for a single filer but $400k
  // for a couple, so marriage can hand back a credit a high single earner had
  // lost. In the single scenario the children are assigned to the higher earner
  // (a child is claimed on one return), capped at the couple's combined federal.
  const higherAGI = Math.max(aIncome - a401k, bIncome - b401k);
  const singleCTC = Math.min(calcChildTaxCredit(dependents, higherAGI, 'single'), aFed + bFed);
  const singleTotalTax = aFed + bFed + aState + bState + aFica + bFica - singleCTC;
  const singleTakeHome = totalIncome - a401k - b401k - singleTotalTax;

  // ---- Married filing jointly ----
  const mfjStd = getStandardDeduction('mfj', aAge65 || bAge65);
  const mfjDeduction = itemize ? Math.max(mfjStd, itemizedAmount) : mfjStd;
  const mfjTaxable = Math.max(0, totalIncome - a401k - b401k - mfjDeduction);
  const mfjFed = calcFederalTax(mfjTaxable, 'mfj');
  const mfjState = calcStateTax(totalIncome - a401k - b401k, state, undefined, 'mfj').tax || 0;
  const mfjCTC = Math.min(calcChildTaxCredit(dependents, totalIncome - a401k - b401k, 'mfj'), mfjFed);
  const mfjTotalTax = mfjFed + mfjState + aFica + bFica - mfjCTC;
  const mfjTakeHome = totalIncome - a401k - b401k - mfjTotalTax;

  const difference = mfjTotalTax - singleTotalTax;
  const outcome: MarriageResult['outcome'] =
    Math.abs(difference) < 1 ? 'neutral' : difference > 0 ? 'penalty' : 'bonus';

  return {
    combinedIncome: totalIncome,
    single: {
      a: {
        income: aIncome, deduction: aDeduction, taxable: aTaxable,
        federalTax: aFed, stateTax: aState, fica: aFica,
        marginalRate: marginalRate(aTaxable, 'single'),
      },
      b: {
        income: bIncome, deduction: bDeduction, taxable: bTaxable,
        federalTax: bFed, stateTax: bState, fica: bFica,
        marginalRate: marginalRate(bTaxable, 'single'),
      },
      totalTax: singleTotalTax,
      takeHome: singleTakeHome,
      effectiveRate: totalIncome > 0 ? singleTotalTax / totalIncome : 0,
    },
    mfj: {
      deduction: mfjDeduction, taxable: mfjTaxable, federalTax: mfjFed,
      stateTax: mfjState, fica: aFica + bFica,
      marginalRate: marginalRate(mfjTaxable, 'mfj'),
      totalTax: mfjTotalTax, takeHome: mfjTakeHome,
      effectiveRate: totalIncome > 0 ? mfjTotalTax / totalIncome : 0,
    },
    difference,
    outcome,
    amount: Math.abs(difference),
  };
}
