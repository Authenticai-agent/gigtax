/** PrenupMismatchCalculator — a financial-mismatch score between two partners. */
import { useState } from 'react';
import { prenupMismatch } from '../../lib/lifestyle';
import { formatMoney, formatPct } from '../../lib/tax-engine';

const BAND_CLASS: Record<string, string> = { aligned: 'ok', moderate: 'warn', wide: 'bad' };
const BAND_LABEL: Record<string, string> = { aligned: 'Aligned', moderate: 'Moderate', wide: 'Wide' };

export default function PrenupMismatchCalculator() {
  const [aIncome, setAI] = useState(120000);
  const [aAssets, setAA] = useState(150000);
  const [aDebt, setAD] = useState(20000);
  const [bIncome, setBI] = useState(55000);
  const [bAssets, setBA] = useState(20000);
  const [bDebt, setBD] = useState(80000);
  const [result, setResult] = useState<ReturnType<typeof prenupMismatch> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(prenupMismatch({ aIncome, aAssets, aDebt, bIncome, bAssets, bDebt })); setStale(false); };

  return (
    <div className="calc-panel">
      <p className="section-label">Partner A</p>
      <div className="calc-grid">
        <div className="form-group"><label>Income</label><input type="number" min={0} value={aIncome} onChange={(e) => ed(setAI)(num(e.target.value))} /></div>
        <div className="form-group"><label>Assets</label><input type="number" min={0} value={aAssets} onChange={(e) => ed(setAA)(num(e.target.value))} /></div>
        <div className="form-group"><label>Debt</label><input type="number" min={0} value={aDebt} onChange={(e) => ed(setAD)(num(e.target.value))} /></div>
      </div>
      <p className="section-label">Partner B</p>
      <div className="calc-grid">
        <div className="form-group"><label>Income</label><input type="number" min={0} value={bIncome} onChange={(e) => ed(setBI)(num(e.target.value))} /></div>
        <div className="form-group"><label>Assets</label><input type="number" min={0} value={bAssets} onChange={(e) => ed(setBA)(num(e.target.value))} /></div>
        <div className="form-group"><label>Debt</label><input type="number" min={0} value={bDebt} onChange={(e) => ed(setBD)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Check the mismatch'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter both partners' finances.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Financial mismatch: <span className={`pill ${BAND_CLASS[result.band]}`}>{result.mismatchScore}/100 · {BAND_LABEL[result.band]}</span></h3>
          <div className="result-line"><span>Partner A net worth</span><span className="num">{formatMoney(result.aNetWorth)}</span></div>
          <div className="result-line"><span>Partner B net worth</span><span className="num">{formatMoney(result.bNetWorth)}</span></div>
          <div className="result-line"><span>Net-worth gap</span><span className="num">{formatMoney(result.netWorthGap)}</span></div>
          <div className="result-line"><span>Income ratio (lower ÷ higher)</span><span className="num">{formatPct(result.incomeRatio)}</span></div>
          <div className="result-line"><span>Debt-to-income (A / B)</span><span className="num">{formatPct(result.aDTI)} / {formatPct(result.bDTI)}</span></div>
          <p className="results-note">
            A higher score means bigger differences in income, net worth or debt — the situations where a prenup and
            an honest money conversation are most worth having. It is a discussion aid, not a judgment on a
            relationship, and not legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
