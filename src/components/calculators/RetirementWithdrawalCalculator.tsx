/** RetirementWithdrawalCalculator — withdrawal (with early penalty) or Roth conversion. */
import { useState } from 'react';
import { retirementWithdrawal, rothConversion } from '../../lib/retirement-planning';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'], ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'], ['mfs', 'Married filing separately'],
] as const;
const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function RetirementWithdrawalCalculator() {
  const [mode, setMode] = useState<'withdrawal' | 'conversion'>('withdrawal');
  const [amount, setAmount] = useState(20000);
  const [age, setAge] = useState(45);
  const [isRoth, setIsRoth] = useState(false);
  const [other, setOther] = useState(60000);
  const [status, setStatus] = useState('single');
  const [stateCode, setStateCode] = useState('');
  const [wResult, setWResult] = useState<ReturnType<typeof retirementWithdrawal> | null>(null);
  const [cResult, setCResult] = useState<ReturnType<typeof rothConversion> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (wResult || cResult) setStale(true); };
  const calc = () => {
    if (mode === 'withdrawal') { setWResult(retirementWithdrawal(amount, age, other, status, stateCode, isRoth)); setCResult(null); }
    else { setCResult(rothConversion(amount, other, status, stateCode)); setWResult(null); }
    setStale(false);
  };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>What are you doing?</label>
          <select value={mode} onChange={(e) => ed(setMode)(e.target.value as 'withdrawal' | 'conversion')}>
            <option value="withdrawal">Taking a withdrawal</option>
            <option value="conversion">Converting to Roth</option>
          </select></div>
        <div className="form-group"><label>{mode === 'withdrawal' ? 'Amount to withdraw' : 'Amount to convert'}</label><input type="number" min={0} value={amount} onChange={(e) => ed(setAmount)(num(e.target.value))} /></div>
        {mode === 'withdrawal' && (
          <div className="form-group"><label>Your age</label><input type="number" min={18} max={100} value={age} onChange={(e) => ed(setAge)(num(e.target.value))} /><p className="field-note">Under 59½ triggers a 10% penalty.</p></div>
        )}
        <div className="form-group"><label>Your other taxable income</label><input type="number" min={0} value={other} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{!stateCode && <option value="">Federal only</option>}{stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
        <div className="form-group"><label>Filing status</label><select value={status} onChange={(e) => ed(setStatus)(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        {mode === 'withdrawal' && (
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem', alignSelf: 'end' }}>
            <input id="rothW" type="checkbox" checked={isRoth} onChange={(e) => ed(setIsRoth)(e.target.checked)} style={{ width: 'auto' }} />
            <label htmlFor="rothW" style={{ margin: 0 }}>It's a Roth account</label>
          </div>
        )}
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{wResult || cResult ? 'Recalculate' : mode === 'withdrawal' ? 'Calculate the tax' : 'Cost to convert'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {wResult === null && cResult === null ? (
        <div className="results-placeholder"><p>Enter the amount and your income.</p></div>
      ) : wResult ? (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Tax on your {formatMoney(wResult.withdrawal)} withdrawal</h3>
          {wResult.isRoth ? (
            <div className="result-line total"><span>Tax-free (qualified Roth)</span><span className="num">{formatMoney(0)}</span></div>
          ) : (
            <>
              <div className="result-line"><span>Federal income tax</span><span className="num">− {formatMoney(wResult.federalTax)}</span></div>
              {wResult.stateTax > 0 && <div className="result-line"><span>State income tax</span><span className="num">− {formatMoney(wResult.stateTax)}</span></div>}
              {wResult.earlyPenalty > 0 && <div className="result-line"><span>10% early-withdrawal penalty</span><span className="num">− {formatMoney(wResult.earlyPenalty)}</span></div>}
              <div className="result-line total"><span>You actually receive</span><span className="num">{formatMoney(wResult.netReceived)}</span></div>
              <div className="result-line"><span>Effective rate on the withdrawal</span><span className="num">{formatPct(wResult.effectiveRate)}</span></div>
            </>
          )}
          <p className="results-note">
            A traditional withdrawal is ordinary income; before 59½ a 10% penalty is added unless an exception (first
            home, disability, education, medical) applies. A Roth withdrawal is tax-free if the account is five years
            old and you are 59½. Not tax or investment advice.
          </p>
        </div>
      ) : cResult && (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Cost to convert {formatMoney(cResult.conversionAmount)} to Roth</h3>
          <div className="result-line"><span>Federal tax on the conversion</span><span className="num">{formatMoney(cResult.federalTax)}</span></div>
          {cResult.stateTax > 0 && <div className="result-line"><span>State tax</span><span className="num">{formatMoney(cResult.stateTax)}</span></div>}
          <div className="result-line total"><span>Total tax cost (pay from outside the IRA)</span><span className="num">{formatMoney(cResult.totalTax)}</span></div>
          <div className="result-line"><span>Marginal bracket the conversion reaches</span><span className="num">{formatPct(cResult.marginalBracket)}</span></div>
          <div className="result-line"><span>Effective rate on the conversion</span><span className="num">{formatPct(cResult.effectiveRate)}</span></div>
          <p className="results-note">
            A conversion is taxable ordinary income now, with no penalty, in exchange for tax-free growth later. The
            skill is converting only enough to fill a low bracket — watch the marginal-bracket line, and convert more
            in low-income years. Pay the tax from outside the IRA to keep the full balance growing. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
