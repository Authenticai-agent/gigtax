/** SecondIncomeCalculator — what a second household income really keeps. */
import { useState } from 'react';
import { secondIncomeBreakeven } from '../../lib/work-decisions';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function SecondIncomeCalculator() {
  const [first, setFirst] = useState(90000);
  const [second, setSecond] = useState(40000);
  const [stateCode, setStateCode] = useState('');
  const [childcare, setChildcare] = useState(12000);
  const [workCosts, setWorkCosts] = useState(3000);
  const [result, setResult] = useState<ReturnType<typeof secondIncomeBreakeven> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(secondIncomeBreakeven(first, second, 'mfj', stateCode, childcare, workCosts)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>First earner's income</label><input type="number" min={0} value={first} onChange={(e) => ed(setFirst)(num(e.target.value))} /></div>
        <div className="form-group"><label>Second job's salary</label><input type="number" min={0} value={second} onChange={(e) => ed(setSecond)(num(e.target.value))} /></div>
        <div className="form-group"><label>Extra childcare it requires</label><input type="number" min={0} value={childcare} onChange={(e) => ed(setChildcare)(num(e.target.value))} /><p className="field-note">Daycare, after-school — the big one.</p></div>
        <div className="form-group"><label>Commuting & work costs</label><input type="number" min={0} value={workCosts} onChange={(e) => ed(setWorkCosts)(num(e.target.value))} /></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{!stateCode && <option value="">Federal only</option>}{stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Is the second job worth it?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter both incomes and the costs of the second job.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.worthIt ? 'The second job keeps' : 'The second job barely pays'} {formatMoney(Math.max(0, result.netKept))}</h3>
          <div className="result-line"><span>Second salary</span><span className="num">{formatMoney(result.secondIncome)}</span></div>
          <div className="result-line"><span>FICA (7.65%)</span><span className="num">− {formatMoney(result.fica)}</span></div>
          <div className="result-line"><span>Federal tax (at your marginal rate)</span><span className="num">− {formatMoney(result.marginalFederalTax)}</span></div>
          {result.marginalStateTax > 0 && <div className="result-line"><span>State tax</span><span className="num">− {formatMoney(result.marginalStateTax)}</span></div>}
          <div className="result-line"><span>Childcare</span><span className="num">− {formatMoney(result.childcareCost)}</span></div>
          <div className="result-line"><span>Commuting & work costs</span><span className="num">− {formatMoney(result.workCosts)}</span></div>
          <div className="result-line total"><span>Actually kept</span><span className="num">{formatMoney(result.netKept)}</span></div>
          <div className="result-line"><span>Keep-rate on the second salary</span><span className="num">{formatPct(result.keepRate)}</span></div>
          <p className="results-note">
            The second income is taxed on top of the first, at the household's marginal rate — not from zero — so it
            keeps far less per dollar than the first job. Childcare is usually what decides it. This does not count the
            long-term value of staying in the workforce or the child-and-dependent-care credit. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
