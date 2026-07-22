/**
 * Spoke pages for the formation hub: Delaware, Wyoming, Montana and South Dakota.
 *
 * These are the three destinations people are actually sent to, so each gets a
 * page of its own — and each carries the myth warning, because a reader who
 * arrives on the Wyoming page from a search has not seen the hub's version and
 * is the person most likely to need it.
 *
 * Figures come from the formation dataset via the page, never from this file.
 * What lives here is the state-specific explanation: what the fee schedule does
 * not tell you, and what the marketing leaves out.
 */
export interface Spoke {
  slug: string;
  /** State codes the page covers. */
  codes: string[];
  title: string;
  h1: string;
  description: string;
  tagline: string;
  /** Opening paragraphs. */
  body: string[];
  /** The state-specific catch, headed and separate from the general warning. */
  catchHeading: string;
  catch: string[];
  faqs: Array<{ q: string; a: string; review?: boolean }>;
}

export const SPOKES: Spoke[] = [
  {
    slug: 'delaware',
    codes: ['DE'],
    title: 'Delaware LLC and corporation formation cost (2026)',
    h1: 'Forming in Delaware',
    description:
      'What a Delaware LLC or corporation costs to form and keep in 2026 — including the franchise tax method Delaware bills by default and the one you have to ask for.',
    tagline: 'Delaware bills the expensive franchise tax method by default.',
    body: [
      'Delaware is where most American public companies are incorporated, and that fact does a great deal of work in marketing aimed at people running one-person businesses. The two situations have almost nothing in common.',
      'What Delaware actually charges is straightforward and, for a small company, modest. An LLC pays a flat annual tax and files no annual report at all. A corporation files a report and pays franchise tax, and that is where the trap is.',
    ],
    catchHeading: 'The franchise tax method Delaware does not choose for you',
    catch: [
      'Delaware calculates corporate franchise tax two ways and bills you under the one based on authorized shares. For a company with a few thousand shares that produces a small number. For a startup with ten million authorized shares and a modest balance sheet it produces tens of thousands of dollars.',
      'The alternative — the assumed par value method, calculated from what the company is actually worth — usually produces a fraction of that. Delaware is not obliged to work it out for you, and the bill that arrives will not mention it. You elect it when you file the annual report.',
      'This is the single most expensive thing a founder can not know about Delaware, and it has nothing to do with whether Delaware was the right choice in the first place.',
    ],
    faqs: [
      {
        q: 'Do I need a Delaware entity to raise money?',
        a: 'Investors often have preferences about structure, and those preferences are a conversation with them and with a lawyer rather than a number on this page. This calculator measures cost, and cost is not the reason anyone incorporates in Delaware.',
        review: true,
      },
      {
        q: 'Delaware has no sales tax. Does that help me?',
        a: 'Only if you are selling into Delaware. Sales tax follows where the customer is, not where the entity was filed, and this site does not compute sales tax at all.',
        review: true,
      },
      {
        q: 'Is the LLC annual tax the same as the corporation franchise tax?',
        a: 'No, and mixing them up is expensive in both directions. A Delaware LLC pays a flat annual tax and files no report. A Delaware corporation files a report and pays franchise tax computed on one of two methods.',
      },
    ],
  },
  {
    slug: 'wyoming',
    codes: ['WY'],
    title: 'Wyoming LLC formation cost (2026)',
    h1: 'Forming in Wyoming',
    description:
      'What a Wyoming LLC costs to form and keep in 2026, and what it costs once you add the foreign registration you still owe where you actually work.',
    tagline: 'Cheap to form. That is not the same as cheap to use.',
    body: [
      'Wyoming genuinely is inexpensive. There is no personal income tax, no corporate income tax, no franchise tax on income and no gross receipts tax. The formation fee is among the lowest in the country and the annual report is a flat charge for any business with modest assets in the state.',
      'None of that is in dispute. What is in dispute is whether any of it reaches you, if the work happens somewhere else.',
    ],
    catchHeading: 'The part the fee schedule cannot tell you',
    catch: [
      'Wyoming has no income tax because Wyoming is not taxing your income — your own state is. Pass-through profit is taxed where the owner lives and where the income is earned, so a Wyoming LLC run from anywhere else does not move a dollar of income tax.',
      'And the low fees do not replace your own state’s fees, they sit alongside them. You register in your operating state as a foreign entity, pay its registration fee, file its annual report, pay its taxes, and keep a Wyoming registered agent on top because you have no Wyoming address.',
      'The result is two sets of filings and two states that can dissolve you for missing a deadline, in exchange for a formation fee that was cheaper once.',
    ],
    faqs: [
      {
        q: 'Does a Wyoming LLC keep my name off public records?',
        a: 'Wyoming does limit what appears in state filings. Whether that amounts to anonymity in 2026 is a different question, and one this page will not answer: federal beneficial-ownership reporting is under active regulatory development and any firm statement here would age badly. Check the current position with FinCEN and the statute.',
        review: true,
      },
      {
        q: 'What if I have no employees and work entirely online?',
        a: 'It narrows the question but does not remove it. You still live somewhere, and your state still taxes what you earn. Where the customers are can create obligations of its own, which this calculator does not compute.',
        review: true,
      },
      {
        q: 'Is Wyoming ever the right answer?',
        a: 'Yes — when you actually live or work there, in which case it is simply your home state and an unusually cheap one. The comparison on the hub shows it winning in exactly that case.',
      },
    ],
  },
  {
    slug: 'montana-and-south-dakota',
    codes: ['MT', 'SD'],
    title: 'Montana and South Dakota LLC formation cost (2026)',
    h1: 'Forming in Montana or South Dakota',
    description:
      'What Montana and South Dakota cost to form an LLC in for 2026, and how they differ — one has no sales tax, the other no income tax.',
    tagline: 'Two cheap states, and they are cheap in completely different ways.',
    body: [
      'These two turn up together in formation advice and they are not interchangeable. Montana has no general sales tax but does tax income. South Dakota taxes no income at all — personal or corporate — but has an ordinary sales tax.',
      'Which of those matters depends entirely on your business, and for most readers the honest answer is neither, because both only apply if you are actually there.',
    ],
    catchHeading: 'What each is actually good for',
    catch: [
      'Montana’s absence of sales tax is a genuine advantage to a business selling physical goods from Montana. It does nothing for a business selling from anywhere else, because sales tax follows the customer.',
      'South Dakota’s absence of income tax is a genuine advantage to someone who lives in South Dakota. It does nothing for someone who lives elsewhere, because income tax follows the owner.',
      'Both states also charge a foreign entity substantially more than a domestic one to register, so using either from outside is the expensive direction.',
    ],
    faqs: [
      {
        q: 'People register vehicles in Montana to avoid sales tax. Is that the same thing?',
        a: 'No, and it is a different area of law with its own consequences. This calculator compares the cost of forming and maintaining a business entity, and nothing here should be read as advice about vehicle registration.',
        review: true,
      },
      {
        q: 'South Dakota has no income tax. Why does the comparison still charge me income tax?',
        a: 'Because you are taxed where you live, not where the entity is filed. If you do not live in South Dakota, South Dakota having no income tax does not reduce your bill by a dollar.',
      },
      {
        q: 'Why is one of the Montana figures marked unverified?',
        a: 'Because it came from an older version of this site and has not been confirmed against Montana’s own fee schedule. Rather than present it as established, it is shown as a lead and excluded from totals.',
      },
    ],
  },
];

export function spokeFor(slug: string): Spoke | null {
  return SPOKES.find((s) => s.slug === slug) ?? null;
}
