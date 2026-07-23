/** W4Calculator — projected annual tax vs withholding, refund or bill. */
import { useState } from 'react';
import { w4Check } from '../../lib/withholding';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES=[['single','Single'],['mfj','Married filing jointly'],['hoh','Head of household'],['mfs','Married filing separately']] as const;
const FREQ=[['52','Weekly'],['26','Every two weeks'],['24','Twice a month'],['12','Monthly']] as const;
const stateOptions=Object.entries(states).map(([c,s])=>[c,s.name] as const).sort((a,b)=>a[1].localeCompare(b[1]));

export default function W4Calculator({ presetState='' }:{presetState?:string}) {
  const [salary,setSalary]=useState(80000);
  const [withheld,setWithheld]=useState(700);
  const [periods,setPeriods]=useState(26);
  const [status,setStatus]=useState('single');
  const [stateCode,setStateCode]=useState(presetState);
  const [deps,setDeps]=useState(0);
  const [result,setResult]=useState<ReturnType<typeof w4Check>|null>(null);
  const [stale,setStale]=useState(false);
  const num=(v:string)=>v===''?0:Math.max(0,Number(v)||0);
  const ed=<T,>(f:(v:T)=>void)=>(v:T)=>{f(v);if(result)setStale(true);};
  const calc=()=>{setResult(w4Check(salary,withheld,periods,stateCode,status,0,0,deps*2200));setStale(false);};
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Annual salary</label><input type="number" min={0} value={salary} onChange={e=>ed(setSalary)(num(e.target.value))}/></div>
        <div className="form-group"><label>Federal tax withheld per paycheck</label><input type="number" min={0} value={withheld} onChange={e=>ed(setWithheld)(num(e.target.value))}/></div>
        <div className="form-group"><label>Pay frequency</label><select value={periods} onChange={e=>ed(setPeriods)(Number(e.target.value))}>{FREQ.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>State</label><select value={stateCode} onChange={e=>ed(setStateCode)(e.target.value)}>{!stateCode&&<option value="">Select your state…</option>}{stateOptions.map(([c,n])=><option key={c} value={c}>{n}</option>)}</select></div>
        <div className="form-group"><label>Filing status</label><select value={status} onChange={e=>ed(setStatus)(e.target.value)}>{STATUSES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Children under 17</label><input type="number" min={0} max={20} value={deps} onChange={e=>ed(setDeps)(num(e.target.value))}/></div>
      </div>
      <div className="calc-actions"><button type="button" className="btn-calculate" onClick={calc}>{result?'Recheck':'Am I on track?'}</button>{stale&&<span className="stale-note">Inputs changed — press Recheck</span>}</div>
      {result===null ? <div className="results-placeholder"><p>Enter your salary and per-paycheck withholding.</p></div> : (
        <div className={stale?'results-box is-stale':'results-box'}>
          <h3>{result.status==='refund'?'Heading for a refund':result.status==='owe'?'Heading for a bill':'On track'}</h3>
          <div className="result-line"><span>Projected tax for the year</span><span className="num">{formatMoney(result.totalTaxForYear)}</span></div>
          <div className="result-line"><span>Withheld across the year</span><span className="num">{formatMoney(result.withheldForYear)}</span></div>
          <div className="result-line total"><span>{result.difference>=0?'Expected refund':'Expected to owe'}</span><span className="num">{formatMoney(Math.abs(result.difference))}</span></div>
          {result.suggestedPerCheck!==null && <div className="result-line"><span>To land near zero, withhold per check</span><span className="num">{formatMoney(result.suggestedPerCheck)}</span></div>}
          <p className="results-note">Federal, state and FICA projection. Withholding is not your final tax. A big refund is an interest-free loan to the IRS; a big bill can mean a penalty. Not tax advice.</p>
        </div>
      )}
    </div>
  );
}
