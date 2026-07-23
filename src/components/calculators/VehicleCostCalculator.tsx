/** VehicleCostCalculator — real cost per mile vs the standard mileage deduction. */
import { useState } from 'react';
import { vehicleCost, MILEAGE_RATE_H2 } from '../../lib/gig-economics';
import { formatMoney } from '../../lib/tax-engine';

export default function VehicleCostCalculator() {
  const [miles, setMiles] = useState(20000);
  const [mpg, setMpg] = useState(28);
  const [gas, setGas] = useState(3.5);
  const [maintenance, setMaintenance] = useState(2000);
  const [insurance, setInsurance] = useState(1800);
  const [depreciation, setDepreciation] = useState(3500);
  const [other, setOther] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof vehicleCost> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(vehicleCost(miles, mpg, gas, maintenance, insurance, depreciation, other)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Business miles a year</label>
          <input type="number" min={0} value={miles} onChange={(e) => ed(setMiles)(num(e.target.value))} /></div>
        <div className="form-group"><label>Miles per gallon</label>
          <input type="number" min={0} value={mpg} onChange={(e) => ed(setMpg)(num(e.target.value))} /></div>
        <div className="form-group"><label>Gas price per gallon</label>
          <input type="number" min={0} step={0.01} value={gas} onChange={(e) => ed(setGas)(num(e.target.value))} /></div>
        <div className="form-group"><label>Maintenance & repairs a year</label>
          <input type="number" min={0} value={maintenance} onChange={(e) => ed(setMaintenance)(num(e.target.value))} /></div>
        <div className="form-group"><label>Insurance a year</label>
          <input type="number" min={0} value={insurance} onChange={(e) => ed(setInsurance)(num(e.target.value))} /></div>
        <div className="form-group"><label>Depreciation a year</label>
          <input type="number" min={0} value={depreciation} onChange={(e) => ed(setDepreciation)(num(e.target.value))} />
          <p className="field-note">Rough loss in value; a car drops fast with miles.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'What does a mile cost?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your vehicle costs and miles.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your real cost to drive</h3>
          <div className="result-line"><span>Fuel</span><span className="num">{formatMoney(result.fuelCost)}</span></div>
          <div className="result-line total"><span>Total yearly cost</span><span className="num">{formatMoney(result.totalCost)}</span></div>
          <div className="result-line total"><span>Cost per mile</span><span className="num">{(result.costPerMile * 100).toFixed(1)}¢/mi</span></div>
          <div className="result-line"><span>Standard deduction those miles earn (76¢)</span><span className="num">{formatMoney(result.standardDeductionValue)}</span></div>
          <div className="result-line total">
            <span>{result.costOverStandard >= 0 ? 'Your cost exceeds the standard deduction by' : 'The standard deduction exceeds your cost by'}</span>
            <span className="num">{formatMoney(Math.abs(result.costOverStandard))}</span>
          </div>
          <p className="results-note">
            If your real cost per mile is below {(MILEAGE_RATE_H2 * 100).toFixed(0)}¢, the standard mileage
            deduction is worth more than tracking actual expenses — most gig drivers with efficient cars are in
            that spot. If it is higher, the actual-expense method may deduct more, but you cannot switch to the
            standard rate later on a depreciated car. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
