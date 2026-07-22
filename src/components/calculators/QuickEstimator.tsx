/**
 * QuickEstimator — the interactive 1099 / self-employment estimate island.
 * Imports the ported tax engine and computes a real 2026 estimate client-side.
 * Styled with the MoneyScope brand classes from src/styles/global.css.
 *
 * Two deliberate behaviours:
 *  - Results stay hidden until Calculate is pressed, and are marked stale when
 *    an input changes afterwards, so it is never ambiguous whether the number
 *    on screen reflects what is in the form.
 *  - Changing State navigates to that state's own page when `stateHrefBase` is
 *    set (hub and homepage), so the URL always names the state being estimated
 *    and the visitor lands on the page with that state's rules and FAQs.
 */
import { useState } from 'react';
import { calcCombined, formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';
import { stateSlug } from '../../lib/slug';

interface Props {
  /** Two-letter state code to preset the estimate to (e.g. "OH"). */
  presetState?: string;
  defaultSeIncome?: number;
  defaultW2Income?: number;
  /**
   * Path prefix for per-state pages, e.g. "/1099-tax-calculator/". When set,
   * picking a state navigates there. Omit to keep the select inert.
   */
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

type Result = ReturnType<typeof calcCombined>;

export default function QuickEstimator({
  presetState = 'CA',
  defaultSeIncome = 40000,
  defaultW2Income = 0,
  stateHrefBase,
}: Props) {
  const [seIncome, setSeIncome] = useState(defaultSeIncome);
  const [seDeductions, setSeDeductions] = useState(0);
  const [w2Income, setW2Income] = useState(defaultW2Income);
  const [status, setStatus] = useState<string>('single');
  const stateCode = presetState;

  const compute = (): Result => calcCombined(w2Income, seIncome, seDeductions, status, stateCode);

  const [result, setResult] = useState<Result | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));

  /** Any edit invalidates a shown result until Calculate is pressed again. */
  const edited = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    if (result) setStale(true);
  };

  const calculate = () => {
    setResult(compute());
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
          <label htmlFor="state">State</label>
          <select
            id="state"
            value={stateCode}
            onChange={(e) => goToState(e.target.value)}
            disabled={!stateHrefBase}
          >
            {stateOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          {stateHrefBase && <p className="field-note">Switching state opens that state's page.</p>}
        </div>
        <div className="form-group">
          <label htmlFor="se">Self-employment / 1099 income</label>
          <input id="se" type="number" min={0} value={seIncome} onChange={(e) => edited(setSeIncome)(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="ded">Business deductions</label>
          <input id="ded" type="number" min={0} value={seDeductions} onChange={(e) => edited(setSeDeductions)(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="w2">W-2 wages (if any)</label>
          <input id="w2" type="number" min={0} value={w2Income} onChange={(e) => edited(setW2Income)(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="status">Filing status</label>
          <select id="status" value={status} onChange={(e) => edited(setStatus)(e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calculate}>
          {result ? 'Recalculate' : 'Calculate'}
        </button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>

      <div>
        {result === null ? (
          <div className="results-placeholder">
            <p>Enter your numbers and press Calculate to see your 2026 estimate.</p>
          </div>
        ) : (
          <div className={stale ? 'results-box is-stale' : 'results-box'}>
            <h3>Your 2026 estimate — {states[stateCode]?.name}</h3>
            <Line label="Net self-employment income" value={formatMoney(result.netSE)} />
            <Line label="Self-employment tax (15.3% × 92.35%)" value={formatMoney(result.seTax)} />
            <Line label="Federal income tax" value={formatMoney(result.fedTax)} />
            <Line label={`${states[stateCode]?.name} income tax`} value={formatMoney(result.stateTax)} />
            <Line label="Total tax" value={formatMoney(result.totalTax)} total />
            <Line label="Effective rate" value={formatPct(result.effectiveRate)} />
            <Line label="After-tax income" value={formatMoney(result.afterTax)} total />
            <p className="results-note">Estimate only. Assumes the standard deduction and no credits. Not tax advice.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Line({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return (
    <div className={total ? 'result-line total' : 'result-line'}>
      <span>{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}
