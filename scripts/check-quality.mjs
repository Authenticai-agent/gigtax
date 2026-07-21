/**
 * Quality gate for the built site. Run after `astro build`; exits non-zero on
 * failure so a bad template cannot reach production.
 *
 * The reason this exists: at 389 pages a near-duplicate template is catchable by
 * eye — the quarterly state pages scored 92% against each other before the
 * income ladder was added, and that was found by hand. At 2,000 pages it is not.
 * These checks run on the built HTML, which is the only thing that matters:
 * whatever is not in dist/ does not exist.
 *
 * Checks:
 *   1. Near-duplicate prose between sibling pages in the same section.
 *   2. Duplicate <title> or meta description anywhere on the site.
 *   3. Broken internal links.
 *   4. Missing canonical.
 *   5. Missing the not-tax-advice disclaimer.
 *   6. Empty template slots — "file  with", "a Iowa", stray "undefined"/"NaN".
 *
 * Usage:
 *   node scripts/check-quality.mjs            # gate, exits 1 on failure
 *   node scripts/check-quality.mjs --report   # print the worst pairs, never fails
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const DIST = 'dist';

/**
 * Jaccard similarity over word trigrams. Chosen over an edit-distance ratio
 * because it is order-insensitive and near-linear — the gate has to stay cheap
 * enough to run on every build as the site grows.
 */
const FAIL_AT = 0.70;
const WARN_AT = 0.55;

/** Sections exempt from the sibling check (a hub has no siblings to speak of). */
const MIN_SECTION_SIZE = 3;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name === 'index.html' || name.endsWith('.html')) out.push(p);
  }
  return out;
}

/** The page's own prose: inside <main>, minus scripts, styles and the state select. */
function prose(html) {
  let s = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  s = s.replace(/<script[\s\S]*?<\/script>/g, '');
  s = s.replace(/<style[\s\S]*?<\/style>/g, '');
  s = s.replace(/<select[\s\S]*?<\/select>/g, '');
  s = s.replace(/<[^>]+>/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

function trigrams(text) {
  const w = text.toLowerCase().replace(/[^a-z0-9$%. ]/g, ' ').split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + 2 < w.length; i++) set.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return set;
}

function jaccard(a, b) {
  let shared = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const g of small) if (large.has(g)) shared++;
  return shared / (a.size + b.size - shared);
}

