/**
 * Index of the personal-finance and lifestyle calculators.
 *
 * Both the home page and the two section hubs (/personal-finance/, /lifestyle/)
 * render their links from these arrays, so a calculator appears in the navigation
 * exactly when its entry is added here — no hand-maintained link lists to drift.
 * Add an entry only once the page exists, or the home page will link to a 404.
 */
export interface CalcEntry {
  slug: string;
  title: string;
  blurb: string;
  group: string;
}

export const personalFinance: CalcEntry[] = [
  { slug: 'net-worth-calculator', title: 'Net worth', blurb: 'everything you own minus everything you owe', group: 'Where you stand' },
  { slug: 'fire-calculator', title: 'FIRE — how long until I’m rich?', blurb: 'years to financial independence at your savings rate', group: 'Retirement & independence' },
  { slug: 'when-can-i-retire-calculator', title: 'When can I retire?', blurb: 'the age your savings can replace your income', group: 'Retirement & independence' },
  { slug: 'cost-of-procrastinating-investing-calculator', title: 'Cost of waiting to invest', blurb: 'what a few years’ delay costs by retirement', group: 'Retirement & independence' },
  { slug: 'budget-calculator', title: '50/30/20 budget', blurb: 'needs, wants and savings from your take-home pay', group: 'Everyday money' },
  { slug: 'credit-card-payoff-calculator', title: 'Credit card minimum-payment trap', blurb: 'how many years the minimum really takes', group: 'Everyday money' },
  { slug: 'subscription-audit-calculator', title: 'Subscription audit', blurb: 'the real yearly cost of “just a few dollars a month”', group: 'Everyday money' },
  { slug: 'buy-vs-rent-calculator', title: 'Buy vs rent', blurb: 'the break-even year where buying beats renting', group: 'Big decisions' },
  { slug: 'salary-by-city-calculator', title: 'Salary by city', blurb: 'what your pay is worth in another city', group: 'Big decisions' },
  { slug: 'college-roi-calculator', title: 'College degree ROI', blurb: 'lifetime earnings with a degree vs without', group: 'Big decisions' },
  { slug: 'college-savings-gap-calculator', title: 'College savings gap', blurb: 'projected 529 savings vs the future cost', group: 'Big decisions' },
  { slug: 'lifetime-tax-calculator', title: 'Lifetime tax paid', blurb: 'federal, state and FICA across a whole career', group: 'Income & work' },
  { slug: 'gender-pay-gap-calculator', title: 'Gender pay gap', blurb: 'the gap in your occupation, and its lifetime cost', group: 'Income & work' },
  { slug: 'profit-margin-calculator', title: 'Profit margin', blurb: 'gross margin, net margin and markup', group: 'Income & work' },
];

export const lifestyle: CalcEntry[] = [];
