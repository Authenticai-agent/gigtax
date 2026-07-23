/** CollegeSavingsGapCalculator — projected 529 savings vs the inflated future cost. */
import { useState } from 'react';
import { collegeSavingsGap } from '../../lib/personal-finance';
import { formatMoney, formatPct } from '../../lib/tax-engine';

export default function CollegeSavingsGapCalculator() {
  const [annualCostToday, setCost] = useState(30000);
  const [yearsUntilCollege, setUntil] = useState(10);
  const [yearsOfCollege, setDuration] = useState(4);
  const [currentSavings, setSavings] = useState(20000);
  const [monthlyContribution, setContrib] = useState(300);
  const [result, setResult] = useState<ReturnType<typeof collegeSavingsGap> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(collegeSavingsGap({ annualCostToday, yearsUntilCollege, yearsOfCollege, educationInflation: 0.05, currentSavings, monthlyContribution, annualReturn: 0.06 })); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>College cost today (per year)</label><input type="number" min={0} value={annualCostToday} onChange={(e) => ed(setCost)(num(e.target.value))} /><p className="field-note">Tuition, room and board in today's dollars.</p></div>
        <div className="form-group"><label>Years until college</label><input type="number" min={0} value={yearsUntilCollege} onChange={(e) => ed(setUntil)(num(e.target.value))} /></div>
        <div className="form-group"><label>Years of college</label><input type="number" min={1} value={yearsOfCollege} onChange={(e) => ed(setDuration)(num(e.target.value))} /></div>
        <div className="form-group"><label>Saved so far (529)</label><input type="number" min={0} value={currentSavings} onChange={(e) => ed(setSavings)(num(e.target.value))} /></div>
        <div className="form-group"><label>Monthly contribution</label><input type="number" min={0} value={monthlyContribution} onChange={(e) => ed(setContrib)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Find the gap'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter the cost, timeline and what you're saving.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.gap > 0 ? `You're on track for ${formatPct(result.covered)} of the cost` : 'Your plan covers the full cost'}</h3>
          <div className="result-line"><span>Future cost of {yearsOfCollege} years</span><span className="num">{formatMoney(result.futureCost)}</span></div>
          <div className="result-line"><span>Projected savings by then</span><span className="num">{formatMoney(result.projectedSavings)}</span></div>
          <div className="result-line total"><span>Funding gap</span><span className="num">{result.gap > 0 ? formatMoney(result.gap) : 'none'}</span></div>
          {result.gap > 0 && <div className="result-line"><span>Extra monthly saving to close it</span><span className="num">{formatMoney(result.monthlyToCloseGap)}</span></div>}
          <p className="results-note">
            Today's sticker price is inflated 5%/year to when each college year is paid, and your savings grow at
            6%/year. Education inflation has run faster than general inflation, which is why the future number looks
            large. A 529's tax-free growth is not modeled as a bonus here. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
