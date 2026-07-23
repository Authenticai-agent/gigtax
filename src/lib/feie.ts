/**
 * Foreign earned income exclusion. A US citizen or resident working abroad who
 * meets the bona fide residence or physical presence test can exclude foreign
 * earned income up to the 2026 limit ($132,900, from the dataset). The catch is
 * the "stacking" rule of §911(f): the excluded income still pushes the rest of
 * your income into higher brackets — you exclude the amount, not the rate — so
 * the benefit is smaller than the headline exclusion suggests.
 */
import { calcFederalTax, getStandardDeduction } from './tax-engine';
import { federal } from '../data/federal';

export const FEIE_LIMIT = (federal as any).foreignEarnedIncomeExclusion.amount as number; // 132,900

export interface FeieResult {
  foreignEarnedIncome: number;
  exclusion: number;
  taxableAfterExclusion: number;
  /** Tax with the exclusion, computed under the §911 stacking method. */
  taxWithFeie: number;
  /** Tax if you claimed no exclusion at all. */
  taxWithoutFeie: number;
  savings: number;
}

/**
 * Federal tax with the foreign earned income exclusion, under the stacking rule.
 * Tax = tax(taxable income + excluded amount) − tax(excluded amount): the
 * excluded income is added back to set the bracket, then its own tax is removed,
 * so your remaining income is taxed at the rate it would face without the
 * exclusion lowering it.
 */
export function feie(
  foreignEarnedIncome: number, otherUSIncome: number, status = 'single',
): FeieResult {
  const fei = Math.max(0, foreignEarnedIncome);
  const other = Math.max(0, otherUSIncome);
  const std = getStandardDeduction(status, false);
  const exclusion = Math.min(fei, FEIE_LIMIT);
  const totalIncome = fei + other;

  const taxableAfterExclusion = Math.max(0, totalIncome - exclusion - std);
  // Stacking: bracket set by full income, then remove the tax on the excluded slice.
  const taxWithFeie = Math.max(0, calcFederalTax(taxableAfterExclusion + exclusion, status) - calcFederalTax(exclusion, status));
  const taxWithoutFeie = calcFederalTax(Math.max(0, totalIncome - std), status);

  return {
    foreignEarnedIncome: fei,
    exclusion,
    taxableAfterExclusion,
    taxWithFeie: Math.round(taxWithFeie),
    taxWithoutFeie: Math.round(taxWithoutFeie),
    savings: Math.round(taxWithoutFeie - taxWithFeie),
  };
}
