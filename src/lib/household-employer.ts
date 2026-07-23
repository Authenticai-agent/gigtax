/**
 * The "nanny tax" — Schedule H household-employer taxes.
 *
 * Hire someone to work in your home (nanny, housekeeper, caregiver) and you are
 * their employer. Once cash wages cross the household threshold you owe employer
 * Social Security and Medicare, federal unemployment tax (FUTA), and state
 * unemployment tax (SUTA), and you withhold the employee's own FICA share. It is
 * all reported on Schedule H with your Form 1040.
 *
 * Every federal figure is from the dataset: the FICA rates and wage base from the
 * self-employment block (halved to the one-sided employer/employee share), the
 * FUTA constants from federal.futa, and the reporting threshold from
 * federal.householdEmployer. Only the state SUTA rate and wage base are inputs,
 * because those genuinely vary by state and by the employer's experience rating.
 */
import { federal, entityTypes } from '../data/federal';

const se = (federal as any).selfEmployment;
const futa = (federal as any).futa;
const household = (entityTypes as any).householdEmployer;

/** One-sided (employer or employee) rates — half the combined SE rates. */
export const SS_RATE = se.socialSecurityRate / 2; // 6.2%
export const MEDICARE_RATE = se.medicareRate / 2; // 1.45%
export const SS_WAGE_BASE: number = se.socialSecurityWageBase;
export const HOUSEHOLD_THRESHOLD: number = household.threshold2026;

export interface NannyInput {
  wages: number;
  tips: number;
  fedWithheld: number;
  stateWithheld: number;
  /** State unemployment tax rate as a decimal (e.g. 0.034). */
  sutaRate: number;
  sutaWageBase: number;
  /** Whether state unemployment tax was paid on time — earns the full 5.4% FUTA credit. */
  sutaPaidOnTime: boolean;
  /** Extra FUTA owed as a decimal if the state is a credit-reduction state (usually 0). */
  futaCreditReduction: number;
}

export interface NannyResult {
  totalWages: number;
  meetsThreshold: boolean;
  employerSS: number;
  employerMedicare: number;
  employerFICA: number;
  futaTax: number;
  effectiveFutaRate: number;
  sutaTax: number;
  totalEmployerTaxes: number;
  totalCostToEmployer: number;
  employeeFICA: number;
  totalWithheldFromEmployee: number;
}

export function nannyTax(input: NannyInput): NannyResult {
  const { wages, tips, fedWithheld, stateWithheld, sutaRate, sutaWageBase, sutaPaidOnTime, futaCreditReduction } = input;
  const totalWages = wages + tips;

  const ssWages = Math.min(totalWages, SS_WAGE_BASE);
  const employerSS = ssWages * SS_RATE;
  const employerMedicare = totalWages * MEDICARE_RATE; // no wage cap on Medicare
  const employerFICA = employerSS + employerMedicare;

  // FUTA: 6% on the first $7,000. An employer who pays state unemployment tax on
  // time earns the full 5.4% credit — leaving the net 0.6% — regardless of the
  // state's own rate. Miss the state deadline and the full 6% applies. A
  // credit-reduction state adds its reduction back on top.
  const futaWages = Math.min(totalWages, futa.wageBase);
  const effectiveFutaRate = sutaPaidOnTime
    ? futa.netRateWithFullCredit + futaCreditReduction
    : futa.rate;
  const futaTax = futaWages * effectiveFutaRate;

  const sutaTax = Math.min(totalWages, sutaWageBase) * sutaRate;

  const totalEmployerTaxes = employerFICA + futaTax + sutaTax;
  const totalCostToEmployer = totalWages + totalEmployerTaxes;

  // The employee's own half of FICA is withheld from their pay, not added on top.
  const employeeFICA = ssWages * SS_RATE + totalWages * MEDICARE_RATE;
  const totalWithheldFromEmployee = employeeFICA + fedWithheld + stateWithheld;

  return {
    totalWages,
    meetsThreshold: totalWages >= HOUSEHOLD_THRESHOLD,
    employerSS,
    employerMedicare,
    employerFICA,
    futaTax,
    effectiveFutaRate,
    sutaTax,
    totalEmployerTaxes,
    totalCostToEmployer,
    employeeFICA,
    totalWithheldFromEmployee,
  };
}
