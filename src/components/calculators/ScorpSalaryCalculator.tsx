/**
 * ScorpSalaryCalculator — what salary to pay yourself, and what it costs.
 *
 * The arithmetic always points at the lowest salary, because payroll tax falls
 * as salary falls. That makes an unqualified "optimal" recommendation actively
 * dangerous: compensation has to be reasonable for the work done, and too low
 * invites reclassification and back payroll tax. So this shows the whole range
 * and marks the cheapest row as the riskiest rather than as the answer.
 */
import { useState } from 'react';
import { optimizeSCorpSalary, formatMoney } from '../../lib/tax-engine';
import { entityLevelTax, PAYROLL_ADMIN_COST, DEFENSIBLE_SALARY_PCT } from '../../lib/scorp';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'],
  ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'],
  ['mfs', 'Married filing separately'],
] as const;

const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

export default function ScorpSalaryCalculator({ presetState = '' }: { presetState?: string }) {
  const [netProfit, setNetProfit] = useState(120000);
  const [otherW2, setOtherW2] = useState(0);
  const [filingStatus, setFilingStatus] = useState('single');
  const [stateCode, setStateCode] = useState(presetState);
  const [runningCost, setRunningCost] = useState(PAYROLL_ADMIN_COST);
  const [result, setResult] = useState<ReturnType<typeof optimizeSCorpSalary> | null>(null);
  const [stale, setStale] = useState(false);

  const touched = () => { if (result) setStale(true); };
  const calculate = () => {
    setResult(optimizeSCorpSalary(netProfit, otherW2, filingStatus, stateCode, undefined, runningCost));
    setStale(false);
  };

  const entity = stateCode ? entityLevelTax(stateCode, netProfit) : null;

  return (
    <div>
      <div className="calc-panel">
        <div className="field-row">
          <label>
            Net business profit
            <input type="number" min={0} step={1000} value={netProfit}
              onChange={(e) => { setNetProfit(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            Other W-2 wages
            <input type="number" min={0} step={1000} value={otherW2}
              onChange={(e) => { setOtherW2(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            Payroll and filing cost a year
            <input type="number" min={0} step={100} value={runningCost}
              onChange={(e) => { setRunningCost(Number(e.target.value)); touched(); }} />
          </label>
        </div>
        <div className="field-row">
          <label>
            Filing status
            <select value={filingStatus} onChange={(e) => { setFilingStatus(e.target.value); touched(); }}>
              {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>
            State
            <select value={stateCode} onChange={(e) => { setStateCode(e.target.value); touched(); }}>
              <option value="">Select your state…</option>
              {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </label>
        </div>
        <div className="calc-actions">
          <button type="button" className="btn-calculate" onClick={calculate}>Calculate</button>
          {stale && <span className="stale-note">Inputs changed — press Calculate again</span>}
        </div>
      </div>

      {!result ? (
        <div className="results-placeholder"><p>Enter your figures above and press Calculate.</p></div>
      ) : (
        <div className={`results-box${stale ? ' is-stale' : ''}`}>
          <h3>Salary from 20% to 60% of profit</h3>
          <table className="quarter-table">
            <thead>
              <tr><th>Salary share</th><th>Salary</th><th>Distribution</th><th>Total tax</th></tr>
            </thead>
            <tbody>
              {result.results.map((r) => (
                <tr key={r.pct} className={r.pct === DEFENSIBLE_SALARY_PCT ? 'total' : undefined}>
                  <td>{r.pct}%{r.pct === DEFENSIBLE_SALARY_PCT ? ' — our default' : ''}</td>
                  <td>{formatMoney(r.salary)}</td>
                  <td>{formatMoney(r.distribution)}</td>
                  <td>{formatMoney(r.totalTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="result-notes">
            <strong>The lowest row is not the answer</strong>
            <p>
              Tax falls as salary falls, so the arithmetic always points at 20%. That is precisely why it
              is not a number to optimise: your salary has to be reasonable for the work you actually do,
              and the penalty for setting it too low is reclassification plus back payroll tax with
              interest. The cheapest row on this table is the riskiest one. Most defensible positions sit
              between 40% and 60% for an owner working full time in the business.
            </p>
            <p>
              Between the cheapest and dearest rows here the difference is{' '}
              {formatMoney(Math.max(...result.results.map((r) => r.totalTax)) - Math.min(...result.results.map((r) => r.totalTax)))}{' '}
              a year. That is the size of the judgment you are making.
            </p>
          </div>

          {entity && !entity.unknown && entity.amount > 0 && (
            <div className="result-notes">
              <strong>What {states[stateCode].name} charges the company on top</strong>
              <p>
                {formatMoney(entity.amount)} — {entity.basis}. This table does not include it, because it
                does not vary with the salary you choose.
              </p>
            </div>
          )}
          {entity && entity.disclosures.length > 0 && (
            <div className="result-notes">
              <strong>Not in these figures</strong>
              <ul>{entity.disclosures.map((d, i) => <li key={i}><strong>{d.label}.</strong> {d.why}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
