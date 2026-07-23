/** EstateTaxCalculator — federal estate tax against the 2026 $15m exclusion. */
import { useState } from 'react';
import { estateTax, BASIC_EXCLUSION } from '../../lib/estate';
import { formatMoney } from '../../lib/tax-engine';

export default function EstateTaxCalculator() {
  const [estate, setEstate] = useState(20000000);
  const [priorGifts, setPriorGifts] = useState(0);
  const [ported, setPorted] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof estateTax> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(estateTax(estate, priorGifts, ported)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Gross estate value</label>
          <input type="number" min={0} value={estate} onChange={(e) => ed(setEstate)(num(e.target.value))} />
          <p className="field-note">Everything owned: home, accounts, business, life insurance you owned.</p></div>
        <div className="form-group"><label>Lifetime taxable gifts already made</label>
          <input type="number" min={0} value={priorGifts} onChange={(e) => ed(setPriorGifts)(num(e.target.value))} />
          <p className="field-note">These reduce the exclusion left for the estate.</p></div>
        <div className="form-group"><label>Exclusion ported from a late spouse</label>
          <input type="number" min={0} value={ported} onChange={(e) => ed(setPorted)(num(e.target.value))} />
          <p className="field-note">Up to another {formatMoney(BASIC_EXCLUSION)} via portability.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Estimate estate tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter the estate value.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.owesTax ? 'This estate owes federal estate tax' : 'No federal estate tax'}</h3>
          <div className="result-line"><span>Gross estate</span><span className="num">{formatMoney(result.grossEstate)}</span></div>
          <div className="result-line"><span>Applicable exclusion</span><span className="num">{formatMoney(result.applicableExclusion)}</span></div>
          <div className="result-line total"><span>Taxable estate (over the exclusion)</span><span className="num">{formatMoney(result.taxableEstate)}</span></div>
          <div className="result-line total"><span>Estimated federal estate tax (40%)</span><span className="num">{formatMoney(result.estimatedTax)}</span></div>
          <p className="results-note">
            The 2026 exclusion is {formatMoney(BASIC_EXCLUSION)} per person, so most estates owe nothing. Above it,
            the amount is taxed near the 40% top rate. This models 40% of the taxable estate; the graduated rates
            below the first million are immaterial at this size. State estate or inheritance tax may apply
            separately, and marital and charitable transfers can reduce the taxable estate. Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
