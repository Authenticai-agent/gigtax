/** GamblingACACalculator — how a win cuts an ACA premium subsidy. */
import { useState } from 'react';
import { gamblingACAImpact } from '../../lib/gambling';
import { formatMoney } from '../../lib/tax-engine';

export default function GamblingACACalculator() {
  const [winnings, setWinnings] = useState(30000);
  const [magi, setMagi] = useState(40000);
  const [household, setHousehold] = useState(2);
  const [premium, setPremium] = useState(1000);
  const [result, setResult] = useState<ReturnType<typeof gamblingACAImpact> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(gamblingACAImpact(winnings, magi, household, premium)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Gambling winnings</label><input type="number" min={0} value={winnings} onChange={(e) => ed(setWinnings)(num(e.target.value))} /></div>
        <div className="form-group"><label>Household MAGI before the win</label><input type="number" min={0} value={magi} onChange={(e) => ed(setMagi)(num(e.target.value))} /></div>
        <div className="form-group"><label>Household size</label><input type="number" min={1} max={12} value={household} onChange={(e) => ed(setHousehold)(Math.max(1, num(e.target.value)))} /></div>
        <div className="form-group"><label>Benchmark plan premium (monthly)</label><input type="number" min={0} value={premium} onChange={(e) => ed(setPremium)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Impact on my subsidy'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your winnings and household details.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>How the win cuts your ACA subsidy</h3>
          <div className="result-line"><span>Monthly subsidy without the win</span><span className="num">{formatMoney(result.subsidyWithout)}</span></div>
          <div className="result-line"><span>Monthly subsidy with the win</span><span className="num">{formatMoney(result.subsidyWith)}</span></div>
          <div className="result-line total"><span>Monthly subsidy lost</span><span className="num">{formatMoney(result.subsidyLost)}</span></div>
          {result.overCliff && <p className="results-note" data-review="legal">The win pushed you over the 400%-of-poverty cliff — the entire premium subsidy is gone for the year, which can cost far more than the win.</p>}
          <p className="results-note">
            A win raises the modified AGI that sets your ACA premium tax credit, shrinking the subsidy — and in 2026,
            crossing 400% of the poverty line loses it entirely. That clawback happens at tax time when you reconcile,
            so a mid-year win can create a surprise bill. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
