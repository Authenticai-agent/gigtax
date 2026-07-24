/**
 * Return-to-office cost calculator — sourced default anchors (task 5 add-on).
 *
 * Every default here is editable in the tool; these are only the starting
 * placeholders, and each carries its source so the methodology block can show
 * where it came from. The one figure that actually drives the car math — the
 * IRS standard mileage rate — is NOT duplicated here; it is imported from the
 * verified federal dataset (see src/lib/deductions.ts → MILEAGE_2026).
 *
 * `last_verified` gates the maintenance calendar. The mileage rate and the BLS
 * food figure both revise annually.
 */
export interface RtoDefault {
  value: number;
  label: string;
  source: string;
  source_url: string;
  note: string;
}

export const RTO_DEFAULTS: Record<string, RtoDefault> = {
  transitFareRoundTrip: {
    value: 5.5,
    label: 'Transit fare, round trip per office day',
    source: 'BTS "Fares for all Transit Modes per Unlinked Trip"; APTA Public Transportation Fact Book',
    source_url: 'https://www.bts.gov/content/fares-all-transit-modes-unlinked-trip',
    note: 'Placeholder only — single-ride fares vary widely by city ($2.00–$2.90 typical). Enter your own fare; this is not presented as a national average.',
  },
  lunchDeltaPerOfficeDay: {
    value: 8,
    label: 'Lunch / coffee bought out, extra per office day',
    source: 'BLS Consumer Expenditure Survey 2024: food away from home averaged $3,945/yr per household',
    source_url: 'https://www.bls.gov/news.release/cesan.nr0.htm',
    note: 'The extra spend on office days vs eating at home. Conservative editable default; the BLS figure is the household-level anchor, not a per-meal price.',
  },
  coffeeDeltaPerOfficeDay: {
    value: 0,
    label: 'Coffee, extra per office day',
    source: 'user-entered',
    source_url: '',
    note: 'Folded into the lunch delta by default; break it out if you want to.',
  },
  weeksWorkedPerYear: {
    value: 48,
    label: 'Weeks worked per year',
    source: 'convention (52 weeks − ~4 weeks PTO/holidays)',
    source_url: '',
    note: 'Editable. Fewer weeks off → higher annual commute cost.',
  },
  marginalTaxRate: {
    value: 0.3,
    label: 'Marginal tax rate (for the equivalent-raise figure)',
    source: 'user-editable assumption',
    source_url: '',
    note: 'Commute costs are paid with after-tax dollars, so the pre-tax raise needed to offset them is grossed up by this rate.',
  },
};

/** Hours in a standard work year, for deriving an hourly value of time from salary. */
export const WORK_HOURS_PER_YEAR = 2080;
