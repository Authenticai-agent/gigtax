/**
 * Reader-facing copy for the local income tax pages.
 *
 * WHY THIS FILE EXISTS. The researched notes in overrides/local-income-tax-2026
 * .json were written to the person building the calculator, not to the person
 * reading the page — "FOUR things a calculator must get right", "do NOT apply
 * Alabama occupational tax to Schedule C profit", "re-pull dn01.pdf each
 * January". Rendering them verbatim put engineering notes on a public page and
 * left readers to work out what an owner-operator or a distributive share is.
 *
 * So the JSON keeps the research, unedited, as provenance and the source of
 * every figure. This file carries the same facts written for someone who does
 * not already know the vocabulary. Nothing here introduces a figure that is not
 * in the dataset; where a number appears it is the researched one.
 *
 * The rule for the prose: no term a reader would have to look up survives
 * without being explained in the same sentence.
 */

export interface LocalCopy {
  /**
   * The one trap in this state, in a sentence, for the hub.
   *
   * Every one of the twelve has something. Giving Ohio a section of its own on
   * the hub and the other eleven nothing implied they were straightforward,
   * which is not true of any of them.
   */
  headline: string;
  /** One line: what shape the charge takes here. */
  shape: string;
  /** Paragraphs for "What catches people out in <state>". */
  traps: string[];
}

