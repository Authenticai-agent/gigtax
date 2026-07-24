/** FreelanceRateCalculator — the floor rate to hit a target take-home. Nothing stored. */
import { useId, useState } from 'react';
import { freelanceRateTool } from '../../lib/freelanceRateTool';
import { states } from '../../data/states';
import { formatMoney } from '../../lib/tax-engine';

const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function FreelanceRateCalculator({ presetState = 'CA' }: { presetState?: string }) {
  const [target, setTarget] = useState(90000);
  const [health, setHealth] = useState(6000);
  const [overhead, setOverhead] = useState(4000);
  const [stateCode, setStateCode] = useState(presetState);
  const [weeksOff, setWeeksOff] = useState(4);
  const [billable, setBillable] = useState(25);
  const [result, setResult] = useState<ReturnType<typeof freelanceRateTool> | null>(null);
  const [stale, setStale] = useState(false);
  const id = useId();

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(freelanceRateTool({ targetTakeHome: target, healthInsuranceAnnual: health, overheadAnnual: overhead, stateCode, weeksOff, billableHoursPerWeek: billable })); setStale(false); };

  const maxComp = result ? Math.max(...result.breakdown.map((b) => b.annual)) : 1;

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label htmlFor={`${id}-tgt`}>Take-home you want (after tax)</label><input id={`${id}-tgt`} type="number" min={0} value={target} onChange={(e) => ed(setTarget)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-state`}>Your state</label><select id={`${id}-state`} value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{stateOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label htmlFor={`${id}-bill`}>Billable hours per week</label><input id={`${id}-bill`} type="number" min={1} value={billable} onChange={(e) => ed(setBillable)(num(e.target.value))} /><p className="field-note">Not hours worked — hours you can actually invoice.</p></div>
        <div className="form-group"><label htmlFor={`${id}-off`}>Weeks off per year</label><input id={`${id}-off`} type="number" min={0} max={51} value={weeksOff} onChange={(e) => ed(setWeeksOff)(num(e.target.value))} /><p className="field-note">Holidays, sick days, gaps between clients.</p></div>
        <div className="form-group"><label htmlFor={`${id}-hlth`}>Health insurance per year</label><input id={`${id}-hlth`} type="number" min={0} value={health} onChange={(e) => ed(setHealth)(num(e.target.value))} /><p className="field-note">What your employer used to cover. From the COBRA/marketplace tool if you have it.</p></div>
        <div className="form-group"><label htmlFor={`${id}-oh`}>Business overhead per year</label><input id={`${id}-oh`} type="number" min={0} value={overhead} onChange={(e) => ed(setOverhead)(num(e.target.value))} /><p className="field-note">Software, equipment, insurance, accounting.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Find my floor rate'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Nothing you enter is stored or sent anywhere — it runs in your browser.</p></div>) : (
        <>
          <div className="share-card">
            <p className="share-label">Your rate floor</p>
            <p className="share-figure">{formatMoney(result.floorHourlyRate)}/hr</p>
            <p className="share-sub">≈ {formatMoney(result.dayRate)}/day — that's {result.upliftMultiple}× the {formatMoney(result.naiveHourly)}/hr you'd get just dividing take-home by hours</p>
          </div>
          <div className={stale ? 'results-box is-stale' : 'results-box'}>
            <h3>Where each billable hour goes</h3>
            {result.breakdown.map((b) => (
              <div className="rate-bar-row" key={b.label}>
                <span className="rate-bar-label">{b.label}</span>
                <span className="rate-bar-track"><span className="rate-bar-fill" style={{ width: `${Math.round((b.annual / maxComp) * 100)}%` }}></span></span>
                <span className="num">{formatMoney(b.perHour)}/hr</span>
              </div>
            ))}
            <div className="result-line total"><span>Floor rate</span><span className="num">{formatMoney(result.floorHourlyRate)}/hr</span></div>
            <p className="results-note">You must gross {formatMoney(result.grossRevenue)} over {result.annualBillableHours} billable hours to take home {formatMoney(target)}.</p>
          </div>
          <div className="callout">
            <strong>Bring a market number</strong>
            This is the rate you <em>need</em>. Compare it to what your field actually charges: look your role up on the <a href="https://www.bls.gov/oes/current/oes_nat.htm" rel="noopener">BLS OES</a> and convert the salary to an hourly benchmark. If your floor is above the market, the target, the hours, or the overhead has to give.
          </div>
          <details className="methodology">
            <summary>Methodology &amp; sources</summary>
            <p>The floor rate is solved from your target take-home backward through the 2026 self-employment tax math: gross revenue whose take-home (after SE tax, federal and state income tax, health insurance and overhead) equals your target, divided by billable hours. Only some of your working hours are billable and there's no paid time off — which is why the floor is well above take-home ÷ hours.</p>
            <p className="src">Sources: the site's verified 2026 SE-tax, QBI and state-tax engine. Market wage figures are not included — bring your own from BLS OES. Not financial advice.</p>
          </details>
        </>
      )}
    </div>
  );
}
