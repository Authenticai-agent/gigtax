/**
 * Occupation pay medians (overall / male / female) for the gender pay gap
 * calculator. REFERENCE data — illustrative figures in the style of BLS
 * occupation medians, not authoritative or year-stamped. Used to show the
 * male/female gap for an occupation and its lifetime cost, never as a claim
 * about any individual.
 */
export interface Occupation { name: string; median: number; maleMedian: number; femaleMedian: number; note: string; }

export const OCCUPATIONS: Occupation[] = [
  { name: 'Software Developer / Engineer', median: 132270, maleMedian: 135000, femaleMedian: 118000, note: 'Tech has a persistent gap despite high overall salaries.'},
  { name: 'Registered Nurse', median: 86070, maleMedian: 91000, femaleMedian: 84000, note: 'Male nurses are 13% of workforce but overrepresented in higher-paying specialties like CRNA and management.'},
  { name: 'Teacher (K-12)', median: 61090, maleMedian: 64000, femaleMedian: 59000, note: 'Women are 76% of teachers. Male teachers more likely to coach (supplemental pay) and advance to administration.'},
  { name: 'Accountant / Auditor', median: 79920, maleMedian: 87000, femaleMedian: 73000, note: 'Partnership track at Big 4 has significant attrition for women, especially during childbearing years.'},
  { name: 'Marketing Manager', median: 157620, maleMedian: 172000, femaleMedian: 138000, note: 'C-suite marketing roles show larger gaps than mid-level.'},
  { name: 'Sales Representative', median: 73220, maleMedian: 85000, femaleMedian: 62000, note: 'Commission-based pay amplifies gaps when women get lower-territory or lower-commission accounts.'},
  { name: 'Human Resources Specialist', median: 67880, maleMedian: 76000, femaleMedian: 64000, note: 'HR is female-dominated but male HR leaders earn more; gap widens at director+ level.'},
  { name: 'Physician / Surgeon', median: 239200, maleMedian: 275000, femaleMedian: 208000, note: 'Largest gap of any major occupation. Specialty choice explains some but not all of the difference.'},
  { name: 'Pharmacist', median: 132750, maleMedian: 138000, femaleMedian: 128000, note: 'Relatively narrow gap due to standardized pay scales in retail pharmacy.'},
  { name: 'Physical Therapist', median: 99090, maleMedian: 104000, femaleMedian: 96000, note: 'Narrow gap. Self-employed PTs show slightly larger differences.'},
  { name: 'Lawyer / Attorney', median: 135740, maleMedian: 158000, femaleMedian: 115000, note: 'Big Law partnership gap is severe (19% female equity partners). Solo practice also shows disparities.'},
  { name: 'Financial Analyst', median: 96000, maleMedian: 108000, femaleMedian: 84000, note: 'Wall Street and buy-side roles have extreme gaps; corporate finance is more compressed.'},
  { name: 'Data Scientist', median: 108020, maleMedian: 115000, femaleMedian: 98000, note: 'Tech-adjacent role with moderate gap. Startup equity compounds disparity over time.'},
  { name: 'Project Manager', median: 98000, maleMedian: 106000, femaleMedian: 91000, note: 'Construction and IT PMs skew male and higher-paid; healthcare and nonprofit PMs skew female.'},
  { name: 'Executive Assistant', median: 68920, maleMedian: 78000, femaleMedian: 66000, note: 'Rare male EAs command premium, especially supporting C-suite executives.'},
  { name: 'Truck Driver (Heavy)', median: 54020, maleMedian: 55000, femaleMedian: 48000, note: 'Women are 7% of heavy truck drivers. Gap reflects route assignment (long-haul vs local).'},
  { name: 'Customer Service Rep', median: 38430, maleMedian: 41000, femaleMedian: 36000, note: 'High-turnover role with little negotiation leverage. Gap is consistent across industries.'},
  { name: 'Administrative Assistant', median: 44270, maleMedian: 47000, femaleMedian: 43000, note: 'Historically female-coded role; men who enter often move up faster or get assigned to higher-paid executives.'},
  { name: 'Social Worker', median: 55640, maleMedian: 62000, femaleMedian: 52000, note: 'Male social workers are overrepresented in clinical licensure paths and administration.'},
  { name: 'Psychologist', median: 85830, maleMedian: 98000, femaleMedian: 76000, note: 'Private practice rates vary widely; women undercharge and accept lower-insurance panels more often.'},
  { name: 'Chef / Head Cook', median: 56850, maleMedian: 62000, femaleMedian: 48000, note: 'Celebrity chef culture is male-dominated. Women are overrepresented in lower-paid cafeteria and institutional cooking.'},
  { name: 'Real Estate Agent', median: 54200, maleMedian: 62000, femaleMedian: 48000, note: 'Commission-based. Women often handle lower-price markets and get fewer luxury listings from broker networks.'},
  { name: 'Graphic Designer', median: 58770, maleMedian: 64000, femaleMedian: 54000, note: 'Freelance rate disparities are larger than in-house. Women underbid more often.'},
  { name: 'Writer / Editor', median: 73150, maleMedian: 82000, femaleMedian: 65000, note: 'Book advances, script sales, and editor-in-chief roles show large disparities.'},
  { name: 'Mechanical Engineer', median: 99110, maleMedian: 105000, femaleMedian: 90000, note: 'Women are 9% of mechanical engineers. Those who enter often face glass ceiling in management tracks.'},
  { name: 'Civil Engineer', median: 90220, maleMedian: 96000, femaleMedian: 84000, note: 'Public sector civil engineering has narrower gaps than private consulting.'},
  { name: 'Management Analyst', median: 100530, maleMedian: 110000, femaleMedian: 90000, note: 'MBB consulting partners show severe gaps; independent consultants have more variable results.'},
  { name: 'Dental Hygienist', median: 87030, maleMedian: 92000, femaleMedian: 86000, note: 'Narrow gap. Male hygienists are rare and slightly overrepresented in temp/agency work at higher rates.'},
  { name: 'Radiologic Technologist', median: 70240, maleMedian: 76000, femaleMedian: 67000, note: 'Specialization (MRI, CT) creates pay tiers where men advance faster.'},
  { name: 'Paralegal / Legal Assistant', median: 60460, maleMedian: 68000, femaleMedian: 56000, note: 'Male paralegals often use the role as a stepping stone to law school and get better mentoring.'},
  { name: 'Nurse Practitioner', median: 126260, maleMedian: 132000, femaleMedian: 122000, note: 'Narrow gap among NPs. Male NPs slightly more likely to work in higher-paying acute care settings.'},
  { name: 'Electrician', median: 61790, maleMedian: 63000, femaleMedian: 52000, note: 'Women are 2% of electricians. Union vs non-union matters more than gender for pay.'},
  { name: 'Police Officer', median: 71000, maleMedian: 74000, femaleMedian: 65000, note: 'Overtime and detail pay amplify gaps. Women underrepresented in SWAT and detective units with premium pay.'},
  { name: 'Firefighter', median: 56810, maleMedian: 59000, femaleMedian: 48000, note: 'Women are 4% of firefighters. Overtime structure creates cumulative earnings gaps.'},
  { name: 'Restaurant Server', median: 32790, maleMedian: 36000, femaleMedian: 31000, note: 'Tips and shift assignment (high-tipping vs slow sections) drive disparities.'},
];
