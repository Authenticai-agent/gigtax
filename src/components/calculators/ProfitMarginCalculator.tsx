/** ProfitMarginCalculator — gross margin, net margin and markup from revenue and costs. */
import { useState } from 'react';
import { profitMargin } from '../../lib/personal-finance';
import { formatMoney, formatPct } from '../../lib/tax-engine';

export default function ProfitMarginCalculator() {
  const [revenue, setRevenue] = useState(10000);
  const [cogs, setCogs] = useState(4000);
  const [operating, setOperating] = useState(1500);
  const [other, setOther] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof profitMargin> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(profitMargin(revenue, cogs, operating, other)); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Total revenue</label><input type="number" min={0} value={revenue} onChange={(e) => ed(setRevenue)(num(e.target.value))} /><p className="field-note">Sales price × units sold.</p></div>
        <div className="form-group"><label>Cost of goods sold (COGS)</label><input type="number" min={0} value={cogs} onChange={(e) => ed(setCogs)(num(e.target.value))} /><p className="field-note">Materials, manufacturing, shipping to the customer.</p></div>
        <div className="form-group"><label>Operating expenses</label><input type="number" min={0} value={operating} onChange={(e) => ed(setOperating)(num(e.target.value))} /><p className="field-note">Platform fees, ads, packaging, software.</p></div>
        <div className="form-group"><label>Other costs</label><input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Show my margins'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your revenue and costs.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your margins</h3>
          <div className="result-line"><span>Gross profit (revenue − COGS)</span><span className="num">{formatMoney(result.grossProfit)}</span></div>
          <div className="result-line"><span>Gross margin</span><span className="num">{formatPct(result.grossMargin)}</span></div>
          <div className="result-line"><span>Net profit (revenue − all costs)</span><span className="num">{formatMoney(result.netProfit)}</span></div>
          <div className="result-line total"><span>Net margin</span><span className="num">{formatPct(result.netMargin)}</span></div>
          <div className="result-line"><span>Markup on cost</span><span className="num">{formatPct(result.markup)}</span></div>
          <p className="results-note">
            Gross margin is what's left after direct product costs; net margin is the true bottom line after every
            expense. Markup is measured on cost, margin on revenue — a 50% margin is a 100% markup, and confusing the
            two is how sellers underprice. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
