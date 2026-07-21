/**
 * QuickEstimator — the interactive 1099 / self-employment estimate island.
 * Imports the ported tax engine and computes a real 2026 estimate client-side.
 * Can be preset to a state via props. Styled with the MoneyScope brand classes
 * from src/styles/global.css.
 */
import { useMemo, useState } from 'react';
import { calcCombined, formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

interface Props {
  /** Two-letter state code to preset the estimate to (e.g. "OH"). */
  presetState?: string;
  defaultSeIncome?: number;
  defaultW2Income?: number;
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

export default function QuickEstimator({ presetState = 'CA', defaultSeIncome = 40000, defaultW2Income = 0 }: Props) {
  const [seIncome, setSeIncome] = useState(defaultSeIncome);
  const [seDeductions, setSeDeductions] = useState(0);
  const [w2Income, setW2Income] = useState(defaultW2Income);
  const [status, setStatus] = useState<string>('single');
  const [stateCode, setStateCode] = useState(presetState);

  const r = useMemo(
    () => calcCombined(w2Income, seIncome, seDeductions, status, stateCode),
    [w2Income, seIncome, seDeductions, status, stateCode],
  );

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group">
          <label htmlFor="se">Self-employment / 1099 income</label>
          <input id="se" type="number" min={0} value={seIncome} onChange={(e) => setSeIncome(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="ded">Business deductions</label>
          <input id="ded" type="number" min={0} value={seDeductions} onChange={(e) => setSeDeductions(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="w2">W-2 wages (if any)</label>
          <input id="w2" type="number" min={0} value={w2Income} onChange={(e) => setW2Income(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="status">Filing status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="state">State</label>
          <select id="state" value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
            {stateOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>
      </div>

      <div className="results-box">
        <h3>Your 2026 estimate</h3>
        <Line label="Net self-employment income" value={formatMoney(r.netSE)} />
        <Line label="Self-employment tax (15.3% × 92.35%)" value={formatMoney(r.seTax)} />
        <Line label="Federal income tax" value={formatMoney(r.fedTax)} />
        <Line label="State income tax" value={formatMoney(r.stateTax)} />
        <Line label="Total tax" value={formatMoney(r.totalTax)} total />
        <Line label="Effective rate" value={formatPct(r.effectiveRate)} />
        <Line label="After-tax income" value={formatMoney(r.afterTax)} total />
        <p className="results-note">Estimate only. Assumes the standard deduction and no credits. Not tax advice.</p>
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
