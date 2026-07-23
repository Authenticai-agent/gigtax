/**
 * Personal-finance calculators — net worth, FIRE, retirement timing, the cost of
 * waiting, budgeting and the credit-card minimum-payment trap.
 *
 * These are money-planning tools, not tax computations. The math is standard
 * time-value-of-money (see ./finance), and every rate of return, inflation and
 * withdrawal assumption is caller-supplied and surfaced to the user as an
 * editable assumption. The one set of reference figures — Federal Reserve net
 * worth medians — is labeled as reference data, not a target.
 */
import { futureValueLump, futureValueAnnuity, payoffMonths, loanPayment } from './finance';

/* --------------------------------------------------------------- net worth -- */

/** Federal Reserve SCF median net worth by age band (reference, not a target). */
const NET_WORTH_BENCHMARKS = [
  { maxAge: 25, median: 12000, label: 'Under 25' },
  { maxAge: 35, median: 55000, label: '25–34' },
  { maxAge: 45, median: 150000, label: '35–44' },
  { maxAge: 55, median: 250000, label: '45–54' },
  { maxAge: 65, median: 300000, label: '55–64' },
  { maxAge: 75, median: 330000, label: '65–74' },
  { maxAge: 999, median: 300000, label: '75+' },
];

export interface NetWorthInput {
  cash: number; investments: number; homeValue: number; vehicles: number; otherAssets: number;
  mortgage: number; studentLoans: number; carLoans: number; creditCards: number; otherDebt: number;
  age: number;
}
export interface NetWorthResult {
  totalAssets: number; totalLiabilities: number; netWorth: number;
  benchmarkMedian: number; benchmarkLabel: string; vsMedian: number; aheadOfMedian: boolean;
}

export function netWorth(i: NetWorthInput): NetWorthResult {
  const totalAssets = i.cash + i.investments + i.homeValue + i.vehicles + i.otherAssets;
  const totalLiabilities = i.mortgage + i.studentLoans + i.carLoans + i.creditCards + i.otherDebt;
  const nw = totalAssets - totalLiabilities;
  const bench = NET_WORTH_BENCHMARKS.find((b) => i.age <= b.maxAge) ?? NET_WORTH_BENCHMARKS[NET_WORTH_BENCHMARKS.length - 1];
  return {
    totalAssets, totalLiabilities, netWorth: nw,
    benchmarkMedian: bench.median, benchmarkLabel: bench.label,
    vsMedian: nw - bench.median, aheadOfMedian: nw >= bench.median,
  };
}

/* ------------------------------------------------------ FIRE / retirement -- */

export interface ProjectionInput {
  currentAge: number;
  currentSavings: number;
  monthlyContribution: number;
  annualReturn: number;
  /** Annual spending in retirement (drives the nest-egg target via the SWR). */
  annualExpenses: number;
  /** Safe withdrawal rate, e.g. 0.04 for the 4% rule. */
  withdrawalRate: number;
}
export interface ProjectionResult {
  target: number;
  yearsToTarget: number;
  ageAtTarget: number;
  projectedAtTarget: number;
  /** True if never reached within a 70-year horizon. */
  unreachable: boolean;
}

/**
 * Years until a portfolio (starting balance plus monthly contributions, all
 * compounding at the assumed return) reaches the nest-egg target — the number of
 * years of expenses implied by the withdrawal rate. This is the shared core for
 * both the FIRE and "when can I retire" pages.
 */
export function projectToTarget(i: ProjectionInput): ProjectionResult {
  const target = i.withdrawalRate > 0 ? i.annualExpenses / i.withdrawalRate : Infinity;
  for (let years = 0; years <= 70; years++) {
    const bal = futureValueLump(i.currentSavings, i.annualReturn, years)
      + futureValueAnnuity(i.monthlyContribution, i.annualReturn, years);
    if (bal >= target) {
      return { target, yearsToTarget: years, ageAtTarget: i.currentAge + years, projectedAtTarget: bal, unreachable: false };
    }
  }
  const bal70 = futureValueLump(i.currentSavings, i.annualReturn, 70) + futureValueAnnuity(i.monthlyContribution, i.annualReturn, 70);
  return { target, yearsToTarget: Infinity, ageAtTarget: Infinity, projectedAtTarget: bal70, unreachable: true };
}

