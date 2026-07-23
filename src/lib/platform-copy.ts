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

/**
 * 2026 has two business mileage rates, not one.
 *
 * Notice 2026-10 set 72.5 cents from January 1; Announcement 2026-11 raised it
 * to 76 cents for expenses paid or incurred on or after July 1, 2026. Mileage is
 * the entire deduction on a driver page, so quoting the January figure for a
 * full year understated every one of them. A full-year worked example uses the
 * midpoint, and says that it does.
 */
export const MILE_RATE_H1 = Number(mileage.businessRatePerMile);
export const MILE_RATE_H2 = Number(mileage.businessRatePerMileFromJul1);
/** A full year split evenly at July 1. */
export const MILE_RATE = (MILE_RATE_H1 + MILE_RATE_H2) / 2;
export const MILE_RATE_NOTE =
  `${(MILE_RATE_H1 * 100).toFixed(1)}c a mile to June 30, 2026 and ${(MILE_RATE_H2 * 100).toFixed(0)}c from July 1, ` +
  `so a full year averages ${(MILE_RATE * 100).toFixed(2)}c`;
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

/**
 * Categories, not brands, are the unit for the state pages.
 *
 * DoorDash and Grubhub are the same tax answer: a 1099-NEC, mileage at the
 * standard rate, the same deductions. Generating a state page per brand produced
 * pages 53% similar to each other across brands — a grid sharing its platform
 * axis with every state and its state axis with every brand. What genuinely
 * differs is the SHAPE of the deduction stack, and that varies by category:
 * mileage-led, cost-of-goods-led, equipment-led.
 *
 * Brands keep their own hub, which is where brand-name search intent lands, and
 * it points at the category page for the state detail.
 */
export interface PlatformCategory {
  slug: string;
  name: string;
  worker: string;
  /** Category keys in the platform dataset that roll up here. */
  sources: string[];
  /** The platform whose scenario represents the category's shape. */
  exemplar: string;
  lead: string;
}

export const CATEGORIES: PlatformCategory[] = [
  {
    slug: 'gig-driver-tax-calculator',
    name: 'Delivery and rideshare driver',
    worker: 'driver',
    sources: ['gig_rideshare', 'gig_delivery'],
    exemplar: 'doordash',
    lead: 'Driving is the one gig category where a single deduction dominates everything else. Every mile between jobs counts, and at the 2026 rate it is usually the largest number on the return.',
  },
  {
    slug: 'gig-services-tax-calculator',
    name: 'Services and task work',
    worker: 'contractor',
    sources: ['gig_services'],
    exemplar: 'taskrabbit',
    lead: 'Task and services work sits between the two shapes: you drive to jobs, so mileage counts, but tools and materials are a real second line that a driver does not have.',
  },
  {
    slug: 'creator-tax-calculator',
    name: 'Creator and content',
    worker: 'creator',
    sources: ['creators'],
    exemplar: 'youtube',
    lead: 'Creator income has almost no cost of goods and very few miles. What it does have is equipment and a room to work in, which is why the home office deduction matters here more than anywhere else.',
  },
  {
    slug: 'seller-tax-calculator',
    name: 'Marketplace seller',
    worker: 'seller',
    sources: ['sellers'],
    exemplar: 'etsy',
    lead: 'Selling a physical product is the one category where most of the money that arrives was never yours. Cost of goods and platform fees come off first, so gross receipts on a 1099-K bear almost no relation to taxable profit.',
  },
  {
    slug: 'rental-host-tax-calculator',
    name: 'Rental host',
    worker: 'host',
    sources: ['rental'],
    exemplar: 'airbnb',
    lead: 'Renting out property or a vehicle carries costs the platform never sees — cleaning, supplies, repairs and the wear on the asset itself.',
  },
];

