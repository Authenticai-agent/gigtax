# Keyword and page proposals

Proposals that need owner approval before building. Nothing here is built.

---

## S5 — formation comparison-pair pages

**Status: PROPOSED, awaiting approval. Not built.**

The spec sketches `/delaware-vs-wyoming-llc/`, `/delaware-vs-home-state-llc/` "and similar pairs — the tool preset to two columns."

My recommendation is **build four, not the pattern**, and **drop the home-state pattern entirely**. Reasoning below.

### The test each page has to pass

A pair page earns its place only if find-and-replace fails on it: swap one state's name for another throughout, and the page must stop being true. If it still reads correctly, it is templated filler and the duplicate gate should reject it — the gate fails siblings at 70% similarity, and two-column preset pages are exactly the shape that trips it.

That test is what separates the four below from the twenty others one could name.

### Recommended — four pages

| URL | Why find-and-replace fails on it |
|---|---|
| `/california-vs-wyoming-llc/` | **The strongest page available.** California's $800 minimum reaches an out-of-state LLC owned by a California resident whether or not it registers — FTB treats you as doing business if you transact for gain in California. And because Wyoming levies no income tax, there is **no other-state tax to credit**, so the offset is zero and the full California rate applies. Swap in any other state and both halves of that stop being true. |
| `/delaware-vs-wyoming-llc/` | Two genuinely different regimes, not two price points. Delaware: a franchise tax with **two calculation methods** and a default that overcharges, plus a flat $300 LLC tax and no LLC annual report. Wyoming: **no franchise tax at all**, and a licence tax that is the greater of $60 or $0.0002 per dollar of Wyoming-situs assets. Neither description survives a name swap. |
| `/wyoming-vs-nevada-llc/` | Both are sold on privacy and low cost, which is why the comparison is searched — and the cost claim is false for one of them. Wyoming runs about **$60 a year**; Nevada is **$150 annual list plus a $200 business licence, every year**, with an Initial List duplicating the $150 in year one. Roughly a sixfold difference between two states marketed identically. |
| `/delaware-vs-nevada-llc/` | The two "incorporate here" destinations, and their costs diverge in opposite directions by entity. Delaware corp franchise scales on shares with a $250,000 cap for large filers; Nevada's corp **formation and annual list both scale on authorized share value**, to $35,000 and $11,125. A founder choosing between them on price needs both share-based schedules, which no other pair needs. |

### Recommended against — the home-state pattern

`/delaware-vs-home-state-llc/` is not a pair. "Home state" is a variable, so it resolves to one of two things and both are bad:

- **One page with a picker** — which is the hub, already built. A second URL for the same tool is a duplicate with extra steps.
- **51 pages** — Delaware against each state. That is the exact shape the duplicate gate exists to catch, and it would deserve to fail: the Delaware half is identical on all 51 and the home-state half is a fee table.

The hub already answers "Delaware versus where I live" for every state, with the reader's own numbers. A URL per state adds no answer.

### Two-axis check

Calculator × state-pair is **one** axis of variation. Confirmed: no entity-type URLs (`/delaware-vs-wyoming-llc-vs-s-corp/` and similar) — that would be a second axis and is explicitly out. Entity type stays an input on the page, as it is on the hub.

Four pages, one axis.

### What each page would contain

- The two-column comparison, preset, with the reader's operating state still an input — because the answer depends on it and presetting it would fabricate the premise.
- The myth warning in full, as on every spoke.
- **The specific asymmetry**, which is the page's reason to exist and the thing that fails find-and-replace.
- Both states' real regimes from the dataset, not a price table.
- The `unquantified` markers, since Nevada and Delaware both carry share-scaled fees stored as minimums.

### Risks, stated plainly

1. **Duplicate gate.** Four pair pages sharing a calculator and a myth warning will sit close together. The asymmetry paragraphs are what pull them apart, and if they do not, the gate will fail the build and the right response is to cut pages rather than pad them.
2. **Marginal value over the hub.** Honestly assessed: the hub plus three spokes already answer these questions. These four pages are a search-intent play, not a coverage gap. That is a legitimate reason to build them and not a reason to pretend otherwise.
3. **Nevada and Delaware figures are minimums.** Both have share-scaled fees. Any page comparing them on price has to say so prominently or it misleads at exactly the moment it is most persuasive.

### If approved

Four pages. Build order by strength: California/Wyoming first, since it is the one with a verified legal asymmetry behind it rather than a fee difference.

### If not approved

Nothing is lost. The hub answers all four questions with the reader's own numbers, which is the better answer in every case except search visibility.

---

## Phase 15 — platform expansion

**Status: PROPOSED, awaiting approval. Nothing built.**

The `[platform]` route already builds a brand page for any brand that has a *scenario* in `overrides/platform-scenarios.json`. 16 brands have one today (uber, lyft, doordash, grubhub, instacart, shipt, amazon-flex, taskrabbit, rover, etsy, ebay, shopify, youtube, onlyfans, airbnb, turo). The dataset holds ~36 more brands with fee data but no scenario, so no page.

