/** RunwayCalculator — the anchor. Months of runway + balance curve. Nothing stored. */
import { useId, useState } from 'react';
import { runway } from '../../lib/layoff/runway';
import { formatMoney } from '../../lib/tax-engine';

export default function RunwayCalculator() {
  const [savings, setSavings] = useState(15000);
  const [netSeverance, setSeverance] = useState(27000);
  const [monthlyUINet, setUI] = useState(2200);
  const [uiWeeks, setWeeks] = useState(26);
  const [monthlyEssentialSpend, setSpend] = useState(3800);
  const [healthPremiumMonthly, setPremium] = useState(600);
  const [otherMonthlyIncome, setOther] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof runway> | null>(null);
  const [stale, setStale] = useState(false);
  const id = useId();

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(runway({ savings, netSeverance, monthlyUINet, uiWeeks, monthlyEssentialSpend, healthPremiumMonthly, otherMonthlyIncome })); setStale(false); };

  // Lightweight inline balance chart (no external libraries).
  const chart = () => {
    if (!result) return null;
    const pts = result.balanceCurve;
    const W = 600, H = 160, pad = 4;
    const maxB = Math.max(result.startingBalance, ...pts.map((p) => p.balance), 0);
    const minB = Math.min(0, ...pts.map((p) => p.balance));
    const x = (i: number) => pad + (i / Math.max(1, pts.length - 1)) * (W - 2 * pad);
    const y = (b: number) => H - pad - ((b - minB) / Math.max(1, maxB - minB)) * (H - 2 * pad);
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ');
    const zeroY = y(0);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Balance over time" style={{ width: '100%', height: 'auto', marginTop: '.5rem' }}>
        <line x1={pad} y1={zeroY} x2={W - pad} y2={zeroY} stroke="var(--border)" strokeWidth="1" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      </svg>
    );
  };

  return (
    <div className="calc-panel">
      <p className="section-label">From the other calculators</p>
      <div className="calc-grid">
        <div className="form-group"><label htmlFor={`${id}-sev`}>Net severance</label><input id={`${id}-sev`} type="number" min={0} value={netSeverance} onChange={(e) => ed(setSeverance)(num(e.target.value))} /><p className="field-note">From the severance calculator.</p></div>
        <div className="form-group"><label htmlFor={`${id}-ui`}>Monthly unemployment (net of tax)</label><input id={`${id}-ui`} type="number" min={0} value={monthlyUINet} onChange={(e) => ed(setUI)(num(e.target.value))} /><p className="field-note">From the unemployment calculator.</p></div>
        <div className="form-group"><label htmlFor={`${id}-weeks`}>Weeks of unemployment</label><input id={`${id}-weeks`} type="number" min={0} value={uiWeeks} onChange={(e) => ed(setWeeks)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-prem`}>Monthly health premium</label><input id={`${id}-prem`} type="number" min={0} value={healthPremiumMonthly} onChange={(e) => ed(setPremium)(num(e.target.value))} /><p className="field-note">From the COBRA vs marketplace calculator.</p></div>
      </div>
      <p className="section-label">Your situation</p>
      <div className="calc-grid">
        <div className="form-group"><label htmlFor={`${id}-sav`}>Savings you can draw on</label><input id={`${id}-sav`} type="number" min={0} value={savings} onChange={(e) => ed(setSavings)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-spend`}>Monthly essential spending</label><input id={`${id}-spend`} type="number" min={0} value={monthlyEssentialSpend} onChange={(e) => ed(setSpend)(num(e.target.value))} /><p className="field-note">Rent, food, utilities, minimum debt — not the health premium.</p></div>
        <div className="form-group"><label htmlFor={`${id}-oth`}>Other monthly income</label><input id={`${id}-oth`} type="number" min={0} value={otherMonthlyIncome} onChange={(e) => ed(setOther)(num(e.target.value))} /><p className="field-note">Partner's income, side work.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'How long will it last?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Nothing you enter is stored or sent anywhere — it runs in your browser.</p></div>) : (
        <>
          <div className="share-card">
            <p className="share-label">Your runway</p>
            <p className="share-figure">{result.runsOut ? `${result.monthsOfRunway} months` : `${result.monthsOfRunway}+ months`}</p>
            <p className="share-sub">{result.runsOut ? `You need income by month ${result.breakEvenJobStartMonth}.` : 'Your money outlasts a 5-year horizon on these numbers.'}</p>
          </div>
          <div className={stale ? 'results-box is-stale' : 'results-box'}>
            <h3>Month by month</h3>
            <div className="result-line"><span>Starting balance (savings + net severance)</span><span className="num">{formatMoney(result.startingBalance)}</span></div>
            <div className="result-line"><span>Monthly burn (spending + premium)</span><span className="num">{formatMoney(result.monthlyBurn)}</span></div>
            <div className="result-line"><span>Unemployment runs out at month</span><span className="num">{result.monthUIExhausts}</span></div>
            <div className="result-line total"><span>Months of runway</span><span className="num">{result.runsOut ? result.monthsOfRunway : `${result.monthsOfRunway}+`}</span></div>
            {chart()}
            <p className="results-note">The curve shows your balance each month. It steepens once unemployment ends at month {result.monthUIExhausts}. An estimate on your own numbers — not financial advice.</p>
          </div>
          <details className="methodology">
            <summary>Methodology &amp; sources</summary>
            <p>Each month your balance changes by net unemployment plus other income, minus essential spending and the health premium. Unemployment runs for the weeks you entered, then stops. The runway is the last month before the balance goes negative; the break-even job-start month is when you need a paycheck to avoid that. Unemployment should be entered net of tax — it is federally taxable and most states tax it too.</p>
            <p className="src">Pure arithmetic on your inputs. Chain the net figures from the severance, unemployment, and health-coverage calculators above. Nothing is stored.</p>
          </details>
        </>
      )}
    </div>
  );
}
