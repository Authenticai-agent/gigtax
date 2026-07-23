/** GigIncomeCalculator — unit economics: net profit, $/hour, $/mile after mileage. */
import { useState } from 'react';
import { gigUnitEconomics } from '../../lib/gig-economics';
import { formatMoney } from '../../lib/tax-engine';

export default function GigIncomeCalculator() {
  const [gross, setGross] = useState(20000);
  const [hours, setHours] = useState(500);
  const [milesH1, setMilesH1] = useState(4000);
  const [milesH2, setMilesH2] = useState(4000);
  const [other, setOther] = useState(500);
  const [result, setResult] = useState<ReturnType<typeof gigUnitEconomics> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(gigUnitEconomics(gross, hours, milesH1, milesH2, other)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Gross earnings (all apps)</label>
          <input type="number" min={0} value={gross} onChange={(e) => ed(setGross)(num(e.target.value))} /></div>
        <div className="form-group"><label>Hours worked</label>
          <input type="number" min={0} value={hours} onChange={(e) => ed(setHours)(num(e.target.value))} /></div>
        <div className="form-group"><label>Miles driven Jan–Jun</label>
          <input type="number" min={0} value={milesH1} onChange={(e) => ed(setMilesH1)(num(e.target.value))} />
          <p className="field-note">Deducted at 72.5¢.</p></div>
        <div className="form-group"><label>Miles driven Jul–Dec</label>
          <input type="number" min={0} value={milesH2} onChange={(e) => ed(setMilesH2)(num(e.target.value))} />
          <p className="field-note">Deducted at 76¢.</p></div>
        <div className="form-group"><label>Other expenses</label>
          <input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} />
          <p className="field-note">Phone, hot bags, tolls.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'What does an hour pay?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your earnings, hours and miles.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>What your gig work really pays</h3>
          <div className="result-line"><span>Gross per hour</span><span className="num">{formatMoney(result.grossPerHour)}/hr</span></div>
          <div className="result-line"><span>Mileage deduction (a real cost too)</span><span className="num">− {formatMoney(result.mileageDeduction)}</span></div>
          <div className="result-line total"><span>Net profit</span><span className="num">{formatMoney(result.netProfit)}</span></div>
          <div className="result-line"><span>Net per hour</span><span className="num">{formatMoney(result.netPerHour)}/hr</span></div>
          <div className="result-line"><span>Net per mile</span><span className="num">{formatMoney(result.netPerMile)}/mi</span></div>
          <div className="result-line"><span>Set aside for taxes (about 30%)</span><span className="num">{formatMoney(result.suggestedSetAside)}</span></div>
          <div className="result-line total"><span>Take-home per hour after taxes</span><span className="num">{formatMoney(result.afterSetAsidePerHour)}/hr</span></div>
          <p className="results-note">
            The mileage deduction stands in for the real cost of driving — gas, wear, depreciation — so net-per-hour
            is closer to the truth than the app's gross figure. Set aside about 30% for self-employment and income
            tax. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
