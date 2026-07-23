/**
 * Retirement withdrawals and Roth conversions. A traditional-account withdrawal
 * is ordinary income, plus a 10% penalty before age 59½ (the penalty rate is in
 * the dataset). A Roth conversion is the same ordinary-income event on the
 * converted amount, with no penalty — the point being to fill up low brackets in
 * a low-income year. Both compose the tax engine; no rate is authored here.
 */
import {
  calcFederalTax, calcStateTax, getStandardDeduction, marginalRate,
} from './tax-engine';
import { retirement } from '../data/federal';

const PENALTY = (retirement as any).earlyWithdrawalPenalty as number; // 0.10
const PENALTY_FREE_AGE = 59.5;

function marginalOrdinaryTax(amount: number, otherIncome: number, status: string, stateCode: string) {
  const std = getStandardDeduction(status, false);
  const fedWith = calcFederalTax(Math.max(0, otherIncome + amount - std), status);
  const fedWithout = calcFederalTax(Math.max(0, otherIncome - std), status);
  const stateWith = stateCode ? calcStateTax(otherIncome + amount, stateCode, undefined, status).tax : 0;
  const stateWithout = stateCode ? calcStateTax(otherIncome, stateCode, undefined, status).tax : 0;
  return { federal: Math.max(0, fedWith - fedWithout), state: Math.max(0, stateWith - stateWithout) };
}

export interface WithdrawalResult {
  withdrawal: number;
  isRoth: boolean;
  taxableAmount: number;
  federalTax: number;
  stateTax: number;
  earlyPenalty: number;
  totalTax: number;
  netReceived: number;
  effectiveRate: number;
}

/**
 * Tax on a retirement-account withdrawal. Traditional: fully ordinary income,
 * plus a 10% early-withdrawal penalty if under 59½. Roth: tax-free if qualified.
 */
export function retirementWithdrawal(
  withdrawal: number, age: number, otherIncome: number, status = 'single', stateCode = '', isRoth = false,
): WithdrawalResult {
  const w = Math.max(0, withdrawal);
  if (isRoth) {
    return { withdrawal: w, isRoth: true, taxableAmount: 0, federalTax: 0, stateTax: 0, earlyPenalty: 0, totalTax: 0, netReceived: w, effectiveRate: 0 };
  }
  const t = marginalOrdinaryTax(w, otherIncome, status, stateCode);
  const earlyPenalty = age < PENALTY_FREE_AGE ? PENALTY * w : 0;
  const totalTax = t.federal + t.state + earlyPenalty;
  return {
    withdrawal: w, isRoth: false, taxableAmount: w,
    federalTax: t.federal, stateTax: t.state, earlyPenalty,
    totalTax, netReceived: w - totalTax,
    effectiveRate: w > 0 ? totalTax / w : 0,
  };
}

export interface RothConversionResult {
  conversionAmount: number;
  federalTax: number;
  stateTax: number;
  totalTax: number;
  /** Marginal federal bracket the top of the conversion lands in. */
  marginalBracket: number;
  effectiveRate: number;
  /** What the conversion costs out of pocket — you should pay this from outside the IRA. */
  outOfPocketCost: number;
}

/**
 * The tax cost of converting a traditional balance to Roth. The whole conversion
 * is ordinary income this year; there is no penalty. The marginal bracket line
 * is the lever — converting only enough to fill a low bracket keeps the rate down.
 */
export function rothConversion(
  conversionAmount: number, otherIncome: number, status = 'single', stateCode = '',
): RothConversionResult {
  const c = Math.max(0, conversionAmount);
  const t = marginalOrdinaryTax(c, otherIncome, status, stateCode);
  const totalTax = t.federal + t.state;
  const std = getStandardDeduction(status, false);
  return {
    conversionAmount: c,
    federalTax: t.federal,
    stateTax: t.state,
    totalTax,
    marginalBracket: marginalRate(Math.max(0, otherIncome + c - std), status),
    effectiveRate: c > 0 ? totalTax / c : 0,
    outOfPocketCost: totalTax,
  };
}
