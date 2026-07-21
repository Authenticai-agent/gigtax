# CLAUDE.md — MoneyScope

Static Astro pSEO site: 2026 US tax calculators. React calculator islands, zero-JS content pages, no backend, no data collection.

## Ground rules

1. The master plan is `specs/migration-spec.md`. Read it before doing anything. Work one phase per session; stop at each definition of done.
2. Tax figures come only from `src/data/federal.ts`, `src/data/states.ts`, `src/data/platforms.ts`. Never invent or update a rate, bracket, or threshold. Missing figure → stop and ask.
3. Every page's unique content must be present in the built HTML file. The acceptance test for any page work is opening the file in `dist/` and finding the content there, before JavaScript.
4. `legacy/` is read-only source material. Harvest from it in Phase 1; never import from it in site code; it is excluded from the build and deleted in Phase 6.
5. `SITE_URL` lives in one place in the Astro config. Canonicals, sitemap, and OG URLs derive from it. Don't hardcode the domain anywhere else.
6. No SPA fallback redirects. No localStorage or analytics that collect user inputs.

## Commands

- `npm run dev` — local server at :4321
- `npm run build` — static build to `dist/`
- `npm run preview` — serve the built output

## Writing style for page content

Specific over generic: real figures, worked examples with concrete numbers. No sentence that would survive swapping one state's name for another. No filler ("In today's...", "It's important to note"). Sentence-case headings. Always end money pages with the not-tax-advice disclaimer.