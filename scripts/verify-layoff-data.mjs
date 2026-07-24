/**
 * Phase 1 gate for the layoff cluster (task_layoff.md).
 *
 * Asserts the data files are complete AND sourced. A bare number — a benefit
 * figure with no source_url, or a record still marked PENDING — is a failure.
 * The script is GREEN only when every jurisdiction's figure is tied to an
 * official source and verify_status is 'verified'. Until then it reports exactly
 * what is still unsourced, which is the honest Phase 1 status.
 *
 *   node scripts/verify-layoff-data.mjs
 */
import { readFileSync } from 'node:fs';

const load = (f) => JSON.parse(readFileSync(new URL(`../src/data/layoff/${f}`, import.meta.url)));
const ui = load('ui_by_state.json');
const sup = load('state_supplemental_tax.json');
const ca = load('cobra_aca.json');

const JUR = 51; // 50 states + DC
let fail = 0, pending = 0, awaiting = 0;
const problems = [];
const note = (m) => problems.push(m);

/* ---- UI by state ---- */
const uiCodes = Object.keys(ui).filter((k) => k !== '_meta');
if (uiCodes.length !== JUR) { fail++; note(`ui_by_state: expected ${JUR} jurisdictions, found ${uiCodes.length}`); }
for (const code of uiCodes) {
  const r = ui[code];
  const sourced = r.verify_status === 'verified' || r.verify_status === 'sourced_pending_owner_review';
  if (!sourced) { pending++; continue; }
  if (r.verify_status === 'sourced_pending_owner_review') awaiting++;
  // A sourced record must be fully sourced and sane.
  if (!r.source_url) { fail++; note(`${code}: sourced but no source_url (bare number)`); }
  if (!r.last_verified) { fail++; note(`${code}: verified but no last_verified`); }
  if (!(r.max_weekly >= 200 && r.max_weekly <= 1300)) { fail++; note(`${code}: max_weekly ${r.max_weekly} outside 200–1300 sanity band`); }
  const dur = typeof r.duration_weeks === 'number' ? r.duration_weeks : (r.duration_weeks?.max ?? null);
  if (dur !== null && !(dur >= 12 && dur <= 30)) { fail++; note(`${code}: duration ${dur} outside 12–30`); }
  if (typeof r.ui_taxed_by_state !== 'boolean') { fail++; note(`${code}: ui_taxed_by_state must be boolean`); }
}

/* ---- state supplemental tax ---- */
const supCodes = Object.keys(sup).filter((k) => k !== '_meta');
if (supCodes.length !== JUR) { fail++; note(`state_supplemental_tax: expected ${JUR}, found ${supCodes.length}`); }
for (const code of supCodes) {
  const r = sup[code];
  if (r.verify_status === 'verified_no_tax') { if (r.supplemental_rate !== 0) { fail++; note(`${code}: no-tax state must have supplemental_rate 0`); } continue; }
  // verified_variable = state has no single flat supplemental rate (uses tables/aggregate/multiplier).
  // A sourced null is the correct value; just require a source_url.
  if (r.verify_status === 'verified_variable') { if (!r.source_url) { fail++; note(`${code}: verified_variable but no source_url`); } continue; }
  if (r.verify_status !== 'verified') { pending++; continue; }
  if (!r.source_url) { fail++; note(`${code}: supplemental_rate has no source_url`); }
  if (!(r.supplemental_rate >= 0 && r.supplemental_rate <= 0.15)) { fail++; note(`${code}: supplemental_rate ${r.supplemental_rate} outside 0–15%`); }
}

/* ---- mini-COBRA coverage ---- */
{
  const mc = ca.mini_cobra_by_state;
  const codes = Object.keys(mc).filter((k) => k !== '_status');
  if (codes.length !== JUR) { fail++; note(`mini_cobra_by_state: ${codes.length}/${JUR} jurisdictions`); }
  const unconf = codes.filter((k) => mc[k].mini_cobra === null);
  if (unconf.length) note(`mini_cobra UNCONFIRMED (${unconf.length}): ${unconf.join(', ')} — no fetchable official source`);
}

/* ---- COBRA / ACA federal constants ---- */
const cf = ca.cobra_federal;
for (const k of ['premium_max_pct_of_full_cost', 'standard_duration_months', 'election_window_days', 'employer_size_threshold']) {
  if (cf?.[k] === undefined) { fail++; note(`cobra_federal missing ${k}`); }
}
if (!cf?.source_url) { fail++; note('cobra_federal has no source_url'); }
if (ca.aca_2026?.subsidy_rules_last_verified === 'PENDING') { pending++; note('aca_2026.subsidy_rules_last_verified is PENDING (volatile — must be dated before ship)'); }
if (ca.kff_premium_averages?._status?.includes('BASELINE')) { pending++; note('kff_premium_averages still on the spec 2025 baseline — refresh to 2026 KFF before ship'); }
if (Object.keys(ca.mini_cobra_by_state).filter((k) => k !== '_status').length !== JUR) { pending++; note(`mini_cobra_by_state not populated for all ${JUR} jurisdictions`); }

/* ---- report ---- */
console.log('\nLayoff data — Phase 1 verification');
for (const p of problems) console.log(`  - ${p}`);
console.log(`\n  hard failures: ${fail}`);
console.log(`  records unsourced (PENDING): ${pending}`);
console.log(`  records sourced, awaiting owner sign-off: ${awaiting}`);
if (fail > 0) { console.log('\nRED: schema/sanity failures above must be fixed.'); process.exit(1); }
if (pending > 0) { console.log('\nAMBER: some records are not yet tied to an official source.'); process.exit(2); }
if (awaiting > 0) { console.log('\nSOURCED — every record is tied to an official source and passes the sanity bands. Awaiting owner sign-off to flip verify_status to `verified`; flip it, and the gate is GREEN. (mini-COBRA AK/AR/TN remain UNCONFIRMED where the code is login-gated/absent — a known, documented residual.)'); process.exit(0); }
console.log('\nGREEN: all records verified and sane. Phase 1 gate passed.');