/**
 * The state-level question that is actually different for each category.
 *
 * Every category page was ending with the same cross-border paragraph, which is
 * what pushed two categories in the same state to 58% alike. The honest fix is
 * not to trim it but to notice that the state question genuinely differs: a
 * driver crosses a line physically, a seller trips a marketplace facilitator
 * rule, a host owes an occupancy tax the platform may or may not collect.
 */
export function categoryStateAngle(c: PlatformCategory, stateName: string): { heading: string; body: string } {
  const a = /^[AEIOU]/.test(stateName) ? 'an' : 'a';
  switch (c.slug) {
    case 'gig-driver-tax-calculator':
      return {
        heading: `Driving across ${a} ${stateName} line`,
        body: `Driving income is sourced to where the wheels were, not where you live. Take a fare or a `
          + `delivery that ends in the next state and that state can claim the income earned inside it. `
          + `Most drivers near a border never file the second return — the amounts are small and the `
          + `platforms do not split earnings by state — but the obligation exists, and it is the state you `
          + `drove INTO that would come asking.`,
      };
    case 'seller-tax-calculator':
      return {
        heading: `Selling into and out of ${stateName}`,
        body: `Income tax follows you: ${stateName} taxes your profit wherever the buyer was. Sales tax `
          + `does not. Marketplace facilitator laws make the platform collect and remit sales tax on your `
          + `behalf in most states, which is why a seller can have customers in all fifty and still file `
          + `only one income tax return. Selling off-platform is where that stops being true.`,
      };
    case 'rental-host-tax-calculator':
      return {
        heading: `Local taxes on ${a} ${stateName} let`,
        body: `The income tax below is only part of it. Short-term lets attract occupancy, lodging or `
          + `transient taxes levied by the city or county rather than ${stateName}, often at rates that `
          + `dwarf the state income tax. Some platforms collect and remit them; some collect only part; `
          + `in some places the host is on the hook entirely. That is a local question this calculator `
          + `cannot answer, and it is the one hosts most often get wrong.`,
      };
    case 'creator-tax-calculator':
      return {
        heading: `Where creator income is taxed`,
        body: `Creator income is sourced to where you were sitting when you made it, not where the `
          + `audience or the platform is. ${stateName} taxes the lot if you live there. Moving mid-year `
          + `means splitting the year between two states, and a sponsor paying from another state does `
          + `not create an obligation there.`,
      };
    default:
      return {
        heading: `Working across ${a} ${stateName} line`,
        body: `Services income is sourced to where the work was physically done. A job over the line can `
          + `create a filing obligation in that state even for a single afternoon, and reciprocity `
          + `agreements do not help — they cover wages paid by an employer, not self-employment income.`,
      };
  }
}

