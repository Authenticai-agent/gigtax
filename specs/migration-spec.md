# MoneyScope migration spec

Purpose: rebuild the MoneyScope tax calculator suite from a client-rendered React SPA into a static Astro site where every URL ships its unique content in raw HTML. Interactive calculators remain React components, mounted as islands. This file is the master plan; execute one phase per session and stop at each definition of done.

## Non-negotiable constraints

1. No backend, no database, no user data collection. All calculation runs client-side. Zero data retention.
2. All tax figures come from the verified 2026 dataset carried over from `legacy/`. Never invent, estimate, or "update" a rate, bracket, threshold, or limit. If a needed figure is missing from the data files, stop and ask.
3. Every generated page must contain its full unique content (title, meta description, H1, explanation, worked example, assumptions, FAQs, related links) in the built HTML file. JavaScript is an enhancement layer for the calculator widget only.
4. Site URL is centralized in one config constant (`SITE_URL`). Canonicals, sitemap, and Open Graph URLs all derive from it. Currently set to the netlify.app URL; will flip to the custom domain at cutover.
5. Do not cross more than two content axes. Calculator × state and calculator × platform are allowed. Calculator × state × platform is not — it produces near-duplicate pages at a scale that risks a quality classification.
6. Plain, specific writing on pages. No filler sentences that could apply to any state or platform. If a paragraph survives find-and-replace of "Ohio" with "Georgia", rewrite it with state-specific facts or delete it.

## Site architecture

Three page tiers:

- Tier 1 — calculator hubs (15–25 pages). One per calculator: /1099-tax-calculator/, /paycheck-calculator/, /quarterly-tax-calculator/, /self-employment-tax-calculator/, /w2-and-1099-income-calculator/, etc. Deepest content on the site. Each hub hosts the interactive calculator plus a full methodology section.
- Tier 2 — state layer (~150 pages initially). The 2 or 3 highest-volume calculators × 50 states + DC: /1099-tax-calculator/ohio/, /paycheck-calculator/florida/. Calculator preset to that state; content built from state data.
- Tier 3 — platform layer (40–80 pages). /1099-tax-calculator/doordash-driver/, /uber-driver/, /etsy-seller/, /onlyfans-creator/, /airbnb-host/, /turo-host/, /youtube-creator/, /brand-deal-tax-calculator/. Only build a platform page if it appears in the keyword list in `specs/keywords.md` (owner maintains this file; if absent, propose the list and wait for approval).

Internal linking rules:
- Every Tier 2/3 page links up to its hub and sideways to 3–4 siblings (nearby states or related platforms).
- Every hub links down to all of its spokes, grouped (states in a compact index, platforms as cards).
- Homepage links to all hubs. No orphan pages.

## Page content contract

Every Tier 2 and Tier 3 page must contain, in this order:

1. Unique `<title>` (≤60 chars) and meta description (≤155 chars) naming the state/platform and year.
2. H1 naming the calculator and the state/platform.
3. The calculator island, preset to the page's context (state selected, or platform deduction profile loaded).
4. Explanation section: how the tax works for this context, using the actual 2026 figures from the data files (state rate or brackets, SE tax 15.3% split, relevant thresholds).
5. One worked example with concrete numbers ("A DoorDash driver in Columbus grossing $48,000 with 14,000 business miles...") computed from the same data files, so the prose can never contradict the calculator.
6. Assumptions block: what the calculator does and doesn't include (filing status default, standard deduction assumed, no local taxes unless modeled, etc.).
7. 4–6 FAQs specific to this page. State pages: state questions (reciprocity, local income taxes, state quarterly deadlines). Platform pages: platform questions (does the platform issue 1099-K or 1099-NEC, typical deductible expenses, mileage vs actual costs).
8. Related tools block per the linking rules.
9. Disclaimer: informational only, not tax advice, verify with IRS.gov or a professional.

Worked examples and explanation figures must be computed at build time from the data files, not hand-written, so a data update regenerates every affected page correctly.

## Data model

