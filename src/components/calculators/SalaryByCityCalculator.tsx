/** SalaryByCityCalculator — cost-of-living-adjusted equivalent salary between two cities. */
import { useState } from 'react';
import { salaryByCity } from '../../lib/personal-finance';
import { formatMoney } from '../../lib/tax-engine';
import { CITIES } from '../../data/cost-of-living';

const options = CITIES.map((c) => c.name);

export default function SalaryByCityCalculator() {
  const [salary, setSalary] = useState(100000);
  const [from, setFrom] = useState('Austin, TX');
  const [to, setTo] = useState('New York, NY');
  const [result, setResult] = useState<(ReturnType<typeof salaryByCity> & { from: string; to: string }) | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    const f = CITIES.find((c) => c.name === from)!;
    const t = CITIES.find((c) => c.name === to)!;
    setResult({ ...salaryByCity(salary, f.index, t.index), from, to });
    setStale(false);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Your current salary</label><input type="number" min={0} value={salary} onChange={(e) => ed(setSalary)(num(e.target.value))} /></div>
        <div className="form-group"><label>Current city</label><select value={from} onChange={(e) => ed(setFrom)(e.target.value)}>{options.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        <div className="form-group"><label>Moving to</label><select value={to} onChange={(e) => ed(setTo)(e.target.value)}>{options.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Compare cities'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Pick two cities and your current salary.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>To live the same in {result.to}</h3>
          <div className="result-line"><span>Your salary in {result.from}</span><span className="num">{formatMoney(salary)}</span></div>
          <div className="result-line total"><span>Equivalent salary in {result.to}</span><span className="num">{formatMoney(result.equivalentSalary)}</span></div>
          <div className="result-line"><span>{result.difference >= 0 ? 'Raise needed to break even' : 'Pay cut you could take'}</span><span className="num">{formatMoney(Math.abs(result.difference))}</span></div>
          <p className="results-note">
            {result.keepsPurchasingPower
              ? `${result.to} is cheaper than ${result.from}, so the same lifestyle costs less — you keep your purchasing power at a lower salary.`
              : `${result.to} is more expensive than ${result.from}, so you need a higher salary just to break even on lifestyle.`}
            {' '}Cost-of-living indices are approximate reference figures (base 100 = US average), driven mostly by
            housing, and exclude differences in state income tax. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
