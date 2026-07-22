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
 * Where a state's programme has no single statutory rate (New York's DBL and
 * Hawaii's TDI both vary by employer plan) it is reported as unmodelled rather
 * than guessed at.
 *
 * The waterfall mirrors the legacy calculator's: gross, pre-tax deductions,
 * taxable income, then each tax line, then what actually lands.
 */
import { calcFederalTax, calcFICA, calcStateTax, getStandardDeduction } from './tax-engine';
import { stateMetadata } from '../data/states';

const SDI = (stateMetadata as any).statesWithSDI as Record<
  string,
  { rate: number | string; wageBase?: number | string; note: string }
>;

export interface SdiResult {
  /** Dollar amount withheld, or null when the state's rate is not a fixed figure. */
  amount: number | null;
  label: string;
  note: string;
  /** True when the state has a programme we cannot put a number on. */
  unmodelled: boolean;
}

/** State disability withholding for a wage, from stateMetadata.statesWithSDI. */
export function sdiFor(stateCode: string, gross: number): SdiResult | null {
  const entry = SDI[stateCode];
  if (!entry) return null;

  if (typeof entry.rate !== 'number') {
    return {
      amount: null,
      label: 'State disability insurance',
      note: entry.note,
      unmodelled: true,
    };
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
    unmodelled: false,
  };
}

export interface PaycheckResult {
  gross: number;
  preTax: number;
  taxableIncome: number;
  standardDeduction: number;
  federalTax: number;
  fica: number;
  stateTax: number;
  sdi: SdiResult | null;
  totalTax: number;
  takeHome: number;
  effectiveRate: number;
}

/**
 * Annual take-home for a W-2 wage. `preTax` covers 401(k)/HSA-style payroll
 * deductions, which reduce income tax but not FICA.
 */
export function paycheckEstimate(
  gross: number,
  stateCode: string,
  status = 'single',
  preTax = 0,
): PaycheckResult {
  const afterPreTax = Math.max(0, gross - preTax);
  const standardDeduction = getStandardDeduction(status, false);
  const taxableIncome = Math.max(0, afterPreTax - standardDeduction);
  const federalTax = calcFederalTax(taxableIncome, status);
  // FICA is charged on gross: a 401(k) deferral does not escape Social Security
  // or Medicare, which is why it does not reduce this line.
  const fica = calcFICA(gross, undefined, 0, status).employeeFICA;
  const stateTax = calcStateTax(afterPreTax, stateCode, undefined, status).tax;
  const sdi = sdiFor(stateCode, gross);
  const totalTax = federalTax + fica + stateTax + (sdi?.amount ?? 0);
  return {
    gross,
    preTax,
    standardDeduction,
    taxableIncome,
    federalTax,
    fica,
    stateTax,
    sdi,
    totalTax,
    takeHome: gross - totalTax,
    effectiveRate: gross > 0 ? totalTax / gross : 0,
  };
}
