/** ProfessionalGamblerCalculator — casual vs Schedule C professional. */
import { useState } from 'react';
import { professionalGambler } from '../../lib/gambling';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function ProfessionalGamblerCalculator() {
  const [winnings, setWinnings] = useState(120000);
  const [losses, setLosses] = useState(70000);
  const [expenses, setExpenses] = useState(20000);
  const [other, setOther] = useState(20000);
  const [stateCode, setStateCode] = useState('');
  const [result, setResult] = useState<ReturnType<typeof professionalGambler> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(professionalGambler(winnings, losses, expenses, other, 'single', stateCode)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Gambling winnings</label><input type="number" min={0} value={winnings} onChange={(e) => ed(setWinnings)(num(e.target.value))} /></div>
        <div className="form-group"><label>Gambling losses</label><input type="number" min={0} value={losses} onChange={(e) => ed(setLosses)(num(e.target.value))} /></div>
        <div className="form-group"><label>Business expenses</label><input type="number" min={0} value={expenses} onChange={(e) => ed(setExpenses)(num(e.target.value))} /><p className="field-note">Travel, data, software — only a pro deducts these.</p></div>
        <div className="form-group"><label>Your other income</label><input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{!stateCode && <option value="">Federal only</option>}{stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Casual vs professional'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your winnings, losses and expenses.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.betterAsProfessional ? 'Professional status saves tax here' : 'Casual status is better here'}</h3>
          <div className="result-line"><span>Casual gambler — total tax</span><span className="num">{formatMoney(result.casualTax)}</span></div>
          <div className="result-line"><span>Professional — income tax</span><span className="num">{formatMoney(result.professionalIncomeTax)}</span></div>
          <div className="result-line"><span>Professional — self-employment tax</span><span className="num">{formatMoney(result.professionalSeTax)}</span></div>
          <div className="result-line total"><span>Professional — total tax</span><span className="num">{formatMoney(result.professionalTotalTax)}</span></div>
          <p className="results-note">
            A professional reports on Schedule C and can deduct losses (still 90%-capped) AND business expenses — but
            pays 15.3% self-employment tax on the net. It wins when expenses are large; casual wins when they are
            small, because it dodges the SE tax. Professional status is a facts test, not a choice. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
