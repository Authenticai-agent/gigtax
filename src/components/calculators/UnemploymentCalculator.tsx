/** UnemploymentCalculator — estimated weekly UI benefit, duration, tax. Nothing stored. */
import { useId, useState } from 'react';
import { uiBenefit } from '../../lib/layoff/uiBenefit';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function UnemploymentCalculator({ presetState = 'CA' }: { presetState?: string }) {
  const [stateCode, setState] = useState(presetState);
  const [priorAnnualWage, setWage] = useState(65000);
  const [dependents, setDeps] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof uiBenefit> | null>(null);
  const [stale, setStale] = useState(false);
  const id = useId();

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(uiBenefit({ stateCode, priorAnnualWage, dependents })); setStale(false); };
  const monthly = result ? Math.round(result.estimatedWeeklyBenefit * 52 / 12) : 0;

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label htmlFor={`${id}-state`}>Your state</label><select id={`${id}-state`} value={stateCode} onChange={(e) => ed(setState)(e.target.value)}>{stateOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label htmlFor={`${id}-wage`}>Your prior annual wage</label><input id={`${id}-wage`} type="number" min={0} value={priorAnnualWage} onChange={(e) => ed(setWage)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-deps`}>Dependents</label><input id={`${id}-deps`} type="number" min={0} value={dependents} onChange={(e) => ed(setDeps)(num(e.target.value))} /><p className="field-note">Only some states pay a dependent allowance.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Estimate my benefit'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>An estimate only — your state agency sets your actual benefit. Nothing you enter is stored.</p></div>) : (
        <>
          <div className={stale ? 'results-box is-stale' : 'results-box'}>
            <h3>Estimated unemployment in {result.state}</h3>
            <div className="result-line"><span>Estimated weekly benefit{result.atStateMax ? ' (at the state max)' : ''}</span><span className="num">{formatMoney(result.estimatedWeeklyBenefit)}</span></div>
            {result.dependentAllowance > 0 && <div className="result-line"><span>…including dependent allowance</span><span className="num">{formatMoney(result.dependentAllowance)}</span></div>}
            <div className="result-line"><span>State range (min–max)</span><span className="num">{formatMoney(result.minWeekly)} – {formatMoney(result.maxWeekly)}</span></div>
            <div className="result-line"><span>Duration</span><span className="num">{result.durationWeeks ? `${result.durationWeeks} weeks` : '—'}</span></div>
            <div className="result-line total"><span>Total potential</span><span className="num">{formatMoney(result.totalPotential)}</span></div>
            <p className="results-note">{result.firstCheckNote}</p>
            <p className="results-note" data-review="legal">{result.taxNote}</p>
            <p className="results-note"><strong>Filing timing matters:</strong> {result.severanceOffsetNote}</p>
            {result.filingUrl && <p className="results-note">File with <a href={result.filingUrl} rel="noopener">{result.agencyName}</a>. This is an estimate — {result.agencyName} determines your actual benefit.</p>}
          </div>
          <div className="share-card">
            <p className="share-label">For your runway</p>
            <p className="share-figure">{formatMoney(monthly)}/mo</p>
            <p className="share-sub">~{formatMoney(result.estimatedWeeklyBenefit)}/week for {result.durationWeeks} weeks — carry into the <a href="/layoff-runway-calculator/">runway calculator</a> (net of tax)</p>
          </div>
          <details className="methodology">
            <summary>Methodology &amp; sources</summary>
            <p>Each state computes the weekly benefit differently ({result.benefitMethod ?? 'varies'}). This estimates roughly half of your average weekly wage, bounded by {result.state}'s own minimum ({formatMoney(result.minWeekly)}) and maximum ({formatMoney(result.maxWeekly)}), plus any dependent allowance. It is a planning estimate, not the official figure — your state agency runs the exact formula.</p>
            <p className="src">Sources: {result.state} state workforce agency, cross-checked against the US DOL ETA "Significant Provisions of State UI Laws" (Jan 2026). Verified 2026-07-24.</p>
          </details>
        </>
      )}
    </div>
  );
}
