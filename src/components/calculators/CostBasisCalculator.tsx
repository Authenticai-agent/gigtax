/**
 * CostBasisCalculator — lot matching (FIFO / LIFO / specific-ID / average) to
 * find basis and the short/long-term split on a sale. Pure arithmetic in
 * lib/capital-gains.ts; the gain feeds the capital-gains calculator.
 */
import { useState } from 'react';
import { costBasis, type Lot, type LotMethod } from '../../lib/capital-gains';
import { formatMoney } from '../../lib/tax-engine';

interface LotRow { shares: number; costPerShare: number; longTerm: boolean; selected: boolean }

const METHODS: Array<[LotMethod, string]> = [
  ['fifo', 'FIFO — oldest shares first'],
  ['lifo', 'LIFO — newest shares first'],
  ['specific', 'Specific lots (tick the ones sold)'],
  ['average', 'Average cost'],
];

export default function CostBasisCalculator() {
  const [method, setMethod] = useState<LotMethod>('fifo');
  const [sharesToSell, setSharesToSell] = useState(100);
  const [salePrice, setSalePrice] = useState(30);
  const [rows, setRows] = useState<LotRow[]>([
    { shares: 100, costPerShare: 10, longTerm: true, selected: true },
    { shares: 100, costPerShare: 20, longTerm: false, selected: false },
  ]);
  const [result, setResult] = useState<ReturnType<typeof costBasis> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const touch = () => { if (result) setStale(true); };
  const setRow = (i: number, patch: Partial<LotRow>) => { setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row))); touch(); };
  const addRow = () => { setRows((r) => [...r, { shares: 0, costPerShare: 0, longTerm: false, selected: false }]); touch(); };
  const removeRow = (i: number) => { setRows((r) => r.filter((_, j) => j !== i)); touch(); };

  const calc = () => {
    const lots: Lot[] = rows.map((r) => ({
      shares: r.shares, cost: r.shares * r.costPerShare,
      daysHeld: r.longTerm ? 400 : 100, selected: r.selected,
    }));
    setResult(costBasis(lots, method, sharesToSell, salePrice));
    setStale(false);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Lot-matching method</label>
          <select value={method} onChange={(e) => { setMethod(e.target.value as LotMethod); touch(); }}>{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Shares to sell</label>
          <input type="number" min={0} value={sharesToSell} onChange={(e) => { setSharesToSell(num(e.target.value)); touch(); }} /></div>
        <div className="form-group"><label>Sale price per share</label>
          <input type="number" min={0} step={0.01} value={salePrice} onChange={(e) => { setSalePrice(num(e.target.value)); touch(); }} /></div>
      </div>
      <p className="section-label">Your lots (in purchase order)</p>
      {rows.map((row, i) => (
        <div className="calc-grid" key={i}>
          <div className="form-group"><label>Lot {i + 1} — shares</label>
            <input type="number" min={0} value={row.shares} onChange={(e) => setRow(i, { shares: num(e.target.value) })} /></div>
          <div className="form-group"><label>Cost per share</label>
            <input type="number" min={0} step={0.01} value={row.costPerShare} onChange={(e) => setRow(i, { costPerShare: num(e.target.value) })} /></div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '.4rem', alignSelf: 'end' }}>
            <input id={`lt${i}`} type="checkbox" checked={row.longTerm} onChange={(e) => setRow(i, { longTerm: e.target.checked })} style={{ width: 'auto' }} />
            <label htmlFor={`lt${i}`} style={{ margin: 0 }}>Held &gt;1 year</label>
          </div>
          {method === 'specific' && (
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '.4rem', alignSelf: 'end' }}>
              <input id={`sel${i}`} type="checkbox" checked={row.selected} onChange={(e) => setRow(i, { selected: e.target.checked })} style={{ width: 'auto' }} />
              <label htmlFor={`sel${i}`} style={{ margin: 0 }}>Sell this lot</label>
            </div>
          )}
          <div className="form-group" style={{ alignSelf: 'end' }}>
            {rows.length > 1 && <button type="button" className="btn-secondary" onClick={() => removeRow(i)}>Remove</button>}
          </div>
        </div>
      ))}
      <div className="calc-actions">
        <button type="button" className="btn-secondary" onClick={addRow}>Add a lot</button>
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Find basis and gain'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your lots and the sale.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Basis and gain on {result.sharesSold} shares</h3>
          <div className="result-line"><span>Proceeds</span><span className="num">{formatMoney(result.proceeds)}</span></div>
          <div className="result-line"><span>Cost basis</span><span className="num">{formatMoney(result.basis)}</span></div>
          <div className="result-line total"><span>Total gain</span><span className="num">{formatMoney(result.gain)}</span></div>
          <div className="result-line"><span>Short-term portion</span><span className="num">{formatMoney(result.shortTermGain)}</span></div>
          <div className="result-line"><span>Long-term portion</span><span className="num">{formatMoney(result.longTermGain)}</span></div>
          <p className="results-note">
            The method you choose changes the basis, and so the tax — FIFO often realises the most long-term gain,
            specific-ID lets you pick which lots to sell. Take the short and long-term figures into the
            <a href="/capital-gains-tax-calculator/"> capital gains calculator</a> for the tax. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
