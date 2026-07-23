/** GamblingTaxCalculator — winnings as income, the 2026 90% loss-deduction rule. */
import { useState } from 'react';
import { gamblingTax } from '../../lib/gambling';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;
const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

export default function GamblingTaxCalculator({ presetState = '' }: { presetState?: string }) {
  const [winnings, setWinnings] = useState(50000);
  const [losses, setLosses] = useState(50000);
  const [other, setOther] = useState(80000);
  const [otherItemized, setOtherItemized] = useState(0);
  const [status, setStatus] = useState('single');
  const [stateCode, setStateCode] = useState(presetState);
  const [result, setResult] = useState<ReturnType<typeof gamblingTax> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(gamblingTax(winnings, losses, other, status, otherItemized, stateCode, 0)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Total gambling winnings</label>
          <input type="number" min={0} value={winnings} onChange={(e) => ed(setWinnings)(num(e.target.value))} />
          <p className="field-note">All of it — every win, not your net.</p></div>
        <div className="form-group"><label>Total gambling losses</label>
          <input type="number" min={0} value={losses} onChange={(e) => ed(setLosses)(num(e.target.value))} /></div>
        <div className="form-group"><label>Other taxable income</label>
          <input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>Other itemized deductions</label>
          <input type="number" min={0} value={otherItemized} onChange={(e) => ed(setOtherItemized)(num(e.target.value))} />
          <p className="field-note">Mortgage interest, SALT, charity — losses only help if you itemize.</p></div>
        <div className="form-group"><label>State</label>
          <select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>
            {!stateCode && <option value="">Select your state…</option>}
            {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select></div>
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate my tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your winnings and losses.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Tax on your 2026 gambling</h3>
          <div className="result-line"><span>Winnings (all taxable as income)</span><span className="num">{formatMoney(result.winnings)}</span></div>
          <div className="result-line"><span>Deductible losses (90%, capped at winnings)</span><span className="num">− {formatMoney(result.deductibleLosses)}</span></div>
          {result.nonDeductibleLosses > 0 && <div className="result-line"><span>Losses you cannot deduct</span><span className="num">{formatMoney(result.nonDeductibleLosses)}</span></div>}
          <div className="result-line"><span>Using {result.usingItemized ? 'itemized deductions' : 'the standard deduction'}</span><span className="num">{result.usingItemized ? 'losses count' : 'losses wasted'}</span></div>
          <div className="result-line"><span>Federal tax on the winnings</span><span className="num">{formatMoney(result.federalTaxOnWinnings)}</span></div>
          {result.stateTaxOnWinnings > 0 && <div className="result-line"><span>{states[stateCode]?.name} tax on the winnings</span><span className="num">{formatMoney(result.stateTaxOnWinnings)}</span></div>}
          <div className="result-line total"><span>Total tax on the winnings</span><span className="num">{formatMoney(result.federalTaxOnWinnings + result.stateTaxOnWinnings)}</span></div>
          <div className="result-line"><span>Effective rate on winnings</span><span className="num">{formatPct(result.effectiveRateOnWinnings)}</span></div>
          {result.breakEvenTax > 0 && (
            <p className="results-note" data-review="legal">
              New for 2026: you lost as much as you won, yet still owe about {formatMoney(result.breakEvenTax)} in
              federal tax. Since the OBBBA, only 90% of losses are deductible, so 10% of your winnings is taxed even
              when you broke even. Many states allow no loss deduction at all.
            </p>
          )}
          <p className="results-note">
            All winnings are taxable and reportable whether or not you get a W-2G. Losses deduct only if you
            itemize, at 90% and never above winnings. Keep a gambling diary. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
