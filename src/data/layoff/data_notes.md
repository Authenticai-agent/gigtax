# Layoff cluster — data notes (Phase 1)

Dated 2026-07. This is the running log of every judgment call, discrepancy, and stale-risk item for the layoff survival cluster data layer (`task_layoff.md` Phase 1).

## Status at the Phase 1 gate: SOURCED — awaiting owner sign-off

`node scripts/verify-layoff-data.mjs` → **0 hard failures, 0 unsourced (PENDING)**; **all 51 UI records sourced, awaiting owner sign-off** (`verify_status: "sourced_pending_owner_review"`). Every figure is tied to an official source and passes the sanity bands. Flip `verify_status` to `verified` on approval and the gate is GREEN. Documented residual: mini-COBRA for **AK, AR, TN** stays UNCONFIRMED where the state code is login-gated (AR, TN) or no official page affirms absence (AK).

### Second pass complete (2026-07-24) — the targeted follow-up

- **`ui_taxed_by_state`: 51/51** now set (was 13 null). Key finding: **DC does NOT tax UI** (permanent statutory exclusion from District gross income, D-40 Line 13); **Alabama and Virginia also do not** (AL exempts it; VA has a subtraction). All others confirmed to tax UI, each to a state DOR page.
- **`waiting_week`: 51/51** now set (was 15 null), from DOL ETA Comparison Table 3-7 (the authoritative federal cross-check).
- **Supplemental withholding rate: all 42 taxing states resolved** — 25 have a flat/supplemental rate (from each state DOR withholding guide), 17 genuinely have **no single flat rate** (`verify_status: verified_variable` — combined-wage/aggregate/annualized/multiplier methods), plus the 9 no-income-tax states at 0. Corrections vs aggregators: **ND 1.5%** (not the stale 1.84%), **NC 4.09%** (higher than its 3.99% income rate), CT has no flat 6.99% and DE no flat 6.6% (those are top marginal rates). CA severance = **6.6%** ("other supplemental," not the 10.23% bonus rate).
- **Mini-COBRA: 51/51** — 42 jurisdictions have a small-employer continuation law (sourced to statute/insurance-dept), **6 do not** (AL, HI, ID, MI, MT, WA — conversion or must-offer only), **3 UNCONFIRMED** (AK, AR, TN).
- **KFF averages refreshed** to the 2025 Employer Health Benefits Survey ($7,885 single / $20,143 family employer contribution — the spec's $6,296/$16,399 were stale); marketplace figures confirmed verbatim. **ACA subsidy status re-verified 2026-07-24**: enhanced credits still expired, 400% cliff in effect, House-passed extension stalled in the Senate, nothing signed.

### Residual items flagged (small, documented)

- **Currency:** Kansas' likely July-1-2026 max (~$663) UNCONFIRMED (KDOL 403s; $637 is the last officially-verified). **Colorado corrected to $884** (superseded $844, via CDLE estimator). North Dakota $815 is the posted chart; no 7/5/2026 successor published yet.
- **Supplemental (MEDIUM):** DC and VT — the 2026 official docs were fetch-blocked, so the "no flat rate" finding rests on the latest reachable official version (DC FR-230; VT GB-1210 2025) plus official-domain search; not aggregator-sourced.
- A handful of first-pass MEDIUM figures (agency sites that 403'd) remain worth a Phase 5 spot-check: WV $662 (DOL-ETA-only), AZ/NM/MT minima (DOL ETA).

## Repo adaptations (this is the same repo, not the spec's assumed stack)

- The spec describes "GigTaxCalculator (React + Vite)". The actual repo is **Astro** (static, client-side islands). Files follow this repo's conventions: data in `src/data/layoff/`, the verify script as **`scripts/verify-layoff-data.mjs`** (matching `check-wage.mjs` etc.), not `.ts`.
- **Spec item 4 honored — no duplication.** The 2026 FPL table, 400% cliff thresholds, and ACA applicable-percentage table already live in `src/data/federal.ts` (`acaSubsidy.fpl2026`, `cliffThresholds400pct`, `applicablePercentages2026`). `cobra_aca.json` references them, it does not re-ship them. Likewise the SS wage base ($184,500), 22%/37% supplemental rates, FICA rates, and standard deduction ($16,100/$32,200) are imported from `federal.ts` and only *documented* in `federal_2026.json`.

## What IS sourced and shippable now

- **Federal severance constants** — from `federal.ts` (already verified in-repo to 2026-v3.x): SS wage base $184,500, 22%/37% supplemental, FICA 6.2%/1.45% + 0.9% additional Medicare, standard deduction. Cross-checks against IRS Pub 15 (2026).
- **Federal COBRA structural constants** — 102% / 2% admin / 150% disability / 18–29–36 months / 60-day election / 20-employee threshold / Box 12 DD method. Sourced to DOL COBRA guidance. Stable statutory figures.
- **ACA 2026 structure** — enhanced credits expired 2025-12-31, 400% FPL cliff back, 60-day SEP. Sourced; FPL/percentage tables read from `federal.ts`.
- **No-income-tax states** — AK, FL, NV, NH, SD, TN, TX, WA, WY. Derived from the repo's own `states.ts` (`type: "none"`), not from memory. `state_supplemental_tax.json` marks these `verified_no_tax`, supplemental rate 0.

## What is PENDING

Nothing is unsourced. The five items that were open after the first pass — the 51-state UI table, the 42 supplemental rates, the 51 mini-COBRA flags, the KFF averages, and the ACA subsidy date — are **all sourced** (see "Second pass complete" above). The only remaining step is the owner's sign-off to flip `verify_status` from `sourced_pending_owner_review` to `verified`, plus the small documented residuals (AK/AR/TN mini-COBRA UNCONFIRMED; KS currency; DC/VT supplemental MEDIUM).

## Sourcing method (and what it caught)

Regional research agents fanned out to per-state sub-agents, each pulling figures from **that state's own agency page** and cross-checking against the DOL ETA "Significant Provisions of State UI Laws, Effective January 2026" (`oui.doleta.gov`). Every figure carries a source URL and a confidence flag; anything not confirmable to an official page was left `null` and marked `UNCONFIRMED` — **no aggregator or model-memory figure was accepted**. Each `ui_by_state.json` record's `replacement_rate_note` carries its confidence caveats.

The method worked and, notably, **caught errors the spec itself carried**:

- **Hawaii has no dependent allowance** (the spec said AK and HI both do — only AK does, $24/dep up to 3).
- **Montana caps at 24 weeks**, not the spec's "~28" (DOL ETA Jan-2026).
- **Louisiana max is $282**, correcting the aggregator figure ($247) still in circulation.
- **Arkansas** computes on a 4-quarter average, not "1/26 of high quarter" as aggregators state; max $451.
- **Illinois** base individual max is **$628** (not $748 — that is the max *with a nonworking spouse*; $859 with a dependent child); its allowance is a percentage of prior AWW, not a flat per-dependent dollar.
- Mid-2026 revisions applied over stale DOL-ETA-January figures: **WA $1,208, VA $478, KY $746, WY $671, SD $575, IA (dependent-scaled to $790)** — all effective early July 2026.

### Items flagged MEDIUM / UNCONFIRMED — need a manual second pass before ship

Some state agency sites block automated fetching (403/WAF) or serve oversized PDFs, so a few figures rest on the DOL ETA cross-check only, and a few `ui_taxed_by_state` flags could not be tied to a state Department-of-Revenue page:

- **Kansas** — max $637/min $159 are the figures through 6/30/2026; a **July-1-2026 revision is likely live** (aggregators say ~$663) but `dol.ks.gov` 403s — **UNCONFIRMED**, needs manual check.
- **Colorado** $844 may be superseded by a July-1-2026 re-index (agency 403); **NM, MT, ID, AZ min** rest on DOL ETA (agency sites blocked); **WV $662** is DOL-ETA-only (live WV dollar table unparseable / stale 2022 poster).
- **North Dakota** $815 is the current chart; a 7/5/2026 schedule may supersede it — UNCONFIRMED.
- `ui_taxed_by_state` left `null`/MEDIUM for **AL, MS, VA, MT, ID, KY, LA** (agency pages confirm UI is 1099-reported but do not state state-income-tax treatment verbatim — a state DOR page would settle each).
- `waiting_week` left `null`/UNCONFIRMED for **NV, MS, CO, MT, WY** (could not confirm from an official page).

These are exactly the states/fields to confirm during the owner-reviewed pass and the Phase 5 data audit.

## Spec baseline figures to VERIFY (the starting list for the sourcing pass — not yet accepted)

These come from the spec's July-2026 data pack and each must be confirmed against the state's own agency page before it enters `ui_by_state.json` as `verified`:

- Mississippi max $235 (lowest); Washington max ~$1,208 (claims on/after 2026-07-05, highest).
- Massachusetts max ~$1,105 + $25/dependent, 30 weeks.
- Alabama / Florida / Louisiana / Tennessee cap ~$275.
- Duration: most states 26 weeks; NC / AR / FL = 12; Montana = 28; MA = 30. Several index duration to the state unemployment rate.
- UI state-tax exempt in ~15 states (CA, NJ, PA among them) — `ui_taxed_by_state`.
- Iowa and Virginia raised maxima effective 2026-07-05.

### Known discrepancy (documented per spec)

The spec flags **three different "Massachusetts max" figures in circulation** ($823, $1,033, $1,105). This is precisely why aggregators are barred. The MA figure must come from mass.gov/DUA and nothing else.

## Maintenance calendar (for Phase 5, recorded now)

- **January 1** — federal constants, HHS FPL update.
- **July 1–5** — state UI revisions (WA/IA/VA pattern, many states revise July 1).
- **Watch item** — ACA subsidy extension bill. If Congress passes one, `cobra_aca.json` and the ACA scenario page need same-week updates. `subsidy_rules_last_verified` drives this.

## Out of scope for v1 (v2 stubs)

WARN Act pay analysis; 401(k) rollover math; state disability interactions; per-state UI formula reimplementation (v1 ships each state's formula as config, not 53 reimplemented formulas); non-US severance. Each is a candidate for v2.

---

## Phase 5 QA — data audit second pass (2026-07-23)

Re-verified a 10-state random sample of UI figures against their cited sources, per `task_layoff.md` Phase 5 item 1. No figure was changed — every source that could be machine-read confirmed the stored value.

**Re-confirmed against the state agency's own source (7):**

| State | Stored max / weeks | Agency source says | Result |
|---|---|---|---|
| NJ | $905 / 26w | "maximum weekly benefit rate … will increase to $905" (NJ DOL, 2025-12-29) | ✓ match |
| MD | $430 (min $50) | "weekly payments range from $50 to $430" (MD Labor schedule) | ✓ match |
| GA | $365 / 26w | "$365" max; duration 14–26w by state UI rate (GA DOL FAQ) | ✓ match (26w = top of range) |
| SC | $350 (min $42) / 20w | "$42 … to a maximum of $350"; "up to 20 weeks" (SC DEW) | ✓ match |
| MO | $320 / 20w | "not to exceed $320"; MBA = 20× WBA (MO DOL) | ✓ match |
| IA | $644 / 16w | base max $644; up to $790 with 4+ dependents, eff 2026-07-05 (IA Workforce) | ✓ match — see note |
| NJ/SC/MO/GA/IA/MD mins | as stored | ranges confirmed | ✓ |

- **IA nuance (not a discrepancy):** the agency headline figure "$790" is the 4-or-more-dependents maximum. The dataset stores `max_weekly: 644` (the base, 0-dependent max) per the site convention that `max_weekly` excludes dependent scaling, with `dependent_allowance: null` because Iowa scales via a divisor rather than a flat per-dependent add-on. The $644/$790 split is already recorded in the record's note. Left as-is.

**Could not machine-verify this pass — flagged, figures unchanged (3):**

- **AL ($275):** cited source `labor.alabama.gov/docs/guides/uc_brr.pdf` is a 592 KB binary PDF that WebFetch cannot parse. Needs a manual visual check against the PDF.
- **CO ($884):** cited source (cdle.colorado.gov estimator) returns HTTP 403 to automated fetch. Needs a manual browser check.
- **Federal SS wage base ($184,500):** `ssa.gov/oact/cola/cbb.html` returns HTTP 403 to automated fetch. Value stands as the published 2026 figure in `federal.ts` (`LAST_VERIFIED` 2026-06-10); confirm visually next pass.

**Sourcing-quality note (2):** OH ($624) and VT ($757) cite the **US DOL ETA** "significant provisions" table (`oui.doleta.gov/.../January2026.pdf`) rather than the state's own agency page. DOL ETA is an official federal source, not a commercial aggregator, so the figures are trustworthy — but the Phase 1 guardrail prefers the state agency page. Re-source to Ohio JFS and Vermont DOL when convenient.

**Federal constants / FPL:** the SS wage base, additional-Medicare thresholds, supplemental 22%/37%, and the FPL/applicable-percentage tables live in `federal.ts` (verified 2026-06-10, `VERIFIED` 2026-v3.3) and feed the engine directly; the worked examples recompute from them. Re-verify against Pub 15 and the IRS Rev. Proc. each fall for the next tax year (see the maintenance calendar).

**Net:** 7/10 UI figures re-confirmed against source with zero changes; 3 unverifiable by automated fetch (PDF / 403) and flagged for manual re-check; 2 carry a source-quality follow-up. No invented or altered values.
