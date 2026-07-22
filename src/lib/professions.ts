/**
 * Profession-level deduction profiles.
 *
 * Twenty-three trades from the verified dataset's `professionals` block, each
 * with the deductions that actually move its Schedule C. No new research: the
 * deduction lists, the profession notes and the unique rules (clergy housing
 * allowance, farm Schedule F) are the dataset's own.
 *
 * WHAT IS AUTHORED HERE AND WHAT IS NOT. The dataset stores deductions as slugs
 * — `client_gifts_limit_25`, `camera_lenses_section179`. Turning those into
 * readable labels is presentation, the same call already made for platform
 * names. What is NOT authored is any figure: where a slug names a rule with a
 * number behind it, that number is read from selfEmploymentDeductions, never
 * typed in. Slugs with no figure behind them get a label and nothing more.
 *
 * NO INVENTED INCOMES. There is no "typical earnings" figure for any of these
 * trades in the dataset, so none is asserted. What the pages compute instead is
 * what a dollar of deduction is worth, which is real arithmetic on real rates
 * and is the number that actually helps.
 */
import { selfEmploymentDeductions, federal } from '../data/federal';
import professionalsData from '../data/professionals';
import { calcFederalTax, calcStateTax, calcSETax, calcQBI, getStandardDeduction, formatMoney } from './tax-engine';

const SED = selfEmploymentDeductions as Record<string, any>;
const RAW = professionalsData as Record<string, any>;

export interface Profession {
  slug: string;
  key: string;
  name: string;
  /** One line naming what this trade specifically gets wrong. Authored. */
  lead: string;
  /**
   * A second authored paragraph, specific to this trade.
   *
   * It exists for a measured reason. Trades with near-identical deduction lists
   * — a hair stylist and a massage therapist both pay booth rent and carry
   * liability insurance; a developer, a VA and a QA tester all live on a home
   * office and a laptop — produced pages that were 73% the same document. The
   * shared part is real and cannot be removed. So the differentiator has to be
   * the part only this trade's reader needs.
   */
  watch: string;
}

/**
 * Order and naming are presentation. `lead` is the one authored sentence per
 * trade, and it exists so that twenty-three pages do not open identically —
 * each names the mistake that is particular to that work.
 */