`src/data/states.ts` (or .json): per state — name, slug, 2026 income tax structure (flat rate / brackets / none), notable local tax flag, quarterly due dates if state-specific, reciprocity pairs.
`src/data/platforms.ts`: per platform — name, slug, form issued (1099-K / 1099-NEC), 2026 1099-K threshold note, deduction profile (mileage / home office / equipment / supplies with short descriptions), example income used in the worked example.
`src/data/federal.ts`: 2026 federal constants — SE tax rate and split, SS wage base ($184,500), standard deductions, QBI thresholds, quarterly deadlines, retirement limits. Single source; calculators and page prose both import from here.

All figures ported from `legacy/` verified data. Add a `verified: "2026-vX.X"` tag at the top of each data file.

## Technical requirements

- Astro static output (`output: 'static'`). React islands via `client:load` only on calculator components; everything else zero-JS.
- `getStaticPaths` generates Tier 2/3 pages from the data files. One template per tier.
- Self-referencing canonical on every page, built from `SITE_URL`.
- Sitemap generated at build (@astrojs/sitemap), submitted path /sitemap-index.xml.
- No SPA fallback redirect. If a `_redirects` or netlify.toml redirect of the form `/* /index.html 200` exists, remove it. Keep a real 404.astro page.
- Meta robots default index,follow. `legacy/` excluded from the build entirely.
- Lighthouse targets on a Tier 2 page: performance and SEO ≥ 95 mobile. No layout shift from island hydration (reserve the calculator's space).

## Phases

### Phase 1 — carry-over and scaffold audit
Inventory `legacy/`: list calculator components, data/constants files, and where the 2026 verified figures live. Copy calculator components into `src/components/calculators/` and adapt imports; port verified figures into the three data files above. Do not restyle or rewrite calculator logic.
Done when: `npm run build` succeeds; a scratch page mounts one calculator island and it computes correctly; data files exist with verified tags; a written inventory of what was carried vs left behind is in `specs/phase1-inventory.md`.

### Phase 2 — layout, homepage, and hub template
Base layout (head management, canonical, nav, footer with disclaimer), homepage linking all planned hubs, and the Tier 1 hub template. Build 3 real hubs end-to-end (1099, paycheck, quarterly) with full methodology content drafted from the data files, flagged `<!-- REVIEW -->` for owner approval.
Done when: 3 hubs build as static HTML with unique titles/metas/canonicals; View Source shows full content without JS; owner has a review list.

### Phase 3 — Tier 2 template and one pilot state
The state page template with the full content contract, wired to `getStaticPaths`. Generate Ohio only, for the 1099 calculator, as the pilot.
Done when: `dist/1099-tax-calculator/ohio/index.html` passes the raw-HTML test (unique title, meta, H1, Ohio figures, worked example computed from data, 4–6 Ohio FAQs, related links); owner approves the pilot before scale-out.

### Phase 4 — state scale-out
Generate all states for the approved calculators (start with 1099 and paycheck). Sibling-link logic (neighboring states), hub state index.
Done when: ~100 state pages build; 5 random pages pass the raw-HTML test; no two pages share a title or meta; build time and dist size reported.

### Phase 5 — platform layer
Tier 3 template and pages per the approved platform list. Deduction profiles preset the calculator; worked examples use platform example incomes.
Done when: all approved platform pages build and pass the raw-HTML test; each links to its hub and 3–4 related platforms.

### Phase 6 — technical SEO and deploy readiness
Sitemap, robots, 404, Open Graph tags, JSON-LD (Organization + WebApplication on hubs only — no FAQ markup unless owner asks), redirect map from any old URLs worth preserving, Lighthouse run on 3 sample pages, and a netlify.toml with build settings. Delete `legacy/`.
Done when: full build passes all checks in this spec; `specs/cutover-checklist.md` written for the domain switch.

## Session protocol for Claude Code

Read this file at the start of every session. Execute only the named phase. Where content requires a judgment call about tax substance, stop and ask rather than approximating. Mark all generated prose that makes factual tax claims with the data-file field it derives from, so review is traceable. At the end of a phase, output: what was built, what needs owner review, and the acceptance-check results.