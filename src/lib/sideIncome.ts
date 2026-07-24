/**
 * Side-income tax threshold engine (add-on task 5). Untangles the three layers
 * side-hustle content usually collapses into one wrong sentence:
 *   1. income tax — owed on profit from the first dollar;
 *   2. the $400 SE-tax filing threshold — NOT an income-tax exemption;
 *   3. the 1099-K platform-reporting threshold — federal only in shipped copy.
 *
 * Per the owner decision (2026-07-24), the 1099-K determination uses the
 * FEDERAL threshold for every state; per-state thresholds are unconfirmed and
 * surface only as a "confirm with your state" caution, never as a figure.
 *
 * The tax math reuses the repo's existing calcCombined (the 1099 engine).
 */
import { calcCombined } from './tax-engine';
import k1099 from '../data/overrides/side-income-1099k-2026.json';
import platformsData from '../data/overrides/side-income-platforms.json';

const FED = (k1099 as any).federal as { amount: number; transactions: number };
const SE_THRESHOLD = (k1099 as any).se_tax_filing_threshold.amount as number;
const PLATFORMS = (platformsData as any).platforms as Record<string, any>;

/** Platforms whose creator income is reported on 1099-NEC/MISC, not 1099-K. */
const NON_1099K = new Set(['twitch', 'youtube']);
/** Platforms the site already covers with a dedicated gig calculator. */
const GIG_POINTER = new Set(['uber_doordash']);

export interface SideIncomeInput {
  platform: string;
  stateCode: string;
  netProfit: number;
  grossSales: number;
  transactions: number;
  filingStatus?: string;
}

export interface SideIncomeResult {
  platformName: string;
  incomeTaxable: boolean;
  seTaxApplies: boolean;
  seThreshold: number;
  platformUses1099K: boolean;
  willReceive1099K: boolean;
  federalThreshold: { amount: number; transactions: number };
  platformNote: string;
  stateReportingNote: string;
  gigPointer: string | null;
  tax: ReturnType<typeof calcCombined>;
  headline: string;
}

export function sideIncomeThreshold(i: SideIncomeInput): SideIncomeResult {
  const p = PLATFORMS[i.platform] ?? { name: i.platform, reports: '', quirk: '' };
  const status = i.filingStatus || 'single';

  const platformUses1099K = !NON_1099K.has(i.platform) && !GIG_POINTER.has(i.platform);
  const overFederal = i.grossSales > FED.amount && i.transactions > FED.transactions;
  const willReceive1099K = platformUses1099K && overFederal;

  const incomeTaxable = i.netProfit > 0;
  const seTaxApplies = i.netProfit >= SE_THRESHOLD;

  // Tax on the profit, via the existing 1099 engine (profit as SE net income).
  const tax = calcCombined(0, i.netProfit, 0, status, i.stateCode);

  const headline = platformUses1099K
    ? `Whether or not ${p.name} sends you a 1099-K, your profit is taxable from the first dollar. The $${SE_THRESHOLD} figure is the self-employment-tax threshold, not a tax-free allowance.`
    : `${p.name} income is usually reported on a 1099-NEC or 1099-MISC, not a 1099-K — so the $${FED.amount.toLocaleString()} 1099-K threshold doesn't apply. Your profit is taxable from the first dollar, and self-employment tax applies at $${SE_THRESHOLD} of net earnings.`;

  const stateReportingNote = `The federal 1099-K threshold is $${FED.amount.toLocaleString()} and more than ${FED.transactions} transactions. Some states set a lower reporting threshold — confirm with your state's Department of Revenue, because a form there doesn't change what you owe, only whether one is issued.`;

  return {
    platformName: p.name,
    incomeTaxable,
    seTaxApplies,
    seThreshold: SE_THRESHOLD,
    platformUses1099K,
    willReceive1099K,
    federalThreshold: { amount: FED.amount, transactions: FED.transactions },
    platformNote: p.quirk || p.reports || '',
    stateReportingNote,
    gigPointer: GIG_POINTER.has(i.platform) ? (p.existing_page || '/gig-tax-calculator/') : null,
    tax,
    headline,
  };
}

export const SIDE_INCOME_PLATFORMS = Object.entries(PLATFORMS).map(([code, p]) => ({ code, name: p.name, category: p.category }));
export { SE_THRESHOLD, FED as FEDERAL_1099K };
