/**
 * W-2 paycheck / take-home estimate. Distinct from the 1099 calculator: a W-2
 * employee pays the employee half of FICA (7.65%), not self-employment tax, and
 * has no QBI deduction. All figures come from the ported engine + verified data.
 */
import { calcFederalTax, calcFICA, calcStateTax, getStandardDeduction } from './tax-engine';

export interface PaycheckResult {
  gross: number;
  federalTax: number;
  fica: number;
  stateTax: number;
  totalTax: number;
  takeHome: number;
  effectiveRate: number;
}

/**
 * Estimate annual take-home for a W-2 wage. Assumes the standard deduction and
 * no pre-tax deductions or credits (documented on the page).
 */
export function paycheckEstimate(gross: number, stateCode: string, status = 'single'): PaycheckResult {
  const stdDed = getStandardDeduction(status, false);
  const taxable = Math.max(0, gross - stdDed);
  const federalTax = calcFederalTax(taxable, status);
  const fica = calcFICA(gross, undefined, 0, status).employeeFICA;
  const stateTax = calcStateTax(gross, stateCode, undefined, status).tax;
  const totalTax = federalTax + fica + stateTax;
  return {
    gross,
    federalTax,
    fica,
    stateTax,
    totalTax,
    takeHome: gross - totalTax,
    effectiveRate: gross > 0 ? totalTax / gross : 0,
  };
}
