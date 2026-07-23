/**
 * W-2 paycheck / take-home estimate.
 *
 * Distinct from the 1099 calculator: a W-2 employee pays the employee half of
 * FICA (7.65%), not self-employment tax, and has no QBI deduction.
 *
 * State disability insurance is included. It was described in the page copy but
 * missing from the figures, which meant the take-home was overstated for the
 * five states that levy it — 0.9% of a California salary is real money coming
 * out of a real paycheck, and a take-home calculator that omits it is wrong.
 * Where a state's program has no single statutory rate (New York's DBL and
 * Hawaii's TDI both vary by employer plan) it is reported as unmodeled rather
 * than guessed at.
 *
 * PRE-TAX DEDUCTIONS ARE NOT ALL ALIKE, and treating them as one number was a
 * quiet error. A 401(k) deferral reduces income tax but NOT payroll tax. An HSA,
 * a health FSA and a health-insurance premium run through a Section 125
 * cafeteria plan and reduce BOTH income tax and payroll tax. Lumping them into a
 * single "pre-tax" field overstated FICA on the cafeteria portion. They are now
 * itemized, and the FICA base excludes the cafeteria items.
 */
import {
  calcFederalTax, calcFICA, calcStateTax, getStandardDeduction,
  calcChildTaxCredit, marginalRate,
} from './tax-engine';
import { stateMetadata } from '../data/states';
import { retirement } from '../data/federal';

const SDI = (stateMetadata as any).statesWithSDI as Record<
  string,
  { rate: number | string; wageBase?: number | string; note: string }
>;

/** Dataset-backed contribution limits, for validating inputs in the island. */
export const CONTRIBUTION_LIMITS = {
  retirement401k: (retirement as any).solo401k.employeeLimit as number,
  hsaSelf: (retirement as any).hsa.selfOnly as number,
  hsaFamily: (retirement as any).hsa.family as number,
  // Health and dependent-care FSA limits are NOT in the verified dataset, so
  // the FSA input ships without a limit check and the copy says so.
  fsa: null as number | null,
};

export interface SdiResult {
  amount: number | null;
  label: string;
  note: string;
  unmodeled: boolean;
}

export function sdiFor(stateCode: string, gross: number): SdiResult | null {
  const entry = SDI[stateCode];
  if (!entry) return null;
  if (typeof entry.rate !== 'number') {
    return { amount: null, label: 'State disability insurance', note: entry.note, unmodeled: true };
  }
  const base = typeof entry.wageBase === 'number' ? entry.wageBase : Infinity;
  const taxed = Math.min(gross, base);
  const pct = `${(entry.rate * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
  return {
    amount: taxed * entry.rate,
    label: base === Infinity
      ? `State disability insurance (${pct} of wages)`
      : `State disability insurance (${pct} up to $${base.toLocaleString()})`,
    note: entry.note,
    unmodeled: false,
  };
}

/**
 * Pre-tax deductions, split by how they interact with payroll tax.
 *
 * retirement401k reduces income tax only. hsa, fsa and healthPremium are
 * cafeteria-plan deductions that reduce income tax AND payroll tax.
 */
export interface PreTaxDeductions {
  retirement401k?: number;
  hsa?: number;
  fsa?: number;
  healthPremium?: number;
}

export interface PaycheckInput {
  gross: number;
  stateCode: string;
  status?: string;
  preTax?: PreTaxDeductions;
  /** Number of qualifying children under 17, for the child tax credit. */
  dependents?: number;
  /** After-tax deductions — union dues, garnishment, child support. */
  postTax?: number;
}

export interface PaycheckResult {
  gross: number;
  preTaxTotal: number;
  /** Portion of pre-tax that is also exempt from payroll tax (cafeteria plan). */
  cafeteriaPreTax: number;
  taxableIncome: number;
  standardDeduction: number;
  federalTax: number;
  childTaxCredit: number;
  fica: number;
  stateTax: number;
  sdi: SdiResult | null;
  postTax: number;
  totalTax: number;
  takeHome: number;
  effectiveRate: number;
  /** The bracket the next dollar falls in. */
  marginalRate: number;
}

/**
 * Annual take-home for a W-2 wage.
 *
 * Accepts either the structured input object or the old positional form
 * (gross, state, status, preTaxNumber) so the build-time page callers keep
 * working — a bare pre-tax number is treated as a 401(k)-style deferral, which
 * is what the single field always meant.
 */
export function paycheckEstimate(
  input: PaycheckInput | number,
  stateCode?: string,
  status = 'single',
  preTaxNumber = 0,
): PaycheckResult {
  const i: PaycheckInput = typeof input === 'number'
    ? { gross: input, stateCode: stateCode!, status, preTax: { retirement401k: preTaxNumber } }
    : input;

  const st = i.status ?? 'single';
  const p = i.preTax ?? {};
  const r401 = Math.max(0, p.retirement401k ?? 0);
  const cafeteria = Math.max(0, p.hsa ?? 0) + Math.max(0, p.fsa ?? 0) + Math.max(0, p.healthPremium ?? 0);
  const preTaxTotal = r401 + cafeteria;

  const afterPreTax = Math.max(0, i.gross - preTaxTotal);
  const standardDeduction = getStandardDeduction(st, false);
  const taxableIncome = Math.max(0, afterPreTax - standardDeduction);

  const grossFederal = calcFederalTax(taxableIncome, st);
  // AGI for the child tax credit is gross less every above-the-line pre-tax
  // item, before the standard deduction.
  const agi = afterPreTax;
  const childTaxCredit = i.dependents && i.dependents > 0
    ? calcChildTaxCredit(i.dependents, agi, st) : 0;
  const federalTax = Math.max(0, grossFederal - childTaxCredit);

  // FICA is charged on gross MINUS the cafeteria items, which are exempt. A
  // 401(k) deferral is not exempt, so it stays in the FICA base.
  const ficaBase = Math.max(0, i.gross - cafeteria);
  const fica = calcFICA(ficaBase, undefined, 0, st).employeeFICA;

  const stateTax = calcStateTax(afterPreTax, i.stateCode, undefined, st).tax;
  const sdi = sdiFor(i.stateCode, i.gross);
  const postTax = Math.max(0, i.postTax ?? 0);

  const totalTax = federalTax + fica + stateTax + (sdi?.amount ?? 0);
  return {
    gross: i.gross,
    preTaxTotal,
    cafeteriaPreTax: cafeteria,
    standardDeduction,
    taxableIncome,
    federalTax,
    childTaxCredit,
    fica,
    stateTax,
    sdi,
    postTax,
    totalTax,
    takeHome: i.gross - totalTax - postTax,
    effectiveRate: i.gross > 0 ? totalTax / i.gross : 0,
    marginalRate: marginalRate(taxableIncome, st),
  };
}

/** Output-frequency divisors, for showing a paycheck rather than an annual sum. */
export const PAY_FREQUENCIES: Array<{ key: string; label: string; periods: number }> = [
  { key: 'annual', label: 'Per year', periods: 1 },
  { key: 'monthly', label: 'Per month', periods: 12 },
  { key: 'semimonthly', label: 'Twice a month', periods: 24 },
  { key: 'biweekly', label: 'Every two weeks', periods: 26 },
  { key: 'weekly', label: 'Per week', periods: 52 },
];

/** Gross annual salary from an hourly rate. */
export function annualFromHourly(hourlyRate: number, hoursPerWeek: number): number {
  return Math.max(0, hourlyRate) * Math.max(0, hoursPerWeek) * 52;
}
