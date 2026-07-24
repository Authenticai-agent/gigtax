/**
 * Severance tax engine (task_layoff.md Phase 2).
 *
 * The teaching point: withholding is not tax. Severance is supplemental wages, so
 * an employer withholds a flat 22% federally (37% above $1M) on a separate
 * payment — which over-withholds for people in the 10–22% brackets (refund at
 * filing) and under-withholds for people in the 32–37% brackets (set-aside
 * warning). This shows both the withholding and the estimated actual liability,
 * side by side, with the over/under delta.
 *
 * Every federal figure comes from the verified layoff data layer (which imports
 * the shared 2026 tax engine); state supplemental rates from the sourced
 * state_supplemental_tax.json. Nothing is authored here.
 */
import { calcFederalTax, calcStateTax, getStandardDeduction } from '../tax-engine';
import fed from '../../data/layoff/federal_2026.json';
import supTax from '../../data/layoff/state_supplemental_tax.json';

const F = (fed as any).imported_from_shared_engine;
const SUPP_UNDER_1M = F.supplemental_withholding_flat_under_1m.value;      // 0.22
const SUPP_OVER_1M = F.supplemental_withholding_mandatory_over_1m.value;   // 0.37
const SS_WAGE_BASE = F.social_security_wage_base_2026.value;               // 184,500
const SS_RATE = F.social_security_rate_employee.value;                     // 0.062
const MEDICARE_RATE = F.medicare_rate_employee.value;                      // 0.0145
const ADDL_MEDICARE_RATE = F.additional_medicare_rate.value;              // 0.009
const ONE_MILLION = 1_000_000;
const sup = supTax as Record<string, any>;

export type PaymentMode = 'separate' | 'combined' | 'installments';
export type FilingStatus = 'single' | 'mfj' | 'hoh' | 'mfs';

export interface SeveranceInput {
  severance: number;
  paymentMode: PaymentMode;
  stateCode: string;
  /** Prior YTD wages from the SAME employer — counts toward the $184,500 SS base. */
  ytdWages: number;
  filingStatus: FilingStatus;
  /** Expected other 2026 income — drives the marginal actual-liability estimate. */
  otherIncome: number;
}

export interface SeveranceResult {
  severance: number;
  paymentMode: PaymentMode;
  federalWithholding: number;
  federalWithholdingRate: number;
  socialSecurity: number;
  medicare: number;
  additionalMedicare: number;
  ficaTotal: number;
  stateWithholding: number;
  stateWithholdingMethod: string;
  totalWithheld: number;
  netCheck: number;
  /** What the severance actually costs in tax at this person's marginal rates. */
  estimatedActualLiability: number;
  /** Withheld income tax minus actual income-tax liability. Positive = over-withheld. */
  overUnderWithholding: number;
  verdict: string;
}

const taxable = (income: number, stdDed: number) => Math.max(0, income - stdDed);

/** Flat supplemental federal withholding on a separately-paid amount. */
function flatFederal(severance: number): number {
  if (severance > ONE_MILLION) return ONE_MILLION * SUPP_UNDER_1M + (severance - ONE_MILLION) * SUPP_OVER_1M;
  return severance * SUPP_UNDER_1M;
}

export function severanceTax(i: SeveranceInput): SeveranceResult {
  const stdDed = getStandardDeduction(i.filingStatus, false);

  // Marginal federal tax the severance actually adds, stacked on other income.
  const marginalFederal = calcFederalTax(taxable(i.otherIncome + i.severance, stdDed), i.filingStatus)
    - calcFederalTax(taxable(i.otherIncome, stdDed), i.filingStatus);

  // Withholding depends on how it's paid. Separate/installments → flat 22%/37%.
  // Combined with a final paycheck → aggregate method, which approximates the
  // marginal rate (so it lands much closer to the real liability).
  const federalWithholding = i.paymentMode === 'combined' ? marginalFederal : flatFederal(i.severance);
  const federalWithholdingRate = i.severance > 0 ? federalWithholding / i.severance : 0;

  // FICA: SS only on the room left under the wage base, Medicare on all of it,
  // plus the 0.9% additional Medicare on wages over the threshold.
  const ssRoom = Math.max(0, SS_WAGE_BASE - i.ytdWages);
  const socialSecurity = Math.min(i.severance, ssRoom) * SS_RATE;
  const medicare = i.severance * MEDICARE_RATE;
  const addlThreshold = i.filingStatus === 'mfj' ? 250000 : 200000;
  const priorWages = i.ytdWages;
  const addlBase = Math.max(0, priorWages + i.severance - addlThreshold) - Math.max(0, priorWages - addlThreshold);
  const additionalMedicare = addlBase * ADDL_MEDICARE_RATE;
  const ficaTotal = socialSecurity + medicare + additionalMedicare;

  // State: flat supplemental rate where the state has one; otherwise the marginal
  // state tax (what the regular-tables/aggregate method effectively produces).
  const s = sup[i.stateCode];
  let stateWithholding = 0, stateWithholdingMethod = 'no state income tax';
  const marginalState = Math.max(0,
    calcStateTax(i.otherIncome + i.severance, i.stateCode, undefined, i.filingStatus).tax
    - calcStateTax(i.otherIncome, i.stateCode, undefined, i.filingStatus).tax);
  if (s && !s.no_income_tax) {
    if (typeof s.supplemental_rate === 'number') {
      stateWithholding = i.severance * s.supplemental_rate;
      stateWithholdingMethod = `flat ${(s.supplemental_rate * 100).toFixed(2)}%`;
    } else {
      stateWithholding = marginalState;
      stateWithholdingMethod = 'regular tables (marginal estimate)';
    }
  }

  const totalWithheld = federalWithholding + ficaTotal + stateWithholding;
  const netCheck = i.severance - totalWithheld;

  // Actual liability the severance adds: marginal federal + marginal state + FICA
  // (FICA is a real tax, not just withholding, so it does not net out).
  const estimatedActualLiability = marginalFederal + marginalState + ficaTotal;

  // Over/under is about INCOME-TAX withholding vs income-tax liability (FICA
  // withheld = FICA owed, so it cancels).
  const withheldIncomeTax = federalWithholding + stateWithholding;
  const actualIncomeTax = marginalFederal + marginalState;
  const overUnderWithholding = Math.round(withheldIncomeTax - actualIncomeTax);

  const verdict = overUnderWithholding > 0
    ? `Over-withheld by about ${Math.abs(overUnderWithholding).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} — expect roughly that back as a refund at filing.`
    : overUnderWithholding < 0
      ? `Under-withheld by about ${Math.abs(overUnderWithholding).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} — set that aside now, you will owe it at filing.`
      : 'Withholding is roughly on target.';

  return {
    severance: i.severance,
    paymentMode: i.paymentMode,
    federalWithholding: Math.round(federalWithholding),
    federalWithholdingRate,
    socialSecurity: Math.round(socialSecurity),
    medicare: Math.round(medicare),
    additionalMedicare: Math.round(additionalMedicare),
    ficaTotal: Math.round(ficaTotal),
    stateWithholding: Math.round(stateWithholding),
    stateWithholdingMethod,
    totalWithheld: Math.round(totalWithheld),
    netCheck: Math.round(netCheck),
    estimatedActualLiability: Math.round(estimatedActualLiability),
    overUnderWithholding,
    verdict,
  };
}
