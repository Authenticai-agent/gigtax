/**
 * FAQ helpers. FAQ items are authored once per page as { q, a } where the
 * answer may contain inline HTML (links, <em>). The visible markup renders the
 * HTML; the FAQPage JSON-LD needs plain text, so faqJsonLd() strips tags and
 * decodes the handful of entities we actually emit. One source, no drift.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function faqJsonLd(items: FaqItem[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: stripHtml(it.q),
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(it.a) },
    })),
  });
}
