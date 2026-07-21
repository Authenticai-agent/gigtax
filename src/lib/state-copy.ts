/**
 * Server-side helpers that turn verified state data into page prose.
 * Numbers here come straight from src/data — never hand-written — so a data
 * update regenerates the copy correctly and the text can't drift from the engine.
 */
import type { StateData } from '../data/types';
import { formatMoney, getStandardDeduction } from './tax-engine';
import { federal } from '../data/federal';
import { states } from '../data/states';
import { reciprocity } from '../data/reciprocity';

/** One sentence describing a state's 2026 income tax structure, from its data. */
export function describeStateTax(state: StateData): string {
  if (state.noIncomeTax || state.type === 'none') {
    return `${state.name} has no state income tax, so a self-employed worker there owes only federal income tax and self-employment tax on their 1099 income.`;
  }
  if (state.type === 'flat' && typeof state.rate === 'number') {
    return `${state.name} taxes income at a flat ${(state.rate * 100).toFixed(2).replace(/\.?0+$/, '')}% for 2026, applied on top of federal income tax and self-employment tax.`;
  }
  const brackets = state.brackets_single ?? [];
  const top = state.topRate ? `${(state.topRate * 100).toFixed(2).replace(/\.?0+$/, '')}%` : 'a graduated rate';
  return `${state.name} uses graduated 2026 income tax brackets topping out at ${top}${brackets.length ? `, across ${brackets.length} brackets` : ''}, on top of federal income tax and self-employment tax.`;
}

/** The dollar figures used in a worked example, computed by the engine from data. */
export interface WorkedExample {
  grossSe: number;
  lines: Array<{ label: string; value: string }>;
}

/** URL slug for a state: "District of Columbia" -> "district-of-columbia". */
export function stateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Percent with no trailing zeros: 0.0275 -> "2.75%", 0.05 -> "5%". */
export function pct(rate: number): string {
  return `${(rate * 100).toFixed(3).replace(/\.?0+$/, '')}%`;
}

const se = federal.selfEmployment;

/**
 * The federal half of every state page: how SE tax is built, in figures.
 * Every number derives from data/federal.ts -> federal.selfEmployment.
 */
export function describeSelfEmploymentTax(): string {
  return (
    `Self-employment tax is ${pct(se.seTaxRate)} — ${pct(se.socialSecurityRate)} Social Security ` +
    `plus ${pct(se.medicareRate)} Medicare — charged on ${pct(se.netEarningsMultiplier)} of net profit. ` +
    `The Social Security half stops once net earnings reach ${formatMoney(se.socialSecurityWageBase)} for 2026; ` +
    `Medicare has no cap. Half of the self-employment tax is deductible from AGI, so it lowers ` +
    `income tax even though it doesn't lower the self-employment tax itself.`
  );
}

/** Rows for a state bracket table; empty for flat and no-tax states. */
export function bracketRows(state: StateData): Array<{ range: string; rate: string }> {
  const brackets = state.brackets_single ?? [];
  return brackets.map(([min, max, rate]) => ({
    range: max === null ? `${formatMoney(min)} and up` : `${formatMoney(min)} – ${formatMoney(max)}`,
    rate: pct(rate),
  }));
}

/**
 * How the state layer works, in that state's own figures. Reads type, rate,
 * brackets, standardDeduction, exemptBelow and mentalHealthSurcharge from
 * data/states.ts — nothing here is hand-written per state.
 */
export function describeStateLayer(state: StateData): string[] {
  const paras: string[] = [];
  if (state.noIncomeTax || state.type === 'none') {
    paras.push(
      `${state.name} levies no personal income tax for 2026, so the state column of the ` +
        `estimate above is zero. Federal income tax and self-employment tax still apply in full — ` +
        `a no-income-tax state does not reduce either.`,
    );
    return paras;
  }

  if (state.type === 'flat' && typeof state.rate === 'number') {
    paras.push(
      `${state.name} applies a single ${pct(state.rate)} rate to taxable income for 2026, ` +
        `so every extra dollar of 1099 profit is taxed at the same state rate.`,
    );
  } else {
    const rows = bracketRows(state);
    paras.push(
      `${state.name} taxes income on ${rows.length} graduated brackets for 2026, from ` +
        `${rows[0]?.rate ?? '—'} up to ${pct(state.topRate)}. Because 1099 profit stacks on top of ` +
        `any other income, an extra job can push part of it into the next bracket.`,
    );
  }

  const exemptBelow = typeof state.exemptBelow === 'number' ? state.exemptBelow : 0;
  if (exemptBelow > 0) {
    paras.push(
      `${state.name} exempts the first ${formatMoney(exemptBelow)} of taxable income entirely — ` +
        `tax applies only to the excess above that line.`,
    );
  }

  const std = state.standardDeduction?.single;
  if (typeof std === 'number' && std > 0) {
    paras.push(
      `${state.name} allows its own standard deduction of ${formatMoney(std)} for a single filer, ` +
        `which is separate from the federal standard deduction.`,
    );
  }

  if (typeof state.mentalHealthSurcharge === 'number' && typeof state.mentalHealthThreshold === 'number') {
    paras.push(
      `Income above ${formatMoney(state.mentalHealthThreshold)} carries an additional ` +
        `${pct(state.mentalHealthSurcharge)} surcharge, which the calculator includes.`,
    );
  }

  return paras;
}

