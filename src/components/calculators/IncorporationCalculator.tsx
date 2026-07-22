/**
 * IncorporationCalculator — Delaware franchise tax, and what it costs to
 * incorporate away from where you actually work.
 *
 * Two things this exists to show, both of which cost real money and neither of
 * which appears on the pages that recommend Delaware or Wyoming:
 *
 *  1. Delaware bills the AUTHORIZED SHARES method by default, and a startup
 *     with ten million authorized shares is billed tens of thousands of dollars
 *     under it. The assumed par value method usually produces a fraction of
 *     that, and Delaware does not volunteer it — you have to ask.
 *  2. Incorporating in Delaware or Wyoming does not move your tax. If you work
 *     somewhere else, you register as a foreign entity there and pay that
 *     state's taxes and fees as well. You end up with two sets of filings,
 *     not a lower bill.
 */
import { useState } from 'react';
import { calcDelawareFranchiseTax, formatMoney } from '../../lib/tax-engine';
import { entityTypes } from '../../data/federal';
import { states } from '../../data/states';

const wy = (entityTypes as any).wyomingLLC;
const de = (entityTypes as any).delawareCCorp.franchiseTax;

const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

export default function IncorporationCalculator() {
  const [authorizedShares, setAuthorizedShares] = useState(10_000_000);
  const [issuedShares, setIssuedShares] = useState(8_000_000);
  const [grossAssets, setGrossAssets] = useState(500_000);
  const [homeState, setHomeState] = useState('');
  const [result, setResult] = useState<ReturnType<typeof calcDelawareFranchiseTax> | null>(null);
  const [stale, setStale] = useState(false);

  const touched = () => { if (result) setStale(true); };
  const calculate = () => {
    setResult(calcDelawareFranchiseTax(authorizedShares, grossAssets, issuedShares));
    setStale(false);
  };

  const overpay = result ? result.authMethod - result.best : 0;

  return (
    <div>
      <div className="calc-panel">
        <div className="field-row">
          <label>
            Authorized shares
            <input type="number" min={0} step={1000} value={authorizedShares}
              onChange={(e) => { setAuthorizedShares(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            Issued shares
            <input type="number" min={0} step={1000} value={issuedShares}
              onChange={(e) => { setIssuedShares(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            Gross assets
            <input type="number" min={0} step={10000} value={grossAssets}
              onChange={(e) => { setGrossAssets(Number(e.target.value)); touched(); }} />
          </label>
        </div>
        <div className="field-row">
          <label>
            Where you actually operate
            <select value={homeState} onChange={(e) => { setHomeState(e.target.value); touched(); }}>
              <option value="">Select your state…</option>
              {stateOptions.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </label>
        </div>
        <p className="field-note">
          Authorized shares is the number your certificate of incorporation permits — usually far more
          than you have issued. That gap is what makes the default billing method expensive.
        </p>
        <div className="calc-actions">
          <button type="button" className="btn-calculate" onClick={calculate}>Calculate</button>
          {stale && <span className="stale-note">Inputs changed — press Calculate again</span>}
        </div>
      </div>

      {!result ? (
        <div className="results-placeholder"><p>Enter your share counts and press Calculate.</p></div>
      ) : (
        <div className={`results-box${stale ? ' is-stale' : ''}`}>
          <h3>
            {overpay > 0
              ? `Delaware would bill you ${formatMoney(result.authMethod)}. You can pay ${formatMoney(result.best)}.`
              : `Delaware franchise tax: ${formatMoney(result.best)}`}
          </h3>
          <table className="quarter-table">
            <tbody>
              <tr>
                <td>Authorized shares method — what Delaware bills by default</td>
                <td>{formatMoney(result.authMethod)}</td>
              </tr>
              <tr>
                <td>Assumed par value method — what you can elect instead</td>
                <td>{formatMoney(result.parValueMethod)}</td>
              </tr>
              <tr><td>Annual report fee</td><td>{formatMoney(result.filingFee)}</td></tr>
              <tr className="total">
                <td>Lower of the two, plus the report fee</td>
                <td>{formatMoney(result.best + result.filingFee)}</td>
              </tr>
              {overpay > 0 && (
                <tr className="total">
                  <td>What you save by electing the other method</td>
                  <td>{formatMoney(overpay)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {overpay > 0 && (
            <div className="result-notes">
              <strong>Delaware will not tell you this</strong>
              <p>
                The bill that arrives uses the authorized shares method. Delaware is not obliged to
                calculate the cheaper one for you, and a company with millions of authorized shares and
                modest assets is the exact case where the difference is largest. You elect the assumed par
                value method when you file the annual report, by 1 March.
              </p>
            </div>
          )}

          <div className="result-notes">
            <strong>Wyoming, for comparison</strong>
            <p>
              Wyoming charges no franchise tax at all and an annual report fee of {formatMoney(wy.annualReportFee)},
              plus a registered agent at roughly ${wy.registeredAgentCostPerYear} a year. Member names are
              not public. What it does not do is attract institutional investors — most venture funds
              require a Delaware C corporation, which is the real reason startups incorporate there rather
              than any tax advantage.
            </p>
          </div>

          {homeState && homeState !== 'DE' && (
            <div className="result-notes">
              <strong>Incorporating elsewhere does not move your tax</strong>
              <p>
                You operate in {states[homeState].name}. Incorporating in Delaware or Wyoming means
                registering there as a foreign entity as well, paying its fees, and filing in both places.
                {states[homeState].noIncomeTax || states[homeState].type === 'none'
                  ? ` ${states[homeState].name} has no personal income tax, so there is little to escape in the first place — the case for incorporating elsewhere here is about investors and privacy, not tax.`
                  : ` ${states[homeState].name} taxes income earned in ${states[homeState].name} regardless of where the paperwork was filed. The Delaware or Wyoming filing is an additional cost, not a substitute.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
