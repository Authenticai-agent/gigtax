/**
 * CryptoTaxCalculator — ported from cryptoTaxView. Short/long-term gains at the
 * dataset-backed LTCG rates (the legacy view hardcoded stale thresholds), staking
 * as ordinary income, NFT flips as short-term, plus NIIT which the legacy view
 * omitted. Federal only; state tax deferred with the rest of the block.
 */
import { useState } from 'react';
import { investmentTax } from '../../lib/capital-gains';
import { formatMoney, formatPct } from '../../lib/tax-engine';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;

export default function CryptoTaxCalculator() {
  const [status, setStatus] = useState('single');
  const [stGain, setStGain] = useState(5000);
  const [ltGain, setLtGain] = useState(15000);
  const [stLoss, setStLoss] = useState(0);
  const [ltLoss, setLtLoss] = useState(0);
  const [staking, setStaking] = useState(2000);
  const [nft, setNft] = useState(0);
  const [otherW2, setOtherW2] = useState(40000);
  const [result, setResult] = useState<ReturnType<typeof investmentTax> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    setResult(investmentTax({
      status,
      otherOrdinaryIncome: otherW2 + staking,
      shortTermGains: stGain + nft, shortTermLosses: stLoss,
      longTermGains: ltGain, longTermLosses: ltLoss,
      applyStandardDeduction: true,
    }));
    setStale(false);
  };
  return (
    <div className="calc-panel">
      <p className="section-label">Coin sales</p>
      <div className="calc-grid">
        <div className="form-group"><label>Short-term gains (held ≤1 year)</label>
          <input type="number" min={0} value={stGain} onChange={(e) => ed(setStGain)(num(e.target.value))} /></div>
        <div className="form-group"><label>Long-term gains (held &gt;1 year)</label>
          <input type="number" min={0} value={ltGain} onChange={(e) => ed(setLtGain)(num(e.target.value))} /></div>
        <div className="form-group"><label>Short-term losses</label>
          <input type="number" min={0} value={stLoss} onChange={(e) => ed(setStLoss)(num(e.target.value))} /></div>
        <div className="form-group"><label>Long-term losses</label>
          <input type="number" min={0} value={ltLoss} onChange={(e) => ed(setLtLoss)(num(e.target.value))} /></div>
      </div>
      <p className="section-label">Staking, NFTs and other income</p>
      <div className="calc-grid">
        <div className="form-group"><label>Staking rewards (ordinary income)</label>
          <input type="number" min={0} value={staking} onChange={(e) => ed(setStaking)(num(e.target.value))} /></div>
        <div className="form-group"><label>NFT flip gains (short-term)</label>
          <input type="number" min={0} value={nft} onChange={(e) => ed(setNft)(num(e.target.value))} /></div>
        <div className="form-group"><label>Other income (wages etc.)</label>
          <input type="number" min={0} value={otherW2} onChange={(e) => ed(setOtherW2)(num(e.target.value))} /></div>
        <div className="form-group"><label>Filing status</label>
          <select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate crypto tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your crypto gains, staking and income.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Federal tax for 2026</h3>
          <div className="result-line"><span>Short-term + staking + NFT (ordinary)</span><span className="num">{formatMoney(result.ordinaryTaxTotal)}</span></div>
          <div className="result-line"><span>Long-term gains (0/15/20%)</span><span className="num">{formatMoney(result.preferentialTax)}</span></div>
          {result.niit.tax > 0 && <div className="result-line"><span>Net investment income tax (3.8%)</span><span className="num">{formatMoney(result.niit.tax)}</span></div>}
          <div className="result-line total"><span>Total federal tax</span><span className="num">{formatMoney(result.totalFederalTax)}</span></div>
          {result.capitalLossCarryover > 0 && <div className="result-line"><span>Capital loss carried forward</span><span className="num">{formatMoney(result.capitalLossCarryover)}</span></div>}
          <p className="results-note">
            Crypto is property: sales are capital gains, staking is ordinary income when received, and wash-sale
            rules do not apply. Long-term gains use the same 0/15/20% brackets as stocks. Federal only; state tax
            is extra. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
