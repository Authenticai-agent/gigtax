/**
 * ACASubsidyCalculator — premium tax credit, ported from acaCalculatorView onto
 * the existing calcACASubsidy engine. Premium figures are monthly, matching how
 * the engine computes the expected contribution.
 */
import { useState } from 'react';
import { calcACASubsidy, formatMoney } from '../../lib/tax-engine';

export default function ACASubsidyCalculator() {
  const [magi, setMagi] = useState(40000);
  const [household, setHousehold] = useState(2);
  const [premium, setPremium] = useState(1000);
  const [result, setResult] = useState<ReturnType<typeof calcACASubsidy> | null>(null);
  const [stale, setStale] = useState(false);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(calcACASubsidy(magi, household, premium)); setStale(false); };
  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Household MAGI (annual)</label>
          <input type="number" min={0} value={magi} onChange={(e) => ed(setMagi)(num(e.target.value))} /></div>
        <div className="form-group"><label>Household size</label>
          <input type="number" min={1} max={12} value={household} onChange={(e) => ed(setHousehold)(Math.max(1, num(e.target.value)))} /></div>
        <div className="form-group"><label>Benchmark plan premium (monthly)</label>
          <input type="number" min={0} value={premium} onChange={(e) => ed(setPremium)(num(e.target.value))} />
          <p className="field-note">The second-lowest-cost silver plan for your household, from HealthCare.gov.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Estimate my subsidy'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (
        <div className="results-placeholder"><p>Enter your income, household and benchmark premium.</p></div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Your 2026 premium tax credit</h3>
          <div className="result-line"><span>Income as a percent of the poverty line</span><span className="num">{Math.round(result.fplPct * 100)}%</span></div>
          {result.eligible ? (
            <>
              <div className="result-line total"><span>Monthly subsidy</span><span className="num">{formatMoney(result.subsidy)}</span></div>
              <div className="result-line"><span>What you'd pay for the benchmark plan</span><span className="num">{formatMoney(result.maxPremium)}/mo</span></div>
              {result.cliffRisk && (
                <p className="results-note" data-review="legal">
                  You are close to the 400% poverty-line cliff. In 2026 the enhanced subsidies expired, so earning
                  even $1 over 400% of the poverty line drops your subsidy to zero — a small raise can cost you
                  thousands. Manage income near this line carefully.
                </p>
              )}
            </>
          ) : (
            <p className="results-note" data-review="legal">
              At {Math.round(result.fplPct * 100)}% of the poverty line you are over the 400% cap, so no premium
              tax credit is available for 2026 — the enhanced subsidies that removed this cliff expired at the end
              of 2025. You would pay the full benchmark premium.
            </p>
          )}
          <p className="results-note">
            Estimate for the 2026 tax year. Your actual credit uses the benchmark premium for your exact plan and
            area from HealthCare.gov or your state exchange. Not tax or health-coverage advice.
          </p>
        </div>
      )}
    </div>
  );
}
