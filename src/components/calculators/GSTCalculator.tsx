/** GSTCalculator — generation-skipping transfer tax, 40% above the $15m exemption. */
import { useState } from 'react';
import { gstTax } from '../../lib/estate';
import { formatMoney } from '../../lib/tax-engine';

export default function GSTCalculator() {
  const [transfer, setTransfer] = useState(20000000);
  const [priorUsed, setPriorUsed] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof gstTax> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(gstTax(transfer, priorUsed)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Transfer to a skip person</label><input type="number" min={0} value={transfer} onChange={(e) => ed(setTransfer)(num(e.target.value))} /><p className="field-note">A grandchild, or anyone 37½+ years younger.</p></div>
        <div className="form-group"><label>GST exemption already used</label><input type="number" min={0} value={priorUsed} onChange={(e) => ed(setPriorUsed)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Estimate GST tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter the transfer amount.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.gstTax > 0 ? 'Generation-skipping transfer tax applies' : 'No GST tax'}</h3>
          <div className="result-line"><span>Transfer</span><span className="num">{formatMoney(result.transfer)}</span></div>
          <div className="result-line"><span>GST exemption available</span><span className="num">{formatMoney(result.exemptionAvailable)}</span></div>
          <div className="result-line total"><span>Taxable amount</span><span className="num">{formatMoney(result.taxableAmount)}</span></div>
          <div className="result-line total"><span>GST tax (40%)</span><span className="num">{formatMoney(result.gstTax)}</span></div>
          <p className="results-note" data-review="legal">
            The GST tax is a flat 40% on transfers to a "skip person" above the $15m GST exemption — a separate
            allowance from, but equal to, the estate exemption. Crucially it applies ON TOP of any gift or estate
            tax on the same transfer, so a gift to a grandchild above both exemptions can be taxed twice. It exists
            to stop wealth skipping a generation to dodge one round of estate tax. Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