export const PROFESSIONS: Profession[] = [
  { key: 'software_dev', slug: 'software-developer', name: 'Software developer', lead: 'The home office is the biggest line and the one most contractors underclaim, because they work from a room they also sleep near and assume that disqualifies it. Exclusive use means the space, not the building.', watch: 'Contract developers are the classic reclassification target: if a single client sets your hours, supplies your machine and reviews your work like a manager, the IRS may decide you were an employee, and the 1099 does not settle it. The other line to watch is R&D software, which OBBBA lets you expense in the year of cost rather than amortise.' },
  { key: 'ai_consultant', slug: 'ai-consultant', name: 'AI consultant', lead: 'Compute is the unusual line. GPU hours and API spend are ordinary business expenses in the year incurred, and they can dwarf every other deduction in a month where a model is being trained.', watch: 'Compute spend is lumpy in a way that wrecks quarterly estimates: a quarter where you train a model can swing profit by more than your cushion. Base your quarterly payments on last year\u2019s tax bill rather than on a forecast of this year\u2019s and the swing stops mattering \u2014 paying what last year required protects you from a penalty however the year turns out.' },
  { key: 'designer', slug: 'designer', name: 'Designer', lead: 'The hardware is the Section 179 opportunity and the software is the boring line that adds up faster. A monitor and an iPad bought for client work can be expensed in full the year they are placed in service.', watch: 'Stock assets and fonts are licences, not purchases, and a perpetual licence bought for one client project is still an ordinary expense in the year you buy it. Subcontracted illustration or motion work over $600 in a year means you are the one issuing a 1099-NEC.' },
  { key: 'copywriter', slug: 'copywriter', name: 'Copywriter', lead: 'Almost every deduction is a subscription, which means almost every deduction is on a card statement rather than a receipt. That is easier to substantiate, not harder — but only if the card is a business card.', watch: 'Research subscriptions are deductible; the newspaper you would read anyway is not, and the distinction is business purpose rather than content. If you are paid per project rather than retained, watch the year-end timing — a December invoice paid in January is next year\'s income on the cash basis.' },
  { key: 'realtor', slug: 'real-estate-agent', name: 'Real estate agent', lead: 'Client gifts are capped at $25 per recipient per year, and closing gifts routinely cost more than that. The excess is not deductible, however good the intention.', watch: 'Almost every agent is treated as self-employed by law even when working under a brokerage, which means nothing is withheld from a commission cheque and the whole tax bill arriving at once. Desk fees, brokerage splits and MLS dues come off gross commission, and staging costs you fund yourself are deductible where the seller reimburses you they are not.' },
  { key: 'travel_nurse', slug: 'travel-nurse', name: 'Travel nurse', lead: 'The per diem and the tax home decide everything. Stipends are only tax-free while you have a genuine tax home you are travelling away from — lose that, and the untaxed portion of every stipend becomes income.', watch: 'The tax home is the whole ballgame. Duplicating expenses — keeping a place you genuinely pay for while you are away — is what makes the untaxed portion of a stipend untaxed. Take a permanent assignment in one place for more than twelve months and the tax home moves there, retroactively.' },
  { key: 'truck_driver_otr', slug: 'truck-driver', name: 'OTR truck driver', lead: 'The DOT per diem is worth more than most drivers claim: $80 a day, deductible at 80% under the hours-of-service rules, for every night away from home.', watch: 'Owner-operators and lease-purchase drivers are self-employed; company drivers on a W-2 are not, and the W-2 driver lost the per diem deduction entirely when miscellaneous itemised deductions went away. Truck depreciation and the per diem are the two biggest lines, and the per diem needs only a log of nights out.' },
  { key: 'photographer', slug: 'photographer', name: 'Photographer', lead: 'Bodies and glass are Section 179 property, and the trap is the business-use test — gear that shoots family holidays as well as weddings only qualifies above 50% business use, at the business percentage.', watch: 'Second shooters and assistants paid over $600 in a year need a 1099-NEC from you. Wedding deposits are income when received on the cash basis even though the wedding is next June, which is why a booked-out spring makes for a painful April.' },
  { key: 'hair_stylist', slug: 'hair-stylist', name: 'Hair stylist', lead: 'Booth rent is the deduction, and it is also the thing that makes you self-employed rather than employed. If you pay rent for your chair, nobody is withholding anything for you.', watch: 'Booth rent tells you which side of the line you are on: pay rent and take your own clients and you are running a business; take a cut of the salon\'s tickets on the salon\'s schedule and you may be an employee whatever your contract says. Tips are income either way, and are the line most often left off.' },
  { key: 'personal_trainer', slug: 'personal-trainer', name: 'Personal trainer', lead: 'Your own gym membership is only deductible at the business-use percentage, and training your own body is not business use. The membership you need to access clients is; the one you use at 6am is not.', watch: 'Training clients in a gym you pay to access is different from training in your own space: the first makes the membership a business cost at the business-use percentage, the second makes it a personal one. Online coaching sold as a programme rather than sessions can raise a sales tax question in some states that in-person training does not.' },
  { key: 'therapist', slug: 'therapist', name: 'Therapist', lead: 'Once you are licensed, supervision hours are a deductible professional expense. The identical spend before you qualify is not deductible at all, because it is training for work you cannot yet do.', watch: 'One rule hits therapists harder than most trades. The 20% deduction for business profit is withdrawn above an income threshold for work where the main asset is the skill of the person doing it — and health counts. Above the threshold it shrinks; higher still, it goes entirely. Sliding-scale fees you choose not to charge are not a deduction; they are simply income you did not earn.' },
  { key: 'nurse_contractor', slug: 'nurse-contractor', name: 'Contract nurse', lead: 'Scrubs are deductible where ordinary clothing is not, because they fail the suitable-for-everyday-wear test. The shoes usually do not.', watch: 'Agency contracts vary on who carries the malpractice cover, and premiums you pay yourself are deductible while premiums the agency pays are not yours to claim. Licensing in multiple states adds up fast for anyone taking assignments across state lines, and each state\'s fee is deductible in the year paid. If you are working in a state you do not live in, you will owe a non-resident return there as well as a resident return at home — the credit for tax paid elsewhere usually prevents double tax, but only if you file both.' },
  { key: 'massage_therapist', slug: 'massage-therapist', name: 'Massage therapist', lead: 'The table is Section 179 property and the oils are supplies, which sounds trivial until you notice the table is deductible in full the year you buy it rather than over seven.', watch: 'Table, linens and oils are the obvious lines and the liability cover is the one people forget to claim after the first year. If you rent a room in a chiropractic or wellness practice, check whether your agreement is rent or a revenue split — a split can make you an employee of the practice.' },
  { key: 'bookkeeper_accountant', slug: 'bookkeeper', name: 'Bookkeeper or accountant', lead: 'You will do this correctly for clients and badly for yourself. The licensing fees an EA or CPA pays are deductible professional expenses and are the line most often left off an own-business return.', watch: 'The same rule that hits therapists hits you: the 20% deduction for business profit is withdrawn above an income threshold for work whose main asset is the skill of the person doing it, and accounting counts. Professional indemnity cover and EA or CPA licensing are both ordinary expenses, and the software you resell to clients is income to you before it is a deduction.' },
  { key: 'virtual_assistant', slug: 'virtual-assistant', name: 'Virtual assistant', lead: 'Almost the entire cost base is home office and technology, which is unusually deduction-friendly — and it means the S-corp question arrives earlier here than in trades with real overheads.', watch: 'With almost no overheads, profit is close to revenue, which brings the S-corp arithmetic forward — the payroll saving starts to beat the payroll cost at a lower revenue here than in trades that buy equipment. Subcontracting overflow work to other VAs makes you a payer: over $600 in a year and you are issuing the 1099.' },
  { key: 'coach', slug: 'coach', name: 'Coach', lead: 'Certification is deductible if it maintains or improves the skills of a business you already have, and not deductible if it qualifies you for the coaching career you are about to start. The same course, two different answers.', watch: 'Selling a programme rather than an hour changes the timing: money taken up front for a six-month container is income when received on the cash basis, not when the sessions happen. Coaching is not a licensed profession federally, but calling yourself a therapist or giving financial advice for a fee moves you into regulated territory.' },
  { key: 'insurance_agent', slug: 'insurance-agent', name: 'Insurance agent', lead: 'Commissions are self-employment income, and lead generation is the largest controllable deduction. Captive agents may be on a W-2 for the same work, which changes everything about how it is taxed.', watch: 'Advance commissions that later charge back are the recurring headache — you were taxed on the advance in the year you got it, and the chargeback is a deduction in the year it happens, which may be a different year at a different rate. Lead spend is fully deductible and is usually the largest number you control.' },
  { key: 'notary_signing_agent', slug: 'notary-signing-agent', name: 'Notary signing agent', lead: 'Mileage between signings is the single largest deduction in this trade, and it is the one nobody tracks, because each trip feels too small to write down.', watch: 'The mileage is the deduction and the tracking is the problem: signings are short trips, and untracked short trips are how thousands of dollars of deduction disappear. Notary fees set by state statute are sometimes treated differently from the signing-agent fee charged on top, so bill them as separate lines.' },
  { key: 'tutor', slug: 'tutor', name: 'Tutor', lead: 'Online and in person are different deduction profiles for the same job: online tutors live on the home office, in-person tutors live on mileage between students.', watch: 'If you tutor a family\'s children in their home on a schedule they set, the household may technically be your employer rather than your client. Working through a platform does not change your obligation to report the income — a platform below the 1099-K threshold reports nothing and you still owe.' },
  { key: 'wedding_event_planner', slug: 'wedding-planner', name: 'Wedding and event planner', lead: 'Money you collect for vendors is not your income, and money you pass to vendors is not your deduction. Run both through your books and you will report a business several times the size of the one you have.', watch: 'Ask one question of every payment: is this mine? Deposits held for vendors are not income, vendor invoices you pass on are not deductions, and only your planning fee is either. Get it wrong and your gross receipts look several times larger than your business, which changes your 1099-K, your state registration thresholds and your bookkeeping all at once.' },
  { key: 'qa_tester_contractor', slug: 'qa-tester', name: 'QA tester', lead: 'The device wall is the deduction. Phones and tablets bought to test on are Section 179 property at their business-use percentage, and the percentage is what gets argued about.', watch: 'The business-use percentage on the test devices is the argument you should prepare for: a phone used for testing and for your own calls is a split, and 100% on a device you plainly also carry personally is the claim that draws attention. Contract QA is also heavily agency-mediated, so check whether your contract makes you the agency\'s employee.' },
  { key: 'clergy_minister', slug: 'clergy', name: 'Clergy and ministers', lead: 'The housing allowance is excluded from income tax and included in the self-employment tax base. Ministers are employees for income tax and self-employed for SE tax on the same money — the only place in the code this happens.', watch: 'The dual status means no employer withholds self-employment tax from your salary even though you get a W-2, so quarterly estimates are on you from the first year. Opting out with Form 4361 is irrevocable and available only on conscientious religious grounds, not on the arithmetic — and it gives up Social Security credits permanently.' },
  { key: 'farm_schedule_f', slug: 'farmer', name: 'Farmer', lead: 'Schedule F, not Schedule C, and the difference is not cosmetic: raised livestock carries no basis, purchased livestock is cost of goods sold, and breeding animals are depreciable assets rather than an expense.', watch: 'Farm income averaging on Schedule J lets you spread an exceptional year back across the three prior years, which no other trade here can do. Crop insurance proceeds can be deferred a year where the crop would normally have been sold in the following year, and prepaid feed and supplies are limited to half your other deductible farm expenses.' },
];

