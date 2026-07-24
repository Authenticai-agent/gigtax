/**
 * InheritanceTaxCalculator — one engine, one preset per asset type. It never
 * just says "taxable" or "tax-free": each asset is handled by its own rule.
 */
import { useState } from 'react';
import { inheritanceTreatment, type InheritedAsset } from '../../lib/estate';
import { formatMoney } from '../../lib/tax-engine';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;
const ASSETS: Array<[InheritedAsset, string]> = [
  ['cash', 'Cash'],
  ['brokerage', 'Stocks / brokerage account'],
  ['property', 'A house or other property'],
  ['traditional_ira', 'Traditional IRA or 401(k)'],
  ['roth', 'Roth IRA'],
  ['life_insurance', 'Life-insurance payout'],
  ['annuity', 'Annuity'],
];
const STEPPED = new Set<InheritedAsset>(['brokerage', 'property']);

export default function InheritanceTaxCalculator() {
  const [asset, setAsset] = useState<InheritedAsset>('brokerage');
  const [value, setValue] = useState(100000);
  const [salePrice, setSalePrice] = useState(120000);
  const [basis, setBasis] = useState(60000);
  const [other, setOther] = useState(80000);
  const [status, setStatus] = useState('single');
  const [result, setResult] = useState<ReturnType<typeof inheritanceTreatment> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(inheritanceTreatment(asset, value, other, status, salePrice, basis)); setStale(false); };
  const isStepped = STEPPED.has(asset);
  const isIra = asset === 'traditional_ira';
  const isAnnuity = asset === 'annuity';
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>What did you inherit?</label>
          <select value={asset} onChange={(e) => ed(setAsset)(e.target.value as InheritedAsset)}>{ASSETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Value at the date of death</label>
          <input type="number" min={0} value={value} onChange={(e) => ed(setValue)(num(e.target.value))} /></div>
        {isStepped && (
          <div className="form-group"><label>Price when you sell it</label>
            <input type="number" min={0} value={salePrice} onChange={(e) => ed(setSalePrice)(num(e.target.value))} />
            <p className="field-note">Only gain above the date-of-death value is taxed.</p></div>
        )}
        {isIra && (
          <div className="form-group"><label>Amount you withdraw</label>
            <input type="number" min={0} value={salePrice} onChange={(e) => ed(setSalePrice)(num(e.target.value))} />
            <p className="field-note">Taxed as ordinary income when withdrawn.</p></div>
        )}
        {isAnnuity && (
          <div className="form-group"><label>Owner's cost basis</label>
            <input type="number" min={0} value={basis} onChange={(e) => ed(setBasis)(num(e.target.value))} />
            <p className="field-note">Return of basis is tax-free; the gain is taxed.</p></div>
        )}
        {(isStepped || isIra || isAnnuity) && (
          <div className="form-group"><label>Your other taxable income</label>
            <input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        )}
        {(isStepped || isIra || isAnnuity) && (
          <div className="form-group"><label>Filing status</label>
            <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        )}
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'How is it taxed?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Pick what you inherited and its value.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>How your inheritance is taxed</h3>
          {result.taxFreeAtInheritance > 0 && <div className="result-line"><span>Received tax-free</span><span className="num">{formatMoney(result.taxFreeAtInheritance)}</span></div>}
          <div className="result-line"><span>Taxable amount</span><span className="num">{formatMoney(result.taxableAmount)}</span></div>
          <div className="result-line total"><span>Estimated federal tax</span><span className="num">{formatMoney(result.estimatedTax)}</span></div>
          <p className="results-note" data-review="legal">{result.treatment}</p>
          <p className="results-note">
            This is <strong>federal</strong> tax only — there is no federal inheritance tax, so it reflects federal
            income or capital-gains tax on the asset once you sell or withdraw it. State tax is not included: your
            state may tax the same income, and five states (PA, NJ, KY, NE and MD) levy a separate inheritance tax
            on the heir. See the <a href="/state-estate-tax-calculator/">state estate &amp; inheritance tax
            calculator</a>. Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
