/** HourlySalaryConverter — hourly wage to annual/monthly/weekly, and back. */
import { useState } from 'react';
import { hourlyToSalary, salaryToHourly } from '../../lib/wage';
import { formatMoney } from '../../lib/tax-engine';

export default function HourlySalaryConverter({ direction = 'toSalary' }: { direction?: 'toSalary' | 'toHourly' }) {
  const [mode,setMode]=useState(direction);
  const [rate,setRate]=useState(30);
  const [hours,setHours]=useState(40);
  const [weeks,setWeeks]=useState(52);
  const [otHours,setOtHours]=useState(0);
  const [unpaid,setUnpaid]=useState(0);
  const [salary,setSalary]=useState(62400);
  const [result,setResult]=useState<ReturnType<typeof hourlyToSalary>|null>(null);
  const [hourly,setHourly]=useState<number|null>(null);
  const [stale,setStale]=useState(false);
  const num=(v:string)=>v===''?0:Math.max(0,Number(v)||0);
  const ed=<T,>(f:(v:T)=>void)=>(v:T)=>{f(v);if(result||hourly!==null)setStale(true);};
  const calc=()=>{
    if(mode==='toSalary'){setResult(hourlyToSalary(rate,hours,weeks,1.5,otHours,unpaid));setHourly(null);}
    else{setHourly(salaryToHourly(salary,hours,weeks));setResult(null);}
    setStale(false);
  };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Convert</label><select value={mode} onChange={e=>ed(setMode)(e.target.value as 'toSalary'|'toHourly')}><option value="toSalary">Hourly to salary</option><option value="toHourly">Salary to hourly</option></select></div>
        {mode==='toSalary' ? <>
          <div className="form-group"><label>Hourly rate</label><input type="number" min={0} step={0.5} value={rate} onChange={e=>ed(setRate)(num(e.target.value))}/></div>
          <div className="form-group"><label>Hours a week</label><input type="number" min={0} max={168} value={hours} onChange={e=>ed(setHours)(num(e.target.value))}/></div>
          <div className="form-group"><label>Weeks a year</label><input type="number" min={1} max={52} value={weeks} onChange={e=>ed(setWeeks)(num(e.target.value))}/></div>
          <div className="form-group"><label>Overtime hours a week</label><input type="number" min={0} value={otHours} onChange={e=>ed(setOtHours)(num(e.target.value))}/></div>
          <div className="form-group"><label>Unpaid weeks off</label><input type="number" min={0} max={52} value={unpaid} onChange={e=>ed(setUnpaid)(num(e.target.value))}/></div>
        </> : <>
          <div className="form-group"><label>Annual salary</label><input type="number" min={0} value={salary} onChange={e=>ed(setSalary)(num(e.target.value))}/></div>
          <div className="form-group"><label>Hours a week</label><input type="number" min={0} max={168} value={hours} onChange={e=>ed(setHours)(num(e.target.value))}/></div>
          <div className="form-group"><label>Weeks a year</label><input type="number" min={1} max={52} value={weeks} onChange={e=>ed(setWeeks)(num(e.target.value))}/></div>
        </>}
      </div>
      <div className="calc-actions"><button type="button" className="btn-calculate" onClick={calc}>{result||hourly!==null?'Recalculate':'Convert'}</button>{stale&&<span className="stale-note">Inputs changed — press Recalculate</span>}</div>
      {result===null && hourly===null ? <div className="results-placeholder"><p>Enter your figures and press Convert.</p></div> :
        result ? (
        <div className={stale?'results-box is-stale':'results-box'}>
          <h3>{formatMoney(rate)}/hour is</h3>
          <div className="result-line total"><span>Per year</span><span className="num">{formatMoney(result.annual)}</span></div>
          <div className="result-line"><span>Per month</span><span className="num">{formatMoney(result.monthly)}</span></div>
          <div className="result-line"><span>Every two weeks</span><span className="num">{formatMoney(result.biweekly)}</span></div>
          <div className="result-line"><span>Per week</span><span className="num">{formatMoney(result.weekly)}</span></div>
          {otHours>0 && <div className="result-line"><span>Blended hourly with overtime</span><span className="num">{formatMoney(result.effectiveHourly)}/hr</span></div>}
          <p className="results-note">Gross, before tax. For take-home, use the <a href="/paycheck-calculator/">paycheck calculator</a>.</p>
        </div>
      ) : (
        <div className={stale?'results-box is-stale':'results-box'}>
          <h3>{formatMoney(salary)} a year is</h3>
          <div className="result-line total"><span>Per hour</span><span className="num">{formatMoney(hourly!)}/hr</span></div>
          <p className="results-note">At {hours} hours a week over {weeks} weeks. Gross, before tax.</p>
        </div>
      )}
    </div>
  );
}
