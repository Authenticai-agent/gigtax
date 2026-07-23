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
  calcSETax, calcSSDITaxable, calcACASubsidy,
} from './tax-engine';
import { federal } from '../data/federal';

const LOSS_RATE = (federal as any).gamblingLossDeductionRate as number; // 0.90 for 2026
const WITHHOLDING_RATE = (federal as any).gamblingWithholdingRate as number; // 0.24 (W-2G)

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

/* -------------------------------- lottery ---------------------------------- */

export interface LotteryResult {
  jackpot: number;
  cashValue: number;
  /** Lump sum after federal + state tax (taxed as ordinary income, mostly at the top rate). */
  lumpSumAfterTax: number;
  lumpSumTax: number;
  /** 24% federal withholding taken up front from the lump sum. */
  federalWithheld: number;
  annualPayment: number;
  annuityAfterTaxPerYear: number;
  /** Total after-tax over the 30-year annuity. */
  annuityAfterTaxTotal: number;
}

/**
 * Lottery take-home: lump sum (the cash value, taxed now) vs the 30-year annuity
 * (the full jackpot, taxed as each payment arrives). At jackpot size the whole
 * amount sits in the top federal bracket, so tax is the top rate plus state; 24%
 * is withheld up front on the lump sum and the rest is due at filing. The annuity
 * is modelled as 30 equal payments — real annuities rise about 5% a year, which
 * the copy notes.
 */
export function lotteryTax(
  jackpot: number, cashValue: number, otherIncome: number, status = 'single', stateCode = '',
): LotteryResult {
  const jp = Math.max(0, jackpot);
  const cash = Math.max(0, cashValue || jp * 0.6);
  const std = getStandardDeduction(status, false);
  const taxOn = (amt: number) => {
    const fed = calcFederalTax(Math.max(0, otherIncome + amt - std), status) - calcFederalTax(Math.max(0, otherIncome - std), status);
    const st = stateCode ? calcStateTax(otherIncome + amt, stateCode, undefined, status).tax - calcStateTax(otherIncome, stateCode, undefined, status).tax : 0;
    return Math.max(0, fed) + Math.max(0, st);
  };
  const lumpSumTax = taxOn(cash);
  const annualPayment = jp / 30;
  const annuityTaxPerYear = taxOn(annualPayment);
  return {
    jackpot: jp,
    cashValue: cash,
    lumpSumTax: Math.round(lumpSumTax),
    lumpSumAfterTax: Math.round(cash - lumpSumTax),
    federalWithheld: Math.round(cash * WITHHOLDING_RATE),
    annualPayment: Math.round(annualPayment),
    annuityAfterTaxPerYear: Math.round(annualPayment - annuityTaxPerYear),
    annuityAfterTaxTotal: Math.round((annualPayment - annuityTaxPerYear) * 30),
  };
}

/* ------------------------------ W-2G reconcile ----------------------------- */

export interface W2GResult {
  winnings: number;
  federalWithheld: number;
  actualFederalTax: number;
  /** Positive = refund of over-withholding; negative = balance still owed. */
  difference: number;
}

/**
 * Reconcile the 24% withheld on a W-2G against the actual federal tax the winnings
 * cause. The flat 24% often under- or over-withholds depending on your bracket,
 * so the W-2G is a prepayment, not the final tax.
 */
export function w2gReconcile(
  winnings: number, otherIncome: number, losses: number, status = 'single', otherItemized = 0, withheld?: number,
): W2GResult {
  const w = Math.max(0, winnings);
  const g = gamblingTax(w, losses, otherIncome, status, otherItemized, '', 0);
  const federalWithheld = withheld ?? Math.round(w * WITHHOLDING_RATE);
  return {
    winnings: w,
    federalWithheld,
    actualFederalTax: Math.round(g.federalTaxOnWinnings),
    difference: federalWithheld - Math.round(g.federalTaxOnWinnings),
  };
}

/* --------------------------- professional gambler -------------------------- */

export interface ProGamblerResult {
  /** Casual: itemized loss deduction (90%), no expenses, no SE tax. */
  casualTax: number;
  /** Professional: Schedule C — losses (90%) and expenses deductible, but SE tax on net. */
  professionalIncomeTax: number;
  professionalSeTax: number;
  professionalTotalTax: number;
  netProfit: number;
  betterAsProfessional: boolean;
}

