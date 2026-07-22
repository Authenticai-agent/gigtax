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
  { key: 'qa_tester_contractor', slug: 'qa-tester', name: 'QA tester', lead: 'The device wall is the deduction. Phones and tablets bought to test on are Section 179 property at their business-use percentage, and the percentage is what gets argued about.', watch: 'The business-use percentage on the test devices is the argument you should prepare for: a phone used for testing and for your own calls is a split, and 100% on a device you plainly also carry personally is the claim that draws attention. Contract QA is also heavily agency-mediated, so check whether your contract makes you the agency\'s employee. Most contract QA is booked through an agency, and the agency decides more than the rate: some engage you as a contractor and some as their own employee for the same work, and only the first lets you deduct any of this. Check which you are before assuming a home office is available to you. Test devices bought and then kept for personal use after the contract ends should have the business-use percentage revisited rather than left at the original figure.' },
  { key: 'clergy_minister', slug: 'clergy', name: 'Clergy and ministers', lead: 'The housing allowance is excluded from income tax and included in the self-employment tax base. Ministers are employees for income tax and self-employed for SE tax on the same money — the only place in the code this happens.', watch: 'The dual status means no employer withholds self-employment tax from your salary even though you get a W-2, so quarterly estimates are on you from the first year. Opting out with Form 4361 is irrevocable and available only on conscientious religious grounds, not on the arithmetic — and it gives up Social Security credits permanently.' },
  { key: 'farm_schedule_f', slug: 'farmer', name: 'Farmer', lead: 'Schedule F, not Schedule C, and the difference is not cosmetic: raised livestock carries no basis, purchased livestock is cost of goods sold, and breeding animals are depreciable assets rather than an expense.', watch: 'Farm income averaging on Schedule J lets you spread an exceptional year back across the three prior years, which no other trade here can do. Crop insurance proceeds can be deferred a year where the crop would normally have been sold in the following year, and prepaid feed and supplies are limited to half your other deductible farm expenses.' },

  /* Building, mechanical, teaching and personal-service trades. These are not in
     the legacy dataset — see overrides/professions-trades.json for the boundary. */
  { key: 'general_contractor', slug: 'general-contractor', name: 'General contractor', lead: 'Subcontractors decide this return. Pay anyone $600 or more in a year and you have to issue them a 1099-NEC, and treating someone as a subcontractor when the law says employee is the most expensive mistake available in this trade.', watch: 'Materials you buy and bill on are income and a deduction both — book only one and your return is wrong in a way that is obvious from the outside. Retainage held back by a customer is not yours until released, so on the cash basis it is not income until you actually receive it.' },
  { key: 'electrician', slug: 'electrician', name: 'Electrician', lead: 'Hand tools and testers come off in the year you buy them. A van fit-out does not — that is an improvement to the vehicle and is written down over years, which surprises people who bought both in the same week.', watch: 'Your state licence and the continuing education hours that renew it are both deductible, because they maintain a licence you already hold. The apprenticeship that got you the licence in the first place was not, for the same reason in reverse. Service work and new construction are different businesses for tax purposes even when the same van does both: new construction is usually contracted through a builder who pays on 30 to 60 day terms, so on the cash basis a job finished in December can be next year\'s income. Panel upgrades and EV charger installations often attract customer rebates, and a rebate paid to the customer is not your income even when it passes through your invoice.' },
  { key: 'plumber', slug: 'plumber', name: 'Plumber', lead: 'Emergency call-outs make mileage the biggest single deduction in this trade, and the least well recorded. A drive at 2am is worth exactly the same per mile as one at 2pm, and neither counts if it is not written down.', watch: 'Drain cameras, jetters and press tools are Section 179 property — the whole cost comes off in the year the tool goes into service rather than being spread across its life. Parts bought for a job are deductible when used; a van full of stock at 31 December is inventory, not an expense. Water damage callouts put you in the insurance chain, and money an insurer pays you directly is your income while money it pays the homeowner is not — the difference decides whether it belongs on your return at all. Backflow certification and medical gas endorsements are separate qualifications with separate renewal fees, and each renewal is deductible.' },
  { key: 'hvac_technician', slug: 'hvac-technician', name: 'HVAC technician', lead: 'EPA Section 608 certification and the state licence behind it are deductible professional costs, as is every renewal. They maintain a qualification you already have, which is the test that matters.', watch: 'Refrigerant and parts are deductible when they go into a job, not when they go into the van. Diagnostic equipment and recovery machines are Section 179 property and can be written off in full the year you start using them.' },
  { key: 'landscaper', slug: 'landscaper', name: 'Landscaper', lead: 'Mowers, trimmers and trailers are Section 179 property, so a season\'s equipment buying can come off in a single year rather than being spread across several.', watch: 'Seasonal crews are usually employees, not contractors. Paying weekly, setting the schedule and supplying the equipment all point one way, and the penalty for calling them contractors anyway is back payroll tax with interest. Fuel for equipment is an ordinary supply and is separate from vehicle mileage.' },
  { key: 'cleaner', slug: 'cleaner', name: 'Cleaner', lead: 'Mileage between client properties counts. The first drive of the day from home to your first job does not — that is commuting, and it stays commuting however early it is and however far you go.', watch: 'Bonding and liability cover are what clients ask to see before they hire you, and both are deductible. Supplies are straightforward; equipment above a few hundred dollars is worth treating as Section 179 property so it comes off in one year.' },
  { key: 'handyman', slug: 'handyman', name: 'Handyman', lead: 'Most handyman work sits below the state licensing threshold, but the threshold is set by each state and usually by the value of the individual job. Go over it without a licence and the work can be uninsured and the contract unenforceable.', watch: 'Materials billed to the customer are income and a deduction both. Tools are deductible in the year you buy them, and the mileage between jobs is worth logging — a scattered day of small jobs adds up faster than a single long drive.' },
  { key: 'painter', slug: 'painter', name: 'Painter', lead: 'Sprayers, scaffolding and lifts are usually cheaper to hire than to own, and hire costs come off in full in the year you pay them with no depreciation schedule to keep.', watch: 'Paint and materials bought for a specific job are deductible when used. Interior work is year-round and exterior work is not, so painters carry an uneven income across the year that makes quarterly estimates awkward — base them on last year\u2019s bill rather than a forecast and the seasonality stops mattering. Lead-safe certification for pre-1978 properties is a federal requirement on much residential repainting, and both the certification and its renewal are deductible.' },
  { key: 'roofer', slug: 'roofer', name: 'Roofer', lead: 'Workers\' compensation is the largest insurance cost in roofing by a wide margin — the rates are the highest of any building trade because the injury rates are. It is fully deductible, and it is not optional once anyone works for you.', watch: 'Fall-protection equipment is both a legal requirement and an ordinary business expense, so there is no tension between the two. Storm work is the tax problem peculiar to roofing: a hail season can double a year\u2019s income and push you into brackets a normal year never reaches, and insurance proceeds paid directly to a homeowner are their money rather than yours. Tear-off dumpsters and crane hire are deductible in full in the year of hire.' },
  { key: 'welder', slug: 'welder', name: 'Welder', lead: 'Certifications expire and every renewal is deductible, because it maintains a qualification you already hold rather than getting you a new one.', watch: 'Gas, rod and consumables are ordinary supplies deductible as you use them. The machine is Section 179 property and comes off in full the year it goes into service. If you weld on site, the mileage to each job is deductible and the drive from home to a regular shop is not. Rig welders are the specific case worth flagging: if you own the truck and the machine and hire both to a contractor with your labour, the rig rental portion and the labour portion can be treated differently, and getting that split documented before the job rather than after is what makes it hold up. Certification tests are usually paid for by you and are deductible, including the ones you fail.' },
  { key: 'auto_mechanic', slug: 'auto-mechanic', name: 'Auto mechanic', lead: 'Tool debt defines this trade. Tools bought on a truck account are deductible when you buy them, not when you finish paying for them — and the interest on the account is deductible separately, on top.', watch: 'Shop rent, waste oil disposal and uniforms are all ordinary expenses. Certifications are deductible as maintaining existing skills once you are working in the trade, which is why the same course is treated differently for an apprentice.' },
  { key: 'teacher_tutor', slug: 'teacher', name: 'Teacher', lead: 'The $300 educator expense deduction is for employed teachers in a school, and it is a ceiling. If you teach for yourself — private tuition, online courses, music lessons — you are not limited to $300 at all. You deduct what you actually spent as a business expense, which is nearly always more.', watch: 'Materials, a laptop, the platform subscriptions and the room you teach from are all ordinary business expenses. If you teach in person, the mileage between students is deductible; if you teach online, the home office usually becomes the largest line on the return.' },
  { key: 'musician', slug: 'musician', name: 'Musician', lead: 'Instruments are Section 179 property, so a professional instrument comes off in the year you start using it. If you also play it at home for pleasure, you deduct at the business-use percentage rather than in full.', watch: 'Touring costs are business travel and deductible, but meals within them are only half deductible. Union dues and professional memberships are deductible; so is the cost of recording and releasing work, which many players treat as a hobby cost and never claim.' },
  { key: 'translator', slug: 'translator', name: 'Translator', lead: 'Translation memory and terminology software are ordinary subscriptions, deductible in the year you pay for them, and they are usually the largest recurring cost in the work.', watch: 'Certification through a professional body is deductible where you are already working in the field, because it improves an existing skill. Taken before you start translating professionally, the same certification is qualifying you for new work and is not deductible. Most translation clients are abroad, which brings two things a domestic freelancer never meets. Payment platform and currency conversion fees are ordinary deductible costs and can quietly reach several percent of turnover. And foreign clients do not issue you a 1099 of any kind, so nothing arrives to remind you of the income — you still owe tax on all of it, and the absence of paperwork is not the absence of an obligation.' },
  { key: 'videographer', slug: 'videographer', name: 'Videographer', lead: 'Cameras, lenses, drones and lighting are Section 179 property at the business-use percentage — and the percentage is the part that gets argued about, because the same camera films weddings and family holidays.', watch: 'Hiring gear for a single shoot sidesteps that argument completely: hire cost is deductible in full with no business-use split and nothing to depreciate. Editing software, storage and colour tools are ordinary subscriptions.' },
  { key: 'dog_groomer', slug: 'dog-groomer', name: 'Dog groomer', lead: 'A mobile groomer has two different tax treatments inside one vehicle: the van conversion is an improvement to the vehicle and is depreciated, while the grooming equipment inside it is Section 179 property in its own right.', watch: 'Shampoos and consumables are supplies. Liability cover is what most premises and clients require and is deductible. Certification is deductible where it maintains skills you already use professionally. Retail sales change the shape of the return. Selling shampoo, brushes or treats alongside the grooming makes part of your income product sales with cost of goods sold against it, and in most states it also creates a sales tax obligation that the grooming service itself does not. Boarding or daycare added on top brings its own insurance requirement.' },
  { key: 'caterer', slug: 'caterer', name: 'Caterer', lead: 'Food bought for a job is cost of goods sold rather than a general expense, which changes where it appears on your return even though it still reduces your profit.', watch: 'The 50% limit on business meals does not touch it. That limit is about meals you eat while working, not food you buy to sell — a distinction worth being clear about, because applying the wrong one halves a very large number. Permits, food-handling certification and equipment hire are all ordinary expenses.' },

  /* Practices, agencies, trades and operators added after the first two passes.
     Like the trades above these are authored, not ported — see the overlay. Each
     leads with what is genuinely different about its tax position rather than
     with a generic Schedule C opening. */
  { key: 'physician_practice', slug: 'physician', name: 'Physician in private practice', lead: 'The 20% deduction for business profit does not survive at a consultant\'s income. Medicine is one of the trades where it phases out above a threshold and then disappears — which is why practice owners talk about entity structure far more than other business owners do.', watch: 'Medical equipment is Section 179 property and a practice fit-out can be written off far faster than most owners expect, including a cost segregation study on a building you own. Malpractice cover is deductible in the year you pay it, and a tail policy bought when you leave a practice is deductible too. Staff are employees rather than contractors in almost every case — a nurse working your hours in your rooms with your equipment is not a contractor whatever the agreement says.' },
  { key: 'dentist', slug: 'dentist', name: 'Dentist or orthodontist', lead: 'Dentistry is the most equipment-heavy of the professional practices. A chair, a cone beam scanner and a practice fit-out are Section 179 property, and expensing them in one year rather than over seven changes the tax on a good year completely.', watch: 'Lab fees are cost of goods rather than an overhead, which matters for how the return reads. Dentistry is also a specified service trade, so the 20% business profit deduction is withdrawn above an income threshold — the equipment deductions keep working at every income, the profit deduction does not.' },
  { key: 'veterinarian', slug: 'veterinarian', name: 'Veterinarian', lead: 'A veterinary practice is two businesses in one return. The consulting is a service; the drugs, food and products sold over the counter are goods, with inventory and cost of goods sold against them, and in most states they carry sales tax the consultation does not.', watch: 'Controlled drug storage, sharps and clinical waste disposal are ordinary deductible costs and are also regulatory requirements. Veterinary medicine counts as a health field for the 20% business profit deduction, so that deduction is withdrawn above an income threshold. Mobile and large-animal practice makes the vehicle a major line — and a truck fitted out for veterinary work is usually a business vehicle in full rather than a percentage.' },
  { key: 'chiropractor', slug: 'chiropractor', name: 'Chiropractor', lead: 'Chiropractic carries a marketing budget that other health practices do not, and it is fully deductible. Screenings, community events and advertising are ordinary business costs; the retail supplements sold alongside are goods, with inventory rules and usually sales tax.', watch: 'Tables, decompression equipment and imaging are Section 179 property. Chiropractic is a health field for the 20% business profit deduction, so it is withdrawn above an income threshold. Practice-management and billing software is an ordinary subscription, and the merchant fees on care plans paid monthly are deductible and easy to overlook.' },
  { key: 'aba_provider', slug: 'behavioral-health-practice', name: 'Behavioral health practice owner', lead: 'Payroll dominates this return. Behaviour technicians and analysts working your hours, to your treatment plans, under your supervision are employees — the classification question is not close, and treating them as contractors is the most expensive mistake available here.', watch: 'In-home and school-based sessions make mileage a major deduction, and it is the one least well tracked because each drive is short. Credentialing with each insurer costs money and takes months, and both the fees and the consultant who handles them are deductible. Behavioural health is a health field for the 20% business profit deduction, so it is withdrawn above an income threshold.' },
  { key: 'home_health_agency', slug: 'home-health-agency', name: 'Home health agency owner', lead: 'Caregivers are employees, and home care has its own overtime rules — live-in and companionship exemptions narrowed years ago, and most agencies now owe overtime they once did not. Payroll and the employer taxes on it are deductible in full; getting the classification wrong is not a deduction question, it is a back-pay one.', watch: 'Background checks, training hours and state licensing are all deductible. Caregiver mileage between clients is deductible to whoever bears it — reimburse it and the agency deducts it, do not and the caregiver may claim it themselves. Scheduling and electronic visit verification software are ordinary subscriptions and are usually mandatory for Medicaid billing.' },
  { key: 'staffing_agency', slug: 'staffing-agency', name: 'Staffing or recruiting agency owner', lead: 'A staffing agency deducts wages for people who never set foot in its own office. You are the employer of record, so payroll tax, unemployment insurance and workers\' compensation sit on your return — and workers\' compensation is rated on what the placed worker does, not on what you do, so placing roofers costs many times what placing bookkeepers does.', watch: 'Placement fees are income when earned, and a guarantee period that forces a refund creates a deduction in the year you repay rather than a correction to the original year. Applicant tracking software, job board spend and background checks are ordinary deductible costs, and recruiting is a specified service trade so the 20% business profit deduction is withdrawn above an income threshold.' },
  { key: 'attorney', slug: 'attorney', name: 'Attorney or law firm partner', lead: 'Money in the client trust account is not yours and never appears on your return until it is earned and transferred. Running trust funds through operating income is both a tax error and a bar complaint, and it is the single thing regulators look at first.', watch: 'Case costs advanced on a client\'s behalf are loans rather than deductions until the case resolves and they prove unrecoverable — a contingency practice can carry six figures of advanced costs that are not yet deductible at all. Law is a specified service trade, so the 20% business profit deduction is withdrawn above an income threshold. Bar dues, research subscriptions and continuing legal education are all deductible.' },
  { key: 'tax_preparer', slug: 'tax-preparer', name: 'Tax preparer or enrolled agent', lead: 'Your income arrives in a quarter and your costs run all year. That makes your own estimated payments the awkward case you spend the spring solving for other people — base them on last year\'s bill rather than a forecast and the seasonality stops mattering.', watch: 'PTIN renewal, e-file provider fees, continuing education hours and enrolled agent or CPA licensing are all deductible as maintaining a qualification you already hold. Professional indemnity cover is effectively mandatory and deductible. Tax preparation is a specified service trade, so the 20% business profit deduction is withdrawn above an income threshold.' },
  { key: 'financial_advisor', slug: 'financial-advisor', name: 'Financial advisor', lead: 'Compliance is a cost centre with no equivalent in most businesses. Registration, the annual audit, email and message archiving, and a compliance consultant are all deductible, and none of them are optional once you are advising for a fee.', watch: 'Custodial and platform fees you absorb rather than pass on are deductible; fees deducted from a client\'s account are never your income in the first place. Financial services is a specified service trade, so the 20% business profit deduction is withdrawn above an income threshold — and advisors are unusually likely to be above it.' },
  { key: 'medical_billing', slug: 'medical-billing', name: 'Medical billing service', lead: 'Handling protected health information for other practices makes you a business associate in your own right. Secure systems, signed agreements, encrypted storage and breach cover are legal requirements and ordinary deductible costs at the same time.', watch: 'Cyber liability cover is the deduction most billing services do not carry until a client asks for proof of it. Clearinghouse fees and practice management software are ordinary subscriptions. Payment on a percentage of collections means income moves with the client\'s revenue, so estimates based on last year\'s bill are safer than a forecast.' },
  { key: 'architect', slug: 'architect', name: 'Architect', lead: 'Architecture is written into the statute as an exception. The 20% deduction for business profit is withdrawn at higher incomes for law, accounting, medicine and consulting — and explicitly not for architecture. A successful architectural practice keeps a deduction an equally successful law firm loses.', watch: 'Professional liability cover is the dominant insurance cost and is deductible, including the tail cover that runs after a project completes. Design software licences are ordinary subscriptions. Travel to sites is business travel; the drive to your own studio is commuting.' },
  { key: 'engineer', slug: 'engineer', name: 'Engineering firm owner', lead: 'Engineering is the other statutory exception. Where medicine, law and accounting lose the 20% business profit deduction above an income threshold, engineering keeps it — a distinction worth real money and one that surprises engineers who have read general advice for professionals.', watch: 'Multi-state work creates filing obligations in every state you practise in, and professional registration in each is separately deductible. Testing and survey equipment is Section 179 property. Professional liability cover, including tail cover, is deductible in the year you pay it.' },
  { key: 'interior_designer', slug: 'interior-designer', name: 'Interior designer', lead: 'Buying furnishings and reselling them makes you a retailer with inventory, cost of goods sold and usually a sales tax obligation. Taking a commission on what the client buys directly makes you a service business with none of that. Most designers do both, and running them through one account is what makes the return unpickable later.', watch: 'Client deposits for goods not yet ordered are not income until earned. Samples, fabric books and showroom memberships are ordinary costs. Photography of finished projects is marketing and fully deductible — it is also the only asset most design practices have.' },
  { key: 'home_stager', slug: 'home-staging', name: 'Home staging business', lead: 'Your furniture is not stock you sell, it is equipment you hire out repeatedly — which makes it a depreciable asset rather than inventory, and Section 179 lets you write it off in the year you buy it rather than across its life.', watch: 'Warehouse rent is usually the second largest line and is deductible in full. Moving crews are employees more often than contractors. Staging on consignment, where you take a share of the sale price, is income when the property sells rather than when the work is done — which can put the income in a different year from the cost.' },
  { key: 'marketing_agency', slug: 'marketing-agency', name: 'Marketing agency owner', lead: 'Ad spend you place on a client\'s behalf runs through your books as income and as a deduction. It nets to nothing and it makes your gross receipts look like a business ten times the size — which changes your 1099-K, your state registration thresholds and every conversation with a lender. Bill it as a pass-through where you can.', watch: 'Freelancers and contractors are the flexible half of most agency cost bases, and anyone paid $600 or more in a year needs a 1099-NEC from you. Consulting is a specified service trade, so the 20% business profit deduction is withdrawn above an income threshold.' },
  { key: 'seo_consultant', slug: 'seo-consultant', name: 'SEO consultant', lead: 'The tool stack is the overhead. Rank trackers, crawlers, backlink databases and keyword platforms run to more each month than many consultants pay in rent, and every one of them is deductible in the year you pay for it.', watch: 'Retainers paid in advance are income when received on the cash basis, even where the work runs for six months. Content and link building bought from freelancers is deductible and triggers a 1099-NEC above $600 a year. Consulting is a specified service trade, so the 20% business profit deduction is withdrawn above an income threshold.' },
  { key: 'podcaster', slug: 'podcaster', name: 'Podcaster', lead: 'Sponsorship is usually paid up front for episodes that run over months. On the cash basis it is income when it arrives, not when the episode airs — which can put a whole season\'s revenue into one tax year and none into the next.', watch: 'Microphones, interfaces, treatment and cameras are Section 179 property. Editing, hosting and transcription are ordinary subscriptions. Affiliate revenue and listener support are both taxable income even where no form arrives, and platforms below the reporting threshold send nothing at all.' },
  { key: 'writer_author', slug: 'writer', name: 'Writer or author', lead: 'An advance is income the year it lands, not the year the book earns out — and it is normally self-employment income rather than passive royalty income, because writing the book is the trade you carry on. That surprises authors who expected the royalty treatment their contract talks about.', watch: 'Research travel is deductible where the trip is primarily for the book. Agent commission is deductible in full. Writers are exempt from the rule that would otherwise force you to capitalise production costs, so what you spend writing is deductible as you spend it rather than held until publication. Writing is a specified service trade, so the 20% business profit deduction is withdrawn above an income threshold.' },
  { key: 'actor_performer', slug: 'actor', name: 'Actor or performer', lead: 'Agent and manager commissions are deductible in full, and they are taken from gross — so the income on your 1099 is a figure you never actually received. Deduct the commission and the tax follows what you kept.', watch: 'Ongoing classes and coaching are deductible because they maintain skills you already sell. The training that got you started was not. Headshots, reels and submission fees are marketing. Wardrobe is only deductible where it is unsuitable for everyday wear, which almost never covers what you wear to an audition.' },
  { key: 'professional_speaker', slug: 'professional-speaker', name: 'Professional speaker', lead: 'Speaking across state lines creates filing obligations across state lines. Several states withhold tax from a performer or speaker fee before it reaches you, and you recover it only by filing there — which means a year of touring can mean a stack of non-resident returns.', watch: 'Travel to engagements is business travel and deductible in full, apart from meals at half. Showreels, photography and a website are marketing. Speaking is a specified service trade where the fee depends on your own reputation, so the 20% business profit deduction is withdrawn above an income threshold.' },
  { key: 'conference_organizer', slug: 'conference-organizer', name: 'Conference organiser', lead: 'Tickets sell months ahead and the costs land in a single week. On the cash basis the income and the event can fall in different tax years entirely, which turns a break-even conference into a taxable year followed by a loss-making one.', watch: 'Venue deposits are paid long before the event and are deductible when paid. Cancellation insurance is deductible and is what stops a cancelled event becoming a personal liability. Sponsorship sold is income; the sponsor\'s own costs passing through your account are not yours in either direction.' },
  { key: 'travel_agent', slug: 'travel-agent', name: 'Travel agent', lead: 'What a client pays for a trip is not your income. Only the commission is, and it usually arrives after travel rather than at booking — so a busy year can be a thin one for cash and the following January can be unexpectedly heavy.', watch: 'Familiarisation trips are deductible where the primary purpose is genuinely business, and the test is what you did rather than where you went. Host agency fees, booking platforms and errors and omissions cover are ordinary deductible costs. Client funds held before departure are not yours and should never sit in an operating account.' },
  { key: 'tour_operator', slug: 'tour-operator', name: 'Tour operator', lead: 'Unlike an agent, you carry the trip. That makes liability cover the defining cost of the business and it is deductible in full — as is the specialist rescue or evacuation cover most permits require.', watch: 'Deposits taken a season ahead are income when received on the cash basis even though the trip has not happened. Permits for public land, guide certification and first aid training are all deductible. Vehicles and equipment used for tours are Section 179 property at the business-use percentage.' },
  { key: 'restaurant_owner', slug: 'restaurant', name: 'Restaurant owner', lead: 'Tipped staff create a credit, not just a cost. You pay employer Social Security and Medicare on tips your staff report, and a federal credit gives most of that back — it is claimed on a separate form and it is the single most commonly missed item in the trade.', watch: 'Food is cost of goods sold rather than an overhead, and the 50% limit on business meals has nothing to do with it — that limit is about meals you eat, not food you sell. Kitchen equipment and a fit-out are Section 179 property, and a building you own can be cost segregated so parts of it depreciate far faster than 39 years. Staff meals provided on the premises are deductible in full rather than at half.' },
  { key: 'food_truck', slug: 'food-truck', name: 'Food truck owner', lead: 'The truck is a vehicle and a kitchen at once, and the two are deducted differently. Fuel and running costs follow vehicle rules; the build-out, the equipment and the fit inside follow Section 179. Mixing them is the most common error on a food truck return.', watch: 'Commissary rent is required by most health departments and is deductible in full. Permits are per-city and stack up fast for anyone working events across a region, and each is deductible where paid. Food is cost of goods sold. Event pitch fees are ordinary business costs.' },
  { key: 'hotel_owner', slug: 'hotel', name: 'Hotel or motel owner', lead: 'The building is the business and depreciation is the largest deduction on the return. A cost segregation study splits out the parts that are not really building — carpets, fittings, signage, car park surfacing — into much shorter lives, and 100% bonus depreciation is now permanent on the qualifying portion.', watch: 'Hospitality is not a specified service trade, so the 20% business profit deduction survives at incomes where a professional practice would lose it. Occupancy taxes you collect are never your income. Renovation is the line that needs care: a repair is deductible now, an improvement is capitalised, and the distinction is governed by rules that reward getting an opinion before the work rather than after.' },
  { key: 'str_host_business', slug: 'short-term-rental-business', name: 'Short-term rental operator', lead: 'The seven-day rule is the whole game. Where average guest stays are seven days or fewer, the property is not a rental activity under the passive loss rules at all — so if you materially participate, losses can offset your other income rather than being locked up until you sell. Longer average stays and the ordinary passive rules apply.', watch: 'Furnishing a unit is Section 179 and bonus depreciation territory, and a cost segregation study on the property itself accelerates a great deal more. Cleaning and turnover costs are ordinary and are the largest recurring line for most operators. Occupancy taxes collected from guests are never your income, whether the platform remits them or you do.' },
  { key: 'ecommerce_seller', slug: 'ecommerce-seller', name: 'E-commerce seller', lead: 'The form reports gross. Your 1099-K shows everything the platform processed before fees, refunds, shipping and the cost of the goods themselves — and reconciling that figure down to actual profit is most of the work on an e-commerce return. Report the gross and deduct the difference; do not report a net figure the form does not match.', watch: 'Inventory is not deductible when you buy it. It becomes cost of goods sold when it sells, which is why a profitable-feeling year with a warehouse full of stock produces a tax bill that makes no sense. Selling into other states creates sales tax obligations once you pass their thresholds, and those thresholds are about your sales rather than your presence.' },
  { key: 'import_export', slug: 'import-export', name: 'Import or export business', lead: 'Duty, freight and insurance to get goods to you are part of the cost of those goods, not separate overheads. That means they are not deductible when paid — they attach to the inventory and come off when it sells. A container that lands in December and sells in March is a next-year deduction.', watch: 'Customs brokers, compliance consultants and trade counsel are ordinary deductible costs. Currency conversion losses on trade payables are deductible; gains are income. Foreign travel primarily for business is deductible with the usual apportionment where the trip mixes purposes.' },
  { key: 'freight_broker', slug: 'freight-broker', name: 'Freight broker', lead: 'What you pay carriers passes through your books and it is most of what you bill. A brokerage turning over millions can be running on a margin of a few per cent, and the gross figure misleads lenders, tax authorities and sometimes the broker.', watch: 'The surety bond required for authority is an ordinary deductible cost, as is contingent cargo cover. Factoring fees, where you sell receivables to fund carrier payments, are deductible in full. Brokerage owns no trucks, so there is very little depreciation here and almost the entire return is operating costs.' },
  { key: 'courier_service', slug: 'courier-service', name: 'Courier or delivery service', lead: 'One van and you are a driver. Several vans and you are an employer — drivers on your routes, in your vehicles, to your schedule are employees in nearly every case, and payroll rather than mileage becomes the dominant deduction.', watch: 'Company vehicles use actual costs rather than the mileage rate, and are depreciated or expensed under Section 179. Commercial auto cover is far more expensive than personal cover and is deductible in full. Routing and proof-of-delivery software are ordinary subscriptions.' },
  { key: 'limo_service', slug: 'limo-service', name: 'Limo or car service operator', lead: 'Vehicle depreciation is the surprise here, and it is a pleasant one. The annual caps that limit what you can write off on an ordinary car do not apply to vehicles above a weight threshold or built to carry more than a set number of passengers — so a full-size van or a stretch is treated far more generously than a saloon.', watch: 'Chauffeurs on your schedule in your vehicles are employees. Commercial passenger insurance is the largest fixed cost in the business and is deductible in full, as are the operating authority and per-airport permits. Detailing and presentation costs are ordinary business expenses in a trade sold on presentation.' },
  { key: 'property_flipper', slug: 'property-flipper', name: 'Property flipper', lead: 'This is the misunderstanding that costs the most money in property. A flipper is a dealer, not an investor. The profit is ordinary income with self-employment tax on top — not a capital gain, not eligible for the lower long-term rates however long you held it, and not eligible for a like-kind exchange to defer it.', watch: 'Because the properties are stock rather than assets, you get no depreciation while you hold them, and renovation costs are not deductible as you spend them — they attach to the property and come off when it sells. A rehab running across a year end can produce a tax bill on a project that has not yet paid you anything.' },
  { key: 'car_dealership', slug: 'car-dealership', name: 'Independent car dealer', lead: 'Floor plan interest — the finance on the cars sitting on your lot — has a carve-out of its own from the cap on deducting business interest. That is a rule written for this trade and it is worth real money to any dealer carrying stock on credit.', watch: 'Vehicles are inventory, so nothing is deductible when you buy them and everything comes off as cost of goods sold when they sell. Reconditioning attaches to the car rather than being a period expense. Dealer licensing, bonds and lot insurance are ordinary deductible costs.' },
  { key: 'body_shop', slug: 'body-shop', name: 'Collision repair shop', lead: 'Insurers pay most of your invoices, and the money is yours when the work is done rather than when the claim is agreed. Supplements approved after the fact are income in the year they are paid, which is often a different year from the repair.', watch: 'Manufacturer certification programmes — the ones that put you on an approved list — require specific equipment and training, and both are deductible, the equipment under Section 179. Paint, consumables and materials are supplies. Waste paint, solvent and refrigerant disposal are regulated and deductible.' },
  { key: 'security_company', slug: 'security-company', name: 'Security company owner', lead: 'Guard payroll is effectively the whole cost base, and it is where the classification question bites: guards on your posts, in your uniform, to your post orders are employees. Armed contracts change the economics again — the insurance and the licensing both cost multiples of unarmed work, and both are deductible.', watch: 'Uniforms are deductible because they are unsuitable for everyday wear. State licensing for the company and for each individual guard is deductible, as is the training required to obtain and keep it. Patrol vehicles are business vehicles using actual costs.' },
  { key: 'private_investigator', slug: 'private-investigator', name: 'Private investigator', lead: 'Two costs here have no equivalent elsewhere: the paid databases that make the work possible, and a vehicle chosen to be unmemorable rather than pleasant. Both are ordinary deductible business expenses, and the databases are usually the larger of the two.', watch: 'Surveillance equipment — cameras, long lenses, recorders, trackers where lawful — is Section 179 property. Mileage on surveillance is deductible and is often very high; a log matters more here than in most trades because the pattern of driving looks nothing like ordinary business travel. State licensing and the insurance most licences require are deductible.' },
  { key: 'winery_brewery', slug: 'winery-brewery', name: 'Winery or brewery owner', lead: 'Federal excise tax is a separate obligation from income tax, owed on what you produce rather than what you earn, and it is payable whether or not the business is profitable. Smaller producers get a reduced rate on the first tranche of production, which is worth confirming rather than assuming.', watch: 'Tanks, fermenters, canning lines and cooperage are Section 179 property. Product in barrel or tank is inventory and is not deductible until sold, which is punishing for anything aged across years. A tasting room is a separate retail business inside the same company, usually with sales tax and its own licensing.' },
  { key: 'cannabis_business', slug: 'cannabis-business', name: 'Cannabis business owner', lead: 'One rule dominates everything here. Section 280E denies a deduction for any ordinary business expense to a trade that traffics in a controlled substance, and cannabis remains one federally regardless of state law. Rent, wages, marketing, utilities, insurance — none of it is deductible for federal income tax.', watch: 'What survives is cost of goods sold, because that reduces gross income rather than being a deduction from it. That single distinction is why cannabis businesses invest so heavily in how costs are allocated between production and everything else, and why the allocation is examined so often. The result is that federal tax is charged on a figure much larger than the profit the business actually made. Many states decouple from 280E and allow the deductions at state level — so your state return and your federal return can show very different profit. This is not a situation to handle without specialist advice.' },
  { key: 'mining_operator', slug: 'mining-operator', name: 'Mining or extraction operator', lead: 'Depletion is the deduction that exists nowhere else. You deduct for the resource being used up, and the percentage method is calculated on revenue rather than on what you paid — so over a mine\'s life the total deductions can exceed the original investment.', watch: 'Exploration and development costs have elections attached that decide whether you deduct now or capitalise, and the choice is worth modelling before you make it because it is not freely reversible. Reclamation obligations are deductible when the work is done rather than when the liability arises. Heavy equipment is Section 179 property subject to the annual cap.' },
  { key: 'print_shop', slug: 'print-shop', name: 'Printing or signage shop', lead: 'The equipment is the business and it is expensive: presses, wide-format printers, cutters and finishing gear are all Section 179 property, deductible in the year they go into service rather than across a decade.', watch: 'Paper, vinyl and substrate held at year end are inventory and are not deductible until used. Installation of signage on a customer\'s site can bring licensing and insurance requirements that in-shop printing does not. Colour management software and font licensing are ordinary subscriptions.' },
  { key: 'event_rental', slug: 'event-rental', name: 'Event rental company', lead: 'Everything you own goes out and comes back, which makes it depreciable equipment rather than inventory. Section 179 lets you deduct tents, tables, chairs, staging and lighting in the year you buy them rather than across their lives, and that is a very large deduction for a business built entirely on stock.', watch: 'Damage waivers charged to customers are income; the repairs they fund are deductible separately. Delivery crews are employees in nearly all cases. Warehouse or yard rent is the second largest fixed cost and is deductible in full.' },
  { key: 'mobile_mechanic', slug: 'mobile-mechanic', name: 'Mobile mechanic', lead: 'Your van is a workshop that drives, and the two halves are deducted differently: running costs follow vehicle rules, while the racking, the compressor and the equipment bolted inside are Section 179 property in their own right.', watch: 'Almost every mile is business, which makes the mileage rate straightforward and generous here — but a van used for a weekly shop is not 100% business and claiming it as such invites the question. Parts bought for a specific job are deductible when used; stock carried in the van at year end is inventory.' },
  { key: 'nursing_agency', slug: 'nursing-agency', name: 'Nursing agency owner', lead: 'You employ clinicians who work in other people\'s facilities, which puts payroll, workers\' compensation and professional liability cover on your return rather than the hospital\'s. Malpractice cover for a nursing panel is priced on what they do and is deductible in full.', watch: 'Credentialing each clinician with each facility costs money and time, and both the fees and the staff who do it are deductible. Travel contracts bring stipends and housing, and whether those are tax-free to the clinician turns on their tax home rather than on your paperwork — but getting the documentation right protects both of you.' },
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
  billing_service: 'Billing service',
  lab_fees: 'Laboratory fees',
  practice_software: 'Practice management software',
  medical_equipment: 'Medical equipment',
  drugs_and_supplies: 'Drugs and clinical supplies',
  credentialing_fees: 'Insurance credentialing',
  payroll_taxes: 'Your share of payroll taxes',
  scheduling_software: 'Scheduling software',
  training_costs: 'Staff training',
  ats_software: 'Applicant tracking software',
  recruitment_costs: 'Recruitment costs',
  bar_dues: 'Bar dues',
  filing_fees: 'Court filing fees',
  research_subscriptions: 'Research subscriptions',
  compliance_costs: 'Compliance costs',
  cyber_insurance: 'Cyber liability insurance',
  professional_liability_insurance: 'Professional liability insurance',
  cad_software: 'Design and CAD software',
  site_travel: 'Travel to sites',
  design_software: 'Design software',
  trade_show_travel: 'Trade show travel',
  furniture_inventory: 'Furniture held for staging',
  insurance: 'Insurance',
  advertising_spend_passthrough: 'Client advertising spend',
  hosting_fees: 'Hosting and distribution',
  recording_equipment: 'Recording equipment',
  agent_commission: 'Agent and manager commission',
  headshots: 'Headshots and reels',
  training_classes: 'Classes and coaching',
  wardrobe_if_required: 'Wardrobe, where unsuitable for everyday wear',
  venue_costs: 'Venue costs',
  host_agency_fees: 'Host agency fees',
  guides_and_staff: 'Guides and staff',
  rent: 'Rent',
  utilities: 'Utilities',
  commissary_rent: 'Commissary rent',
  furnishings: 'Furnishings',
  property_tax: 'Property tax',
  property_insurance: 'Property insurance',
  repairs_and_maintenance: 'Repairs and maintenance',
  supplies: 'Supplies',
  mortgage_interest: 'Mortgage interest',
  cleaning_and_turnover: 'Cleaning and turnover',
  platform_fees: 'Platform fees',
  inventory_cogs: 'Stock, as cost of goods sold',
  shipping_costs: 'Shipping',
  storage_warehousing: 'Storage and warehousing',
  packaging: 'Packaging',
  returns_and_refunds: 'Returns and refunds',
  customs_duties: 'Customs duties',
  freight_costs: 'Freight',
  warehousing: 'Warehousing',
  customs_broker_fees: 'Customs broker fees',
  currency_costs: 'Currency conversion costs',
  carrier_payments: 'Carrier payments',
  bond_costs: 'Surety bond',
  tms_software: 'Transport management software',
  factoring_fees: 'Factoring fees',
  driver_wages: 'Driver wages',
  routing_software: 'Routing software',
  detailing: 'Cleaning and detailing',
  booking_software: 'Booking software',
  purchase_cogs: 'Property purchase, as cost of goods sold',
  renovation_costs: 'Renovation costs',
  holding_costs: 'Holding costs',
  loan_interest: 'Loan interest',
  contractor_payments: 'Payments to contractors',
  floor_plan_interest: 'Floor plan interest',
  lot_rent: 'Lot rent',
  reconditioning: 'Reconditioning',
  advertising: 'Advertising',
  paint_and_consumables: 'Paint and consumables',
  guard_wages: 'Guard wages',
  surveillance_equipment: 'Surveillance equipment',
  database_subscriptions: 'Database subscriptions',
  excise_tax: 'Federal excise tax',
  tasting_room_costs: 'Tasting room costs',
  security_costs: 'Security costs',
  depletion: 'Depletion',
  reclamation_costs: 'Reclamation costs',
  exploration_costs: 'Exploration costs',
  staff_wages: 'Staff wages',
  subcontractors_1099: 'Subcontractors you pay',
  permits_and_licences: 'Permits and licences',
  materials_and_supplies: 'Materials and supplies',
  equipment_rental: 'Equipment you hire rather than buy',
  workers_comp: 'Workers’ compensation insurance',
  jobsite_travel: 'Travel between job sites',
  safety_gear: 'Safety equipment',
  epa_certification: 'EPA Section 608 certification',
  seasonal_labour: 'Seasonal crew wages',
  storage_yard_rent: 'Yard or storage rent',
  shop_rent: 'Shop rent',
  waste_disposal: 'Waste and disposal charges',
  instruments_section179: 'Instruments',
  union_dues: 'Union dues',
  reference_materials: 'Reference materials',
  food_and_ingredients: 'Food and ingredients',
  staff_wages: 'Staff wages',
  professional_memberships: 'Professional memberships',
  bonding: 'Bonding',
  trailer: 'Trailer',
  uniforms: 'Uniforms',
  fuel: 'Fuel',
  tools: 'Tools',
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
    return `Section 179 property. Deduct the whole cost in the year it goes into service rather than spreading it over the asset's life, up to ${formatMoney(s179.limit)} a year, and 100% bonus depreciation is now permanent. The catch is the business-use test: anything used more than ${usePct}% for the business qualifies, and you deduct at that percentage rather than the full price — so anything you also use at home comes off at the share that is genuinely work, not the whole invoice.`;
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

/**
 * A trade's own deduction lines.
 *
 * Farming is the one entry that carries its deductions as `uniqueDeductions`
 * rather than `keyDeductions`, because each comes with a rule of its own. Reading
 * only keyDeductions reported the farmer page as having none, while the page
 * below it listed nine.
 */
export function deductionsFor(key: string): DeductionLine[] {
  const raw = RAW[key] ?? {};
  if (!raw.keyDeductions && Array.isArray(raw.uniqueDeductions)) {
    return raw.uniqueDeductions.map((d: any) => ({
      label: d.name, rule: d.note || undefined, hasLimit: Boolean(d.note),
    }));
  }
  const slugs: string[] = raw.keyDeductions ?? [];
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
