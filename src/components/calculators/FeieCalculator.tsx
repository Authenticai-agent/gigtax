/** FeieCalculator — foreign earned income exclusion with the §911 stacking rule. */
import { useState } from 'react';
import { feie, FEIE_LIMIT } from '../../lib/feie';
import { formatMoney } from '../../lib/tax-engine';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;

export default function FeieCalculator() {
  const [foreign, setForeign] = useState(100000);
  const [usIncome, setUsIncome] = useState(20000);
  const [status, setStatus] = useState('single');
  const [result, setResult] = useState<ReturnType<typeof feie> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(feie(foreign, usIncome, status)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Foreign earned income</label>
          <input type="number" min={0} value={foreign} onChange={(e) => ed(setForeign)(num(e.target.value))} />
          <p className="field-note">Wages or self-employment earned abroad. Excludable up to {formatMoney(FEIE_LIMIT)}.</p></div>
        <div className="form-group"><label>Other US-taxable income</label>
          <input type="number" min={0} value={usIncome} onChange={(e) => ed(setUsIncome)(num(e.target.value))} />
          <p className="field-note">US-source income, investment income — not excludable.</p></div>
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate with the exclusion'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your foreign and US income.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Foreign earned income exclusion</h3>
          <div className="result-line"><span>Foreign income you can exclude</span><span className="num">{formatMoney(result.exclusion)}</span></div>
          <div className="result-line"><span>Federal tax with the exclusion</span><span className="num">{formatMoney(result.taxWithFeie)}</span></div>
          <div className="result-line"><span>Federal tax with no exclusion</span><span className="num">{formatMoney(result.taxWithoutFeie)}</span></div>
          <div className="result-line total"><span>Tax the exclusion saves you</span><span className="num">{formatMoney(result.savings)}</span></div>
          <p className="results-note" data-review="legal">
            The exclusion removes up to {formatMoney(FEIE_LIMIT)} of foreign earned income for 2026 — but under the
            stacking rule, that excluded income still sets the tax bracket for your remaining income, so your other
            income is taxed at the rate it would face without the exclusion. You must meet the bona fide residence or
            physical presence test. Foreign tax already paid may be worth more via the foreign tax credit instead.
            Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
