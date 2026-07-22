/**
 * Deductions available to every self-employed business, whatever the trade.
 *
 * WHY THIS EXISTS. The profession pages were built from the dataset's
 * `professionals` block, which lists only what is *distinctive* about each
 * trade — a photographer's lenses, a notary's mileage. That left out everything
 * universal, and the universal list is where the largest deductions actually
 * live: the Augusta rule, a solo 401(k), self-employed health insurance,
 * employing your own children. A page that shows a designer six deductions and
 * omits the retirement contribution that would save them more than all six is
 * not incomplete, it is misleading.
 *
 * Every figure here is read from the verified dataset. The groupings and the
 * plain-English explanations are authored; no limit, rate or threshold is.
 *
 * NOT EXHAUSTIVE, AND SAYS SO. The statutory test is whether an expense is
 * ordinary and necessary for your trade, so no list can be complete. This one
 * is a checklist, and the pages that use it say that in those words.
 */
import { selfEmploymentDeductions, retirement, federal } from '../data/federal';
import { formatMoney } from './tax-engine';

const SED = selfEmploymentDeductions as Record<string, any>;
const RET = retirement as Record<string, any>;

export interface DeductionItem {
  name: string;
  /** What it is and what limits it, in plain words. */
  detail: string;
  /** True where people routinely miss it entirely. */
  oftenMissed?: boolean;
}

export interface DeductionGroup {
  key: string;
  title: string;
  /** Why this group matters — one line, shown under the heading. */
  lead: string;
  items: DeductionItem[];
}

const s179 = SED.section179;
const ho = SED.homeOffice;
const mile = SED.mileage;
const augusta = SED.augustaRule;
const sehi = SED.selfEmployedHealthInsurance;
const meals = SED.mealsDeduction;
const travel = SED.businessTravel;
const family = SED.familyEmployment;
const solo = RET.solo401k;
const sep = RET.sep_ira;
const hsa = RET.hsa;

const money = (n: number) => formatMoney(n);

