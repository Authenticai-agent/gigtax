/** SeveranceCalculator — severance withholding vs actual tax. Nothing is stored or sent. */
import { useId, useState } from 'react';
import { severanceTax, type PaymentMode, type FilingStatus } from '../../lib/layoff/severanceTax';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));
const STATUSES: [FilingStatus, string][] = [['single', 'Single'], ['mfj', 'Married filing jointly'], ['hoh', 'Head of household'], ['mfs', 'Married filing separately']];
const MODES: [PaymentMode, string][] = [['separate', 'A separate lump sum'], ['combined', 'Combined with my final paycheck'], ['installments', 'In installments']];

export default function SeveranceCalculator({ presetState = 'CA' }: { presetState?: string }) {
  const [severance, setSeverance] = useState(40000);
  const [paymentMode, setMode] = useState<PaymentMode>('separate');
  const [stateCode, setState] = useState(presetState);
  const [ytdWages, setYtd] = useState(60000);
  const [filingStatus, setStatus] = useState<FilingStatus>('single');
  const [otherIncome, setOther] = useState(60000);
  const [result, setResult] = useState<ReturnType<typeof severanceTax> | null>(null);
  const [stale, setStale] = useState(false);
  const id = useId();

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(severanceTax({ severance, paymentMode, stateCode, ytdWages, filingStatus, otherIncome })); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label htmlFor={`${id}-sev`}>Severance amount</label><input id={`${id}-sev`} type="number" min={0} value={severance} onChange={(e) => ed(setSeverance)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-mode`}>How is it paid?</label><select id={`${id}-mode`} value={paymentMode} onChange={(e) => ed(setMode)(e.target.value as PaymentMode)}>{MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label htmlFor={`${id}-state`}>Your state</label><select id={`${id}-state`} value={stateCode} onChange={(e) => ed(setState)(e.target.value)}>{stateOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label htmlFor={`${id}-ytd`}>Wages already earned this year (same employer)</label><input id={`${id}-ytd`} type="number" min={0} value={ytdWages} onChange={(e) => ed(setYtd)(num(e.target.value))} /><p className="field-note">Counts toward the $184,500 Social Security cap.</p></div>
        <div className="form-group"><label htmlFor={`${id}-status`}>Filing status</label><select id={`${id}-status`} value={filingStatus} onChange={(e) => ed(setStatus)(e.target.value as FilingStatus)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label htmlFor={`${id}-other`}>Your other 2026 income</label><input id={`${id}-other`} type="number" min={0} value={otherIncome} onChange={(e) => ed(setOther)(num(e.target.value))} /><p className="field-note">Wages, new job, spouse — sets your real tax rate.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate severance tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Nothing you enter is stored or sent anywhere — it runs in your browser.</p></div>) : (
        <>
          <div className={stale ? 'results-box is-stale' : 'results-box'}>
            <h3>Withholding is not your tax</h3>
            <div className="result-line"><span>Federal withholding ({formatPct(result.federalWithholdingRate)})</span><span className="num">−{formatMoney(result.federalWithholding)}</span></div>
            <div className="result-line"><span>Social Security + Medicare (FICA)</span><span className="num">−{formatMoney(result.ficaTotal)}</span></div>
            <div className="result-line"><span>State withholding ({result.stateWithholdingMethod})</span><span className="num">−{formatMoney(result.stateWithholding)}</span></div>
            <div className="result-line total"><span>Net check</span><span className="num">{formatMoney(result.netCheck)}</span></div>
            <div className="result-line"><span>What the severance actually costs in tax</span><span className="num">{formatMoney(result.estimatedActualLiability)}</span></div>
            <p className="results-note"><strong>{result.verdict}</strong></p>
          </div>
          <div className="share-card">
            <p className="share-label">For your runway</p>
            <p className="share-figure">{formatMoney(result.netCheck)}</p>
            <p className="share-sub">net severance — carry this into the <a href="/layoff-runway-calculator/">runway calculator</a></p>
          </div>
          <details className="methodology">
            <summary>Methodology &amp; sources</summary>
            <p>A separate severance payment is withheld at a flat <strong>22%</strong> federally (37% on any amount over $1M) — that is withholding, not your tax. Your actual tax is the marginal rate the severance adds on top of your other income, which this shows next to it. FICA is 6.2% Social Security up to the $184,500 wage base (prior wages from the same employer count) plus 1.45% Medicare. If severance is combined with a final paycheck, the aggregate method applies instead, landing closer to your real rate.</p>
            <p className="src">Sources: IRS Publication 15 (2026) supplemental-wage rules; SSA 2026 wage base $184,500; per-state supplemental rate from the state Department of Revenue. Figures from the site's verified 2026 dataset. Last verified 2026-07-24.</p>
          </details>
        </>
      )}
    </div>
  );
}
