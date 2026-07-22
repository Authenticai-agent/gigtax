/**
 * PaycheckCalculator — interactive W-2 take-home island. Presets to a state.
 * Uses the same ported engine as the static worked examples, so the number the
 * user sees matches the prose.
 */
import { useState } from 'react';
import { paycheckEstimate } from '../../lib/paycheck';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';
import { stateSlug } from '../../lib/slug';

interface Props {
  /** Omit on the hub: the select then reads "Select your state" rather than
   *  quietly answering for California while the URL says otherwise. */
  presetState?: string;
  defaultGross?: number;
  /** If set, changing state navigates to that state's page under this base. */
  stateBaseUrl?: string;
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

export default function PaycheckCalculator({ presetState = '', defaultGross = 75000, stateBaseUrl }: Props) {
  const [gross, setGross] = useState(defaultGross);
  const [preTax, setPreTax] = useState(0);
  const [status, setStatus] = useState<string>('single');
  const [stateCode, setStateCode] = useState(presetState);

  // Results wait for an explicit Calculate press and go stale on any edit —
  // same contract as QuickEstimator, so the two islands behave identically.
  const [result, setResult] = useState<ReturnType<typeof paycheckEstimate> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));

  const edited = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    if (result) setStale(true);
  };

  const calculate = () => {
    setResult(paycheckEstimate(gross, stateCode, status, preTax));
    setStale(false);
  };

  const onStateChange = (code: string) => {
    const name = states[code]?.name;
    if (stateBaseUrl && name) window.location.href = `${stateBaseUrl}/${stateSlug(name)}/`;
    else setStateCode(code);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group">
          <label htmlFor="state">State</label>
          <select id="state" value={stateCode} onChange={(e) => onStateChange(e.target.value)}>
            {!stateCode && <option value="">Select your state…</option>}
            {stateOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          {stateBaseUrl && <p className="field-note">Switching state opens that state's page.</p>}
        </div>
        <div className="form-group">
          <label htmlFor="gross">Annual gross wage</label>
          <input id="gross" type="number" min={0} value={gross} onChange={(e) => edited(setGross)(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="pretax">401(k), HSA and other pre-tax deductions</label>
          <input id="pretax" type="number" min={0} value={preTax} onChange={(e) => edited(setPreTax)(num(e.target.value))} />
          <p className="field-note">Lowers income tax, but not FICA.</p>
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

      {result === null ? (
        <div className="results-placeholder">
          <p>Enter your gross wage and press Calculate to see your take-home.</p>
        </div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Estimated take-home (2026){stateCode ? ` — ${states[stateCode]?.name}` : ''}</h3>

          <Line label="Annual gross wage" value={formatMoney(result.gross)} />
          {result.preTax > 0 && <Line label="Pre-tax deductions (401k, HSA)" value={`− ${formatMoney(result.preTax)}`} />}
          <Line label="Standard deduction" value={`− ${formatMoney(result.standardDeduction)}`} />
          <Line label="Taxable income" value={formatMoney(result.taxableIncome)} total />

          <Line label="Federal income tax" value={`− ${formatMoney(result.federalTax)}`} />
          <Line label="FICA (Social Security + Medicare, employee half)" value={`− ${formatMoney(result.fica)}`} />
          <Line
            label={stateCode ? `${states[stateCode]?.name} income tax` : 'State income tax'}
            value={stateCode ? `− ${formatMoney(result.stateTax)}` : 'select a state'}
          />
          {result.sdi && !result.sdi.unmodelled && (
            <Line label={result.sdi.label} value={`− ${formatMoney(result.sdi.amount!)}`} />
          )}
          <Line label="Total coming out" value={formatMoney(result.totalTax)} total />
          <Line label="Annual take-home" value={formatMoney(result.takeHome)} total />
          <Line label="Effective rate on gross" value={formatPct(result.effectiveRate)} />

          {result.sdi?.unmodelled && (
            <p className="results-note">
              {states[stateCode]?.name} also requires disability coverage, but the premium varies by
              employer plan rather than being a fixed statutory rate, so it is not in the figures above.
              Your actual take-home will be slightly lower. {result.sdi.note}
            </p>
          )}
          <p className="results-note">
            {stateCode
              ? 'Estimate. No credits, and no employer benefit deductions beyond what you entered. Not tax advice.'
              : 'Federal tax and FICA only until you pick a state. Not tax advice.'}
          </p>
        </div>
      )}
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
