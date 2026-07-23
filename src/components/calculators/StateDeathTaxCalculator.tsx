/** StateDeathTaxCalculator — state estate and inheritance tax by state and heir. */
import { useState } from 'react';
import { stateDeathTaxes, type HeirClass } from '../../lib/state-death-tax';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));
const HEIRS: Array<[HeirClass, string]> = [
  ['spouse', 'Spouse'], ['lineal', 'Child / parent / grandchild'], ['sibling', 'Sibling'], ['other', 'Other (niece, friend, etc.)'],
];

export default function StateDeathTaxCalculator() {
  const [stateCode, setStateCode] = useState('OR');
  const [estate, setEstate] = useState(2000000);
  const [inheritance, setInheritance] = useState(100000);
  const [heir, setHeir] = useState<HeirClass>('sibling');
  const [result, setResult] = useState<ReturnType<typeof stateDeathTaxes> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(stateDeathTaxes(stateCode, estate, inheritance, heir)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>State</label><select value={stateCode} onChange={(e) => ed(setStateCode)(e.target.value)}>{stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>
        <div className="form-group"><label>Total estate value</label><input type="number" min={0} value={estate} onChange={(e) => ed(setEstate)(num(e.target.value))} /><p className="field-note">For the estate tax (paid by the estate).</p></div>
        <div className="form-group"><label>Amount you inherit</label><input type="number" min={0} value={inheritance} onChange={(e) => ed(setInheritance)(num(e.target.value))} /><p className="field-note">For the inheritance tax (paid by the heir).</p></div>
        <div className="form-group"><label>Your relationship to the deceased</label><select value={heir} onChange={(e) => ed(setHeir)(e.target.value as HeirClass)}>{HEIRS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Check state death taxes'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Pick a state and enter the amounts.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.neither ? `${result.estate.stateName} has no death tax` : `Death taxes in ${result.estate.stateName}`}</h3>
          {result.estate.hasTax ? (
            <>
              <div className="result-line"><span>Estate exemption</span><span className="num">{formatMoney(result.estate.exemption ?? 0)}</span></div>
              <div className="result-line"><span>Taxable estate (over the exemption)</span><span className="num">{formatMoney(result.estate.taxableEstate)}</span></div>
              <div className="result-line total"><span>State estate tax (top rate {formatPct(result.estate.topRate ?? 0)})</span><span className="num">{formatMoney(result.estate.estimatedTax)}</span></div>
            </>
          ) : <div className="result-line"><span>State estate tax</span><span className="num">None</span></div>}
          {result.inheritance.hasTax ? (
            <div className="result-line total"><span>Inheritance tax on your share ({formatPct(result.inheritance.rate)})</span><span className="num">{formatMoney(result.inheritance.estimatedTax)}</span></div>
          ) : <div className="result-line"><span>State inheritance tax</span><span className="num">None</span></div>}
          {result.estate.note && <p className="results-note" data-review="legal">{result.estate.note}</p>}
          {result.inheritance.note && <p className="results-note" data-review="legal">{result.inheritance.note}</p>}
          <p className="results-note">
            State death taxes are separate from the federal estate tax and far more likely to hit — some states tax
            estates from as little as $1 million. Estate tax is on the estate; inheritance tax is on the heir and
            depends on your relationship. The estate figure uses the top marginal rate over the exemption, so it is
            an estimate for smaller taxable estates. Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
