/**
 * Roles for the salary-negotiation pSEO tree (add-on task 1).
 *
 * No salary figures live here — the file's honesty rule for task 1 is that the
 * tool links out to BLS OES and the user brings their own market number. What is
 * stored is genuinely role-specific negotiation content: where the leverage is,
 * and how comp is typically structured in that field. That per-role writing is
 * what differentiates the pages; the numbers come from the user, cited to BLS.
 */
export interface NegotiationRole {
  slug: string;
  name: string;
  /** BLS OES occupation this maps to, for the market-number look-up link. */
  blsGroup: string;
  /** What's actually negotiable in this field — distinct per role. */
  leverage: string;
  /** How comp is usually structured, so the ask targets the right lever. */
  compStructure: string;
}

export const NEGOTIATION_ROLES: NegotiationRole[] = [
  { slug: 'software-engineer', name: 'Software Engineer', blsGroup: 'Software Developers (15-1252)',
    leverage: 'Engineering offers are among the most negotiable roles there is — leveling is fuzzy, comp bands are wide, and a competing offer moves numbers fast. Push on level first: a bump from mid to senior is worth more than any base haggling within a level.',
    compStructure: 'Base + annual bonus + equity (RSUs or options). At larger companies equity is often the biggest and most negotiable lever; at startups, negotiate the option count and strike price, not just base.' },
  { slug: 'product-manager', name: 'Product Manager', blsGroup: 'Project Management Specialists (13-1082)',
    leverage: 'PM comp tracks level and scope more than years of experience — argue the scope of what you\'ll own. If the role spans multiple products or reports high, that\'s your case for the top of the band.',
    compStructure: 'Base + bonus + equity, similar to engineering. Sign-on bonuses are common and easy to grant when base is capped by band.' },
  { slug: 'data-scientist', name: 'Data Scientist', blsGroup: 'Data Scientists (15-2051)',
    leverage: 'Demand is high and the title covers a huge range — from analytics to ML research. Anchor to the harder end of the spectrum you can credibly claim, and let a competing offer do the heavy lifting.',
    compStructure: 'Base + bonus + equity. ML/research roles command premiums; if your work is closer to that end, name it explicitly in the ask.' },
  { slug: 'ux-designer', name: 'UX Designer', blsGroup: 'Web and Digital Interface Designers (15-1255)',
    leverage: 'Portfolio and demonstrated impact are your leverage — a designer who can point to shipped work that moved a metric negotiates from strength. Title inflation is real in design, so pin down the level.',
    compStructure: 'Base + bonus, sometimes equity at product companies. Base is the main lever; sign-on bonuses fill gaps when the band is tight.' },
  { slug: 'registered-nurse', name: 'Registered Nurse', blsGroup: 'Registered Nurses (29-1141)',
    leverage: 'Nursing pay is often scale-based, so straight base negotiation is harder — but shift differentials, sign-on bonuses, and relocation are very negotiable, especially where staffing is tight. Certifications and specialty experience justify a higher step.',
    compStructure: 'Base pay scale + shift/weekend differentials + sign-on and retention bonuses. Push the bonuses and differentials, not just the base step.' },
  { slug: 'accountant', name: 'Accountant', blsGroup: 'Accountants and Auditors (13-2011)',
    leverage: 'A CPA, busy-season availability, or industry-specific experience are concrete justifications for the top of the range. Public-accounting offers flex more than corporate ones.',
    compStructure: 'Base + annual bonus; overtime or busy-season pay in public accounting. Base is the main lever; a CPA is your strongest single argument.' },
  { slug: 'marketing-manager', name: 'Marketing Manager', blsGroup: 'Marketing Managers (11-2021)',
    leverage: 'Show revenue or pipeline you\'ve driven — marketing comp rewards demonstrable impact more than tenure. Larger gaps appear at senior and director level, so leveling matters.',
    compStructure: 'Base + bonus tied to marketing or revenue targets. Negotiate the bonus target and how it\'s measured, not only base.' },
  { slug: 'sales-representative', name: 'Sales Representative', blsGroup: 'Sales Representatives (41-4012)',
    leverage: 'For sales, the base is half the story — the OTE split, quota, territory, and accelerators are where the real money is negotiated. A soft quota or a strong territory can beat a higher base.',
    compStructure: 'Base + commission (OTE). Negotiate the quota, the territory, the commission rate, and the ramp/guarantee period — not just base.' },
  { slug: 'mechanical-engineer', name: 'Mechanical Engineer', blsGroup: 'Mechanical Engineers (17-2141)',
    leverage: 'Specialized domain experience (aerospace, medical devices, controls) and a PE license justify the top of the band. Relocation and sign-on are often more flexible than base in manufacturing.',
    compStructure: 'Base + bonus; relocation and sign-on common. Base moves with domain specialization; a PE license is a concrete lever.' },
  { slug: 'project-manager', name: 'Project Manager', blsGroup: 'Project Management Specialists (13-1082)',
    leverage: 'A PMP and a track record of on-time, on-budget delivery are your anchors. Scope of budget and team size managed are what separate the bands.',
    compStructure: 'Base + bonus. Base is the main lever; certifications and the size of programs you\'ve run justify the ask.' },
  { slug: 'financial-analyst', name: 'Financial Analyst', blsGroup: 'Financial and Investment Analysts (13-2051)',
    leverage: 'Modeling skill, a CFA (or progress toward it), and industry experience move the number. Finance offers at banks and PE flex on bonus more than base.',
    compStructure: 'Base + a bonus that can be a large share of total comp. Negotiate the bonus target as hard as the base.' },
  { slug: 'attorney', name: 'Attorney', blsGroup: 'Lawyers (23-1011)',
    leverage: 'Firm-track associate pay often follows a lockstep scale (harder to move), but in-house and smaller-firm roles negotiate freely on base, bonus, and title. Specialization and a portable book of business are decisive.',
    compStructure: 'Base + bonus (lockstep at large firms). In-house roles add equity; negotiate title and bonus structure where the scale is fixed.' },
  { slug: 'human-resources-specialist', name: 'Human Resources Specialist', blsGroup: 'Human Resources Specialists (13-1071)',
    leverage: 'You know the comp bands better than most candidates — use that. Certifications (SHRM, PHR) and specialized areas like comp or employment law justify the higher step.',
    compStructure: 'Base + bonus. Base is the main lever; a specialization (comp, benefits, ER) is your argument for the top of the range.' },
  { slug: 'customer-success-manager', name: 'Customer Success Manager', blsGroup: 'Customer Service Representatives (43-4051)',
    leverage: 'Net-retention and expansion numbers you\'ve driven are direct leverage — CSM comp increasingly rewards revenue impact. Book size and segment (enterprise vs SMB) set the band.',
    compStructure: 'Base + a variable tied to retention/expansion. Negotiate the variable target and book assignment alongside base.' },
];

export const roleBySlug = (slug: string) => NEGOTIATION_ROLES.find((r) => r.slug === slug);
