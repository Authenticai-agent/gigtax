/** CreditCardPayoffCalculator — the minimum-payment trap vs a fixed higher payment. */
import { useState } from 'react';
import { creditCardTrap } from '../../lib/personal-finance';
import { formatMoney } from '../../lib/tax-engine';

const months = (m: number) => (Number.isFinite(m) ? `${Math.floor(m / 12)}y ${m % 12}m` : 'never');

export default function CreditCardPayoffCalculator() {
  const [balance, setBalance] = useState(6000);
  const [apr, setApr] = useState(22);
  const [minPct, setMinPct] = useState(2);
  const [fixedPayment, setFixed] = useState(250);
  const [result, setResult] = useState<ReturnType<typeof creditCardTrap> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(creditCardTrap(balance, apr / 100, minPct / 100, fixedPayment)); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Card balance</label><input type="number" min={0} value={balance} onChange={(e) => ed(setBalance)(num(e.target.value))} /></div>
        <div className="form-group"><label>APR (%)</label><input type="number" min={0} step={0.5} value={apr} onChange={(e) => ed(setApr)(num(e.target.value))} /></div>
        <div className="form-group"><label>Minimum payment (% of balance)</label><input type="number" min={0} step={0.5} value={minPct} onChange={(e) => ed(setMinPct)(num(e.target.value))} /><p className="field-note">Cards usually set 1–3%, floored at ~$25.</p></div>
        <div className="form-group"><label>A fixed payment instead</label><input type="number" min={0} value={fixedPayment} onChange={(e) => ed(setFixed)(num(e.target.value))} /><p className="field-note">What paying a steady amount would do.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Show the trap'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your balance and APR.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.neverPaysOff ? 'The minimum never pays this off' : 'Minimum payment vs a fixed payment'}</h3>
          <div className="result-line"><span>Minimum payment (start)</span><span className="num">{formatMoney(result.minPayment)}</span></div>
          <div className="result-line"><span>Time at the minimum</span><span className="num">{months(result.minMonths)}</span></div>
          <div className="result-line"><span>Interest at the minimum</span><span className="num">{Number.isFinite(result.minTotalInterest) ? formatMoney(result.minTotalInterest) : '—'}</span></div>
          <div className="result-line"><span>Time at {formatMoney(fixedPayment)}/mo</span><span className="num">{months(result.fixedMonths)}</span></div>
          <div className="result-line"><span>Interest at {formatMoney(fixedPayment)}/mo</span><span className="num">{Number.isFinite(result.fixedTotalInterest) ? formatMoney(result.fixedTotalInterest) : '—'}</span></div>
          {Number.isFinite(result.interestSaved) && <div className="result-line total"><span>Interest saved by the fixed payment</span><span className="num">{formatMoney(result.interestSaved)}</span></div>}
          <p className="results-note">
            The minimum payment is a percent of the balance, so it shrinks as the balance does — which is exactly
            what stretches the payoff over years and piles on interest. A fixed payment kills the balance far
            faster. Minimum-payment interest here is a close approximation; a real card recalculates monthly. Not
            financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
