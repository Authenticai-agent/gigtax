/** OvertimeCalculator — weekly pay under federal or California overtime rules. */
import { useState } from 'react';
import { overtimePay, type OvertimeRule } from '../../lib/wage';
import { formatMoney } from '../../lib/tax-engine';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function OvertimeCalculator() {
  const [rate,setRate]=useState(25);
  const [mult,setMult]=useState(1.5);
  const [rule,setRule]=useState<OvertimeRule>('california');
  const [hours,setHours]=useState<Record<string,number>>({Mon:10,Tue:10,Wed:10,Thu:10,Fri:8,Sat:0,Sun:0});
  const [result,setResult]=useState<ReturnType<typeof overtimePay>|null>(null);
  const [stale,setStale]=useState(false);
  const num=(v:string)=>v===''?0:Math.max(0,Number(v)||0);
  const setH=(d:string,v:number)=>{setHours(h=>({...h,[d]:v}));if(result)setStale(true);};
  const ed=<T,>(f:(v:T)=>void)=>(v:T)=>{f(v);if(result)setStale(true);};
  const calc=()=>{setResult(overtimePay(DAYS.map(d=>({day:d,hours:hours[d]})),rate,mult,rule));setStale(false);};
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Hourly rate</label><input type="number" min={0} step={0.5} value={rate} onChange={e=>ed(setRate)(num(e.target.value))}/></div>
        <div className="form-group"><label>Overtime multiplier</label><input type="number" min={1} step={0.5} value={mult} onChange={e=>ed(setMult)(num(e.target.value))}/></div>
        <div className="form-group"><label>Overtime rule</label><select value={rule} onChange={e=>ed(setRule)(e.target.value as OvertimeRule)}><option value="federal">Federal — over 40 a week</option><option value="california">California — over 8 a day or 40 a week</option></select></div>
      </div>
      <p className="section-label">Hours each day</p>
      <div className="calc-grid">
        {DAYS.map(d=><div className="form-group" key={d}><label>{d}</label><input type="number" min={0} max={24} step={0.5} value={hours[d]} onChange={e=>setH(d,num(e.target.value))}/></div>)}
      </div>
      <div className="calc-actions"><button type="button" className="btn-calculate" onClick={calc}>{result?'Recalculate':'Calculate pay'}</button>{stale&&<span className="stale-note">Inputs changed — press Recalculate</span>}</div>
      {result===null ? <div className="results-placeholder"><p>Enter your hours and press Calculate.</p></div> : (
        <div className={stale?'results-box is-stale':'results-box'}>
          <h3>This week's gross pay</h3>
          <div className="result-line"><span>Regular hours</span><span className="num">{result.regularHours}</span></div>
          <div className="result-line"><span>Overtime hours</span><span className="num">{result.overtimeHours}</span></div>
          <div className="result-line"><span>Regular pay</span><span className="num">{formatMoney(result.regularPay)}</span></div>
          <div className="result-line"><span>Overtime pay</span><span className="num">{formatMoney(result.overtimePay)}</span></div>
          <div className="result-line total"><span>Total gross this week</span><span className="num">{formatMoney(result.totalPay)}</span></div>
          <div className="result-line"><span>Blended hourly</span><span className="num">{formatMoney(result.effectiveHourly)}/hr</span></div>
          <p className="results-note">Gross pay before tax. State overtime rules vary — this covers the two most common. Not legal advice.</p>
        </div>
      )}
    </div>
  );
}
