/** NonprofitCalculator — mission income is exempt; unrelated business income is taxed. */
import { useState } from 'react';
import { nonprofitUBIT } from '../../lib/nonprofit';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

export default function NonprofitCalculator() {
  const [totalRevenue, setTotal] = useState(500000);
  const [exemptPct, setExemptPct] = useState(85);
  const [ubi, setUbi] = useState(15000);
  const [ubiDeductions, setDed] = useState(5000);
  const [stateCode, setStateCode] = useState('CA');
  const [result, setResult] = useState<ReturnType<typeof nonprofitUBIT> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(nonprofitUBIT({ totalRevenue, exemptPct, ubi, ubiDeductions, stateCode })); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Total annual revenue</label><input type="number" min={0} value={totalRevenue} onChange={(e) => ed(setTotal)(num(e.target.value))} /></div>
        <div className="form-group"><label>Mission-related / exempt (%)</label><input type="number" min={0} max={100} value={exemptPct} onChange={(e) => ed(setExemptPct)(num(e.target.value))} /><p className="field-note">Donations, grants, program fees, investment income.</p></div>
        <div className="form-group"><label>Unrelated business income (UBI)</label><input type="number" min={0} value={ubi} onChange={(e) => ed(setUbi)(num(e.target.value))} /><p className="field-note">A regular trade or business unrelated to your mission.</p></div>
        <div className="form-group"><label>UBI deductions</label><input type="number" min={0} value={ubiDeductions} onChange={(e) => ed(setDed)(num(e.target.value))} /><p className="field-note">Expenses directly connected to the UBI.</p></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{stateOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate UBI tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your revenue mix to see what — if anything — is taxed.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Tax on unrelated business income only</h3>
          <div className="result-line"><span>Total revenue</span><span className="num">{formatMoney(result.totalRevenue)}</span></div>
          <div className="result-line"><span>Mission income (tax-exempt)</span><span className="num">{formatMoney(result.exemptIncome)}</span></div>
          <div className="result-line"><span>Unrelated business income</span><span className="num">{formatMoney(result.ubi)}</span></div>
          <div className="result-line"><span>Less UBI deductions</span><span className="num">−{formatMoney(result.ubiDeductions)}</span></div>
          <div className="result-line"><span>Less $1,000 specific deduction</span><span className="num">−{formatMoney(result.specificDeduction)}</span></div>
          <div className="result-line"><span>Net taxable UBI</span><span className="num">{formatMoney(result.netUBI)}</span></div>
          <div className="result-line"><span>Federal UBIT (21%)</span><span className="num">{formatMoney(result.federalUBITax)}</span></div>
          <div className="result-line"><span>State UBI tax</span><span className="num">{formatMoney(result.stateUBITax)}</span></div>
          <div className="result-line total"><span>Total tax on UBI</span><span className="num">{formatMoney(result.totalTax)}</span></div>
          <p className="results-note">
            Your {formatMoney(result.exemptIncome)} of mission-related revenue is tax-exempt. Only unrelated business
            income is taxed — at the flat 21% corporate rate on Form 990-T, after a $1,000 specific deduction. Investment
            income (dividends, interest, most rents and royalties) is excluded from UBI by statute. Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
