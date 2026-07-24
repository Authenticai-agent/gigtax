# Side-income tax threshold tool — Phase 1 data audit

Task 5 of `tasks_layoff_addons.md`. This is a **data-only** phase: the files are drafted and sourced; nothing is wired into a shipped tool yet. The gate to Phase 2 (engine + pages) is owner sign-off on the figures below.

Data files:
- `src/data/overrides/side-income-1099k-2026.json` — the three-layer threshold data.
- `src/data/overrides/side-income-platforms.json` — platform reporting notes.

## The three layers the tool untangles

Most content collapses these into one wrong sentence. The tool's job is to keep them separate per platform × state:

1. **Income tax** — owed on profit from the **first dollar**. Already computed by the repo's existing SE/income engine; no new data.
2. **SE-tax filing threshold — $400** of net self-employment earnings. **Verified** (IRC §6017 / IRS Schedule SE). This is the featured-snippet correction: it is *not* an income-tax exemption. It's the strongest single piece of copy on the tool.
3. **1099-K reporting threshold** — federal + per-state. See below.

## What is verified and can ship

| Figure | Value | Source | Status |
|---|---|---|---|
| Federal 1099-K threshold, TY2026 | **> $20,000 AND > 200 transactions** | [IRS — Understanding your Form 1099-K](https://www.irs.gov/businesses/understanding-your-form-1099-k) (reviewed 2026-06-28) | ✅ verified |
| SE-tax filing threshold | **$400** net SE earnings | IRC §6017; IRS Schedule SE instructions | ✅ verified |
| Federal history (why the number moved 4× in 5 years) | ARPA $600 → IRS phase-in $5,000/$2,500 → OBBBA restored $20k/200 (signed 2025-07-04) | IRS + OBBBA | ✅ verified |

## What is sourced but needs owner sign-off before shipping

The **state 1099-K overrides** come from a single secondary aggregator (1099FIRE) and must be confirmed against each state's Department of Revenue. Post-OBBBA, some states may have conformed to the federal threshold, and the list may be incomplete.

| State | Drafted threshold | Must confirm against |
|---|---|---|
| DC, MD, MA, MT, NC, VT, VA | $600 | each state DOR |
| NJ | $1,000 | NJ Division of Taxation |
| MO | $1,200 | MO DOR |
| Illinois (not in source list) | — | IL historically $1,000 + 4 transactions; confirm whether it still applies |

**Open decisions for the owner:**
1. Confirm each state figure (and whether any carries a transaction minimum — the source specified none).
2. Confirm the state list is complete; add any missing states (IL flagged).
3. Shipping posture for unconfirmed states: default to the federal threshold with a visible "confirm with your state" note rather than guessing.

## Platform notes — sourced, pending primary confirmation

`side-income-platforms.json` drafts Etsy, eBay, Depop, Poshmark, StockX, Twitch, YouTube, and gig (Uber/DoorDash → existing gig pages). Two findings that shape the tool's logic:

- **Twitch and YouTube are usually not 1099-K platforms** — creator income lands on 1099-NEC/MISC. The tool must route them to the SE-tax explanation, not the 1099-K threshold, or the copy will be wrong.
- **1099-K reports gross, not profit** — the universal lead. Fees, refunds, shipping, and (for resale) cost basis all reconcile gross down to taxable income.

Every platform "reports/quirk" claim needs the platform's own current tax page as a source before Phase 2.

## What Phase 2 will build (not now)

Engine: pick platform + state + estimated profit → { SE tax applies?, federal return line required?, will the platform issue a 1099-K?, does the state require filing?, estimated tax via the existing engine }. pSEO `/side-income-tax-threshold/[platform]/[state]` capped at 10 platforms × 51 states = 510 pages, with ONE shared hobby-vs-business explainer. FAQ schema per page on the literal query phrasings.

## Maintenance-calendar entry (new)

The federal 1099-K threshold has moved four times in five years — it gets its **own** entry: re-verify the [IRS 1099-K page](https://www.irs.gov/businesses/understanding-your-form-1099-k) every **January** and after **any** tax legislation. State overrides: re-verify each January against the state DORs.

## Gate to Phase 2

Owner confirms the state rows (or approves the "default to federal + confirm-with-state" posture), signs off the file, and Phase 2 (engine + parity tests + pages) begins. Until then, `verify_status` on every state row stays `sourced_pending_owner_review`.
