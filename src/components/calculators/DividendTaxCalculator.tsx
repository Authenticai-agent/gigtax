/** DividendTaxCalculator — qualified vs ordinary dividends, with NIIT. Federal. */
import { useState } from 'react';
import { investmentTax } from '../../lib/capital-gains';
import { formatMoney, formatPct } from '../../lib/tax-engine';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;

export default function DividendTaxCalculator() {
  const [status, setStatus] = useState('single');
  const [other, setOther] = useState(80000);
  const [qualified, setQualified] = useState(6000);
  const [ordinary, setOrdinary] = useState(2000);
  const [result, setResult] = useState<ReturnType<typeof investmentTax> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    setResult(investmentTax({
      status, otherOrdinaryIncome: other,
      qualifiedDividends: qualified, ordinaryDividends: ordinary,
      applyStandardDeduction: true,
    }));
    setStale(false);
  };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Other taxable income</label>
          <input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} />
          <p className="field-note">Positions dividends in the brackets.</p></div>
        <div className="form-group"><label>Qualified dividends</label>
          <input type="number" min={0} value={qualified} onChange={(e) => ed(setQualified)(num(e.target.value))} />
          <p className="field-note">Box 1b — taxed at 0/15/20%.</p></div>
        <div className="form-group"><label>Ordinary (non-qualified) dividends</label>
          <input type="number" min={0} value={ordinary} onChange={(e) => ed(setOrdinary)(num(e.target.value))} />
          <p className="field-note">Taxed at your ordinary rate.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate dividend tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your dividends and other income.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Federal tax on your 2026 dividends</h3>
          <div className="result-line"><span>Tax on ordinary dividends</span><span className="num">{formatMoney(result.ordinaryTax)}</span></div>
          <div className="result-line"><span>Tax on qualified dividends (0/15/20%)</span><span className="num">{formatMoney(result.preferentialTax)}</span></div>
          {result.niit.tax > 0 && <div className="result-line"><span>Net investment income tax (3.8%)</span><span className="num">{formatMoney(result.niit.tax)}</span></div>}
          <div className="result-line total"><span>Total federal tax on dividends</span><span className="num">{formatMoney(result.totalInvestmentTax)}</span></div>
          <div className="result-line"><span>Effective rate on the dividends</span><span className="num">{formatPct(result.effectiveRateOnInvestment)}</span></div>
          <p className="results-note">
            Federal only; state tax is extra. Qualified dividends need the holding-period test met (generally 60+
            days around the ex-dividend date) — untested holdings are ordinary. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
