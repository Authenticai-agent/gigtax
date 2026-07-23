/** W2GCalculator — 24% W-2G withholding vs actual tax owed. */
import { useState } from 'react';
import { w2gReconcile } from '../../lib/gambling';
import { formatMoney } from '../../lib/tax-engine';

export default function W2GCalculator() {
  const [winnings, setWinnings] = useState(10000);
  const [other, setOther] = useState(60000);
  const [losses, setLosses] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof w2gReconcile> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(w2gReconcile(winnings, other, losses, 'single', 0)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Winnings on the W-2G</label><input type="number" min={0} value={winnings} onChange={(e) => ed(setWinnings)(num(e.target.value))} /></div>
        <div className="form-group"><label>Your other taxable income</label><input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>Gambling losses (if itemizing)</label><input type="number" min={0} value={losses} onChange={(e) => ed(setLosses)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Reconcile the withholding'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter the W-2G winnings and your income.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>W-2G withholding vs actual tax</h3>
          <div className="result-line"><span>24% federal withheld on the W-2G</span><span className="num">{formatMoney(result.federalWithheld)}</span></div>
          <div className="result-line"><span>Actual federal tax the winnings cause</span><span className="num">{formatMoney(result.actualFederalTax)}</span></div>
          <div className="result-line total"><span>{result.difference >= 0 ? 'Over-withheld (refund)' : 'Under-withheld (you owe)'}</span><span className="num">{formatMoney(Math.abs(result.difference))}</span></div>
          <p className="results-note">
            The flat 24% withholding is a prepayment, not your final tax. In a lower bracket it over-withholds and you
            get the excess back; in a higher bracket it under-withholds and you owe more. State tax is on top and
            usually not withheld. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
