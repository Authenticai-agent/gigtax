/**
 * HouseholdCalculator — every income type, every person, one tax bill.
 *
 * The other calculators on this site each answer one question. This one exists
 * because households are not shaped like a single question: one spouse with
 * 1099 income and a part-time W-2, another on SSDI and a long-term disability
 * policy, a 401(k) drawdown alongside Social Security.
 *
 * Two deliberate behaviors carried over from the other calculators:
 *  - Results stay hidden until Calculate is pressed and are marked stale when
 *    an input changes, so it is never ambiguous whether the number on screen
 *    reflects the form.
 *  - Nothing is stored or sent anywhere. It all runs in the browser.
 *
 * The disability premium question is asked rather than assumed, because who
 * paid the premium decides whether the benefit is taxed at all and no income
 * figure reveals it.
 */
import { useState } from 'react';
import {
  calcHousehold, emptyPerson, INCOME_KINDS,
  type Person, type IncomeLine, type IncomeKind, type HouseholdResult,
} from '../../lib/household';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { states } from '../../data/states';

const STATUSES = [
  ['single', 'Single'],
  ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'],
  ['mfs', 'Married filing separately'],
] as const;

const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

const PREMIUM = [
  ['employer', 'My employer paid the premium'],
  ['employee', 'I paid the premium myself, from taxed pay'],
  ['split', 'Shared between us'],
] as const;

let seq = 0;
const nextId = () => `id${++seq}`;

interface Props {
  /**
   * Income lines to start with. The focused pages — SSDI, disability,
   * retirement — are the same calculator opened on the relevant line rather
   * than a separate implementation, so they can never drift apart.
   */
  preset?: Array<{ kind: IncomeKind; amount: number; premiumPaidBy?: IncomeLine['premiumPaidBy']; expenses?: number }>;
  presetStatus?: string;
}

