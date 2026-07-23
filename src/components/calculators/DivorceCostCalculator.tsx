/** DivorceCostCalculator — the money side of a divorce: assets, support, legal fees. */
import { useState } from 'react';
import { divorceCost } from '../../lib/lifestyle';
import { formatMoney } from '../../lib/tax-engine';

export default function DivorceCostCalculator() {
  const [home, setHome] = useState(400000);
  const [retirement, setRetirement] = useState(200000);
  const [savings, setSavings] = useState(50000);
  const [otherAssets, setOther] = useState(20000);
  const [debts, setDebts] = useState(100000);
  const [alimonyMonthly, setAlimony] = useState(2000);
  const [alimonyYears, setAlimonyYears] = useState(5);
  const [childMonthly, setChild] = useState(1500);
  const [childYears, setChildYears] = useState(10);
  const [attorneyYou, setAttorney] = useState(15000);
  const [mediator, setMediator] = useState(5000);
  const [result, setResult] = useState<ReturnType<typeof divorceCost> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(divorceCost({ home, retirement, savings, otherAssets, debts, alimonyMonthly, alimonyYears, childMonthly, childYears, attorneyYou, attorneySpouse: 0, mediator })); setStale(false); };

  return (
    <div className="calc-panel">
      <p className="section-label">Marital assets and debts</p>
      <div className="calc-grid">
        <div className="form-group"><label>Home equity</label><input type="number" min={0} value={home} onChange={(e) => ed(setHome)(num(e.target.value))} /></div>
        <div className="form-group"><label>Retirement accounts</label><input type="number" min={0} value={retirement} onChange={(e) => ed(setRetirement)(num(e.target.value))} /></div>
        <div className="form-group"><label>Savings &amp; investments</label><input type="number" min={0} value={savings} onChange={(e) => ed(setSavings)(num(e.target.value))} /></div>
        <div className="form-group"><label>Other assets</label><input type="number" min={0} value={otherAssets} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>Shared debts</label><input type="number" min={0} value={debts} onChange={(e) => ed(setDebts)(num(e.target.value))} /></div>
      </div>
      <p className="section-label">Support and fees</p>
      <div className="calc-grid">
        <div className="form-group"><label>Alimony ($/mo)</label><input type="number" min={0} value={alimonyMonthly} onChange={(e) => ed(setAlimony)(num(e.target.value))} /></div>
        <div className="form-group"><label>Alimony (years)</label><input type="number" min={0} value={alimonyYears} onChange={(e) => ed(setAlimonyYears)(num(e.target.value))} /></div>
        <div className="form-group"><label>Child support ($/mo)</label><input type="number" min={0} value={childMonthly} onChange={(e) => ed(setChild)(num(e.target.value))} /></div>
        <div className="form-group"><label>Child support (years)</label><input type="number" min={0} value={childYears} onChange={(e) => ed(setChildYears)(num(e.target.value))} /></div>
        <div className="form-group"><label>Your attorney fees</label><input type="number" min={0} value={attorneyYou} onChange={(e) => ed(setAttorney)(num(e.target.value))} /></div>
        <div className="form-group"><label>Mediator (shared)</label><input type="number" min={0} value={mediator} onChange={(e) => ed(setMediator)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Estimate the cost'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter the marital assets and any support.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>The money side of a divorce</h3>
          <div className="result-line"><span>Net marital estate</span><span className="num">{formatMoney(result.netMaritalEstate)}</span></div>
          <div className="result-line"><span>Your half of the assets</span><span className="num">{formatMoney(result.yourAssetShare)}</span></div>
          <div className="result-line"><span>Total alimony</span><span className="num">{formatMoney(result.totalAlimony)}</span></div>
          <div className="result-line"><span>Total child support</span><span className="num">{formatMoney(result.totalChildSupport)}</span></div>
          <div className="result-line"><span>Legal fees (both sides + mediator)</span><span className="num">{formatMoney(result.legalFees)}</span></div>
          <div className="result-line total"><span>Your out-of-pocket cost (fees + support)</span><span className="num">{formatMoney(result.totalCost)}</span></div>
          <p className="results-note">
            An even 50/50 asset split is the illustration; real division depends on state law (community-property vs
            equitable-distribution) and negotiation. Support figures are your inputs, not a formula for what a court
            would order. Not legal or financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
