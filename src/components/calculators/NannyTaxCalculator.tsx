/** NannyTaxCalculator — Schedule H household-employer taxes. */
import { useState } from 'react';
import { nannyTax } from '../../lib/household-employer';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

export default function NannyTaxCalculator() {
  const [wages, setWages] = useState(40000);
  const [tips, setTips] = useState(0);
  const [stateCode, setStateCode] = useState('CA');
  const [sutaRate, setSutaRate] = useState(3.4);
  const [sutaWageBase, setSutaWageBase] = useState(7000);
  const [sutaPaidOnTime, setPaidOnTime] = useState(true);
  const [fedWithheld, setFedWithheld] = useState(0);
  const [stateWithheld, setStateWithheld] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof nannyTax> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    setResult(nannyTax({ wages, tips, fedWithheld, stateWithheld, sutaRate: sutaRate / 100, sutaWageBase, sutaPaidOnTime, futaCreditReduction: 0 }));
    setStale(false);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Annual wages paid</label><input type="number" min={0} value={wages} onChange={(e) => ed(setWages)(num(e.target.value))} /></div>
        <div className="form-group"><label>Cash tips paid</label><input type="number" min={0} value={tips} onChange={(e) => ed(setTips)(num(e.target.value))} /></div>
        <div className="form-group"><label>Your state</label><select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{stateOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>State unemployment (SUTA) rate (%)</label><input type="number" min={0} step={0.1} value={sutaRate} onChange={(e) => ed(setSutaRate)(num(e.target.value))} /><p className="field-note">Your assigned state rate.</p></div>
        <div className="form-group"><label>State unemployment wage base ($)</label><input type="number" min={0} value={sutaWageBase} onChange={(e) => ed(setSutaWageBase)(num(e.target.value))} /></div>
        <div className="form-group"><label>State unemployment tax paid on time?</label><select value={sutaPaidOnTime ? 'yes' : 'no'} onChange={(e) => ed(setPaidOnTime)(e.target.value === 'yes')}><option value="yes">Yes — full FUTA credit</option><option value="no">No — full 6% FUTA</option></select></div>
        <div className="form-group"><label>Federal income tax withheld</label><input type="number" min={0} value={fedWithheld} onChange={(e) => ed(setFedWithheld)(num(e.target.value))} /><p className="field-note">Only if the employee asked you to.</p></div>
        <div className="form-group"><label>State income tax withheld</label><input type="number" min={0} value={stateWithheld} onChange={(e) => ed(setStateWithheld)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate employer taxes'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter the wages you pay to see what you owe as a household employer.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.meetsThreshold ? 'Household employer taxes' : 'Below the Schedule H threshold'}</h3>
          <div className="result-line"><span>Total wages paid</span><span className="num">{formatMoney(result.totalWages)}</span></div>
          <div className="result-line"><span>Employer Social Security (6.2%)</span><span className="num">{formatMoney(result.employerSS)}</span></div>
          <div className="result-line"><span>Employer Medicare (1.45%)</span><span className="num">{formatMoney(result.employerMedicare)}</span></div>
          <div className="result-line"><span>FUTA ({(result.effectiveFutaRate * 100).toFixed(1)}% of first $7,000)</span><span className="num">{formatMoney(result.futaTax)}</span></div>
          <div className="result-line"><span>State unemployment (SUTA)</span><span className="num">{formatMoney(result.sutaTax)}</span></div>
          <div className="result-line total"><span>Total employer taxes</span><span className="num">{formatMoney(result.totalEmployerTaxes)}</span></div>
          <div className="result-line total"><span>Total cost to you (wages + taxes)</span><span className="num">{formatMoney(result.totalCostToEmployer)}</span></div>
          <div className="result-line"><span>Employee FICA you withhold</span><span className="num">{formatMoney(result.employeeFICA)}</span></div>
          <div className="result-line"><span>Total withheld from the employee</span><span className="num">{formatMoney(result.totalWithheldFromEmployee)}</span></div>
          <p className="results-note">
            You report all of this on Schedule H with your Form 1040. You owe employer Social Security and Medicare, plus
            FUTA and state unemployment tax, and you withhold the employee's own FICA share from their pay. Paying state
            unemployment tax on time is what keeps FUTA at 0.6% instead of 6%. Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
