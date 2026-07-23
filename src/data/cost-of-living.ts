/**
 * Approximate cost-of-living indices for ~40 US metros, base 100 = US average.
 *
 * This is REFERENCE data for the salary-by-city comparison, not a tax figure and
 * not authoritative — indices of this kind vary by source and by year. The
 * calculator labels every result as approximate. A higher index means a more
 * expensive city; housing is the category that moves the overall number most.
 */
export interface CityCOL {
  name: string;
  state: string;
  index: number;
  housing: number;
  groceries: number;
  utilities: number;
  transport: number;
  healthcare: number;
  misc: number;
}

export const CITIES: CityCOL[] = [
  { name: 'New York, NY', state: 'NY', index: 187, housing: 265, groceries: 138, utilities: 118, transport: 128, healthcare: 115, misc: 125 },
  { name: 'San Francisco, CA', state: 'CA', index: 178, housing: 250, groceries: 132, utilities: 112, transport: 122, healthcare: 118, misc: 120 },
  { name: 'San Jose, CA', state: 'CA', index: 175, housing: 240, groceries: 130, utilities: 110, transport: 120, healthcare: 118, misc: 118 },
  { name: 'Los Angeles, CA', state: 'CA', index: 152, housing: 210, groceries: 120, utilities: 105, transport: 115, healthcare: 110, misc: 115 },
  { name: 'San Diego, CA', state: 'CA', index: 147, housing: 195, groceries: 118, utilities: 105, transport: 112, healthcare: 108, misc: 112 },
  { name: 'Seattle, WA', state: 'WA', index: 145, housing: 190, groceries: 120, utilities: 100, transport: 108, healthcare: 105, misc: 110 },
  { name: 'Boston, MA', state: 'MA', index: 143, housing: 185, groceries: 118, utilities: 105, transport: 110, healthcare: 112, misc: 110 },
  { name: 'Washington, DC', state: 'DC', index: 140, housing: 175, groceries: 115, utilities: 102, transport: 108, healthcare: 110, misc: 108 },
  { name: 'Portland, OR', state: 'OR', index: 125, housing: 148, groceries: 108, utilities: 95, transport: 100, healthcare: 98, misc: 105 },
  { name: 'Denver, CO', state: 'CO', index: 123, housing: 145, groceries: 108, utilities: 98, transport: 100, healthcare: 98, misc: 105 },
  { name: 'Miami, FL', state: 'FL', index: 120, housing: 140, groceries: 108, utilities: 105, transport: 105, healthcare: 100, misc: 105 },
  { name: 'Chicago, IL', state: 'IL', index: 118, housing: 130, groceries: 105, utilities: 98, transport: 105, healthcare: 100, misc: 102 },
  { name: 'Philadelphia, PA', state: 'PA', index: 115, housing: 130, groceries: 105, utilities: 98, transport: 102, healthcare: 100, misc: 102 },
  { name: 'Austin, TX', state: 'TX', index: 115, housing: 130, groceries: 98, utilities: 95, transport: 95, healthcare: 95, misc: 98 },
  { name: 'Minneapolis, MN', state: 'MN', index: 110, housing: 125, groceries: 102, utilities: 95, transport: 98, healthcare: 98, misc: 100 },
  { name: 'Salt Lake City, UT', state: 'UT', index: 110, housing: 115, groceries: 98, utilities: 90, transport: 95, healthcare: 92, misc: 98 },
  { name: 'Dallas, TX', state: 'TX', index: 108, housing: 115, groceries: 98, utilities: 95, transport: 95, healthcare: 95, misc: 98 },
  { name: 'Phoenix, AZ', state: 'AZ', index: 108, housing: 115, groceries: 98, utilities: 105, transport: 95, healthcare: 95, misc: 98 },
  { name: 'Nashville, TN', state: 'TN', index: 106, housing: 112, groceries: 96, utilities: 92, transport: 92, healthcare: 92, misc: 96 },
  { name: 'Houston, TX', state: 'TX', index: 105, housing: 110, groceries: 98, utilities: 95, transport: 95, healthcare: 95, misc: 98 },
  { name: 'Tampa, FL', state: 'FL', index: 105, housing: 108, groceries: 96, utilities: 95, transport: 95, healthcare: 92, misc: 96 },
  { name: 'Boise, ID', state: 'ID', index: 103, housing: 105, groceries: 98, utilities: 88, transport: 92, healthcare: 90, misc: 98 },
  { name: 'Atlanta, GA', state: 'GA', index: 103, housing: 105, groceries: 98, utilities: 95, transport: 95, healthcare: 95, misc: 98 },
  { name: 'Charlotte, NC', state: 'NC', index: 100, housing: 102, groceries: 96, utilities: 92, transport: 92, healthcare: 92, misc: 96 },
  { name: 'Raleigh, NC', state: 'NC', index: 98, housing: 100, groceries: 95, utilities: 92, transport: 92, healthcare: 92, misc: 95 },
  { name: 'Buffalo, NY', state: 'NY', index: 95, housing: 88, groceries: 95, utilities: 95, transport: 92, healthcare: 90, misc: 92 },
  { name: 'Kansas City, MO', state: 'MO', index: 95, housing: 95, groceries: 94, utilities: 92, transport: 90, healthcare: 90, misc: 94 },
  { name: 'Columbus, OH', state: 'OH', index: 94, housing: 88, groceries: 94, utilities: 90, transport: 90, healthcare: 90, misc: 94 },
  { name: 'Cincinnati, OH', state: 'OH', index: 93, housing: 82, groceries: 92, utilities: 90, transport: 88, healthcare: 88, misc: 92 },
  { name: 'Milwaukee, WI', state: 'WI', index: 93, housing: 85, groceries: 92, utilities: 90, transport: 88, healthcare: 90, misc: 92 },
  { name: 'Pittsburgh, PA', state: 'PA', index: 92, housing: 80, groceries: 92, utilities: 88, transport: 88, healthcare: 88, misc: 92 },
  { name: 'Indianapolis, IN', state: 'IN', index: 92, housing: 85, groceries: 92, utilities: 90, transport: 88, healthcare: 88, misc: 92 },
  { name: 'St. Louis, MO', state: 'MO', index: 91, housing: 78, groceries: 90, utilities: 88, transport: 88, healthcare: 88, misc: 90 },
  { name: 'Detroit, MI', state: 'MI', index: 90, housing: 75, groceries: 90, utilities: 88, transport: 88, healthcare: 88, misc: 90 },
  { name: 'Cleveland, OH', state: 'OH', index: 89, housing: 72, groceries: 90, utilities: 88, transport: 88, healthcare: 88, misc: 88 },
  { name: 'Louisville, KY', state: 'KY', index: 88, housing: 72, groceries: 90, utilities: 88, transport: 88, healthcare: 85, misc: 90 },
  { name: 'Oklahoma City, OK', state: 'OK', index: 86, housing: 70, groceries: 88, utilities: 88, transport: 85, healthcare: 85, misc: 88 },
  { name: 'Birmingham, AL', state: 'AL', index: 86, housing: 68, groceries: 88, utilities: 88, transport: 85, healthcare: 85, misc: 88 },
  { name: 'Memphis, TN', state: 'TN', index: 85, housing: 68, groceries: 88, utilities: 88, transport: 85, healthcare: 85, misc: 88 },
];

export const CATEGORY_LABELS: Record<string, string> = {
  housing: 'Housing', groceries: 'Groceries', utilities: 'Utilities',
  transport: 'Transport', healthcare: 'Healthcare', misc: 'Everything else',
};