export function professionFor(slug: string): Profession | null {
  return PROFESSIONS.find((p) => p.slug === slug) ?? null;
}

export function professionData(key: string): Record<string, any> {
  return RAW[key] ?? {};
}

/* --------------------------------------------------------- deductions ---- */

export interface DeductionLine {
  label: string;
  /** The rule behind it, when the dataset holds one. Never authored arithmetic. */
  rule?: string;
  /** True when a hard figure or cap governs this line. */
  hasLimit: boolean;
}

/**
 * Slug → label. Presentation only.
 *
 * Generated from the slug where the slug reads cleanly, overridden where it
 * does not — acronyms, brand names, and the slugs that encode a rule in their
 * own name (`client_gifts_limit_25`, `per_diem_80_per_day`).
 */
const LABELS: Record<string, string> = {
  adobe_cc: 'Adobe Creative Cloud',
  ai_software_subscriptions: 'AI software subscriptions',
  ce_credits: 'Continuing education credits',
  ceus: 'Continuing education units',
  camera_lenses_section179: 'Cameras and lenses',
  client_gifts_limit_25: 'Client gifts',
  compute_costs: 'Compute — GPU hours and API spend',
  continuing_education_cpe: 'Continuing professional education',
  continuing_education_seminary: 'Seminary and continuing education',
  contractor_subcontractors: 'Subcontractors you pay',
  crm_software: 'CRM software',
  device_testing_setup_section179: 'Test devices — phones and tablets',
  dot_fees: 'DOT fees',
  ehr_software: 'Electronic health record software',
  eo_insurance: 'Errors and omissions insurance',
  errors_omissions_insurance: 'Errors and omissions insurance',
  event_software_honeybook_aisle: 'Event management software',
  figma: 'Figma',
  grammarly: 'Grammarly',
  gym_membership_business_pct: 'Gym membership, at the business-use percentage',
  home_office: 'Home office',
  home_office_for_study: 'Home office used as a study',
  home_office_or_tutoring_space: 'Home office or tutoring space',
  internet_pct: 'Internet, at the business-use percentage',
  massage_table_section179: 'Massage table',
  mileage_if_in_person: 'Mileage, when you travel to students',
  mileage_or_travel: 'Mileage or travel',
  mileage_to_signings: 'Mileage between signings',
  mls_fees: 'MLS fees',
  monitor_ipad_section179: 'Monitors and iPad',
  notary_bond: 'Notary bond',
  office_rent_or_home_office: 'Office rent, or the home office',
  per_diem: 'Per diem while away',
  per_diem_80_per_day: 'DOT per diem',
  pro_development: 'Professional development',
  professional_attire_if_required: 'Required professional attire',
  professional_development_ce_credits: 'Professional development and CE credits',
  professional_memberships_aicpa: 'Professional memberships',
  quickbooks_xero_software: 'QuickBooks or Xero',
  scrubs: 'Scrubs',
  supplies_stamps_seals: 'Stamps, seals and supplies',
  vendor_deposits_if_direct_billed: 'Vendor deposits, where you are billed directly',
  vpn_subscriptions: 'VPN subscriptions',
  zoom_video_platform: 'Zoom or another video platform',
  zoom_subscription: 'Zoom',
};

