/** EITCCalculator — earned income tax credit. Exact for single/HOH; MFJ approx. */
import { useState } from 'react';
import { eitc } from '../../lib/credits';
import { formatMoney } from '../../lib/tax-engine';

const STATUSES = [
  ['single', 'Single'], ['hoh', 'Head of household'], ['mfj', 'Married filing jointly'],
] as const;

export default function EITCCalculator() {
  const [status, setStatus] = useState('single');
  const [earned, setEarned] = useState(22000);
  const [investment, setInvestment] = useState(0);
  const [children, setChildren] = useState(1);
  const [result, setResult] = useState<ReturnType<typeof eitc> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(eitc(earned, investment, children, status)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Earned income (wages + self-employment)</label>
          <input type="number" min={0} value={earned} onChange={(e) => ed(setEarned)(num(e.target.value))} /></div>
        <div className="form-group"><label>Qualifying children</label>
          <select value={children} onChange={(e) => ed(setChildren)(Number(e.target.value))}>{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n === 3 ? '3 or more' : n}</option>)}</select></div>
        <div className="form-group"><label>Investment income</label>
          <input type="number" min={0} value={investment} onChange={(e) => ed(setInvestment)(num(e.target.value))} />
          <p className="field-note">Over $12,200 disqualifies you.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate my EITC'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your earned income and family size.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your 2026 earned income credit</h3>
          {result.investmentDisqualified ? (
            <p className="results-note">Your investment income is over the $12,200 limit, which disqualifies you from the EITC regardless of earned income.</p>
          ) : (
            <>
              <div className="result-line total"><span>Estimated credit</span><span className="num">{formatMoney(result.credit)}</span></div>
              <div className="result-line"><span>Maximum credit at your family size</span><span className="num">{formatMoney(result.maxCredit)}</span></div>
              <div className="result-line"><span>Credit reaches zero at</span><span className="num">{formatMoney(result.incomeLimit)}</span></div>
            </>
          )}
          <p className="results-note">
            The EITC is fully refundable — you get it even if you owe no tax. It phases in as you earn, plateaus,
            then phases out. Estimate only; the IRS EITC Assistant is the authoritative check. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
