/** DeathMoneyCalculator — project net worth to death, then run the verified estate engines. */
import { useState } from 'react';
import { deathAndMoney } from '../../lib/lifestyle';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

export default function DeathMoneyCalculator() {
  const [netWorth, setNetWorth] = useState(2000000);
  const [annualSavings, setSavings] = useState(50000);
  const [investmentReturn, setReturn] = useState(6);
  const [currentAge, setAge] = useState(55);
  const [deathAge, setDeathAge] = useState(85);
  const [charity, setCharity] = useState(0);
  const [stateCode, setState] = useState('CA');
  const [result, setResult] = useState<ReturnType<typeof deathAndMoney> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(deathAndMoney({ netWorth, annualSavings, investmentReturn: investmentReturn / 100, currentAge, deathAge, charity, stateCode, priorExemptionUsed: 0 })); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Net worth now</label><input type="number" min={0} value={netWorth} onChange={(e) => ed(setNetWorth)(num(e.target.value))} /></div>
        <div className="form-group"><label>Annual saving / growth added</label><input type="number" min={0} value={annualSavings} onChange={(e) => ed(setSavings)(num(e.target.value))} /></div>
        <div className="form-group"><label>Investment return (%/yr)</label><input type="number" min={0} step={0.5} value={investmentReturn} onChange={(e) => ed(setReturn)(num(e.target.value))} /></div>
        <div className="form-group"><label>Your age now</label><input type="number" min={0} value={currentAge} onChange={(e) => ed(setAge)(num(e.target.value))} /></div>
        <div className="form-group"><label>Estimated age at death</label><input type="number" min={0} value={deathAge} onChange={(e) => ed(setDeathAge)(num(e.target.value))} /></div>
        <div className="form-group"><label>Charitable bequest</label><input type="number" min={0} value={charity} onChange={(e) => ed(setCharity)(num(e.target.value))} /><p className="field-note">Deducted from the taxable estate.</p></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={(e) => ed(setState)(e.target.value)}>{stateOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Project my estate'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your net worth and time horizon.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.owesFederal || result.stateEstateTax > 0 ? 'Your estate would owe tax' : 'Your estate owes no estate tax'}</h3>
          <div className="result-line"><span>Projected estate at death</span><span className="num">{formatMoney(result.projectedEstate)}</span></div>
          {result.charity > 0 && <div className="result-line"><span>Less charitable bequest</span><span className="num">−{formatMoney(result.charity)}</span></div>}
          <div className="result-line"><span>Taxable estate (over the $15M exclusion)</span><span className="num">{formatMoney(result.taxableEstate)}</span></div>
          <div className="result-line"><span>Federal estate tax (40%)</span><span className="num">{formatMoney(result.federalEstateTax)}</span></div>
          <div className="result-line"><span>State estate tax</span><span className="num">{formatMoney(result.stateEstateTax)}</span></div>
          <div className="result-line total"><span>Total death tax</span><span className="num">{formatMoney(result.totalDeathTax)}</span></div>
          <div className="result-line total"><span>Left to your heirs</span><span className="num">{formatMoney(result.netToHeirs)}</span></div>
          <p className="results-note">
            The federal estate tax spares almost everyone — the 2026 exclusion is $15 million per person ($30M for a
            married couple with portability). State estate taxes catch far more estates, some from $1M. This projects
            your net worth forward, then runs the verified federal and state engines. Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
