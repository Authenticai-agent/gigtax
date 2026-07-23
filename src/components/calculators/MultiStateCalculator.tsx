/**
 * MultiStateCalculator — federal tax on total income plus each state's tax on
 * the income sourced to it, with optional reciprocity re-sourcing of wages.
 * All math is in src/lib/multi-state.ts; this island only collects inputs.
 */
import { useState } from 'react';
import { multiStateTax, type StateEntry } from '../../lib/multi-state';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;
const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

export default function MultiStateCalculator() {
  const [status, setStatus] = useState('single');
  const [age65, setAge65] = useState(false);
  const [dependents, setDependents] = useState(0);
  const [totalW2, setTotalW2] = useState(85000);
  const [total1099, setTotal1099] = useState(25000);
  const [totalDeductions, setTotalDeductions] = useState(5000);
  const [residentState, setResidentState] = useState('');
  const [rows, setRows] = useState<StateEntry[]>([
    { code: 'CA', w2: 50000, se1099: 15000 },
    { code: 'NY', w2: 35000, se1099: 10000 },
  ]);
  const [result, setResult] = useState<ReturnType<typeof multiStateTax> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const touch = () => { if (result) setStale(true); };
  const setRow = (i: number, patch: Partial<StateEntry>) => {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row))); touch();
  };
  const addRow = () => { setRows((r) => [...r, { code: 'TX', w2: 0, se1099: 0 }]); touch(); };
  const removeRow = (i: number) => { setRows((r) => r.filter((_, j) => j !== i)); touch(); };

  const calculate = () => {
    setResult(multiStateTax({
      status, age65, dependents, totalW2, total1099, totalDeductions,
      states: rows, residentState: residentState || undefined,
    }));
    setStale(false);
  };

  return (
    <div className="calc-panel">
      <p className="section-label">Federal profile and total income</p>
      <div className="calc-grid">
        <div className="form-group">
          <label>Filing status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); touch(); }}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Children under 17</label>
          <input type="number" min={0} max={20} value={dependents} onChange={(e) => { setDependents(num(e.target.value)); touch(); }} />
        </div>
        <div className="form-group">
          <label>Total W-2 wages (all states)</label>
          <input type="number" min={0} value={totalW2} onChange={(e) => { setTotalW2(num(e.target.value)); touch(); }} />
        </div>
        <div className="form-group">
          <label>Total 1099 gross (all states)</label>
          <input type="number" min={0} value={total1099} onChange={(e) => { setTotal1099(num(e.target.value)); touch(); }} />
        </div>
        <div className="form-group">
          <label>Total business deductions</label>
          <input type="number" min={0} value={totalDeductions} onChange={(e) => { setTotalDeductions(num(e.target.value)); touch(); }} />
        </div>
        <div className="form-group">
          <label>Home state (for reciprocity)</label>
          <select value={residentState} onChange={(e) => { setResidentState(e.target.value); touch(); }}>
            <option value="">None / not sure</option>
            {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
          <p className="field-note">If a work state has a wage-reciprocity deal with your home state, those wages move home.</p>
        </div>
      </div>

      <p className="section-label">Income by state</p>
      {rows.map((row, i) => (
        <div className="calc-grid" key={i}>
          <div className="form-group">
            <label>State {i + 1}</label>
            <select value={row.code} onChange={(e) => setRow(i, { code: e.target.value })}>
              {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>W-2 wages here</label>
            <input type="number" min={0} value={row.w2} onChange={(e) => setRow(i, { w2: num(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>1099 income here</label>
            <input type="number" min={0} value={row.se1099} onChange={(e) => setRow(i, { se1099: num(e.target.value) })} />
          </div>
          <div className="form-group" style={{ alignSelf: 'end' }}>
            {rows.length > 1 && <button type="button" className="btn-secondary" onClick={() => removeRow(i)}>Remove state {i + 1}</button>}
          </div>
        </div>
      ))}
      <div className="calc-actions">
        <button type="button" className="btn-secondary" onClick={addRow}>Add a state</button>
        <button type="button" className="btn-calculate" onClick={calculate}>{result ? 'Recalculate' : 'Calculate total tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>

      {result === null ? (
        <div className="results-placeholder"><p>Enter your income and the states where you earned it.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Total 2026 tax across {result.states.length} state{result.states.length === 1 ? '' : 's'}</h3>
          <div className="result-line"><span>Total income</span><span className="num">{formatMoney(result.totalIncome)}</span></div>
          <div className="result-line"><span>Federal tax after credits</span><span className="num">{formatMoney(result.federalAfterCredits)}</span></div>
          <div className="result-line"><span>Self-employment tax</span><span className="num">{formatMoney(result.seTax)}</span></div>
          {result.states.map((s) => (
            <div className="result-line" key={s.code}>
              <span>{s.name} tax{s.reciprocityApplied ? ' (wages re-sourced home)' : ''} on {formatMoney(s.income)}</span>
              <span className="num">{formatMoney(s.tax)}</span>
            </div>
          ))}
          <div className="result-line total"><span>Total state tax</span><span className="num">{formatMoney(result.totalStateTax)}</span></div>
          <div className="result-line total"><span>Total tax owed</span><span className="num">{formatMoney(result.totalTax)}</span></div>
          <div className="result-line"><span>Effective rate</span><span className="num">{formatPct(result.effectiveRate)}</span></div>
          <div className="result-line total"><span>Take-home</span><span className="num">{formatMoney(result.takeHome)}</span></div>
          {result.reciprocityNotes.map((n, i) => <p className="results-note" key={i}>{n}</p>)}
          <p className="results-note">
            Each state taxes only the income sourced to it, and business deductions are split across states in
            proportion to income. This assumes clean sourcing — for one paycheck two states both claim, resolved
            by a credit, see the <a href="/cross-border-tax/">cross-border guides</a>. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
