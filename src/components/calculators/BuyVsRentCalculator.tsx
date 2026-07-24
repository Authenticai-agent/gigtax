/** BuyVsRentCalculator — the break-even year where buying beats renting. */
import { useState } from 'react';
import { buyVsRent } from '../../lib/personal-finance';
import { formatMoney } from '../../lib/tax-engine';

export default function BuyVsRentCalculator() {
  const [homePrice, setPrice] = useState(400000);
  const [downPaymentPct, setDown] = useState(20);
  const [mortgageRate, setRate] = useState(6.5);
  const [monthlyRent, setRent] = useState(2200);
  const [homeAppreciation, setAppr] = useState(3);
  const [investmentReturn, setInv] = useState(7);
  const [years, setYears] = useState(10);
  const [result, setResult] = useState<ReturnType<typeof buyVsRent> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    setResult(buyVsRent({
      homePrice, downPaymentPct: downPaymentPct / 100, mortgageRate: mortgageRate / 100, termYears: 30,
      monthlyRent, homeAppreciation: homeAppreciation / 100, investmentReturn: investmentReturn / 100,
      propertyTaxPct: 0.011, maintenancePct: 0.01, rentInflation: 0.03, years,
    }));
    setStale(false);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Home price</label><input type="number" min={0} value={homePrice} onChange={(e) => ed(setPrice)(num(e.target.value))} /></div>
        <div className="form-group"><label>Down payment (%)</label><input type="number" min={0} value={downPaymentPct} onChange={(e) => ed(setDown)(num(e.target.value))} /></div>
        <div className="form-group"><label>Mortgage rate (%)</label><input type="number" min={0} step={0.1} value={mortgageRate} onChange={(e) => ed(setRate)(num(e.target.value))} /><p className="field-note">30-year fixed.</p></div>
        <div className="form-group"><label>Monthly rent (the alternative)</label><input type="number" min={0} value={monthlyRent} onChange={(e) => ed(setRent)(num(e.target.value))} /></div>
        <div className="form-group"><label>Home appreciation (%/yr)</label><input type="number" min={0} step={0.5} value={homeAppreciation} onChange={(e) => ed(setAppr)(num(e.target.value))} /></div>
        <div className="form-group"><label>Investment return (%/yr)</label><input type="number" min={0} step={0.5} value={investmentReturn} onChange={(e) => ed(setInv)(num(e.target.value))} /><p className="field-note">What a renter earns on the down payment.</p></div>
        <div className="form-group"><label>Years you'd stay</label><input type="number" min={1} value={years} onChange={(e) => ed(setYears)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Buy or rent?'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter a home price and the rent you'd pay instead.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.cheaperAtHorizon === 'buy' ? `Buying wins by year ${years}` : `Renting wins through year ${years}`}</h3>
          <div className="result-line"><span>Monthly mortgage payment (P&amp;I)</span><span className="num">{formatMoney(result.monthlyPayment)}</span></div>
          <div className="result-line"><span>Break-even year (buying beats renting)</span><span className="num">{result.breakEvenYear ? `year ${result.breakEvenYear}` : `beyond ${years}`}</span></div>
          <div className="result-line"><span>Net cost of buying over {years} years</span><span className="num">{formatMoney(result.buyCostAtHorizon)}</span></div>
          <div className="result-line total"><span>Net cost of renting over {years} years</span><span className="num">{formatMoney(result.rentCostAtHorizon)}</span></div>
          <p className="results-note">
            "Cost" is what each path consumes: for buying, all ownership outlays less the equity you'd recover on
            sale (after 6% selling costs); for renting, rent paid less the growth on the down payment invested
            instead. Buying wins once you stay past the break-even year. Monthly cash-flow differences are not
            reinvested here, and property tax and maintenance are assumed at 1.1% and 1% of value. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
