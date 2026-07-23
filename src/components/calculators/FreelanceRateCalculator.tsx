/** FreelanceRateCalculator — the floor hourly rate to keep a target take-home. */
import { useState } from 'react';
import { freelanceRate } from '../../lib/se-business';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;
const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

export default function FreelanceRateCalculator() {
  const [target, setTarget] = useState(80000);
  const [expenses, setExpenses] = useState(6000);
  const [stateCode, setStateCode] = useState('');
  const [status, setStatus] = useState('single');
  const [weeksOff, setWeeksOff] = useState(6);
  const [hoursWeek, setHoursWeek] = useState(25);
  const [projectHours, setProjectHours] = useState(40);
  const [result, setResult] = useState<ReturnType<typeof freelanceRate> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(freelanceRate(target, expenses, stateCode, status, weeksOff, hoursWeek, projectHours)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Take-home you need (a year)</label>
          <input type="number" min={0} value={target} onChange={(e) => ed(setTarget)(num(e.target.value))} />
          <p className="field-note">After all taxes — your actual pay.</p></div>
        <div className="form-group"><label>Business expenses (a year)</label>
          <input type="number" min={0} value={expenses} onChange={(e) => ed(setExpenses)(num(e.target.value))} /></div>
        <div className="form-group"><label>Billable hours a week</label>
          <input type="number" min={0} max={80} value={hoursWeek} onChange={(e) => ed(setHoursWeek)(num(e.target.value))} />
          <p className="field-note">Not all 40 — admin, sales and gaps don't bill.</p></div>
        <div className="form-group"><label>Weeks off a year</label>
          <input type="number" min={0} max={52} value={weeksOff} onChange={(e) => ed(setWeeksOff)(num(e.target.value))} /></div>
        <div className="form-group"><label>State</label>
          <select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>
            {!stateCode && <option value="">Select your state…</option>}
            {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select></div>
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Hours in a typical project</label>
          <input type="number" min={0} value={projectHours} onChange={(e) => ed(setProjectHours)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Show my floor rate'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your target pay and how you work.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your floor hourly rate</h3>
          <div className="result-line total"><span>Charge at least</span><span className="num">{formatMoney(result.hourlyRate)}/hr</span></div>
          <div className="result-line"><span>A typical project ({formatMoney(projectHours)} hrs)</span><span className="num">{formatMoney(result.projectRate)}</span></div>
          <div className="result-line"><span>Gross revenue this requires</span><span className="num">{formatMoney(result.grossRevenue)}</span></div>
          <div className="result-line"><span>Billable hours a year</span><span className="num">{formatMoney(result.annualBillableHours)}</span></div>
          <div className="result-line"><span>Self-employment + income tax</span><span className="num">− {formatMoney(result.seTax + result.federalTax + result.stateTax)}</span></div>
          <p className="results-note">
            This is a floor, not a target — the minimum to net your goal after self-employment tax, income tax and
            unbilled time. Your market rate may be higher; charge that. If your floor is above the market, the niche
            can't support the income you want at those hours. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
