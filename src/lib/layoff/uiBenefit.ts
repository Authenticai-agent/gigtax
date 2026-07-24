/**
 * Unemployment benefit estimator (task_layoff.md Phase 2).
 *
 * Each state computes the weekly benefit differently (high quarter, two high
 * quarters, average weekly wage, annual wages). Rather than reimplement 50+
 * formulas in v1, this uses each state's verified parameters — max, min,
 * duration, method, waiting week, dependent allowance, tax treatment — from the
 * sourced ui_by_state.json, and applies a labeled ~50%-replacement estimate
 * bounded by the state's own min and max. It is explicitly an estimate; the real
 * amount is whatever the state agency determines, and the page links there.
 */
import uiData from '../../data/layoff/ui_by_state.json';

const UI = uiData as Record<string, any>;

/** Most states replace roughly half of average weekly wage up to the state cap. */
const REPLACEMENT_RATE = 0.5;

export interface UiInput {
  stateCode: string;
  /** Prior annual wage (the estimator derives an average weekly wage from it). */
  priorAnnualWage: number;
  dependents: number;
}

export interface UiResult {
  state: string;
  estimatedWeeklyBenefit: number;
  maxWeekly: number;
  minWeekly: number;
  atStateMax: boolean;
  dependentAllowance: number;
  durationWeeks: number | null;
  durationNote: string | null;
  totalPotential: number;
  waitingWeek: boolean | null;
  firstCheckNote: string;
  benefitMethod: string | null;
  severanceOffsetNote: string;
  uiTaxedByState: boolean | null;
  taxNote: string;
  agencyName: string | null;
  filingUrl: string | null;
  isEstimate: true;
}

export function uiBenefit(i: UiInput): UiResult {
  const s = UI[i.stateCode];
  if (!s) throw new Error(`Unknown state: ${i.stateCode}`);

  const avgWeeklyWage = i.priorAnnualWage / 52;
  const raw = avgWeeklyWage * REPLACEMENT_RATE;
  const base = Math.min(s.max_weekly ?? raw, Math.max(s.min_weekly ?? 0, raw));

  // Dependent allowance: a flat per-dependent amount where the state pays one.
  const perDep = typeof s.dependent_allowance === 'number' ? s.dependent_allowance : 0;
  const dependentAllowance = perDep * Math.max(0, i.dependents);
  const estimatedWeeklyBenefit = Math.round(base + dependentAllowance);
  const atStateMax = base >= (s.max_weekly ?? Infinity);

  const durationWeeks = typeof s.duration_weeks === 'number' ? s.duration_weeks : null;
  const totalPotential = durationWeeks ? Math.round(estimatedWeeklyBenefit * durationWeeks) : 0;

  const firstCheckNote = s.waiting_week === true
    ? `${s.state} has an unpaid one-week waiting week, so your first payment covers the second week you claim.`
    : s.waiting_week === false
      ? `${s.state} has no waiting week — benefits can start from your first eligible week.`
      : `Whether ${s.state} imposes a waiting week could not be confirmed; check the agency page.`;

  const severanceOffsetNote = s.severance_offset_note
    || `Some states delay or reduce unemployment while severance is being paid, and the rule varies. ${s.state}'s treatment is not modeled here — confirm the timing with ${s.agency_name ?? 'the agency'} before you file, since it is a real-money decision.`;

  const taxNote = s.ui_taxed_by_state === true
    ? `Unemployment is taxable federally (optional 10% withholding via Form W-4V) and ${s.state} also taxes it on the state return.`
    : s.ui_taxed_by_state === false
      ? `Unemployment is taxable federally (optional 10% withholding via Form W-4V), but ${s.state} does not tax it on the state return.`
      : `Unemployment is taxable federally; ${s.state}'s state treatment could not be confirmed.`;

  return {
    state: s.state,
    estimatedWeeklyBenefit,
    maxWeekly: s.max_weekly,
    minWeekly: s.min_weekly,
    atStateMax,
    dependentAllowance: Math.round(dependentAllowance),
    durationWeeks,
    durationNote: s.duration_note ?? null,
    totalPotential,
    waitingWeek: s.waiting_week,
    firstCheckNote,
    benefitMethod: s.benefit_method ?? null,
    severanceOffsetNote,
    uiTaxedByState: s.ui_taxed_by_state,
    taxNote,
    agencyName: s.agency_name ?? null,
    filingUrl: s.filing_url ?? null,
    isEstimate: true,
  };
}
