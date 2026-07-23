/** FireCalculator — years to financial independence at your savings rate. */
import { useState } from 'react';
import { projectToTarget } from '../../lib/personal-finance';
import { formatMoney } from '../../lib/tax-engine';

/** Shared by the FIRE and "when can I retire" pages — same engine, different framing. */
export default function FireCalculator({ mode = 'fire' as 'fire' | 'retire' }) {
  const [currentAge, setAge] = useState(30);
  const [currentSavings, setSavings] = useState(50000);
  const [monthlyContribution, setContrib] = useState(1500);
  const [annualReturn, setReturn] = useState(7);
  const [annualExpenses, setExpenses] = useState(50000);
  const [withdrawalRate, setSWR] = useState(4);
  const [result, setResult] = useState<ReturnType<typeof projectToTarget> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(projectToTarget({ currentAge, currentSavings, monthlyContribution, annualReturn: annualReturn / 100, annualExpenses, withdrawalRate: withdrawalRate / 100 })); setStale(false); };
  const spendLabel = mode === 'retire' ? 'Income you want in retirement (per year)' : 'Annual spending in retirement';

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Your age now</label><input type="number" min={0} value={currentAge} onChange={(e) => ed(setAge)(num(e.target.value))} /></div>
        <div className="form-group"><label>Current savings & investments</label><input type="number" min={0} value={currentSavings} onChange={(e) => ed(setSavings)(num(e.target.value))} /></div>
        <div className="form-group"><label>Monthly contribution</label><input type="number" min={0} value={monthlyContribution} onChange={(e) => ed(setContrib)(num(e.target.value))} /></div>
        <div className="form-group"><label>{spendLabel}</label><input type="number" min={0} value={annualExpenses} onChange={(e) => ed(setExpenses)(num(e.target.value))} /></div>
        <div className="form-group"><label>Assumed annual return (%)</label><input type="number" min={0} step={0.5} value={annualReturn} onChange={(e) => ed(setReturn)(num(e.target.value))} /><p className="field-note">After-inflation returns run lower — set this to taste.</p></div>
        <div className="form-group"><label>Safe withdrawal rate (%)</label><input type="number" min={0} step={0.5} value={withdrawalRate} onChange={(e) => ed(setSWR)(num(e.target.value))} /><p className="field-note">The 4% rule is the common default.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : (mode === 'retire' ? 'When can I retire?' : 'How long until I’m rich?')}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your savings and target.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.unreachable ? 'Not reached within 70 years' : (mode === 'retire' ? `You could retire at ${result.ageAtTarget}` : `Financial independence in ${result.yearsToTarget} years`)}</h3>
          <div className="result-line"><span>Your number ({withdrawalRate}% rule on {formatMoney(annualExpenses)})</span><span className="num">{formatMoney(result.target)}</span></div>
          {!result.unreachable && <div className="result-line total"><span>Years to get there</span><span className="num">{result.yearsToTarget}</span></div>}
          {!result.unreachable && <div className="result-line"><span>Your age then</span><span className="num">{result.ageAtTarget}</span></div>}
          {!result.unreachable && <div className="result-line"><span>Portfolio at that point</span><span className="num">{formatMoney(result.projectedAtTarget)}</span></div>}
          {result.unreachable && <div className="result-line"><span>Portfolio after 70 years</span><span className="num">{formatMoney(result.projectedAtTarget)}</span></div>}
          <p className="results-note">
            Your "number" is the nest egg whose safe withdrawal covers your spending — {formatMoney(annualExpenses)}
            {' '}at {withdrawalRate}% is {formatMoney(result.target)}. Reaching it assumes your balance and
            contributions compound at {annualReturn}% every year, which real markets do not do smoothly. An
            assumption, not a promise. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
