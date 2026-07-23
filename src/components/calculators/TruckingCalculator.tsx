/** TruckingCalculator — owner-operator cost per mile vs revenue per mile. */
import { useState } from 'react';
import { truckingCostPerMile } from '../../lib/gig-economics';
import { formatMoney } from '../../lib/tax-engine';

export default function TruckingCalculator() {
  const [miles, setMiles] = useState(120000);
  const [revenue, setRevenue] = useState(2.0);
  const [mpg, setMpg] = useState(6.5);
  const [diesel, setDiesel] = useState(4.0);
  const [maintenance, setMaintenance] = useState(0.15);
  const [insurance, setInsurance] = useState(12000);
  const [truckPayment, setTruckPayment] = useState(24000);
  const [otherFixed, setOtherFixed] = useState(8000);
  const [result, setResult] = useState<ReturnType<typeof truckingCostPerMile> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(truckingCostPerMile(miles, revenue, mpg, diesel, maintenance, insurance, truckPayment, otherFixed)); setStale(false); };
  const cpm = (n: number) => `${(n * 100).toFixed(1)}¢/mi`;
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Miles a year</label><input type="number" min={0} value={miles} onChange={(e) => ed(setMiles)(num(e.target.value))} /></div>
        <div className="form-group"><label>Revenue per mile</label><input type="number" min={0} step={0.01} value={revenue} onChange={(e) => ed(setRevenue)(num(e.target.value))} /><p className="field-note">The freight rate you're paid.</p></div>
        <div className="form-group"><label>Miles per gallon</label><input type="number" min={0} step={0.1} value={mpg} onChange={(e) => ed(setMpg)(num(e.target.value))} /></div>
        <div className="form-group"><label>Diesel per gallon</label><input type="number" min={0} step={0.01} value={diesel} onChange={(e) => ed(setDiesel)(num(e.target.value))} /></div>
        <div className="form-group"><label>Maintenance per mile</label><input type="number" min={0} step={0.01} value={maintenance} onChange={(e) => ed(setMaintenance)(num(e.target.value))} /><p className="field-note">Tires, oil, repairs.</p></div>
        <div className="form-group"><label>Insurance a year</label><input type="number" min={0} value={insurance} onChange={(e) => ed(setInsurance)(num(e.target.value))} /></div>
        <div className="form-group"><label>Truck payment a year</label><input type="number" min={0} value={truckPayment} onChange={(e) => ed(setTruckPayment)(num(e.target.value))} /></div>
        <div className="form-group"><label>Other fixed costs a year</label><input type="number" min={0} value={otherFixed} onChange={(e) => ed(setOtherFixed)(num(e.target.value))} /><p className="field-note">Permits, plates, ELD, parking.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'What does a mile net?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your rate and costs.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your trucking cost per mile</h3>
          <div className="result-line"><span>Fuel</span><span className="num">{cpm(result.fuelCostPerMile)}</span></div>
          <div className="result-line"><span>Variable (fuel + maintenance)</span><span className="num">{cpm(result.variableCostPerMile)}</span></div>
          <div className="result-line"><span>Fixed (insurance, payment, permits)</span><span className="num">{cpm(result.fixedCostPerMile)}</span></div>
          <div className="result-line total"><span>Total cost per mile</span><span className="num">{cpm(result.totalCostPerMile)}</span></div>
          <div className="result-line total"><span>Net per mile</span><span className="num">{cpm(result.netPerMile)}</span></div>
          <div className="result-line"><span>Annual net (before income tax)</span><span className="num">{formatMoney(result.annualNet)}</span></div>
          <p className="results-note">
            The freight rate never tells you if a load pays — the cost per mile does. Fixed costs spread over more
            miles fall per mile, so empty (deadhead) miles quietly raise your real cost. This is pre-tax economics;
            net profit is then subject to self-employment and income tax, and per-diem meal allowances add a
            deduction. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
