/**
 * EntityCalculator — sole proprietor vs S corporation vs C corporation.
 *
 * Ranks on WHAT YOU KEEP rather than on tax paid, because a C corporation can
 * show the lowest tax purely by leaving the money inside the company. Ranking
 * on tax would recommend it to someone who needs the cash.
 */
import { useState } from 'react';
import { compareEntityChoices, PAYROLL_ADMIN_COST, DEFENSIBLE_SALARY_PCT, type EntityComparison } from '../../lib/entity';
import { formatMoney } from '../../lib/tax-engine';
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

export default function EntityCalculator({ presetState = '' }: { presetState?: string }) {
  const [netProfit, setNetProfit] = useState(120000);
  const [otherW2, setOtherW2] = useState(0);
  const [filingStatus, setFilingStatus] = useState('single');
  const [stateCode, setStateCode] = useState(presetState);
  const [salaryPct, setSalaryPct] = useState(DEFENSIBLE_SALARY_PCT);
  const [withdrawPct, setWithdrawPct] = useState(100);
  const [runningCost, setRunningCost] = useState(PAYROLL_ADMIN_COST);
  const [result, setResult] = useState<EntityComparison | null>(null);
  const [stale, setStale] = useState(false);

  const touched = () => { if (result) setStale(true); };
  const calculate = () => {
    setResult(compareEntityChoices({ netProfit, otherW2, filingStatus, stateCode, salaryPct, withdrawPct, runningCost }));
    setStale(false);
  };

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
            Other W-2 wages (yours or a spouse's)
            <input type="number" min={0} step={1000} value={otherW2}
              onChange={(e) => { setOtherW2(Number(e.target.value)); touched(); }} />
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
        <div className="field-row">
          <label>
            Salary as a share of profit
            <input type="number" min={0} max={100} step={5} value={salaryPct}
              onChange={(e) => { setSalaryPct(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            How much of the profit you need to take out
            <input type="number" min={0} max={100} step={10} value={withdrawPct}
              onChange={(e) => { setWithdrawPct(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            Payroll and filing cost a year
            <input type="number" min={0} step={100} value={runningCost}
              onChange={(e) => { setRunningCost(Number(e.target.value)); touched(); }} />
          </label>
        </div>
        <p className="field-note">
          Salary share and withdrawal share are percentages. The withdrawal figure only affects the C
          corporation — it is what decides whether the second layer of tax applies at all.
        </p>
        <div className="calc-actions">
          <button type="button" className="btn-calculate" onClick={calculate}>Compare</button>
          {stale && <span className="stale-note">Inputs changed — press Compare again</span>}
        </div>
      </div>

      {!result ? (
        <div className="results-placeholder"><p>Enter your figures above and press Compare.</p></div>
      ) : (
        <div className={`results-box${stale ? ' is-stale' : ''}`}>
          <h3>
            {result.best.label} keeps the most
            {result.savingVsSoleProp > 0
              ? ` — ${formatMoney(result.savingVsSoleProp)} a year more than staying a sole proprietor`
              : ' — nothing beats staying as you are'}
          </h3>

          <table className="quarter-table">
            <thead>
              <tr><th>Structure</th><th>Total tax</th><th>Running cost</th><th>You keep</th></tr>
            </thead>
            <tbody>
              {result.options.map((o) => (
                <tr key={o.key} className={o.key === result.best.key ? 'total' : undefined}>
                  <td>{o.label}</td>
                  <td>{formatMoney(o.totalTax)}</td>
                  <td>{o.runningCost > 0 ? formatMoney(o.runningCost) : '—'}</td>
                  <td>{formatMoney(o.afterTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.options.map((o) => (
            <div className="result-notes" key={o.key}>
              <strong>{o.label}</strong>
              <table className="quarter-table">
                <tbody>
                  {o.lines.map((l, i) => (
                    <tr key={i}><td>{l.label}</td><td>{formatMoney(l.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
              <p>{o.note}</p>
              {o.disclosures.length > 0 && (
                <ul>
                  {o.disclosures.map((d, i) => <li key={i}><strong>{d.label}.</strong> {d.why}</li>)}
                </ul>
              )}
            </div>
          ))}

          {result.warnings.length > 0 && (
            <div className="result-notes">
              <strong>Before you act on this</strong>
              <ul>{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