function urlOf(file) {
  const rel = relative(DIST, file);
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${dirname(rel)}/`;
  return `/${rel}`;
}

function sectionOf(url) {
  const parts = url.split('/').filter(Boolean);
  if (parts.length === 0) return 'root';
  // A hub (/1099-tax-calculator/) is its own thing; spokes share the section.
  return parts.length === 1 ? `${parts[0]} (hub)` : parts[0];
}

const report = process.argv.includes('--report');

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const files = walk(DIST);
const pages = files.map((f) => {
  const html = readFileSync(f, 'utf8');
  const url = urlOf(f);
  return {
    file: f,
    url,
    section: sectionOf(url),
    html,
    title: (html.match(/<title>(.*?)<\/title>/) ?? [, ''])[1],
    desc: (html.match(/name="description" content="(.*?)"/) ?? [, ''])[1],
    text: prose(html),
  };
});

const failures = [];
const warnings = [];

/* ---- 1. near-duplicate siblings ------------------------------------------ */

const bySection = new Map();
for (const p of pages) {
  if (!bySection.has(p.section)) bySection.set(p.section, []);
  bySection.get(p.section).push(p);
}

const worst = [];
for (const [section, group] of bySection) {
  if (group.length < MIN_SECTION_SIZE) continue;
  for (const p of group) p.grams = trigrams(p.text);
  for (let i = 0; i < group.length; i++) {
    let max = 0;
    let against = null;
    for (let j = 0; j < group.length; j++) {
      if (i === j) continue;
      const sim = jaccard(group[i].grams, group[j].grams);
      if (sim > max) { max = sim; against = group[j].url; }
    }
    worst.push({ section, url: group[i].url, sim: max, against });
    if (max >= FAIL_AT) failures.push(`near-duplicate ${(max * 100).toFixed(0)}%: ${group[i].url} vs ${against}`);
    else if (max >= WARN_AT) warnings.push(`similar ${(max * 100).toFixed(0)}%: ${group[i].url} vs ${against}`);
  }
  for (const p of group) delete p.grams;
}

/* ---- 1b. absolute unique content ------------------------------------------ */

/**
 * How much of a page exists nowhere else in its section.
 *
 * The similarity ratio above is a proportion, and a proportion flatters a short
 * page: the state-pair pages sat at 75% similar while carrying a median of 17
 * trigrams that no sibling had, against 98-152 for the state pages. One of them
 * had two. A ratio punishes shared scaffolding, which is normal and fine; what
 * actually matters is whether there is enough substance here that exists
 * nowhere else. This measures that directly.
 *
 * Calibrated from the sections that pass on merit: the thinnest 1099 page has
 * 50, the thinnest quarterly 63, the thinnest paycheck 39.
 */
const MIN_UNIQUE = 40;

for (const [section, group] of bySection) {
  if (group.length < MIN_SECTION_SIZE) continue;
  const counts = new Map();
  const grams = group.map((p) => trigrams(p.text));
  for (const g of grams) for (const t of g) counts.set(t, (counts.get(t) ?? 0) + 1);
  group.forEach((p, i) => {
    let unique = 0;
    for (const t of grams[i]) if (counts.get(t) === 1) unique++;
    p.unique = unique;
    if (unique < MIN_UNIQUE) {
      failures.push(
        `thin: ${p.url} has only ${unique} trigram(s) no sibling has (of ${grams[i].size}); ` +
          `section "${section}" needs ${MIN_UNIQUE}`,
      );
    }
  });
}

/* ---- 2. duplicate titles and descriptions -------------------------------- */

for (const field of ['title', 'desc']) {
  const seen = new Map();
  for (const p of pages) {
    const v = p[field];
    if (!v) { failures.push(`missing ${field}: ${p.url}`); continue; }
    if (!seen.has(v)) seen.set(v, []);
    seen.get(v).push(p.url);
  }
  for (const [v, urls] of seen) {
    if (urls.length > 1) failures.push(`duplicate ${field} on ${urls.length} pages (${urls.slice(0, 3).join(', ')}…): "${v.slice(0, 60)}"`);
  }
}

/* ---- 3. broken internal links -------------------------------------------- */

const known = new Set(pages.map((p) => p.url));
for (const p of pages) {
  for (const href of new Set([...p.html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]))) {
    if (href.startsWith('/_astro/') || href.endsWith('.xml') || href.endsWith('.txt')) {
      if (!existsSync(join(DIST, href))) failures.push(`missing asset ${href} (linked from ${p.url})`);
    } else if (!known.has(href)) {
      failures.push(`broken link ${href} (from ${p.url})`);
    }
  }
}

/* ---- 4 & 5. canonical and disclaimer ------------------------------------- */

for (const p of pages) {
  if (!p.html.includes('rel="canonical"')) failures.push(`no canonical: ${p.url}`);
  if (!/not tax advice/i.test(p.html)) failures.push(`no disclaimer: ${p.url}`);
}

/* ---- 6. template artefacts ----------------------------------------------- */

const ARTEFACTS = [
  [/\bundefined\b/, 'literal "undefined"'],
  [/\bNaN\b/, 'literal "NaN"'],
  [/\$\{/, 'unexpanded ${...}'],
  [/\ba (?=[AEIOU][a-z])/, 'article "a" before a vowel-initial name'],
  [/\b(?:file|File)\s{2,}/, 'empty slot after "file"'],
];
for (const p of pages) {
  const body = p.html.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const [re, label] of ARTEFACTS) {
    if (re.test(body)) failures.push(`${label}: ${p.url}`);
  }
}

/* ---- 7. data integrity: a state that taxes income must be computable ------- */

/**
 * West Virginia was rendering $0 of state income tax on every page. Its data
 * entry says `type: "graduated"` with a topRate, but carries no bracket array —
 * so the engine loops over nothing and returns zero. A state that has an income
 * tax must never silently compute to nothing; that is a wrong number presented
 * with the same confidence as a right one.
 */
const statesFile = readFileSync('src/data/states.ts', 'utf8');
// Only the `states` object — stateMetadata below it has nested entries that
// would otherwise match the same shape.
const statesSrc = statesFile.slice(
  statesFile.indexOf('export const states'),
  statesFile.indexOf('export const stateMetadata'),
);
const entryRe = /"(\w{2})":\s*\{([\s\S]*?)\n  \}/g;
for (const [, code, body] of statesSrc.matchAll(entryRe)) {
  const noTax = /"noIncomeTax":\s*true/.test(body) || /"type":\s*"none"/.test(body);
  if (noTax) continue;
  const flat = /"type":\s*"flat"/.test(body) && /"rate":\s*[\d.]/.test(body);
  const graduated = /"type":\s*"graduated"/.test(body) && /"brackets_single":\s*\[/.test(body);
  if (!flat && !graduated) {
    const name = (body.match(/"name":\s*"([^"]+)"/) ?? [, code])[1];
    failures.push(
      `data: ${name} (${code}) has an income tax but no usable rate — every page computes $0 for it. ` +
        `Needs brackets_single (or a flat rate) in src/data/states.ts.`,
    );
  }
}

/* ---- output --------------------------------------------------------------- */

worst.sort((a, b) => b.sim - a.sim);

console.log(`\nQuality gate — ${pages.length} pages, ${bySection.size} sections`);
console.log('\nHighest sibling similarity per section:');
const perSection = new Map();
for (const w of worst) if (!perSection.has(w.section)) perSection.set(w.section, w);
for (const [section, w] of perSection) {
  const flag = w.sim >= FAIL_AT ? 'FAIL' : w.sim >= WARN_AT ? 'warn' : 'ok  ';
  console.log(`  ${flag}  ${(w.sim * 100).toFixed(0).padStart(3)}%  ${section}  (${w.url} vs ${w.against})`);
}

console.log('\nUnique content per page (trigrams no sibling has):');
for (const [section, group] of bySection) {
  if (group.length < MIN_SECTION_SIZE) continue;
  const u = group.map((p) => p.unique ?? 0).sort((a, b) => a - b);
  const median = u[Math.floor(u.length / 2)];
  const thin = u.filter((n) => n < MIN_UNIQUE).length;
  const flag = thin ? 'FAIL' : 'ok  ';
  console.log(
    `  ${flag}  ${section.padEnd(38)} min ${String(u[0]).padStart(4)}  median ${String(median).padStart(4)}` +
      (thin ? `  — ${thin} of ${group.length} page(s) under ${MIN_UNIQUE}` : ''),
  );
}

if (report) {
  console.log('\nWorst 15 pairs overall:');
  for (const w of worst.slice(0, 15)) console.log(`  ${(w.sim * 100).toFixed(0)}%  ${w.url}  vs  ${w.against}`);
}

const uniqWarn = [...new Set(warnings)];
if (uniqWarn.length) {
  console.log(`\n${uniqWarn.length} page(s) above the ${WARN_AT * 100}% warn line:`);
  for (const w of uniqWarn.slice(0, 10)) console.log(`  ${w}`);
  if (uniqWarn.length > 10) console.log(`  …and ${uniqWarn.length - 10} more`);
}

const uniqFail = [...new Set(failures)].sort((a, b) => {
  const rank = (f) => (f.startsWith('near-duplicate') ? 1 : 0);
  return rank(a) - rank(b);
});
if (uniqFail.length) {
  console.log(`\n${uniqFail.length} failure(s):`);
  for (const f of uniqFail.slice(0, 25)) console.log(`  ✗ ${f}`);
  if (uniqFail.length > 25) console.log(`  …and ${uniqFail.length - 25} more`);
  if (!report) {
    console.log('\nQuality gate FAILED.\n');
    process.exit(1);
  }
}

console.log('\nQuality gate passed.\n');
