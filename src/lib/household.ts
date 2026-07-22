/**
 * Household tax engine: every income type in one calculation.
 *
 * The site's calculators each answer one question — 1099 income, a paycheck,
 * quarterly payments. Real households are not shaped like that. One spouse has
 * 1099 income and a part-time W-2, the other is on SSDI and a long-term
 * disability policy; someone is drawing Social Security alongside a 401(k).
 * Those interact, and the interactions are where the surprises live:
 *
 *  - SSDI is taxed on a formula that counts HALF the benefit plus everything
 *    else. Adding a spouse's 1099 income can make previously untaxed SSDI
 *    taxable without the disabled person earning a cent more.
 *  - Disability benefits are taxable or not depending entirely on who paid the
 *    premium, which is a fact no income figure reveals.
 *  - Social Security uses the same combined-income formula as SSDI, and twelve
 *    states tax it while the rest do not.
 *
 * This composes the ported engine rather than re-implementing it. Every rate,
 * bracket and threshold still comes from the verified dataset.
 */
import {
  calcFederalTax, calcStateTax, calcSETax, calcFICA, calcQBI,
  getStandardDeduction, calcSeniorDeductionOBBBA, calcSSDITaxable,
} from './tax-engine';
import { states, stateMetadata } from '../data/states';

export type IncomeKind =
  | 'w2'
  | 'selfEmployment'
  | 'ssdi'
  | 'socialSecurity'
  | 'disabilityShortTerm'
  | 'disabilityLongTerm'
  | 'retirementWithdrawal'
  | 'pension'
  | 'interestDividends';

export interface IncomeLine {
  id: string;
  kind: IncomeKind;
  /** Gross annual amount. */
  amount: number;
  /** Deductible business expenses. Self-employment only. */
  expenses?: number;
  /**
   * Who paid the premium on a disability policy.
   *
   * This single answer decides whether the benefit is taxable at all, and no
   * amount of income data reveals it — which is why the calculator asks.
   */
  premiumPaidBy?: 'employer' | 'employee' | 'split';
}

export interface Person {
  id: string;
  label: string;
  income: IncomeLine[];
  /** Pre-tax retirement contributions — 401(k), SEP, solo 401(k). */
  preTaxRetirement: number;
  /** Pre-tax health savings account contributions. */
  hsa: number;
  age65Plus: boolean;
}

export interface HouseholdInput {
  people: Person[];
  filingStatus: string;
  stateCode: string;
}

export interface HouseholdResult {
  /** Everything before any exclusion, for showing what was entered. */
  grossAll: number;
  /** Wages subject to payroll tax. */
  w2Wages: number;
  /** Self-employment profit after expenses. */
  seProfit: number;
  /** Disability benefits that are taxable after the premium test. */
  taxableDisability: number;
  /** Disability benefits excluded because the recipient paid the premium. */
  excludedDisability: number;
  /** The portion of SSDI and Social Security that is taxable. */
  taxableSocialSecurity: number;
  /** Benefits received but not taxed. */
  untaxedSocialSecurity: number;
  otherOrdinary: number;
  preTaxDeductions: number;
  seTax: number;
  seTaxDeductibleHalf: number;
  fica: number;
  agi: number;
  standardDeduction: number;
  seniorDeduction: number;
  qbiDeduction: number;
  taxableIncome: number;
  federalTax: number;
  stateTax: number;
  /** State tax excluded because the state does not tax Social Security. */
  stateSocialSecurityExcluded: number;
  totalTax: number;
  afterTax: number;
  effectiveRate: number;
  /** Things the result depends on that the numbers alone do not show. */
  notes: string[];
}

export function emptyPerson(id: string, label: string): Person {
  return { id, label, income: [], preTaxRetirement: 0, hsa: 0, age65Plus: false };
}

