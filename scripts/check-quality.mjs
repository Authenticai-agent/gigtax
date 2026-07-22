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
 *   7. A state that has an income tax must not compute to $0.
 *   8. Cross-section duplication: /1099.../ohio/ vs /paycheck.../ohio/, with a
 *      higher line inside a declared family — see FAMILIES.
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

/* ---- 1c. cross-section duplication --------------------------------------- */

/**
 * Two pages about the same state in different sections — /1099-tax-calculator/
 * ohio/ and /paycheck-calculator/ohio/ — should be answering different
 * questions. The sibling check above cannot see this: it only ever compares
 * pages within one section, so an entire new section that quietly restated an
 * existing one would pass it.
 *
 * That is the live risk at scale. Adding fifteen platforms x 51 states puts 765
 * pages next to the 51 1099 state pages, and the thing that makes them worth
 * having is the platform's own deduction profile and example income, not the
 * state layer they share.
 *
 * Calibrated against the four sections that exist: the worst cross-section pair
 * is 1099 vs quarterly for Maryland at 22%, median 15%. 45% leaves generous
 * room and still catches a section that is mostly a restatement.
 */
const CROSS_FAIL_AT = 0.45;
const CROSS_WARN_AT = 0.35;

/**
 * Sections that are variants of ONE question rather than different questions.
 *
 * /1099-tax-calculator/ohio/ and /quarterly-tax-calculator/ohio/ ask different
 * things about Ohio — what does the year cost, versus what do I send in April.
 * They sit at 21%. /gig-driver-tax-calculator/ohio/ and
 * /seller-tax-calculator/ohio/ ask the SAME thing — what do I owe on
 * self-employment income in Ohio — and differ in the expense profile that gets
 * there. Half of each page is the state, and the state does not change between
 * them. They sit at 48%.
 *
 * The 45% line was calibrated against the first kind of comparison and is the
 * wrong instrument for the second. Rather than relax it globally — which would
 * stop it catching a genuinely duplicated section — sections in the same family
 * are held to a higher line, and the reason is written down here so a future
 * change has to argue with it rather than inherit it.
 *
 * This is NOT a licence to add sections to a family to make a failure go away.
 * A family means the pages answer one question. If two sections answer
 * different questions and score above 45%, one of them is redundant.
 */
const FAMILIES = [
  {
    name: 'gig income by expense profile',
    sections: [
      'gig-driver-tax-calculator', 'gig-services-tax-calculator',
      'creator-tax-calculator', 'seller-tax-calculator', 'rental-host-tax-calculator',
    ],
    failAt: 0.55,
    why: 'One question — self-employment tax on gig income in this state — asked for five expense profiles.',
  },
];

function familyOf(section) {
  return FAMILIES.find((f) => f.sections.includes(section)) ?? null;
}

const bySpoke = new Map();
for (const p of pages) {
  const parts = p.url.split('/').filter(Boolean);
  if (parts.length < 2) continue; // hubs have no spoke
  const spoke = parts[parts.length - 1];
  if (!bySpoke.has(spoke)) bySpoke.set(spoke, []);
  bySpoke.get(spoke).push(p);
}

const crossWorst = [];
for (const [spoke, group] of bySpoke) {
  if (group.length < 2) continue;
  const grams = group.map((p) => trigrams(p.text));
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      if (group[i].section === group[j].section) continue;
      const sim = jaccard(grams[i], grams[j]);
      // Same family: one question, several expense profiles. Different families:
      // different questions, and the tighter line applies.
      const fa = familyOf(group[i].section);
      const fb = familyOf(group[j].section);
      const sameFamily = fa !== null && fa === fb;
      const failAt = sameFamily ? fa.failAt : CROSS_FAIL_AT;
      crossWorst.push({ spoke, sim, a: group[i].url, b: group[j].url, sameFamily });
      if (sim >= failAt) {
        failures.push(
          `cross-section ${(sim * 100).toFixed(0)}%: ${group[i].url} vs ${group[j].url}`
            + (sameFamily ? ` (same family, limit ${failAt * 100}%)` : ''),
        );
      } else if (sim >= CROSS_WARN_AT && !sameFamily) {
        warnings.push(`cross-section ${(sim * 100).toFixed(0)}%: ${group[i].url} vs ${group[j].url}`);
      }
    }
  }
}
crossWorst.sort((a, b) => b.sim - a.sim);

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

