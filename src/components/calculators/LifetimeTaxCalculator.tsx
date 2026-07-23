/** LifetimeTaxCalculator — a career-long running total of tax on labor income. */
import { useState } from 'react';
import { lifetimeTax } from '../../lib/personal-finance';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [['single', 'Single'], ['mfj', 'Married filing jointly'], ['hoh', 'Head of household']] as const;
const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function LifetimeTaxCalculator() {
  const [currentAge, setAge] = useState(40);
  const [careerStartAge, setStart] = useState(22);
  const [retireAge, setRetire] = useState(65);
  const [currentIncome, setIncome] = useState(75000);
  const [incomeGrowth, setGrowth] = useState(3);
  const [contribution401kPct, set401k] = useState(6);
  const [status, setStatus] = useState('single');
  const [stateCode, setState] = useState('CA');
  const [result, setResult] = useState<ReturnType<typeof lifetimeTax> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(lifetimeTax({ currentAge, careerStartAge, retireAge, currentIncome, incomeGrowth: incomeGrowth / 100, contribution401kPct: contribution401kPct / 100, status, stateCode })); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Your age now</label><input type="number" min={0} value={currentAge} onChange={(e) => ed(setAge)(num(e.target.value))} /></div>
        <div className="form-group"><label>Age you started working</label><input type="number" min={0} value={careerStartAge} onChange={(e) => ed(setStart)(num(e.target.value))} /></div>
        <div className="form-group"><label>Planned retirement age</label><input type="number" min={0} value={retireAge} onChange={(e) => ed(setRetire)(num(e.target.value))} /></div>
        <div className="form-group"><label>Current annual income</label><input type="number" min={0} value={currentIncome} onChange={(e) => ed(setIncome)(num(e.target.value))} /></div>
        <div className="form-group"><label>Annual income growth (%)</label><input type="number" min={0} step={0.5} value={incomeGrowth} onChange={(e) => ed(setGrowth)(num(e.target.value))} /></div>
        <div className="form-group"><label>Pre-tax 401(k) contribution (%)</label><input type="number" min={0} step={1} value={contribution401kPct} onChange={(e) => ed(set401k)(num(e.target.value))} /></div>
        <div className="form-group"><label>Filing status</label><select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={(e) => ed(setState)(e.target.value)}>{stateOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Add up a lifetime'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your career span and income.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Tax on a {result.workingYears}-year career</h3>
          <div className="result-line"><span>Total career income</span><span className="num">{formatMoney(result.totalIncome)}</span></div>
          <div className="result-line"><span>Federal income tax</span><span className="num">{formatMoney(result.totalFederal)}</span></div>
          <div className="result-line"><span>State income tax</span><span className="num">{formatMoney(result.totalState)}</span></div>
          <div className="result-line"><span>Your FICA (Social Security + Medicare)</span><span className="num">{formatMoney(result.totalEmployeeFICA)}</span></div>
          <div className="result-line total"><span>Total you personally pay</span><span className="num">{formatMoney(result.totalPersonalPaid)}</span></div>
          <div className="result-line"><span>+ employer FICA on your labor</span><span className="num">{formatMoney(result.totalEmployerFICA)}</span></div>
          <div className="result-line total"><span>Total the government collects on your work</span><span className="num">{formatMoney(result.totalIRSCollected)}</span></div>
          <div className="result-line"><span>Effective lifetime tax rate</span><span className="num">{formatPct(result.effectiveLifetimeRate)}</span></div>
          <p className="results-note">
            Federal, state and FICA on labor income only — no sales, property or gas tax, which would push the total
            higher. Income is projected from today's salary at your growth rate across the whole career, so it is an
            estimate, not a record. Pre-tax 401(k) contributions lower it; a no-income-tax state lowers the state line
            to zero. Not tax or financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
