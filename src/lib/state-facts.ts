/**
 * Per-state facts beyond the income tax rate.
 *
 * These come from `stateMetadata` and the per-state `note` field in
 * src/data/states.ts — both verified, both previously unused by any page. They
 * exist because a state page built on the rate alone is nearly interchangeable
 * with every other state at the same rate: the quality gate scored Florida
 * against Tennessee at 86%, since "this state has no income tax" is the whole
 * page for both. What actually separates them is everything here — Texas is a
 * community property state, Washington taxes capital gains, New Hampshire has
 * no sales tax either and just finished eliminating its dividend tax.
 */
import { states, stateMetadata } from '../data/states';
import { adjacency } from '../data/adjacency';
import { calcStateTax, formatMoney } from './tax-engine';
import { stateSlug } from './slug';
import type { StateData } from '../data/types';

const meta = stateMetadata as {
  communityPropertyStates: string[];
  communityPropertyNote: string;
  statesThatTaxSocialSecurity: string[];
  statesWithLocalIncomeTax: Record<string, string[]>;
  statesWithNoSalesTax: string[];
  statesWithSDI: Record<string, { rate: number | string; wageBase?: number | string; note: string }>;
};

export interface StateFacts {
  /** Local/municipal income taxes the state-level estimate does not model. */
  localIncomeTax: string[] | null;
  communityProperty: boolean;
  taxesSocialSecurity: boolean;
  noSalesTax: boolean;
  sdi: { rate: number | string; wageBase?: number | string; note: string } | null;
  /** The dataset's own note on this state's 2026 rate changes. */
  note: string | null;
  /** A known limitation in how this state is modelled, surfaced on the page. */
  caveat: string | null;
}

export function stateFacts(code: string, state: StateData): StateFacts {
  return {
    localIncomeTax: meta.statesWithLocalIncomeTax[code] ?? null,
    communityProperty: meta.communityPropertyStates.includes(code),
    taxesSocialSecurity: meta.statesThatTaxSocialSecurity.includes(code),
    noSalesTax: meta.statesWithNoSalesTax.includes(code),
    sdi: meta.statesWithSDI[code] ?? null,
    note: typeof state.note === 'string' ? state.note : null,
    caveat: typeof state.dataCaveat === 'string' ? state.dataCaveat : null,
  };
}

/**
 * Paragraphs covering what the income tax rate does not: local taxes, SDI,
 * community property, Social Security treatment, sales tax, and the state's own
 * 2026 rate-change note. Only facts that are actually true of this state are
 * emitted — no "this state does not have X" filler.
 */
export function describeStateFacts(
  code: string,
  state: StateData,
  incomeNoun = 'self-employment income',
  opts: { skipSdi?: boolean } = {},
): string[] {
  const f = stateFacts(code, state);
  const out: string[] = [];

  if (f.note) {
    out.push(`On the 2026 rate itself: ${lowerFirst(f.note)}`);
  }

  // A known modelling limitation is worth more to a reader than a silently
  // wrong number, so it is stated on the page rather than buried in the data.
  if (f.caveat) {
    out.push(f.caveat);
  }

  if (f.localIncomeTax) {
    out.push(
      `${state.name} also has local income tax that the estimate above does not model — ` +
        `${f.localIncomeTax.map(lowerFirst).join('; ')}. Add it separately for where you live and work.`,
    );
  }

  if (f.sdi && !opts.skipSdi) {
    const rate = typeof f.sdi.rate === 'number' ? `${(f.sdi.rate * 100).toFixed(2).replace(/\.?0+$/, '')}%` : f.sdi.rate;
    const base = typeof f.sdi.wageBase === 'number' ? ` up to ${formatMoney(f.sdi.wageBase)} of wages` : '';
    out.push(
      `${state.name} runs a state disability insurance programme: ${rate}${base}. ${f.sdi.note}`,
    );
  }

  if (f.communityProperty) {
    out.push(
      `${state.name} is a community property state. ${meta.communityPropertyNote}`,
    );
  }

  if (f.taxesSocialSecurity) {
    out.push(
      `${state.name} is one of the twelve states that still taxes Social Security benefits, ` +
        `which matters if you are drawing benefits alongside ${incomeNoun}.`,
    );
  }

  if (f.noSalesTax) {
    out.push(
      `${state.name} is also one of five states with no general sales tax, so the total tax picture ` +
        `is lighter than the income tax line alone suggests.`,
    );
  }

  return out;
}

