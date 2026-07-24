# Layoff cluster — maintenance calendar

Every figure the layoff cluster shows, where it lives, when it changes, and what
to re-check. Data was last verified **2026-07-24** (UI and supplemental tables)
and **2026-06-10** (federal constants, `federal.ts` `LAST_VERIFIED`).

Nothing here is auto-updated. The never-invent rule (`CLAUDE.md`) applies to
every value below: a changed figure enters its data file with a fresh
`source_url` and `last_verified`, and the owner signs off — never edited from
memory or web recall.

## The one that can flip a conclusion — watch continuously

**ACA enhanced premium tax credits / the 400% FPL cliff.**
`src/data/layoff/cobra_aca.json` → `aca_2026`, and the engine's `calcACASubsidy`
in `src/lib/tax-engine.ts` (reads `federal.ts` `acaSubsidy`).

As of 2026-07-24 the enhanced credits remain **expired** (lapsed 2025-12-31),
so the 400% cliff is in force for plan year 2026 and drives the entire
COBRA-vs-marketplace answer and the "laid off at 55" and "cobra or marketplace"
scenario pages. A House-passed extension had **not** advanced in the Senate.

If Congress extends or restores the enhanced credits, the cliff disappears and
the marketplace wins far more often — the opposite of what these pages currently
say. **Check whenever ACA subsidy legislation moves**, not on a fixed date.
Affected copy carries `data-review="legal"` and cites the 2026-07-24 verify date;
update the date, the `current_status_2026` note, and the cliff conclusion together.

## Annual — the predictable cadence

| When | What | Where | Note |
|---|---|---|---|
| **October–November** | SS wage base, Medicare thresholds, supplemental 22%/37%, standard deduction for the *next* tax year | `src/data/federal.ts` | IRS/SSA announce next-year figures in the fall. The 2026 SS wage base is $184,500; it rises most years. Drives severance FICA and the "$184,500 cap" copy. |
| **October–December** | New FPL table + 400% cliff thresholds for the next plan year | `federal.ts` `acaSubsidy` (`fpl2026`, `cliffThresholds400pct`) | HHS publishes the poverty guidelines in January but the marketplace uses the *prior* year's; confirm which applies before the next open enrollment. Drives the $63,840 single-filer cliff figure. |
| **January** | State UI weekly maximums that reset in January (14 states) and state supplemental withholding rates | `ui_by_state.json`, `state_supplemental_tax.json` | Many states re-index the UI max to the state average weekly wage effective 1 January. Supplemental rates move with state tax law, usually 1 January. |
| **July** | State UI weekly maximums that reset mid-year (12 states) | `ui_by_state.json` | The other big re-index date. States with `typical_revision_month: "July"`. |
| **October (5 states), May/June (2)** | Remaining UI max resets | `ui_by_state.json` | Per-state `typical_revision_month`. 18 states are `unspecified` — spot-check those against the DOL ETA table annually. |

### Federal figures baked into copy and the engine
- SS wage base **$184,500**, additional-Medicare thresholds **$200,000 / $250,000**,
  supplemental **22% / 37%** — all in `federal.ts`, surfaced in severance copy and
  the worked examples. Re-verify each fall for the next tax year.
- The `VERIFIED` tag (`federal.ts`, currently `2026-v3.3`) is the single version
  stamp; bump it when any federal constant changes.

## Every re-verification pass

1. Update the figure in its data file **with a new `source_url` and
   `last_verified`**; leave the old value only if the source still confirms it.
2. Run `node scripts/verify-layoff-data.mjs` — it re-asserts every `source_url`
   is present and every value sits inside its sanity band, and reports
   GREEN / AMBER / SOURCED.
3. Run `npm run build`. The quality gate re-checks sibling similarity, FAQ
   JSON-LD validity (112 pages), titles/metas, and reachability. The worked
   examples recompute from the engine, so corrected data flows into every page
   automatically — no page edits needed for a pure data change.
4. Bump the visible "last verified" date in the affected copy (calculator
   methodology blocks and `results-note` lines cite **2026-07-24** today).

## Source-quality watch-list (from the dataset's own confidence notes)

- **KFF premium averages** in `cobra_aca.json` are from the **2025** employer
  survey (single $7,885 / family $20,143 annual). The next KFF survey lands
  ~October; refresh then. Used only as the COBRA fallback when the user has no
  Box 12 DD figure.
- A handful of UI rows carry `MEDIUM` confidence notes (agency site returned 403
  at verification, figure taken from the DOL ETA comparison table). Listed in
  each row's `replacement_rate_note`. Prefer the state agency's own number when
  it becomes reachable.
- Mini-COBRA: 3 states (AK, AR, TN) were `UNCONFIRMED` at last pass. If a page
  ever surfaces mini-COBRA per state, resolve those first.

## Not modeled (say so if asked to "fix" them)
Severance-timing offset rules vary too much by state to compute and are flagged,
not calculated. Sales/property tax, local rules, and exact state UI formulas are
out of scope — the pages state this. Don't add a computed figure where the data
file holds only a prose note.
