/**
 * State estate and inheritance tax. Two different taxes that only a dozen-odd
 * states levy, from the signed-off dataset:
 *  - Estate tax is paid by the estate on value above a state exemption. 13
 *    jurisdictions have one (Oregon's exemption is just $1m; Washington's top
 *    rate is 35% for the first half of 2026).
 *  - Inheritance tax is paid by the HEIR and the rate depends on the
 *    relationship — spouses and children usually pay nothing, distant heirs pay
 *    the most. 5 states have one; Maryland has both.
 *
 * Estate tax is modeled as the top marginal rate on the amount over the
 * exemption; the true schedules are graduated, so the figure is an estimate for
 * smaller taxable estates and the copy says so. New York's cliff and
 * Washington's mid-2026 rate change are surfaced as notes, not modeled.
 */
import { stateDeathTax } from '../data/state-inheritance';
import { states } from '../data/states';

export type HeirClass = 'spouse' | 'lineal' | 'sibling' | 'other';

export interface StateEstateResult {
  hasTax: boolean;
  stateName: string;
  exemption: number | null;
  taxableEstate: number;
  topRate: number | null;
  estimatedTax: number;
  note: string | null;
}

/** State estate tax on an estate's total value. */
export function stateEstateTax(stateCode: string, estateValue: number): StateEstateResult {
  const rule = (stateDeathTax as any)[stateCode];
  const stateName = states[stateCode]?.name ?? stateCode;
  const value = Math.max(0, estateValue);
  if (!rule || !rule.hasEstateTax) {
    return { hasTax: false, stateName, exemption: null, taxableEstate: 0, topRate: null, estimatedTax: 0, note: null };
  }
  const taxableEstate = Math.max(0, value - (rule.estateExemption ?? 0));
  return {
    hasTax: true,
    stateName,
    exemption: rule.estateExemption,
    taxableEstate,
    topRate: rule.estateTopRate,
    estimatedTax: Math.round(taxableEstate * (rule.estateTopRate ?? 0)),
    note: rule.estateNote ?? null,
  };
}

export interface StateInheritanceResult {
  hasTax: boolean;
  stateName: string;
  heirClass: HeirClass;
  rate: number;
  estimatedTax: number;
  note: string | null;
}

/** State inheritance tax on an amount received by an heir of a given class. */
export function stateInheritanceTax(
  stateCode: string, inheritanceAmount: number, heirClass: HeirClass = 'other',
): StateInheritanceResult {
  const rule = (stateDeathTax as any)[stateCode];
  const stateName = states[stateCode]?.name ?? stateCode;
  const amount = Math.max(0, inheritanceAmount);
  if (!rule || !rule.hasInheritanceTax || !rule.inheritance) {
    return { hasTax: false, stateName, heirClass, rate: 0, estimatedTax: 0, note: null };
  }
  const rate = rule.inheritance[heirClass] ?? rule.inheritance.other ?? 0;
  return {
    hasTax: true,
    stateName,
    heirClass,
    rate,
    estimatedTax: Math.round(amount * rate),
    note: rule.inheritanceNote ?? null,
  };
}

export interface StateDeathTaxResult {
  estate: StateEstateResult;
  inheritance: StateInheritanceResult;
  /** True when the state levies neither tax — the common case (34 states). */
  neither: boolean;
}

/** Both state death taxes at once — most states have neither. */
export function stateDeathTaxes(
  stateCode: string, estateValue: number, inheritanceAmount: number, heirClass: HeirClass = 'other',
): StateDeathTaxResult {
  const estate = stateEstateTax(stateCode, estateValue);
  const inheritance = stateInheritanceTax(stateCode, inheritanceAmount, heirClass);
  return { estate, inheritance, neither: !estate.hasTax && !inheritance.hasTax };
}