/**
 * Casual vs professional gambler. A casual gambler reports winnings as income and
 * can only itemize losses (at 90%, capped at winnings). A professional reports on
 * Schedule C, deducting losses (still 90%-capped) AND business expenses — but pays
 * self-employment tax on the net profit. Which wins depends on expenses and whether
 * you would itemize anyway.
 */
export function professionalGambler(
  winnings: number, losses: number, expenses: number, otherIncome: number, status = 'single', stateCode = '',
): ProGamblerResult {
  const w = Math.max(0, winnings);
  const l = Math.max(0, losses);
  const exp = Math.max(0, expenses);
  const deductibleLosses = Math.min(LOSS_RATE * l, w);

  // Casual: winnings as income, losses itemized (assume they itemize for the comparison).
  const casual = gamblingTax(w, l, otherIncome, status, 0, stateCode, 0);
  const casualTax = casual.federalTaxOnWinnings + casual.stateTaxOnWinnings;

  // Professional: net profit on Schedule C, then SE + income tax.
  const netProfit = Math.max(0, w - deductibleLosses - exp);
  const se = calcSETax(netProfit, undefined, 0, status);
  const std = getStandardDeduction(status, false);
  const fedWith = calcFederalTax(Math.max(0, otherIncome + netProfit - se.deductibleHalf - std), status);
  const fedWithout = calcFederalTax(Math.max(0, otherIncome - std), status);
  const professionalIncomeTax = Math.max(0, fedWith - fedWithout)
    + (stateCode ? Math.max(0, calcStateTax(otherIncome + netProfit - se.deductibleHalf, stateCode, undefined, status).tax - calcStateTax(otherIncome, stateCode, undefined, status).tax) : 0);
  const professionalTotalTax = professionalIncomeTax + se.totalSE;

  return {
    casualTax: Math.round(casualTax),
    professionalIncomeTax: Math.round(professionalIncomeTax),
    professionalSeTax: Math.round(se.totalSE),
    professionalTotalTax: Math.round(professionalTotalTax),
    netProfit,
    betterAsProfessional: professionalTotalTax < casualTax,
  };
}

/* --------------------- gambling's knock-on effects ------------------------- */

export interface SSImpactResult {
  taxableSSWithout: number;
  taxableSSWith: number;
  /** Extra Social Security dragged into tax purely by the gambling win. */
  extraTaxableSS: number;
}

/** How a gambling win raises the taxable portion of Social Security benefits. */
export function gamblingSocialSecurityImpact(
  winnings: number, otherAGI: number, annualSocialSecurity: number, status = 'single',
): SSImpactResult {
  const ssStatus = status === 'mfj' ? 'mfj' : 'single';
  const without = calcSSDITaxable(annualSocialSecurity, otherAGI, 0, ssStatus).taxable;
  const withWin = calcSSDITaxable(annualSocialSecurity, otherAGI + Math.max(0, winnings), 0, ssStatus).taxable;
  return {
    taxableSSWithout: Math.round(without),
    taxableSSWith: Math.round(withWin),
    extraTaxableSS: Math.round(withWin - without),
  };
}

export interface ACAImpactResult {
  subsidyWithout: number;
  subsidyWith: number;
  /** Subsidy lost because the win raised MAGI (can be the whole subsidy at the cliff). */
  subsidyLost: number;
  overCliff: boolean;
}

/** How a gambling win cuts an ACA premium subsidy by raising MAGI. */
export function gamblingACAImpact(
  winnings: number, baseMAGI: number, householdSize: number, monthlyBenchmarkPremium: number,
): ACAImpactResult {
  const without = calcACASubsidy(baseMAGI, householdSize, monthlyBenchmarkPremium);
  const withWin = calcACASubsidy(baseMAGI + Math.max(0, winnings), householdSize, monthlyBenchmarkPremium);
  return {
    subsidyWithout: Math.round(without.subsidy),
    subsidyWith: Math.round(withWin.subsidy),
    subsidyLost: Math.round(without.subsidy - withWin.subsidy),
    overCliff: !withWin.eligible && without.eligible,
  };
}