export function categoryFor(slug: string): PlatformCategory | null {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function brandsIn(category: PlatformCategory): PlatformEntry[] {
  return platformsWithScenarios().filter((p) => category.sources.includes(p.category));
}

export function categoryOf(p: PlatformEntry): PlatformCategory | null {
  return CATEGORIES.find((c) => c.sources.includes(p.category)) ?? null;
}

/** Every platform we have a scenario for — one page set each. */
export function platformsWithScenarios(): PlatformEntry[] {
  return Object.keys(scenarios as Record<string, unknown>)
    .filter((k) => !k.startsWith('_'))
    .map((slug) => findPlatform(slug))
    .filter((p): p is PlatformEntry => p !== null);
}

/** URL segment for a platform's calculator, e.g. "doordash-tax-calculator". */
export function platformSlug(p: PlatformEntry): string {
  return `${p.slug}-tax-calculator`;
}

/** Display name: the dataset keys are lowercase, so title-case for prose. */
export function platformName(p: PlatformEntry): string {
  const OVERRIDES: Record<string, string> = {
    doordash: 'DoorDash', uber: 'Uber', lyft: 'Lyft', instacart: 'Instacart',
    grubhub: 'Grubhub', 'amazon-flex': 'Amazon Flex', shipt: 'Shipt',
    taskrabbit: 'TaskRabbit', rover: 'Rover', etsy: 'Etsy', ebay: 'eBay',
    shopify: 'Shopify', airbnb: 'Airbnb', turo: 'Turo', onlyfans: 'OnlyFans',
    youtube: 'YouTube', 'amazon-fba': 'Amazon FBA', poshmark: 'Poshmark',
    mercari: 'Mercari', 'stockx-goat': 'StockX & GOAT', tiktok: 'TikTok',
    instagram: 'Instagram', twitch: 'Twitch', patreon: 'Patreon',
    upwork: 'Upwork', fiverr: 'Fiverr', 'uber-eats': 'Uber Eats', roadie: 'Roadie',
    'walmart-marketplace': 'Walmart Marketplace', depop: 'Depop', whatnot: 'Whatnot', kick: 'Kick',
  };
  return OVERRIDES[p.slug] ?? p.slug.replace(/-/g, ' ');
}

/** What the worker is called, for prose that reads naturally. */
export function platformWorker(p: PlatformEntry): string {
  if (p.category.startsWith('gig_rideshare')) return 'driver';
  if (p.category.startsWith('gig_delivery')) return 'driver';
  if (p.category === 'gig_services') return 'contractor';
  if (p.category === 'creators') return 'creator';
  if (p.category === 'sellers') return 'seller';
  if (p.category === 'rental') return 'host';
  return 'worker';
}

/** True when mileage is the dominant deduction — changes the whole story. */
export function isMileageDominant(p: PlatformEntry): boolean {
  const sc = (scenarios as Record<string, any>)[p.slug];
  return Boolean(sc?.businessMiles) && p.keyDeductions.includes('mileage');
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
      label: `Mileage — ${sc.businessMiles.toLocaleString()} business miles (${MILE_RATE_NOTE})`,
      amount: sc.businessMiles * MILE_RATE,
      source: 'data/federal.ts → selfEmploymentDeductions.mileage (both 2026 rates)',
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

  // Cost of goods: the dominant line for anyone selling a physical product, and
  // the reason a seller's stack looks nothing like a driver's.
  if (sc.cogsPct && sc.grossEarnings) {
    lines.push({
      label: `Cost of goods sold — ${Math.round(sc.cogsPct * 100)}% of sales`,
      amount: sc.grossEarnings * sc.cogsPct,
      source: 'overrides/platform-scenarios.json (illustrative business shape)',
    });
  }

  if (sc.homeOfficeSqFt && p.keyDeductions.some((d) => /home|office/i.test(d))) {
    const ho = (selfEmploymentDeductions.homeOffice as any).simplified;
    const sqft = Math.min(sc.homeOfficeSqFt, ho.maxSqFt);
    lines.push({
      label: `Home office — ${sqft} sq ft at $${ho.ratePerSqFt} (simplified method)`,
      amount: sqft * ho.ratePerSqFt,
      source: 'data/federal.ts → selfEmploymentDeductions.homeOffice.simplified',
    });
  }

  if (sc.materialsCost) {
    lines.push({
      label: 'Tools, materials and supplies for jobs',
      amount: sc.materialsCost,
      source: 'overrides/platform-scenarios.json (illustrative)',
    });
  }

  if (sc.cleaningCost) {
    lines.push({
      label: 'Cleaning and turnover between guests',
      amount: sc.cleaningCost,
      source: 'overrides/platform-scenarios.json (illustrative)',
    });
  }

  if (sc.repairsCost) {
    lines.push({
      label: 'Repairs and maintenance on the asset',
      amount: sc.repairsCost,
      source: 'overrides/platform-scenarios.json (illustrative)',
    });
  }

  if (sc.equipmentCost) {
    lines.push({
      label: 'Camera, lighting and production equipment',
      amount: sc.equipmentCost,
      source: 'overrides/platform-scenarios.json (illustrative)',
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
        label: `Platform fees — ${(rate * 100).toFixed(2)}% of sales`,
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