/* ---- 3b. sections unreachable from the home page ------------------------- */

/**
 * A section hub the home page does not link to.
 *
 * Added after 28 of 34 section hubs — every platform, every gig category, four
 * of the five equity instruments, local income tax and the profession profiles
 * — turned out to be unreachable. The gate was green throughout, because
 * nothing was broken. The pages were just invisible.
 *
 * The first version of this check tested for hubs with NO inbound links at all
 * and caught nothing, because every child page carries a breadcrumb back to its
 * own hub. A section can be entirely unreachable from the front door and still
 * be densely linked from inside itself. So the test is specifically reachability
 * from the home page, which on a static site with no search is the only entry
 * point a reader or a crawler is guaranteed to have.
 *
 * Zero tolerance, deliberately. An earlier draft allowed six exceptions and that
 * slack was enough to let a removed link pass unnoticed when it was tested.
 */
const hubs = pages.filter((p) => (p.url.match(/\//g) || []).length === 2 && p.url !== '/');
const home = pages.find((p) => p.url === '/');
if (!home) {
  failures.push('no home page in dist');
} else {
  const fromHome = new Set([...home.html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]));
  const unreachable = hubs.filter((h) => !fromHome.has(h.url)).map((h) => h.url);
  for (const url of unreachable) failures.push(`unreachable: the home page does not link to ${url}`);
  console.log(`  ${unreachable.length === 0 ? 'ok  ' : 'FAIL'}  ${hubs.length} section hubs, all linked from the home page`);
}

/* ---- 3c. uncited statutory claims ----------------------------------------- */

/**
 * A page that names a statute but cites nothing.
 *
 * The profession pages divide into two kinds. Most describe ordinary practice —
 * tools are deductible, mileage needs a log — which needs no citation. A few
 * assert something specific and surprising: that a cannabis business cannot
 * deduct rent, that architects keep a deduction lawyers lose, that a property
 * flipper gets no capital gains treatment. Those are claims a reader may act on,
 * and they were originally shipped with nothing behind them but my say-so.
 *
 * This warns where a page names a provision without linking to one. It is a
 * warning rather than a failure because the right response is sometimes to
 * soften the claim rather than to find a citation for it.
 */
/*
 * Deliberately NOT every statute reference. The first draft matched "Section
 * 179" and flagged 51 pages, which is noise: Section 179 is the common name of
 * a rule every one of these trades uses and the deductions page explains it in
 * full. What needs a citation is the claim a reader would be surprised by and
 * might act on.
 */
const LOAD_BEARING = /\b(280E|199A|1031|263A|469|163\(j\)|45B|280F|like-kind|percentage depletion|specified service|written into the statute|statutory exception|excise tax|floor plan)\b/i;
const uncited = [];
for (const p of pages) {
  if (!p.url.startsWith('/self-employed-tax-calculator/')) continue;
  if (!LOAD_BEARING.test(p.text)) continue;
  if (p.html.includes('Where this comes from')) continue;
  uncited.push(p.url);
}

/* ---- 3d. formation dataset schema ---------------------------------------- */

/**
 * The formation dataset is the one file on this site whose NULLS are load-bearing.
 *
 * Filing fees change every year and are exactly what the never-invent rule
 * covers, so an unresearched figure must stay null and the calculator must show
 * it as unquantified rather than omitting it from a total. The failure this
 * guards against is a number appearing without a source — which is how a
 * plausible guess becomes a figure someone forms a company on.
 *
 * It also refuses incorporation-service sources. Those sites bundle their own
 * fees into the state's, so a figure sourced from one is wrong even when it
 * looks right.
 */
const FORMATION_PATH = 'src/data/overrides/state-formation-2026.json';
if (existsSync(FORMATION_PATH)) {
  const fd = JSON.parse(readFileSync(FORMATION_PATH, 'utf8'));
  const BAD_SOURCE = /legalzoom|zenbusiness|incfile|northwestregisteredagent|harborcompliance|bizfilings|swyftfilings|rocketlawyer|nolo\.com/i;
  const codes = Object.keys(fd).filter((k) => !k.startsWith('_'));

  if (codes.length !== 51) {
    failures.push(`formation dataset: expected 51 jurisdictions, found ${codes.length}`);
  }
  for (const code of codes) {
    for (const kind of ['llc', 'corp']) {
      const row = fd[code]?.[kind];
      if (!row) { failures.push(`formation dataset: ${code}.${kind} missing`); continue; }
      // A figure without a source is the failure mode this file exists to prevent.
      const hasFigure = row.formationFee !== null || row.foreignQualificationFee !== null
        || row.annualReport?.amount !== null;
      if (hasFigure && !row.source) {
        failures.push(`formation dataset: ${code}.${kind} has a figure but no source`);
      }
      // A fee that scales cannot be represented by one number. Where the
      // research found one that does, the stored figure is a MINIMUM and the
      // engine has to say so — otherwise a floor reads as a price.
      if (row.feeVaries === true && !row.feeVariesNote) {
        failures.push(`formation dataset: ${code}.${kind} is marked feeVaries with no note explaining what it scales with`);
      }
      if (row.source && BAD_SOURCE.test(row.source)) {
        failures.push(`formation dataset: ${code}.${kind} cites an incorporation-service site, which bundles its own fees: ${row.source}`);
      }
    }
  }
  const nulls = codes.reduce((n, c) => n + ['llc', 'corp']
    .filter((k) => fd[c][k].formationFee === null).length, 0);
  const signed = Boolean(fd._meta?.signedOffBy);
  console.log(`  ${signed ? 'ok  ' : 'note'}  formation dataset: ${codes.length} jurisdictions, ${nulls} of ${codes.length * 2} rows still awaiting a fee${signed ? '' : ' — NOT signed off, engine blocked'}`);
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

if (crossWorst.length) {
  const worstCross = crossWorst[0];
  const worstLimit = worstCross.sameFamily
    ? (FAMILIES.find((f) => f.sections.includes(worstCross.a.split('/')[1]))?.failAt ?? CROSS_FAIL_AT)
    : CROSS_FAIL_AT;
  const flag = worstCross.sim >= worstLimit ? 'FAIL' : 'ok  ';
  console.log(`\nAcross sections, same spoke (${crossWorst.length} comparisons):`);
  console.log(`  ${flag}  ${(worstCross.sim * 100).toFixed(0)}%  worst overall: ${worstCross.a} vs ${worstCross.b}`);
  const cm = crossWorst[Math.floor(crossWorst.length / 2)];
  console.log(`        ${(cm.sim * 100).toFixed(0)}%  median`);
  for (const f of FAMILIES) {
    const inFamily = crossWorst.filter((w) => w.sameFamily);
    if (!inFamily.length) continue;
    const worstIn = inFamily[0];
    const flag = worstIn.sim >= f.failAt ? 'FAIL' : 'ok  ';
    console.log(`  ${flag}  ${(worstIn.sim * 100).toFixed(0)}%  within "${f.name}" (limit ${f.failAt * 100}%) — ${f.why}`);
  }
  const crossFamily = crossWorst.filter((w) => !w.sameFamily)[0];
  if (crossFamily) {
    console.log(`  ok    ${(crossFamily.sim * 100).toFixed(0)}%  worst across different families (limit ${CROSS_FAIL_AT * 100}%)`);
  }
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

if (uncited.length) {
  console.log(`\n${uncited.length} page(s) make a load-bearing legal claim with no citation:`);
  for (const u of uncited.slice(0, 15)) console.log(`  uncited: ${u}`);
  if (uncited.length > 15) console.log(`  …and ${uncited.length - 15} more`);
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