export const LOCAL_COPY: Record<string, LocalCopy> = {
  OH: {
    headline: 'Your city taxes your whole business profit — the state break for business owners does not exist at city level.',
    shape: 'A city income tax on wages and business profit, plus a separate school district tax on top for people who live in a district that levies one.',
    traps: [
      'Ohio has the most complicated local income tax in the country, and the complications are structural rather than a matter of arithmetic. Four things work differently here from what you might expect.',
      'First, the income your city taxes is not the income Ohio taxes. Municipal tax skips pensions, Social Security and personal investment income altogether, so a retiree with a large state tax bill can owe their city nothing.',
      'Second, if you work for yourself, your profit is taxed in full. Ohio gives business owners a state break — the Business Income Deduction, which exempts the first $250,000 of business profit from state income tax and taxes the rest at 3%. That break does not exist at city level. Your city taxes the whole profit, and it does so both where you did the work and where you live. This is the single most common surprise for people who run their own business, because the state return and the city return give completely different answers on the same profit.',
      'Third, the credit for tax you already paid to another city is not always a full credit. If you live in one Ohio city and work in another, your home city normally credits what the work city took. Six of the twenty largest cities cap that credit below their own rate, so the credit does not cover the bill and you still owe the difference at home. Someone living in Lakewood and working elsewhere still owes Lakewood 1%; someone living in Springfield owes at least 1.2%.',
      'Fourth, school district income tax is a separate tax on top, not part of your city tax. It is triggered purely by where you live — your workplace is irrelevant — and it is filed with your state return rather than with the city. About half the districts that levy it tax retirement income; the other half do not.',
    ],
  },
  PA: {
    headline: 'S-corporation profit escapes the local tax entirely, while the identical profit earned as a sole proprietor does not.',
    shape: 'An Earned Income Tax everywhere except Philadelphia, which runs its own wage tax and its own tax on self-employed profit — plus a flat annual Local Services Tax based on where you work.',
    traps: [
      'Pennsylvania runs two local tax systems that do not talk to each other. The Earned Income Tax covers the whole state except Philadelphia, which sits outside it entirely with its own wage tax and its own tax on self-employed profit.',
      'Philadelphia changes its rates on July 1 rather than January 1, so any figure for a full calendar year is a blend of two rates rather than one.',
      'The most valuable thing to know here if you own a business: profit that reaches you as an S-corporation shareholder is not subject to the local Earned Income Tax, while the same profit earned as a sole proprietor is. In an area charging 3% between the municipality and the school district, that is a real reason to consider the election — and it is invisible in the federal arithmetic, because federally the two are taxed much the same.',
      'If you work for yourself, nobody withholds this tax for you. Sole proprietors, single-member LLC owners and most individual partners owe Earned Income Tax on their business profit and have to send quarterly payments directly to their local collector. It is missed constantly for exactly that reason.',
      'The Local Services Tax is a separate flat charge in dollars rather than a percentage, based on where you work rather than where you live. It is capped at $52 a year in total however many places you work in, and anyone earning under $12,000 from work in that area is exempt. Self-employed people owe it too, and where it is more than $10 a year they pay it quarterly.',
    ],
  },
  MI: {
    headline: 'The rate halves if you only work in the city rather than live there, and four cities are allowed to charge far more than the rest.',
    shape: 'A city income tax, charged at one rate if you live there and half that if you only work there.',
    traps: [
      'Twenty-four Michigan cities charge their own income tax. The standard is 1% if you live there and 0.5% if you only work there — the rate for non-residents is set at half the resident rate by state law, and never more.',
      'Four cities are allowed to charge more, and they do: Detroit at 2.4% and 1.2%, Highland Park at 2% and 1%, Grand Rapids and Saginaw at 1.5% and 0.75%. None of the other twenty qualifies to go above 1%.',
      'Profit from working for yourself is taxed, but which profit depends on where you live. If you live in the city, it taxes your business profit wherever you earned it. If you only work there, it taxes just the share you earned inside the city, worked out using the city’s own formula for splitting business income across places.',
      'Pensions, annuities and Social Security are not taxed by any of these cities.',
      'East Lansing’s tax expires after 2030. It was authorized for twelve years from January 2019 and is the only one of the twenty-four with an end date, so do not assume it is permanent.',
    ],
  },
  IN: {
    headline: 'Your county is fixed on January 1 and does not change if you move — and rates run from 0.5% to 3%.',
    shape: 'A county income tax, charged on the same income Indiana taxes.',
    traps: [
      'Every one of Indiana’s 92 counties charges a local income tax, and it is calculated on the same income the state taxes. That means it reaches profit from working for yourself in full, along with everything else the state taxes.',
      'The spread between counties is enormous and has nothing to do with distance. Porter County charges 0.5% and Randolph County charges 3% — a six-fold difference, and neighbouring counties can be far apart.',
      'Which county you pay is fixed on January 1 and does not change if you move during the year. If you live outside Indiana but your main place of work or business is in an Indiana county, you pay that county’s full rate — the reduced rate that used to apply to non-residents no longer exists.',
      'Six counties changed their rate on January 1, 2026: Carroll, Grant, Greene, Howard, Shelby and Union.',
    ],
  },
  MD: {
    headline: 'Unavoidable: every resident pays, on the same income the state taxes, including business profit and investment income.',
    shape: 'A county income tax, charged on the same income Maryland taxes — and set by the county you live in, not the one you work in.',
    traps: [
      'Maryland’s county income tax is not optional and there is no county without one. Every Maryland resident pays their county’s rate on top of the state rate.',
      'It is charged on the same income the state taxes, which means it automatically reaches profit from working for yourself, along with capital gains and interest. There is no separate calculation and no separate return — it comes off the same figure.',
      'Two counties raised their rate for 2026: Allegany from 3.03% to 3.2%, and Kent from 3.2% to 3.3%.',
    ],
  },
  KY: {
    headline: 'A city and a county can both tax the same income, and forgetting the credit between them overstates the bill.',
    shape: 'An occupational license fee on both wages and self-employed profit, charged by cities, counties and some school districts.',
    traps: [
      'Kentucky’s local occupational taxes reach the profits of sole proprietors and contractors explicitly, and they do so with no personal allowances or deductions of any kind. The rate applies from the first dollar.',
      'A city and a county can both tax the same income. Where the county has more than 30,000 people, state law requires it to credit whatever you already paid to a city inside it — so you are not paying both in full. Adding a city rate and a county rate together without applying that credit is the easiest way to overstate a Kentucky bill, and it is a mistake made often.',
    ],
  },
  AL: {
    headline: 'It reaches wages only. Work for yourself and it does not touch your profit — but a separate business license tax does.',
    shape: 'A city occupational tax on wages, for work done inside the city.',
    traps: [
      'Alabama’s occupational tax is a tax on wages, and only on wages. It applies where the person doing the work is an employee of the person paying for it. If you work for yourself, it does not reach your profit — and that is an unusual answer, which is why it is worth stating plainly.',
      'That does not mean self-employed people in these cities owe nothing. They are reached instead by a separate municipal business license tax, charged on turnover rather than profit, at rates that vary by the type of business. It is a different tax with different rules and is not included in the figures on this page.',
      'New occupational taxes have been frozen without approval from the state legislature since 2020, so the list of cities charging one is stable. Cities that already have one can still change their rate.',
    ],
  },
  MO: {
    headline: 'Work partly outside the city and you can reclaim the days you were elsewhere, which most people never do.',
    shape: 'A 1% earnings tax on wages and on the profits of businesses and self-employed people.',
    traps: [
      'Kansas City and St. Louis both charge a 1% earnings tax, and voters in both renewed it on April 7, 2026 for a further five years, so both are certain to be in force.',
      'If you live in the city you pay on everything you earn, wherever you did the work. If you only work there, you pay on the work actually done inside the city — and you can claim a refund for the days you worked elsewhere, which is worth doing if you are partly remote.',
      'Both cities tax the profits of self-employed people explicitly, so a sole proprietor pays 1% on the share of profit attributable to the city.',
      'St. Louis also has a 0.5% payroll expense tax, but that is charged to employers rather than to individuals and is not part of your personal tax bill.',
    ],
  },
  DE: {
    headline: 'Wilmington charges commuters the same 1.25% as residents — no reduced rate for people who only work there.',
    shape: 'A flat percentage on gross wages, with a matching tax at the same rate on self-employed profit.',
    traps: [
      'Wilmington is the only place in Delaware with a municipal wage tax. It is 1.25% on gross earned income.',
      'Unlike Michigan, there is no reduced rate for people who work in the city but live elsewhere — residents and commuters pay exactly the same 1.25%.',
      'A separate Net Profits Tax, also at 1.25%, covers sole proprietors and partnerships, so working for yourself does not avoid it.',
      'The rate is set by the Delaware General Assembly rather than by the city, so it moves with state legislation rather than city budgets.',
    ],
  },
  WV: {
    headline: 'Dollars per week worked, not a percentage — so it costs someone on $30,000 exactly what it costs someone on $300,000.',
    shape: 'A fixed number of dollars for each week you work in the city — not a percentage, so what you earn makes no difference.',
    traps: [
      'West Virginia’s city fees are a different shape from every other state on this site: a fixed number of dollars for each week you work in the city, regardless of your hours or your earnings. Someone earning $30,000 and someone earning $300,000 pay exactly the same.',
      'Anyone working at a physical location in the city pays, whether they live there or commute in. Self-employed people are liable too — that is confirmed for Huntington.',
      'Watch the name rather than trusting it. Huntington charges two things that sound alike: its City Service Fee is the $5-a-week charge on people who work there, while its Municipal Service Fee is a fire charge on property owners and has nothing to do with wages at all. Other cities use "Municipal Service Fee" to mean the weekly work charge. Check what the fee is actually charged on before assuming which one you owe.',
      'The cities listed here are not an exhaustive list of every West Virginia city charging a fee.',
    ],
  },
  OR: {
    headline: 'Both Portland-area taxes reach people who live in Washington, where there is no state income tax at all.',
    shape: 'Two taxes that only start above an income floor, plus one flat annual charge.',
    traps: [
      'Both Portland-area taxes — Metro Supportive Housing Services and Multnomah County Preschool for All — are charged on Oregon taxable income. That means profit from working for yourself counts toward the thresholds and is taxed once you pass them.',
      'Both reach people who live outside the district but earn income inside it. The well-known version of this is a Washington-state commuter who owes Metro Supportive Housing Services on income earned in Portland despite living in a state with no income tax at all.',
      'Where you physically work decides it. Travel into the district to work and that work is taxable. Work for a Portland employer entirely from home across the river in Vancouver, and it is not. That distinction settles the answer for most people crossing the Columbia, and it turns on where your body is rather than where your employer is.',
      'Oregon’s statewide transit tax and the TriMet and Lane transit taxes are not included here — they are either charged to employers or applied statewide rather than by district.',
    ],
  },
  NY: {
    headline: 'No city tax on commuters since 1999 — except a 4% tax on self-employed profit, which does reach them.',
    shape: 'A city income tax for New York City residents, a surcharge in Yonkers calculated on your state tax bill, and a separate 4% tax on self-employed profit earned in New York City.',
    traps: [
      'New York City has no income tax on people who work in the city but live outside it. The commuter tax was repealed in 1999 and has not come back.',
      'There is an important exception if you work for yourself. The city’s Unincorporated Business Tax — 4% on the profits of sole proprietors and partnerships — does reach people who live outside the city, as long as the income comes from New York City. So a freelancer commuting in from New Jersey pays no city income tax on wages but can owe this on business profit.',
      'Yonkers works differently again: its charge is 16.75% of your New York State income tax bill rather than a percentage of your income. It is the only tax on this site calculated on another tax.',
    ],
  },
};

export function localCopyFor(code: string): LocalCopy | null {
  return LOCAL_COPY[code] ?? null;
}