/* ------------------------------------------- cost of procrastinating ------- */

export interface ProcrastinationResult {
  ifStartNow: number;
  ifDelayed: number;
  costOfWaiting: number;
  contributedNow: number;
  contributedDelayed: number;
}

/**
 * What waiting to invest costs. Same monthly amount and return, but a later start
 * means fewer years of compounding — the gap is the price of the delay.
 */
export function procrastinationCost(monthly: number, annualReturn: number, yearsHorizon: number, delayYears: number): ProcrastinationResult {
  const ifStartNow = futureValueAnnuity(monthly, annualReturn, yearsHorizon);
  const investingYears = Math.max(0, yearsHorizon - delayYears);
  const ifDelayed = futureValueAnnuity(monthly, annualReturn, investingYears);
  return {
    ifStartNow,
    ifDelayed,
    costOfWaiting: ifStartNow - ifDelayed,
    contributedNow: monthly * 12 * yearsHorizon,
    contributedDelayed: monthly * 12 * investingYears,
  };
}

/* --------------------------------------------------------- 50/30/20 budget - */

export interface BudgetResult {
  needs: number; wants: number; savings: number;
  needsOver: number; wantsOver: number;
  /** Actual savings vs the 20% target, if actuals were supplied. */
  savingsGap: number;
}

/** The 50/30/20 rule on monthly take-home pay, optionally vs actual spending. */
export function budget503020(monthlyTakeHome: number, actualNeeds = -1, actualWants = -1): BudgetResult {
  const needs = monthlyTakeHome * 0.5;
  const wants = monthlyTakeHome * 0.3;
  const savings = monthlyTakeHome * 0.2;
  const hasActuals = actualNeeds >= 0 && actualWants >= 0;
  const actualSavings = hasActuals ? monthlyTakeHome - actualNeeds - actualWants : savings;
  return {
    needs, wants, savings,
    needsOver: hasActuals ? Math.max(0, actualNeeds - needs) : 0,
    wantsOver: hasActuals ? Math.max(0, actualWants - wants) : 0,
    savingsGap: hasActuals ? savings - actualSavings : 0,
  };
}

/* ---------------------------------------------------- credit-card trap ----- */

export interface CardTrapResult {
  minPayment: number;
  minMonths: number;
  minTotalInterest: number;
  fixedMonths: number;
  fixedTotalInterest: number;
  monthsSaved: number;
  interestSaved: number;
  neverPaysOff: boolean;
}

/**
 * The minimum-payment trap: paying a small percent of the balance each month
 * stretches a card for years. Compares the minimum (a percent of the balance,
 * floored at a dollar minimum) against a fixed higher payment.
 */
export function creditCardTrap(balance: number, apr: number, minPct: number, fixedPayment: number): CardTrapResult {
  const minPayment = Math.max(balance * minPct, 25);
  const minMonths = payoffMonths(balance, apr, minPayment);
  const fixedMonths = payoffMonths(balance, apr, fixedPayment);
  // Minimum payment shrinks with the balance; approximate its interest with a
  // level payment equal to the starting minimum, which understates it slightly.
  const minTotalInterest = Number.isFinite(minMonths) ? minPayment * minMonths - balance : Infinity;
  const fixedTotalInterest = Number.isFinite(fixedMonths) ? fixedPayment * fixedMonths - balance : Infinity;
  return {
    minPayment, minMonths, minTotalInterest, fixedMonths, fixedTotalInterest,
    monthsSaved: Number.isFinite(minMonths) && Number.isFinite(fixedMonths) ? minMonths - fixedMonths : Infinity,
    interestSaved: Number.isFinite(minTotalInterest) && Number.isFinite(fixedTotalInterest) ? minTotalInterest - fixedTotalInterest : Infinity,
    neverPaysOff: !Number.isFinite(minMonths),
  };
}

