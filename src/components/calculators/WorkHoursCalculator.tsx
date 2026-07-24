/** WorkHoursCalculator — your true hourly wage once commute, unpaid OT and work costs count. */
import { useState } from 'react';
import { trueHourlyWage } from '../../lib/lifestyle';
import { formatMoney, formatPct } from '../../lib/tax-engine';

export default function WorkHoursCalculator() {
  const [salary, setSalary] = useState(90000);
  const [contracted, setContracted] = useState(40);
  const [unpaidOt, setUnpaidOt] = useState(6);
  const [commute, setCommute] = useState(5);
  const [weeks, setWeeks] = useState(48);
  const [workCosts, setWorkCosts] = useState(6000);
  const [result, setResult] = useState<ReturnType<typeof trueHourlyWage> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(trueHourlyWage(salary, contracted, unpaidOt, commute, weeks, workCosts)); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Annual salary</label><input type="number" min={0} value={salary} onChange={(e) => ed(setSalary)(num(e.target.value))} /></div>
        <div className="form-group"><label>Contracted hours / week</label><input type="number" min={0} value={contracted} onChange={(e) => ed(setContracted)(num(e.target.value))} /></div>
        <div className="form-group"><label>Unpaid overtime / week</label><input type="number" min={0} value={unpaidOt} onChange={(e) => ed(setUnpaidOt)(num(e.target.value))} /><p className="field-note">Hours worked beyond contract with no extra pay.</p></div>
        <div className="form-group"><label>Commute hours / week</label><input type="number" min={0} value={commute} onChange={(e) => ed(setCommute)(num(e.target.value))} /></div>
        <div className="form-group"><label>Weeks worked / year</label><input type="number" min={1} value={weeks} onChange={(e) => ed(setWeeks)(num(e.target.value))} /></div>
        <div className="form-group"><label>Work-related costs / year</label><input type="number" min={0} value={workCosts} onChange={(e) => ed(setWorkCosts)(num(e.target.value))} /><p className="field-note">Commuting, lunches, wardrobe, parking.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'My real hourly wage'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your salary and real hours.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your true hourly wage</h3>
          <div className="result-line"><span>Nominal hourly (salary ÷ contracted hours)</span><span className="num">{formatMoney(result.nominalHourly)}</span></div>
          <div className="result-line"><span>Real hours a year (with OT + commute)</span><span className="num">{result.realHours.toLocaleString()}</span></div>
          <div className="result-line total"><span>Real hourly wage</span><span className="num">{formatMoney(result.realHourly)}</span></div>
          <div className="result-line"><span>The gap</span><span className="num">{formatMoney(result.gapPerHour)}/hr ({formatPct(result.gapPct)} less)</span></div>
          <p className="results-note">
            The "salary ÷ 2,080 hours" figure ignores the hours work really takes — unpaid overtime and the commute —
            and the money it costs to show up. Counting both, your real hourly wage is {formatPct(result.gapPct)} below
            the number on paper. Useful for weighing a shorter commute or a job with real boundaries. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
