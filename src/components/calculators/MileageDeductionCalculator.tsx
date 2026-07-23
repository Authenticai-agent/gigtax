/** MileageDeductionCalculator — 2026 standard mileage, split at the July rate change. */
import { useState } from 'react';
import { mileageDeduction, MILEAGE_RATE_H1, MILEAGE_RATE_H2 } from '../../lib/gig-economics';
import { formatMoney } from '../../lib/tax-engine';

export default function MileageDeductionCalculator() {
  const [milesH1, setMilesH1] = useState(6000);
  const [milesH2, setMilesH2] = useState(6000);
  const [result, setResult] = useState<ReturnType<typeof mileageDeduction> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(mileageDeduction(milesH1, milesH2)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Business miles Jan 1 – Jun 30</label>
          <input type="number" min={0} value={milesH1} onChange={(e) => ed(setMilesH1)(num(e.target.value))} />
          <p className="field-note">Rate: {(MILEAGE_RATE_H1 * 100).toFixed(1)}¢ per mile.</p></div>
        <div className="form-group"><label>Business miles Jul 1 – Dec 31</label>
          <input type="number" min={0} value={milesH2} onChange={(e) => ed(setMilesH2)(num(e.target.value))} />
          <p className="field-note">Rate: {(MILEAGE_RATE_H2 * 100).toFixed(1)}¢ per mile.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate my deduction'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your business miles for each half of the year.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your 2026 standard mileage deduction</h3>
          <div className="result-line"><span>{formatMoney(result.milesFirstHalf)} mi × {(MILEAGE_RATE_H1 * 100).toFixed(1)}¢ (Jan–Jun)</span><span className="num">{formatMoney(result.deductionFirstHalf)}</span></div>
          <div className="result-line"><span>{formatMoney(result.milesSecondHalf)} mi × {(MILEAGE_RATE_H2 * 100).toFixed(1)}¢ (Jul–Dec)</span><span className="num">{formatMoney(result.deductionSecondHalf)}</span></div>
          <div className="result-line total"><span>Total deduction ({formatMoney(result.totalMiles)} miles)</span><span className="num">{formatMoney(result.totalDeduction)}</span></div>
          <div className="result-line"><span>Blended rate</span><span className="num">{(result.blendedRate * 100).toFixed(2)}¢/mi</span></div>
          <p className="results-note">
            2026 has two business rates — 72.5¢ through June 30, 76¢ from July 1 (IRS Notice 2026-10 and
            Announcement 2026-11), so a full year must be split at that date. This is a deduction, not a refund: it
            reduces taxable profit. You cannot use the standard rate on a vehicle you have depreciated. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
