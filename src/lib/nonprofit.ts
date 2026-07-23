/**
 * Nonprofit (501(c)(3)) tax — the counter-intuitive part of running a charity.
 *
 * Mission income is not taxed at all: donations, grants, program fees, and the
 * investment income that statute excludes. What IS taxed is unrelated business
 * income (UBI) — a regularly carried-on trade or business not substantially
 * related to the exempt purpose — and it is taxed at the flat 21% corporate rate
 * on Form 990-T, after a $1,000 specific deduction.
 *
 * Every rate here comes from the dataset: the corporate rate from the C-corp
 * entity data, the specific deduction from federal.ubitSpecificDeduction, and the
 * state layer from the shared state engine.
 */
import { calcStateTax, formatMoney } from './tax-engine';
import { federal, entityTypes } from '../data/federal';

const CORP_RATE: number = (entityTypes as any).cCorporation.corporateTaxRate;
const SPECIFIC_DEDUCTION: number = (federal as any).ubitSpecificDeduction;

export interface NonprofitInput {
  totalRevenue: number;
  /** Share of total revenue that is mission-related and therefore exempt (0-100). */
  exemptPct: number;
  ubi: number;
  ubiDeductions: number;
  stateCode: string;
}

export interface NonprofitResult {
  totalRevenue: number;
  exemptIncome: number;
  ubi: number;
  ubiDeductions: number;
  specificDeduction: number;
  netUBI: number;
  federalUBITax: number;
  stateUBITax: number;
  totalTax: number;
  /** Effective tax on total revenue — usually tiny, which is the point. */
  effectiveRateOnRevenue: number;
}

export function nonprofitUBIT(input: NonprofitInput): NonprofitResult {
  const { totalRevenue, exemptPct, ubi, ubiDeductions, stateCode } = input;

  const exemptIncome = totalRevenue * (Math.min(100, Math.max(0, exemptPct)) / 100);
  // §512(b)(12): the $1,000 specific deduction comes off before the rate applies,
  // and can only reduce net UBI to zero, never below.
  const afterDeductions = Math.max(0, ubi - ubiDeductions);
  const netUBI = Math.max(0, afterDeductions - SPECIFIC_DEDUCTION);

  const federalUBITax = Math.round(netUBI * CORP_RATE);
  // UBI is taxed to the organization as if it were a corporation, so a flat
  // single-filer state computation on the net amount is the right model.
  const stateUBITax = Math.round(calcStateTax(netUBI, stateCode, undefined, 'single').tax);
  const totalTax = federalUBITax + stateUBITax;

  return {
    totalRevenue,
    exemptIncome,
    ubi,
    ubiDeductions,
    specificDeduction: SPECIFIC_DEDUCTION,
    netUBI,
    federalUBITax,
    stateUBITax,
    totalTax,
    effectiveRateOnRevenue: totalRevenue > 0 ? totalTax / totalRevenue : 0,
  };
}

export { CORP_RATE as UBIT_CORP_RATE, SPECIFIC_DEDUCTION as UBIT_SPECIFIC_DEDUCTION, formatMoney };