/* ------------------------------------------------------- buy vs rent ------ */

export interface BuyVsRentInput {
  homePrice: number; downPaymentPct: number; mortgageRate: number; termYears: number;
  monthlyRent: number; homeAppreciation: number; investmentReturn: number;
  propertyTaxPct: number; maintenancePct: number; rentInflation: number; years: number;
}
export interface BuyVsRentResult {
  monthlyPayment: number;
  breakEvenYear: number | null;
  buyCostAtHorizon: number;
  rentCostAtHorizon: number;
  cheaperAtHorizon: 'buy' | 'rent';
  yearly: { year: number; buyCost: number; rentCost: number }[];
}

/**
 * Buy-vs-rent break-even. "Cost" is what each path consumes: for buying, all
 * ownership outlays less the equity recovered on sale; for renting, rent paid
 * less the growth on the down payment invested instead. The break-even is the
 * first year buying costs no more than renting. Monthly cash-flow differences
 * are not reinvested — a stated simplification the copy names.
 */
export function buyVsRent(i: BuyVsRentInput): BuyVsRentResult {
  const downPayment = i.homePrice * i.downPaymentPct;
  const closing = i.homePrice * 0.03;
  const loan = i.homePrice - downPayment;
  const monthlyPayment = loanPayment(loan, i.mortgageRate, i.termYears * 12);
  const mRate = i.mortgageRate / 12;
  const initialInvest = downPayment + closing;

  let remaining = loan, homeValue = i.homePrice, rent = i.monthlyRent;
  let ownershipPaid = downPayment + closing, rentPaid = 0, invest = initialInvest;
  const yearly: BuyVsRentResult['yearly'] = [];
  let breakEvenYear: number | null = null;

  for (let y = 1; y <= i.years; y++) {
    for (let m = 0; m < 12; m++) {
      const interest = remaining * mRate;
      const principal = Math.min(remaining, Math.max(0, monthlyPayment - interest));
      const payingMortgage = remaining > 0;
      remaining = Math.max(0, remaining - principal);
      const monthlyOwn = (payingMortgage ? monthlyPayment : 0) + homeValue * (i.propertyTaxPct + i.maintenancePct) / 12;
      ownershipPaid += monthlyOwn;
      rentPaid += rent;
      invest *= 1 + i.investmentReturn / 12;
    }
    homeValue *= 1 + i.homeAppreciation;
    rent *= 1 + i.rentInflation;
    const equity = homeValue - remaining - homeValue * 0.06; // net of 6% selling costs
    const buyCost = ownershipPaid - equity;
    const rentCost = rentPaid - (invest - initialInvest);
    yearly.push({ year: y, buyCost: Math.round(buyCost), rentCost: Math.round(rentCost) });
    if (breakEvenYear === null && buyCost <= rentCost) breakEvenYear = y;
  }

  const last = yearly[yearly.length - 1];
  return {
    monthlyPayment,
    breakEvenYear,
    buyCostAtHorizon: last.buyCost,
    rentCostAtHorizon: last.rentCost,
    cheaperAtHorizon: last.buyCost <= last.rentCost ? 'buy' : 'rent',
    yearly,
  };
}

/* --------------------------------------------------------- college ROI ---- */

export interface CollegeROIInput {
  degreeCost: number; yearsToComplete: number; startingSalary: number; salaryGrowth: number;
  altPathCost: number; altStartingSalary: number; careerYears: number;
}
export interface CollegeROIResult {
  degreeLifetime: number; altLifetime: number; netGain: number;
  roi: number; breakEvenYear: number | null;
}

