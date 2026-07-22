/**
 * FormationComparisonCalculator — the state formation comparison island.
 *
 * The largest island on the site, and deliberately still React and nothing
 * else: no table library, no charting, no state manager. The comparison is a
 * table and a set of cards, which HTML already does.
 *
 * Two layout decisions carry meaning rather than taste:
 *
 *  1. FEDERAL TAX RENDERS ONCE, ABOVE THE TABLE. It is identical in every
 *     column by construction, and a per-column federal figure would imply a
 *     state can change it. So can the state income tax line, for the same
 *     reason — where you file the paperwork does not move either.
 *
 *  2. UNQUANTIFIED COSTS SIT NEXT TO THE TOTAL, not in a footnote. A total that
 *     looks complete and is not is the failure mode this whole tool was built
 *     to avoid, so the admission travels with the number.
 *
 * Inputs are split into two groups and labelled as such, because several of
 * them drive warnings rather than arithmetic and it would be dishonest to let
 * them look like they change the answer.
 */
import { useState } from 'react';
import {
  compareFormationStates, rankByFiveYear, AGENT_TIERS,
  type FormationInput, type FormationResult, type FormationColumn, type AgentTier, type EntityChoice,
} from '../../lib/formation-compare';
import { formatMoney } from '../../lib/tax-engine';
import { states } from '../../data/states';

const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

const ENTITIES: Array<[EntityChoice, string]> = [
  ['llc', 'LLC, taxed as default'],
  ['llc-s-elect', 'LLC with an S-corp election'],
  ['s-corp', 'S corporation'],
  ['c-corp', 'C corporation'],
  ['sole-prop', 'Sole proprietor'],
];

const money = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : formatMoney(n);