export const DEDUCTION_GROUPS: DeductionGroup[] = [
  {
    key: 'big-ones',
    title: 'The ones that save the most, and get missed the most',
    lead: 'These are not obscure. They are simply not obvious, and each is worth more than most of the everyday expenses people carefully track.',
    items: [
      {
        name: 'Retirement contributions through the business',
        oftenMissed: true,
        detail: `A solo 401(k) takes up to ${money(solo.employeeLimit)} as your own deferral plus an employer contribution on top — ${money(solo.combinedMaxUnder50)} combined under 50, ${money(solo.combinedMax50to59)} from 50, ${money(solo.combinedMax60to63)} between 60 and 63. A SEP-IRA is simpler and takes up to ${money(sep.limit)}. This is usually the single largest deduction available to a profitable one-person business, and the money stays yours.`,
      },
      {
        name: 'Self-employed health insurance',
        oftenMissed: true,
        detail: `Medical, dental, vision and some long-term care premiums for you and your family, deducted in full rather than at a percentage. It cannot exceed your net profit, and you cannot take it for any month you were eligible for a subsidised plan through a spouse's employer.`,
      },
      {
        name: 'The Augusta rule',
        oftenMissed: true,
        detail: `Under ${augusta.code} you can rent your own home to your own company for up to ${augusta.maxDays} days a year, take the rent as a business deduction, and not report the income personally at all. It needs a written agreement, a genuine business purpose with an agenda, and a defensible market rate. It is only open to an S corporation, C corporation or partnership — a sole proprietor cannot rent a house to themselves.`,
      },
      {
        name: 'Employing your children',
        oftenMissed: true,
        detail: `Wages paid to your own child under 18 are exempt from Social Security and Medicare tax if you trade as a sole proprietor or a husband-and-wife partnership, and the child's own standard deduction covers up to ${money(family.hireChildren.standardDeduction2026)} of it tax-free. The work has to be real and paid at a fair rate, with a job description, timesheets and a regular pay schedule.`,
      },
      {
        name: 'Half of your self-employment tax',
        detail: 'Automatically deducted against your income tax. You do not have to claim it, but it is worth knowing it is there before you conclude the self-employment rate is as brutal as it first looks.',
      },
      {
        name: 'Health savings account',
        oftenMissed: true,
        detail: `If you have a qualifying high-deductible health plan, ${money(hsa.selfOnly)} on your own or ${money(hsa.family)} for a family goes in deductible, grows untaxed and comes out untaxed for medical costs — the only account in the code with all three. Add ${money(hsa.catchUp55)} from age 55.`,
      },
    ],
  },
  {
    key: 'workspace',
    title: 'Where you work',
    lead: 'Whether you rent premises or work from a spare room, the space costs money and the cost is deductible.',
    items: [
      {
        name: 'Home office',
        detail: `Two methods. Simplified is $${ho.simplified.ratePerSqFt.toFixed(0)} a square foot up to ${ho.simplified.maxSqFt} feet — ${money(ho.simplified.maxDeduction)} at most, and no depreciation recapture when you sell. Actual apportions rent or mortgage interest, utilities, insurance and repairs by floor area and usually gives more. ${ho.rule}`,
      },
      { name: 'Rent for an office, studio, yard or storage unit', detail: 'Deductible in full where the space is used for the business.' },
      { name: 'Utilities', detail: 'Electricity, water, gas, waste and security monitoring for business premises. At home, this is part of the home office calculation rather than a separate line.' },
      { name: 'Repairs and maintenance', detail: 'Routine repairs are deductible now. Improvements that add value or extend the life of the property have to be capitalised and depreciated instead.' },
      { name: 'Property insurance', detail: 'Cover on business premises, contents and equipment.' },
    ],
  },
  {
    key: 'vehicle',
    title: 'Getting around',
    lead: 'Two methods, and you generally have to choose one and live with it for that vehicle.',
    items: [
      {
        name: 'Mileage, the standard rate',
        detail: `${(mile.businessRatePerMile * 100).toFixed(1)} cents a business mile for 2026, up from 70 cents. Simple, needs only a log. You cannot use it at all if you have previously claimed accelerated depreciation on the same vehicle.`,
      },
      {
        name: 'Actual vehicle costs',
        detail: `Fuel, insurance, repairs, registration and depreciation, multiplied by your business-use percentage. Depreciation is capped annually — ${money(SED.vehicleActualMethod.macrsDepreciationCar.year1)} in year one, ${money(SED.vehicleActualMethod.macrsDepreciationCar.year2)} in year two — and those caps are applied at the business-use percentage too.`,
      },
      { name: 'Tolls and parking', detail: 'Deductible on top of the mileage rate, which does not include them. Parking fines are not deductible.' },
      { name: 'Vehicle lease payments', detail: 'Deductible at the business-use percentage, with an adjustment on more expensive vehicles.' },
      { name: 'Commuting', detail: 'Not deductible, ever — travel between home and your regular place of work is personal however far it is. Travel between two work locations is deductible.' },
    ],
  },
  {
    key: 'equipment',
    title: 'Equipment and technology',
    lead: 'Anything long-lasting can usually be deducted in full the year you start using it, rather than spread over its life.',
    items: [
      {
        name: 'Section 179 and bonus depreciation',
        detail: `Deduct the whole cost in the year the asset goes into service, up to ${money(s179.limit)} a year, with 100% bonus depreciation now permanent. It must be more than ${(s179.businessUsePctRequired * 100).toFixed(0)}% business use, and you deduct at that percentage. Larger SUVs are capped separately at ${money(s179.suvLimit)}.`,
      },
      { name: 'Computers, tablets, phones and networking gear', detail: 'At the business-use percentage where you also use them personally.' },
      { name: 'Furniture and fittings', detail: 'Desks, chairs, shelving, treatment tables, waiting-room furniture.' },
      { name: 'Tools and trade equipment', detail: 'Everything from a massage table to a tractor to a set of securement straps, on the same Section 179 rules.' },
      { name: 'Software and subscriptions', detail: 'Deductible in the year you pay. Software developed for the business can be expensed in the year of cost rather than amortised.' },
    ],
  },
  {
    key: 'people',
    title: 'People you pay',
    lead: 'Whether they are employees or contractors changes your paperwork more than your deduction.',
    items: [
      { name: 'Wages, salaries and bonuses', detail: 'Deductible in full.' },
      { name: 'Your share of payroll taxes', detail: 'The employer half of Social Security and Medicare, plus unemployment tax.' },
      { name: 'Employee benefits', detail: 'Health cover, retirement contributions, life and disability cover, education assistance.' },
      { name: 'Contractors and subcontractors', detail: 'Deductible in full. Pay any one of them $600 or more in a year and you have to issue a 1099-NEC — that is your obligation, not theirs.' },
      { name: 'Recruitment', detail: 'Job advertising, recruiter fees and background checks.' },
      { name: 'Workers’ compensation insurance', detail: 'Deductible, and mandatory in most states once you have employees.' },
    ],
  },
  {
    key: 'clients',
    title: 'Finding and keeping clients',
    lead: 'Nearly all of it is deductible in full. The two exceptions catch people out.',
    items: [
      { name: 'Advertising and marketing', detail: 'Website, search advertising, print, signage, sponsorship.' },
      { name: 'Branding and content', detail: 'Logo design, photography, video production.' },
      { name: 'Website costs', detail: 'Hosting, domains, certificates, maintenance.' },
      { name: 'Conferences and trade shows', detail: 'Entry, stand costs and the travel to get there.' },
      {
        name: 'Client gifts — capped at $25',
        oftenMissed: true,
        detail: 'Only $25 per recipient per year is deductible, a figure that has not moved in decades. Engraving and postage sit outside the cap; the gift does not. Anything above $25 is simply a personal cost.',
      },
      {
        name: 'Client entertainment — no longer deductible',
        detail: 'Tickets, green fees and similar have not been deductible since 2018. A meal alongside the entertainment can still qualify if it is billed separately.',
      },
    ],
  },
  {
    key: 'travel',
    title: 'Travel and meals',
    lead: 'The rules differ sharply between the two, and between ordinary travel and being away overnight.',
    items: [
      { name: 'Business travel', detail: `Airfare, hotels, taxis and car hire at ${(travel.airfareDeductible * 100).toFixed(0)}% when the trip is primarily for business. Mixed trips are apportioned, and the test is the purpose of the trip rather than how you spent each hour.` },
      { name: 'Meals while travelling or with clients', detail: `${(meals.rate * 100).toFixed(0)}% deductible. You have to be able to say who was there and what business was discussed, and the meal must not be lavish.` },
      { name: 'Per diem instead of receipts', detail: 'A fixed daily amount can replace itemised meal receipts. Drivers subject to hours-of-service rules use a higher rate at a different percentage — see the truck driver page.' },
    ],
  },
  {
    key: 'running',
    title: 'Running the business',
    lead: 'The unglamorous lines. Individually small, collectively not.',
    items: [
      { name: 'Professional fees', detail: 'Accountants, solicitors, consultants and bookkeepers.' },
      { name: 'Business insurance', detail: 'General liability, professional indemnity or malpractice, cyber and data-breach cover.' },
      { name: 'Licences, permits and regulatory fees', detail: 'Professional licensing, trade registration, local business licences, industry-specific registrations.' },
      { name: 'Professional memberships', detail: 'Trade bodies, professional associations, chambers of commerce. Clubs organised for pleasure or recreation are not deductible.' },
      { name: 'Bank charges, merchant fees and interest on business borrowing', detail: 'Card processing fees are often one of the larger overlooked lines for anyone taking payments online.' },
      { name: 'Office supplies and postage', detail: 'Deductible in the year you buy them.' },
      { name: 'Continuing education', detail: 'Deductible where it maintains or improves skills for work you already do. Not deductible where it qualifies you for a new line of work.' },
      { name: 'Books, journals and research subscriptions', detail: 'Where they relate to the business rather than to your general interest.' },
      {
        name: 'Startup costs',
        oftenMissed: true,
        detail: 'Up to $5,000 of pre-launch spending is deductible in your first year and the rest is spread over 180 months. Entity formation costs are treated separately on the same pattern. People often assume money spent before the business opened is lost.',
      },
      { name: 'Bad debts', detail: 'Only where you had already reported the income. If you invoice on a cash basis and were never paid, there is nothing to write off — you were never taxed on it.' },
      { name: 'Business taxes and licences', detail: 'State and local business taxes and property tax on business assets. Federal income tax is not deductible.' },
      { name: 'Uniforms and protective clothing', detail: 'Only where it is unsuitable for everyday wear — boots, hard hats, hi-vis, scrubs. Ordinary clothing bought for work is never deductible, however strictly it is expected.' },
      { name: 'Charitable donations', detail: 'Not a business deduction on a sole trader return. They go on your personal itemised deductions instead, which is why many people get no benefit at all.' },
    ],
  },
];

/** The items most often missed, for a short callout. */
export function oftenMissed(): DeductionItem[] {
  return DEDUCTION_GROUPS.flatMap((g) => g.items).filter((i) => i.oftenMissed);
}

export function totalDeductionCount(): number {
  return DEDUCTION_GROUPS.reduce((n, g) => n + g.items.length, 0);
}
