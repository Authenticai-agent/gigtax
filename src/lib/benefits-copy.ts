/**
 * Copy for the benefit and retirement calculators.
 *
 * Each page is the household calculator opened on one kind of income rather
 * than a separate implementation, so the arithmetic can never drift between
 * them. What differs is the explanation, which is the part that actually
 * varies: the rule that decides whether SSDI is taxed is not the rule that
 * decides whether a disability policy is taxed, and confusing the two is the
 * most common mistake in this area.
 */
import type { IncomeKind } from './household';

export interface BenefitPage {
  slug: string;
  title: string;
  h1: string;
  description: string;
  tagline: string;
  preset: Array<{ kind: IncomeKind; amount: number; premiumPaidBy?: 'employer' | 'employee' | 'split' }>;
  body: string[];
  sources?: Array<{ claim: string; authority: string; url: string; confidence: 'high' | 'medium' | 'low' }>;
}

const SS_FORMULA = {
  claim: 'Social Security and SSDI are taxed on a combined-income formula counting half the benefit plus other income, to a maximum of 85%',
  authority: 'IRC 86(a)-(b)',
  url: 'https://www.law.cornell.edu/uscode/text/26/86',
  confidence: 'high' as const,
};
const DISABILITY_PREMIUM = {
  claim: 'A disability benefit is excluded from income where the recipient paid the premium with money already taxed',
  authority: 'IRC 104(a)(3); IRC 105(a)',
  url: 'https://www.law.cornell.edu/uscode/text/26/104',
  confidence: 'high' as const,
};
const WORKERS_COMP = {
  claim: 'Amounts received under a workers’ compensation act for a work-related injury or illness are excluded from gross income',
  authority: 'IRC 104(a)(1)',
  url: 'https://www.law.cornell.edu/uscode/text/26/104',
  confidence: 'high' as const,
};

