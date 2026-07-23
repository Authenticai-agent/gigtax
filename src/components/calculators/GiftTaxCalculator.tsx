/** GiftTaxCalculator — annual exclusion, when a 709 is required, lifetime draw-down. */
import { useState } from 'react';
import { giftTax, ANNUAL_GIFT_EXCLUSION, NONCITIZEN_SPOUSE_EXCLUSION } from '../../lib/estate';
import { formatMoney } from '../../lib/tax-engine';

export default function GiftTaxCalculator() {
  const [gift, setGift] = useState(50000);
  const [recipients, setRecipients] = useState(1);
  const [priorGifts, setPriorGifts] = useState(0);
  const [noncitizen, setNoncitizen] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof giftTax> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(giftTax(gift, recipients, priorGifts, noncitizen)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Gift to each recipient</label>
          <input type="number" min={0} value={gift} onChange={(e) => ed(setGift)(num(e.target.value))} /></div>
        <div className="form-group"><label>Number of recipients</label>
          <input type="number" min={1} max={100} value={recipients} onChange={(e) => ed(setRecipients)(Math.max(1, num(e.target.value)))} /></div>
        <div className="form-group"><label>Lifetime taxable gifts already made</label>
          <input type="number" min={0} value={priorGifts} onChange={(e) => ed(setPriorGifts)(num(e.target.value))} /></div>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem' }}>
          <input id="ncs" type="checkbox" checked={noncitizen} onChange={(e) => ed(setNoncitizen)(e.target.checked)} style={{ width: 'auto' }} />
          <label htmlFor="ncs" style={{ margin: 0 }}>Recipient is a noncitizen spouse</label>
        </div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Check the gift tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your gift amount.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.returnRequired ? 'A gift-tax return is required' : 'No gift-tax return needed'}</h3>
          <div className="result-line"><span>Annual exclusion per recipient</span><span className="num">{formatMoney(result.annualExclusion)}</span></div>
          <div className="result-line"><span>Taxable gift per recipient</span><span className="num">{formatMoney(result.taxablePerRecipient)}</span></div>
          <div className="result-line total"><span>Total taxable gifts</span><span className="num">{formatMoney(result.totalTaxableGifts)}</span></div>
          <div className="result-line"><span>Lifetime exclusion remaining</span><span className="num">{formatMoney(result.remainingLifetimeExclusion)}</span></div>
          <div className="result-line total"><span>Gift tax actually due</span><span className="num">{formatMoney(result.giftTaxDue)}</span></div>
          <p className="results-note">
            You can give {formatMoney(ANNUAL_GIFT_EXCLUSION)} per person per year ({formatMoney(NONCITIZEN_SPOUSE_EXCLUSION)}
            {' '}to a noncitizen spouse) with no return and no effect on your exclusion. Above that, you file Form 709
            and the excess draws down your {formatMoney(15000000)} lifetime exclusion — but no tax is actually due
            until that is exhausted. A married couple can double the annual amount by splitting gifts. Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
