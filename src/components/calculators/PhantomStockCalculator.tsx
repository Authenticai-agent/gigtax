/** PhantomStockCalculator — phantom stock / SARs payout taxed as ordinary income. */
import { useState } from 'react';
import { phantomOutcome } from '../../lib/equity';
import { formatMoney } from '../../lib/tax-engine';

const STATUSES = [['single', 'Single'], ['mfj', 'Married filing jointly'], ['hoh', 'Head of household'], ['mfs', 'Married filing separately']] as const;

export default function PhantomStockCalculator() {
  const [payout, setPayout] = useState(25000);
  const [otherIncome, setOther] = useState(150000);
  const [recipient, setRecipient] = useState<'employee' | 'contractor'>('employee');
  const [status, setStatus] = useState('single');
  const [result, setResult] = useState<ReturnType<typeof phantomOutcome> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(phantomOutcome(payout, otherIncome, recipient, status)); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Payout amount</label><input type="number" min={0} value={payout} onChange={(e) => ed(setPayout)(num(e.target.value))} /><p className="field-note">Cash settled at vesting or a liquidity event.</p></div>
        <div className="form-group"><label>Your other ordinary income</label><input type="number" min={0} value={otherIncome} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>How are you paid?</label><select value={recipient} onChange={(e) => ed(setRecipient)(e.target.value as 'employee' | 'contractor')}><option value="employee">Employee (W-2)</option><option value="contractor">Contractor (1099-NEC)</option></select></div>
        <div className="form-group"><label>Filing status</label><select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate phantom tax'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter the payout to see the tax on it.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Tax on the phantom payout</h3>
          <div className="result-line"><span>Payout</span><span className="num">{formatMoney(result.payout)}</span></div>
          <div className="result-line"><span>Extra federal income tax</span><span className="num">{formatMoney(result.incrementalFederal)}</span></div>
          {result.fica > 0 && <div className="result-line"><span>FICA (employee, 7.65%)</span><span className="num">{formatMoney(result.fica)}</span></div>}
          {result.seTax > 0 && <div className="result-line"><span>Self-employment tax</span><span className="num">{formatMoney(result.seTax)}</span></div>}
          <div className="result-line total"><span>Total extra tax from the payout</span><span className="num">{formatMoney(result.totalExtraTax)}</span></div>
          <div className="result-line total"><span>Payout net after its own tax</span><span className="num">{formatMoney(result.net)}</span></div>
          <p className="results-note">
            Phantom stock and SARs settle in cash and are taxed as ordinary income the moment they pay out — there is no
            capital-gains rate, ever, because you never held a share. An employee also pays FICA; a contractor gets a
            1099-NEC and pays self-employment tax instead. The federal figure is marginal — the payout stacks on top of
            your other income. Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
