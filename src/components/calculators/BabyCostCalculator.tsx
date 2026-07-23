/** BabyCostCalculator — the true first-year cost of a baby, lost income and all. */
import { useState } from 'react';
import { babyFirstYear } from '../../lib/lifestyle';
import { formatMoney } from '../../lib/tax-engine';

export default function BabyCostCalculator() {
  const [delivery, setDelivery] = useState(5000);
  const [prenatal, setPrenatal] = useState(2000);
  const [gear, setGear] = useState(3000);
  const [diapersMonthly, setDiapers] = useState(80);
  const [formulaMonthly, setFormula] = useState(150);
  const [childcareMonthly, setChildcare] = useState(1200);
  const [otherMonthly, setOther] = useState(100);
  const [salary, setSalary] = useState(60000);
  const [monthsOut, setMonths] = useState(3);
  const [result, setResult] = useState<ReturnType<typeof babyFirstYear> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(babyFirstYear({ delivery, prenatal, gear, diapersMonthly, formulaMonthly, childcareMonthly, otherMonthly, salary, salaryReducedPct: 1, monthsOut, investmentReturn: 0.07 })); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Delivery (out of pocket)</label><input type="number" min={0} value={delivery} onChange={(e) => ed(setDelivery)(num(e.target.value))} /><p className="field-note">After insurance.</p></div>
        <div className="form-group"><label>Prenatal care</label><input type="number" min={0} value={prenatal} onChange={(e) => ed(setPrenatal)(num(e.target.value))} /></div>
        <div className="form-group"><label>Gear (crib, stroller, car seat)</label><input type="number" min={0} value={gear} onChange={(e) => ed(setGear)(num(e.target.value))} /></div>
        <div className="form-group"><label>Diapers &amp; wipes ($/mo)</label><input type="number" min={0} value={diapersMonthly} onChange={(e) => ed(setDiapers)(num(e.target.value))} /></div>
        <div className="form-group"><label>Formula &amp; food ($/mo)</label><input type="number" min={0} value={formulaMonthly} onChange={(e) => ed(setFormula)(num(e.target.value))} /></div>
        <div className="form-group"><label>Childcare ($/mo)</label><input type="number" min={0} value={childcareMonthly} onChange={(e) => ed(setChildcare)(num(e.target.value))} /></div>
        <div className="form-group"><label>Everything else ($/mo)</label><input type="number" min={0} value={otherMonthly} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>Salary of the parent taking leave</label><input type="number" min={0} value={salary} onChange={(e) => ed(setSalary)(num(e.target.value))} /></div>
        <div className="form-group"><label>Unpaid months off</label><input type="number" min={0} value={monthsOut} onChange={(e) => ed(setMonths)(num(e.target.value))} /><p className="field-note">Leave not covered by pay.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'True first-year cost'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Adjust the amounts to match your situation.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>First-year cost of a baby</h3>
          <div className="result-line"><span>One-off costs (delivery, gear)</span><span className="num">{formatMoney(result.oneOff)}</span></div>
          <div className="result-line"><span>A year of recurring costs</span><span className="num">{formatMoney(result.annualized)}</span></div>
          <div className="result-line"><span>Lost income (unpaid leave)</span><span className="num">{formatMoney(result.lostIncome)}</span></div>
          <div className="result-line total"><span>Total first-year cost</span><span className="num">{formatMoney(result.totalFirstYear)}</span></div>
          <div className="result-line"><span>What it'd grow to in 10 years (at 7%)</span><span className="num">{formatMoney(result.totalFirstYear + result.opportunityCost10yr)}</span></div>
          <p className="results-note">
            The number people miss is lost income — unpaid leave is a real cost, and often the biggest line. Childcare
            is the other one that dwarfs diapers. The 10-year figure shows the opportunity cost, not a bill. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