export const INCOME_KINDS: Array<{
  kind: IncomeKind; label: string; hint: string; needsPremium?: boolean; needsExpenses?: boolean;
}> = [
  { kind: 'w2', label: 'W-2 wages', hint: 'Salary from an employer. Payroll tax is withheld.' },
  { kind: 'selfEmployment', label: '1099 / self-employment', hint: 'Freelance, contract or business income. Self-employment tax applies to the profit.', needsExpenses: true },
  { kind: 'ssdi', label: 'Social Security disability (SSDI)', hint: 'Taxed on a formula that counts half the benefit plus your other income.' },
  { kind: 'socialSecurity', label: 'Social Security retirement', hint: 'Same formula as SSDI. Twelve states tax it; the rest do not.' },
  { kind: 'disabilityShortTerm', label: 'Short-term disability', hint: 'Taxable or not depending on who paid the premium.', needsPremium: true },
  { kind: 'disabilityLongTerm', label: 'Long-term disability', hint: 'Taxable or not depending on who paid the premium.', needsPremium: true },
  { kind: 'retirementWithdrawal', label: '401(k) or IRA withdrawal', hint: 'Ordinary income. No payroll tax.' },
  { kind: 'pension', label: 'Pension or annuity', hint: 'Ordinary income. No payroll tax.' },
  { kind: 'interestDividends', label: 'Interest and dividends', hint: 'Ordinary income, and it counts toward the Social Security formula.' },
];

/**
 * How much of a disability benefit is taxable.
 *
 * The rule is about premiums, not amounts: a benefit is taxable in proportion
 * to how much of the premium was paid with untaxed money. Employer-paid means
 * fully taxable; paid by the recipient from taxed income means fully tax-free.
 * People routinely assume the opposite, because the benefit replaces wages.
 */
function taxableShareOfDisability(paidBy: IncomeLine['premiumPaidBy']): number {
  if (paidBy === 'employee') return 0;
  if (paidBy === 'split') return 0.5;
  return 1; // employer-paid, or unstated — the common case and the taxable one
}

