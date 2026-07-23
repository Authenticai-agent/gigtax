/**
 * Gambling / windfall tax. Winnings are ordinary income, reported in full.
 * Losses are an itemized deduction — and for 2026 the OBBBA capped that
 * deduction at 90% of losses (still limited to winnings), so a gambler who
 * merely broke even is now taxed on 10% of the money that passed through them.
 * That rule is the whole point of this calculator; the 90% rate is read from the
 * dataset, not authored here.
 */
import {
  calcFederalTax, calcStateTax, getStandardDeduction,
} from './tax-engine';
import { federal } from '../data/federal';

const LOSS_RATE = (federal as any).gamblingLossDeductionRate as number; // 0.90 for 2026

export interface GamblingResult {
  winnings: number;
  /** Losses you may deduct: 90% of losses, capped at winnings, and only if itemizing. */
  deductibleLosses: number;
  /** Losses lost to the 90% cap and the winnings ceiling — never deductible. */
  nonDeductibleLosses: number;
  usingItemized: boolean;
  /** Federal tax the winnings add, after any loss deduction. */
  federalTaxOnWinnings: number;
  stateTaxOnWinnings: number;
  /** Extra tax you owe purely because of the 90% rule, even at break-even. */
  breakEvenTax: number;
  w2gWithheld: number;
  /** Winnings less the tax they cause, plus any withholding already paid back. */
  netAfterTax: number;
  effectiveRateOnWinnings: number;
}

/**
 * Tax on gambling winnings for 2026.
 *
 * Winnings add to ordinary income. Losses deduct only as an itemized deduction,
 * at 90% and capped at winnings — so the deduction only helps if itemizing beats
 * the standard deduction. The "break-even tax" line isolates the new 2026 sting:
 * the tax on the 10% of losses you can no longer deduct even when losses equal
 * winnings.
 */
export function gamblingTax(
  winnings: number,
  losses: number,
  otherOrdinaryIncome: number,
  status = 'single',
  otherItemizedDeductions = 0,
  stateCode = '',
  w2gWithheld = 0,
): GamblingResult {
  const w = Math.max(0, winnings);
  const l = Math.max(0, losses);
  const other = Math.max(0, otherOrdinaryIncome);
  const std = getStandardDeduction(status, false);

  const deductibleLosses = Math.min(LOSS_RATE * l, w);
  const itemizedTotal = Math.max(0, otherItemizedDeductions) + deductibleLosses;
  const usingItemized = itemizedTotal > std;
  const deduction = Math.max(std, itemizedTotal);

  // Tax with the winnings and (if itemizing) the loss deduction.
  const taxableWith = Math.max(0, other + w - deduction);
  const federalWith = calcFederalTax(taxableWith, status);
  // Baseline: the same person with no gambling at all.
  const baseDeduction = Math.max(std, Math.max(0, otherItemizedDeductions));
  const taxableBase = Math.max(0, other - baseDeduction);
  const federalBase = calcFederalTax(taxableBase, status);
  const federalTaxOnWinnings = Math.max(0, federalWith - federalBase);

  // State: winnings are ordinary income; most states do not allow the loss
  // deduction at all, so state tax is on the full winnings (a known trap).
  const stateWith = stateCode ? calcStateTax(other + w, stateCode, undefined, status).tax : 0;
  const stateBase = stateCode ? calcStateTax(other, stateCode, undefined, status).tax : 0;
  const stateTaxOnWinnings = Math.max(0, stateWith - stateBase);

  // Break-even sting: if losses ≥ winnings, 90% caps the deduction at 0.9×winnings,
  // leaving 10% of winnings taxable. Value that residual at the marginal rate.
  const brokeEvenResidual = l >= w ? w - Math.min(LOSS_RATE * w, w) : 0;
  const taxableBreakEven = Math.max(0, other + w - Math.max(std, Math.max(0, otherItemizedDeductions) + Math.min(LOSS_RATE * w, w)));
  const breakEvenTax = Math.max(0, calcFederalTax(taxableBreakEven, status) - federalBase);

  const totalTax = federalTaxOnWinnings + stateTaxOnWinnings;
  return {
    winnings: w,
    deductibleLosses,
    nonDeductibleLosses: l - deductibleLosses,
    usingItemized,
    federalTaxOnWinnings,
    stateTaxOnWinnings,
    breakEvenTax: brokeEvenResidual > 0 ? breakEvenTax : 0,
    w2gWithheld: Math.max(0, w2gWithheld),
    netAfterTax: w - totalTax + 0, // withholding is a prepayment, netted at filing
    effectiveRateOnWinnings: w > 0 ? totalTax / w : 0,
  };
}
