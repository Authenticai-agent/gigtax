/** LotteryTaxCalculator — lump sum vs 30-year annuity take-home. */
import { useState } from 'react';
import { lotteryTax } from '../../lib/gambling';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function LotteryTaxCalculator() {
  const [jackpot, setJackpot] = useState(100000000);
  const [cash, setCash] = useState(60000000);
  const [other, setOther] = useState(0);
  const [stateCode, setStateCode] = useState('');
  const [result, setResult] = useState<ReturnType<typeof lotteryTax> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(lotteryTax(jackpot, cash, other, 'single', stateCode)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Advertised jackpot</label><input type="number" min={0} value={jackpot} onChange={(e) => ed(setJackpot)(num(e.target.value))} /><p className="field-note">The headline number — the 30-year annuity value.</p></div>
        <div className="form-group"><label>Lump-sum cash value</label><input type="number" min={0} value={cash} onChange={(e) => ed(setCash)(num(e.target.value))} /><p className="field-note">Usually ~60% of the jackpot.</p></div>
        <div className="form-group"><label>Your other income</label><input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{!stateCode && <option value="">Federal only</option>}{stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Lump sum vs annuity'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter the jackpot and cash value.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Lottery take-home</h3>
          <p className="section-label">Lump sum (cash value now)</p>
          <div className="result-line"><span>Cash value</span><span className="num">{formatMoney(result.cashValue)}</span></div>
          <div className="result-line"><span>24% withheld up front</span><span className="num">− {formatMoney(result.federalWithheld)}</span></div>
          <div className="result-line"><span>Total tax</span><span className="num">− {formatMoney(result.lumpSumTax)}</span></div>
          <div className="result-line total"><span>Lump sum after tax</span><span className="num">{formatMoney(result.lumpSumAfterTax)}</span></div>
          <p className="section-label">30-year annuity (full jackpot)</p>
          <div className="result-line"><span>Payment per year</span><span className="num">{formatMoney(result.annualPayment)}</span></div>
          <div className="result-line"><span>After tax per year</span><span className="num">{formatMoney(result.annuityAfterTaxPerYear)}</span></div>
          <div className="result-line total"><span>Annuity after tax, 30 years</span><span className="num">{formatMoney(result.annuityAfterTaxTotal)}</span></div>
          <p className="results-note">
            The annuity's after-tax total is larger — you avoid the up-front cash-value discount and spread income
            across years instead of stacking it all in the top bracket in one year. The lump sum wins only if you can
            invest it to out-earn that gap. Real annuities also rise about 5% a year (modeled flat here). Not tax or investment advice.
          </p>
        </div>
      )}
    </div>
  );
}
