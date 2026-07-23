/**
 * Gig economics — mileage deduction, vehicle cost, and per-hour/per-mile unit
 * economics. No income tax enters these: they are the "is this gig worth it"
 * numbers a driver needs before tax. The mileage deduction reads the 2026 IRS
 * rates from the dataset, which has TWO business rates this year — 72.5 cents to
 * June 30 and 76 cents from July 1 — so a full year is split at that date.
 */
import { selfEmploymentDeductions } from '../data/federal';

const MILEAGE = (selfEmploymentDeductions as any).mileage;
export const MILEAGE_RATE_H1 = MILEAGE.businessRatePerMile as number;         // Jan 1 – Jun 30
export const MILEAGE_RATE_H2 = MILEAGE.businessRatePerMileFromJul1 as number; // Jul 1 – Dec 31

export interface MileageResult {
  milesFirstHalf: number;
  milesSecondHalf: number;
  deductionFirstHalf: number;
  deductionSecondHalf: number;
  totalMiles: number;
  totalDeduction: number;
  /** Blended rate across the whole year's miles. */
  blendedRate: number;
}

/**
 * Standard mileage deduction for 2026, splitting miles at the July 1 rate change.
 * Miles driven January–June use 72.5 cents; July–December use 76 cents.
 */
export function mileageDeduction(milesFirstHalf: number, milesSecondHalf: number): MileageResult {
  const h1 = Math.max(0, milesFirstHalf);
  const h2 = Math.max(0, milesSecondHalf);
  const dH1 = h1 * MILEAGE_RATE_H1;
  const dH2 = h2 * MILEAGE_RATE_H2;
  const totalMiles = h1 + h2;
  const totalDeduction = dH1 + dH2;
  return {
    milesFirstHalf: h1, milesSecondHalf: h2,
    deductionFirstHalf: dH1, deductionSecondHalf: dH2,
    totalMiles, totalDeduction,
    blendedRate: totalMiles > 0 ? totalDeduction / totalMiles : 0,
  };
}

/* ------------------------------- vehicle cost ------------------------------ */

export interface VehicleCostResult {
  fuelCost: number;
  totalCost: number;
  costPerMile: number;
  /** The standard-mileage deduction those miles would produce (H2 rate). */
  standardDeductionValue: number;
  /** Positive means actual cost exceeds the standard deduction — you spend more than you can deduct at the flat rate. */
  costOverStandard: number;
}

/**
 * What it actually costs to drive a mile: fuel plus maintenance, insurance,
 * depreciation and anything else, over the miles driven. Compared against the
 * standard mileage deduction those miles earn, which is how a driver decides
 * whether the standard rate covers their real costs.
 */
export function vehicleCost(
  milesPerYear: number,
  mpg: number,
  gasPricePerGallon: number,
  maintenancePerYear = 0,
  insurancePerYear = 0,
  depreciationPerYear = 0,
  otherPerYear = 0,
): VehicleCostResult {
  const miles = Math.max(0, milesPerYear);
  const fuelCost = mpg > 0 ? (miles / mpg) * Math.max(0, gasPricePerGallon) : 0;
  const totalCost = fuelCost + Math.max(0, maintenancePerYear) + Math.max(0, insurancePerYear)
    + Math.max(0, depreciationPerYear) + Math.max(0, otherPerYear);
  const standardDeductionValue = miles * MILEAGE_RATE_H2;
  return {
    fuelCost,
    totalCost,
    costPerMile: miles > 0 ? totalCost / miles : 0,
    standardDeductionValue,
    costOverStandard: totalCost - standardDeductionValue,
  };
}

/* --------------------------- gig unit economics ---------------------------- */

export interface GigUnitResult {
  grossEarnings: number;
  mileageDeduction: number;
  otherExpenses: number;
  netProfit: number;
  /** Gross earnings per hour, before any expense. */
  grossPerHour: number;
  /** Net profit per hour, after the mileage deduction and other expenses. */
  netPerHour: number;
  /** Net profit per mile driven. */
  netPerMile: number;
  /** Suggested tax set-aside (30% of net profit, the mid of the 25–35% rule). */
  suggestedSetAside: number;
  /** Net profit after the suggested set-aside — what is really yours. */
  afterSetAsidePerHour: number;
}

/**
 * The unit economics of gig work: what an hour and a mile actually pay once the
 * mileage deduction and other costs come out. The mileage deduction here doubles
 * as an expense estimate — for a driver, the standard rate is a fair proxy for
 * real per-mile cost — and the set-aside line is the 30% mid-point of the usual
 * 25–35% guidance, so the "net per hour" is what survives taxes too.
 */
export function gigUnitEconomics(
  grossEarnings: number,
  hoursWorked: number,
  milesFirstHalf: number,
  milesSecondHalf: number,
  otherExpenses = 0,
): GigUnitResult {
  const gross = Math.max(0, grossEarnings);
  const hours = Math.max(0, hoursWorked);
  const mileage = mileageDeduction(milesFirstHalf, milesSecondHalf);
  const other = Math.max(0, otherExpenses);
  const netProfit = Math.max(0, gross - mileage.totalDeduction - other);
  const setAside = netProfit * 0.30;
  return {
    grossEarnings: gross,
    mileageDeduction: mileage.totalDeduction,
    otherExpenses: other,
    netProfit,
    grossPerHour: hours > 0 ? gross / hours : 0,
    netPerHour: hours > 0 ? netProfit / hours : 0,
    netPerMile: mileage.totalMiles > 0 ? netProfit / mileage.totalMiles : 0,
    suggestedSetAside: setAside,
    afterSetAsidePerHour: hours > 0 ? (netProfit - setAside) / hours : 0,
  };
}

/* --------------------------- trucking cost per mile ------------------------ */

export interface TruckingResult {
  fuelCostPerMile: number;
  variableCostPerMile: number;
  fixedCostPerMile: number;
  totalCostPerMile: number;
  netPerMile: number;
  annualRevenue: number;
  annualCost: number;
  annualNet: number;
}

/**
 * Owner-operator trucking economics: revenue per mile against the real cost per
 * mile. Fuel is diesel price over miles-per-gallon; maintenance is a per-mile
 * figure; insurance, the truck payment and other fixed costs are spread across
 * the year's miles. The net-per-mile is the number that decides whether a load
 * or a lane pays — the freight rate alone never does.
 */
export function truckingCostPerMile(
  milesPerYear: number,
  revenuePerMile: number,
  mpg: number,
  dieselPricePerGallon: number,
  maintenancePerMile: number,
  insurancePerYear: number,
  truckPaymentPerYear: number,
  otherFixedPerYear: number,
): TruckingResult {
  const miles = Math.max(0, milesPerYear);
  const fuelCostPerMile = mpg > 0 ? Math.max(0, dieselPricePerGallon) / mpg : 0;
  const variableCostPerMile = fuelCostPerMile + Math.max(0, maintenancePerMile);
  const fixedPerYear = Math.max(0, insurancePerYear) + Math.max(0, truckPaymentPerYear) + Math.max(0, otherFixedPerYear);
  const fixedCostPerMile = miles > 0 ? fixedPerYear / miles : 0;
  const totalCostPerMile = variableCostPerMile + fixedCostPerMile;
  const rev = Math.max(0, revenuePerMile);
  return {
    fuelCostPerMile,
    variableCostPerMile,
    fixedCostPerMile,
    totalCostPerMile,
    netPerMile: rev - totalCostPerMile,
    annualRevenue: rev * miles,
    annualCost: totalCostPerMile * miles,
    annualNet: (rev - totalCostPerMile) * miles,
  };
}
