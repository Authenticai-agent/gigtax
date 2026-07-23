/** DependentCareCalculator — child & dependent care credit, 35%→20% by AGI. */
import { useState } from 'react';
import { dependentCareCredit } from '../../lib/credits';
import { formatMoney, formatPct } from '../../lib/tax-engine';

export default function DependentCareCalculator() {
  const [persons, setPersons] = useState(1);
  const [expenses, setExpenses] = useState(6000);
  const [agi, setAgi] = useState(50000);
  const [result, setResult] = useState<ReturnType<typeof dependentCareCredit> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(dependentCareCredit(expenses, persons, agi)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Qualifying people in care</label>
          <select value={persons} onChange={(e) => ed(setPersons)(Number(e.target.value))}>{[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 4 ? '4 or more' : n}</option>)}</select>
          <p className="field-note">Children under 13, or a disabled dependent/spouse.</p></div>
        <div className="form-group"><label>Care expenses paid</label>
          <input type="number" min={0} value={expenses} onChange={(e) => ed(setExpenses)(num(e.target.value))} />
          <p className="field-note">Daycare, after-school, day camp, a nanny.</p></div>
        <div className="form-group"><label>Adjusted gross income</label>
          <input type="number" min={0} value={agi} onChange={(e) => ed(setAgi)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate my credit'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your care expenses and income.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your 2026 child &amp; dependent care credit</h3>
          <div className="result-line"><span>Expenses that count (capped)</span><span className="num">{formatMoney(result.cappedExpenses)}</span></div>
          <div className="result-line"><span>Credit rate at your income</span><span className="num">{formatPct(result.rate)}</span></div>
          <div className="result-line total"><span>Estimated credit</span><span className="num">{formatMoney(result.credit)}</span></div>
          <p className="results-note">
            Expenses are capped at {formatMoney(result.maxExpense)} for {persons >= 2 ? 'two or more people' : 'one person'}. The rate
            starts at 35% and drops one point per $2,000 of income over $15,000, to a 20% floor. This credit is
            non-refundable — it can zero out your tax but not pay you back. Estimate only. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
