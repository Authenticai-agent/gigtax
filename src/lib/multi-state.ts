/**
 * Multi-state income tax — federal on total income, plus each state's tax on the
 * income sourced to it.
 *
 * Ported from multiStateCalculatorView. This is the "I earned money in more than
 * one state" scenario — income cleanly sourced to each state (a mid-year move, a
 * W-2 job in one state and 1099 work in another). It is NOT the "one paycheck,
 * two states both claim it, resolved by a credit" case — that lives in the
 * cross-border guides, and the copy says so.
 *
 * Federal tax and self-employment tax are computed once on the combined income.
 * Business deductions are allocated across states in proportion to each state's
 * income, exactly as the legacy view did.
 *
 * RECIPROCITY is layered on top, off by default. When a resident state is given
 * and a work state has a reciprocity agreement with it, the wages earned in that
 * work state are exempt there and taxed by the resident state instead — which is
 * what reciprocity actually does. It covers wages only, never self-employment
 * income, so 1099 income stays sourced where it was earned. With no resident
 * state supplied the re-sourcing is a no-op and the result matches the legacy
 * engine line for line, which the parity test pins.
 */
import {
  calcSETax, calcQBI, calcFederalTax, calcChildTaxCredit, calcEIC,
  calcStateTax, getStandardDeduction,
} from './tax-engine';
import { states } from '../data/states';
import { hasReciprocity } from '../data/reciprocity';

export interface StateEntry {
  code: string;
  /** W-2 wages sourced to this state. */
  w2: number;
  /** 1099 gross income sourced to this state. */
  se1099: number;
}

export interface MultiStateInput {
  status?: string;
  age65?: boolean;
  dependents?: number;
  totalW2: number;
  total1099: number;
  totalDeductions: number;
  states: StateEntry[];
  /** Optional home state — turns on reciprocity re-sourcing of wages. */
  residentState?: string;
}

export interface StateColumn {
  code: string;
  name: string;
  income: number;
  tax: number;
  /** True when wages were re-sourced away under a reciprocity agreement. */
  reciprocityApplied: boolean;
}

export interface MultiStateResult {
  netSE: number;
  totalIncome: number;
  agi: number;
  standardDeduction: number;
  taxableIncome: number;
  federalTax: number;
  childTaxCredit: number;
  eic: number;
  federalAfterCredits: number;
  seTax: number;
  states: StateColumn[];
  totalStateTax: number;
  totalTax: number;
  effectiveRate: number;
  takeHome: number;
  /** Human-readable summary of any reciprocity re-sourcing that happened. */
  reciprocityNotes: string[];
}

/**
 * Apply reciprocity by moving W-2 wages out of a reciprocal work state and into
 * the resident state's tax base. 1099 income never moves. Returns a fresh set of
 * entries with wages re-sourced, plus a note per pair handled.
 */
function applyReciprocity(
  entries: StateEntry[], residentState: string | undefined,
): { effective: StateEntry[]; notes: string[] } {
  if (!residentState) return { effective: entries, notes: [] };

  const notes: string[] = [];
  // Start from a copy keyed by state, so wages can accumulate onto the resident.
  const byCode = new Map<string, StateEntry>();
  for (const e of entries) {
    const prev = byCode.get(e.code);
    if (prev) { prev.w2 += e.w2; prev.se1099 += e.se1099; }
    else byCode.set(e.code, { code: e.code, w2: e.w2, se1099: e.se1099 });
  }
  if (!byCode.has(residentState)) {
    byCode.set(residentState, { code: residentState, w2: 0, se1099: 0 });
  }
  const resident = byCode.get(residentState)!;

  for (const entry of byCode.values()) {
    if (entry.code === residentState) continue;
    if (entry.w2 > 0 && hasReciprocity(residentState, entry.code)) {
      const moved = entry.w2;
      entry.w2 = 0;
      resident.w2 += moved;
      const rName = states[residentState]?.name ?? residentState;
      const wName = states[entry.code]?.name ?? entry.code;
      notes.push(`${wName} and ${rName} have a reciprocity agreement, so the wages earned in ${wName} are taxed by ${rName} instead.`);
    }
  }
  return { effective: [...byCode.values()], notes };
}

/** Total tax across every state where income was earned, plus federal and SE. */
export function multiStateTax(input: MultiStateInput): MultiStateResult {
  const status = input.status ?? 'single';
  const age65 = input.age65 ?? false;
  const dependents = Math.max(0, input.dependents ?? 0);
  const totalW2 = Math.max(0, input.totalW2);
  const gross1099 = Math.max(0, input.total1099);
  const deductions = Math.max(0, input.totalDeductions);

  // ---- Federal, computed once on the combined income (faithful to legacy) ----
  const netSE = Math.max(0, gross1099 - deductions);
  const se = calcSETax(netSE, undefined, totalW2, status);
  const totalIncome = totalW2 + netSE;
  const agi = totalIncome - se.deductibleHalf;
  const standardDeduction = getStandardDeduction(status, age65);
  const taxableBeforeQBI = Math.max(0, agi - standardDeduction);
  const qbi = calcQBI(netSE, taxableBeforeQBI, status);
  const taxableIncome = Math.max(0, taxableBeforeQBI - qbi);
  const federalTax = calcFederalTax(taxableIncome, status);
  const childTaxCredit = Math.min(calcChildTaxCredit(dependents, agi, status), federalTax);
  const eic = calcEIC(totalIncome, 0, dependents, status);
  const federalAfterCredits = Math.max(0, federalTax - childTaxCredit - eic);

  // ---- State, one column per state where income was sourced --------------
  const { effective, notes } = applyReciprocity(input.states, input.residentState);
  const columns: StateColumn[] = [];
  let totalStateTax = 0;
  for (const entry of effective) {
    const stateW2 = Math.max(0, entry.w2);
    const state1099 = Math.max(0, entry.se1099);
    const stateIncome = stateW2 + state1099;
    if (stateIncome === 0) continue; // a resident state that received no wages
    const stateDed = totalIncome > 0 ? deductions * (stateIncome / totalIncome) : 0;
    const stateNetSE = Math.max(0, state1099 - stateDed);
    const stateSE = stateNetSE > 0 ? calcSETax(stateNetSE, undefined, stateW2, status) : { deductibleHalf: 0 };
    const stateAGI = stateIncome - stateSE.deductibleHalf;
    const tax = calcStateTax(stateAGI, entry.code, undefined, status).tax;
    totalStateTax += tax;
    const original = input.states.find((s) => s.code === entry.code);
    columns.push({
      code: entry.code,
      name: states[entry.code]?.name ?? entry.code,
      income: stateIncome,
      tax,
      reciprocityApplied: !!original && original.w2 > 0 && stateW2 < original.w2,
    });
  }

  const seTax = se.totalSE;
  const totalTax = federalAfterCredits + seTax + totalStateTax;
  const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0;

  return {
    netSE, totalIncome, agi, standardDeduction, taxableIncome,
    federalTax, childTaxCredit, eic, federalAfterCredits,
    seTax, states: columns, totalStateTax, totalTax, effectiveRate,
    takeHome: totalIncome - totalTax,
    reciprocityNotes: notes,
  };
}
