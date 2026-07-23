/**
 * Second-income breakeven. When a second earner in a household takes a job, the
 * income is taxed on top of the first — at the household's marginal rate, not
 * from zero — and then childcare, commuting and work costs come out. What is
 * left can be a small fraction of the salary. This composes the tax engine to
 * show the real keep-rate.
 */
import { calcFederalTax, calcStateTax, getStandardDeduction } from './tax-engine';

const FICA_RATE = 0.0765; // employee Social Security + Medicare on wages

export interface SecondIncomeResult {
  secondIncome: number;
  fica: number;
  marginalFederalTax: number;
  marginalStateTax: number;
  childcareCost: number;
  workCosts: number;
  /** Total tax on the second income (FICA + marginal federal + marginal state). */
  totalTax: number;
  /** What actually stays after tax and the costs of working. */
  netKept: number;
  /** Net kept as a share of the gross second income. */
  keepRate: number;
  /** Effective all-in rate the second income faces (tax + costs). */
  effectiveBurden: number;
  worthIt: boolean;
}

/**
 * The take-home reality of a second household income. The second salary stacks on
 * the first, so its federal and state tax are the marginal difference the second
 * income adds; FICA is a flat 7.65% on the wages. Childcare and other work costs
 * are then subtracted. The keep-rate is the honest figure for the "is it worth it"
 * decision.
 */
export function secondIncomeBreakeven(
  firstIncome: number, secondIncome: number, status = 'mfj', stateCode = '',
  childcareCost = 0, workCosts = 0,
): SecondIncomeResult {
  const first = Math.max(0, firstIncome);
  const second = Math.max(0, secondIncome);
  const std = getStandardDeduction(status, false);

  const fedWith = calcFederalTax(Math.max(0, first + second - std), status);
  const fedWithout = calcFederalTax(Math.max(0, first - std), status);
  const marginalFederalTax = Math.max(0, fedWith - fedWithout);

  const stateWith = stateCode ? calcStateTax(first + second, stateCode, undefined, status).tax : 0;
  const stateWithout = stateCode ? calcStateTax(first, stateCode, undefined, status).tax : 0;
  const marginalStateTax = Math.max(0, stateWith - stateWithout);

  const fica = second * FICA_RATE;
  const totalTax = fica + marginalFederalTax + marginalStateTax;
  const costs = Math.max(0, childcareCost) + Math.max(0, workCosts);
  const netKept = second - totalTax - costs;

  return {
    secondIncome: second,
    fica,
    marginalFederalTax,
    marginalStateTax,
    childcareCost: Math.max(0, childcareCost),
    workCosts: Math.max(0, workCosts),
    totalTax,
    netKept,
    keepRate: second > 0 ? netKept / second : 0,
    effectiveBurden: second > 0 ? (totalTax + costs) / second : 0,
    worthIt: netKept > 0,
  };
}
