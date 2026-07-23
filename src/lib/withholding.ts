/**
 * Withholding and offer-comparison calculators — bonus, W-4 check, W-2 vs 1099.
 *
 * These compose the ported tax engine; no rate or bracket is authored here.
 * Ported from bonusTaxView, w4WithholdingView and w2Vs1099View. The parity
 * tests in check-wage.mjs pin the composition against a transcription of the
 * legacy formulas.
 */
import {
  calcFederalTax, calcStateTax, calcSETax, calcQBI, getStandardDeduction,
} from './tax-engine';
import { federal } from '../data/federal';

const SS_WAGE_BASE = (federal as any).selfEmployment.socialSecurityWageBase as number;
const SS_RATE = 0.062;
const MED_RATE = 0.0145;

/* ------------------------------------------------------------- bonus ------- */

export interface BonusResult {
  bonus: number;
  /** Flat 22% supplemental method. */
  flat: { federal: number; fica: number; state: number; total: number; net: number };
  /** Aggregate method — the bonus taxed at your marginal rate on top of salary. */
  aggregate: { federal: number; fica: number; state: number; total: number; net: number };
  /** Which method withholds less, i.e. leaves more in the paycheck now. */
  keepsMore: 'flat' | 'aggregate' | 'same';
}

/**
 * A bonus under the two withholding methods an employer may use.
 *
 * Flat: 22% federal on the bonus alone (37% above $1m, but that band is not
 * modelled here). Aggregate: the bonus added to a regular paycheck and the
 * whole thing taxed at the marginal rate. FICA and state are the same either
 * way. This is a WITHHOLDING comparison — the year-end tax is identical, which
 * the copy states.
 */
export function bonusTax(
  bonus: number,
  salary: number,
  stateCode: string,
  status = 'single',
): BonusResult {
  const b = Math.max(0, bonus);
  const sal = Math.max(0, salary);

  // FICA on the bonus: Social Security only up to the wage base the salary has
  // not already used, Medicare on all of it.
  const ssRoom = Math.max(0, SS_WAGE_BASE - sal);
  const ssTaxable = Math.min(b, ssRoom);
  const fica = ssTaxable * SS_RATE + b * MED_RATE;

  // State: the extra tax the bonus adds, same for both methods.
  const stateBase = stateCode ? calcStateTax(sal, stateCode, undefined, status).tax : 0;
  const stateWith = stateCode ? calcStateTax(sal + b, stateCode, undefined, status).tax : 0;
  const state = Math.max(0, stateWith - stateBase);

  const flatFederal = b * 0.22;

  const std = getStandardDeduction(status, false);
  const fedBase = calcFederalTax(Math.max(0, sal - std), status);
  const fedWith = calcFederalTax(Math.max(0, sal + b - std), status);
  const aggFederal = Math.max(0, fedWith - fedBase);

  const flatTotal = flatFederal + fica + state;
  const aggTotal = aggFederal + fica + state;
  const netFlat = b - flatTotal;
  const netAgg = b - aggTotal;

  return {
    bonus: b,
    flat: { federal: flatFederal, fica, state, total: flatTotal, net: netFlat },
    aggregate: { federal: aggFederal, fica, state, total: aggTotal, net: netAgg },
    keepsMore: Math.abs(netFlat - netAgg) < 1 ? 'same' : netFlat > netAgg ? 'flat' : 'aggregate',
  };
}

/* -------------------------------------------------------- W-4 check -------- */

export interface W4Result {
  totalIncome: number;
  taxableIncome: number;
  federalTax: number;
  stateTax: number;
  fica: number;
  totalTaxForYear: number;
  withheldForYear: number;
  /** Positive means over-withholding (a refund), negative means a bill. */
  difference: number;
  status: 'refund' | 'owe' | 'on-track';
  /** What each remaining paycheck should withhold to land at zero. */
  suggestedPerCheck: number | null;
}

/**
 * A W-4 sanity check: projected annual tax against what is being withheld.
 *
 * Ported from w4WithholdingView. The dependents figure reduces tax as a credit
 * (child tax credit), and extra deductions add to the standard deduction.
 */
export function w4Check(
  salary: number,
  withheldPerCheck: number,
  payPeriods: number,
  stateCode: string,
  status = 'single',
  bonus = 0,
  otherIncome = 0,
  dependentsCredit = 0,
  extraDeductions = 0,
): W4Result {
  const totalIncome = Math.max(0, salary) + Math.max(0, bonus) + Math.max(0, otherIncome);
  const std = getStandardDeduction(status, false);
  const taxableIncome = Math.max(0, totalIncome - std - Math.max(0, extraDeductions));

  const federalTax = Math.max(0, calcFederalTax(taxableIncome, status) - Math.max(0, dependentsCredit));
  const stateTax = stateCode ? calcStateTax(totalIncome, stateCode, undefined, status).tax : 0;
  const ficaWages = Math.min(totalIncome, SS_WAGE_BASE);
  const fica = ficaWages * SS_RATE + totalIncome * MED_RATE;

  const totalTaxForYear = federalTax + stateTax + fica;
  const withheldForYear = Math.max(0, withheldPerCheck) * Math.max(1, payPeriods);
  const difference = withheldForYear - totalTaxForYear;

  return {
    totalIncome, taxableIncome, federalTax, stateTax, fica,
    totalTaxForYear, withheldForYear, difference,
    status: Math.abs(difference) < 200 ? 'on-track' : difference > 0 ? 'refund' : 'owe',
    suggestedPerCheck: payPeriods > 0 ? totalTaxForYear / payPeriods : null,
  };
}