export function calcHousehold(input: HouseholdInput): HouseholdResult {
  const { people, filingStatus, stateCode } = input;
  const notes: string[] = [];

  let w2Wages = 0, seGross = 0, seExpenses = 0;
  let taxableDisability = 0, excludedDisability = 0;
  let socialSecurityGross = 0, otherOrdinary = 0, preTaxDeductions = 0;
  let anyAge65 = false;

  for (const p of people) {
    preTaxDeductions += Math.max(0, p.preTaxRetirement) + Math.max(0, p.hsa);
    if (p.age65Plus) anyAge65 = true;
    for (const line of p.income) {
      const amt = Math.max(0, line.amount);
      switch (line.kind) {
        case 'w2': w2Wages += amt; break;
        case 'selfEmployment':
          seGross += amt; seExpenses += Math.max(0, line.expenses ?? 0); break;
        case 'ssdi':
        case 'socialSecurity':
          socialSecurityGross += amt; break;
        case 'disabilityShortTerm':
        case 'disabilityLongTerm': {
          const share = taxableShareOfDisability(line.premiumPaidBy);
          taxableDisability += amt * share;
          excludedDisability += amt * (1 - share);
          break;
        }
        default: otherOrdinary += amt;
      }
    }
  }

  const seProfit = Math.max(0, seGross - seExpenses);
  const se = calcSETax(seProfit, undefined, w2Wages, filingStatus);
  // employeeFICA, not totalFICA: totalFICA includes the employer's matching
  // half, which the household never pays and must not be charged for.
  const ficaResult = calcFICA(w2Wages, undefined, 0, filingStatus);
  const employeeFica = ficaResult.employeeFICA;

  // Everything except Social Security, which is tested against this figure.
  const ordinaryBeforeSS =
    w2Wages + seProfit + taxableDisability + otherOrdinary - se.deductibleHalf - preTaxDeductions;

  const taxableSocialSecurity = socialSecurityGross > 0
    ? calcSSDITaxable(socialSecurityGross, Math.max(0, ordinaryBeforeSS), 0, filingStatus).taxable
    : 0;
  const untaxedSocialSecurity = socialSecurityGross - taxableSocialSecurity;

  const agi = Math.max(0, ordinaryBeforeSS + taxableSocialSecurity);
  const standardDeduction = getStandardDeduction(filingStatus, anyAge65);
  const seniorDeduction = anyAge65 ? calcSeniorDeductionOBBBA(agi, filingStatus) : 0;
  const beforeQBI = Math.max(0, agi - standardDeduction - seniorDeduction);
  const qbiDeduction = seProfit > 0 ? calcQBI(seProfit, beforeQBI, filingStatus) : 0;
  const taxableIncome = Math.max(0, beforeQBI - qbiDeduction);

  const federalTax = calcFederalTax(taxableIncome, filingStatus);

  // State: most states do not tax Social Security, so it comes out of the base.
  const taxesSS = (stateMetadata.statesThatTaxSocialSecurity as string[]).includes(stateCode);
  const stateBase = taxesSS ? agi : Math.max(0, agi - taxableSocialSecurity);
  const stateTax = stateCode ? calcStateTax(stateBase, stateCode, undefined, filingStatus).tax : 0;
  const stateSocialSecurityExcluded = taxesSS ? 0 : taxableSocialSecurity;

  const totalTax = federalTax + stateTax + se.totalSE + employeeFica;
  const grossAll = w2Wages + seGross + socialSecurityGross + taxableDisability + excludedDisability + otherOrdinary;

  /* ---- the interactions worth saying out loud ---- */
  if (socialSecurityGross > 0 && taxableSocialSecurity > 0) {
    notes.push(
      `${Math.round((taxableSocialSecurity / socialSecurityGross) * 100)}% of the Social Security or SSDI in this household is taxable. ` +
      'That percentage is driven by the household’s other income, not by the benefit — so another earner’s work can make a benefit taxable that was not taxable before.',
    );
  }
  if (socialSecurityGross > 0 && taxableSocialSecurity === 0) {
    notes.push('None of the Social Security or SSDI is taxable at this income level. It becomes taxable once the household’s other income rises past the threshold.');
  }
  if (excludedDisability > 0) {
    notes.push(
      `${formatShare(excludedDisability, excludedDisability + taxableDisability)} of the disability benefit is tax-free because the premium was paid with money already taxed. ` +
      'If an employer pays the premium instead, the same benefit becomes fully taxable.',
    );
  }
  if (socialSecurityGross > 0 && stateCode && !taxesSS) {
    notes.push(`${states[stateCode]?.name ?? 'This state'} does not tax Social Security benefits, so they are excluded from the state calculation.`);
  }
  if (socialSecurityGross > 0 && taxesSS) {
    notes.push(`${states[stateCode]?.name} is one of the twelve states that does tax Social Security benefits.`);
  }
  if (seProfit > 0 && w2Wages > 0) {
    notes.push('W-2 wages use up the Social Security wage base first, so the self-employment tax here is calculated only on what is left of that base.');
  }
  // The ported getStandardDeduction takes a boolean, so it can add the extra
  // age-65 amount once. A married couple who are both 65 or older are entitled
  // to it twice. Rather than guess at a figure the dataset does not hold, say so.
  const seniorsCount = people.filter((p) => p.age65Plus).length;
  if (filingStatus === 'mfj' && seniorsCount > 1) {
    notes.push(
      'Both of you are 65 or older. The extra standard deduction for age is counted once here, not twice — ' +
      'so the real tax is a little lower than this figure. Check the second amount before relying on the total.',
    );
  }
  if (preTaxDeductions > 0) {
    notes.push(`${formatMoneyPlain(preTaxDeductions)} of pre-tax retirement and health savings contributions came out before tax was calculated.`);
  }

  return {
    grossAll, w2Wages, seProfit, taxableDisability, excludedDisability,
    taxableSocialSecurity, untaxedSocialSecurity, otherOrdinary, preTaxDeductions,
    seTax: se.totalSE, seTaxDeductibleHalf: se.deductibleHalf, fica: employeeFica,
    agi, standardDeduction, seniorDeduction, qbiDeduction, taxableIncome,
    federalTax, stateTax, stateSocialSecurityExcluded,
    totalTax, afterTax: grossAll - totalTax,
    effectiveRate: grossAll > 0 ? totalTax / grossAll : 0,
    notes,
  };
}

function formatShare(part: number, whole: number): string {
  if (whole <= 0) return 'All';
  const pct = Math.round((part / whole) * 100);
  return pct >= 100 ? 'All' : `${pct}%`;
}
function formatMoneyPlain(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

/** States that tax Social Security, for the retirement pages. */
export function statesTaxingSocialSecurity(): string[] {
  return (stateMetadata.statesThatTaxSocialSecurity as string[]).slice().sort(
    (a, b) => (states[a]?.name ?? a).localeCompare(states[b]?.name ?? b),
  );
}
