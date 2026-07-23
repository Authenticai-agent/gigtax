/** EstimatedPenaltyCalculator — Form 2210 underpayment penalty, quarter by quarter. */
import { useState } from 'react';
import { estimatedTaxPenalty } from '../../lib/estimated-penalty';
import { formatMoney } from '../../lib/tax-engine';

export default function EstimatedPenaltyCalculator() {
  const [currentYearTax, setCurrent] = useState(20000);
  const [priorYearTax, setPrior] = useState(18000);
  const [priorYearAGI, setAGI] = useState(120000);
  const [withholding, setWithholding] = useState(0);
  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState(0);
  const [q3, setQ3] = useState(0);
  const [q4, setQ4] = useState(0);
  const [irsRate, setRate] = useState(8);
  const [result, setResult] = useState<ReturnType<typeof estimatedTaxPenalty> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    setResult(estimatedTaxPenalty({ currentYearTax, priorYearTax, priorYearAGI, withholding, q1, q2, q3, q4, irsRate: irsRate / 100 }));
    setStale(false);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Total 2026 tax liability</label><input type="number" min={0} value={currentYearTax} onChange={(e) => ed(setCurrent)(num(e.target.value))} /></div>
        <div className="form-group"><label>Total 2025 tax liability</label><input type="number" min={0} value={priorYearTax} onChange={(e) => ed(setPrior)(num(e.target.value))} /><p className="field-note">The prior-year safe harbor.</p></div>
        <div className="form-group"><label>2025 AGI</label><input type="number" min={0} value={priorYearAGI} onChange={(e) => ed(setAGI)(num(e.target.value))} /><p className="field-note">Over $150k raises the prior-year test to 110%.</p></div>
        <div className="form-group"><label>Total withholding (W-2, 1099)</label><input type="number" min={0} value={withholding} onChange={(e) => ed(setWithholding)(num(e.target.value))} /><p className="field-note">Treated as paid evenly across the year.</p></div>
        <div className="form-group"><label>Q1 estimated payment</label><input type="number" min={0} value={q1} onChange={(e) => ed(setQ1)(num(e.target.value))} /></div>
        <div className="form-group"><label>Q2 estimated payment</label><input type="number" min={0} value={q2} onChange={(e) => ed(setQ2)(num(e.target.value))} /></div>
        <div className="form-group"><label>Q3 estimated payment</label><input type="number" min={0} value={q3} onChange={(e) => ed(setQ3)(num(e.target.value))} /></div>
        <div className="form-group"><label>Q4 estimated payment</label><input type="number" min={0} value={q4} onChange={(e) => ed(setQ4)(num(e.target.value))} /></div>
        <div className="form-group"><label>IRS underpayment rate (%)</label><input type="number" min={0} step={0.5} value={irsRate} onChange={(e) => ed(setRate)(num(e.target.value))} /><p className="field-note">Published quarterly by the IRS (short-term rate + 3%).</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate penalty'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your tax and what you paid to estimate the penalty.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>{result.safe ? 'No penalty — you met the safe harbor' : 'Underpayment penalty'}</h3>
          <div className="result-line"><span>Safe-harbor amount (the target)</span><span className="num">{formatMoney(result.safeHarbor)}</span></div>
          <div className="result-line"><span>90% of this year's tax</span><span className="num">{formatMoney(result.requiredCurrent)}</span></div>
          <div className="result-line"><span>{result.priorPct}% of last year's tax</span><span className="num">{formatMoney(result.requiredPrior)}</span></div>
          <div className="result-line"><span>Total paid (withholding + estimates)</span><span className="num">{formatMoney(result.totalPaid)}</span></div>
          <div className="result-line"><span>Total underpayment</span><span className="num">{formatMoney(result.totalUnderpayment)}</span></div>
          {result.quarters.map((q) => (
            <div className="result-line" key={q.quarter}><span>Q{q.quarter}: short {formatMoney(q.underpayment)}</span><span className="num">{formatMoney(q.penalty)}</span></div>
          ))}
          <div className="result-line total"><span>Estimated penalty</span><span className="num">{formatMoney(result.totalPenalty)}</span></div>
          <p className="results-note">
            Simplified Form 2210 method: each quarter needs a cumulative 25% of the safe-harbor amount, and any shortfall
            accrues at the IRS underpayment rate for about a quarter. The real form uses exact dates and daily compounding,
            and the annualized-income method (Schedule AI) can cut the penalty if your income was uneven. Not tax advice.
          </p>
        </div>
      )}
    </div>
  );
}
