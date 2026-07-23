/** SubscriptionAuditCalculator — total subscription spend and its opportunity cost. */
import { useState } from 'react';
import { subscriptionAudit } from '../../lib/personal-finance';
import { formatMoney } from '../../lib/tax-engine';

const SEED = [
  { name: 'Streaming (video)', amount: 16 },
  { name: 'Music', amount: 11 },
  { name: 'Cloud storage', amount: 3 },
  { name: 'Gym', amount: 40 },
  { name: 'News / apps', amount: 15 },
];

export default function SubscriptionAuditCalculator() {
  const [subs, setSubs] = useState(SEED);
  const [years, setYears] = useState(20);
  const [result, setResult] = useState<ReturnType<typeof subscriptionAudit> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const touch = () => { if (result) setStale(true); };
  const setAmount = (i: number, v: number) => { setSubs((s) => s.map((x, j) => (j === i ? { ...x, amount: v } : x))); touch(); };
  const monthlyTotal = subs.reduce((s, x) => s + x.amount, 0);
  const calc = () => { setResult(subscriptionAudit(monthlyTotal, 0.07, years)); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        {subs.map((s, i) => (
          <div className="form-group" key={s.name}><label>{s.name} ($/mo)</label>
            <input type="number" min={0} value={s.amount} onChange={(e) => setAmount(i, num(e.target.value))} /></div>
        ))}
        <div className="form-group"><label>Invested over (years)</label><input type="number" min={1} value={years} onChange={(e) => { setYears(num(e.target.value)); touch(); }} /><p className="field-note">If you invested it instead, at 7%.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Add it up'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Adjust the amounts to match your subscriptions.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your subscriptions add up</h3>
          <div className="result-line"><span>Total per month</span><span className="num">{formatMoney(result.monthlyTotal)}</span></div>
          <div className="result-line total"><span>Total per year</span><span className="num">{formatMoney(result.annualTotal)}</span></div>
          <div className="result-line"><span>If invested for {result.years} years (at 7%)</span><span className="num">{formatMoney(result.investedOverYears)}</span></div>
          <p className="results-note">
            {formatMoney(result.monthlyTotal)}/month feels small, but it is {formatMoney(result.annualTotal)} a year —
            and invested at 7% for {result.years} years it would grow to {formatMoney(result.investedOverYears)}. The
            point is not to cancel everything, but to see the true annual price of "just $X a month." Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
