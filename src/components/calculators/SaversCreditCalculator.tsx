/**
 * SaversCreditCalculator — eligibility and the MAXIMUM possible credit. The
 * exact 50/20/10 tier needs the 2026 AGI thresholds, which are not in our
 * dataset, so this states that plainly rather than inventing them.
 */
import { useState } from 'react';
import { saversCredit } from '../../lib/credits';
import { formatMoney } from '../../lib/tax-engine';

const STATUSES = [
  ['single', 'Single'], ['hoh', 'Head of household'], ['mfj', 'Married filing jointly'],
] as const;

export default function SaversCreditCalculator() {
  const [status, setStatus] = useState('single');
  const [agi, setAgi] = useState(30000);
  const [contribution, setContribution] = useState(2000);
  const [result, setResult] = useState<ReturnType<typeof saversCredit> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(saversCredit(agi, status, contribution)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Adjusted gross income</label>
          <input type="number" min={0} value={agi} onChange={(e) => ed(setAgi)(num(e.target.value))} /></div>
        <div className="form-group"><label>Retirement contribution</label>
          <input type="number" min={0} value={contribution} onChange={(e) => ed(setContribution)(num(e.target.value))} />
          <p className="field-note">401(k), IRA, etc. Counts up to $2,000 ($4,000 if joint).</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recheck' : 'Check my eligibility'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recheck</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your income and contribution.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.eligible ? 'You qualify for the saver’s credit' : 'Over the income limit'}</h3>
          {result.eligible ? (
            <>
              <div className="result-line"><span>Income limit for your status</span><span className="num">{formatMoney(result.incomeLimit)}</span></div>
              <div className="result-line"><span>Contribution that counts (capped)</span><span className="num">{formatMoney(result.contributionCap)}</span></div>
              <div className="result-line total"><span>Maximum possible credit (50% tier)</span><span className="num">{formatMoney(result.maxPossibleCredit)}</span></div>
              <p className="results-note">
                Your actual credit is 50%, 20% or 10% of the counted contribution, depending on which AGI tier you
                fall in. The exact 2026 tier thresholds are not in our dataset, so we show the maximum (the 50%
                tier). Check Form 8880 for your tier. This credit is non-refundable. Not tax advice.
              </p>
            </>
          ) : (
            <p className="results-note">
              Your AGI is above the {formatMoney(result.incomeLimit)} limit for your filing status, so no saver's
              credit is available for 2026. Not tax advice.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
