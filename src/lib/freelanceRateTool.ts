/**
 * Freelance rate calculator (add-on task 3). Thin wrapper over the repo's
 * existing freelanceRate solver (se-business.ts) — the 1099 tax math pointed
 * backward: target take-home → required gross → floor rate. Adds the
 * decomposition the file asks for: why your salaried $50/hr is not $50/hr
 * freelance (self-employment tax, benefits you now buy, non-billable time,
 * no PTO), shown as where each dollar of the rate goes.
 *
 * No market-wage data is invented here. The tool computes the rate YOU need;
 * a market comparison is the user's to bring from BLS OES.
 */
import { freelanceRate } from './se-business';

export interface FreelanceToolInput {
  targetTakeHome: number;
  healthInsuranceAnnual: number;
  overheadAnnual: number;
  stateCode: string;
  filingStatus?: string;
  weeksOff: number;
  billableHoursPerWeek: number;
  projectHours?: number;
}

export interface RateComponent { label: string; annual: number; perHour: number }

export interface FreelanceToolResult {
  floorHourlyRate: number;
  dayRate: number;
  projectRate: number;
  grossRevenue: number;
  annualBillableHours: number;
  /** takeHome / billable hours — the number people wrongly charge. */
  naiveHourly: number;
  /** How much higher the real floor is than the naive number, as a multiple. */
  upliftMultiple: number;
  breakdown: RateComponent[];
  seTax: number;
  federalTax: number;
  stateTax: number;
}

export function freelanceRateTool(i: FreelanceToolInput): FreelanceToolResult {
  const status = i.filingStatus || 'single';
  const expenses = Math.max(0, i.healthInsuranceAnnual) + Math.max(0, i.overheadAnnual);
  const r = freelanceRate(i.targetTakeHome, expenses, i.stateCode, status, i.weeksOff, i.billableHoursPerWeek, i.projectHours ?? 0);

  const hours = Math.max(1, r.annualBillableHours);
  const incomeTax = r.federalTax + r.stateTax;
  const perHour = (annual: number) => Math.round((annual / hours) * 100) / 100;

  const breakdown: RateComponent[] = [
    { label: 'Your take-home', annual: Math.round(i.targetTakeHome), perHour: perHour(i.targetTakeHome) },
    { label: 'Self-employment tax', annual: Math.round(r.seTax), perHour: perHour(r.seTax) },
    { label: 'Income tax (federal + state)', annual: Math.round(incomeTax), perHour: perHour(incomeTax) },
    { label: 'Health insurance', annual: Math.round(i.healthInsuranceAnnual), perHour: perHour(i.healthInsuranceAnnual) },
    { label: 'Business overhead', annual: Math.round(i.overheadAnnual), perHour: perHour(i.overheadAnnual) },
  ];

  const naiveHourly = i.targetTakeHome / hours;

  return {
    floorHourlyRate: Math.round(r.hourlyRate * 100) / 100,
    dayRate: Math.round(r.hourlyRate * 8),
    projectRate: Math.round(r.projectRate),
    grossRevenue: Math.round(r.grossRevenue),
    annualBillableHours: r.annualBillableHours,
    naiveHourly: Math.round(naiveHourly * 100) / 100,
    upliftMultiple: naiveHourly > 0 ? Math.round((r.hourlyRate / naiveHourly) * 100) / 100 : 0,
    breakdown,
    seTax: Math.round(r.seTax),
    federalTax: Math.round(r.federalTax),
    stateTax: Math.round(r.stateTax),
  };
}
