/** CollegeRoiCalculator — lifetime earnings with a degree vs an alternative path. */
import { useState } from 'react';
import { collegeROI } from '../../lib/personal-finance';
import { formatMoney, formatPct } from '../../lib/tax-engine';

export default function CollegeRoiCalculator() {
  const [degreeCost, setCost] = useState(100000);
  const [yearsToComplete, setYears] = useState(4);
  const [startingSalary, setSalary] = useState(65000);
  const [altPathCost, setAltCost] = useState(5000);
  const [altStartingSalary, setAltSalary] = useState(40000);
  const [result, setResult] = useState<ReturnType<typeof collegeROI> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(collegeROI({ degreeCost, yearsToComplete, startingSalary, salaryGrowth: 0.03, altPathCost, altStartingSalary, careerYears: 40 })); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Total net degree cost</label><input type="number" min={0} value={degreeCost} onChange={(e) => ed(setCost)(num(e.target.value))} /><p className="field-note">Tuition and fees after aid.</p></div>
        <div className="form-group"><label>Years to complete</label><input type="number" min={1} value={yearsToComplete} onChange={(e) => ed(setYears)(num(e.target.value))} /></div>
        <div className="form-group"><label>Starting salary with the degree</label><input type="number" min={0} value={startingSalary} onChange={(e) => ed(setSalary)(num(e.target.value))} /></div>
        <div className="form-group"><label>Alternative path cost</label><input type="number" min={0} value={altPathCost} onChange={(e) => ed(setAltCost)(num(e.target.value))} /><p className="field-note">Trade school, or $0 for straight to work.</p></div>
        <div className="form-group"><label>Alternative starting salary</label><input type="number" min={0} value={altStartingSalary} onChange={(e) => ed(setAltSalary)(num(e.target.value))} /><p className="field-note">What you'd earn without the degree.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Is the degree worth it?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter the degree cost and the two starting salaries.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.netGain >= 0 ? 'The degree pays off over a career' : 'The alternative path earns more here'}</h3>
          <div className="result-line"><span>Lifetime earnings with the degree</span><span className="num">{formatMoney(result.degreeLifetime)}</span></div>
          <div className="result-line"><span>Lifetime earnings, alternative path</span><span className="num">{formatMoney(result.altLifetime)}</span></div>
          <div className="result-line total"><span>Net lifetime gain from the degree</span><span className="num">{formatMoney(result.netGain)}</span></div>
          <div className="result-line"><span>Return on the degree's cost</span><span className="num">{formatPct(result.roi)}</span></div>
          <div className="result-line"><span>Break-even year (degree pulls ahead)</span><span className="num">{result.breakEvenYear ? `year ${result.breakEvenYear}` : 'not within a career'}</span></div>
          <p className="results-note">
            The degree path starts earning later (after {yearsToComplete} years) and carries its cost, but a higher
            salary compounds over a 40-year career. Both salaries grow 3%/year here. This weighs money only — it does
            not price the non-financial value of an education, or the risk of not finishing. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
