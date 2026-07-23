/** RaiseCalculator — old vs new comp, percentage change, and vs inflation. */
import { useState } from 'react';
import { raise } from '../../lib/wage';
import { formatMoney } from '../../lib/tax-engine';

export default function RaiseCalculator() {
  const [oldS,setOldS]=useState(60000);
  const [newS,setNewS]=useState(68000);
  const [inflation,setInflation]=useState(3);
  const [result,setResult]=useState<ReturnType<typeof raise>|null>(null);
  const [stale,setStale]=useState(false);
  const num=(v:string)=>v===''?0:Math.max(0,Number(v)||0);
  const ed=<T,>(f:(v:T)=>void)=>(v:T)=>{f(v);if(result)setStale(true);};
  const calc=()=>{setResult(raise(oldS,newS,inflation));setStale(false);};
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Old salary</label><input type="number" min={0} value={oldS} onChange={e=>ed(setOldS)(num(e.target.value))}/></div>
        <div className="form-group"><label>New salary</label><input type="number" min={0} value={newS} onChange={e=>ed(setNewS)(num(e.target.value))}/></div>
        <div className="form-group"><label>Inflation rate (%)</label><input type="number" min={0} step={0.1} value={inflation} onChange={e=>ed(setInflation)(num(e.target.value))}/></div>
      </div>
      <div className="calc-actions"><button type="button" className="btn-calculate" onClick={calc}>{result?'Recalculate':'Calculate change'}</button>{stale&&<span className="stale-note">Inputs changed — press Recalculate</span>}</div>
      {result===null ? <div className="results-placeholder"><p>Enter your old and new salary, then Calculate.</p></div> : (
        <div className={stale?'results-box is-stale':'results-box'}>
          <h3>{result.isRaise?'Your raise':'Your pay cut'}</h3>
          <div className="result-line total"><span>{result.isRaise?'Raise':'Cut'}</span><span className="num">{result.isRaise?'+':''}{result.percentChange.toFixed(2)}%</span></div>
          <div className="result-line"><span>Dollar change</span><span className="num">{result.dollarChange>=0?'+':''}{formatMoney(result.dollarChange)}</span></div>
          <div className="result-line"><span>To keep pace with {inflation}% inflation</span><span className="num">{formatMoney(result.inflationTarget)}</span></div>
          <div className="result-line total"><span>{result.vsInflation>=0?'Ahead of inflation by':'Behind inflation by'}</span><span className="num">{formatMoney(Math.abs(result.vsInflation))}</span></div>
          <p className="results-note">Gross comparison. For the take-home difference, run each salary through the <a href="/paycheck-calculator/">paycheck calculator</a>.</p>
        </div>
      )}
    </div>
  );
}
