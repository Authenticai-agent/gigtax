/**
 * Remote-work tax residency checker (add-on task 2). A rules-map + explainer,
 * not a calculator: which rules apply, where double-taxation risk sits, and what
 * needs a professional. Two modes.
 *
 * Domestic reuses the repo's verified reciprocity data; international reuses the
 * feie engine. Convenience-state, totalization, treaty and nomad-visa posture
 * all follow the owner's 2026-07-24 sign-off (safe wording, nothing asserted
 * beyond what's sourced). Treaty articles are never interpreted — the tool
 * points to IRS Pub 901.
 */
import { reciprocity, hasReciprocity, DC_EXEMPTS_ALL_NONRESIDENTS } from '../data/reciprocity';
import { feie, FEIE_LIMIT } from './feie';
import conv from '../data/overrides/convenience-rule-states-2026.json';
import countryNotes from '../data/overrides/country-notes-2026.json';
import { states } from '../data/states';

const CONV = (conv as any).states as Record<string, any>;
const CONV_COPY = (conv as any)._owner_decision_2026_07_24.approved_copy as string;
const COUNTRIES = (countryNotes as any).countries as Record<string, any>;
const DEC = (countryNotes as any)._owner_decision_2026_07_24;

export interface DomesticInput {
  homeState: string;
  workState: string;
  /** Employer requires the remote work (necessity), vs employee convenience. */
  employerNecessity: boolean;
}

export interface RuleItem { kind: 'ok' | 'warning' | 'action' | 'info'; title: string; detail: string }

export interface DomesticResult {
  sameState: boolean;
  items: RuleItem[];
  doubleTaxRisk: boolean;
}

export function domesticResidency(i: DomesticInput): DomesticResult {
  const items: RuleItem[] = [];
  const home = states[i.homeState]?.name ?? i.homeState;
  const work = states[i.workState]?.name ?? i.workState;

  if (i.homeState === i.workState) {
    items.push({ kind: 'ok', title: 'Same state', detail: `You live and work in ${home} — no cross-border state issue. You file one resident return.` });
    return { sameState: true, items, doubleTaxRisk: false };
  }

  let doubleTaxRisk = false;

  // DC never taxes nonresident wages.
  if (i.workState === 'DC' && DC_EXEMPTS_ALL_NONRESIDENTS) {
    items.push({ kind: 'ok', title: 'DC exempts nonresident wages', detail: `By federal law, Washington DC cannot tax the wages of any nonresident. You pay only ${home} tax on this income.` });
    return { sameState: false, items, doubleTaxRisk: false };
  }

  // Reciprocity: file the exemption form, home state only.
  if (hasReciprocity(i.homeState, i.workState)) {
    const form = reciprocity[i.homeState]?.exemptionForm;
    items.push({ kind: 'ok', title: 'Reciprocity agreement', detail: `${home} and ${work} have a wage reciprocity agreement: you pay tax only to ${home}.${form ? ` File ${form} with your employer to stop ${work} withholding.` : ''}` });
    if (reciprocity[i.homeState]?.note) items.push({ kind: 'info', title: 'Reciprocity condition', detail: reciprocity[i.homeState]!.note! });
    return { sameState: false, items, doubleTaxRisk: false };
  }

  // Convenience-of-the-employer state as the work state.
  const c = CONV[i.workState];
  if (c?.applies) {
    if (i.employerNecessity) {
      items.push({ kind: 'info', title: `${work} convenience rule — necessity exception`, detail: `${work} applies a "convenience of the employer" rule, but it usually doesn't apply when the employer requires the remote work for a genuine business reason. Keep evidence of that necessity. ${c.nuance}` });
    } else {
      doubleTaxRisk = true;
      items.push({ kind: 'warning', title: `${work} convenience rule may tax you`, detail: `${work} can treat your wages as ${work}-source even though you work from ${home}, because the remote work is for your convenience, not the employer's. ${c.nuance} That risks tax in both states.` });
      items.push({ kind: 'action', title: 'Claim the credit for taxes paid', detail: `${home} should give you a credit for taxes paid to ${work}, which usually prevents true double taxation — but you file in both states. Confirm the mechanics.` });
    }
    items.push({ kind: 'info', title: 'Confirm the rule', detail: CONV_COPY });
    return { sameState: false, items, doubleTaxRisk };
  }

  // Default: work state taxes at source, home state credits.
  items.push({ kind: 'action', title: `File a nonresident ${work} return`, detail: `${work} taxes income earned there; ${home} taxes you as a resident and gives a credit for taxes paid to ${work}. You file a nonresident ${work} return and a resident ${home} return.` });
  items.push({ kind: 'info', title: 'Other state rules may apply', detail: CONV_COPY });
  return { sameState: false, items, doubleTaxRisk: false };
}

