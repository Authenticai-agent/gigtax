/** InvestmentIncomeCalculator — taxable interest as ordinary income, with NIIT. */
import { useState } from 'react';
import { investmentTax, stateOrdinaryTaxOn } from '../../lib/capital-gains';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;
const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

export default function InvestmentIncomeCalculator() {
  const [status, setStatus] = useState('single');
  const [stateCode, setStateCode] = useState('');
  const [other, setOther] = useState(80000);
  const [interest, setInterest] = useState(4000);
  const [result, setResult] = useState<ReturnType<typeof investmentTax> | null>(null);
  const [stateTax, setStateTax] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    setResult(investmentTax({
      status, otherOrdinaryIncome: other, taxableInterest: interest,
      applyStandardDeduction: true,
    }));
    setStateTax(stateCode ? Math.round(stateOrdinaryTaxOn(stateCode, other, interest, status)) : null);
    setStale(false);
  };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Other taxable income</label>
          <input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>Taxable interest</label>
          <input type="number" min={0} value={interest} onChange={(e) => ed(setInterest)(num(e.target.value))} />
          <p className="field-note">Savings, CDs, corporate and Treasury bonds. Exclude tax-exempt muni interest.</p></div>
        <div className="form-group"><label>State</label>
          <select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>
            <option value="">Federal only</option>
            {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
          <p className="field-note">Treasury interest is state-exempt; enter it, but note your state won't tax it.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate interest tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your interest income and other income.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Federal tax on your 2026 interest</h3>
          <div className="result-line"><span>Interest taxed at your ordinary rate</span><span className="num">{formatMoney(result.ordinaryTax)}</span></div>
          {result.niit.tax > 0 && <div className="result-line"><span>Net investment income tax (3.8%)</span><span className="num">{formatMoney(result.niit.tax)}</span></div>}
          <div className="result-line total"><span>Total federal tax on interest</span><span className="num">{formatMoney(result.totalInvestmentTax)}</span></div>
          {stateTax !== null && <div className="result-line"><span>{states[stateCode]?.name} tax on interest</span><span className="num">{formatMoney(stateTax)}</span></div>}
          {stateTax !== null && <div className="result-line total"><span>Federal + state tax</span><span className="num">{formatMoney(result.totalInvestmentTax + stateTax)}</span></div>}
          <div className="result-line"><span>Effective rate (federal)</span><span className="num">{formatPct(result.effectiveRateOnInvestment)}</span></div>
          <p className="results-note">
            Interest has no preferential rate — it is taxed like wages. Municipal bond interest is exempt from
            federal tax (don't enter it); Treasury interest is federally taxable but state-exempt — so a state
            figure here overstates it if some is Treasury interest. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
