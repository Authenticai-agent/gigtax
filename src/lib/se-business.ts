/**
 * Self-employed business tools that compose the tax engine: seller profit and
 * take-home, the freelance floor-rate solver, and self-employed retirement
 * contribution limits.
 *
 * sellerProfit and freelanceRate are ports of sellerCalculatorView and
 * freelanceRateView; seRetirement is new, driven by the solo-401(k) and SEP-IRA
 * limits in the dataset. No rate or limit is authored here.
 */
import {
  calcSETax, calcQBI, calcFederalTax, calcStateTax, getStandardDeduction,
} from './tax-engine';
import { retirement } from '../data/federal';

/* -------------------------------- seller ----------------------------------- */

export interface SellerResult {
  revenue: number;
  totalExpenses: number;
  netProfit: number;
  /** Profit after cost of goods only, over revenue. */
  grossMargin: number;
  /** Net profit over revenue. */
  netMargin: number;
  seTax: number;
  federalTax: number;
  stateTax: number;
  totalTax: number;
  takeHome: number;
}

/**
 * A seller's profit and take-home: revenue less cost of goods, platform fees,
 * shipping and other costs is the net profit, then self-employment tax, federal
 * and state income tax come out. Ported from sellerCalculatorView — the same
 * Schedule C profit the platform pages compute, with the margin surfaced.
 */
export function sellerProfit(
  revenue: number, cogs: number, platformFees: number, shipping: number,
  otherExpenses: number, stateCode: string, status = 'single',
): SellerResult {
  const rev = Math.max(0, revenue);
  const totalExpenses = Math.max(0, cogs) + Math.max(0, platformFees) + Math.max(0, shipping) + Math.max(0, otherExpenses);
  const netProfit = Math.max(0, rev - totalExpenses);

  const se = calcSETax(netProfit, undefined, 0, status);
  const agi = netProfit - se.deductibleHalf;
  const std = getStandardDeduction(status, false);
  const beforeQbi = Math.max(0, agi - std);
  const qbi = calcQBI(netProfit, beforeQbi, status);
  const taxable = Math.max(0, beforeQbi - qbi);
  const federalTax = calcFederalTax(taxable, status);
  const stateTax = stateCode ? calcStateTax(agi, stateCode, undefined, status).tax : 0;
  const totalTax = se.totalSE + federalTax + stateTax;

  return {
    revenue: rev,
    totalExpenses,
    netProfit,
    grossMargin: rev > 0 ? (rev - Math.max(0, cogs)) / rev : 0,
    netMargin: rev > 0 ? netProfit / rev : 0,
    seTax: se.totalSE,
    federalTax,
    stateTax,
    totalTax,
    takeHome: netProfit - totalTax,
  };
}

/* ------------------------------ freelance rate ----------------------------- */

interface TakeHome { revenue: number; takeHome: number; se: number; federal: number; state: number; netSE: number }

function computeTakeHome(revenue: number, expenses: number, stateCode: string, status: string): TakeHome {
  const netSE = Math.max(0, revenue - expenses);
  const se = calcSETax(netSE, undefined, 0, status);
  const agi = Math.max(0, netSE - se.deductibleHalf);
  const std = getStandardDeduction(status, false);
  const beforeQbi = Math.max(0, agi - std);
  const qbi = calcQBI(netSE, beforeQbi, status);
  const taxable = Math.max(0, beforeQbi - qbi);
  const federal = calcFederalTax(taxable, status);
  const state = stateCode ? calcStateTax(agi, stateCode, undefined, status).tax : 0;
  return { revenue, takeHome: revenue - expenses - (se.totalSE + federal + state), se: se.totalSE, federal, state, netSE };
}

export interface FreelanceRateResult {
  grossRevenue: number;
  hourlyRate: number;
  projectRate: number;
  annualBillableHours: number;
  seTax: number;
  federalTax: number;
  stateTax: number;
  takeHome: number;
}

/**
 * The floor hourly rate a freelancer must charge to keep a target take-home,
 * given expenses, taxes, weeks off and how many hours a week are actually
 * billable. Ported from freelanceRateView: it solves for the gross revenue whose
 * take-home hits the target (bisection), then divides by billable hours.
 */
export function freelanceRate(
  targetTakeHome: number, expenses: number, stateCode: string, status: string,
  weeksOff: number, hoursPerWeek: number, projectHours = 0,
): FreelanceRateResult {
  const target = Math.max(0, targetTakeHome);
  const exp = Math.max(0, expenses);
  const workingWeeks = Math.max(1, 52 - Math.max(0, weeksOff));
  const annualBillableHours = workingWeeks * Math.max(0, hoursPerWeek);

  // Bisection for the gross revenue whose take-home equals the target.
  let low = target + exp;
  let high = (target + exp) * 3;
  let best = low;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const res = computeTakeHome(mid, exp, stateCode, status);
    if (res.takeHome < target) low = mid;
    else { high = mid; best = mid; }
  }
  const r = computeTakeHome(best, exp, stateCode, status);
  const hourlyRate = annualBillableHours > 0 ? best / annualBillableHours : 0;
  return {
    grossRevenue: best,
    hourlyRate,
    projectRate: projectHours > 0 ? hourlyRate * projectHours : 0,
    annualBillableHours,
    seTax: r.se,
    federalTax: r.federal,
    stateTax: r.state,
    takeHome: r.takeHome,
  };
}

