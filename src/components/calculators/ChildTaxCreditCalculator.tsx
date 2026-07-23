/** ChildTaxCreditCalculator — CTC with the $200k/$400k phase-out. */
import { useState } from 'react';
import { childTaxCredit } from '../../lib/credits';
import { formatMoney } from '../../lib/tax-engine';

const STATUSES = [
  ['single', 'Single / head of household'], ['mfj', 'Married filing jointly'],
] as const;

export default function ChildTaxCreditCalculator() {
  const [status, setStatus] = useState('single');
  const [children, setChildren] = useState(2);
  const [agi, setAgi] = useState(100000);
  const [result, setResult] = useState<ReturnType<typeof childTaxCredit> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(childTaxCredit(children, agi, status)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Qualifying children under 17</label>
          <input type="number" min={0} max={15} value={children} onChange={(e) => ed(setChildren)(num(e.target.value))} /></div>
        <div className="form-group"><label>Adjusted gross income</label>
          <input type="number" min={0} value={agi} onChange={(e) => ed(setAgi)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate my credit'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your children and income.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your 2026 child tax credit</h3>
          <div className="result-line total"><span>Total credit</span><span className="num">{formatMoney(result.credit)}</span></div>
          <div className="result-line"><span>Per child</span><span className="num">{formatMoney(result.perChild)}</span></div>
          <div className="result-line"><span>Refundable portion (get back even with no tax)</span><span className="num">{formatMoney(result.refundablePortion)}</span></div>
          {result.fullyPhasedOut && <div className="result-line"><span>Status</span><span className="num">Fully phased out</span></div>}
          <p className="results-note">
            The credit is {formatMoney(result.perChild)} per child, reduced by $50 for every $1,000 of income over
            {' '}{formatMoney(result.phaseoutStart)}. Up to $1,700 per child is refundable. Estimate only. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
