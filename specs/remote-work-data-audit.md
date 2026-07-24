# Remote-work tax residency checker — Phase 1 data audit

Task 2 of `tasks_layoff_addons.md` — the file's "highest-value hardest build." This is a **data-only** phase. The tool is a decision-tree + explainer (which rules apply, what's owed where, what needs a professional), not a calculator — so the moat is correctness, and the gate to Phase 2 is owner sign-off on the data below.

Data files:
- `src/data/overrides/convenience-rule-states-2026.json` — domestic mode.
- `src/data/overrides/country-notes-2026.json` — international mode.
- Reused, already verified: `src/data/reciprocity.ts` (reciprocity + credit-for-taxes-paid) and `src/lib/feie.ts` + `federal.ts` FEIE ($132,900, 2026).

## Domestic mode — convenience-of-the-employer states

Confirmed the current list is **7 states: NY, PA, DE, AR, NE, CT, NJ.**

| State | Status | Note |
|---|---|---|
| NJ | ✅ verified | NJ Division of Taxation publishes a convenience-rule FAQ (primary source). Applies only to nonresidents from other convenience states. |
| NY, PA, DE, AR | ⚠️ sourced, confirm vs DOR | NY is the aggressive original; confirm each against the state DOR. |
| NE | ⚠️ confirm the 2024 amendment | Rule applies only after **7+ days** physical presence in NE — a recent change that shows why the list needs re-checking. |
| CT | ⚠️ confirm | Like NJ, limited to nonresidents from states that themselves have a convenience rule. |

**Key design point for Phase 2:** most convenience states have an **"employer necessity" exception** — if the employer *requires* the remote work, the wages may not be re-sourced. The tool must surface this exception prominently, not just the rule, or it will over-scare users.

## International mode — country notes (15 destinations)

For a US citizen working remotely abroad for a US employer. Three universal facts anchor the tool (in the file's `_meta`): worldwide taxation, FEIE vs FTC, and the employer-side permanent-establishment risk that "can I just do it quietly" really turns on.

| Field | Source | Confidence |
|---|---|---|
| Totalization agreement (yes/no) | SSA international agreements list | Sourced — ~30 countries in force; **without**: Mexico, Thailand, UAE, Singapore, Indonesia. Confirm each per-country SSA page. |
| Income tax treaty | **left `pending_confirm_irs_pub901` for every country** | Not asserted. Must be confirmed against IRS Pub 901. Brazil, UAE, Singapore believed to have **no** US income tax treaty. |
| Nomad-visa tax note | per-country | **Most volatile data on the site.** Ships only with a visible verify date + "confirm current rules" caution, or not at all. |
| FEIE | `federal.ts` ($132,900, 2026) | Reused; re-confirm against the IRS Rev. Proc. at sign-off. |

Destinations drafted: Portugal, Spain, Italy, Germany, France, UK, Canada, Australia, Brazil, Chile, Mexico, Thailand, UAE, Singapore, Indonesia (the file names Portugal/Spain/Mexico/Thailand/Italy as the dominant long-tail).

## Open decisions for the owner

1. **Confirm the 6 unverified convenience states** against their DORs (NJ is done).
2. **Confirm every income-tax-treaty flag** against IRS Pub 901 — none are asserted yet.
3. **Nomad-visa notes:** decide whether to ship them (with verify dates + caution) or omit them in v1 given how fast they change.
4. **Re-confirm FEIE 2026** = $132,900.
5. **Disclaimer posture** (the file wants the strongest on the site): "this maps the rules; cross-border filing needs a professional" — approve wording. Monetization is an expat-tax-prep affiliate below the methodology.

## What Phase 2 will build (not now)

A two-mode rules-map tool: domestic (home state × work state → convenience rule / reciprocity / credit-for-taxes-paid, using the existing reciprocity data) and international (country → worldwide-tax + FEIE/FTC decision + totalization + treaty + employer-PE warning). Output is a personalized checklist, not a single number. pSEO: `/remote-work-tax-checker/[country]` for the destination set and `/remote-work-tax-checker/[state-pair]` only for the convenience-rule pairs (NY-NJ class), not all 2,500 combinations. Rough FEIE/FTC math via the existing engine, but the rules-map leads.

## Maintenance-calendar entries (new)

- **Convenience-rule states** — re-verify each January; rules change (NE 2024).
- **Totalization + treaty lists** — re-verify against SSA and IRS Pub 901 annually.
- **Nomad-visa notes** — the highest-churn item; re-verify each quarter or drop.

## Gate to Phase 2

Owner confirms the convenience states + treaty flags (or approves shipping only the verified subset + "confirm with a professional" posture), signs off, and Phase 2 begins. Until then, every unconfirmed row stays `sourced_pending_owner_review`.
