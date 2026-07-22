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

## 5. Conflicts already found

- **South Dakota.** The legacy harvest says $150 formation and $50 a year. `state-scorp-tax-2026.json` says the annual report is $55 electronic / $70 paper. These disagree and the owner must resolve which is current before either is used.
- **Delaware LLC vs corporation.** Legacy records $300 annual tax for the LLC and a $50 report for the corporation. Both are seeded, both unverified. A calculator that applied the corporation figure to an LLC would understate Delaware by $250 a year.

## 6. Research in flight

The owner asked for the fees to be researched rather than hand-filled. That research is running against state `.gov` sources only, with per-figure source URLs, and returns `null` wherever a government source could not be confirmed. **Research output is a lead, not a signature.** Per the spec, the owner still signs off on the file as a whole before S2 begins.

Two of the first research passes failed by delegating instead of searching and returned nothing usable; they were re-run with explicit instructions. That is worth recording because it is the failure mode to watch for if this is repeated: an agent that reports success without having done the work.

## 7. What S2 must not do

- Never let a comparison column omit the operating state's obligations. If a Wyoming total comes out below the home-state total for a business physically operating elsewhere, that is a bug until proven otherwise, and there is an acceptance check for it.
- Never emit a number for a prose-only regime. Compute `null`, surface the note, flag the column unquantified.
- Never total a column in a way that hides a known-to-exist but unquantified cost.
