/**
 * Platform pages: gross earnings in, deductions the platform actually generates,
 * net profit out, then the state layer on top.
 *
 * The point of a platform page — and the thing that has to justify it existing
 * alongside the plain 1099 state page — is that the deductions are specific.
 * A delivery driver's return is dominated by mileage at the verified 2026 rate;
 * a marketplace seller's by platform fees computed from that platform's own fee
 * schedule. Those produce different numbers, a different largest line item and
 * different advice, not the same page with a logo swapped.
 *
 * Rates come from src/data. Only the scenario — how much someone grossed, how
 * far they drove — comes from the reviewed overrides file, and pages say so.
 */
import { selfEmploymentDeductions } from '../data/federal';
import { platforms } from '../data/platforms';
import scenarios from '../data/overrides/platform-scenarios.json';
import { calcCombined, formatMoney } from './tax-engine';

const mileage = selfEmploymentDeductions.mileage as Record<string, unknown>;
export const MILE_RATE = Number(mileage.businessRatePerMile);
export const MILE_SOURCE = String(mileage.source);

const phone = selfEmploymentDeductions.phoneAndInternet as {
  method: string;
  typicalBusinessPct: Record<string, number>;
};

export interface PlatformEntry {
  slug: string;
  name: string;
  category: string;
  incomeType: string;
  keyDeductions: string[];
  fees: Record<string, number> | null;
}

/** Find a platform in the nested category structure by its slug. */
export function findPlatform(slug: string): PlatformEntry | null {
  for (const [category, group] of Object.entries(platforms as Record<string, Record<string, any>>)) {
    for (const [key, entry] of Object.entries(group)) {
      if (key.replace(/_/g, '-') !== slug) continue;
      return {
        slug,
        name: entry.name ?? key.replace(/_/g, ' '),
        category,
        incomeType: String(entry.incomeType ?? '1099-NEC'),
        keyDeductions: (entry.keyDeductions ?? []) as string[],
        fees: (entry.fees ?? null) as Record<string, number> | null,
      };
    }
  }
  return null;
}

export interface DeductionLine {
  label: string;
  amount: number;
  /** Where the figure comes from, for the page's data-source attribute. */
  source: string;
}

export interface PlatformExample {
  gross: number;
  lines: DeductionLine[];
  totalDeductions: number;
  netProfit: number;
  largest: DeductionLine;
  /** Share of gross that never reaches taxable profit. */
  deductionShare: number;
}

/**
 * Build the deduction stack for a platform from its scenario and the verified
 * per-deduction rules. Only deductions the platform actually lists are included,
 * which is what makes one platform's stack differ from another's.
 */
export function platformExample(p: PlatformEntry): PlatformExample | null {
  const sc = (scenarios as Record<string, any>)[p.slug];
  if (!sc) return null;

  const lines: DeductionLine[] = [];

  if (p.keyDeductions.includes('mileage') && sc.businessMiles) {
    lines.push({
      label: `Mileage — ${sc.businessMiles.toLocaleString()} business miles at ${(MILE_RATE * 100).toFixed(1)}c`,
      amount: sc.businessMiles * MILE_RATE,
      source: 'data/federal.ts → selfEmploymentDeductions.mileage.businessRatePerMile',
    });
  }

  if (p.keyDeductions.includes('phone') && sc.phoneAnnualCost) {
    const pctKey = p.category.startsWith('gig') ? 'gig_driver'
      : p.category === 'creators' ? 'content_creator' : 'mixed_use';
    const pct = phone.typicalBusinessPct[pctKey] ?? phone.typicalBusinessPct.mixed_use;
    lines.push({
      label: `Phone — ${(pct * 100).toFixed(0)}% business use of ${formatMoney(sc.phoneAnnualCost)}`,
      amount: sc.phoneAnnualCost * pct,
      source: `data/federal.ts → selfEmploymentDeductions.phoneAndInternet.typicalBusinessPct.${pctKey}`,
    });
  }

  if (sc.suppliesCost) {
    lines.push({
      label: 'Supplies and equipment',
      amount: sc.suppliesCost,
      source: 'overrides/platform-scenarios.json (illustrative)',
    });
  }

  if (p.fees && sc.grossEarnings) {
    const rate = Object.entries(p.fees)
      .filter(([, v]) => typeof v === 'number' && v < 1)
      .reduce((sum, [, v]) => sum + (v as number), 0);
    if (rate > 0) {
      lines.push({
        label: `${p.name} fees — ${(rate * 100).toFixed(2)}% of sales`,
        amount: sc.grossEarnings * rate,
        source: `data/platforms.ts → ${p.slug}.fees`,
      });
    }
  }

  if (!lines.length) return null;

  const totalDeductions = lines.reduce((s, l) => s + l.amount, 0);
  const largest = lines.reduce((a, b) => (b.amount > a.amount ? b : a));
  return {
    gross: sc.grossEarnings,
    lines,
    totalDeductions,
    netProfit: Math.max(0, sc.grossEarnings - totalDeductions),
    largest,
    deductionShare: totalDeductions / sc.grossEarnings,
  };
}

/**
 * The same platform at three volumes. Mileage scales with earnings, so the
 * deduction does too — which means the effective rate does NOT move the way it
 * would for someone whose income rose without expenses. That is a platform-
 * specific point, and it lands differently in each state.
 */
export function platformLadder(p: PlatformEntry, stateCode: string, status = 'single') {
  const sc = (scenarios as Record<string, any>)[p.slug];
  if (!sc?.ladder) return [];
  return (sc.ladder as Array<{ label: string; gross: number; miles: number }>).map((rung) => {
    const mileageDeduction = rung.miles * MILE_RATE;
    const r = calcCombined(0, rung.gross, mileageDeduction, status, stateCode);
    return {
      label: rung.label,
      gross: rung.gross,
      miles: rung.miles,
      mileageDeduction,
      netProfit: Math.max(0, rung.gross - mileageDeduction),
      totalTax: r.totalTax,
      stateTax: r.stateTax,
      rateOnGross: r.totalTax / rung.gross,
    };
  });
}

/** The tax outcome for that net profit in one state. */
export function platformTax(example: PlatformExample, stateCode: string, status = 'single') {
  return calcCombined(0, example.gross, example.totalDeductions, status, stateCode);
}

/** What the same gross would cost with no deductions claimed — the cost of not tracking. */
export function costOfNotTracking(example: PlatformExample, stateCode: string, status = 'single') {
  const claimed = calcCombined(0, example.gross, example.totalDeductions, status, stateCode);
  const unclaimed = calcCombined(0, example.gross, 0, status, stateCode);
  return { claimed, unclaimed, difference: unclaimed.totalTax - claimed.totalTax };
}

/** Human labels for the raw deduction keys in the platform data. */
const DEDUCTION_LABELS: Record<string, string> = {
  mileage: 'mileage on every business trip',
  phone: 'the business share of your phone bill',
  insulated_bag: 'insulated bags and delivery gear',
  parking: 'parking while working',
  tolls: 'tolls',
  dashcam: 'a dashcam',
  car_washes: 'car washes',
  insurance_pct: 'the business share of car insurance',
  cogs: 'cost of goods sold',
  platform_fees: 'the platform’s own fees',
  shipping_supplies: 'shipping and packing supplies',
  photography_equipment: 'photography equipment',
};

export function deductionLabel(key: string): string {
  return DEDUCTION_LABELS[key] ?? key.replace(/_/g, ' ');
}
