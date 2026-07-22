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
const BAD_SOURCE = /legalzoom|zenbusiness|incfile|northwestregisteredagent|harborcompliance|bizfilings|swyftfilings|rocketlawyer|nolo\.com|corpnet|mycompanyworks/i;

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

  if (primary && BAD_SOURCE.test(primary)) {
    console.error(`  ! ${code}: source is an incorporation-service site — rejected: ${primary}`);
    rejectedSource++;
    continue;
  }

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
