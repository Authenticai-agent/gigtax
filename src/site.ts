/**
 * Site-wide switches. One file, so "are we live yet" is a single decision.
 */

/**
 * Whether search engines may index the site.
 *
 * FALSE until the content is ready to be found. This is the only place to
 * change it — flipping it here updates three things at once:
 *
 *   1. /robots.txt          disallow everything  ->  allow, plus the sitemap
 *   2. <meta name="robots"> noindex,nofollow     ->  index,follow
 *   3. the sitemap          still generated either way, but only advertised
 *                           in robots.txt once indexing is on
 *
 * There is a fourth, and it is NOT in this file: netlify.toml sends an
 * `X-Robots-Tag: noindex` header. TOML cannot read a TypeScript constant, so
 * that one has to be removed by hand at the same time. It is commented there.
 *
 * Why both a header and robots.txt: a disallow stops crawling, but a URL that
 * is linked from somewhere else can still be indexed without ever being
 * fetched — title only, no content. The header is what actually keeps it out of
 * the index, and it is only seen if the page IS fetched. Belt and braces, since
 * neither alone covers both cases.
 */
export const SITE_INDEXABLE = false as const;
