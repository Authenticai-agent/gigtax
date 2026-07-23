/**
 * MarriageCalculator — total tax as two single filers vs married filing jointly.
 * Math is in src/lib/marriage.ts; this island only collects inputs and renders.
 */
import { useState } from 'react';
import { marriageTax } from '../../lib/marriage';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

export default function MarriageCalculator({ presetState = '' }: { presetState?: string }) {
  const [incomeA, setIncomeA] = useState(75000);
  const [incomeB, setIncomeB] = useState(55000);
  const [k401A, setK401A] = useState(0);
  const [k401B, setK401B] = useState(0);
  const [age65A, setAge65A] = useState(false);
  const [age65B, setAge65B] = useState(false);
  const [stateCode, setStateCode] = useState(presetState);
  const [dependents, setDependents] = useState(0);
  const [itemize, setItemize] = useState(false);
  const [itemizedAmount, setItemizedAmount] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof marriageTax> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const touch = () => { if (result) setStale(true); };

  const calculate = () => {
    setResult(marriageTax({
      incomeA, incomeB, retirement401kA: k401A, retirement401kB: k401B,
      age65A, age65B, stateCode, dependents, itemize, itemizedAmount,
    }));
    setStale(false);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group">
          <label>Person A — annual W-2 income</label>
          <input type="number" min={0} value={incomeA} onChange={(e) => { setIncomeA(num(e.target.value)); touch(); }} />
        </div>
        <div className="form-group">
          <label>Person A — 401(k) contribution</label>
          <input type="number" min={0} value={k401A} onChange={(e) => { setK401A(num(e.target.value)); touch(); }} />
        </div>
        <div className="form-group">
          <label>Person B — annual W-2 income</label>
          <input type="number" min={0} value={incomeB} onChange={(e) => { setIncomeB(num(e.target.value)); touch(); }} />
        </div>
        <div className="form-group">
          <label>Person B — 401(k) contribution</label>
          <input type="number" min={0} value={k401B} onChange={(e) => { setK401B(num(e.target.value)); touch(); }} />
        </div>
        <div className="form-group">
          <label>State</label>
          <select value={stateCode} onChange={(e) => { setStateCode(e.target.value); touch(); }}>
            {!stateCode && <option value="">Select your state…</option>}
            {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Children under 17</label>
          <input type="number" min={0} max={20} value={dependents} onChange={(e) => { setDependents(num(e.target.value)); touch(); }} />
        </div>
      </div>
      <div className="calc-grid">
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem' }}>
          <input id="ms-item" type="checkbox" checked={itemize} onChange={(e) => { setItemize(e.target.checked); touch(); }} style={{ width: 'auto' }} />
          <label htmlFor="ms-item" style={{ margin: 0 }}>Itemize deductions instead of the standard deduction</label>
        </div>
        {itemize && (
          <div className="form-group">
            <label>Household itemized total</label>
            <input type="number" min={0} value={itemizedAmount} onChange={(e) => { setItemizedAmount(num(e.target.value)); touch(); }} />
          </div>
        )}
      </div>

      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calculate}>{result ? 'Recompare' : 'Compare single vs married'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recompare</span>}
      </div>

      {result === null ? (
        <div className="results-placeholder"><p>Enter both incomes and press Compare.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.outcome === 'penalty' ? 'Marriage penalty' : result.outcome === 'bonus' ? 'Marriage bonus' : 'No penalty or bonus'}{result.outcome !== 'neutral' ? ` — ${formatMoney(result.amount)} a year` : ''}</h3>
          <div className="result-line"><span>Combined income</span><span className="num">{formatMoney(result.combinedIncome)}</span></div>
          <div className="result-line"><span>Total tax as two single filers</span><span className="num">{formatMoney(result.single.totalTax)}</span></div>
          <div className="result-line"><span>Total tax filing jointly</span><span className="num">{formatMoney(result.mfj.totalTax)}</span></div>
          <div className="result-line total">
            <span>{result.outcome === 'bonus' ? 'Marriage saves you' : result.outcome === 'penalty' ? 'Marriage costs you' : 'Difference'}</span>
            <span className="num">{formatMoney(result.amount)} a year</span>
          </div>
          <div className="result-line"><span>Effective rate as singles</span><span className="num">{formatPct(result.single.effectiveRate)}</span></div>
          <div className="result-line"><span>Effective rate filing jointly</span><span className="num">{formatPct(result.mfj.effectiveRate)}</span></div>
          <p className="results-note">
            {result.outcome === 'penalty'
              ? 'Two similar incomes fill the lower brackets twice as fast when combined, so part spills into a higher rate. Maxing pre-tax 401(k) and HSA is the main lever. '
              : result.outcome === 'bonus'
                ? 'One income spreads across the wider joint brackets, lowering the higher earner\'s marginal rate. '
                : 'Your incomes and brackets leave the joint bill the same as two single ones. '}
            Filing separately (MFS) almost never helps — it disallows the QBI deduction, EITC, education credits and more. FICA is identical either way. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