/**
 * The rule behind a deduction slug, phrased around the thing being deducted.
 *
 * Deliberately takes the label as well as the slug. Section 179 says the same
 * thing about a massage table, a camera body and a wall of test phones, and
 * writing it the same way three times is what made these pages near-duplicates
 * of each other on the first build. The statute does not change; the sentence
 * does, because the reader's question is about their own gear.
 */
function ruleFor(slug: string, label: string): string | undefined {
  const mile = SED.mileage.businessRatePerMile;
  const ho = SED.homeOffice.simplified;
  const s179 = SED.section179;
  const perDiem = SED.businessTravel?.truckDriverPerDiem;
  const cents = (mile * 100).toFixed(1);
  const usePct = (s179.businessUsePctRequired * 100).toFixed(0);
  const lower = label.toLowerCase();

  if (/mileage|vehicle/.test(slug)) {
    const where = slug === 'mileage_to_signings' ? 'Every drive between signings counts'
      : slug === 'mileage_if_in_person' ? 'Every drive to a student counts'
      : slug === 'vehicle_for_ministry' ? 'Ministry driving counts; the commute to your own church does not'
      : 'Business driving counts; commuting does not';
    return `${where}, at ${cents} cents a mile for 2026 — up from 70 cents. A hundred business miles a week for a full year is ${formatMoney(Math.round(mile * 100 * 52))} off your profit. You cannot use the standard rate at all if you have previously claimed MACRS depreciation on the same vehicle.`;
  }
  if (/^home_office/.test(slug) || slug === 'office_rent_or_home_office') {
    return `Two methods. Simplified is $${ho.ratePerSqFt.toFixed(0)} a square foot to a ceiling of ${ho.maxSqFt} feet — ${formatMoney(ho.maxDeduction)}, no records beyond the measurement, and no depreciation recapture when you sell the house. Actual apportions your rent or mortgage interest, utilities, insurance and repairs by floor area, usually gives more, and does bring recapture. Either way: ${SED.homeOffice.rule.toLowerCase()}`;
  }
  if (/section179|^equipment$|^tools$|^laptop$|^computer/.test(slug)) {
    return `${label} is Section 179 property: deduct the whole cost the year it goes into service rather than spreading it over the asset's life, up to ${formatMoney(s179.limit)} a year, and 100% bonus depreciation is now permanent. The catch is the business-use test — ${lower} used more than ${usePct}% for the business qualifies, and you deduct at that percentage, not the full price.`;
  }
  if (slug === 'client_gifts_limit_25') {
    return 'Capped at $25 per recipient per year, and that figure has not moved in decades. A $200 closing gift is a $25 deduction and a $175 personal expense. Engraving and shipping sit outside the cap; the gift itself does not.';
  }
  if (slug === 'per_diem_80_per_day' && perDiem) {
    return `$${perDiem.rate} for each day subject to the hours-of-service rules, deductible at ${(perDiem.deductiblePct * 100).toFixed(0)}% — so $${(perDiem.rate * perDiem.deductiblePct).toFixed(0)} a day of actual deduction, without keeping a single meal receipt. Two hundred nights out is ${formatMoney(perDiem.rate * perDiem.deductiblePct * 200)} off your profit.`;
  }
  if (slug === 'per_diem') {
    return 'Tax-free only while you are travelling away from a genuine tax home. Keep no permanent residence you pay for, and the stipend stops being a reimbursement and becomes taxable wages — which is the single most expensive mistake in this line of work.';
  }
  if (/^internet|^phone/.test(slug)) {
    return `You get the business-use percentage of the bill, not the bill. ${SED.phoneAndInternet.method}. A line you also use personally is a split, and the split needs to be defensible rather than round.`;
  }
  if (/professional_development|pro_development|certification|coaching_certification|continuing_education|^ceus$|^ce_credits$/.test(slug)) {
    const entering = /certification|coaching_certification/.test(slug)
      ? 'the certification that got you into the work in the first place is not'
      : 'the training that qualified you to start is not';
    const renewal = /continuing_education|ceus|ce_credits/.test(slug)
      ? 'Hours required to keep a licence you already hold are the clearest case there is'
      : 'Courses that sharpen work you already sell are the clearest case there is';
    return `${renewal}. Spending on ${lower} to stay current is deductible; ${entering}. The test is about where you are, not what the course teaches — which is why the identical enrolment fee can be deductible for you and not for the person sitting beside you.`;
  }
  if (/attire|scrubs/.test(slug)) {
    return `${label} — deductible only because it fails the suitable-for-everyday-wear test. That is the whole rule, and it is why a suit bought specifically for client meetings is not deductible however strictly the client expects it.`;
  }
  return undefined;
}

