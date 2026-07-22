/**
 * QuickEstimator — the interactive 1099 / self-employment estimate island.
 * Imports the ported tax engine and computes a real 2026 estimate client-side.
 * Styled with the MoneyScope brand classes from src/styles/global.css.
 *
 * Two deliberate behaviours:
 *  - Results stay hidden until Calculate is pressed, and are marked stale when
 *    an input changes afterwards, so it is never ambiguous whether the number
 *    on screen reflects what is in the form.
 *  - Changing State navigates to that state's own page when `stateHrefBase` is
 *    set (hub and homepage), so the URL always names the state being estimated
 *    and the visitor lands on the page with that state's rules and FAQs.
 */
import { useState } from 'react';
import { calcCombined, formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';
import { stateSlug } from '../../lib/slug';

interface Props {
  /**
   * Two-letter state code to preset to. Omit on a hub or the homepage: the
   * select then reads "Select your state" and the estimate is federal-only
   * until one is picked. Defaulting to a state the URL does not name told the
   * visitor they were looking at California when the page said otherwise.
   */
  presetState?: string;
  defaultSeIncome?: number;
  defaultW2Income?: number;
  /**
   * Path prefix for per-state pages, e.g. "/1099-tax-calculator/". When set,
   * picking a state navigates there. Omit to keep the select inert.
   */
  stateHrefBase?: string;
}

const STATUSES = [
  ['single', 'Single'],
  ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'],
  ['mfs', 'Married filing separately'],
] as const;

const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

type Result = ReturnType<typeof calcCombined>;

export default function QuickEstimator({
  presetState = '',
  defaultSeIncome = 40000,
  defaultW2Income = 0,
  stateHrefBase,
}: Props) {
  const [seIncome, setSeIncome] = useState(defaultSeIncome);
  const [seDeductions, setSeDeductions] = useState(0);
  const [w2Income, setW2Income] = useState(defaultW2Income);
  const [status, setStatus] = useState<string>('single');
  const stateCode = presetState;

  // With no state chosen the engine returns zero state tax, which is what the
  // results table then labels honestly rather than passing off as an answer.
  const compute = (): Result => calcCombined(w2Income, seIncome, seDeductions, status, stateCode);

  const [result, setResult] = useState<Result | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));

  /** Any edit invalidates a shown result until Calculate is pressed again. */
  const edited = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    if (result) setStale(true);
  };

  const calculate = () => {
    setResult(compute());
    setStale(false);
  };

  const goToState = (code: string) => {
    if (!stateHrefBase || code === stateCode) return;
    const name = states[code]?.name;
    if (name) window.location.href = `${stateHrefBase}${stateSlug(name)}/`;
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group">
          <label htmlFor="state">State</label>
          <select
            id="state"
            value={stateCode}
            onChange={(e) => goToState(e.target.value)}
            disabled={!stateHrefBase}
          >
            {!stateCode && <option value="">Select your state…</option>}
            {stateOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          {stateHrefBase && <p className="field-note">Switching state opens that state's page.</p>}
        </div>
        <div className="form-group">
          <label htmlFor="se">Self-employment / 1099 income</label>
          <input id="se" type="number" min={0} value={seIncome} onChange={(e) => edited(setSeIncome)(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="ded">Business deductions</label>
          <input id="ded" type="number" min={0} value={seDeductions} onChange={(e) => edited(setSeDeductions)(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="w2">W-2 wages (if any)</label>
          <input id="w2" type="number" min={0} value={w2Income} onChange={(e) => edited(setW2Income)(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="status">Filing status</label>
          <select id="status" value={status} onChange={(e) => edited(setStatus)(e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calculate}>
          {result ? 'Recalculate' : 'Calculate'}
        </button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>

      <div>
        {result === null ? (
          <div className="results-placeholder">
            <p>Enter your numbers and press Calculate to see your 2026 estimate.</p>
          </div>
        ) : (
          <div className={stale ? 'results-box is-stale' : 'results-box'}>
            <h3>Your 2026 estimate{stateCode ? ` — ${states[stateCode]?.name}` : ''}</h3>

            {w2Income > 0 && <Line label="W-2 wages" value={formatMoney(result.w2Income)} />}
            <Line label="Self-employment income" value={formatMoney(seIncome)} />
            {seDeductions > 0 && <Line label="Business deductions" value={`− ${formatMoney(seDeductions)}`} />}
            {seDeductions > 0 && <Line label="Net self-employment profit" value={formatMoney(result.netSE)} />}
            {w2Income > 0 && <Line label="Total income" value={formatMoney(result.totalIncome)} total />}

            <Line label="Deductible half of self-employment tax" value={`− ${formatMoney(result.totalIncome - result.agi)}`} />
            <Line label="Adjusted gross income" value={formatMoney(result.agi)} />
            <Line label="Standard deduction" value={`− ${formatMoney(result.agi - result.taxableBeforeQBI)}`} />
            {result.qbi > 0 && <Line label="QBI deduction (20% of qualified profit)" value={`− ${formatMoney(result.qbi)}`} />}
            <Line label="Taxable income" value={formatMoney(result.taxable)} total />

            <Line label="Self-employment tax (15.3% × 92.35%)" value={formatMoney(result.seTax)} />
            <Line label="Federal income tax" value={formatMoney(result.fedTax)} />
            <Line
              label={stateCode ? `${states[stateCode]?.name} income tax` : 'State income tax'}
              value={stateCode ? formatMoney(result.stateTax) : 'select a state'}
            />
            <Line label="Total tax" value={formatMoney(result.totalTax)} total />
            <Line label="Effective rate on total income" value={formatPct(result.effectiveRate)} />
            <Line label="After tax" value={formatMoney(result.afterTax)} total />

            {w2Income > 0 && (
              <p className="results-note">
                Your W-2 wages are in the total because they decide which brackets the 1099 profit
                lands in — the side income stacks on top of the day job, not beside it. Tax already
                withheld from those wages is not deducted here, so the total is the whole year's
                liability, not what is left to pay.
              </p>
            )}
            <p className="results-note">
              {stateCode
                ? 'Estimate only. Assumes the standard deduction and no credits. Not tax advice.'
                : 'Federal and self-employment tax only until you pick a state. Not tax advice.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Line({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return (
    <div className={total ? 'result-line total' : 'result-line'}>
      <span>{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}
