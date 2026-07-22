/**
 * robots.txt, generated so it can never drift from SITE_INDEXABLE.
 *
 * Note that the absence of a robots.txt means "crawl everything" — not
 * "leave me alone". This file exists so the default is a decision rather than
 * an accident.
 */
import type { APIRoute } from 'astro';
import { SITE_INDEXABLE } from '../site';

export const GET: APIRoute = ({ site }) => {
  const body = SITE_INDEXABLE
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
        '',
      ].join('\n')
    : [
        '# Not ready to be found yet.',
        '#',
        '# The content is live but unfinished; indexing it now would mean',
        '# competing against a better version of itself later. Flip',
        '# SITE_INDEXABLE in src/site.ts, and remove the X-Robots-Tag header',
        '# in netlify.toml, when it is ready.',
        '',
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