Building a page = authoring a scenario (the brand-specific worked example and fee stack). The page must pass the find-and-replace test the duplicate gate enforces: swap the brand name and its fee figures and the page must stop being true, or it is filler and the 70%-similarity gate rejects it. That test is what decides which of the candidates below are worth pages.

### Tier 1 — build now (data present, distinct fee structure, clear search intent)

Grouped by the island each would use, as the phase spec directs.

**Sellers → SellerProfitCalculator** (distinct fee stacks, real COGS story):
- `/amazon-fba-tax-calculator/` — referral ~15% + FBA fulfilment + storage
- `/poshmark-tax-calculator/` — flat fee structure, resale COGS
- `/mercari-tax-calculator/` — 10% + processing
- `/facebook-marketplace-tax-calculator/` — personal-vs-business line, local pickup
- `/stockx-goat-tax-calculator/` — authentication + seller fees, resale-as-business
- `/printful-printify-tax-calculator/` — print-on-demand base cost = COGS
- `/gumroad-tax-calculator/` — 10% platform fee, digital goods
- `/stan-store-tax-calculator/` — 5% fee, creator storefront

**Creators → BrandDealCalculator / creator preset**:
- `/tiktok-tax-calculator/`, `/instagram-tax-calculator/`, `/twitch-tax-calculator/`,
  `/patreon-tax-calculator/`, `/substack-tax-calculator/`, `/ugc-creator-tax-calculator/`

**Gig / rental → GigUnitEconomics presets / rental**:
- `/spark-tax-calculator/` (Walmart Spark delivery — mileage-led, like the driver set)
- `/vrbo-tax-calculator/`, `/getaround-tax-calculator/` (rental hosts)
- `/thumbtack-tax-calculator/` (services/tasks)

That is ~21 pages. Each maps to a scenario I would author from the dataset's fee figures — no invented numbers.

### Tier 2 — data-needed (blocked)

No fee data in the dataset; each needs verified figures before a page: **upwork, fiverr, uber-eats, roadie, walmart-marketplace, depop, whatnot, kick**. These stop at the never-invent rule until the owner supplies (or asks me to research, with sources) their fee structures.

### Skip — not platforms

Present in the data but they are professions or income *types*, not brand-name search intent, and folding them into a page would duplicate the profession/category pages: `handyman_1099`, `cleaning`, `lawn_care`, `babysitter_nanny_1099`, `affiliate`, `podcast`, `sponsorship_income`, `online_course_creator`, `newsletter_business`, and the rental sub-types already covered by the rental hub (`rv_rental`, `boat_rental`, `equipment_rental`, `parking_space_rental`, `storage_rental`, `landlord`, `real_estate_agent_rental`, `short_vs_long_term_rental`).

### Recommendation

Build **Tier 1** in one phase, verifying each page against the duplicate gate as it is authored — if a brand's scenario cannot be made to fail find-and-replace (its fee stack is identical to a sibling's), cut it rather than pad it. Defer **Tier 2** until the fee data is signed off. Skip the non-platforms.

---

## Open questions — gambling and betting calculators

The owner's larger request listed ~200 betting/casino/poker/lottery/prediction calculators. These split cleanly into two very different buckets.

### On-brand: gambling *tax* calculators (a future phase, recommended)

These are tax calculators and fit the site. The engine already exists (`src/lib/gambling.ts`, with the 2026 90%-loss rule). A focused set would extend it:
- lottery take-home: lump-sum vs annuity, Powerball / Mega Millions, state withholding
- W-2G withholding, gambling without a W-2G, professional vs casual gambler
- multi-state gambling winnings, state gambling tax
- gambling income's knock-on effects: ACA subsidies, IRMAA, Social Security taxability, credit phase-outs — each of which the site already models elsewhere and could compose
- quarterly set-aside on a big win

Recommendation: build a **gambling-tax phase** of ~10–15 of these on the existing engine, one-engine-many-presets. On-brand, high differentiation (most betting sites ignore tax).

### Off-brand: betting *odds* tools (do not build here)

The other ~172 (parlay, arbitrage, Kelly, hedge, poker equity, casino house-edge / RTP, prediction-market pricing) are gambling *tools*, not tax. Building them would pivot MoneyScope from a 2026 tax-calculator site into a gambling-tools site, at a scale (170+ pages) that collides with the propose-and-wait and no-duplicate-pages rules. Many would also be near-identical (every "sport-specific spread calculator" is the same math relabeled), which the quality gate would reject.

Recommendation: **do not build these on this site.** If they are wanted, scope them as a separate product with its own domain, engines and content strategy — not folded into a tax site.

**DECISION (owner, 2026-07-23): closed — betting-odds product will not be built.** The tax-relevant angle is fully covered by the shipped gambling-tax calculators (lottery, W-2G, professional gambler, gambling→Social Security, gambling→ACA). No betting-odds tools on MoneyScope; not revisiting unless the owner reopens it as a separate product.
