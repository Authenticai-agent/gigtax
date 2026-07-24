/** HowRichIfCalculator — counterfactual wealth from investing a recurring expense instead. */
import { useState } from 'react';
import { howRichIf } from '../../lib/lifestyle';
import { formatMoney } from '../../lib/tax-engine';

const PRESETS = [
  ['A car payment', 500], ['Rent difference from downsizing', 800],
  ['A daily lunch out', 300], ['A streaming + subscriptions stack', 85], ['Custom', 500],
] as const;

export default function HowRichIfCalculator() {
  const [presetIdx, setPreset] = useState(0);
  const [monthly, setMonthly] = useState(500);
  const [years, setYears] = useState(30);
  const [ret, setRet] = useState(7);
  const [result, setResult] = useState<ReturnType<typeof howRichIf> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const pickPreset = (i: number) => { setPreset(i); if (PRESETS[i][1]) setMonthly(PRESETS[i][1] as number); if (result) setStale(true); };
  const calc = () => { setResult(howRichIf(monthly, years, ret / 100)); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>What would you have invested?</label><select value={presetIdx} onChange={(e) => pickPreset(Number(e.target.value))}>{PRESETS.map(([l], i) => <option key={l} value={i}>{l}</option>)}</select></div>
        <div className="form-group"><label>Amount per month</label><input type="number" min={0} value={monthly} onChange={(e) => ed(setMonthly)(num(e.target.value))} /></div>
        <div className="form-group"><label>Over how many years</label><input type="number" min={1} value={years} onChange={(e) => ed(setYears)(num(e.target.value))} /></div>
        <div className="form-group"><label>Assumed return (%/yr)</label><input type="number" min={0} step={0.5} value={ret} onChange={(e) => ed(setRet)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'How rich would I be?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Pick an expense and how long you'd have invested it.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>If you'd invested it instead</h3>
          <div className="result-line"><span>Total you'd have contributed</span><span className="num">{formatMoney(result.contributed)}</span></div>
          <div className="result-line"><span>Growth on top</span><span className="num">{formatMoney(result.growth)}</span></div>
          <div className="result-line total"><span>What you'd have after {years} years</span><span className="num">{formatMoney(result.futureValue)}</span></div>
          <p className="results-note">
            {formatMoney(monthly)}/month invested at {ret}% for {years} years becomes {formatMoney(result.futureValue)} —
            and most of it, {formatMoney(result.growth)}, is growth rather than what you put in. The counterfactual is a
            thought experiment, not a regret: it shows the power of redirecting a fixed expense. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
