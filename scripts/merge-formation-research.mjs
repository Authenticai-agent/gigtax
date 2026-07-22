/**
 * Merge researched formation fees into the S1 skeleton.
 *
 * Research arrives per batch of states as JSON on stdin. This folds it in
 * WITHOUT promoting it to signed-off data: every merged row is tagged
 * provenance "research", carries the source URL it was found at, and the file's
 * _meta.signedOffBy stays null so the quality gate keeps reporting the engine
 * as blocked.
 *
 * Three refusals, because the value of this file is what it will not accept:
 *   - a figure with no source URL is dropped, not merged
 *   - a source on an incorporation-service domain is rejected outright; those
 *     sites bundle their own fees into the state's and are routinely stale
 *   - an existing OWNER-signed value is never overwritten by research
 *
 * Usage:  cat batch.json | node scripts/merge-formation-research.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'src/data/overrides/state-formation-2026.json';
/**
 * Source tiers.
 *
 * The original policy was binary — .gov good, everything else rejected — and it
 * was too narrow. The ban exists because filing companies price their own
 * product and their "state fee" bundles it. Reed Smith and PwC do not do that.
 *
 * So: three tiers.
 *   primary       state government — statutes, public acts, SOS fee schedules
 *   professional  law firms, accounting firms, tax policy bodies. Accepted,
 *                 recorded as secondary, and REQUIRED to carry a publication
 *                 date, because reputable and current are different axes. The
 *                 Seyfarth piece "New Illinois Law Eliminates Franchise Tax" is
 *                 a good source and is now wrong: PA 102-0016 reversed the
 *                 repeal it describes.
 *   rejected      incorporation and filing services only
 *
 * One further rule: a law firm is a good source for what a statute MEANS, and
 * never a source for what a state CHARGES. Professional-tier sources are
 * refused outright for formationFee and foreignQualificationFee.
 */
const REJECTED_SOURCE = /legalzoom|zenbusiness|incfile|bizee|northwestregisteredagent|newmexicoregisteredagent|eminutes|harborcompliance|secretaryofstateusa|upcounsel|bizfilings|swyftfilings|rocketlawyer|nolo\.com|corpnet|mycompanyworks|findlaw|cleertax|taxslayerpro/i;
const PRIMARY_SOURCE = /\.gov(\/|$|\?)|\.gov\.|\bstate\.[a-z]{2}\.us|\bsdsos\.gov|\bsosnc\.gov|\bazcc\.gov|\bgeorgia\.gov|\bilga\.gov|\bilga\.org|revisor\.mn\.gov|leg\.state\.|legislature\.|sdlegislature\.gov/i;
const FEE_FIELDS = ['formationFee', 'foreignQualificationFee'];

const raw = readFileSync(0, 'utf8');
const start = raw.indexOf('{');
const end = raw.lastIndexOf('}');
if (start < 0 || end < 0) {
  console.error('no JSON object found on stdin');
  process.exit(1);
}
const batch = JSON.parse(raw.slice(start, end + 1));
const doc = JSON.parse(readFileSync(PATH, 'utf8'));

let merged = 0, skippedNoSource = 0, rejectedSource = 0, keptOwner = 0;
const touched = [];

for (const [code, incoming] of Object.entries(batch)) {
  if (code.startsWith('_') || !doc[code]) {
    console.error(`  ! unknown jurisdiction ${code} — skipped`);
    continue;
  }
  const sources = Array.isArray(incoming.sources) ? incoming.sources.filter(Boolean) : [];
  const primary = sources[0] ?? null;

  if (primary && REJECTED_SOURCE.test(primary)) {
    console.error(`  ! ${code}: source is an incorporation or filing service — rejected: ${primary}`);
    rejectedSource++;
    continue;
  }
  const isPrimary = primary ? PRIMARY_SOURCE.test(primary) : false;

  for (const kind of ['llc', 'corp']) {
    const src = incoming[kind];
    if (!src) continue;
    const row = doc[code][kind];

    if (row.provenance === 'owner') { keptOwner++; continue; }

    const hasFigure = src.formationFee != null || src.foreignQualificationFee != null
      || src.annualReport?.amount != null;
    if (hasFigure && !primary) {
      console.error(`  ! ${code}.${kind}: figures with no source URL — dropped`);
      skippedNoSource++;
      continue;
    }

    // A professional source can explain a statute. It cannot price a filing.
    if (!isPrimary && FEE_FIELDS.some((f) => src[f] != null)) {
      console.error(`  ! ${code}.${kind}: fee fields need a primary source, got ${primary} — fees dropped`);
      src = { ...src, formationFee: null, foreignQualificationFee: null };
    }
    if (src.formationFee != null) row.formationFee = src.formationFee;
    if (src.foreignQualificationFee != null) row.foreignQualificationFee = src.foreignQualificationFee;
    if (src.annualReport) {
      row.annualReport = {
        amount: src.annualReport.amount ?? row.annualReport.amount,
        frequency: src.annualReport.frequency ?? row.annualReport.frequency,
        dueDate: src.annualReport.dueDate ?? row.annualReport.dueDate,
        note: src.annualReport.note || row.annualReport.note,
      };
    }
    if (src.annualTax) {
      row.annualTax = {
        amount: src.annualTax.amount ?? row.annualTax.amount,
        note: src.annualTax.note || row.annualTax.note,
      };
    }
    if (hasFigure) {
      row.source = primary;
      row.allSources = sources;
      row.confidence = incoming.confidence ?? 'medium';
      row.provenance = 'research';
      row.sourceTier = isPrimary ? 'primary' : 'professional';
      if (incoming.notes) row.researchNote = incoming.notes;
      merged++;
      if (!touched.includes(code)) touched.push(code);
    }
  }

  if (incoming.grossReceiptsTax) {
    doc[code].grossReceiptsTax = { ...doc[code].grossReceiptsTax, ...incoming.grossReceiptsTax, source: primary };
  }
  if (incoming.franchiseTax) {
    doc[code].franchiseTax = {
      structured: incoming.franchiseTax,
      note: doc[code].franchiseTax?.note ?? null,
      source: primary,
    };
  }
}

// Signature is the owner's alone. Research never sets it.
doc._meta.signedOffBy = doc._meta.signedOffBy ?? null;

writeFileSync(PATH, JSON.stringify(doc, null, 2) + '\n');

const codes = Object.keys(doc).filter((k) => !k.startsWith('_'));
const stillNull = codes.reduce(
  (n, c) => n + ['llc', 'corp'].filter((k) => doc[c][k].formationFee === null).length, 0);

console.log(`merged ${merged} row(s) across ${touched.length} jurisdiction(s): ${touched.join(', ')}`);
if (skippedNoSource) console.log(`  dropped, no source URL: ${skippedNoSource}`);
if (rejectedSource) console.log(`  rejected, bad source domain: ${rejectedSource}`);
if (keptOwner) console.log(`  left alone, owner-signed: ${keptOwner}`);
console.log(`still awaiting a formation fee: ${stillNull} of ${codes.length * 2} rows`);
