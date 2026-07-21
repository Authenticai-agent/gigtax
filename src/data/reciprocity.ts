/**
 * State income-tax RECIPROCITY agreements (2026).
 *
 * Hand-authored from authoritative sources — NOT generated from legacy data,
 * and NOT invented. Each agreement below was cross-checked across state
 * Department of Revenue material and reputable tax references, and validated
 * for symmetry (a real agreement appears on BOTH states' lists).
 *
 * Sources consulted (July 2026):
 *  - Pennsylvania DOR (REV-419; NJ/OH/VA/WV/MD/IN reciprocity, still active 2025)
 *  - New Jersey Division of Taxation (PA/NJ Reciprocal Agreement)
 *  - Kentucky DOR (Form 42A809; IL/IN/MI/OH/VA/WV/WI)
 *  - DC Office of Tax & Revenue (Form D-4A)
 *  - Thomson Reuters "State-by-state reciprocity agreements"
 *
 * VERIFICATION NOTES (read before treating any field as gospel):
 *  - Partner lists: HIGH confidence — multi-source, symmetric.
 *  - Exemption form numbers: verified for KY, PA, NJ, DC, VA, and the set listed
 *    by Thomson Reuters (IL, IN, MI, OH, MD, WV, WI). Marked `null` where a form
 *    number could NOT be independently confirmed (IA, MN, MT, ND) — confirm with
 *    the state DOR before displaying these as authoritative.
 *  - Arizona: RESOLVED via azdor.gov. Arizona is NOT a true-reciprocity state and
 *    is correctly excluded from the map below. It offers only a credit-based
 *    WITHHOLDING exemption to residents of CA/IN/OR/VA (Form WEC): Arizona income
 *    tax still applies and a nonresident return (Form 140NR) is still in play; the
 *    worker skips withholding because a credit for taxes paid to the home state
 *    makes them whole. See AZ_WEC_WITHHOLDING_EXEMPTION below — never present this
 *    as reciprocity (that would wrongly tell users they owe no Arizona tax).
 *  - Minnesota–Wisconsin reciprocity ended in 2010 and is correctly absent.
 */

export const VERIFIED_RECIPROCITY = '2026-07' as const;

export interface ReciprocityInfo {
  /** State codes this state has a wage reciprocity agreement with. */
  partners: string[];
  /** Nonresident withholding-exemption form; null = not independently verified. */
  exemptionForm: string | null;
  /** Optional verified condition/caveat. */
  note?: string;
}

export const reciprocity: Record<string, ReciprocityInfo> = {
  IL: { partners: ['IA', 'KY', 'MI', 'WI'], exemptionForm: 'IL-W-5-NR' },
  IN: { partners: ['KY', 'MI', 'OH', 'PA', 'WI'], exemptionForm: 'WH-47' },
  IA: { partners: ['IL'], exemptionForm: null },
  KY: {
    partners: ['IL', 'IN', 'MI', 'OH', 'VA', 'WV', 'WI'],
    exemptionForm: '42A809',
    note: 'Virginia residents must commute daily; Ohio residents cannot own 20%+ of an S corporation.',
  },
  MD: { partners: ['DC', 'PA', 'VA', 'WV'], exemptionForm: 'MW507' },
  MI: { partners: ['IL', 'IN', 'KY', 'MN', 'OH', 'WI'], exemptionForm: 'MI-W4' },
  MN: { partners: ['MI', 'ND'], exemptionForm: null },
  MT: { partners: ['ND'], exemptionForm: null },
  NJ: { partners: ['PA'], exemptionForm: 'NJ-165' },
  ND: { partners: ['MN', 'MT'], exemptionForm: null },
  OH: { partners: ['IN', 'KY', 'MI', 'PA', 'WV'], exemptionForm: 'IT 4NR' },
  PA: { partners: ['IN', 'MD', 'NJ', 'OH', 'VA', 'WV'], exemptionForm: 'REV-419' },
  VA: { partners: ['DC', 'KY', 'MD', 'PA', 'WV'], exemptionForm: 'VA-4' },
  WV: { partners: ['KY', 'MD', 'OH', 'PA', 'VA'], exemptionForm: 'WV/IT-104R' },
  WI: { partners: ['IL', 'IN', 'KY', 'MI'], exemptionForm: 'W-220' },
  DC: {
    partners: ['MD', 'VA'],
    exemptionForm: 'D-4A',
    note: 'By federal law DC cannot tax the wages of any nonresident, not only MD/VA residents.',
  },
};

/** DC uniquely never taxes nonresident wages (federal Home Rule Act limit). */
export const DC_EXEMPTS_ALL_NONRESIDENTS = true;

/**
 * Arizona's credit-based withholding exemption — NOT reciprocity (azdor.gov).
 * A resident of one of these states working in Arizona may file Form WEC to skip
 * Arizona withholding, but Arizona income tax still applies and is reconciled via
 * the credit for taxes paid (Form 140NR / Form 309). Do not add AZ to `reciprocity`.
 */
export const AZ_WEC_WITHHOLDING_EXEMPTION = {
  workState: 'AZ',
  eligibleResidentStates: ['CA', 'IN', 'OR', 'VA'],
  form: 'WEC',
  mechanism: 'credit-based withholding exemption (not reciprocity)',
} as const;

/** True if a resident of `homeState` working in `workState` is covered by a reciprocity agreement. */
export function hasReciprocity(homeState: string, workState: string): boolean {
  if (homeState === workState) return false;
  return reciprocity[homeState]?.partners.includes(workState) ?? false;
}