export default function FormationComparisonCalculator() {
  const [homeState, setHomeState] = useState('OH');
  const [workState, setWorkState] = useState('OH');
  const [entity, setEntity] = useState<EntityChoice>('llc');
  const [annualRevenue, setAnnualRevenue] = useState(150_000);
  const [annualProfit, setAnnualProfit] = useState(110_000);
  const [ownerSalary, setOwnerSalary] = useState(0);
  const [ownerDistributions, setOwnerDistributions] = useState(110_000);
  const [numberOfOwners, setNumberOfOwners] = useState(1);
  const [numberOfEmployees, setNumberOfEmployees] = useState(0);
  const [candidateState, setCandidateState] = useState('');
  const [agentTier, setAgentTier] = useState<AgentTier>('standard');
  // Group B — warnings only.
  const [presence, setPresence] = useState<'online' | 'physical' | 'mixed'>('mixed');
  const [ownsProperty, setOwnsProperty] = useState(false);
  const [licensedProfession, setLicensedProfession] = useState(false);
  const [expectsInvestors, setExpectsInvestors] = useState(false);

  const [result, setResult] = useState<FormationResult | null>(null);
  const [stale, setStale] = useState(false);
  const touched = () => { if (result) setStale(true); };

  const calculate = () => {
    const input: FormationInput = {
      homeState, workState, entity, annualRevenue, annualProfit,
      ownerSalary, ownerDistributions, numberOfOwners, numberOfEmployees,
      candidateState: candidateState || undefined, agentTier,
      presence, ownsProperty, licensedProfession, expectsInvestors,
    };
    setResult(compareFormationStates(input));
    setStale(false);
  };

  const ranked = result ? rankByFiveYear(result) : [];
  const operating = workState || homeState;

  return (
    <div>
      <div className="calc-panel">
        <p className="section-label">What decides the numbers</p>
        <div className="field-row">
          <label>
            Where you live
            <select value={homeState} onChange={(e) => { setHomeState(e.target.value); touched(); }}>
              {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </label>
          <label>
            Where the work actually happens
            <select value={workState} onChange={(e) => { setWorkState(e.target.value); touched(); }}>
              {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </label>
          <label>
            Entity type
            <select value={entity} onChange={(e) => { setEntity(e.target.value as EntityChoice); touched(); }}>
              {ENTITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
        <div className="field-row">
          <label>
            Annual revenue
            <input type="number" min={0} step={5000} value={annualRevenue}
              onChange={(e) => { setAnnualRevenue(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            Annual profit
            <input type="number" min={0} step={5000} value={annualProfit}
              onChange={(e) => { setAnnualProfit(Number(e.target.value)); touched(); }} />
          </label>
          {(entity === 's-corp' || entity === 'llc-s-elect' || entity === 'c-corp') && (
            <label>
              Your salary
              <input type="number" min={0} step={1000} value={ownerSalary}
                onChange={(e) => { setOwnerSalary(Number(e.target.value)); touched(); }} />
            </label>
          )}
        </div>
        <div className="field-row">
          <label>
            Number of owners
            <input type="number" min={1} step={1} value={numberOfOwners}
              onChange={(e) => { setNumberOfOwners(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            Employees
            <input type="number" min={0} step={1} value={numberOfEmployees}
              onChange={(e) => { setNumberOfEmployees(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            Another state to compare
            <select value={candidateState} onChange={(e) => { setCandidateState(e.target.value); touched(); }}>
              <option value="">None</option>
              {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </label>
          <label>
            Registered agent
            <select value={agentTier} onChange={(e) => { setAgentTier(e.target.value as AgentTier); touched(); }}>
              {(Object.keys(AGENT_TIERS) as AgentTier[]).map((k) => (
                <option key={k} value={k}>{AGENT_TIERS[k].label} — {AGENT_TIERS[k].cost === 0 ? 'free' : formatMoney(AGENT_TIERS[k].cost) + ' a year'}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="field-note">
          Registered agent prices are a typical market range, not an official fee. Acting as your own
          agent needs an address in that state, so it is only offered where you live or work.
        </p>

        <p className="section-label">What changes the warnings, not the arithmetic</p>
        <div className="field-row">
          <label>
            How you operate
            <select value={presence} onChange={(e) => { setPresence(e.target.value as typeof presence); touched(); }}>
              <option value="online">Entirely online</option>
              <option value="mixed">Mixed</option>
              <option value="physical">Physical premises</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={ownsProperty}
              onChange={(e) => { setOwnsProperty(e.target.checked); touched(); }} />
            The business owns property
          </label>
          <label className="check">
            <input type="checkbox" checked={licensedProfession}
              onChange={(e) => { setLicensedProfession(e.target.checked); touched(); }} />
            Licensed profession
          </label>
          <label className="check">
            <input type="checkbox" checked={expectsInvestors}
              onChange={(e) => { setExpectsInvestors(e.target.checked); touched(); }} />
            Expecting outside investors
          </label>
        </div>

        <div className="calc-actions">
          <button type="button" className="btn-calculate" onClick={calculate}>Compare states</button>
          {stale && <span className="stale-note">Inputs changed — press Compare again</span>}
        </div>
      </div>

      {!result ? (
        <div className="results-placeholder">
          <p>Set your states and figures above, then press Compare.</p>
        </div>
      ) : result.shortCircuit ? (
        <div className="results-box">
          <h3>There is no state to choose</h3>
          <p>{result.shortCircuit}</p>
          <p><a href="/entity-tax-calculator/">Compare entity types instead →</a></p>
        </div>
      ) : (
        <div className={`results-box${stale ? ' is-stale' : ''}`}>
          {/*
            Federal and state income tax are shown ONCE, above the comparison,
            because both are identical in every column. Repeating them per column
            would imply a formation state can move them. It cannot.
          */}
          <h3>These two do not change with the state you form in</h3>
          <table className="quarter-table">
            <tbody>
              <tr>
                <td>Federal tax</td>
                <td>{money(result.federal.tax)}</td>
              </tr>
              <tr>
                <td>State income tax to {states[operating]?.name}</td>
                <td>{money(result.columns[0]?.stateIncomeTax ?? 0)}</td>
              </tr>
            </tbody>
          </table>
          <p className="field-note">{result.federal.breakdown}</p>
          <p className="field-note">
            Pass-through income is taxed where you live and where the income is earned, not where the
            paperwork was filed. Every column below pays the same {states[operating]?.name} income tax.
          </p>

          <h3>What each state costs to form and keep</h3>
          <div className="table-scroll">
            <table className="quarter-table comparison-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Formation</th>
                  <th>Annual report</th>
                  <th>Franchise</th>
                  <th>Gross receipts</th>
                  <th>Agent</th>
                  <th>Foreign registration</th>
                  <th>Annual total</th>
                  <th>Five-year total</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((c) => (
                  <tr key={c.state} className={c.isOperatingState ? 'total' : undefined}>
                    <td>{c.stateName}{c.isOperatingState ? ' — where you operate' : ''}</td>
                    <td>{money(c.formationFee.amount)}{c.flags.includes('fee-varies') ? '+' : ''}</td>
                    <td>{money(c.annualReport.amount)}</td>
                    <td>{money(c.franchiseTax.amount)}</td>
                    <td>{money(c.grossReceiptsTax.amount)}</td>
                    <td>{money(c.agentCost)}</td>
                    <td>{money(c.foreignRegistration.oneTime)}</td>
                    <td>{money(c.annualTotal)}</td>
                    <td>
                      {money(c.fiveYearTotal)}
                      {c.unquantified.length > 0 && (
                        <span className="pill">+ {c.unquantified.length} unquantified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: the same data as cards, sorted by five-year total. */}
          <div className="comparison-cards">
            {ranked.map((c) => (
              <div className={`comparison-card${c.isOperatingState ? ' is-operating' : ''}`} key={c.state}>
                <h4>{c.stateName}{c.isOperatingState ? ' — where you operate' : ''}</h4>
                <p className="card-total">{money(c.fiveYearTotal)} <span>over five years</span></p>
                <dl>
                  <dt>Formation</dt><dd>{money(c.formationFee.amount)}</dd>
                  <dt>Annual report</dt><dd>{money(c.annualReport.amount)}</dd>
                  <dt>Franchise</dt><dd>{money(c.franchiseTax.amount)}</dd>
                  <dt>Gross receipts</dt><dd>{money(c.grossReceiptsTax.amount)}</dd>
                  <dt>Registered agent</dt><dd>{money(c.agentCost)}</dd>
                  <dt>Foreign registration</dt><dd>{money(c.foreignRegistration.oneTime)}</dd>
                  <dt>Annual total</dt><dd>{money(c.annualTotal)}</dd>
                </dl>
                {c.foreignRegistration.note && <p className="card-note">{c.foreignRegistration.note}</p>}
                {c.unquantified.length > 0 && (
                  <p className="card-note"><strong>Not included, because no confirmed figure exists:</strong> {c.unquantified.join('; ')}.</p>
                )}
              </div>
            ))}
          </div>

          {ranked.some((c) => c.unquantified.length > 0) && (
            <div className="result-notes">
              <strong>Costs we know exist but cannot put a number on</strong>
              <ul>
                {ranked.filter((c) => c.unquantified.length > 0).map((c) => (
                  <li key={c.state}><strong>{c.stateName}:</strong> {c.unquantified.join('; ')}.</li>
                ))}
              </ul>
              <p>
                These are left out of the totals above rather than guessed at. A total that looks complete
                and is not would be worse than one that admits the gap.
              </p>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="result-notes">
              <strong>What applies to you regardless of the state you pick</strong>
              <ul>{result.warnings.map((w, i) => <li key={i}>{w.text}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