export interface InternationalInput {
  country: string;
  foreignEarnedIncome: number;
  otherUSIncome: number;
  filingStatus?: string;
}

export interface InternationalResult {
  countryName: string;
  feieLimit: number;
  feie: ReturnType<typeof feie>;
  totalizationAgreement: boolean | null;
  items: RuleItem[];
}

export function internationalResidency(i: InternationalInput): InternationalResult {
  const c = COUNTRIES[i.country];
  const name = c?.name ?? i.country;
  const status = i.filingStatus || 'single';
  const f = feie(i.foreignEarnedIncome, i.otherUSIncome, status);

  const items: RuleItem[] = [];
  items.push({ kind: 'info', title: 'You still owe US tax', detail: `As a US citizen you're taxed on worldwide income wherever you live. Working from ${name} does not remove US filing — it changes what relief you can claim.` });

  items.push({ kind: 'action', title: 'FEIE vs the Foreign Tax Credit', detail: `The Foreign Earned Income Exclusion can exclude up to ${FEIE_LIMIT.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} of earned income for 2026 if you pass the Physical Presence (330 days abroad) or Bona Fide Residence test. In a high-tax country the Foreign Tax Credit is often better; you can't use both on the same income.` });
  if (f.taxWithFeie < f.taxWithoutFeie) {
    items.push({ kind: 'ok', title: 'FEIE would cut your US tax here', detail: `On these numbers, the FEIE lowers US federal tax from about ${f.taxWithoutFeie.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} to ${f.taxWithFeie.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} — but only if you meet a residence test. This is an estimate, not a filing.` });
  }

  if (c?.totalization_agreement === true) {
    items.push({ kind: 'ok', title: 'Totalization agreement', detail: `The US has a Social Security totalization agreement with ${name} (per the SSA list), which can stop double social-security taxation — important if you're self-employed. Confirm current status with the SSA.` });
  } else if (c?.totalization_agreement === false) {
    items.push({ kind: 'warning', title: 'No totalization agreement', detail: `The US has no totalization agreement with ${name} (per the SSA list). If you're self-employed, you could face social-security tax in both systems. Confirm with the SSA and a professional.` });
  }

  items.push({ kind: 'info', title: 'Tax treaty', detail: DEC.treaties_approved_copy });
  items.push({ kind: 'info', title: 'Digital-nomad visas', detail: DEC.nomad_visa_approved_copy });
  items.push({ kind: 'warning', title: 'The employer-side problem', detail: `Working from ${name} can create permanent-establishment and payroll-registration risk for your employer, not just you. That's the real question behind "can I just do it quietly" — and it's your employer's exposure as well as yours.` });

  return { countryName: name, feieLimit: FEIE_LIMIT, feie: f, totalizationAgreement: c?.totalization_agreement ?? null, items };
}

export const CONVENIENCE_STATES = Object.entries(CONV).filter(([, v]) => v.applies).map(([code, v]) => ({ code, name: v.name }));
export const REMOTE_COUNTRIES = Object.entries(COUNTRIES).map(([code, v]) => ({ code, name: v.name, totalization: v.totalization_agreement }));
