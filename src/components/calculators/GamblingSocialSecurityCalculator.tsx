/** GamblingSocialSecurityCalculator — how a win pulls Social Security into tax. */
import { useState } from 'react';
import { gamblingSocialSecurityImpact } from '../../lib/gambling';
import { formatMoney } from '../../lib/tax-engine';

const STATUSES = [['single', 'Single'], ['mfj', 'Married filing jointly']] as const;

export default function GamblingSocialSecurityCalculator() {
  const [winnings, setWinnings] = useState(30000);
  const [otherAGI, setOtherAGI] = useState(20000);
  const [ss, setSS] = useState(24000);
  const [status, setStatus] = useState('single');
  const [result, setResult] = useState<ReturnType<typeof gamblingSocialSecurityImpact> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(gamblingSocialSecurityImpact(winnings, otherAGI, ss, status)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Gambling winnings</label><input type="number" min={0} value={winnings} onChange={(e) => ed(setWinnings)(num(e.target.value))} /></div>
        <div className="form-group"><label>Annual Social Security benefits</label><input type="number" min={0} value={ss} onChange={(e) => ed(setSS)(num(e.target.value))} /></div>
        <div className="form-group"><label>Your other income (AGI)</label><input type="number" min={0} value={otherAGI} onChange={(e) => ed(setOtherAGI)(num(e.target.value))} /></div>
        <div className="form-group"><label>Filing status</label><select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Impact on Social Security'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your winnings and Social Security.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>How the win taxes your Social Security</h3>
          <div className="result-line"><span>Taxable Social Security without the win</span><span className="num">{formatMoney(result.taxableSSWithout)}</span></div>
          <div className="result-line"><span>Taxable Social Security with the win</span><span className="num">{formatMoney(result.taxableSSWith)}</span></div>
          <div className="result-line total"><span>Extra Social Security pulled into tax</span><span className="num">{formatMoney(result.extraTaxableSS)}</span></div>
          <p className="results-note">
            Gambling winnings raise the income that decides how much of your Social Security is taxable — up to 85% of
            benefits. So a win is taxed twice over: on the winnings themselves, and by making more of your benefits
            taxable. This is the hidden cost retirees miss. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