/** ["A","B","C"] -> "A, B and C". */
function andList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Mid-sentence clause naming a state's 2026 rate structure, e.g. "at a flat 2.75%". */
function rateClause(state: StateData): string {
  if (state.type === 'flat' && typeof state.rate === 'number') {
    return `at a flat ${pct(state.rate)}`;
  }
  const rows = bracketRows(state);
  return `on ${rows.length} graduated brackets topping out at ${pct(state.topRate)}`;
}

export interface Faq {
  q: string;
  a: string;
  /** Data-file field this answer derives from, for review traceability. */
  source: string;
}

/**
 * 4–6 questions specific to one state, each answered from the dataset.
 * `source` records where the figures came from so factual claims stay reviewable.
 */
export function buildStateFaqs(
  code: string,
  state: StateData,
  example: { income: number; stateTax: number; totalTax: number; effectiveRate: number },
): Faq[] {
  const faqs: Faq[] = [];
  const noTax = Boolean(state.noIncomeTax) || state.type === 'none';

  faqs.push({
    q: `Does ${state.name} tax 1099 income?`,
    a: noTax
      ? `No. ${state.name} has no personal income tax for 2026, so 1099 profit earned there faces ` +
        `federal income tax and self-employment tax only. On the ${formatMoney(example.income)} ` +
        `example above that is ${formatMoney(example.totalTax)} in total tax and nothing to the state.`
      : `Yes. ${state.name} taxes net profit from 1099 work the same way it taxes other income, ` +
        `${rateClause(state)}. On the ${formatMoney(example.income)} example above the state share ` +
        `is ${formatMoney(example.stateTax)}.`,
    source: `data/states.ts → ${code}.type, ${code}.${state.type === 'flat' ? 'rate' : 'brackets_single'}`,
  });

  faqs.push({
    q: `How much should a 1099 worker in ${state.name} set aside?`,
    a:
      `About ${(example.effectiveRate * 100).toFixed(0)}% of net profit, based on the ` +
      `${formatMoney(example.income)} single-filer example above (${formatMoney(example.totalTax)} of ` +
      `federal, self-employment and ${noTax ? 'no state' : state.name + ' state'} tax combined). ` +
      `Your own rate moves with filing status, other income and deductions — run the calculator with your numbers.`,
    source: 'computed by lib/tax-engine.ts calcCombined()',
  });

  faqs.push({
    q: `Are there local income taxes in ${state.name}?`,
    a: state.localTaxNote
      ? `${state.localTaxNote}. The estimate above covers federal, self-employment and state tax only — ` +
        `it does not model local income tax, so add it separately if it applies where you live or work.`
      : `The estimate above models federal, self-employment and state income tax only — it does not ` +
        `include any city, county or school-district income tax. The 2026 dataset carries no local-tax ` +
        `note for ${state.name}, so check with the municipality where you live and work before relying ` +
        `on the state figure alone.`,
    source: `data/states.ts → ${code}.localTaxNote`,
  });

  const recip = reciprocity[code];
  if (recip) {
    const names = andList(recip.partners.map((p) => states[p]?.name ?? p));
    faqs.push({
      q: `Does ${state.name} reciprocity help if I do 1099 work across a state line?`,
      a:
        `Usually not. ${state.name} has wage reciprocity with ${names}` +
        `${recip.exemptionForm ? ` (exemption form ${recip.exemptionForm})` : ''}, but reciprocity ` +
        `agreements cover wages paid by an employer, not self-employment income. A 1099 worker with ` +
        `income sourced to another state generally still files there and claims a credit at home.` +
        `${recip.note ? ` ${recip.note}` : ''}`,
      source: `data/reciprocity.ts → ${code}.partners, ${code}.exemptionForm`,
    });
  } else if (!noTax) {
    faqs.push({
      q: `Do I owe ${state.name} tax on work done for an out-of-state client?`,
      a:
        `${state.name} has no wage reciprocity agreements in the 2026 dataset. As a resident you ` +
        `generally report all your 1099 profit to ${state.name} regardless of where the client is, ` +
        `and claim a credit for income tax paid to another state on work performed there.`,
      source: 'data/reciprocity.ts (no entry for this state)',
    });
  }

  const q = federal.quarterlyEstimated.quarters as Array<Record<string, string>>;
  faqs.push({
    q: 'When are quarterly estimated payments due?',
    a:
      `Federal 1040-ES payments for the 2026 tax year are due ` +
      `${q.map((x) => fmtDue(x.dueDate)).join(', ')}. ` +
      (noTax
        ? `${state.name} has no income tax, so there is no state estimated payment to make.`
        : `${state.name} requires its own estimated payments; the 2026 dataset does not yet carry ` +
          `state-specific due dates, so confirm them with the ${state.name} tax agency.`),
    source: 'data/federal.ts → federal.quarterlyEstimated.quarters',
  });

  faqs.push({
    q: 'What deduction does the estimate assume?',
    a:
      `The federal standard deduction of ${formatMoney(getStandardDeduction('single'))} for a single ` +
      `filer, plus the deductible half of self-employment tax. It does not itemize, and it does not ` +
      `subtract business expenses unless you enter them — enter mileage, home office and supplies as ` +
      `deductions in the calculator to see them reduce the estimate.`,
    source: 'data/federal.ts → federal.standardDeduction',
  });

  return faqs;
}

/** "2026-04-15" -> "April 15, 2026". */
function fmtDue(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const month = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][m - 1];
  return `${month} ${d}, ${y}`;
}