/* ---------------------------------------------------- W-2 vs 1099 ---------- */

export interface OfferResult {
  /** True total value of the W-2 offer including employer-paid benefits. */
  w2TotalValue: number;
  w2TakeHome: number;
  c1099TakeHome: number;
  /** 1099 take-home minus W-2 take-home; negative means the W-2 wins. */
  difference: number;
  winner: 'w2' | '1099' | 'even';
  /** The 1099 gross that would match the W-2's take-home. */
  breakEven1099: number;
}

interface W2Offer {
  salary: number;
  employerHealth?: number;
  match401kPct?: number;
  ptoWeeks?: number;
  otherBenefits?: number;
}
interface C1099Offer {
  income: number;
  deductions?: number;
  healthCost?: number;
  solo401k?: number;
}

function w2TakeHome(o: W2Offer, stateCode: string, status: string): number {
  const std = getStandardDeduction(status, false);
  const fica = Math.min(o.salary, SS_WAGE_BASE) * SS_RATE + o.salary * MED_RATE;
  const federalTax = calcFederalTax(Math.max(0, o.salary - std), status);
  const stateTax = stateCode ? calcStateTax(o.salary, stateCode, undefined, status).tax : 0;
  return o.salary - fica - federalTax - stateTax;
}

function c1099TakeHome(o: C1099Offer, stateCode: string, status: string): number {
  const net = Math.max(0, o.income - (o.deductions ?? 0));
  const se = calcSETax(net, undefined, 0, status);
  // Self-employed health insurance and the solo 401(k) are above-the-line.
  const agi = net - se.deductibleHalf - (o.healthCost ?? 0) - (o.solo401k ?? 0);
  const std = getStandardDeduction(status, false);
  const beforeQbi = Math.max(0, agi - std);
  const qbi = calcQBI(net, beforeQbi, status);
  const taxable = Math.max(0, beforeQbi - qbi);
  const federalTax = calcFederalTax(taxable, status);
  const stateTax = stateCode ? calcStateTax(Math.max(0, agi), stateCode, undefined, status).tax : 0;
  // Take-home is gross less business costs actually spent, less every tax.
  return o.income - (o.healthCost ?? 0) - se.totalSE - federalTax - stateTax;
}

/**
 * Compare a W-2 offer against a 1099 offer on take-home, and value the
 * employer-paid benefits the 1099 side has to buy for itself.
 *
 * Ported from w2Vs1099View. The break-even 1099 gross is found by scaling the
 * 1099 income until its take-home matches the W-2's — the number the copy tells
 * the reader to negotiate against.
 */
export function compareOffers(
  w2: W2Offer, c1099: C1099Offer, stateCode: string, status = 'single',
): OfferResult {
  const employerFica = Math.min(w2.salary, SS_WAGE_BASE) * SS_RATE + w2.salary * MED_RATE;
  const matchDollars = w2.salary * ((w2.match401kPct ?? 0) / 100);
  const ptoValue = (w2.salary / 52) * (w2.ptoWeeks ?? 0);
  const w2TotalValue = w2.salary + (w2.employerHealth ?? 0) + matchDollars + ptoValue
    + (w2.otherBenefits ?? 0) + employerFica;

  const wh = w2TakeHome(w2, stateCode, status);
  const ch = c1099TakeHome(c1099, stateCode, status);
  const difference = ch - wh;

  // Break-even: the 1099 gross whose take-home equals the W-2's. Take-home is
  // close to linear in gross here, so one proportional step lands within a
  // dollar, and a short refinement removes the rest.
  let guess = c1099.income;
  for (let i = 0; i < 40; i++) {
    const th = c1099TakeHome({ ...c1099, income: guess }, stateCode, status);
    const err = th - wh;
    if (Math.abs(err) < 1) break;
    guess += err > 0 ? -Math.max(50, Math.abs(err)) : Math.max(50, Math.abs(err));
  }

  return {
    w2TotalValue,
    w2TakeHome: wh,
    c1099TakeHome: ch,
    difference,
    winner: Math.abs(difference) < 100 ? 'even' : difference > 0 ? '1099' : 'w2',
    breakEven1099: guess,
  };
}
