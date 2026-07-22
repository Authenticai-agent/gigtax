/**
 * Sibling-state selection for "nearby states" link blocks.
 *
 * The border data itself lives in `adjacency.ts` — this file used to carry a
 * second copy of it, which is now gone: two hand-maintained adjacency tables
 * would inevitably drift. `adjacency.ts` deliberately excludes the Four Corners
 * point-touches (AZ–CO, NM–UT), which is right for both its use and this one:
 * a single point is not a commuter corridor and not a useful "nearby state"
 * either. Alaska and Hawaii have no entry there; they fall back below.
 */
import { adjacency } from './adjacency';

/** Fallback siblings for states with no land border (AK, HI). */
const NO_NEIGHBOUR_FALLBACK = ['CA', 'TX', 'FL', 'NY'];

/** Up to `count` sibling state codes for a page's related-links block. */
export function siblingStates(code: string, count = 4): string[] {
  const list = adjacency[code]?.length ? adjacency[code] : NO_NEIGHBOUR_FALLBACK;
  return list.filter((c) => c !== code).slice(0, count);
}
