/**
 * PaycheckCalculator — interactive W-2 take-home island. Presets to a state.
 * Uses the same ported engine as the static worked examples, so the number the
 * user sees matches the prose.
 */
import { useMemo, useState } from 'react';
import { paycheckEstimate } from '../../lib/paycheck';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

interface Props {
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

export default function PaycheckCalculator({ presetState = 'CA', defaultGross = 75000, stateBaseUrl }: Props) {
  const [gross, setGross] = useState(defaultGross);
  const [status, setStatus] = useState<string>('single');
  const [stateCode, setStateCode] = useState(presetState);

  const r = useMemo(() => paycheckEstimate(gross, stateCode, status), [gross, stateCode, status]);
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const onStateChange = (code: string) => {
    if (stateBaseUrl) window.location.href = `${stateBaseUrl}/${code.toLowerCase()}/`;
    else setStateCode(code);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group">
          <label htmlFor="gross">Annual gross wage</label>
          <input id="gross" type="number" min={0} value={gross} onChange={(e) => setGross(num(e.target.value))} />
        </div>
        <div className="form-group">
          <label htmlFor="status">Filing status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="state">State</label>
          <select id="state" value={stateCode} onChange={(e) => onStateChange(e.target.value)}>
            {stateOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>
      </div>

      <div className="results-box">
        <h3>Estimated take-home (2026)</h3>
        <Line label="Federal income tax" value={formatMoney(r.federalTax)} />
        <Line label="FICA (Social Security + Medicare, employee)" value={formatMoney(r.fica)} />
        <Line label="State income tax" value={formatMoney(r.stateTax)} />
        <Line label="Total tax" value={formatMoney(r.totalTax)} total />
        <Line label="Effective rate" value={formatPct(r.effectiveRate)} />
        <Line label="Annual take-home" value={formatMoney(r.takeHome)} total />
        <p className="results-note">Estimate. Assumes the standard deduction, no pre-tax deductions or credits. Not tax advice.</p>
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
