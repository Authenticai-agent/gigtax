/**
 * Shared shapes for the ported 2026 tax dataset.
 *
 * These interfaces are intentionally permissive (index signatures) so the
 * verbatim JSON ported from `legacy/data/config.json` type-checks without
 * altering a single figure. The fields the tax engine actually reads are
 * typed precisely; everything else rides along under the index signature.
 */

export interface Bracket {
  min: number;
  max: number | null;
  rate: number;
}

/** Graduated state brackets are stored as [min, max|null, rate] tuples. */
export type StateBracket = [number, number | null, number];

export interface StateData {
  name: string;
  type: 'none' | 'flat' | 'graduated';
  topRate: number;
  noIncomeTax?: boolean;
  rate?: number;
  brackets_single?: StateBracket[];
  brackets_mfj?: StateBracket[];
  standardDeduction?: Record<string, number>;
  localTaxNote?: string;
  mentalHealthSurcharge?: number;
  mentalHealthThreshold?: number;
  [key: string]: unknown;
}

export interface FederalData {
  brackets: Record<string, Bracket[]>;
  // Mostly numeric amounts, but also carries a `source` string and the nested
  // seniorDeductionOBBBA object — keep it permissive so the verbatim data fits.
  standardDeduction: Record<string, any>;
  capitalGains: {
    longTerm: Record<string, Bracket[]>;
    niit: { rate: number; thresholdSingle: number; thresholdMFJ: number; [k: string]: unknown };
    [k: string]: unknown;
  };
  selfEmployment: {
    seTaxRate: number;
    socialSecurityRate: number;
    medicareRate: number;
    socialSecurityWageBase: number;
    netEarningsMultiplier: number;
    selfDeductionRate: number;
    [k: string]: unknown;
  };
  childTaxCredit: { amountPerChild: number; phaseoutStartSingle: number; phaseoutStartMFJ: number; phaseoutRate: number; [k: string]: unknown };
  earnedIncomeCredit: { brackets: Array<Record<string, number>>; investmentIncomeLimit: number; [k: string]: unknown };
  quarterlyEstimated: { quarters: Array<Record<string, unknown>>; [k: string]: unknown };
  [key: string]: unknown;
}

export interface PlatformEntry {
  incomeType?: string;
  // Sometimes a rate (0.2), sometimes prose ("varies (Uber keeps % of fare)").
  platformFee?: number | string;
  fees?: Record<string, number>;
  keyDeductions?: string[];
  [key: string]: unknown;
}

export type PlatformCategories = Record<string, Record<string, PlatformEntry>>;

/** A flattened, page-ready view of a platform, derived (slug/name) from the raw data. */
export interface PlatformSummary {
  slug: string;
  name: string;
  category: string;
  key: string;
  incomeType: string;
  keyDeductions: string[];
}

/** The aggregate the tax engine consumes — mirrors the legacy config shape. */
export interface TaxData {
  federal: FederalData;
  selfEmploymentDeductions: Record<string, unknown>;
  acaSubsidy: Record<string, unknown>;
  incomeSources: Record<string, unknown>;
  entityTypes: Record<string, unknown>;
  states: Record<string, StateData>;
  retirement?: Record<string, unknown>;
  [key: string]: unknown;
}
