/** ProcrastinationCalculator — what delaying the start of investing costs by the horizon. */
import { useState } from 'react';
import { procrastinationCost } from '../../lib/personal-finance';
import { formatMoney } from '../../lib/tax-engine';

export default function ProcrastinationCalculator() {
  const [monthly, setMonthly] = useState(500);
  const [annualReturn, setReturn] = useState(7);
  const [yearsHorizon, setHorizon] = useState(30);
  const [delayYears, setDelay] = useState(5);
  const [result, setResult] = useState<ReturnType<typeof procrastinationCost> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(procrastinationCost(monthly, annualReturn / 100, yearsHorizon, delayYears)); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Monthly investment</label><input type="number" min={0} value={monthly} onChange={(e) => ed(setMonthly)(num(e.target.value))} /></div>
        <div className="form-group"><label>Assumed annual return (%)</label><input type="number" min={0} step={0.5} value={annualReturn} onChange={(e) => ed(setReturn)(num(e.target.value))} /></div>
        <div className="form-group"><label>Years until you need it</label><input type="number" min={0} value={yearsHorizon} onChange={(e) => ed(setHorizon)(num(e.target.value))} /></div>
        <div className="form-group"><label>Years you delay starting</label><input type="number" min={0} value={delayYears} onChange={(e) => ed(setDelay)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'What does waiting cost?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your monthly amount and how long you'd wait.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>The cost of waiting {delayYears} year{delayYears === 1 ? '' : 's'}</h3>
          <div className="result-line"><span>If you start now</span><span className="num">{formatMoney(result.ifStartNow)}</span></div>
          <div className="result-line"><span>If you wait {delayYears} year{delayYears === 1 ? '' : 's'}</span><span className="num">{formatMoney(result.ifDelayed)}</span></div>
          <div className="result-line total"><span>Cost of the delay</span><span className="num">{formatMoney(result.costOfWaiting)}</span></div>
          <div className="result-line"><span>Extra you'd contribute by starting now</span><span className="num">{formatMoney(result.contributedNow - result.contributedDelayed)}</span></div>
          <p className="results-note">
            Starting now grows {formatMoney(result.ifStartNow)}; waiting {delayYears} years grows only
            {' '}{formatMoney(result.ifDelayed)} — a {formatMoney(result.costOfWaiting)} gap, most of it lost
            compounding rather than lost contributions. The early years matter most because they compound the
            longest. Assumes a steady {annualReturn}% return. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
