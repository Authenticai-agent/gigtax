/** TrustTaxCalculator — Form 1041: retain in the trust vs distribute to a beneficiary. */
import { useState } from 'react';
import { estateTrust1041 } from '../../lib/estate';
import { formatMoney } from '../../lib/tax-engine';

const STATUSES = [['single', 'Single'], ['mfj', 'Married filing jointly'], ['hoh', 'Head of household']] as const;

export default function TrustTaxCalculator() {
  const [income, setIncome] = useState(60000);
  const [expenses, setExpenses] = useState(0);
  const [distributed, setDistributed] = useState(60000);
  const [benIncome, setBenIncome] = useState(25000);
  const [benStatus, setBenStatus] = useState('single');
  const [result, setResult] = useState<ReturnType<typeof estateTrust1041> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(estateTrust1041(income, expenses, distributed, benIncome, benStatus)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Trust / estate income</label><input type="number" min={0} value={income} onChange={(e) => ed(setIncome)(num(e.target.value))} /><p className="field-note">Interest, dividends, rents, gains.</p></div>
        <div className="form-group"><label>Trust expenses</label><input type="number" min={0} value={expenses} onChange={(e) => ed(setExpenses)(num(e.target.value))} /></div>
        <div className="form-group"><label>Amount distributed to beneficiary</label><input type="number" min={0} value={distributed} onChange={(e) => ed(setDistributed)(num(e.target.value))} /></div>
        <div className="form-group"><label>Beneficiary's other income</label><input type="number" min={0} value={benIncome} onChange={(e) => ed(setBenIncome)(num(e.target.value))} /></div>
        <div className="form-group"><label>Beneficiary filing status</label><select value={benStatus} onChange={(e) => ed(setBenStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Retain vs distribute'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter the trust income and distribution.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Trust income tax: who pays</h3>
          <div className="result-line"><span>Income retained in the trust</span><span className="num">{formatMoney(result.retainedIncome)}</span></div>
          <div className="result-line"><span>Tax the trust pays (compressed brackets)</span><span className="num">{formatMoney(result.trustTax)}</span></div>
          <div className="result-line"><span>Income distributed to the beneficiary</span><span className="num">{formatMoney(result.amountDistributed)}</span></div>
          <div className="result-line"><span>Tax the beneficiary pays</span><span className="num">{formatMoney(result.beneficiaryTax)}</span></div>
          <div className="result-line total"><span>Total tax as structured</span><span className="num">{formatMoney(result.totalTax)}</span></div>
          <div className="result-line"><span>Tax if the trust retained everything</span><span className="num">{formatMoney(result.taxIfAllRetained)}</span></div>
          <div className="result-line total"><span>Saved by distributing</span><span className="num">{formatMoney(result.savingsFromDistributing)}</span></div>
          <p className="results-note">
            A trust's own brackets are brutal — 37% starts at just $16,000 of retained income. Distributing income to
            a beneficiary shifts it to their (usually lower) individual rate via the distribution deduction, reported
            on a Schedule K-1. Only income can be distributed out; a grantor trust is taxed to the grantor instead.
            Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
