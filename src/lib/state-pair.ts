/**
 * Cross-border "live in one state, work in another" logic.
 *
 * Combines the verified reciprocity dataset with per-state 2026 rates to produce
 * the correct arrangement and a worked example for each home/work pair. Every
 * number comes from src/data — nothing here is invented. The four outcomes:
 *
 *  - reciprocity:   work state waives its tax; you pay only your home state.
 *  - az-wec:        Arizona's credit-based withholding exemption (CA/IN/OR/VA) —
 *                   NOT reciprocity; AZ tax still applies, reconciled by credit.
 *  - credit:        no agreement — you file a work-state nonresident return and
 *                   your home state credits the tax paid; net ≈ the higher rate.
 *  - single-state:  only one of the two states taxes wages (the other has none).
 */
import { states } from '../data/states';
import { hasReciprocity, reciprocity, AZ_WEC_WITHHOLDING_EXEMPTION } from '../data/reciprocity';
import { adjacency } from '../data/adjacency';
import { calcStateTax, formatMoney } from './tax-engine';
import { stateSlug as stateSlugFn } from './slug';
import type { StateData } from '../data/types';

const noTax = (s: StateData) => s.noIncomeTax === true || s.type === 'none';

/**
 * Every home→work combination worth considering: real commuter corridors
 * (bordering states), every reciprocity pair in both directions, and the
 * Arizona WEC pairs. These are no longer pages — they are grouped by home state
 * into one page each — but the pair is still the unit the tax rules apply to.
 */
function allCandidatePairs(): Array<[string, string]> {
  const set = new Set<string>();
  for (const [a, nbrs] of Object.entries(adjacency)) for (const b of nbrs) set.add(`${a}>${b}`);
  for (const [a, info] of Object.entries(reciprocity)) for (const b of info.partners) { set.add(`${a}>${b}`); set.add(`${b}>${a}`); }
  for (const h of AZ_WEC_WITHHOLDING_EXEMPTION.eligibleResidentStates) set.add(`${h}>AZ`);
  return [...set].map((s) => s.split('>') as [string, string]);
}

function collapsesOnHome(homeCode: string, workCode: string): boolean {
  return !noTax(states[workCode]) && noTax(states[homeCode]) && !hasReciprocity(homeCode, workCode);
}

/**
 * Everything one home state faces across all its borders, on one page.
 *
 * Splitting a home state's neighbours across three collapsed pages (reciprocity
 * / credit / no-income-tax) meant its own rate structure and facts appeared on
 * all three, so none of that text counted as unique to any of them — which is
 * why 24 collapsed pages still measured thin. It is also the wrong unit for the
 * reader: someone in West Virginia commuting over a line wants one answer, not
 * three pages to guess between.
 */
export interface HomeCommute {
  homeCode: string;
  reciprocity: string[];
  credit: string[];
  noTax: string[];
}

export function homeCommutePages(): HomeCommute[] {
  const byHome = new Map<string, HomeCommute>();
  for (const [h, w] of allCandidatePairs()) {
    if (noTax(states[h])) continue; // covered by the mirror, grouped by work state
    if (!byHome.has(h)) byHome.set(h, { homeCode: h, reciprocity: [], credit: [], noTax: [] });
    const e = byHome.get(h)!;
    if (hasReciprocity(h, w)) e.reciprocity.push(w);
    else if (noTax(states[w])) e.noTax.push(w);
    else e.credit.push(w);
  }
  const byName = (a: string, b: string) => states[a].name.localeCompare(states[b].name);
  return [...byHome.values()]
    .map((e) => ({ ...e, reciprocity: e.reciprocity.sort(byName), credit: e.credit.sort(byName), noTax: e.noTax.sort(byName) }))
    .sort((a, b) => byName(a.homeCode, b.homeCode));
}

export function homeCommuteSlug(homeCode: string): string {
  return stateSlugFn(states[homeCode].name);
}

/** The mirror: one entry per work state reachable from a no-income-tax state. */
export function noTaxHomePages(): Array<{ workCode: string; homeCodes: string[] }> {
  const byWork = new Map<string, string[]>();
  for (const [h, w] of allCandidatePairs()) {
    if (!collapsesOnHome(h, w)) continue;
    if (!byWork.has(w)) byWork.set(w, []);
    byWork.get(w)!.push(h);
  }
  return [...byWork.entries()]
    .map(([workCode, homeCodes]) => ({
      workCode,
      homeCodes: homeCodes.sort((a, b) => states[a].name.localeCompare(states[b].name)),
    }))
    .sort((a, b) => states[a.workCode].name.localeCompare(states[b.workCode].name));
}

export { stateSlug } from './slug';

export type ArrangementType = 'reciprocity' | 'az-wec' | 'credit' | 'single-state' | 'no-tax-either';

export interface PairOutcome {
  home: StateData;
  work: StateData;
  homeCode: string;
  workCode: string;
  type: ArrangementType;
  income: number;
  workTax: number;
  homeTaxBeforeCredit: number;
  credit: number;
  homeTaxAfterCredit: number;
  totalStateTax: number;
  exemptionForm: string | null;
  headline: string;
  explanation: string;
}

