// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// SITE_URL — the single source of truth for the site's origin.
// Canonicals, sitemap, and Open Graph URLs all derive from `Astro.site`.
// Currently the Netlify preview URL; flip to the custom domain at cutover (Phase 6).
const SITE_URL = 'https://moneyscopecalculators.netlify.app';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
});
