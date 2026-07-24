/**
 * COBRA vs ACA-marketplace comparison (task_layoff.md Phase 2).
 *
 * The single most consequential 2026 fact: the enhanced premium tax credits
 * expired 2025-12-31, so the hard 400% FPL subsidy cliff is back. A layoff year
 * can be a low-MAGI year that drops someone back under the cliff and makes the
 * marketplace beat COBRA — but a dollar over 400% FPL costs the entire subsidy.
 * This computes both sides over a coverage horizon and flags cliff proximity.
 *
 * COBRA mechanics and KFF averages come from the sourced cobra_aca.json; the FPL
 * table, cliff thresholds, and applicable-percentage schedule come from the
 * shared engine via calcACASubsidy (not duplicated).
 */
import { calcACASubsidy } from '../tax-engine';
import { acaSubsidy } from '../../data/federal';
import cobraAca from '../../data/layoff/cobra_aca.json';

const CA = cobraAca as any;
const COBRA = CA.cobra_federal;
const KFF = CA.kff_premium_averages;

export type CobraSource = 'box12dd' | 'known' | 'national_average';

export interface CobraInput {
  cobraSource: CobraSource;
  /** For 'box12dd': the W-2 Box 12 Code DD total ANNUAL premium. For 'known': the monthly premium. Ignored for 'national_average'. */
  cobraValue: number;
  household: 'single' | 'family';
  householdSize: number;
  /** Estimated 2026 MAGI (severance + UI + other income) — drives the subsidy and cliff test. */
  estimatedMAGI: number;
  /** Monthly benchmark (second-lowest silver) marketplace premium, from healthcare.gov. */
  marketplaceBenchmarkMonthly: number;
  coverageHorizonMonths: number;
}

export interface CobraResult {
  cobraMonthly: number;
  cobraTotal: number;
  marketplaceBenchmarkMonthly: number;
  estimatedSubsidyMonthly: number;
  marketplaceNetMonthly: number;
  marketplaceTotal: number;
  cheaper: 'cobra' | 'marketplace';
  savingsOverHorizon: number;
  fplPct: number;
  overCliff: boolean;
  cliffRisk: boolean;
  distanceToCliff: number;
  cliffWarning: string | null;
  retroactiveNote: string;
  horizonMonths: number;
}

/** Monthly COBRA premium: Box 12 DD / 12 x 1.02, a known figure, or the KFF fallback. */
function cobraMonthly(i: CobraInput): number {
  if (i.cobraSource === 'box12dd') return (i.cobraValue / 12) * COBRA.premium_max_pct_of_full_cost;
  if (i.cobraSource === 'known') return i.cobraValue;
  // national average: KFF total premium (employee + employer) / 12 x 1.02.
  const annual = i.household === 'family' ? KFF.total_premium_family_annual : KFF.total_premium_single_annual;
  return (annual / 12) * COBRA.premium_max_pct_of_full_cost;
}

export function cobraVsMarketplace(i: CobraInput): CobraResult {
  const monthly = cobraMonthly(i);
  const cobraTotal = monthly * i.coverageHorizonMonths;

  const sub = calcACASubsidy(i.estimatedMAGI, i.householdSize, i.marketplaceBenchmarkMonthly);
  const subsidyMonthly = sub.subsidy;
  const netMonthly = Math.max(0, i.marketplaceBenchmarkMonthly - subsidyMonthly);
  const marketplaceTotal = netMonthly * i.coverageHorizonMonths;

  // Distance to the 400% FPL cliff for this household size.
  const cliff = (acaSubsidy as any).cliffThresholds400pct['persons' + Math.min(i.householdSize, 6)]
    ?? ((acaSubsidy as any).cliffThresholds400pct.persons6 + (i.householdSize - 6) * (acaSubsidy as any).fpl2026.additionalPerPerson);
  const distanceToCliff = Math.round(cliff - i.estimatedMAGI);

  const cheaper = cobraTotal <= marketplaceTotal ? 'cobra' : 'marketplace';
  const savingsOverHorizon = Math.round(Math.abs(cobraTotal - marketplaceTotal));

  let cliffWarning: string | null = null;
  if (sub.cliffRisk && !sub.eligible) {
    cliffWarning = `Your estimated income is over 400% of the poverty level, so you get $0 in marketplace subsidy. Earning ${Math.abs(distanceToCliff).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} LESS would drop you under the cliff and could save thousands.`;
  } else if (sub.cliffRisk) {
    cliffWarning = `You are within ${Math.abs(distanceToCliff).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} of the 400% FPL cliff. One dollar of extra income above it wipes out the entire subsidy — plan year-end income carefully.`;
  }

  return {
    cobraMonthly: Math.round(monthly),
    cobraTotal: Math.round(cobraTotal),
    marketplaceBenchmarkMonthly: Math.round(i.marketplaceBenchmarkMonthly),
    estimatedSubsidyMonthly: Math.round(subsidyMonthly),
    marketplaceNetMonthly: Math.round(netMonthly),
    marketplaceTotal: Math.round(marketplaceTotal),
    cheaper,
    savingsOverHorizon,
    fplPct: Math.round(sub.fplPct * 100) / 100,
    overCliff: !sub.eligible && sub.cliffRisk,
    cliffRisk: sub.cliffRisk,
    distanceToCliff,
    cliffWarning,
    retroactiveNote: COBRA.retroactive_note + ` You have a ${COBRA.election_window_days}-day window to elect.`,
    horizonMonths: i.coverageHorizonMonths,
  };
}
