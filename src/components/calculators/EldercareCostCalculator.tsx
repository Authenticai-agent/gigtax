/** EldercareCostCalculator — projected total cost of care by type, state tier and years. */
import { useState } from 'react';
import { eldercareCost, CARE_TYPES, STATE_TIERS } from '../../lib/lifestyle';
import { formatMoney } from '../../lib/tax-engine';

const CARE_OPTS = Object.entries(CARE_TYPES).map(([k, v]) => [k, v.name] as const);
const TIER_OPTS = Object.entries(STATE_TIERS).map(([k, v]) => [k, `${v.name} (×${v.mult})`] as const);

export default function EldercareCostCalculator() {
  const [careType, setCareType] = useState('assisted');
  const [stateTier, setStateTier] = useState('med');
  const [years, setYears] = useState(4);
  const [result, setResult] = useState<ReturnType<typeof eldercareCost> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(eldercareCost(careType, stateTier, years, 0.04)); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Type of care</label><select value={careType} onChange={(e) => ed(setCareType)(e.target.value)}>{CARE_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>State cost tier</label><select value={stateTier} onChange={(e) => ed(setStateTier)(e.target.value)}>{TIER_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><p className="field-note">CA/NY/NJ are very high; MS/AL/AR are low.</p></div>
        <div className="form-group"><label>Years of care</label><input type="number" min={1} value={years} onChange={(e) => ed(setYears)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Estimate care cost'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Pick the type of care and how long it's needed.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Cost of {years} years of care</h3>
          <div className="result-line"><span>Monthly cost (this state tier)</span><span className="num">{formatMoney(result.monthlyCost)}</span></div>
          <div className="result-line"><span>Annual cost (year one)</span><span className="num">{formatMoney(result.annualCost)}</span></div>
          <div className="result-line total"><span>Total over {years} years (4% inflation)</span><span className="num">{formatMoney(result.totalCost)}</span></div>
          <p className="results-note">
            Care costs are reference US averages by type, scaled to a state cost tier and inflated 4%/year — real
            quotes vary widely by facility and city. Medicare does not cover long-term custodial care; Medicaid does,
            but only after you spend down assets. This is why long-term-care planning exists. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
