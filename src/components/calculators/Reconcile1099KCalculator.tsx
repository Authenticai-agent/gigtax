/** Reconcile1099KCalculator — 1099-K gross down to actual taxable profit. */
import { useState } from 'react';
import { reconcile1099K } from '../../lib/se-business';
import { formatMoney } from '../../lib/tax-engine';

export default function Reconcile1099KCalculator() {
  const [gross, setGross] = useState(30000);
  const [fees, setFees] = useState(3000);
  const [refunds, setRefunds] = useState(1500);
  const [shipping, setShipping] = useState(2000);
  const [cogs, setCogs] = useState(9000);
  const [other, setOther] = useState(1000);
  const [result, setResult] = useState<ReturnType<typeof reconcile1099K> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(reconcile1099K(gross, fees, refunds, shipping, cogs, other)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>1099-K box 1a (gross)</label>
          <input type="number" min={0} value={gross} onChange={(e) => ed(setGross)(num(e.target.value))} />
          <p className="field-note">The big number — before anything comes out.</p></div>
        <div className="form-group"><label>Platform & payment fees</label>
          <input type="number" min={0} value={fees} onChange={(e) => ed(setFees)(num(e.target.value))} /></div>
        <div className="form-group"><label>Refunds & returns</label>
          <input type="number" min={0} value={refunds} onChange={(e) => ed(setRefunds)(num(e.target.value))} /></div>
        <div className="form-group"><label>Shipping you charged buyers</label>
          <input type="number" min={0} value={shipping} onChange={(e) => ed(setShipping)(num(e.target.value))} />
          <p className="field-note">Counted in the 1099-K, offset by postage cost.</p></div>
        <div className="form-group"><label>Cost of goods sold</label>
          <input type="number" min={0} value={cogs} onChange={(e) => ed(setCogs)(num(e.target.value))} /></div>
        <div className="form-group"><label>Other deductions</label>
          <input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Reconcile my 1099-K'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your 1099-K gross and what came out of it.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>From 1099-K gross to taxable profit</h3>
          <div className="result-line"><span>1099-K gross (box 1a)</span><span className="num">{formatMoney(result.gross)}</span></div>
          <div className="result-line"><span>Total deductions to reconcile</span><span className="num">− {formatMoney(result.deductions)}</span></div>
          <div className="result-line total"><span>Actual taxable profit</span><span className="num">{formatMoney(result.netTaxable)}</span></div>
          <p className="results-note">
            The 1099-K reports gross payments, including fees, refunds and shipping — it is not your income. Report
            the gross on your return, then deduct these costs so you are taxed on the {formatMoney(result.netTaxable)}
            {' '}you actually profited, not the {formatMoney(result.gross)} that passed through. Keep records for each
            line. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
