/** BudgetCalculator — the 50/30/20 rule on take-home pay, optionally vs actuals. */
import { useState } from 'react';
import { budget503020 } from '../../lib/personal-finance';
import { formatMoney } from '../../lib/tax-engine';

export default function BudgetCalculator() {
  const [income, setIncome] = useState(5000);
  const [actualNeeds, setNeeds] = useState(0);
  const [actualWants, setWants] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof budget503020> | null>(null);
  const [stale, setStale] = useState(false);
  const [compared, setCompared] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    const useActuals = actualNeeds > 0 || actualWants > 0;
    setResult(budget503020(income, useActuals ? actualNeeds : -1, useActuals ? actualWants : -1));
    setCompared(useActuals); setStale(false);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Monthly take-home pay</label><input type="number" min={0} value={income} onChange={(e) => ed(setIncome)(num(e.target.value))} /><p className="field-note">After tax — what actually lands in your account.</p></div>
        <div className="form-group"><label>Your actual needs (optional)</label><input type="number" min={0} value={actualNeeds} onChange={(e) => ed(setNeeds)(num(e.target.value))} /><p className="field-note">Rent, groceries, utilities, minimum debt.</p></div>
        <div className="form-group"><label>Your actual wants (optional)</label><input type="number" min={0} value={actualWants} onChange={(e) => ed(setWants)(num(e.target.value))} /><p className="field-note">Dining, subscriptions, travel, fun.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Build my budget'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your monthly take-home pay.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your 50/30/20 split</h3>
          <div className="result-line"><span>Needs (50%)</span><span className="num">{formatMoney(result.needs)}</span></div>
          <div className="result-line"><span>Wants (30%)</span><span className="num">{formatMoney(result.wants)}</span></div>
          <div className="result-line total"><span>Savings & debt payoff (20%)</span><span className="num">{formatMoney(result.savings)}</span></div>
          {compared && <div className="result-line"><span>Needs over budget</span><span className="num">{result.needsOver > 0 ? formatMoney(result.needsOver) : 'on track'}</span></div>}
          {compared && <div className="result-line"><span>Wants over budget</span><span className="num">{result.wantsOver > 0 ? formatMoney(result.wantsOver) : 'on track'}</span></div>}
          {compared && <div className="result-line total"><span>Savings vs the 20% target</span><span className="num">{result.savingsGap > 0 ? `${formatMoney(result.savingsGap)} short` : 'on track'}</span></div>}
          <p className="results-note">
            The 50/30/20 rule splits take-home pay into needs, wants, and savings-plus-debt-payoff. It is a
            starting frame, not a law — high-cost cities often break the 50% needs line, and that is fine as long
            as savings does not fall to zero. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
