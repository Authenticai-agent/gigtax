/** CobraMarketplaceCalculator — COBRA vs 2026 marketplace, with the FPL cliff. Nothing stored. */
import { useId, useState } from 'react';
import { cobraVsMarketplace, type CobraSource } from '../../lib/layoff/cobraVsMarketplace';
import { formatMoney } from '../../lib/tax-engine';

const SOURCES: [CobraSource, string][] = [
  ['box12dd', 'From my W-2 Box 12 Code DD (annual)'],
  ['known', 'I know my monthly COBRA premium'],
  ['national_average', 'Use a national average'],
];

export default function CobraMarketplaceCalculator() {
  const [cobraSource, setSource] = useState<CobraSource>('box12dd');
  const [cobraValue, setValue] = useState(9000);
  const [household, setHousehold] = useState<'single' | 'family'>('single');
  const [householdSize, setSize] = useState(1);
  const [estimatedMAGI, setMagi] = useState(55000);
  const [marketplaceBenchmarkMonthly, setBench] = useState(520);
  const [coverageHorizonMonths, setHorizon] = useState(12);
  const [result, setResult] = useState<ReturnType<typeof cobraVsMarketplace> | null>(null);
  const [stale, setStale] = useState(false);
  const id = useId();

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(cobraVsMarketplace({ cobraSource, cobraValue, household, householdSize, estimatedMAGI, marketplaceBenchmarkMonthly, coverageHorizonMonths })); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label htmlFor={`${id}-src`}>COBRA premium source</label><select id={`${id}-src`} value={cobraSource} onChange={(e) => ed(setSource)(e.target.value as CobraSource)}>{SOURCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        {cobraSource !== 'national_average' && (
          <div className="form-group"><label htmlFor={`${id}-val`}>{cobraSource === 'box12dd' ? 'W-2 Box 12 DD (annual)' : 'COBRA premium ($/month)'}</label><input id={`${id}-val`} type="number" min={0} value={cobraValue} onChange={(e) => ed(setValue)(num(e.target.value))} /><p className="field-note">{cobraSource === 'box12dd' ? 'Total annual plan cost — we add the 2% admin fee.' : 'What the plan quoted you.'}</p></div>
        )}
        <div className="form-group"><label htmlFor={`${id}-cov`}>Coverage</label><select id={`${id}-cov`} value={household} onChange={(e) => ed(setHousehold)(e.target.value as 'single' | 'family')}><option value="single">Just me</option><option value="family">Family</option></select></div>
        <div className="form-group"><label htmlFor={`${id}-size`}>Household size</label><input id={`${id}-size`} type="number" min={1} value={householdSize} onChange={(e) => ed(setSize)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-magi`}>Estimated 2026 income (MAGI)</label><input id={`${id}-magi`} type="number" min={0} value={estimatedMAGI} onChange={(e) => ed(setMagi)(num(e.target.value))} /><p className="field-note">Severance + UI + other. A low-income year can beat the cliff.</p></div>
        <div className="form-group"><label htmlFor={`${id}-bench`}>Marketplace benchmark premium ($/mo)</label><input id={`${id}-bench`} type="number" min={0} value={marketplaceBenchmarkMonthly} onChange={(e) => ed(setBench)(num(e.target.value))} /><p className="field-note">Second-lowest silver plan on healthcare.gov.</p></div>
        <div className="form-group"><label htmlFor={`${id}-horizon`}>Coverage horizon (months)</label><input id={`${id}-horizon`} type="number" min={1} value={coverageHorizonMonths} onChange={(e) => ed(setHorizon)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Compare COBRA vs marketplace'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Nothing you enter is stored or sent anywhere — it runs in your browser.</p></div>) : (
        <>
          {result.cliffWarning && <div className="callout" data-review="legal"><strong>Subsidy cliff:</strong> {result.cliffWarning}</div>}
          <div className={stale ? 'results-box is-stale' : 'results-box'}>
            <h3>{result.cheaper === 'cobra' ? 'COBRA is cheaper here' : 'The marketplace is cheaper here'}</h3>
            <div className="result-line"><span>COBRA</span><span className="num">{formatMoney(result.cobraMonthly)}/mo · {formatMoney(result.cobraTotal)} over {result.horizonMonths} mo</span></div>
            <div className="result-line"><span>Marketplace benchmark</span><span className="num">{formatMoney(result.marketplaceBenchmarkMonthly)}/mo</span></div>
            <div className="result-line"><span>Estimated 2026 subsidy</span><span className="num">−{formatMoney(result.estimatedSubsidyMonthly)}/mo</span></div>
            <div className="result-line"><span>Marketplace net</span><span className="num">{formatMoney(result.marketplaceNetMonthly)}/mo · {formatMoney(result.marketplaceTotal)} over {result.horizonMonths} mo</span></div>
            <div className="result-line total"><span>{result.cheaper === 'cobra' ? 'COBRA' : 'Marketplace'} saves</span><span className="num">{formatMoney(result.savingsOverHorizon)}</span></div>
            <p className="results-note">You are at about {(result.fplPct * 100).toFixed(0)}% of the federal poverty level. {result.retroactiveNote}</p>
          </div>
          <div className="share-card">
            <p className="share-label">For your runway</p>
            <p className="share-figure">{formatMoney(result.cheaper === 'cobra' ? result.cobraMonthly : result.marketplaceNetMonthly)}/mo</p>
            <p className="share-sub">health premium ({result.cheaper}) — carry into the <a href="/layoff-runway-calculator/">runway calculator</a></p>
          </div>
          <details className="methodology">
            <summary>Methodology &amp; sources</summary>
            <p>COBRA is up to 102% of the full plan cost (Box 12 DD ÷ 12 × 1.02). The marketplace net is the benchmark premium minus the 2026 premium tax credit — but the enhanced credits expired 31 Dec 2025, so the hard 400% FPL cliff is back: a dollar of income over the threshold wipes out the subsidy entirely. Coverage is retroactive if you elect COBRA within 60 days, so healthy people can wait and see. Rules may have changed since verification.</p>
            <p className="src">Sources: DOL COBRA guidance; 2026 FPL and applicable-percentage tables (IRS); KFF 2025 averages for the fallback path. ACA subsidy rules last verified 2026-07-24 — the enhanced credits remained expired and unextended.</p>
          </details>
        </>
      )}
    </div>
  );
}
