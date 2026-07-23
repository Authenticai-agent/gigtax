/** W2Vs1099Calculator — compare a W-2 offer against a 1099 offer on take-home. */
import { useState } from 'react';
import { compareOffers } from '../../lib/withholding';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES=[['single','Single'],['mfj','Married filing jointly'],['hoh','Head of household'],['mfs','Married filing separately']] as const;
const stateOptions=Object.entries(states).map(([c,s])=>[c,s.name] as const).sort((a,b)=>a[1].localeCompare(b[1]));

export default function W2Vs1099Calculator({ presetState='' }:{presetState?:string}) {
  const [w2Salary,setW2Salary]=useState(85000);
  const [health,setHealth]=useState(8000);
  const [match,setMatch]=useState(4);
  const [pto,setPto]=useState(3);
  const [income,setIncome]=useState(95000);
  const [ded,setDed]=useState(8000);
  const [healthCost,setHealthCost]=useState(6000);
  const [solo,setSolo]=useState(0);
  const [status,setStatus]=useState('single');
  const [stateCode,setStateCode]=useState(presetState);
  const [result,setResult]=useState<ReturnType<typeof compareOffers>|null>(null);
  const [stale,setStale]=useState(false);
  const num=(v:string)=>v===''?0:Math.max(0,Number(v)||0);
  const ed=<T,>(f:(v:T)=>void)=>(v:T)=>{f(v);if(result)setStale(true);};
  const calc=()=>{setResult(compareOffers({salary:w2Salary,employerHealth:health,match401kPct:match,ptoWeeks:pto},{income,deductions:ded,healthCost,solo401k:solo},stateCode,status));setStale(false);};
  return (
    <div className="calc-panel">
      <p className="section-label">The W-2 offer</p>
      <div className="calc-grid">
        <div className="form-group"><label>W-2 salary</label><input type="number" min={0} value={w2Salary} onChange={e=>ed(setW2Salary)(num(e.target.value))}/></div>
        <div className="form-group"><label>Employer-paid health insurance</label><input type="number" min={0} value={health} onChange={e=>ed(setHealth)(num(e.target.value))}/></div>
        <div className="form-group"><label>401(k) match (%)</label><input type="number" min={0} step={0.5} value={match} onChange={e=>ed(setMatch)(num(e.target.value))}/></div>
        <div className="form-group"><label>Paid time off (weeks)</label><input type="number" min={0} value={pto} onChange={e=>ed(setPto)(num(e.target.value))}/></div>
      </div>
      <p className="section-label">The 1099 offer</p>
      <div className="calc-grid">
        <div className="form-group"><label>1099 gross income</label><input type="number" min={0} value={income} onChange={e=>ed(setIncome)(num(e.target.value))}/></div>
        <div className="form-group"><label>Business deductions</label><input type="number" min={0} value={ded} onChange={e=>ed(setDed)(num(e.target.value))}/></div>
        <div className="form-group"><label>Health insurance you'll buy</label><input type="number" min={0} value={healthCost} onChange={e=>ed(setHealthCost)(num(e.target.value))}/></div>
        <div className="form-group"><label>Solo 401(k) contribution</label><input type="number" min={0} value={solo} onChange={e=>ed(setSolo)(num(e.target.value))}/></div>
      </div>
      <div className="calc-grid">
        <div className="form-group"><label>State</label><select value={stateCode} onChange={e=>ed(setStateCode)(e.target.value)}>{!stateCode&&<option value="">Select your state…</option>}{stateOptions.map(([c,n])=><option key={c} value={c}>{n}</option>)}</select></div>
        <div className="form-group"><label>Filing status</label><select value={status} onChange={e=>ed(setStatus)(e.target.value)}>{STATUSES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions"><button type="button" className="btn-calculate" onClick={calc}>{result?'Recompare':'Compare side by side'}</button>{stale&&<span className="stale-note">Inputs changed — press Recompare</span>}</div>
      {result===null ? <div className="results-placeholder"><p>Enter both offers and press Compare.</p></div> : (
        <div className={stale?'results-box is-stale':'results-box'}>
          <h3>{result.winner==='even'?'The two offers are about even':result.winner==='w2'?'The W-2 offer wins':'The 1099 offer wins'}</h3>
          <div className="result-line"><span>W-2 take-home</span><span className="num">{formatMoney(result.w2TakeHome)}</span></div>
          <div className="result-line"><span>1099 take-home</span><span className="num">{formatMoney(result.c1099TakeHome)}</span></div>
          <div className="result-line total"><span>Difference</span><span className="num">{result.difference>=0?'+':''}{formatMoney(result.difference)} for 1099</span></div>
          <div className="result-line"><span>True value of the W-2 with benefits</span><span className="num">{formatMoney(result.w2TotalValue)}</span></div>
          <div className="result-line total"><span>1099 gross that would match the W-2 take-home</span><span className="num">{formatMoney(result.breakEven1099)}</span></div>
          <p className="results-note">A 1099 offer has to clear the break-even figure above just to match the W-2 on take-home, before the value of employer benefits. Not tax or career advice.</p>
        </div>
      )}
    </div>
  );
}
