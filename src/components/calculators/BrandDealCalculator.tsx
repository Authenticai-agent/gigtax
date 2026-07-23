/**
 * BrandDealCalculator — creator brand-deal tax. Uses calcBrandDeal from the
 * engine. Gifted products count at fair-market value, so the cash payment and
 * the value of free product are summed into the taxable deal amount.
 */
import { useState } from 'react';
import { brandDeal } from '../../lib/se-business';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;
const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function BrandDealCalculator({ presetState = '' }: { presetState?: string }) {
  const [cash, setCash] = useState(15000);
  const [giftedValue, setGiftedValue] = useState(3000);
  const [deductions, setDeductions] = useState(2000);
  const [other, setOther] = useState(50000);
  const [status, setStatus] = useState('single');
  const [stateCode, setStateCode] = useState(presetState);
  const [result, setResult] = useState<ReturnType<typeof brandDeal> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(brandDeal(cash + giftedValue, other, deductions, status, stateCode)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Cash paid for the deal</label><input type="number" min={0} value={cash} onChange={(e) => ed(setCash)(num(e.target.value))} /></div>
        <div className="form-group"><label>Value of gifted product (PR)</label><input type="number" min={0} value={giftedValue} onChange={(e) => ed(setGiftedValue)(num(e.target.value))} /><p className="field-note">Free product is taxable at its fair-market value.</p></div>
        <div className="form-group"><label>Business deductions</label><input type="number" min={0} value={deductions} onChange={(e) => ed(setDeductions)(num(e.target.value))} /><p className="field-note">Equipment, software, a manager's cut.</p></div>
        <div className="form-group"><label>Your other income</label><input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{!stateCode && <option value="">Select…</option>}{stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
        <div className="form-group"><label>Filing status</label><select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate the tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter the deal and gifted-product value.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Tax on your {formatMoney(result.dealAmount)} brand deal</h3>
          <div className="result-line"><span>Net self-employment income</span><span className="num">{formatMoney(result.netSE)}</span></div>
          <div className="result-line"><span>Self-employment tax</span><span className="num">− {formatMoney(result.seTax)}</span></div>
          <div className="result-line"><span>Federal income tax on the deal</span><span className="num">− {formatMoney(result.federalTax)}</span></div>
          {result.stateTax > 0 && <div className="result-line"><span>State income tax</span><span className="num">− {formatMoney(result.stateTax)}</span></div>}
          <div className="result-line total"><span>After-tax from the deal</span><span className="num">{formatMoney(result.afterTax)}</span></div>
          <div className="result-line"><span>Set aside about</span><span className="num">{formatPct(result.setAsidePct)}</span></div>
          <p className="results-note">
            Brand deals are self-employment income — you owe the 15.3% self-employment tax plus income tax, and no one
            withholds it. Gifted product ("PR packages") is taxable at fair-market value even though it is not cash,
            which can leave you owing tax on things you cannot spend. A deal over $600 usually brings a 1099-NEC. Not
            tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
