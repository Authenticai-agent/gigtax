# Layoff cluster — data notes (Phase 1)

Dated 2026-07. This is the running log of every judgment call, discrepancy, and stale-risk item for the layoff survival cluster data layer (`task_layoff.md` Phase 1).

## Status at the Phase 1 gate: AMBER (schema valid, sourcing in progress, awaiting owner review)

`node scripts/verify-layoff-data.mjs` → 0 hard failures; records not yet accepted are PENDING. The schema is complete and sane; **no benefit figure has been shipped without a source**. As of this pass, **36 of 51 UI jurisdictions are sourced** (`verify_status: "sourced_pending_owner_review"`); the remaining 15 (CT, DC, DE, IN, MA, MD, ME, MI, NH, NJ, NY, OH, PA, RI, VT) are still completing. Nothing is marked `verified` — per the spec's guardrail, the owner reviews the source ledger and approves before acceptance and before Phase 2.

## Repo adaptations (this is the same repo, not the spec's assumed stack)

- The spec describes "GigTaxCalculator (React + Vite)". The actual repo is **Astro** (static, client-side islands). Files follow this repo's conventions: data in `src/data/layoff/`, the verify script as **`scripts/verify-layoff-data.mjs`** (matching `check-wage.mjs` etc.), not `.ts`.
- **Spec item 4 honored — no duplication.** The 2026 FPL table, 400% cliff thresholds, and ACA applicable-percentage table already live in `src/data/federal.ts` (`acaSubsidy.fpl2026`, `cliffThresholds400pct`, `applicablePercentages2026`). `cobra_aca.json` references them, it does not re-ship them. Likewise the SS wage base ($184,500), 22%/37% supplemental rates, FICA rates, and standard deduction ($16,100/$32,200) are imported from `federal.ts` and only *documented* in `federal_2026.json`.

## What IS sourced and shippable now

- **Federal severance constants** — from `federal.ts` (already verified in-repo to 2026-v3.x): SS wage base $184,500, 22%/37% supplemental, FICA 6.2%/1.45% + 0.9% additional Medicare, standard deduction. Cross-checks against IRS Pub 15 (2026).
- **Federal COBRA structural constants** — 102% / 2% admin / 150% disability / 18–29–36 months / 60-day election / 20-employee threshold / Box 12 DD method. Sourced to DOL COBRA guidance. Stable statutory figures.
- **ACA 2026 structure** — enhanced credits expired 2025-12-31, 400% FPL cliff back, 60-day SEP. Sourced; FPL/percentage tables read from `federal.ts`.
- **No-income-tax states** — AK, FL, NV, NH, SD, TN, TX, WA, WY. Derived from the repo's own `states.ts` (`type: "none"`), not from memory. `state_supplemental_tax.json` marks these `verified_no_tax`, supplemental rate 0.

## What is PENDING (must be sourced before Phase 2)

1. **51-state UI benefit table** — `ui_by_state.json`, all figures `null`, every record `verify_status: "PENDING"`. Needs max/min weekly, duration, waiting week, dependent allowance, benefit method, severance-offset note, `ui_taxed_by_state`, agency name + filing URL — each from **that state's own agency page**, cross-checked against DOL ETA "Significant Provisions of State UI Laws". 
2. **State supplemental withholding rates** — `state_supplemental_tax.json`, 42 taxing states `null`/PENDING. Source: each state DOR withholding guide.
3. **Per-state mini-COBRA flags** — `cobra_aca.json` `mini_cobra_by_state` empty. Source: each state insurance department.
4. **2026 KFF premium averages** — `kff_premium_averages` carries the spec's **2025 baseline** ($6,296 individual / $16,399 family employer contribution). Refresh to exact 2026 KFF figures.
5. **`subsidy_rules_last_verified`** — must be dated; ACA subsidy extension was under negotiation in Q1 2026.

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