export interface NeighbourRow {
  code: string;
  name: string;
  slug: string;
  tax: number;
  /** Difference against the page's own state — negative means the neighbour is cheaper. */
  delta: number;
  noTax: boolean;
}

/**
 * State income tax on the same income in each bordering state, computed from
 * the engine. Every state has a different set of neighbours at different rates,
 * so this is the single highest-variance block available from existing data —
 * and it is the question a border-area reader actually has.
 */
export function neighbourComparison(code: string, income: number, status = 'single'): NeighbourRow[] {
  const own = calcStateTax(income, code, undefined, status).tax;
  // Alaska and Hawaii have no land border, so there are no neighbours to compare
  // against — and without this their pages had almost nothing of their own. The
  // comparison people actually make from there is against the big states they
  // might move to or from.
  const against = adjacency[code]?.length ? adjacency[code] : ['CA', 'TX', 'NY', 'FL'].filter((c) => c !== code);
  return against
    .filter((c) => states[c])
    .map((c) => {
      const s = states[c];
      const tax = calcStateTax(income, c, undefined, status).tax;
      return {
        code: c,
        name: s.name,
        slug: stateSlug(s.name),
        tax,
        delta: tax - own,
        noTax: s.noIncomeTax === true || s.type === 'none',
      };
    })
    .sort((a, b) => a.tax - b.tax);
}

/** One sentence summarising how the state sits against its neighbours. */
export function describeNeighbours(code: string, state: StateData, rows: NeighbourRow[], income: number): string | null {
  if (!rows.length) return null;
  const borderless = !adjacency[code]?.length;
  if (borderless) {
    const cheapest = rows[0];
    const dearest = rows[rows.length - 1];
    const own = calcStateTax(income, code, undefined, 'single').tax;
    return (
      `${state.name} shares no land border, so there is no commuter comparison to make — but the ` +
      `move-to-and-from comparison still holds. On ${formatMoney(income)}, ${state.name} charges ` +
      `${own === 0 ? 'nothing' : formatMoney(own)} against ${formatMoney(cheapest.tax)} in ` +
      `${cheapest.name} and ${formatMoney(dearest.tax)} in ${dearest.name}.`
    );
  }
  const cheapest = rows[0];
  const dearest = rows[rows.length - 1];
  const own = calcStateTax(income, code, undefined, 'single').tax;
  if (rows.every((r) => r.tax === own)) return null;
  return (
    `On ${formatMoney(income)}, ${state.name} charges ${formatMoney(own)} of state income tax. ` +
    `Of the ${rows.length} states it borders, ${cheapest.name} is the lightest at ` +
    `${cheapest.noTax ? 'nothing at all' : formatMoney(cheapest.tax)} and ${dearest.name} the most expensive at ` +
    `${formatMoney(dearest.tax)} — a spread of ${formatMoney(dearest.tax - cheapest.tax)} on the same income.`
  );
}

/**
 * One sentence per bordering state, with the actual difference in dollars.
 * Length and content scale with how many neighbours a state has — Nevada has
 * five, Washington two — which is real variance rather than padding, and it is
 * the comparison a reader near a border is actually making.
 */
export function neighbourSentences(state: StateData, rows: NeighbourRow[]): string[] {
  return rows.map((n) => {
    if (n.delta === 0) {
      return `${n.name} works out the same as ${state.name} on this income.`;
    }
    const cheaper = n.delta < 0;
    const amount = formatMoney(Math.abs(n.delta));
    if (n.noTax) {
      return `${n.name} has no income tax at all, so the same work done there costs ${amount} less in ` +
        `state tax than it does in ${state.name}.`;
    }
    return `${n.name} would take ${cheaper ? `${amount} less` : `${amount} more`} — ` +
      `${formatMoney(n.tax)} against ${state.name}'s ${formatMoney(n.tax - n.delta)}.`;
  });
}

function lowerFirst(s: string): string {
  // Leave acronyms alone — "CA SDI applies…" must not become "cA SDI applies…".
  if (/^[A-Z]{2}/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}