export default function HouseholdCalculator({ preset, presetStatus = 'single' }: Props = {}) {
  const [people, setPeople] = useState<Person[]>([
    {
      ...emptyPerson(nextId(), 'You'),
      income: (preset ?? [{ kind: 'w2' as IncomeKind, amount: 60000 }]).map((l) => ({ id: nextId(), ...l })),
    },
  ]);
  const [filingStatus, setFilingStatus] = useState(presetStatus);
  const [stateCode, setStateCode] = useState('');
  const [result, setResult] = useState<HouseholdResult | null>(null);
  const [stale, setStale] = useState(false);

  const touched = () => { if (result) setStale(true); };

  const updatePerson = (id: string, patch: Partial<Person>) => {
    setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    touched();
  };
  const updateLine = (pid: string, lid: string, patch: Partial<IncomeLine>) => {
    setPeople((ps) => ps.map((p) => p.id !== pid ? p : {
      ...p, income: p.income.map((l) => (l.id === lid ? { ...l, ...patch } : l)),
    }));
    touched();
  };
  const addLine = (pid: string) => {
    setPeople((ps) => ps.map((p) => p.id !== pid ? p : {
      ...p, income: [...p.income, { id: nextId(), kind: 'w2', amount: 0 }],
    }));
    touched();
  };
  const removeLine = (pid: string, lid: string) => {
    setPeople((ps) => ps.map((p) => p.id !== pid ? p : {
      ...p, income: p.income.filter((l) => l.id !== lid),
    }));
    touched();
  };
  const addPerson = () => {
    setPeople((ps) => [...ps, {
      ...emptyPerson(nextId(), ps.length === 1 ? 'Spouse or partner' : `Person ${ps.length + 1}`),
      income: [{ id: nextId(), kind: 'w2', amount: 0 }],
    }]);
    touched();
  };
  const removePerson = (id: string) => {
    setPeople((ps) => (ps.length > 1 ? ps.filter((p) => p.id !== id) : ps));
    touched();
  };

  const calculate = () => {
    setResult(calcHousehold({ people, filingStatus, stateCode }));
    setStale(false);
  };

  return (
    <div className="household-calc">
      <div className="calc-panel">
        <div className="field-row">
          <label>
            Filing status
            <select value={filingStatus} onChange={(e) => { setFilingStatus(e.target.value); touched(); }}>
              {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>
            State
            <select value={stateCode} onChange={(e) => { setStateCode(e.target.value); touched(); }}>
              <option value="">Select your state…</option>
              {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </label>
        </div>

        {people.map((p) => (
          <fieldset className="person-block" key={p.id}>
            <legend>
              <input
                className="person-name"
                value={p.label}
                aria-label="Name for this person"
                onChange={(e) => updatePerson(p.id, { label: e.target.value })}
              />
              {people.length > 1 && (
                <button type="button" className="btn-link" onClick={() => removePerson(p.id)}>
                  Remove
                </button>
              )}
            </legend>

            {p.income.map((line) => {
              const meta = INCOME_KINDS.find((k) => k.kind === line.kind)!;
              return (
                <div className="income-line" key={line.id}>
                  <label>
                    Income type
                    <select
                      value={line.kind}
                      onChange={(e) => updateLine(p.id, line.id, { kind: e.target.value as IncomeKind })}
                    >
                      {INCOME_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
                    </select>
                  </label>
                  <label>
                    Annual amount
                    <input
                      type="number" min={0} step={100} value={line.amount}
                      onChange={(e) => updateLine(p.id, line.id, { amount: Number(e.target.value) })}
                    />
                  </label>
                  {meta.needsExpenses && (
                    <label>
                      Business expenses
                      <input
                        type="number" min={0} step={100} value={line.expenses ?? 0}
                        onChange={(e) => updateLine(p.id, line.id, { expenses: Number(e.target.value) })}
                      />
                    </label>
                  )}
                  {meta.needsPremium && (
                    <label className="wide">
                      Who paid the premium?
                      <select
                        value={line.premiumPaidBy ?? 'employer'}
                        onChange={(e) => updateLine(p.id, line.id, { premiumPaidBy: e.target.value as IncomeLine['premiumPaidBy'] })}
                      >
                        {PREMIUM.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </label>
                  )}
                  <button type="button" className="btn-link" onClick={() => removeLine(p.id, line.id)}>
                    Remove
                  </button>
                  <p className="field-note">{meta.hint}</p>
                </div>
              );
            })}

            <div className="field-row">
              <label>
                Pre-tax retirement contributions
                <input
                  type="number" min={0} step={500} value={p.preTaxRetirement}
                  onChange={(e) => updatePerson(p.id, { preTaxRetirement: Number(e.target.value) })}
                />
              </label>
              <label>
                Health savings account
                <input
                  type="number" min={0} step={100} value={p.hsa}
                  onChange={(e) => updatePerson(p.id, { hsa: Number(e.target.value) })}
                />
              </label>
              <label className="check">
                <input
                  type="checkbox" checked={p.age65Plus}
                  onChange={(e) => updatePerson(p.id, { age65Plus: e.target.checked })}
                />
                65 or older
              </label>
            </div>

            <button type="button" className="btn-secondary" onClick={() => addLine(p.id)}>
              + Add income for {p.label || 'this person'}
            </button>
          </fieldset>
        ))}

        <div className="calc-actions">
          <button type="button" className="btn-secondary" onClick={addPerson}>+ Add a person</button>
          <button type="button" className="btn-calculate" onClick={calculate}>Calculate</button>
          {stale && <span className="stale-note">Inputs changed — press Calculate again</span>}
        </div>
      </div>

      {!result ? (
        <div className="results-placeholder">
          <p>Add everyone's income above and press Calculate.</p>
        </div>
      ) : (
        <div className={`results-box${stale ? ' is-stale' : ''}`}>
          <h3>{filingStatus === 'mfj' ? 'Married filing jointly' : STATUSES.find((s) => s[0] === filingStatus)?.[1]}
            {stateCode ? ` · ${states[stateCode].name}` : ' · no state selected'}</h3>
          <table className="quarter-table">
            <tbody>
              <tr><td>Total received</td><td>{formatMoney(result.grossAll)}</td></tr>
              {result.w2Wages > 0 && <tr><td>W-2 wages</td><td>{formatMoney(result.w2Wages)}</td></tr>}
              {result.seProfit > 0 && <tr><td>Self-employment profit after expenses</td><td>{formatMoney(result.seProfit)}</td></tr>}
              {result.untaxedSocialSecurity > 0 && (
                <tr><td>Social Security / SSDI not taxed</td><td>−{formatMoney(result.untaxedSocialSecurity)}</td></tr>
              )}
              {result.excludedDisability > 0 && (
                <tr><td>Disability benefit not taxed (you paid the premium)</td><td>−{formatMoney(result.excludedDisability)}</td></tr>
              )}
              {result.preTaxDeductions > 0 && (
                <tr><td>Pre-tax retirement and HSA</td><td>−{formatMoney(result.preTaxDeductions)}</td></tr>
              )}
              {result.seTaxDeductibleHalf > 0 && (
                <tr><td>Deductible half of self-employment tax</td><td>−{formatMoney(result.seTaxDeductibleHalf)}</td></tr>
              )}
              <tr><td>Adjusted gross income</td><td>{formatMoney(result.agi)}</td></tr>
              <tr><td>Standard deduction</td><td>−{formatMoney(result.standardDeduction)}</td></tr>
              {result.seniorDeduction > 0 && <tr><td>Senior deduction</td><td>−{formatMoney(result.seniorDeduction)}</td></tr>}
              {result.qbiDeduction > 0 && <tr><td>Qualified business income deduction</td><td>−{formatMoney(result.qbiDeduction)}</td></tr>}
              <tr><td>Taxable income</td><td>{formatMoney(result.taxableIncome)}</td></tr>
              <tr><td>Federal income tax</td><td>{formatMoney(result.federalTax)}</td></tr>
              {result.seTax > 0 && <tr><td>Self-employment tax</td><td>{formatMoney(result.seTax)}</td></tr>}
              {result.fica > 0 && <tr><td>Payroll tax withheld (your half)</td><td>{formatMoney(result.fica)}</td></tr>}
              <tr><td>State income tax{stateCode ? '' : ' (no state selected)'}</td><td>{formatMoney(result.stateTax)}</td></tr>
              <tr className="total"><td>Total tax</td><td>{formatMoney(result.totalTax)}</td></tr>
              <tr><td>Effective rate on everything received</td><td>{formatPct(result.effectiveRate)}</td></tr>
              <tr className="total"><td>After tax</td><td>{formatMoney(result.afterTax)}</td></tr>
            </tbody>
          </table>

          {result.notes.length > 0 && (
            <div className="result-notes">
              <strong>What is driving this result</strong>
              <ul>{result.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
