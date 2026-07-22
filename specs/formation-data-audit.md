# Formation data audit — S1

What the "where should I form my business?" calculator needs, what the repo already has, and exactly what is missing. Written at the end of phase S1. **The engine (S2) is blocked until the owner fills and signs off `src/data/overrides/state-formation-2026.json`.**

## 1. Status

| | |
|---|---|
| Skeleton file | `src/data/overrides/state-formation-2026.json` — 51 jurisdictions × 2 entity types = 102 rows |
| Rows with a formation fee | 6 (all from the legacy harvest, all tagged UNVERIFIED) |
| Rows still null | 96 |
| Signed off | **No.** `_meta.signedOffBy` is null, and the quality gate prints "engine blocked" until it is not. |
| Schema check | Added to `scripts/check-quality.mjs` (section 3d) |

The gate enforces three things on this file: a figure may not exist without a `source`; a `source` may not be an incorporation-service site; and the jurisdiction count must be 51.

## 2. Can each of the 10 output rows be computed today?

| # | Output row | Status | Where it comes from |
|---|---|---|---|
| 1 | Formation cost (one-time) | **Missing** | New file. 6 legacy leads, 96 nulls. |
| 2 | Annual report cost | **Partial** | `state-scorp-tax-2026.json` has `annualReportFee` for 40/51 — but it is **corporation-oriented**. LLC figures differ in almost every state and are not present. |
| 3 | Franchise tax | **Partial** | Delaware: portable from `legacy/js/tax-engine.js calcDelawareFranchiseTax` (both methods, large-filer cap) — real arithmetic. California $800: present in the scorp file. Texas margin: prose only. Everything else: prose or absent. |
| 4 | Corporate / gross-receipts tax | **Prose only** | 9 states carry a `grossReceiptsTax` string: DE, HI, KY, NV, NM, OH, OR, TX, WA. None is machine-readable. Each must either be structured or compute `null` and surface its note. |
| 5 | Registered agent cost | **Not government data** | Deliberately a user-selected tier, seeded from legacy ($50 / $100 / $200) plus self-agent $0. Must be labelled "typical market range". Never a data figure. |
| 6 | **Foreign registration cost** | **Missing — highest priority** | Not in any existing file. This row is the entire editorial point of the tool: without it a Wyoming column wins and the calculator lies. |
| 7 | Federal + state tax | **Available** | `src/lib/entity.ts`, `scorp.ts`, `tax-engine.ts`, `states.ts`. Federal computes once, outside the table, by construction. |
| 8 | Total annual compliance cost | Derived | Sums rows 2–6. Must show "+ unquantified: [item]" wherever a component is null. |
| 9 | Owner take-home | **Available** | Existing entity engine. |
| 10 | Five-year total | Derived | rows 1 + 6 one-time, plus 5 × row 8. No inflation, no fee-change projection. |

**Four of ten rows cannot be computed for most states today.** Rows 1 and 6 are missing outright; row 2 exists only for corporations; row 4 is prose.

## 3. What the existing scorp dataset already gives us

Out of 51 jurisdictions in `state-scorp-tax-2026.json`:

- `annualReportFee` — 40 (corporation-oriented; LLC applicability unverified)
- `minimumAnnualTax` — 18
- `entityLevelIncomeTaxRate` — 6
- `grossReceiptsTax` — 9, all prose
- `recognizesFederalSElection: false` — 4

Everything there was researched against state revenue departments and carries confidence levels. It is a good base for the corporation column and **not** a substitute for LLC data.

## 4. The exact missing list

Per jurisdiction (51), per entity type (LLC and corporation separately):

