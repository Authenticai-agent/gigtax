/**
 * PaycheckCalculator — interactive W-2 take-home island. Presets to a state.
 * Uses the same ported engine as the static worked examples, so the number the
 * user sees matches the prose.
 *
 * Phase 7 added the inputs a real paycheck actually has: hourly as well as
 * salary, itemized pre-tax deductions (which fixed a FICA error — cafeteria
 * items are payroll-tax-exempt, a 401(k) is not), dependents wired to the child
 * tax credit, post-tax deductions, an output-frequency toggle so you can see a
 * weekly or monthly figure, the marginal bracket alongside the effective rate,
 * and an optional monthly-expenses line that turns take-home into surplus.
 */
import { useState } from 'react';
import {
  paycheckEstimate, annualFromHourly, PAY_FREQUENCIES, CONTRIBUTION_LIMITS,
  type PreTaxDeductions,
} from '../../lib/paycheck';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';
import { stateSlug } from '../../lib/slug';

interface Props {
  presetState?: string;
  defaultGross?: number;
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
  const [payType, setPayType] = useState<'salary' | 'hourly'>('salary');
  const [gross, setGross] = useState(defaultGross);
  const [hourlyRate, setHourlyRate] = useState(30);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  const [status, setStatus] = useState<string>('single');
  const [stateCode, setStateCode] = useState(presetState);
  const [dependents, setDependents] = useState(0);