export const BENEFIT_PAGES: BenefitPage[] = [
  {
    slug: 'ssdi',
    title: 'SSDI tax calculator (2026) — how much of your disability benefit is taxable',
    h1: 'How much of your SSDI is taxable',
    description: 'Work out how much of your Social Security disability benefit is taxable in 2026, and how a spouse’s income changes it.',
    tagline: 'SSDI on its own is usually tax-free. What makes it taxable is everything else.',
    preset: [{ kind: 'ssdi', amount: 24000 }],
    body: [
      'Social Security disability is not taxed like wages. It is taxed on a formula that adds up half your benefit plus all your other income, and compares the total against a threshold. Below the threshold, none of the benefit is taxable. Above it, up to 85% of it becomes taxable — never more than 85%, however high your income goes.',
      'The consequence catches people out constantly: your benefit can become taxable without your benefit changing at all. A spouse taking on freelance work, an investment paying out, a pension starting — any of them can push the household past the threshold and make a benefit that was tax-free last year partly taxable this year.',
      'Add the other income below and you will see exactly how much of the benefit crosses over. Add a second person if you are married, because the thresholds and the formula work on the household, not on the person receiving the benefit.',
    ],
    sources: [SS_FORMULA],
  },
  {
    slug: 'short-term-disability',
    title: 'Short-term disability tax calculator (2026)',
    h1: 'Is your short-term disability benefit taxable?',
    description: 'Whether short-term disability pay is taxable in 2026 depends entirely on who paid the premium. Calculate both answers.',
    tagline: 'The answer depends on who paid the premium, not on how much you receive.',
    preset: [{ kind: 'disabilityShortTerm', amount: 12000, premiumPaidBy: 'employer' }],
    body: [
      'Short-term disability replaces part of your pay for a few weeks or months, and whether it is taxed has nothing to do with the amount. It depends on who paid for the policy.',
      'If your employer paid the premium, the benefit is fully taxable as ordinary income and you will get a W-2 for it. If you paid the premium yourself out of pay that had already been taxed, the benefit is entirely tax-free — you have already paid tax on the money that bought it. If the cost was shared, the benefit is split in the same proportion.',
      'The trap is a premium deducted from your pay before tax. That feels like paying it yourself, but untaxed money bought the policy, so the benefit is taxable. Change the premium answer below and the difference is immediate.',
    ],
    sources: [DISABILITY_PREMIUM],
  },
  {
    slug: 'long-term-disability',
    title: 'Long-term disability tax calculator (2026)',
    h1: 'Is your long-term disability benefit taxable?',
    description: 'Long-term disability pay is taxable or tax-free depending on who paid the premium. Work out what you keep in 2026.',
    tagline: 'The same benefit is worth thousands more a year if you paid the premium yourself.',
    preset: [{ kind: 'disabilityLongTerm', amount: 42000, premiumPaidBy: 'employer' }],
    body: [
      'Long-term disability runs for years rather than months, which makes the premium question worth far more here than on a short-term policy. The rule is the same: employer-paid premiums produce a taxable benefit, premiums you paid from taxed income produce a tax-free one.',
      'Over a long claim the difference compounds into a serious sum. A policy paying 60% of a salary sounds adequate until tax takes a share of it; the same 60% paid tax-free is worth substantially more, which is why paying the premium yourself is often the better arrangement even though it costs more up front.',
      'If you are also receiving SSDI, most long-term policies reduce their payment by the SSDI amount — and the two are taxed under completely different rules. Use the combined calculator for that.',
    ],
    sources: [DISABILITY_PREMIUM],
  },
  {
    slug: 'ssdi-and-long-term-disability',
    title: 'SSDI and long-term disability tax calculator (2026)',
    h1: 'SSDI and long-term disability together',
    description: 'Receiving both SSDI and a long-term disability policy in 2026? They are taxed under different rules. Work out the combined result.',
    tagline: 'Two benefits, two completely different tax rules, one tax bill.',
    preset: [
      { kind: 'ssdi', amount: 24000 },
      { kind: 'disabilityLongTerm', amount: 18000, premiumPaidBy: 'employer' },
    ],
    body: [
      'Receiving both is common, because most long-term disability policies require you to apply for SSDI and then reduce their own payment by whatever SSDI pays. What surprises people is that the two halves are taxed under rules that have nothing in common.',
      'The SSDI half is taxed on the combined-income formula: half the benefit plus everything else, tested against a threshold, capped at 85% taxable. The policy half is taxed on the premium question: fully taxable if your employer paid, entirely tax-free if you did.',
      'They interact in one direction that matters. A taxable policy benefit counts as other income in the SSDI formula, so an employer-paid policy can drag your SSDI into being taxable as well. A policy you paid for yourself does not, because tax-free income stays out of the formula. Change the premium answer below and watch both lines move.',
    ],
    sources: [SS_FORMULA, DISABILITY_PREMIUM],
  },
  {
    slug: 'workers-comp',
    title: 'Workers’ comp tax calculator (2026) — is it taxable?',
    h1: 'Is workers’ compensation taxable?',
    description: 'Workers’ compensation for a job injury is tax-free in 2026 — federal and state. The one exception is the SSDI offset. See how it works.',
    tagline: 'Workers’ comp for a job injury is tax-free. The one catch is when it reduces your SSDI.',
    preset: [{ kind: 'workersComp', amount: 30000 }],
    body: [
      'Workers’ compensation paid for a job-related injury or illness is not taxable — not federally, and not by any state. It does not go on your return as income, you do not get a W-2 or 1099 for it, and it does not count toward any income-based threshold. This is one of the clearest rules in the tax code, and it holds whether the payments are weekly wage replacement, a lump-sum settlement, or medical benefits.',
      'The one place it interacts with tax is the SSDI offset. If you receive SSDI and workers’ comp at the same time, Social Security caps the combined amount and reduces your SSDI by the overlap. That reduced-and-shifted portion — the “workers’ comp offset” — is treated as if it were SSDI, so it can be taxable under the SSDI formula. Only that offset amount is ever exposed to tax; the rest of the workers’ comp stays fully tax-free.',
      'Add your workers’ comp below, and add any other household income to confirm it changes nothing. If you also receive SSDI, add that too and use the SSDI page to see how the offset is treated — the two benefits together are where the only tax question lives.',
    ],
    sources: [WORKERS_COMP, SS_FORMULA],
  },
  {
    slug: 'retirement',
    title: 'Retirement tax calculator (2026) — Social Security and 401(k)',
    h1: 'Tax on Social Security and a 401(k)',
    description: 'How Social Security and 401(k) or IRA withdrawals are taxed together in 2026, and which states leave Social Security alone.',
    tagline: 'Drawing from a 401(k) can make your Social Security taxable. The order you take money matters.',
    preset: [
      { kind: 'socialSecurity', amount: 30000 },
      { kind: 'retirementWithdrawal', amount: 40000 },
    ],
    body: [
      'Social Security is taxed on the same combined-income formula as SSDI: half the benefit plus your other income, tested against a threshold, and never more than 85% of the benefit taxable however large your income.',
      'A 401(k) or traditional IRA withdrawal is ordinary income, and it counts in that formula. So every dollar you draw does two things: it is taxed itself, and it can drag more of your Social Security into being taxed alongside it. Inside the phase-in range that produces marginal rates noticeably higher than the bracket you appear to be in.',
      'The state layer is the other half of the answer. Most states do not tax Social Security at all — twelve do, and living in one of them changes the arithmetic. Select your state below and the calculation applies the right treatment.',
    ],
    sources: [SS_FORMULA],
  },
];

export function benefitPage(slug: string): BenefitPage | null {
  return BENEFIT_PAGES.find((p) => p.slug === slug) ?? null;
}
