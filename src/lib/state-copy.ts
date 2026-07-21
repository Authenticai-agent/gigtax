/**
 * Server-side helpers that turn verified state data into page prose.
 * Numbers here come straight from src/data — never hand-written — so a data
 * update regenerates the copy correctly and the text can't drift from the engine.
 */
import type { StateData } from '../data/types';
import { formatMoney } from './tax-engine';

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
