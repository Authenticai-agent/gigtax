/**
 * Composed 2026 tax dataset. This is the single object the tax engine consumes;
 * its shape mirrors the legacy config so the ported calculation logic is verbatim.
 */
import {
  federal,
  selfEmploymentDeductions,
  acaSubsidy,
  incomeSources,
  entityTypes,
  retirement,
  filingStatuses,
  quarterlyDates2026,
  VERIFIED,
} from './federal';
import { states, stateMetadata } from './states';
import { platforms, platformList } from './platforms';
import { reciprocity, hasReciprocity, DC_EXEMPTS_ALL_NONRESIDENTS, VERIFIED_RECIPROCITY } from './reciprocity';
import type { TaxData } from './types';

export const taxData: TaxData = {
  federal,
  selfEmploymentDeductions,
  acaSubsidy,
  incomeSources,
  entityTypes,
  retirement,
  states,
};

export {
  federal,
  selfEmploymentDeductions,
  acaSubsidy,
  incomeSources,
  entityTypes,
  retirement,
  filingStatuses,
  quarterlyDates2026,
  states,
  stateMetadata,
  platforms,
  platformList,
  reciprocity,
  hasReciprocity,
  DC_EXEMPTS_ALL_NONRESIDENTS,
  VERIFIED_RECIPROCITY,
  VERIFIED,
};
export * from './types';
