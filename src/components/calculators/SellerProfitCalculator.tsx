/**
 * SellerProfitCalculator — revenue less COGS/fees/shipping is profit and margin,
 * then self-employment and income tax. Ported from sellerCalculatorView. Presets
 * to a platform's typical fee via the defaultFees prop on the platform pages.
 */
import { useState } from 'react';
import { sellerProfit } from '../../lib/se-business';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;
const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

interface Props { presetState?: string; defaultRevenue?: number; defaultFees?: number }

export default function SellerProfitCalculator({ presetState = '', defaultRevenue = 50000, defaultFees = 5000 }: Props) {
  const [revenue, setRevenue] = useState(defaultRevenue);
  const [cogs, setCogs] = useState(Math.round(defaultRevenue * 0.3));
  const [fees, setFees] = useState(defaultFees);
  const [shipping, setShipping] = useState(2000);
  const [other, setOther] = useState(1000);
  const [stateCode, setStateCode] = useState(presetState);
  const [status, setStatus] = useState('single');
  const [result, setResult] = useState<ReturnType<typeof sellerProfit> | null>(null);
  const [stale, setStale] = useState(false);
  const numv = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(sellerProfit(revenue, cogs, fees, shipping, other, stateCode, status)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Total sales (revenue)</label>
          <input type="number" min={0} value={revenue} onChange={(e) => ed(setRevenue)(numv(e.target.value))} /></div>
        <div className="form-group"><label>Cost of goods sold</label>
          <input type="number" min={0} value={cogs} onChange={(e) => ed(setCogs)(numv(e.target.value))} />
          <p className="field-note">Materials, or what you paid to resell.</p></div>
        <div className="form-group"><label>Platform & payment fees</label>
          <input type="number" min={0} value={fees} onChange={(e) => ed(setFees)(numv(e.target.value))} /></div>
        <div className="form-group"><label>Shipping & supplies</label>
          <input type="number" min={0} value={shipping} onChange={(e) => ed(setShipping)(numv(e.target.value))} /></div>
        <div className="form-group"><label>Other expenses</label>
          <input type="number" min={0} value={other} onChange={(e) => ed(setOther)(numv(e.target.value))} /></div>
        <div className="form-group"><label>State</label>
          <select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>
            {!stateCode && <option value="">Select your state…</option>}
            {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select></div>
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate profit & tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your sales and costs.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your seller profit and tax</h3>
          <div className="result-line"><span>Revenue</span><span className="num">{formatMoney(result.revenue)}</span></div>
          <div className="result-line"><span>Total expenses</span><span className="num">− {formatMoney(result.totalExpenses)}</span></div>
          <div className="result-line total"><span>Net profit</span><span className="num">{formatMoney(result.netProfit)}</span></div>
          <div className="result-line"><span>Net margin</span><span className="num">{formatPct(result.netMargin)}</span></div>
          <div className="result-line"><span>Self-employment tax</span><span className="num">− {formatMoney(result.seTax)}</span></div>
          <div className="result-line"><span>Federal income tax</span><span className="num">− {formatMoney(result.federalTax)}</span></div>
          <div className="result-line"><span>{stateCode ? states[stateCode]?.name : 'State'} income tax</span><span className="num">{stateCode ? `− ${formatMoney(result.stateTax)}` : 'pick a state'}</span></div>
          <div className="result-line total"><span>Take-home</span><span className="num">{formatMoney(result.takeHome)}</span></div>
          <p className="results-note">
            Cost of goods sold is a seller's biggest deduction — it directly cuts taxable profit. The 1099-K you
            receive shows gross sales including fees and refunds, so reconcile it down to this net profit. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