/** Lifetime earnings with a degree (starting later, minus its cost) vs an alternative path. */
export function collegeROI(i: CollegeROIInput): CollegeROIResult {
  let degCum = -i.degreeCost, altCum = -i.altPathCost;
  let breakEvenYear: number | null = null;
  for (let t = 0; t < i.careerYears; t++) {
    if (t >= i.yearsToComplete) degCum += i.startingSalary * Math.pow(1 + i.salaryGrowth, t - i.yearsToComplete);
    altCum += i.altStartingSalary * Math.pow(1 + i.salaryGrowth, t);
    if (breakEvenYear === null && degCum >= altCum && t >= i.yearsToComplete) breakEvenYear = t + 1;
  }
  return {
    degreeLifetime: Math.round(degCum), altLifetime: Math.round(altCum),
    netGain: Math.round(degCum - altCum),
    roi: i.degreeCost > 0 ? (degCum - altCum) / i.degreeCost : 0,
    breakEvenYear,
  };
}

/* ---------------------------------------------------- college savings gap - */

export interface CollegeSavingsInput {
  annualCostToday: number; yearsUntilCollege: number; yearsOfCollege: number;
  educationInflation: number; currentSavings: number; monthlyContribution: number; annualReturn: number;
}
export interface CollegeSavingsResult {
  futureCost: number; projectedSavings: number; gap: number;
  monthlyToCloseGap: number; covered: number;
}

/** Projected 529-style savings vs the inflated future cost of N years of college. */
export function collegeSavingsGap(i: CollegeSavingsInput): CollegeSavingsResult {
  let futureCost = 0;
  for (let c = 0; c < i.yearsOfCollege; c++) {
    futureCost += i.annualCostToday * Math.pow(1 + i.educationInflation, i.yearsUntilCollege + c);
  }
  const projectedSavings = futureValueLump(i.currentSavings, i.annualReturn, i.yearsUntilCollege)
    + futureValueAnnuity(i.monthlyContribution, i.annualReturn, i.yearsUntilCollege);
  const gap = Math.max(0, futureCost - projectedSavings);
  // Extra monthly contribution whose future value closes the gap.
  const fvFactor = futureValueAnnuity(1, i.annualReturn, i.yearsUntilCollege);
  return {
    futureCost: Math.round(futureCost),
    projectedSavings: Math.round(projectedSavings),
    gap: Math.round(gap),
    monthlyToCloseGap: fvFactor > 0 ? Math.round(gap / fvFactor) : 0,
    covered: futureCost > 0 ? Math.min(1, projectedSavings / futureCost) : 1,
  };
}

/* ------------------------------------------------------ salary by city ---- */

export interface SalaryByCityResult {
  equivalentSalary: number; difference: number; ratio: number; keepsPurchasingPower: boolean;
}

/** Salary needed in a target city to match purchasing power, from cost-of-living indices. */
export function salaryByCity(currentSalary: number, fromIndex: number, toIndex: number): SalaryByCityResult {
  const equivalent = fromIndex > 0 ? currentSalary * (toIndex / fromIndex) : currentSalary;
  return {
    equivalentSalary: Math.round(equivalent),
    difference: Math.round(equivalent - currentSalary),
    ratio: fromIndex > 0 ? toIndex / fromIndex : 1,
    keepsPurchasingPower: toIndex <= fromIndex,
  };
}

/* ------------------------------------------------------ subscription audit  */

export interface SubscriptionResult {
  monthlyTotal: number; annualTotal: number; investedOverYears: number; years: number;
}

/** Total subscription spend, and what the same money could grow to if invested. */
export function subscriptionAudit(monthlyTotal: number, annualReturn: number, years: number): SubscriptionResult {
  return {
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    investedOverYears: Math.round(futureValueAnnuity(monthlyTotal, annualReturn, years)),
    years,
  };
}

export { loanPayment };
