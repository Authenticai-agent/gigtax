/** CapitalGainsCalculator — short vs long-term gains, losses, NIIT, state layer. */
import { useState } from 'react';
import { investmentTax, stateGainsTax } from '../../lib/capital-gains';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;
const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

export default function CapitalGainsCalculator() {
  const [status, setStatus] = useState('single');
  const [stateCode, setStateCode] = useState('');
  const [other, setOther] = useState(80000);
  const [stGains, setStGains] = useState(5000);
  const [stLosses, setStLosses] = useState(0);
  const [ltGains, setLtGains] = useState(20000);
  const [ltLosses, setLtLosses] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof investmentTax> | null>(null);
  const [stateResult, setStateResult] = useState<ReturnType<typeof stateGainsTax> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    const r = investmentTax({
      status, otherOrdinaryIncome: other,
      shortTermGains: stGains, shortTermLosses: stLosses,
      longTermGains: ltGains, longTermLosses: ltLosses,
      applyStandardDeduction: true,
    });
    setResult(r);
    setStateResult(stateCode ? stateGainsTax(stateCode, other, r.netShortTerm, r.netLongTerm, status) : null);
    setStale(false);
  };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>State</label>
          <select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>
            <option value="">Federal only</option>
            {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
          <p className="field-note">Adds your state's treatment of gains.</p></div>
        <div className="form-group"><label>Other taxable income (wages etc.)</label>
          <input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} />
          <p className="field-note">Positions your gains in the 0/15/20% brackets.</p></div>
        <div className="form-group"><label>Short-term gains (held ≤1 year)</label>
          <input type="number" min={0} value={stGains} onChange={(e) => ed(setStGains)(num(e.target.value))} /></div>
        <div className="form-group"><label>Short-term losses</label>
          <input type="number" min={0} value={stLosses} onChange={(e) => ed(setStLosses)(num(e.target.value))} /></div>
        <div className="form-group"><label>Long-term gains (held &gt;1 year)</label>
          <input type="number" min={0} value={ltGains} onChange={(e) => ed(setLtGains)(num(e.target.value))} /></div>
        <div className="form-group"><label>Long-term losses</label>
          <input type="number" min={0} value={ltLosses} onChange={(e) => ed(setLtLosses)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate tax on gains'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your gains and other income.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Federal tax on your 2026 gains</h3>
          <div className="result-line"><span>Net short-term gain (ordinary rates)</span><span className="num">{formatMoney(result.netShortTerm)}</span></div>
          <div className="result-line"><span>Net long-term gain (0/15/20%)</span><span className="num">{formatMoney(result.netLongTerm)}</span></div>
          {result.capitalLossDeduction > 0 && <div className="result-line"><span>Loss deducted against income this year</span><span className="num">− {formatMoney(result.capitalLossDeduction)}</span></div>}
          {result.capitalLossCarryover > 0 && <div className="result-line"><span>Loss carried forward</span><span className="num">{formatMoney(result.capitalLossCarryover)}</span></div>}
          <div className="result-line"><span>Tax on short-term gain</span><span className="num">{formatMoney(result.ordinaryTax)}</span></div>
          <div className="result-line"><span>Tax on long-term gain</span><span className="num">{formatMoney(result.preferentialTax)}</span></div>
          {result.niit.tax > 0 && <div className="result-line"><span>Net investment income tax (3.8%)</span><span className="num">{formatMoney(result.niit.tax)}</span></div>}
          <div className="result-line total"><span>Total federal tax on gains</span><span className="num">{formatMoney(result.totalInvestmentTax)}</span></div>
          {stateResult && <div className="result-line"><span>{states[stateCode]?.name} tax on gains</span><span className="num">{formatMoney(stateResult.stateTax)}</span></div>}
          {stateResult && <div className="result-line total"><span>Federal + state tax on gains</span><span className="num">{formatMoney(result.totalInvestmentTax + stateResult.stateTax)}</span></div>}
          <div className="result-line"><span>Effective rate on the gains (federal)</span><span className="num">{formatPct(result.effectiveRateOnInvestment)}</span></div>
          {stateResult && <p className="results-note">{stateResult.note}</p>}
          <p className="results-note">
            {stateCode
              ? 'Federal plus your state. Holding an asset one more day past a year drops the federal rate from ordinary to 0/15/20%. Not tax advice.'
              : 'Federal only — pick a state to add its treatment of gains. Holding past one year drops the federal rate from ordinary to 0/15/20%. Not tax advice.'}
          </p>
        </div>
      )}
    </div>
  );
}
