/**
 * S-corp reasonable-compensation audit risk.
 *
 * This is a scoring model, not a tax computation. Paying an S-corp owner too
 * small a salary while taking large distributions is a top IRS audit trigger —
 * the agency won Watson (8th Cir. 2012) on exactly this. The score (0 safe → 100
 * audit-likely) weighs the salary-to-profit ratio against an industry benchmark,
 * plus profit size, business maturity, employees, owner structure, hours and
 * credentials.
 *
 * The benchmark ranges are editorial — practitioner rules of thumb informed by
 * BLS wage data and the S-corp comp cases, NOT statutory rates. The only tax
 * figure used is the combined FICA rate, and that comes from the dataset for the
 * "payroll tax you save at the target salary" line.
 */
import { federal } from '../data/federal';

const FICA_RATE: number = (federal as any).selfEmployment.seTaxRate; // 15.3%

export type Industry =
  | 'software' | 'consulting' | 'medical' | 'legal' | 'construction'
  | 'retail' | 'creative' | 'realestate' | 'other';
export type OwnerStructure = '0' | '1' | '1passive' | '2plus';
export type Credentials = 'expert' | 'senior' | 'mid' | 'entry';

interface Benchmark { min: number; target: number; max: number; label: string }

/** Salary-as-share-of-profit ranges by industry. Editorial, not IRS figures. */
export const BENCHMARKS: Record<Industry, Benchmark> = {
  software: { min: 0.30, target: 0.45, max: 0.60, label: 'Software / SaaS' },
  consulting: { min: 0.35, target: 0.50, max: 0.65, label: 'Consulting' },
  medical: { min: 0.40, target: 0.55, max: 0.70, label: 'Medical / Healthcare' },
  legal: { min: 0.40, target: 0.55, max: 0.70, label: 'Legal / Accounting' },
  construction: { min: 0.30, target: 0.42, max: 0.55, label: 'Construction' },
  retail: { min: 0.25, target: 0.35, max: 0.50, label: 'E-commerce / Retail' },
  creative: { min: 0.30, target: 0.42, max: 0.55, label: 'Creative / Media' },
  realestate: { min: 0.20, target: 0.30, max: 0.45, label: 'Real Estate' },
  other: { min: 0.30, target: 0.45, max: 0.60, label: 'General Business' },
};

export interface AuditRiskInput {
  profit: number;
  salary: number;
  industry: Industry;
  years: number;
  employees: number;
  owners: OwnerStructure;
  /** Weekly hours worked in the business: 40, 30, 20, 10 or 5. */
  hours: number;
  credentials: Credentials;
}

export interface AuditRiskResult {
  score: number;
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  ratio: number;
  benchmark: Benchmark;
  recommendedMin: number;
  recommendedTarget: number;
  recommendedMax: number;
  /** Payroll tax "saved" by paying the current salary instead of the target. */
  payrollTaxAtRisk: number;
  factors: { label: string; points: number }[];
}

export function sCorpAuditRisk(input: AuditRiskInput): AuditRiskResult {
  const { profit, salary, industry, years, employees, owners, hours, credentials } = input;
  const bm = BENCHMARKS[industry] ?? BENCHMARKS.other;
  const ratio = profit > 0 ? salary / profit : 0;

  const ratioPts = ratio < bm.min ? 50 : ratio < bm.target - 0.05 ? 35 : ratio < bm.target ? 20 : ratio <= bm.max ? 5 : 0;
  const profitPts = profit >= 500000 ? 20 : profit >= 250000 ? 15 : profit >= 100000 ? 10 : profit >= 50000 ? 5 : 0;
  const yearsPts = years < 2 ? -5 : years > 10 ? 10 : years > 5 ? 5 : 0;
  const empPts = employees >= 10 ? 10 : employees >= 5 ? 7 : employees >= 2 ? 4 : 0;
  const ownerPts = owners === '0' ? 0 : owners === '1' ? 3 : owners === '1passive' ? 7 : 10;
  const hoursPts = hours >= 40 ? 5 : hours >= 30 ? 3 : hours >= 20 ? 1 : 0;
  const credPts = credentials === 'expert' ? 5 : credentials === 'senior' ? 3 : credentials === 'mid' ? 1 : 0;

  const score = Math.max(0, Math.min(100, Math.round(
    ratioPts + profitPts + yearsPts + empPts + ownerPts + hoursPts + credPts,
  )));

  const level = score <= 25 ? 'Low' : score <= 50 ? 'Moderate' : score <= 75 ? 'High' : 'Critical';

  const recommendedTarget = Math.round(profit * bm.target);

  return {
    score,
    level,
    ratio,
    benchmark: bm,
    recommendedMin: Math.round(profit * bm.min),
    recommendedTarget,
    recommendedMax: Math.round(profit * bm.max),
    // What the low salary "saves" in payroll tax vs the target — and what the
    // IRS would reclaim if it reclassified distributions as wages.
    payrollTaxAtRisk: Math.max(0, Math.round((recommendedTarget - salary) * FICA_RATE)),
    factors: [
      { label: 'Salary ratio', points: ratioPts },
      { label: 'Profit magnitude', points: profitPts },
      { label: 'Business maturity', points: yearsPts },
      { label: 'Employees', points: empPts },
      { label: 'Owner structure', points: ownerPts },
      { label: 'Hours worked', points: hoursPts },
      { label: 'Credentials', points: credPts },
    ],
  };
}
