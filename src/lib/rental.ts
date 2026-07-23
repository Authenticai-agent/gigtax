/**
 * Rental income tax — port of the rental calculator views. Gross rent less
 * operating expenses and straight-line depreciation is the net rental income;
 * a simple rental is Schedule E (no self-employment tax), while a short-term
 * rental with substantial services (an Airbnb that provides cleaning, meals,
 * concierge) is Schedule C and does owe SE tax. The 27.5-year residential
 * depreciation period is read from the dataset.
 */
import {
  calcSETax, calcQBI, calcFederalTax, calcStateTax, getStandardDeduction,
} from './tax-engine';
import { federal } from '../data/federal';

const DEPR_YEARS = (federal as any).residentialRentalDepreciationYears as number; // 27.5

export interface RentalResult {
  grossRent: number;
  depreciation: number;
  totalExpenses: number;
  /** Net rental income; negative is a loss (passive-loss limits may apply). */
  netIncome: number;
  seTax: number;
  incomeTax: number;
  stateTax: number;
  totalTax: number;
  afterTax: number;
  scheduleC: boolean;
}

/**
 * Annual tax on a rental. Depreciation is the building basis (not land) over
 * 27.5 years. On Schedule E the net income is taxed at ordinary rates with no SE
 * tax; on Schedule C (substantial services) SE tax applies to the profit.
 */
export function rentalIncome(
  grossRent: number,
  buildingBasis: number,
  mortgageInterest: number,
  propertyTax: number,
  insurance: number,
  repairs: number,
  managementAndOther: number,
  otherIncome: number,
  status = 'single',
  stateCode = '',
  scheduleC = false,
): RentalResult {
  const rent = Math.max(0, grossRent);
  const depreciation = Math.max(0, buildingBasis) / DEPR_YEARS;
  const totalExpenses = Math.max(0, mortgageInterest) + Math.max(0, propertyTax)
    + Math.max(0, insurance) + Math.max(0, repairs) + Math.max(0, managementAndOther) + depreciation;
  const netIncome = rent - totalExpenses;
  const netProfit = Math.max(0, netIncome);

  const se = scheduleC ? calcSETax(netProfit, undefined, 0, status) : { totalSE: 0, deductibleHalf: 0 };
  // Marginal income tax the net rental profit adds on top of the filer's other
  // income (QBI can apply to Schedule C / qualifying rental profit).
  const std = getStandardDeduction(status, false);
  const agiWith = otherIncome + netProfit - se.deductibleHalf;
  const agiWithout = otherIncome;
  const qbi = scheduleC ? calcQBI(netProfit, Math.max(0, agiWith - std), status) : 0;
  const taxWith = calcFederalTax(Math.max(0, agiWith - std - qbi), status);
  const taxWithout = calcFederalTax(Math.max(0, agiWithout - std), status);
  const incomeTax = Math.max(0, taxWith - taxWithout);

  const stateWith = stateCode ? calcStateTax(agiWith, stateCode, undefined, status).tax : 0;
  const stateWithout = stateCode ? calcStateTax(agiWithout, stateCode, undefined, status).tax : 0;
  const stateTax = Math.max(0, stateWith - stateWithout);

  const totalTax = se.totalSE + incomeTax + stateTax;
  return {
    grossRent: rent,
    depreciation,
    totalExpenses,
    netIncome,
    seTax: se.totalSE,
    incomeTax,
    stateTax,
    totalTax,
    afterTax: netIncome - totalTax,
    scheduleC,
  };
}
