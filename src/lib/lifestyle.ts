/**
 * Lifestyle calculators — the money behind life events: a baby, a divorce,
 * eldercare, a financial mismatch between partners, and what an estate owes at
 * death.
 *
 * These are cost estimators built on standard arithmetic and time-value-of-money
 * math (see ./finance). The care-cost figures are labeled reference data, not
 * tax figures. The one calculator that touches tax — Death & Money — reuses the
 * verified estate-tax engines rather than reinventing any rate or exemption.
 */
import { futureValueLump, futureValueAnnuity } from './finance';
import { estateTax } from './estate';
import { stateEstateTax } from './state-death-tax';

/* --------------------------------------------------------- baby, year one - */

export interface BabyInput {
  delivery: number; prenatal: number; gear: number;
  diapersMonthly: number; formulaMonthly: number; childcareMonthly: number; otherMonthly: number;
  salary: number; salaryReducedPct: number; monthsOut: number; investmentReturn: number;
}
export interface BabyResult {
  oneOff: number; annualized: number; lostIncome: number; totalFirstYear: number;
  opportunityCost10yr: number;
}

/** True first-year cost of a baby: one-off costs, a year of recurring costs, and lost income. */
export function babyFirstYear(i: BabyInput): BabyResult {
  const oneOff = i.delivery + i.prenatal + i.gear;
  const annualized = (i.diapersMonthly + i.formulaMonthly + i.childcareMonthly + i.otherMonthly) * 12;
  const lostIncome = i.salary * i.salaryReducedPct * (i.monthsOut / 12);
  const totalFirstYear = oneOff + annualized + lostIncome;
  return {
    oneOff, annualized, lostIncome, totalFirstYear,
    // What that first-year money would have grown to in 10 years if invested instead.
    opportunityCost10yr: Math.round(futureValueLump(totalFirstYear, i.investmentReturn, 10) - totalFirstYear),
  };
}

/* --------------------------------------------------------------- divorce -- */

export interface DivorceInput {
  home: number; retirement: number; savings: number; otherAssets: number; debts: number;
  alimonyMonthly: number; alimonyYears: number; childMonthly: number; childYears: number;
  attorneyYou: number; attorneySpouse: number; mediator: number;
}
export interface DivorceResult {
  netMaritalEstate: number; yourAssetShare: number;
  totalAlimony: number; totalChildSupport: number; totalSupport: number;
  legalFees: number; totalCost: number;
}

/** The money side of a divorce: split assets, support obligations, and legal fees. */
export function divorceCost(i: DivorceInput): DivorceResult {
  const netMaritalEstate = i.home + i.retirement + i.savings + i.otherAssets - i.debts;
  const totalAlimony = i.alimonyMonthly * 12 * i.alimonyYears;
  const totalChildSupport = i.childMonthly * 12 * i.childYears;
  const legalFees = i.attorneyYou + i.attorneySpouse + i.mediator;
  return {
    netMaritalEstate,
    yourAssetShare: Math.round(netMaritalEstate / 2),
    totalAlimony, totalChildSupport, totalSupport: totalAlimony + totalChildSupport,
    legalFees,
    // The out-of-pocket cost to the paying side: your legal fees plus support.
    totalCost: i.attorneyYou + i.mediator / 2 + totalAlimony + totalChildSupport,
  };
}

/* ------------------------------------------------------------- eldercare -- */

/** Reference monthly costs by care type (US averages, illustrative). */
export const CARE_TYPES: Record<string, { name: string; monthly: number }> = {
  'inhome-pt': { name: 'In-home care (part-time)', monthly: 3200 },
  'inhome-ft': { name: 'In-home care (full-time)', monthly: 5800 },
  assisted: { name: 'Assisted living', monthly: 4800 },
  memory: { name: 'Memory care', monthly: 6800 },
  nursing: { name: 'Nursing home', monthly: 8800 },
};

/** Reference state cost tiers (multipliers on the national average). */
export const STATE_TIERS: Record<string, { name: string; mult: number }> = {
  low: { name: 'Low cost', mult: 0.70 },
  med: { name: 'Medium cost', mult: 0.90 },
  high: { name: 'High cost', mult: 1.10 },
  vhigh: { name: 'Very high cost', mult: 1.50 },
};

export interface EldercareResult {
  monthlyCost: number; annualCost: number; years: number; totalCost: number;
}