  const [r401, setR401] = useState(0);
  const [hsa, setHsa] = useState(0);
  const [fsa, setFsa] = useState(0);
  const [healthPremium, setHealthPremium] = useState(0);
  const [postTax, setPostTax] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  const [outFreq, setOutFreq] = useState('annual');
  const [result, setResult] = useState<ReturnType<typeof paycheckEstimate> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const edited = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); if (result) setStale(true); };

  const grossAnnual = payType === 'hourly' ? annualFromHourly(hourlyRate, hoursPerWeek) : gross;

  const calculate = () => {
    const preTax: PreTaxDeductions = { retirement401k: r401, hsa, fsa, healthPremium };
    setResult(paycheckEstimate({ gross: grossAnnual, stateCode, status, preTax, dependents, postTax }));
    setStale(false);
  };

  const onStateChange = (code: string) => {
    const name = states[code]?.name;
    if (stateBaseUrl && name) window.location.href = `${stateBaseUrl}/${stateSlug(name)}/`;
    else edited(setStateCode)(code);
  };

  // Output frequency divides annual figures. Chosen for display only — every
  // computation stays annual so rounding never compounds across periods.
  const freq = PAY_FREQUENCIES.find((f) => f.key === outFreq)!;
  const per = (annual: number) => formatMoney(annual / freq.periods);
  const overLimit = r401 > CONTRIBUTION_LIMITS.retirement401k
    || hsa > CONTRIBUTION_LIMITS.hsaFamily;

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group">
          <label htmlFor="paytype">Paid by</label>
          <select id="paytype" value={payType} onChange={(e) => edited(setPayType)(e.target.value as 'salary' | 'hourly')}>
            <option value="salary">Salary</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>
        {payType === 'salary' ? (
          <div className="form-group">
            <label htmlFor="gross">Annual gross wage</label>
            <input id="gross" type="number" min={0} value={gross} onChange={(e) => edited(setGross)(num(e.target.value))} />
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="rate">Hourly rate</label>
              <input id="rate" type="number" min={0} step={0.5} value={hourlyRate} onChange={(e) => edited(setHourlyRate)(num(e.target.value))} />
            </div>
            <div className="form-group">
              <label htmlFor="hours">Hours a week</label>
              <input id="hours" type="number" min={0} max={168} value={hoursPerWeek} onChange={(e) => edited(setHoursPerWeek)(num(e.target.value))} />
              <p className="field-note">≈ {formatMoney(grossAnnual)} a year</p>
            </div>
          </>
        )}
        <div className="form-group">
          <label htmlFor="state">State</label>
          <select id="state" value={stateCode} onChange={(e) => onStateChange(e.target.value)}>
            {!stateCode && <option value="">Select your state…</option>}
            {stateOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          {stateBaseUrl && <p className="field-note">Switching state opens that state's page.</p>}
        </div>
        <div className="form-group">
          <label htmlFor="status">Filing status</label>
          <select id="status" value={status} onChange={(e) => edited(setStatus)(e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="deps">Children under 17</label>
          <input id="deps" type="number" min={0} max={20} value={dependents} onChange={(e) => edited(setDependents)(num(e.target.value))} />
          <p className="field-note">For the child tax credit.</p>
        </div>
      </div>

      <p className="section-label">Pre-tax deductions</p>
      <div className="calc-grid">
        <div className="form-group">
          <label htmlFor="r401">401(k) contribution</label>
          <input id="r401" type="number" min={0} value={r401} onChange={(e) => edited(setR401)(num(e.target.value))} />
          <p className="field-note">Cuts income tax, not FICA.</p>
        </div>
        <div className="form-group">
          <label htmlFor="hsa">HSA contribution</label>
          <input id="hsa" type="number" min={0} value={hsa} onChange={(e) => edited(setHsa)(num(e.target.value))} />
          <p className="field-note">Cuts income tax and FICA.</p>
        </div>
        <div className="form-group">
          <label htmlFor="fsa">FSA contribution</label>
          <input id="fsa" type="number" min={0} value={fsa} onChange={(e) => edited(setFsa)(num(e.target.value))} />
          <p className="field-note">Cuts income tax and FICA. Limit not checked here.</p>
        </div>
        <div className="form-group">
          <label htmlFor="premium">Health insurance premium</label>
          <input id="premium" type="number" min={0} value={healthPremium} onChange={(e) => edited(setHealthPremium)(num(e.target.value))} />
          <p className="field-note">Your share, if pre-tax.</p>
        </div>
      </div>

      <p className="section-label">After-tax and household</p>
      <div className="calc-grid">
        <div className="form-group">
          <label htmlFor="posttax">Other after-tax deductions</label>
          <input id="posttax" type="number" min={0} value={postTax} onChange={(e) => edited(setPostTax)(num(e.target.value))} />
          <p className="field-note">Union dues, garnishment, child support.</p>
        </div>
        <div className="form-group">
          <label htmlFor="expenses">Monthly fixed expenses</label>
          <input id="expenses" type="number" min={0} value={monthlyExpenses} onChange={(e) => edited(setMonthlyExpenses)(num(e.target.value))} />
          <p className="field-note">Optional — shows what is left over.</p>
        </div>
        <div className="form-group">
          <label htmlFor="freq">Show amounts</label>
          <select id="freq" value={outFreq} onChange={(e) => setOutFreq(e.target.value)}>
            {PAY_FREQUENCIES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {overLimit && (
        <p className="field-note over-limit">
          A contribution above the 2026 limit is entered — {formatMoney(CONTRIBUTION_LIMITS.retirement401k)} for
          a 401(k), {formatMoney(CONTRIBUTION_LIMITS.hsaFamily)} for a family HSA. The figure still computes,
          but check it.
        </p>
      )}

      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calculate}>
          {result ? 'Recalculate' : 'Calculate'}
        </button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>

      {result === null ? (
        <div className="results-placeholder">
          <p>Enter your wage and press Calculate to see your take-home.</p>
        </div>
      ) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Estimated take-home (2026){stateCode ? ` — ${states[stateCode]?.name}` : ''}{freq.key !== 'annual' ? `, ${freq.label.toLowerCase()}` : ''}</h3>

          <Line label="Gross wage" value={per(result.gross)} />
          {result.preTaxTotal > 0 && <Line label="Pre-tax deductions" value={`− ${per(result.preTaxTotal)}`} />}
          <Line label="Standard deduction" value={`− ${per(result.standardDeduction)}`} />
          <Line label="Taxable income" value={per(result.taxableIncome)} total />

          <Line label="Federal income tax" value={`− ${per(result.federalTax)}`} />
          {result.childTaxCredit > 0 && <Line label="Child tax credit applied" value={`− ${per(result.childTaxCredit)} off federal`} />}
          <Line label="FICA (Social Security + Medicare, employee half)" value={`− ${per(result.fica)}`} />
          <Line
            label={stateCode ? `${states[stateCode]?.name} income tax` : 'State income tax'}
            value={stateCode ? `− ${per(result.stateTax)}` : 'select a state'}
          />
          {result.sdi && !result.sdi.unmodeled && (
            <Line label={result.sdi.label} value={`− ${per(result.sdi.amount!)}`} />
          )}
          <Line label="Total tax" value={per(result.totalTax)} total />
          {result.postTax > 0 && <Line label="After-tax deductions" value={`− ${per(result.postTax)}`} />}
          <Line label={`Take-home (${freq.label.toLowerCase()})`} value={per(result.takeHome)} total />
          <Line label="Effective rate on gross" value={formatPct(result.effectiveRate)} />
          <Line label="Marginal bracket" value={formatPct(result.marginalRate)} />

          {monthlyExpenses > 0 && (
            <Line
              label="Left after your monthly expenses"
              value={formatMoney(result.takeHome / 12 - monthlyExpenses) + ' a month'}
              total
            />
          )}

          {result.sdi?.unmodeled && (
            <p className="results-note">
              {states[stateCode]?.name} also requires disability coverage, but the premium varies by
              employer plan rather than a fixed statutory rate, so it is not in the figures above. Your
              actual take-home will be slightly lower. {result.sdi.note}
            </p>
          )}
          <p className="results-note">
            {stateCode
              ? 'Estimate. Only the credits and deductions you entered are applied. Not tax advice.'
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
