/** CoffeeCostCalculator — what a recurring small purchase costs over time, spent vs invested. */
import { useState } from 'react';
import { recurringHabit } from '../../lib/lifestyle';
import { formatMoney } from '../../lib/tax-engine';

const FREQ = [['daily', 'Every day', 365], ['workdays', 'Workdays only', 250], ['weekends', 'Weekends', 104], ['weekly', 'Once a week', 52]] as const;

export default function CoffeeCostCalculator() {
  const [cost, setCost] = useState(6);
  const [freqIdx, setFreqIdx] = useState(0);
  const [years, setYears] = useState(30);
  const [result, setResult] = useState<ReturnType<typeof recurringHabit> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(recurringHabit(cost, FREQ[freqIdx][2], years, 0.10, 0.03)); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Cost per cup</label><input type="number" min={0} step={0.25} value={cost} onChange={(e) => ed(setCost)(num(e.target.value))} /></div>
        <div className="form-group"><label>How often</label><select value={freqIdx} onChange={(e) => ed(setFreqIdx)(Number(e.target.value))}>{FREQ.map(([, l], i) => <option key={l} value={i}>{l}</option>)}</select></div>
        <div className="form-group"><label>Over how many years</label><input type="number" min={1} value={years} onChange={(e) => ed(setYears)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Show the true cost'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Set the price and how often you buy it.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your coffee habit, over {years} years</h3>
          <div className="result-line"><span>Spent per year</span><span className="num">{formatMoney(result.annualSpend)}</span></div>
          <div className="result-line"><span>Total spent over {years} years</span><span className="num">{formatMoney(result.totalSpent)}</span></div>
          <div className="result-line total"><span>If invested instead (10%/yr)</span><span className="num">{formatMoney(result.totalIfInvested)}</span></div>
          <div className="result-line"><span>Growth you gave up</span><span className="num">{formatMoney(result.opportunityCost)}</span></div>
          <p className="results-note">
            The point isn't to quit coffee — it's the arithmetic of "small but daily." {formatMoney(result.annualSpend)}
            a year, invested, becomes {formatMoney(result.totalIfInvested)} over {years} years. Any recurring
            purchase works the same way; coffee is just the famous one. Assumes a 10% return, 3% price inflation. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