/** Projected total cost of care: type × state tier × years, inflated each year. */
export function eldercareCost(careType: string, stateTier: string, years: number, careInflation = 0.04): EldercareResult {
  const base = CARE_TYPES[careType]?.monthly ?? 0;
  const mult = STATE_TIERS[stateTier]?.mult ?? 1;
  const monthlyCost = Math.round(base * mult);
  const annualCost = monthlyCost * 12;
  let total = 0;
  for (let y = 0; y < years; y++) total += annualCost * Math.pow(1 + careInflation, y);
  return { monthlyCost, annualCost, years, totalCost: Math.round(total) };
}

/* ------------------------------------------------------- prenup mismatch -- */

export interface PrenupInput {
  aIncome: number; aAssets: number; aDebt: number;
  bIncome: number; bAssets: number; bDebt: number;
}
export interface PrenupResult {
  aNetWorth: number; bNetWorth: number; netWorthGap: number;
  incomeRatio: number; aDTI: number; bDTI: number;
  mismatchScore: number; band: 'aligned' | 'moderate' | 'wide';
}

/**
 * A financial-mismatch score between two partners (0 aligned → 100 very
 * different), from the income ratio, the net-worth gap, and each side's
 * debt-to-income. Higher means a prenup conversation is more worth having — it is
 * a discussion aid, not a verdict on a relationship.
 */
export function prenupMismatch(i: PrenupInput): PrenupResult {
  const aNetWorth = i.aAssets - i.aDebt;
  const bNetWorth = i.bAssets - i.bDebt;
  const netWorthGap = Math.abs(aNetWorth - bNetWorth);
  const incomeRatio = Math.min(i.aIncome, i.bIncome) / Math.max(i.aIncome, i.bIncome, 1);
  const aDTI = i.aDebt / Math.max(i.aIncome, 1);
  const bDTI = i.bDebt / Math.max(i.bIncome, 1);

  // Each factor contributes up to a set number of points.
  const incomePts = (1 - incomeRatio) * 40;                 // 0 (equal) → 40 (one earns all)
  const gapPts = Math.min(30, netWorthGap / 10000);         // $300k gap → 30
  const dtiPts = Math.min(30, (Math.max(aDTI, bDTI)) * 30); // DTI of 1.0 → 30
  const mismatchScore = Math.round(Math.max(0, Math.min(100, incomePts + gapPts + dtiPts)));

  return {
    aNetWorth, bNetWorth, netWorthGap, incomeRatio, aDTI, bDTI, mismatchScore,
    band: mismatchScore <= 30 ? 'aligned' : mismatchScore <= 60 ? 'moderate' : 'wide',
  };
}

/* ------------------------------------------------------- death & money ---- */

export interface DeathMoneyInput {
  netWorth: number; annualSavings: number; investmentReturn: number;
  currentAge: number; deathAge: number; charity: number; stateCode: string;
  priorExemptionUsed: number;
}
export interface DeathMoneyResult {
  projectedEstate: number; charity: number; taxableEstate: number;
  federalEstateTax: number; stateEstateTax: number; totalDeathTax: number;
  netToHeirs: number; owesFederal: boolean;
}

/**
 * Projects net worth forward to death, then runs it through the verified estate
 * engines — the federal $15M exclusion and 40% rate, plus any state estate tax —
 * so the figures agree with the estate and state-estate calculators. It answers
 * "will my estate owe tax someday?", which the point-in-time estate calculator does not.
 */
export function deathAndMoney(i: DeathMoneyInput): DeathMoneyResult {
  const years = Math.max(0, i.deathAge - i.currentAge);
  const projectedEstate = Math.round(
    futureValueLump(i.netWorth, i.investmentReturn, years) + futureValueAnnuity(i.annualSavings / 12, i.investmentReturn, years),
  );
  const afterCharity = Math.max(0, projectedEstate - i.charity);
  const fed = estateTax(afterCharity, i.priorExemptionUsed, 0);
  const state = stateEstateTax(i.stateCode, afterCharity);
  const totalDeathTax = fed.estimatedTax + state.estimatedTax;
  return {
    projectedEstate,
    charity: i.charity,
    taxableEstate: fed.taxableEstate,
    federalEstateTax: fed.estimatedTax,
    stateEstateTax: state.estimatedTax,
    totalDeathTax,
    netToHeirs: projectedEstate - i.charity - totalDeathTax,
    owesFederal: fed.owesTax,
  };
}