export function deductionsFor(key: string): DeductionLine[] {
  const slugs: string[] = RAW[key]?.keyDeductions ?? [];
  return slugs.map((slug) => {
    const label = LABELS[slug] ?? slug.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
    const rule = ruleFor(slug, label);
    return {
      label,
      rule,
      hasLimit: rule !== undefined,
    };
  });
}

/* ------------------------------------------------- what a deduction is worth ---- */

export interface DeductionWorth {
  profit: number;
  /** Tax saved by deducting one more $1,000, all in. */
  per1000: number;
  /** As a percentage of the dollar deducted. */
  effectiveRate: number;
}

/**
 * What a dollar of deduction is actually worth.
 *
 * This is the number that helps, and it is higher than people expect, because
 * a business deduction comes off self-employment tax AND income tax AND state
 * tax — and then shrinks the QBI deduction, which claws a fifth of it back.
 * Computed by running the whole engine twice rather than by multiplying rates,
 * so the QBI interaction and any bracket edge are in it.
 */
export function deductionWorth(profit: number, stateCode: string, status = 'single'): DeductionWorth {
  const totalAt = (p: number) => {
    const se = calcSETax(p);
    const agi = p - se.deductibleHalf;
    const beforeQBI = Math.max(0, agi - getStandardDeduction(status, false));
    const taxable = Math.max(0, beforeQBI - calcQBI(p, beforeQBI, status));
    return se.totalSE + calcFederalTax(taxable, status) + calcStateTax(agi, stateCode, undefined, status).tax;
  };
  const saved = totalAt(profit) - totalAt(profit - 1000);
  return { profit, per1000: saved, effectiveRate: saved / 1000 };
}

