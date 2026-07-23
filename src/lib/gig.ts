/**
 * Gig-economy categories and platforms, in one place.
 *
 * The site groups gig work by what you can deduct, not by which app pays you —
 * a driver and an Etsy seller have different tax questions, but a Lyft and an
 * Uber driver have the same one. The header's "Gig" link points at the hub built
 * from this list, not at any single category, so the whole ecosystem is one hop
 * from the nav. The home page reads the same list, so the two never drift.
 */
export interface GigCategory {
  key: string;
  href: string;
  name: string;
  /** One-line deduction hook shown next to the category. */
  note: string;
}

export const GIG_CATEGORIES: GigCategory[] = [
  { key: 'driver', href: '/gig-driver-tax-calculator/', name: 'Driving and delivery', note: 'mileage is the whole deduction' },
  { key: 'services', href: '/gig-services-tax-calculator/', name: 'Services and tasks', note: 'tools, supplies, travel between jobs' },
  { key: 'creator', href: '/creator-tax-calculator/', name: 'Creators', note: 'equipment, software, home studio' },
  { key: 'seller', href: '/seller-tax-calculator/', name: 'Sellers', note: 'cost of goods, fees, shipping' },
  { key: 'rental', href: '/rental-host-tax-calculator/', name: 'Rental hosts', note: 'the 14-day rule and depreciation' },
];

export interface GigPlatform {
  slug: string;
  href: string;
  name: string;
  /** Which category's expense profile this platform's work fits. */
  category: string;
}

const PLATFORM_NAMES: Record<string, string> = {
  'amazon-flex': 'Amazon Flex', doordash: 'DoorDash', ebay: 'eBay',
  onlyfans: 'OnlyFans', taskrabbit: 'TaskRabbit', youtube: 'YouTube',
  'amazon-fba': 'Amazon FBA', 'stockx-goat': 'StockX & GOAT', tiktok: 'TikTok',
};

const PLATFORM_CATEGORY: Array<[string, string]> = [
  ['uber', 'driver'], ['lyft', 'driver'], ['doordash', 'driver'], ['grubhub', 'driver'],
  ['instacart', 'driver'], ['shipt', 'driver'], ['amazon-flex', 'driver'],
  ['taskrabbit', 'services'], ['rover', 'services'],
  ['turo', 'rental'], ['airbnb', 'rental'],
  ['etsy', 'seller'], ['ebay', 'seller'], ['shopify', 'seller'],
  ['amazon-fba', 'seller'], ['poshmark', 'seller'], ['mercari', 'seller'], ['stockx-goat', 'seller'],
  ['youtube', 'creator'], ['onlyfans', 'creator'],
  ['tiktok', 'creator'], ['instagram', 'creator'], ['twitch', 'creator'], ['patreon', 'creator'],
];

export const GIG_PLATFORMS: GigPlatform[] = PLATFORM_CATEGORY.map(([slug, category]) => ({
  slug,
  href: `/${slug}-tax-calculator/`,
  name: PLATFORM_NAMES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1),
  category,
}));

/** The platforms whose work fits a given category. */
export function platformsInCategory(key: string): GigPlatform[] {
  return GIG_PLATFORMS.filter((p) => p.category === key);
}
