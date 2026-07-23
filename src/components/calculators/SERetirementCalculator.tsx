/** SERetirementCalculator — solo 401(k) and SEP-IRA contribution limits. */
import { useState } from 'react';
import { seRetirement } from '../../lib/se-business';
import { formatMoney } from '../../lib/tax-engine';

export default function SERetirementCalculator() {
  const [profit, setProfit] = useState(100000);
  const [age, setAge] = useState(40);
  const [result, setResult] = useState<ReturnType<typeof seRetirement> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(seRetirement(profit, age)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Net self-employment profit</label>
          <input type="number" min={0} value={profit} onChange={(e) => ed(setProfit)(num(e.target.value))} />
          <p className="field-note">Schedule C net profit.</p></div>
        <div className="form-group"><label>Your age</label>
          <input type="number" min={18} max={100} value={age} onChange={(e) => ed(setAge)(num(e.target.value))} />
          <p className="field-note">Catch-ups start at 50; 60–63 get more.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'What can I contribute?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your net profit and age.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your 2026 retirement contribution room</h3>
          <div className="result-line"><span>Net self-employment earnings (after ½ SE tax)</span><span className="num">{formatMoney(result.netSEEarnings)}</span></div>
          <p className="section-label">Solo 401(k)</p>
          <div className="result-line"><span>Employee deferral</span><span className="num">{formatMoney(result.soloEmployeeDeferral)}</span></div>
          <div className="result-line"><span>Employer profit-sharing (≈20%)</span><span className="num">{formatMoney(result.employerContribution)}</span></div>
          <div className="result-line total"><span>Solo 401(k) total (capped at {formatMoney(result.combinedMax)})</span><span className="num">{formatMoney(result.soloTotal)}</span></div>
          <p className="section-label">SEP-IRA</p>
          <div className="result-line total"><span>SEP-IRA total</span><span className="num">{formatMoney(result.sepTotal)}</span></div>
          <p className="results-note">
            A solo 401(k) usually lets you save more at low-to-mid incomes because it adds the employee deferral on
            top of the ~20%-of-earnings employer piece; a SEP is simpler but has no deferral. The employer piece is
            20% of net self-employment earnings (profit less half your SE tax). Contributions are deductible. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