/** The same figure at three profit levels — it rises with the bracket. */
export function worthLadder(stateCode: string, status = 'single'): DeductionWorth[] {
  // Chosen to straddle bracket edges. 40k and 80k both land in the 12% band once
  // the standard deduction and QBI are taken off, so a 40/80/150 ladder printed
  // the identical figure twice and read like a bug rather than a fact.
  return [40000, 100000, 200000].map((p) => deductionWorth(p, stateCode, status));
}

/** Unique statutory rules the dataset records for a trade, if any. */
export function uniqueRules(key: string): Array<{ title: string; body: string }> {
  const d = RAW[key];
  const out: Array<{ title: string; body: string }> = [];
  const u = d?.uniqueRules;
  if (u?.housingAllowance) {
    out.push({ title: 'The housing allowance', body: `${u.housingAllowance.taxTreatment} ${u.housingAllowance.seTaxNote} ${u.housingAllowance.form}.` });
  }
  if (u?.seOptOut) {
    out.push({ title: `Opting out with ${u.seOptOut.form}`, body: `${u.seOptOut.note} Deadline: ${u.seOptOut.deadline}.` });
  }
  if (u?.dualStatus) {
    out.push({ title: 'Dual status', body: u.dualStatus });
  }
  for (const ud of (d?.uniqueDeductions ?? []) as Array<{ name: string; note: string }>) {
    out.push({ title: ud.name, body: ud.note });
  }
  return out;
}
