/** LifestyleCreepCalculator — the cost of letting your savings rate fall as income rose. */
import { useState } from 'react';
import { lifestyleCreep } from '../../lib/lifestyle';
import { formatMoney } from '../../lib/tax-engine';

export default function LifestyleCreepCalculator() {
  const [thenIncome, setThenI] = useState(60000);
  const [thenRate, setThenR] = useState(20);
  const [nowIncome, setNowI] = useState(100000);
  const [nowRate, setNowR] = useState(8);
  const [years, setYears] = useState(20);
  const [result, setResult] = useState<ReturnType<typeof lifestyleCreep> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(lifestyleCreep(thenIncome, thenRate / 100, nowIncome, nowRate / 100, 0.07, years)); setStale(false); };

  return (
    <div className="calc-panel">
      <p className="section-label">Back then</p>
      <div className="calc-grid">
        <div className="form-group"><label>Income then</label><input type="number" min={0} value={thenIncome} onChange={(e) => ed(setThenI)(num(e.target.value))} /></div>
        <div className="form-group"><label>Savings rate then (%)</label><input type="number" min={0} max={100} value={thenRate} onChange={(e) => ed(setThenR)(num(e.target.value))} /></div>
      </div>
      <p className="section-label">Now</p>
      <div className="calc-grid">
        <div className="form-group"><label>Income now</label><input type="number" min={0} value={nowIncome} onChange={(e) => ed(setNowI)(num(e.target.value))} /></div>
        <div className="form-group"><label>Savings rate now (%)</label><input type="number" min={0} max={100} value={nowRate} onChange={(e) => ed(setNowR)(num(e.target.value))} /></div>
        <div className="form-group"><label>Project over (years)</label><input type="number" min={1} value={years} onChange={(e) => ed(setYears)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Measure the creep'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your income and savings rate then and now.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.foregoneAnnual > 0 ? 'Lifestyle creep is costing you' : 'No creep — you kept your savings rate'}</h3>
          <div className="result-line"><span>Income increase</span><span className="num">{formatMoney(result.incomeIncrease)}</span></div>
          <div className="result-line"><span>You saved then</span><span className="num">{formatMoney(result.savingsThen)}/yr</span></div>
          <div className="result-line"><span>You save now</span><span className="num">{formatMoney(result.savingsNow)}/yr</span></div>
          <div className="result-line total"><span>Foregone savings each year</span><span className="num">{formatMoney(result.foregoneAnnual)}</span></div>
          <div className="result-line"><span>Over {years} years, invested</span><span className="num">{formatMoney(result.foregoneOverYears)}</span></div>
          <p className="results-note">
            Lifestyle creep is when spending rises to swallow every raise, so the savings rate quietly falls even as
            income climbs. Held to your old {result.savingsThen > 0 ? '' : ''}rate on today's income, you'd save more —
            the difference, compounded, is {formatMoney(result.foregoneOverYears)} over {years} years. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
