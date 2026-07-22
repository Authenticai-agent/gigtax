/**
 * URL slug helper, kept in its own module so the calculator island can import
 * it without pulling the whole copy/data layer into the client bundle.
 */

/** "District of Columbia" -> "district-of-columbia". */
export function stateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