/** Compute the state-tax outcome for a resident of `homeCode` working in `workCode`. */
export function pairOutcome(homeCode: string, workCode: string, income = 70000, status = 'single'): PairOutcome {
  const home = states[homeCode];
  const work = states[workCode];
  const workTaxFull = calcStateTax(income, workCode, undefined, status).tax;
  const homeTaxFull = calcStateTax(income, homeCode, undefined, status).tax;

  const reciprocal = hasReciprocity(homeCode, workCode);
  const azWec = workCode === 'AZ' && (AZ_WEC_WITHHOLDING_EXEMPTION.eligibleResidentStates as readonly string[]).includes(homeCode);

  let type: ArrangementType;
  let workTax = workTaxFull;
  let homeTaxBeforeCredit = homeTaxFull;
  let credit = 0;

  if (noTax(home) && noTax(work)) {
    type = 'no-tax-either';
    workTax = 0; homeTaxBeforeCredit = 0;
  } else if (reciprocal) {
    // Work state waives its tax entirely; you pay only your home state.
    type = 'reciprocity';
    workTax = 0;
    credit = 0;
  } else if (noTax(home) || noTax(work)) {
    // Only one state taxes wages.
    type = 'single-state';
    credit = 0;
  } else {
    // No agreement (incl. AZ-WEC, which is still a credit mechanism): file a
    // work-state nonresident return; home state credits tax paid, capped at the
    // home-state tax on that income. Net total ≈ the higher of the two.
    type = azWec ? 'az-wec' : 'credit';
    credit = Math.min(workTaxFull, homeTaxFull);
  }

  const homeTaxAfterCredit = Math.max(0, homeTaxBeforeCredit - credit);
  const totalStateTax = workTax + homeTaxAfterCredit;
  // The exemption certificate belongs to the WORK state, not the home state: it
  // is filed with the work-state employer to stop that state withholding from a
  // nonresident. A Pennsylvania resident working in New Jersey files NJ-165 (New
  // Jersey's form), not REV-419 — REV-419 is what a nonresident working *in*
  // Pennsylvania files. Sourcing this from homeCode named the wrong form on
  // every reciprocity pair.
  const exemptionForm = reciprocal ? reciprocity[workCode]?.exemptionForm ?? null : null;

  const headline = buildHeadline(type, home, work);
  const explanation = buildExplanation(type, home, work, income, workTaxFull, homeTaxFull, exemptionForm);

  return {
    home, work, homeCode, workCode, type, income,
    workTax, homeTaxBeforeCredit, credit, homeTaxAfterCredit, totalStateTax,
    exemptionForm, headline, explanation,
  };
}

/** "a" vs "an" for a state name, so generated prose reads correctly. */
function article(name: string): string {
  return /^[AEIOU]/.test(name) ? 'an' : 'a';
}

function buildHeadline(type: ArrangementType, home: StateData, work: StateData): string {
  switch (type) {
    case 'reciprocity':
      return `${home.name} and ${work.name} have a tax reciprocity agreement, so you pay income tax only to ${home.name}.`;
    case 'az-wec':
      return `${work.name} still taxes your wages, but as ${article(home.name)} ${home.name} resident you can skip Arizona withholding (Form WEC) and settle up with a credit.`;
    case 'credit':
      return `${home.name} and ${work.name} have no reciprocity agreement, so you file ${article(work.name)} ${work.name} nonresident return and ${home.name} credits the tax you paid.`;
    case 'single-state':
      return noTax(work)
        ? `${work.name} has no state income tax, so you owe income tax only to ${home.name}.`
        : `${home.name} has no state income tax, so you owe income tax only to ${work.name} as a nonresident.`;
    case 'no-tax-either':
      return `Neither ${home.name} nor ${work.name} has a state income tax, so no state income tax is due on your wages.`;
  }
}

function buildExplanation(type: ArrangementType, home: StateData, work: StateData, income: number, workTaxFull: number, homeTaxFull: number, form: string | null): string {
  const inc = formatMoney(income);
  switch (type) {
    case 'reciprocity':
      return `Because of the reciprocity agreement, ${work.name} will not tax the wages you earn there. File ${form ? `${work.name}'s ${form}` : `${work.name}'s nonresident exemption certificate`} with your ${work.name} employer to stop ${work.name} withholding, and report all ${inc} on your ${home.name} resident return. You do not file ${work.name} returns for these wages.`;
    case 'az-wec':
      return `Arizona is not a reciprocity state. As ${article(home.name)} ${home.name} resident you may file Arizona Form WEC to skip Arizona withholding, but Arizona income tax still applies to the ${inc} you earn there — you file an Arizona nonresident return (Form 140NR) and claim a credit for taxes paid so you are not taxed twice. Estimated Arizona tax ${formatMoney(workTaxFull)}; ${home.name} tax ${formatMoney(homeTaxFull)}.`;
    case 'credit':
      return `You pay ${work.name} as a nonresident on the ${inc} earned there (about ${formatMoney(workTaxFull)}), then report the same income on your ${home.name} resident return (about ${formatMoney(homeTaxFull)}) and claim a credit for taxes paid to ${work.name}. The credit is capped at your ${home.name} tax on that income, so your combined state tax is roughly the higher of the two.`;
    case 'single-state':
      return noTax(work)
        ? `${work.name} has no wage income tax, so nothing is withheld or owed there. You report the ${inc} on your ${home.name} resident return (about ${formatMoney(homeTaxFull)}).`
        : `${home.name} has no state income tax, so there is no resident return to file. You still owe ${work.name} nonresident tax on the ${inc} earned there (about ${formatMoney(workTaxFull)}).`;
    case 'no-tax-either':
      return `Neither state taxes wage income, so there is no state income tax and no state return to file for these wages. You still owe federal income tax and, if self-employed, self-employment tax.`;
  }
}
