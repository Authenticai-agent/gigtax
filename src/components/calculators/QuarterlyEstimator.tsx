/**
 * QuarterlyEstimator — works out what to send the IRS (and the state) on each
 * 1040-ES due date. Shares the ported tax engine with the annual estimator, so
 * the two can never disagree.
 *
 * Same two behaviours as QuickEstimator: results wait for an explicit Calculate
 * press, and picking a state navigates to that state's own quarterly page so
 * the URL always names the state being estimated.
 */
import { useState } from 'react';
import { calcCombined, formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';
import { stateSlug } from '../../lib/slug';
import { federal } from '../../data/federal';

interface Props {
  presetState?: string;
  defaultSeIncome?: number;
  /** Path prefix for per-state quarterly pages, e.g. "/quarterly-tax-calculator/". */
  stateHrefBase?: string;
}

const STATUSES = [
  ['single', 'Single'],
  ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'],
  ['mfs', 'Married filing separately'],
] as const;

const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

const QUARTERS = federal.quarterlyEstimated.quarters as unknown as Array<Record<string, string>>;
const MIN_TO_OWE = Number(
  (federal.quarterlyEstimated.safeHarborRules as Record<string, unknown>).minimumToOweEstimated,
);

function dueLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return `${month} ${d}, ${y}`;
}

interface Plan {
  stateName: string;
  federalYear: number;
  stateYear: number;
  totalYear: number;
  perQuarterFederal: number;
  perQuarterState: number;
  perQuarterTotal: number;
  /** Prior-year safe harbor, when the visitor supplied a prior-year figure. */
  priorHarbor: number | null;
  priorHarborRate: number;
  required: boolean;
}

export default function QuarterlyEstimator({
  presetState = '',
  defaultSeIncome = 50000,
  stateHrefBase,
}: Props) {
  const [seIncome, setSeIncome] = useState(defaultSeIncome);
  const [seDeductions, setSeDeductions] = useState(0);
  const [status, setStatus] = useState<string>('single');
  const [priorYearTax, setPriorYearTax] = useState(0);
  const [priorYearAGI, setPriorYearAGI] = useState(0);
  const stateCode = presetState;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));

  const edited = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    if (plan) setStale(true);
  };

  const calculate = () => {
    const r = calcCombined(0, seIncome, seDeductions, status, stateCode);
    const federalYear = r.fedTax + r.seTax;
    const stateYear = r.stateTax;
    const totalYear = federalYear + stateYear;
    // Route 1: 90% of this year's liability (safeHarborRules.rule1).
    const currentTarget = totalYear * 0.9;
    // Route 2: 100% of last year's tax, 110% above the $150,000 prior-AGI line.
    const priorHarborRate = priorYearAGI > 150000 ? 1.1 : 1.0;
    const priorHarbor = priorYearTax > 0 ? priorYearTax * priorHarborRate : null;
    setPlan({
      stateName: states[stateCode]?.name ?? '',
      federalYear,
      stateYear,
      totalYear,
      perQuarterFederal: (federalYear * 0.9) / 4,
      perQuarterState: (stateYear * 0.9) / 4,
      perQuarterTotal: currentTarget / 4,
      priorHarbor,
      priorHarborRate,
      required: totalYear >= MIN_TO_OWE,
    });
    setStale(false);
  };

  const goToState = (code: string) => {
    if (!stateHrefBase || code === stateCode) return;
    const name = states[code]?.name;
    if (name) window.location.href = `${stateHrefBase}${stateSlug(name)}/`;
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group">
          <label htmlFor="q-state">State</label>
          <select id="q-state" value={stateCode} onChange={(e) => goToState(e.target.value)} disabled={!stateHrefBase}>
            {!stateCode && <option value="">Select your state…</option>}
            {stateOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          {stateHrefBase && <p className="field-note">Switching state opens that state's page.</p>}
        </div>
        <div className="form-group">
          <label htmlFor="q-se">Expected 1099 income this year</label>
          <input id="q-se" type="number" min={0} value={seIncome} onChange={(e) => edited(setSeIncome)(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="q-ded">Business deductions</label>
          <input id="q-ded" type="number" min={0} value={seDeductions} onChange={(e) => edited(setSeDeductions)(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="q-status">Filing status</label>
          <select id="q-status" value={status} onChange={(e) => edited(setStatus)(e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="q-prior">Last year's total tax (optional)</label>
          <input id="q-prior" type="number" min={0} value={priorYearTax} onChange={(e) => edited(setPriorYearTax)(num(e.target.value))} />
          <p className="field-note">Line 24 of your prior 1040 — unlocks the prior-year safe harbor.</p>
        </div>
        <div className="form-group">
          <label htmlFor="q-agi">Last year's AGI (optional)</label>
          <input id="q-agi" type="number" min={0} value={priorYearAGI} onChange={(e) => edited(setPriorYearAGI)(num(e.target.value))} />
          <p className="field-note">Above $150,000 the prior-year target rises to 110%.</p>
        </div>
      </div>

      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calculate}>
          {plan ? 'Recalculate' : 'Calculate'}
        </button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>

      {plan === null ? (
        <div className="results-placeholder">
          <p>Enter what you expect to earn and press Calculate to see each payment.</p>
        </div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your 2026 payment schedule{plan.stateName ? ` — ${plan.stateName}` : ''}</h3>
          {!plan.required && (
            <p className="results-note">
              Estimated tax of {formatMoney(plan.totalYear)} for the year is below the{' '}
              {formatMoney(MIN_TO_OWE)} threshold, so quarterly payments aren't required — you can settle it when you file.
            </p>
          )}
          <table className="quarter-table">
            <thead>
              <tr><th>Due</th><th>Period</th><th>To the IRS</th><th>{plan.stateName || 'To your state'}</th></tr>
            </thead>
            <tbody>
              {QUARTERS.map((q) => (
                <tr key={q.quarter}>
                  <td>{dueLabel(q.dueDate)}</td>
                  <td>{q.periodLabel}</td>
                  <td>{formatMoney(plan.perQuarterFederal)}</td>
                  <td>{!plan.stateName ? 'select a state' : plan.stateYear > 0 ? formatMoney(plan.perQuarterState) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="result-line total">
            <span>Total for the year (90% route)</span>
            <span className="num">{formatMoney(plan.perQuarterTotal * 4)}</span>
          </div>
          {plan.priorHarbor !== null && (
            <div className="result-line">
              <span>Prior-year safe harbor ({Math.round(plan.priorHarborRate * 100)}% of last year)</span>
              <span className="num">{formatMoney(plan.priorHarbor)}</span>
            </div>
          )}
          <p className="results-note">
            {plan.priorHarbor !== null
              ? `Paying the lower of the two totals keeps you inside the safe harbor. `
              : `Add last year's tax above to compare against the prior-year safe harbor. `}
            Estimate only. Assumes the standard deduction, no credits and no W-2 withholding. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
