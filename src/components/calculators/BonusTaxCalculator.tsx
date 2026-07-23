/**
 * BonusTaxCalculator — flat 22% vs aggregate withholding on a bonus.
 * Composes bonusTax() from the lib; no tax math here.
 */
import { useState } from 'react';
import { bonusTax } from '../../lib/withholding';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [['single','Single'],['mfj','Married filing jointly'],['hoh','Head of household'],['mfs','Married filing separately']] as const;
const stateOptions = Object.entries(states).map(([c,s])=>[c,s.name] as const).sort((a,b)=>a[1].localeCompare(b[1]));

export default function BonusTaxCalculator({ presetState = '' }: { presetState?: string }) {
  const [bonus,setBonus]=useState(10000);
  const [salary,setSalary]=useState(70000);
  const [status,setStatus]=useState('single');
  const [stateCode,setStateCode]=useState(presetState);
  const [result,setResult]=useState<ReturnType<typeof bonusTax>|null>(null);
  const [stale,setStale]=useState(false);
  const num=(v:string)=>v===''?0:Math.max(0,Number(v)||0);
  const ed=<T,>(f:(v:T)=>void)=>(v:T)=>{f(v);if(result)setStale(true);};
  const calc=()=>{setResult(bonusTax(bonus,salary,stateCode,status));setStale(false);};
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Bonus amount</label><input type="number" min={0} value={bonus} onChange={e=>ed(setBonus)(num(e.target.value))}/></div>
        <div className="form-group"><label>Annual salary</label><input type="number" min={0} value={salary} onChange={e=>ed(setSalary)(num(e.target.value))}/></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={e=>ed(setStateCode)(e.target.value)}>{!stateCode&&<option value="">Select your state…</option>}{stateOptions.map(([c,n])=><option key={c} value={c}>{n}</option>)}</select></div>
        <div className="form-group"><label>Filing status</label><select value={status} onChange={e=>ed(setStatus)(e.target.value)}>{STATUSES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions"><button type="button" className="btn-calculate" onClick={calc}>{result?'Recalculate':'Calculate'}</button>{stale&&<span className="stale-note">Inputs changed — press Recalculate</span>}</div>
      {result===null ? <div className="results-placeholder"><p>Enter your bonus and salary, then Calculate.</p></div> : (
        <div className={stale?'results-box is-stale':'results-box'}>
          <h3>What you keep from a {formatMoney(result.bonus)} bonus{stateCode?` — ${states[stateCode]?.name}`:''}</h3>
          <table className="quarter-table"><thead><tr><th></th><th>Flat 22%</th><th>Aggregate</th></tr></thead>
          <tbody>
            <tr><td>Federal withheld</td><td>{formatMoney(result.flat.federal)}</td><td>{formatMoney(result.aggregate.federal)}</td></tr>
            <tr><td>FICA</td><td>{formatMoney(result.flat.fica)}</td><td>{formatMoney(result.aggregate.fica)}</td></tr>
            <tr><td>State</td><td>{stateCode?formatMoney(result.flat.state):'—'}</td><td>{stateCode?formatMoney(result.aggregate.state):'—'}</td></tr>
            <tr className="total"><td>You keep now</td><td>{formatMoney(result.flat.net)}</td><td>{formatMoney(result.aggregate.net)}</td></tr>
          </tbody></table>
          <div className="result-notes">
            <strong>This is withholding, not your final tax</strong>
            <p>{result.keepsMore==='same'?'Both methods withhold about the same here.':`The ${result.keepsMore} method leaves ${formatMoney(Math.abs(result.flat.net-result.aggregate.net))} more in your pocket now.`} At year-end the bonus is taxed like any other wages — whichever method withheld less means a smaller refund or a bill, not a lower tax. Not tax advice.</p>
          </div>
        </div>
      )}
    </div>
  );
}
