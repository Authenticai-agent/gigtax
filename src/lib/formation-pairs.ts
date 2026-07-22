/**
 * Formation comparison-pair pages.
 *
 * Four pages, approved on the basis that each one fails a find-and-replace
 * test: swap one state's name for another and the page stops being true. That
 * test is the whole justification for their existence, so the `asymmetry`
 * block on each is the page rather than decoration around a shared calculator.
 *
 * The operating state is deliberately NOT preset. A pair page compares two
 * FORMATION states, and which of them wins depends entirely on where the reader
 * actually works — presetting that would fabricate the premise the answer rests
 * on.
 */
export interface Pair {
  slug: string;
  /** The two formation states being compared. */
  states: [string, string];
  title: string;
  h1: string;
  description: string;
  tagline: string;
  /** Why this pair is searched. */
  intro: string[];
  /** The heading over the asymmetry. */
  asymmetryHeading: string;
  /** The reason the page exists. Must not survive a name swap. */
  asymmetry: string[];
  /** Per-state detail, keyed by code. */
  detail: Record<string, string[]>;
  verdict: string;
  faqs: Array<{ q: string; a: string; review?: boolean }>;
}

export const PAIRS: Pair[] = [
  {
    slug: 'california-vs-wyoming-llc',
    states: ['CA', 'WY'],
    title: 'California vs Wyoming LLC (2026) — does forming in Wyoming save a Californian anything?',
    h1: 'California vs Wyoming LLC',
    description:
      'Whether a California resident saves anything by forming an LLC in Wyoming for 2026 — including the $800 California owes anyway and the credit Wyoming cannot give.',
    tagline: 'A Californian forming in Wyoming pays California anyway — and gets no credit for it.',
    intro: [
      'This is the most searched version of the question and the one with the clearest answer, because California is unusually explicit about it.',
      'The pitch is simple enough: California is expensive, Wyoming is cheap, so file in Wyoming. The problem is that neither of the two things California charges you goes away when you do.',
    ],
    asymmetryHeading: 'Two things California charges that Wyoming cannot remove',
    asymmetry: [
      'The first is the $800 annual tax. California charges it to every LLC incorporated, registered or doing business in California — and the Franchise Tax Board treats you as doing business if you engage in any transaction for financial gain there, are commercially domiciled there, or pass its sales, property or payroll thresholds. Registering with the Secretary of State is not what triggers it. A Wyoming LLC run from a desk in San Jose owes the $800 whether or not it ever files a California form.',
      'The second is income tax, and this is where Wyoming actively works against you. California taxes residents on their entire income and gives a credit for tax paid to other states. That credit is capped by what you actually paid elsewhere. Wyoming levies no income tax — so there is nothing to credit. The offset is zero and the full California rate applies to every dollar.',
      'That second point is the one that makes this pair different from every other comparison on this site. Forming in a state that does tax income at least produces a credit. Forming in Wyoming produces none, because there is no Wyoming tax to have paid.',
    ],
    detail: {
      CA: [
        'California charges the $800 minimum annual tax to LLCs and corporations alike. For LLCs the first-year exemption expired after 2023 and does not apply in 2026; for corporations the first-year exemption is permanent and does. Two entity types, opposite answers, in the same state.',
        'On top of the $800 there is a separate LLC fee on total California income, tiered rather than rated — nothing below $250,000, then rising in steps to $11,790 at $5 million.',
      ],
      WY: [
        'Wyoming charges no income tax of any kind, no franchise tax on income, and no gross receipts tax. Its annual report is a license tax of the greater of $60 or $0.0002 per dollar of assets located in Wyoming, so the $60 floor holds until Wyoming assets pass $300,000.',
        'For someone who actually lives and works in Wyoming that is genuinely among the cheapest arrangements in the country. The figures are not in dispute. What is in dispute is whether they reach a Californian.',
      ],
    },
    verdict:
      'For a California resident doing business in California, forming in Wyoming adds a Wyoming registered agent, a Wyoming annual report and a California foreign registration on top of a California tax bill that has not moved. It is more expensive, not less.',
    faqs: [
      { q: 'What if the Wyoming LLC only holds property outside California?',
        a: 'The Franchise Tax Board has published an example concluding that an LLC holding only out-of-state property still has to file in California when a California-resident member conducts its business from California. Where the property sits is not the test; where the business is conducted from is part of it.',
        review: true },
      { q: 'Does it help if I never register the Wyoming LLC in California?',
        a: 'It makes things worse rather than better. California deems an unregistered foreign LLC transacting business there to have appointed the Secretary of State as its agent for service, and bars it from bringing or maintaining a lawsuit in California courts until it registers — while leaving it perfectly suable. There is also a per-year penalty.',
        review: true },
      { q: 'Is Wyoming ever better for a Californian?',
        a: 'If you move to Wyoming, yes — but then it is your home state and this comparison is not the one you are running. The calculator on this page will show that: set your home and work state to Wyoming and it wins.' },
    ],
  },
  {
    slug: 'delaware-vs-wyoming-llc',
    states: ['DE', 'WY'],
    title: 'Delaware vs Wyoming LLC (2026) — cost, franchise tax and what each is actually for',
    h1: 'Delaware vs Wyoming LLC',
    description:
      'Delaware and Wyoming compared for 2026 — two different regimes rather than two price points, and what each is genuinely used for.',
    tagline: 'Two different regimes, not two price points.',
    intro: [
      'These two get compared as though they were competing on price. They are not really competing at all — they are used by different people for different reasons, and the fee difference is the least interesting thing about them.',
    ],
    asymmetryHeading: 'One has a franchise tax with a trap in it. The other has no franchise tax.',
    asymmetry: [
      'Delaware charges its LLCs a flat annual tax and asks for no annual report at all. Its corporations are the opposite: a report every March and a franchise tax computed one of two ways — and Delaware bills the authorized shares method by default. For a corporation with millions of authorized shares and a modest balance sheet that default runs into five figures, while the assumed par value method produces a fraction of it. Delaware is not obliged to calculate the cheaper one, and the bill does not mention it.',
      'Wyoming has no franchise tax to have a trap in. Its annual charge is a license tax defined as the greater of $60 or two ten-thousandths of a dollar per dollar of assets located in Wyoming, which means the floor holds for any business without substantial Wyoming property.',
      'So the comparison is not $X against $Y. It is a regime where the amount depends on your share structure and on knowing which method to elect, against a regime where the amount is $60 unless you own things in Wyoming.',
    ],
    detail: {
      DE: [
        'Delaware LLCs: a flat annual tax due in June, no annual report, and a late penalty plus monthly interest if missed.',
        'Delaware corporations: an annual report due March 1 at $50 domestic — but $125 and due June 30 if the corporation is foreign. The franchise tax is paid with the report, and corporations owing $5,000 or more pay it in quarterly instalments.',
      ],
      WY: [
        'Identical treatment for LLCs and corporations: the same formation fee, the same foreign qualification fee, and the same license tax formula.',
        'No corporate income tax, no personal income tax, no gross receipts tax. Series LLCs add a small charge per series.',
      ],
    },
    verdict:
      'If you are choosing on cost alone and have no Wyoming assets, Wyoming is cheaper and simpler. Whether cost alone is the right basis is a different question, and one this calculator does not answer.',
    faqs: [
      { q: 'Which one do investors expect?',
        a: 'Investor preferences about structure are a conversation with the investors and with a lawyer, not a figure on this page. This calculator measures cost, and cost is not why anyone chooses between these two for a funded company.',
        review: true },
      { q: 'Delaware LLCs file no annual report. Is that a saving?',
        a: 'Not really — the flat annual tax replaces it and is larger than most states\' report fees. The saving is in effort rather than money.' },
      { q: 'Why does the Delaware column sometimes show a plus sign?',
        a: 'Because the Delaware corporation formation fee is marked as varying with stock, so the figure shown is a minimum rather than a price. Any total containing it is a floor.' },
    ],
  },
  {
    slug: 'wyoming-vs-nevada-llc',
    states: ['WY', 'NV'],
    title: 'Wyoming vs Nevada LLC (2026) — the cost difference nobody mentions',
    h1: 'Wyoming vs Nevada LLC',
    description:
      'Wyoming and Nevada are marketed almost identically for 2026. One costs roughly six times the other to keep. Here is where the difference sits.',
    tagline: 'Marketed identically. One costs about six times the other to keep.',
    intro: [
      'These two are sold with the same pitch — no income tax, privacy, low cost — and are the two states most often recommended interchangeably. On annual cost they are not close.',
    ],
    asymmetryHeading: 'Nevada charges a business license every year. Wyoming does not.',
    asymmetry: [
      'Wyoming\'s recurring cost is one line: an annual report license tax with a $60 floor. That is the whole of it.',
      'Nevada\'s is three. There is a $150 annual list of managers. There is a State Business License at $200 a year for an LLC — $500 for a corporation — paid to the Secretary of State alongside the list. And in the first year there is an Initial List at the same $150 as the annual one, due when the articles are filed, so year one carries the $150 twice.',
      'That puts Wyoming at roughly $60 a year against Nevada at roughly $350, before either state\'s registered agent. The business license is the line that does the damage and it is the one least often mentioned, because a fee schedule showing "$75 to form" reads as cheap.',
    ],
    detail: {
      WY: [
        'One recurring charge, and a formula that only bites if you hold substantial assets in Wyoming.',
        'The same fees apply to LLCs and corporations, which is unusual — most states charge corporations more.',
      ],
      NV: [
        'Nevada corporation formation and annual list fees both scale with the value of total authorized shares, to a $35,000 and $11,125 maximum. The figures shown here are minimums.',
        'Nevada also has a Commerce Tax on gross revenue above $4 million a year, at rates that vary by industry classification — so above that threshold this calculator computes nothing rather than guessing a rate.',
      ],
    },
    verdict:
      'On recurring cost Wyoming wins clearly, and the gap is wider than the formation fees suggest. Neither, however, does anything about the tax owed where the work actually happens.',
    faqs: [
      { q: 'Both promise privacy. Is one better?',
        a: 'Both limit what appears in state filings. Whether that amounts to anonymity in 2026 is a question this page will not answer, because federal beneficial-ownership reporting is under active regulatory development and a firm statement would age badly. Check FinCEN and the statute rather than any page, this one included.',
        review: true },
      { q: 'Why does Nevada show nothing for gross receipts tax at higher revenue?',
        a: 'Because the Commerce Tax rate depends on your industry classification and no single rate exists to apply. Rather than pick one, the column is marked unquantified and the cost is left out of the total.' },
      { q: 'Are the Nevada figures reliable?',
        a: 'They come from the Nevada statutes rather than the Secretary of State fee schedule, because that site blocks automated access. Statutes are a primary source, but the figures are worth confirming against the SoS before you rely on them.' },
    ],
  },
  {
    slug: 'delaware-vs-nevada-llc',
    states: ['DE', 'NV'],
    title: 'Delaware vs Nevada (2026) — two share-based fee schedules compared',
    h1: 'Delaware vs Nevada',
    description:
      'Delaware and Nevada compared for 2026. Both scale their corporate fees with share value, which makes a flat price comparison misleading.',
    tagline: 'Both scale their fees with share value. A flat comparison misleads.',
    intro: [
      'These are the two states with the strongest "incorporate here" marketing, and the only pair on this site where both sides charge corporations on the value of their authorized shares. That makes the usual side-by-side price table actively misleading.',
    ],
    asymmetryHeading: 'Both charge on share value, and they do it at different points',
    asymmetry: [
      'Delaware scales the franchise tax. Formation is close to flat; the annual franchise tax is where the share structure shows up, computed either on authorized shares or on assumed par value, with a cap of $200,000 for ordinary filers and $250,000 for large corporate filers.',
      'Nevada scales the filing itself, and then scales it again every year. Corporate formation runs from $75 to a $35,000 maximum on the value of total authorized shares, and the annual list runs from $150 to $11,125 on the same basis. So Nevada charges for share structure at the counter and then charges for it again annually.',
      'The practical consequence is that a comparison of "$110 versus $75 to form" tells you nothing about either state. A company with a conventional startup share structure will find those numbers describe neither its first year nor any year after.',
    ],
    detail: {
      DE: [
        'Delaware corporations pay an annual report fee separately from the franchise tax, and foreign corporations pay a different, higher report fee on a different date from domestic ones.',
        'Corporations owing $5,000 or more of franchise tax pay quarterly instalments rather than one annual amount.',
      ],
      NV: [
        'Nevada adds a State Business License of $500 a year for corporations — separate from the annual list and often left out of comparisons.',
        'An Initial List is due with the articles, at the same amount as the annual one, so year one carries it twice.',
      ],
    },
    verdict:
      'Neither state can be compared on a headline fee, and any table that does so — including the one on this page — is showing minimums. Both figures are floors, and the real number depends on a share structure this calculator does not ask for.',
    faqs: [
      { q: 'Why do the totals on this page carry a plus sign?',
        a: 'Because both states\' corporate fees scale with share value and the stored figures are minimums. The plus marks a total that can only go up.' },
      { q: 'Which is cheaper for an LLC rather than a corporation?',
        a: 'The share-based schedules do not apply to LLCs in either state, so the comparison becomes much simpler — and Delaware\'s flat annual tax against Nevada\'s list plus business license is the whole of it. Switch the entity type in the calculator to see it.' },
      { q: 'Does either state\'s court system matter to a small company?',
        a: 'That is a legal question rather than a cost one, and outside what this calculator measures. It is worth asking a lawyer rather than a fee schedule.',
        review: true },
    ],
  },
];

export function pairFor(slug: string): Pair | null {
  return PAIRS.find((p) => p.slug === slug) ?? null;
}
