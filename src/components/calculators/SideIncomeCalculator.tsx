/** SideIncomeCalculator — do you owe tax / get a 1099-K on side income? Nothing stored. */
import { useId, useState } from 'react';
import { sideIncomeThreshold, SIDE_INCOME_PLATFORMS } from '../../lib/sideIncome';
import { states } from '../../data/states';
import { formatMoney } from '../../lib/tax-engine';

const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function SideIncomeCalculator({ presetPlatform = 'etsy', presetState = 'CA' }: { presetPlatform?: string; presetState?: string }) {
  const [platform, setPlatform] = useState(presetPlatform);
  const [stateCode, setStateCode] = useState(presetState);
  const [grossSales, setGross] = useState(8000);
  const [netProfit, setProfit] = useState(3000);
  const [transactions, setTx] = useState(120);
  const [result, setResult] = useState<ReturnType<typeof sideIncomeThreshold> | null>(null);
  const [stale, setStale] = useState(false);
  const id = useId();

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(sideIncomeThreshold({ platform, stateCode, netProfit, grossSales, transactions })); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label htmlFor={`${id}-plat`}>Platform</label><select id={`${id}-plat`} value={platform} onChange={(e) => ed(setPlatform)(e.target.value)}>{SIDE_INCOME_PLATFORMS.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</select></div>
        <div className="form-group"><label htmlFor={`${id}-state`}>Your state</label><select id={`${id}-state`} value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{stateOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label htmlFor={`${id}-gross`}>Gross sales this year</label><input id={`${id}-gross`} type="number" min={0} value={grossSales} onChange={(e) => ed(setGross)(num(e.target.value))} /><p className="field-note">Total the platform processed, before fees.</p></div>
        <div className="form-group"><label htmlFor={`${id}-profit`}>Your profit (after costs)</label><input id={`${id}-profit`} type="number" min={0} value={netProfit} onChange={(e) => ed(setProfit)(num(e.target.value))} /><p className="field-note">Sales minus fees, materials, shipping.</p></div>
        <div className="form-group"><label htmlFor={`${id}-tx`}>Number of transactions</label><input id={`${id}-tx`} type="number" min={0} value={transactions} onChange={(e) => ed(setTx)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Check what I owe'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Nothing you enter is stored or sent anywhere — it runs in your browser.</p></div>) : (
        <>
          <div className="callout">
            <strong>The short answer</strong>
            {result.headline}
          </div>
          <div className={stale ? 'results-box is-stale' : 'results-box'}>
            <h3>Your {result.platformName} side income</h3>
            <div className="result-line"><span>Income tax owed on the profit?</span><span className="num">{result.incomeTaxable ? 'Yes, from $1' : 'No profit'}</span></div>
            <div className="result-line"><span>Self-employment tax (profit ≥ ${result.seThreshold})?</span><span className="num">{result.seTaxApplies ? 'Yes' : 'No'}</span></div>
            <div className="result-line"><span>Will {result.platformName} send a 1099-K?</span><span className="num">{!result.platformUses1099K ? 'No — uses 1099-NEC/MISC' : result.willReceive1099K ? 'Yes' : 'No — under federal threshold'}</span></div>
            <div className="result-line total"><span>Estimated tax on ${formatMoney(netProfit).replace('$', '')} profit</span><span className="num">{formatMoney(result.tax.totalTax)}</span></div>
            <div className="result-line"><span>— of which self-employment tax</span><span className="num">{formatMoney(result.tax.seTax)}</span></div>
            <div className="result-line"><span>— of which {states[stateCode].name} state tax</span><span className="num">{formatMoney(result.tax.stateTax)}</span></div>
            <p className="results-note">Set aside roughly {Math.round(result.tax.setAsidePct * 100)}% of this profit for tax.</p>
          </div>
          <div className="callout">
            <strong>On the 1099-K form</strong>
            {result.stateReportingNote}
          </div>
          {result.gigPointer && (
            <div className="share-card">
              <p className="share-label">This is a gig platform</p>
              <p className="share-sub">The site has a dedicated tool for it — the <a href={result.gigPointer}>gig tax calculator</a> handles mileage and the 1099-NEC/1099-K split.</p>
            </div>
          )}
          <details className="methodology">
            <summary>Methodology &amp; sources</summary>
            <p>Income tax and self-employment tax are computed by the site's existing 2026 engine on the profit you enter. The 1099-K determination uses the federal threshold — over ${result.federalThreshold.amount.toLocaleString()} and more than {result.federalThreshold.transactions} transactions — which OBBBA restored for 2025 forward. A 1099-K is a reporting form; it never changes what you owe, only whether the IRS is told.</p>
            <p className="src">Sources: IRS — Understanding your Form 1099-K; IRC §6017 (the $400 SE-tax threshold). Platform reporting behavior varies — confirm with the platform. Not tax advice.</p>
          </details>
        </>
      )}
    </div>
  );
}