/* ---------------------------- SE retirement -------------------------------- */

const SOLO = (retirement as any).solo401k;
const SEP = (retirement as any).sep_ira;

export interface SERetirementResult {
  netProfit: number;
  seTaxDeductibleHalf: number;
  /** Net SE earnings — profit less half the SE tax — the base for the 20% rate. */
  netSEEarnings: number;
  employeeDeferralLimit: number;
  /** Solo 401(k): employee deferral you can make (capped by earnings). */
  soloEmployeeDeferral: number;
  /** The ~20%-of-net-earnings employer/profit-sharing piece (both plans). */
  employerContribution: number;
  soloTotal: number;
  sepTotal: number;
  combinedMax: number;
}

/**
 * How much a self-employed person can put into a solo 401(k) or a SEP-IRA. The
 * employer/profit-sharing piece is 20% of net SE earnings (profit minus half the
 * SE tax) — the SE equivalent of the 25% plan rate. A solo 401(k) adds an
 * employee deferral on top, up to the combined cap for the person's age; a SEP
 * has no employee deferral. Age drives the catch-up: 50–59 and the special
 * 60–63 window each have larger limits.
 */
export function seRetirement(netProfit: number, age = 40): SERetirementResult {
  const profit = Math.max(0, netProfit);
  const se = calcSETax(profit, undefined, 0);
  const netSEEarnings = Math.max(0, profit - se.deductibleHalf);

  // Employee deferral limit and combined cap by age band.
  let employeeDeferralLimit = SOLO.employeeLimit;
  let combinedMax = SOLO.combinedMaxUnder50;
  if (age >= 60 && age <= 63) {
    employeeDeferralLimit = SOLO.employeeLimit + SOLO.catchUp60to63;
    combinedMax = SOLO.combinedMax60to63;
  } else if (age >= 50) {
    employeeDeferralLimit = SOLO.employeeLimit + SOLO.catchUp50to59;
    combinedMax = SOLO.combinedMax50to59;
  }

  const employerContribution = 0.20 * netSEEarnings;
  const soloEmployeeDeferral = Math.min(employeeDeferralLimit, netSEEarnings);
  const soloTotal = Math.min(soloEmployeeDeferral + employerContribution, combinedMax);
  const sepTotal = Math.min(employerContribution, SEP.limit);

  return {
    netProfit: profit,
    seTaxDeductibleHalf: se.deductibleHalf,
    netSEEarnings,
    employeeDeferralLimit,
    soloEmployeeDeferral,
    employerContribution,
    soloTotal,
    sepTotal,
    combinedMax,
  };
}

/* ------------------------------- brand deal -------------------------------- */

export interface BrandDealResult {
  dealAmount: number;
  netSE: number;
  seTax: number;
  federalTax: number;
  stateTax: number;
  /** Tax the deal actually adds — SE tax plus the MARGINAL income tax on top of other income. */
  totalTax: number;
  afterTax: number;
  setAsidePct: number;
}

/**
 * Tax on a creator brand deal. The deal (cash plus the fair-market value of any
 * gifted product) is self-employment income: it owes SE tax and the marginal
 * income tax it adds on top of the creator's other income. Unlike the legacy
 * engine's calcBrandDeal, this reports the tax attributable to the deal, not the
 * whole household's tax, so "after-tax from the deal" means what it says.
 */
export function brandDeal(
  dealAmount: number, otherIncome: number, deductions: number, status = 'single', stateCode = '',
): BrandDealResult {
  const deal = Math.max(0, dealAmount);
  const netSE = Math.max(0, deal - Math.max(0, deductions));
  const se = calcSETax(netSE, undefined, 0, status);
  const std = getStandardDeduction(status, false);
  const agiWith = otherIncome + netSE - se.deductibleHalf;
  const qbi = calcQBI(netSE, Math.max(0, agiWith - std), status);
  const fedWith = calcFederalTax(Math.max(0, agiWith - std - qbi), status);
  const fedWithout = calcFederalTax(Math.max(0, otherIncome - std), status);
  const federalTax = Math.max(0, fedWith - fedWithout);
  const stateWith = stateCode ? calcStateTax(agiWith, stateCode, undefined, status).tax : 0;
  const stateWithout = stateCode ? calcStateTax(otherIncome, stateCode, undefined, status).tax : 0;
  const stateTax = Math.max(0, stateWith - stateWithout);
  const totalTax = se.totalSE + federalTax + stateTax;
  return {
    dealAmount: deal, netSE, seTax: se.totalSE, federalTax, stateTax, totalTax,
    afterTax: deal - totalTax,
    setAsidePct: deal > 0 ? totalTax / deal : 0,
  };
}

/** Re-exported so the 1099-K page imports its reconciliation from one place. */
export { reconcile1099K } from './tax-engine';
