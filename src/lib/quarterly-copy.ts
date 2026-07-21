/**
 * Server-side helpers for the quarterly estimated tax pages.
 *
 * Everything here is derived from src/data — the due dates, the safe-harbor
 * rules and the $1,000 filing threshold all come from
 * federal.quarterlyEstimated, and the per-quarter dollar figures come from the
 * same engine that powers the calculator island.
 */
import type { StateData } from '../data/types';
import { federal } from '../data/federal';
import { calcCombined, formatMoney } from './tax-engine';
import { pct } from './state-copy';

const qe = federal.quarterlyEstimated;
const safe = qe.safeHarborRules as Record<string, unknown>;

/** The 2026 federal 1040-ES due dates, formatted for prose and tables. */
export const quarters = (qe.quarters as Array<Record<string, string>>).map((q) => ({
  quarter: Number(q.quarter),
  periodLabel: q.periodLabel,
  dueIso: q.dueDate,
  due: formatDue(q.dueDate),
  form: q.irsForm,
}));

/** Minimum expected balance due before estimated payments are required. */
export const MIN_TO_OWE = Number(safe.minimumToOweEstimated);

export const SAFE_HARBOR_CURRENT = String(safe.rule1);
export const SAFE_HARBOR_PRIOR = String(safe.rule2);
export const PENALTY_RATE = String(safe.underpaymentPenaltyRate);

/** "2026-04-15" -> "April 15, 2026". */
export function formatDue(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const month = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][m - 1];
  return `${month} ${d}, ${y}`;
}

export interface QuarterlyExample {
  income: number;
  /** Full-year federal + SE tax, no state. */
  federalYear: number;
  /** Full-year state income tax. */
  stateYear: number;
  totalYear: number;
  /** 90% of the current-year liability — the first safe-harbor target. */
  target: number;
  perQuarterFederal: number;
  perQuarterState: number;
  perQuarterTotal: number;
  effectiveRate: number;
}

/**
 * The per-quarter figures for one state at a given income, computed from the
 * engine. The 90% figure is `safeHarborRules.rule1` applied to the current-year
 * liability — the route a first-year filer with no prior return must use.
 */
export function quarterlyExample(code: string, income: number, status = 'single'): QuarterlyExample {
  const r = calcCombined(0, income, 0, status, code);
  const federalYear = r.fedTax + r.seTax;
  const stateYear = r.stateTax;
  const totalYear = federalYear + stateYear;
  const target = federalYear * 0.9;
  return {
    income,
    federalYear,
    stateYear,
    totalYear,
    target,
    perQuarterFederal: target / 4,
    perQuarterState: (stateYear * 0.9) / 4,
    perQuarterTotal: (totalYear * 0.9) / 4,
    effectiveRate: r.effectiveRate,
  };
}

/** True when the state collects no income tax, so there is no state voucher. */
export function stateHasNoIncomeTax(state: StateData): boolean {
  return Boolean(state.noIncomeTax) || state.type === 'none';
}

/**
 * How the state half of a quarterly payment works. State-specific figures only;
 * where the dataset has no state due dates we say so rather than guess.
 */
export function describeStateQuarterly(state: StateData, ex: QuarterlyExample): string[] {
  if (stateHasNoIncomeTax(state)) {
    return [
      `${state.name} has no personal income tax for 2026, so there is no state estimated payment ` +
        `to make. Everything in the schedule above goes to the IRS.`,
      `That does not reduce the federal side: self-employment tax and federal income tax are owed ` +
        `in full, which is why the ${formatMoney(ex.income)} example still needs ` +
        `${formatMoney(ex.perQuarterFederal)} a quarter.`,
    ];
  }
  const paras = [
    `${state.name} taxes the same 1099 profit ${rateClause(state)}, so a second payment goes to the ` +
      `state each quarter — about ${formatMoney(ex.perQuarterState)} on the ${formatMoney(ex.income)} ` +
      `example, against ${formatMoney(ex.stateYear)} of ${state.name} income tax for the year.`,
  ];

  const exemptBelow = typeof state.exemptBelow === 'number' ? state.exemptBelow : 0;
  if (exemptBelow > 0) {
    paras.push(
      `${state.name} exempts the first ${formatMoney(exemptBelow)} of taxable income, which is why ` +
        `the state voucher stays small until profit clears that line — and why the state share grows ` +
        `faster than the federal one as income rises.`,
    );
  }

  const std = state.standardDeduction?.single;
  if (typeof std === 'number' && std > 0) {
    paras.push(
      `${state.name}'s own standard deduction of ${formatMoney(std)} comes off before the state rate ` +
        `applies, separately from the federal one, so the state quarter is smaller than the headline ` +
        `rate on gross profit suggests.`,
    );
  }

  paras.push(
    `The 2026 dataset carries the federal 1040-ES dates but not state-specific due dates, so confirm ` +
      `${state.name}'s schedule and voucher with its tax agency — several states do not match the ` +
      `federal calendar exactly.`,
  );
  return paras;
}

/** Mid-sentence clause naming the state's rate structure. */
function rateClause(state: StateData): string {
  if (state.type === 'flat' && typeof state.rate === 'number') {
    return `at a flat ${pct(state.rate)}`;
  }
  const n = (state.brackets_single ?? []).length;
  return `on ${n} graduated brackets topping out at ${pct(state.topRate)}`;
}

/**
 * Per-quarter payments at three income levels. Gives each state page figures
 * that move with its own rate structure rather than one shared example.
 */
export function quarterlyLadder(code: string, incomes = [25000, 50000, 100000]) {
  return incomes.map((income) => quarterlyExample(code, income));
}

export interface Faq {
  q: string;
  a: string;
  source: string;
}

/** 6 quarterly-specific questions, answered from the dataset for one state. */
export function buildQuarterlyFaqs(code: string, state: StateData, ex: QuarterlyExample): Faq[] {
  const noTax = stateHasNoIncomeTax(state);
  return [
    {
      q: `How much should I send each quarter in ${state.name}?`,
      a:
        `On ${formatMoney(ex.income)} of net 1099 profit as a single filer, about ` +
        `${formatMoney(ex.perQuarterFederal)} to the IRS` +
        (noTax
          ? `, and nothing to ${state.name} — it has no income tax.`
          : ` plus roughly ${formatMoney(ex.perQuarterState)} to ${state.name}.`) +
        ` That is 90% of this year's liability, split four ways.`,
      source: 'lib/tax-engine.ts calcCombined() + federal.quarterlyEstimated.safeHarborRules.rule1',
    },
    {
      q: noTax
        ? `Does ${state.name} require estimated payments?`
        : `Does ${state.name} use the same due dates as the IRS?`,
      a: noTax
        ? `No. With no state income tax there is no ${state.name} estimated payment and no state ` +
          `voucher to file. Your only quarterly obligation is the federal one.`
        : `${state.name} requires its own estimated payments, but the 2026 dataset carries only the ` +
          `federal 1040-ES dates (${quarters.map((q) => q.due).join(', ')}). Confirm ${state.name}'s ` +
          `own schedule with its tax agency before assuming they line up.`,
      source: `data/states.ts → ${code}.type; data/federal.ts → federal.quarterlyEstimated.quarters`,
    },
  ];
}
