/**
 * Plain-English glossary.
 *
 * Some vocabulary cannot be written out of these pages. "Schedule C" is the
 * name of the form; "distributive share" is the term the Pennsylvania statute
 * uses and the thing a reader will see on their own paperwork. Replacing those
 * with paraphrases would make the pages easier to read and harder to act on.
 *
 * So the terms stay and get defined. Each page collects the prose it is about
 * to render, matches it against this list, and shows definitions for the terms
 * that actually appear on that page — never a fixed block, because a fixed
 * block would be both wrong and a large slab of identical text across hundreds
 * of pages, which the duplicate gate would rightly fail.
 *
 * What does NOT belong here: jargon I chose to write. "Owner-operator" was my
 * word, not the statute's, and the fix for that was to stop using it rather
 * than to define it. This list is for terms a reader will genuinely meet on a
 * form, a city ordinance or an accountant's email.
 */

export interface Term {
  /** What is shown as the term being defined. */
  term: string;
  /** Matched case-insensitively against the page's prose. */
  pattern: RegExp;
  gloss: string;
}

export const GLOSSARY: Term[] = [
  {
    term: 'Schedule C',
    pattern: /\bschedule c\b/i,
    gloss: 'The form you attach to your federal tax return to report profit or loss from a business you run yourself. Income minus expenses; what is left is your net profit.',
  },
  {
    term: 'Schedule F',
    pattern: /\bschedule f\b/i,
    gloss: 'The farming equivalent of Schedule C — profit or loss from farming, with its own rules for livestock, feed and crop insurance.',
  },
  {
    term: 'Net profit',
    pattern: /\bnet profit/i,
    gloss: 'What your business earned after business expenses, before any tax. It is the figure the self-employment tax is charged on, not what you took out of the business.',
  },
  {
    term: 'Sole proprietor',
    pattern: /\bsole proprietor/i,
    gloss: 'Someone who works for themselves without forming a company. The default if you started working for yourself and never registered anything — you and the business are the same legal person for tax.',
  },
  {
    term: 'Distributive share',
    pattern: /\bdistributive share\b/i,
    gloss: 'Your slice of a business’s profit when it is owned by more than one person, or held through an S corporation or partnership. It is taxed to you whether or not the money is actually paid out.',
  },
  {
    term: 'Nonresident',
    pattern: /\bnon-?resident/i,
    gloss: 'Someone who earns money in a place without living there. Most states and cities tax non-residents only on what they earned inside the boundary, and residents on everything.',
  },
  {
    term: 'Pass-through',
    pattern: /\bpass-?through\b/i,
    gloss: 'A business that pays no tax itself — its profit passes through to the owners, who pay tax on it on their personal returns. S corporations, partnerships and most LLCs work this way.',
  },
  {
    term: '1099-NEC',
    pattern: /1099-NEC/,
    gloss: 'The form a client sends you, and the tax office, when they have paid you $600 or more in a year for work. You owe the tax on that income whether or not the form ever arrives.',
  },
  {
    term: '1099-K',
    pattern: /1099-K/,
    gloss: 'The form a payment platform or marketplace sends when it has processed money on your behalf. It reports what came in, before fees and refunds — not your profit.',
  },
  {
    term: 'K-1',
    pattern: /\bK-1\b/,
    gloss: 'The statement a partnership or S corporation gives each owner showing their share of the profit, which they then report on their own return.',
  },
  {
    term: 'Reciprocity agreement',
    pattern: /\breciprocit/i,
    gloss: 'A deal between two states saying that if you live in one and work in the other, only your home state taxes your wages. It saves you filing in both — but you usually have to give your employer a form to switch it on.',
  },
  {
    term: 'Social Security wage base',
    pattern: /\bwage base\b/i,
    gloss: 'The annual earnings ceiling for the Social Security part of self-employment and payroll tax. Above it, that 12.4% stops and only the 2.9% Medicare part continues, so the marginal rate drops sharply.',
  },
  {
    term: 'Qualified business income deduction',
    pattern: /\bQBI\b|qualified business income/i,
    gloss: 'A federal deduction of up to 20% of the profit from a business you run yourself, taken after your other deductions. It reduces income tax but never self-employment tax.',
  },
  {
    term: 'Section 179',
    pattern: /section 179/i,
    gloss: 'A rule letting you deduct the whole cost of equipment in the year you start using it, instead of spreading it over the years you own it.',
  },
  {
    term: 'Depreciation',
    pattern: /\bdepreciat/i,
    gloss: 'Spreading the cost of something long-lasting — a vehicle, a camera, a tractor — across the years you use it, rather than deducting it all at once.',
  },
  {
    term: 'Depreciation recapture',
    pattern: /\brecapture\b/i,
    gloss: 'When you sell something you had been depreciating, the tax office takes back part of the benefit by taxing the gain up to the amount you already deducted.',
  },
  {
    term: 'MACRS',
    pattern: /\bMACRS\b/,
    gloss: 'The standard federal timetable for depreciation — the schedule that decides how much of an asset’s cost you deduct in each year of its life.',
  },
  {
    term: 'Gross receipts',
    pattern: /gross receipts/i,
    gloss: 'Everything the business took in, before subtracting any costs. A tax on gross receipts is owed even by a business making a loss, which is what makes it different from a tax on profit.',
  },
  {
    term: 'Franchise tax',
    pattern: /franchise tax/i,
    gloss: 'A charge for the privilege of operating as a company in a state. Despite the name it has nothing to do with franchises, and it is often owed whether or not the business made money.',
  },
  {
    term: 'Adjusted gross income',
    pattern: /adjusted gross income|\bAGI\b/,
    gloss: 'Your total income minus a specific set of deductions, before the standard deduction. Many state taxes and phase-outs are measured against this figure rather than your final taxable income.',
  },
  {
    term: 'Safe harbour',
    pattern: /safe harbou?r/i,
    gloss: 'Pay at least as much tax during the year as a set rule requires — usually based on last year’s bill — and you cannot be penalised for underpaying, however much you end up owing.',
  },
  {
    term: 'Tax home',
    pattern: /\btax home\b/i,
    gloss: 'The place your work is based, which is not always where you live. Travel expenses are only deductible when you are away from it, so losing one makes previously tax-free stipends taxable.',
  },
  {
    term: 'Specified service trade or business',
    pattern: /specified service|\bSSTB\b/i,
    gloss: 'Work where the main asset is the skill or reputation of the people doing it — health, law, accounting, consulting and similar. These lose the qualified business income deduction above an income threshold, where other trades keep it.',
  },
  {
    term: 'Per diem',
    pattern: /per diem/i,
    gloss: 'A fixed daily amount you can deduct or be paid for time away from home, instead of adding up individual receipts.',
  },
  {
    term: 'Earned income tax',
    pattern: /\bEIT\b|earned income tax/i,
    gloss: 'Pennsylvania’s local tax on wages and self-employed profit, collected by your municipality and school district rather than by the state.',
  },
  {
    term: 'Local Services Tax',
    pattern: /local services tax|\bLST\b/i,
    gloss: 'A flat annual charge in Pennsylvania based on where you work rather than what you earn, capped at $52 a year across every place you work in.',
  },
  {
    term: 'Business Income Deduction',
    pattern: /business income deduction/i,
    gloss: 'Ohio’s state-level break for business owners: the first $250,000 of business profit is exempt from state income tax and the rest is taxed at 3%. It applies to the state return only, never to a city one.',
  },
  {
    term: 'Alternative minimum tax',
    pattern: /\bAMT\b|alternative minimum tax/i,
    gloss: 'A parallel calculation that catches income the ordinary rules leave untaxed. Exercising incentive stock options can trigger it on a paper gain you have not sold and may never realise.',
  },
  {
    term: 'Supplemental withholding rate',
    pattern: /supplemental rate|supplemental withholding/i,
    gloss: 'The flat percentage an employer withholds on a bonus or a share vest — 22% below $1 million. It is not your actual tax rate, which is why higher earners are under-withheld and owe more in April.',
  },
  {
    term: 'Limited Liability Entity Tax',
    pattern: /limited liability entity tax|\bLLET\b/i,
    gloss: 'Kentucky’s annual charge on businesses operating in the state. It has a minimum owed even at a loss, and above a turnover threshold it is calculated on turnover rather than profit.',
  },
  {
    term: 'Entity level',
    pattern: /entity[- ]level|at entity level/i,
    gloss: 'A tax charged to the company itself, before any profit reaches the owners — as opposed to a tax the owners pay on their own returns.',
  },
  {
    term: 'Net worth tax',
    pattern: /net worth tax/i,
    gloss: 'A charge based on what the company is worth on paper — its assets less its debts — rather than on what it earned. It is owed by profitable and loss-making businesses alike.',
  },
  {
    term: 'Excise tax',
    pattern: /excise tax/i,
    gloss: 'Used by some states as the name for their tax on business earnings. Despite the name it is not a tax on a particular product here — it is the state’s corporate income tax under another label.',
  },
  {
    term: 'C corporation',
    pattern: /\bC corporation|\bC corp\b/i,
    gloss: 'A company taxed as a separate taxpayer in its own right, so profit is taxed once to the company and again to the owner when paid out. The thing an S corporation election is meant to avoid.',
  },
  {
    term: 'S corporation election',
    pattern: /S corporation|S-corp|S corp\b/i,
    gloss: 'Asking the tax office to treat your company as a pass-through, so profit is taxed to you rather than to the company. The owner takes a salary and the rest as a distribution, which is what saves payroll tax.',
  },
  {
    term: 'Distribution',
    pattern: /\bdistribution\b/i,
    gloss: 'Profit paid out to a company’s owner that is not salary. It is not subject to payroll or self-employment tax, which is the whole point of the S corporation election — and why the salary has to be defensible.',
  },
  {
    term: 'Owner-operator',
    pattern: /owner-operator/i,
    gloss: 'A truck driver who owns or leases their own truck and runs as their own business, rather than driving a company\u2019s truck for wages. Owner-operators are self-employed; company drivers are employees, and the tax treatment is completely different.',
  },
  {
    term: 'Lease-purchase driver',
    pattern: /lease-purchase/i,
    gloss: 'A driver buying their truck through instalments paid to the carrier they haul for. Treated as self-employed for tax, like an owner-operator.',
  },
  {
    term: 'Reasonable compensation',
    pattern: /reasonable compensation|reasonably compensat/i,
    gloss: 'The salary an S corporation owner must pay themselves for the work they actually do. Set it too low to save payroll tax and the tax office can re-classify the difference and charge back tax.',
  },
];

/**
 * The glossary terms that genuinely appear in this page's prose.
 *
 * Pass the strings the page is about to render. Returns them in glossary order
 * so the definitions read consistently rather than in the order the page
 * happens to mention them.
 */
export function termsIn(...texts: (string | null | undefined)[]): Term[] {
  const haystack = texts.filter(Boolean).join(' ');
  return GLOSSARY.filter((t) => t.pattern.test(haystack));
}
