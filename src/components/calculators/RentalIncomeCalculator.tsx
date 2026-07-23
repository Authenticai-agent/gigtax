/** RentalIncomeCalculator — net rental income and tax, Schedule E or C. */
import { useState } from 'react';
import { rentalIncome } from '../../lib/rental';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;
const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function RentalIncomeCalculator() {
  const [rent, setRent] = useState(48000);
  const [basis, setBasis] = useState(275000);
  const [mortgage, setMortgage] = useState(12000);
  const [ptax, setPtax] = useState(4500);
  const [insurance, setInsurance] = useState(1800);
  const [repairs, setRepairs] = useState(3000);
  const [mgmt, setMgmt] = useState(0);
  const [other, setOther] = useState(80000);
  const [status, setStatus] = useState('single');
  const [stateCode, setStateCode] = useState('');
  const [scheduleC, setScheduleC] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof rentalIncome> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(rentalIncome(rent, basis, mortgage, ptax, insurance, repairs, mgmt, other, status, stateCode, scheduleC)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Annual gross rent</label><input type="number" min={0} value={rent} onChange={(e) => ed(setRent)(num(e.target.value))} /></div>
        <div className="form-group"><label>Building basis (not land)</label><input type="number" min={0} value={basis} onChange={(e) => ed(setBasis)(num(e.target.value))} /><p className="field-note">Depreciated over 27.5 years.</p></div>
        <div className="form-group"><label>Mortgage interest</label><input type="number" min={0} value={mortgage} onChange={(e) => ed(setMortgage)(num(e.target.value))} /></div>
        <div className="form-group"><label>Property tax</label><input type="number" min={0} value={ptax} onChange={(e) => ed(setPtax)(num(e.target.value))} /></div>
        <div className="form-group"><label>Insurance</label><input type="number" min={0} value={insurance} onChange={(e) => ed(setInsurance)(num(e.target.value))} /></div>
        <div className="form-group"><label>Repairs & maintenance</label><input type="number" min={0} value={repairs} onChange={(e) => ed(setRepairs)(num(e.target.value))} /></div>
        <div className="form-group"><label>Management & other</label><input type="number" min={0} value={mgmt} onChange={(e) => ed(setMgmt)(num(e.target.value))} /></div>
        <div className="form-group"><label>Your other taxable income</label><input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{!stateCode && <option value="">Select…</option>}{stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
        <div className="form-group"><label>Filing status</label><select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem', alignSelf: 'end' }}>
          <input id="schC" type="checkbox" checked={scheduleC} onChange={(e) => ed(setScheduleC)(e.target.checked)} style={{ width: 'auto' }} />
          <label htmlFor="schC" style={{ margin: 0 }}>Short-term rental with services (Schedule C)</label>
        </div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate rental tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your rent and expenses.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your rental income and tax</h3>
          <div className="result-line"><span>Gross rent</span><span className="num">{formatMoney(result.grossRent)}</span></div>
          <div className="result-line"><span>Depreciation</span><span className="num">− {formatMoney(result.depreciation)}</span></div>
          <div className="result-line"><span>Total expenses (incl. depreciation)</span><span className="num">− {formatMoney(result.totalExpenses)}</span></div>
          <div className="result-line total"><span>{result.netIncome >= 0 ? 'Net rental income' : 'Net rental loss'}</span><span className="num">{formatMoney(result.netIncome)}</span></div>
          {result.scheduleC && <div className="result-line"><span>Self-employment tax</span><span className="num">− {formatMoney(result.seTax)}</span></div>}
          <div className="result-line"><span>Income tax on the rental</span><span className="num">− {formatMoney(result.incomeTax + result.stateTax)}</span></div>
          <div className="result-line total"><span>After-tax rental income</span><span className="num">{formatMoney(result.afterTax)}</span></div>
          <p className="results-note">
            Depreciation is a paper deduction that shelters cash rent — but it is recaptured when you sell. A simple
            rental is Schedule E with no self-employment tax; a short-term rental where you provide substantial
            services is Schedule C and owes it. A net loss may be limited by the passive-loss rules. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