1. **`formationFee`** — one-time Secretary of State fee. *96 of 102 rows null.*
2. **`foreignQualificationFee`** — one-time out-of-state registration fee. *102 of 102 rows null. Nothing in the repo has ever held this figure.*
3. **`annualReport.amount` for LLCs** — where it differs from the corporation figure, which is nearly everywhere.
4. **`annualTax`** — mandatory annual charges distinct from the report fee (Delaware's LLC tax, California's $800 minimum, Nevada's business licence).

Plus structured replacements for the 9 prose gross-receipts regimes, and the Texas margin-tax and Nevada Commerce-Tax parameters.

## 5. Conflicts

- **South Dakota — RESOLVED.** Legacy said $150 formation and $50 a year. The state fee schedule confirms $150 formation but the annual report is **$55 electronic / $70 paper**; legacy's $50 was wrong. Also found: South Dakota foreign qualification is **$750**, which nothing in the repo had.
All three open conflicts were **resolved by owner decision**. Those rows are now tagged `provenance: "owner"`, which the merge script will not overwrite with later research.

- **Ohio corporation formation — RESOLVED at $125.** ORC 111.16 (effective 3 April 2025) sets $0.10 per share with a **$99** floor, and SOS Form 532A charges $99; the Legislative Service Commission table dated 30 January 2026 prints **$125**. The owner chose $125 — the higher, later-dated figure. This errs in the conservative direction: if the SOS in fact charges $99, the calculator overstates a one-time fee by $26, which is the safer way to be wrong.
- **New Jersey — RESOLVED at $100**, with a standing caveat. The registry schedule shows $100; the widely quoted $125 appears nowhere on nj.gov. The row carries `checkBeforeUse` pointing at the fee schedule, and the quality gate prints that flag on every build so it cannot quietly go stale.
- **Wisconsin — RESOLVED at $25** for the domestic LLC annual report. The foreign figure of $80 was separately confirmed and is unaffected.
- **Delaware LLC vs corporation.** Legacy records $300 annual tax for the LLC and a $50 report for the corporation. Both are seeded, both unverified. A calculator that applied the corporation figure to an LLC would understate Delaware by $250 a year.

## 6. Research in flight

The owner asked for the fees to be researched rather than hand-filled. That research is running against state `.gov` sources only, with per-figure source URLs, and returns `null` wherever a government source could not be confirmed. **Research output is a lead, not a signature.** Per the spec, the owner still signs off on the file as a whole before S2 begins.

Two of the first research passes failed by delegating instead of searching and returned nothing usable; they were re-run with explicit instructions. That is worth recording because it is the failure mode to watch for if this is repeated: an agent that reports success without having done the work.

## 6b. What the research changed (updated during S1)

Research ran against state `.gov` sources only. Findings that matter beyond filling a cell:

**A legacy figure was wrong.** Legacy recorded Wyoming formation at **$102**. The current Secretary of State schedule is **$100**. Every Wyoming figure inherited from legacy should be treated as suspect until re-checked — this is the case for the spec's instruction to re-verify rather than re-use.

**Nevada has a buried annual cost.** On top of the $150 annual list, Nevada charges a **State Business License every year — $200 for an LLC, $500 for a corporation**. A Nevada column that shows only the list fee understates the state by two-thirds. This is the single most misleading omission available in this dataset, because Nevada is marketed on being cheap.

**Fees are not always flat, and a minimum is not a price.** Research found scaling fees in Delaware (corp, by stock), Nevada (corp formation and annual list, by authorized share value, to a $35,000 and $11,125 maximum), Oklahoma (by authorized capital), Massachusetts and Michigan (by shares), Maryland (by par value), Arkansas, Nebraska, New Mexico and South Carolina. The schema gained `feeVaries` and `feeVariesNote` for exactly this: where true, the stored number is a **minimum**, the engine must render it as "from $X", and the column must be flagged unquantified. Storing a floor as if it were a fee is the quietest way this dataset could lie, and the gate now fails a `feeVaries` row that carries no explanation.

**Domestic and foreign are different prices, sometimes very different.** Oregon charges $100 domestic and $275 foreign for everything. Alaska's biennial report doubles from $100 to $200 for foreign entities. Delaware corporations file a $50 domestic report due 1 March but a $125 foreign report due 30 June. The engine must use the foreign figure on out-of-state columns, not the domestic one — otherwise the myth math understates exactly the thing the tool exists to show.

**Two sourcing caveats to carry forward.** Nevada's Secretary of State blocks automated fetching, so all Nevada figures come from the statutes on `leg.state.nv.us` rather than the fee-schedule PDF. New Hampshire's site also blocked fetching and its figures came from indexed pages. Both are state sources; both deserve a human look.

**One state stayed empty on purpose.** New Mexico publishes no current online fee schedule, so its formation and foreign fees are null. That is the correct outcome.

**Illinois defeated the research.** Every `ilsos.gov` fetch timed out or returned 403. All Illinois figures are null by design and it needs a re-run or a manual look. Georgia's PDF fee schedule also 403s, so its $225 foreign qualification rests on a how-to guide rather than the schedule itself — recorded at medium confidence.

**Two states will be stale within the year.** Louisiana's fees rise on 1 October 2026 under Act 921; the stored figures are pre-increase. Kansas reduced its fees on 27 February 2026; the stored figures are post-reduction. Both need a `verified` date the reader can see.

### Where the file stands

| | |
|---|---|
| LLC formation fee | 46 of 51 jurisdictions |
| **Foreign qualification fee** | **82 of 102 rows — was 0** |
| Rows flagged `feeVaries` | 14 |
| Still empty | IL, MN, MO, MS, NM |

The honesty row now exists for most of the country, which is the single thing that had to happen before the engine could be honest.

### Costs the marketing never mentions, now visible in the data

- **Nevada:** $200 (LLC) or $500 (corp) State Business Licence **every year**, on top of the $150 annual list.
- **Texas and South Dakota:** **$750** to register as a foreign entity. Delaware corp is $245, Oregon $275, Tennessee corp $600.
- **Vermont:** foreign annual reports are $170 (LLC) and $250 (corp) against $45 and $60 domestic.
- **Kentucky:** a $40 filing fee alongside a $175 minimum Limited Liability Entity Tax.
- **California:** the LLC first-year $800 exemption **expired after 2023** and does not apply in 2026, while the corporation first-year exemption is permanent and does. Two entity types, opposite answers, in the same state.

## 7. What S2 must not do

- Never let a comparison column omit the operating state's obligations. If a Wyoming total comes out below the home-state total for a business physically operating elsewhere, that is a bug until proven otherwise, and there is an acceptance check for it.
- Never emit a number for a prose-only regime. Compute `null`, surface the note, flag the column unquantified.
- Never total a column in a way that hides a known-to-exist but unquantified cost.
