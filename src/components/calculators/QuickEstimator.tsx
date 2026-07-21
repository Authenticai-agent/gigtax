/**
 * QuickEstimator — the Phase 1 scratch calculator island.
 *
 * Proves the pattern: a React island that imports the ported tax engine and
 * computes a real 2026 estimate client-side. It can be preset to a state
 * (Tier-2 pages) via props. Interactivity is the only thing JavaScript adds;
 * the surrounding page content is server-rendered and present without it.
 */
import { useMemo, useState } from 'react';
import { calcCombined, formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

interface Props {
  /** Two-letter state code to preset the estimate to (e.g. "OH"). */
  presetState?: string;
  defaultSeIncome?: number;
  defaultW2Income?: number;
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

export default function QuickEstimator({ presetState = 'CA', defaultSeIncome = 40000, defaultW2Income = 0 }: Props) {
  const [seIncome, setSeIncome] = useState(defaultSeIncome);
  const [seDeductions, setSeDeductions] = useState(0);
  const [w2Income, setW2Income] = useState(defaultW2Income);
  const [status, setStatus] = useState<string>('single');
  const [stateCode, setStateCode] = useState(presetState);

  const r = useMemo(
    () => calcCombined(w2Income, seIncome, seDeductions, status, stateCode),
    [w2Income, seIncome, seDeductions, status, stateCode],
  );

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));

  return (
    <div style={{ border: '1.5px solid rgba(15,14,12,.15)', borderRadius: 10, padding: '1.25rem', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'grid', gap: '.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <label style={{ display: 'grid', gap: 4, fontSize: '.85rem' }}>
          Self-employment / 1099 income
          <input type="number" min={0} value={seIncome} onChange={(e) => setSeIncome(num(e.target.value))} />
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: '.85rem' }}>
          Business deductions
          <input type="number" min={0} value={seDeductions} onChange={(e) => setSeDeductions(num(e.target.value))} />
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: '.85rem' }}>
          W-2 wages (if any)
          <input type="number" min={0} value={w2Income} onChange={(e) => setW2Income(num(e.target.value))} />
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: '.85rem' }}>
          Filing status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: '.85rem' }}>
          State
          <select value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
            {stateOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
      </div>

      <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse', fontSize: '.95rem' }}>
        <tbody>
          <Row label="Net self-employment income" value={formatMoney(r.netSE)} />
          <Row label="Self-employment tax (15.3% × 92.35%)" value={formatMoney(r.seTax)} />
          <Row label="Federal income tax" value={formatMoney(r.fedTax)} />
          <Row label="State income tax" value={formatMoney(r.stateTax)} />
          <Row label="Total tax" value={formatMoney(r.totalTax)} strong />
          <Row label="Effective rate" value={formatPct(r.effectiveRate)} />
          <Row label="After-tax income" value={formatMoney(r.afterTax)} strong />
        </tbody>
      </table>
      <p style={{ fontSize: '.75rem', color: '#6b6760', marginTop: '.75rem' }}>
        Estimate only. Assumes the standard deduction and no credits. Not tax advice.
      </p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(15,14,12,.1)' }}>
      <td style={{ padding: '.4rem 0' }}>{label}</td>
      <td style={{ padding: '.4rem 0', textAlign: 'right', fontWeight: strong ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{value}</td>
    </tr>
  );
}
