/** ClimateRiskCalculator — financial exposure of a home to climate risk over a holding period. */
import { useState } from 'react';
import { climateRisk, CLIMATE_SEVERITY } from '../../lib/lifestyle';
import { formatMoney } from '../../lib/tax-engine';

const HAZARDS = [['flood', 'Flood'], ['wildfire', 'Wildfire'], ['hurricane', 'Hurricane / severe storm'], ['heat', 'Extreme heat']] as const;
const SEV = Object.entries(CLIMATE_SEVERITY).map(([k, v]) => [k, v.name] as const);

export default function ClimateRiskCalculator() {
  const [homeValue, setHomeValue] = useState(500000);
  const [currentPremium, setPremium] = useState(2000);
  const [hazard, setHazard] = useState('flood');
  const [severity, setSeverity] = useState('moderate');
  const [yearsHeld, setYears] = useState(10);
  const [result, setResult] = useState<ReturnType<typeof climateRisk> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(climateRisk(homeValue, currentPremium, severity, yearsHeld)); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Home value</label><input type="number" min={0} value={homeValue} onChange={(e) => ed(setHomeValue)(num(e.target.value))} /></div>
        <div className="form-group"><label>Current annual insurance premium</label><input type="number" min={0} value={currentPremium} onChange={(e) => ed(setPremium)(num(e.target.value))} /></div>
        <div className="form-group"><label>Main hazard</label><select value={hazard} onChange={(e) => ed(setHazard)(e.target.value)}>{HAZARDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Risk level</label><select value={severity} onChange={(e) => ed(setSeverity)(e.target.value)}>{SEV.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><p className="field-note">Higher if inside a designated zone with repeated losses.</p></div>
        <div className="form-group"><label>Years you'll hold the home</label><input type="number" min={1} value={yearsHeld} onChange={(e) => ed(setYears)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Estimate exposure'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your home value and risk level.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Climate financial exposure over {yearsHeld} years</h3>
          <div className="result-line"><span>Insurance increase (year one)</span><span className="num">{formatMoney(result.annualInsuranceIncrease)}</span></div>
          <div className="result-line"><span>Extra insurance over the period</span><span className="num">{formatMoney(result.insuranceOverPeriod)}</span></div>
          <div className="result-line"><span>Potential hit to home value</span><span className="num">{formatMoney(result.valueLoss)}</span></div>
          <div className="result-line"><span>One-off adaptation cost</span><span className="num">{formatMoney(result.adaptationCost)}</span></div>
          <div className="result-line total"><span>Total financial exposure</span><span className="num">{formatMoney(result.totalExposure)}</span></div>
          <p className="results-note">
            A rough picture of what climate risk can cost a homeowner: rising premiums, a discount buyers demand for
            risk, and the cost of hardening the property. These are broad reference tiers, not a property-level model —
            use FEMA flood maps and a local insurer for your actual numbers. Not financial or insurance advice.
          </p>
        </div>
      )}
    </div>
  );
}
