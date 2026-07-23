/** NetWorthCalculator — assets minus liabilities, against the Fed median for your age. */
import { useState } from 'react';
import { netWorth } from '../../lib/personal-finance';
import { formatMoney } from '../../lib/tax-engine';

export default function NetWorthCalculator() {
  const [cash, setCash] = useState(15000);
  const [investments, setInv] = useState(60000);
  const [homeValue, setHome] = useState(350000);
  const [vehicles, setVeh] = useState(20000);
  const [otherAssets, setOther] = useState(5000);
  const [mortgage, setMort] = useState(280000);
  const [studentLoans, setStudent] = useState(25000);
  const [carLoans, setCar] = useState(12000);
  const [creditCards, setCC] = useState(4000);
  const [otherDebt, setOD] = useState(0);
  const [age, setAge] = useState(35);
  const [result, setResult] = useState<ReturnType<typeof netWorth> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(netWorth({ cash, investments, homeValue, vehicles, otherAssets, mortgage, studentLoans, carLoans, creditCards, otherDebt, age })); setStale(false); };

  return (
    <div className="calc-panel">
      <p className="section-label">What you own</p>
      <div className="calc-grid">
        <div className="form-group"><label>Cash & savings</label><input type="number" min={0} value={cash} onChange={(e) => ed(setCash)(num(e.target.value))} /></div>
        <div className="form-group"><label>Investments & retirement</label><input type="number" min={0} value={investments} onChange={(e) => ed(setInv)(num(e.target.value))} /></div>
        <div className="form-group"><label>Home value</label><input type="number" min={0} value={homeValue} onChange={(e) => ed(setHome)(num(e.target.value))} /></div>
        <div className="form-group"><label>Vehicles</label><input type="number" min={0} value={vehicles} onChange={(e) => ed(setVeh)(num(e.target.value))} /></div>
        <div className="form-group"><label>Other assets</label><input type="number" min={0} value={otherAssets} onChange={(e) => ed(setOther)(num(e.target.value))} /></div>
        <div className="form-group"><label>Your age</label><input type="number" min={0} value={age} onChange={(e) => ed(setAge)(num(e.target.value))} /></div>
      </div>
      <p className="section-label">What you owe</p>
      <div className="calc-grid">
        <div className="form-group"><label>Mortgage</label><input type="number" min={0} value={mortgage} onChange={(e) => ed(setMort)(num(e.target.value))} /></div>
        <div className="form-group"><label>Student loans</label><input type="number" min={0} value={studentLoans} onChange={(e) => ed(setStudent)(num(e.target.value))} /></div>
        <div className="form-group"><label>Car loans</label><input type="number" min={0} value={carLoans} onChange={(e) => ed(setCar)(num(e.target.value))} /></div>
        <div className="form-group"><label>Credit cards</label><input type="number" min={0} value={creditCards} onChange={(e) => ed(setCC)(num(e.target.value))} /></div>
        <div className="form-group"><label>Other debt</label><input type="number" min={0} value={otherDebt} onChange={(e) => ed(setOD)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate net worth'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Add up what you own and owe.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your net worth</h3>
          <div className="result-line"><span>Total assets</span><span className="num">{formatMoney(result.totalAssets)}</span></div>
          <div className="result-line"><span>Total liabilities</span><span className="num">−{formatMoney(result.totalLiabilities)}</span></div>
          <div className="result-line total"><span>Net worth</span><span className="num">{formatMoney(result.netWorth)}</span></div>
          <div className="result-line"><span>Federal Reserve median, age {result.benchmarkLabel}</span><span className="num">{formatMoney(result.benchmarkMedian)}</span></div>
          <div className="result-line"><span>You vs the median</span><span className="num">{result.vsMedian >= 0 ? '+' : ''}{formatMoney(result.vsMedian)}</span></div>
          <p className="results-note">
            Net worth is everything you own minus everything you owe — income does not count. The median is a
            Federal Reserve reference point across all households, not a target: a 30-year-old with negative net
            worth from student loans is investing in future earnings, not falling behind. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
