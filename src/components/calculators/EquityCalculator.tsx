/**
 * EquityCalculator — put your own numbers into an RSU vest, an option exercise
 * or an ESPP sale.
 *
 * The equity pages explained the traps and then asked the reader to do the
 * arithmetic themselves. This does the arithmetic. Each instrument has its own
 * inputs because each has genuinely different ones — an RSU vest needs a share
 * price and a salary, an ISO exercise needs a strike price and a market value,
 * an ESPP sale needs two dates.
 */
import { useState } from 'react';
import {
  calcFederalTax, calcStateTax, calcLTCGTax, getStandardDeduction, formatMoney, formatPct,
} from '../../lib/tax-engine';
import { equityCompensation } from '../../data/federal';
import { states } from '../../data/states';

type Instrument = 'rsu' | 'iso' | 'nso' | 'espp';

const STATUSES = [
  ['single', 'Single'],
  ['mfj', 'Married filing jointly'],
  ['hoh', 'Head of household'],
  ['mfs', 'Married filing separately'],
] as const;

const stateOptions = Object.entries(states)
  .map(([code, s]) => [code, s.name] as const)
  .sort((a, b) => a[1].localeCompare(b[1]));

const eq = equityCompensation as Record<string, any>;

interface Row { label: string; amount: number; kind?: 'total' | 'warn' }

export default function EquityCalculator({ instrument, presetState = '' }: { instrument: Instrument; presetState?: string }) {
  const [salary, setSalary] = useState(160000);
  const [shares, setShares] = useState(1000);
  const [price, setPrice] = useState(50);
  const [strike, setStrike] = useState(10);
  const [salePrice, setSalePrice] = useState(70);
  const [discount, setDiscount] = useState(15);
  const [heldLongEnough, setHeldLongEnough] = useState(false);
  const [sellNow, setSellNow] = useState(true);
  const [filingStatus, setFilingStatus] = useState('single');
  const [stateCode, setStateCode] = useState(presetState);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [stale, setStale] = useState(false);

  const touched = () => { if (rows) setStale(true); };

  const calculate = () => {
    const std = getStandardDeduction(filingStatus, false);
    const salaryTaxable = Math.max(0, salary - std);
    const out: Row[] = [];
    const why: string[] = [];
    const stateOf = (income: number) =>
      stateCode ? calcStateTax(income, stateCode, undefined, filingStatus).tax : 0;

    if (instrument === 'rsu') {
      const vestValue = shares * price;
      const supplementalRate = vestValue > 1_000_000
        ? eq.rsu.taxEvent1_vesting.withholdingRate_supplemental_over1M
        : eq.rsu.taxEvent1_vesting.withholdingRate_supplemental_under1M;
      const withheld = vestValue * supplementalRate;
      const actual = calcFederalTax(salaryTaxable + vestValue, filingStatus) - calcFederalTax(salaryTaxable, filingStatus);
      const stateTax = stateOf(salary + vestValue) - stateOf(salary);
      out.push({ label: `Vest value — ${shares.toLocaleString()} shares at ${formatMoney(price)}`, amount: vestValue });
      out.push({ label: `Your employer withholds at ${formatPct(supplementalRate)}`, amount: withheld });
      out.push({ label: 'Federal tax the vest actually costs', amount: actual });
      out.push({
        label: actual > withheld ? 'Shortfall you owe in April' : 'Over-withheld — refunded',
        amount: Math.abs(actual - withheld),
        kind: actual > withheld ? 'warn' : undefined,
      });
      if (stateCode) out.push({ label: 'State tax on the vest', amount: stateTax });
      out.push({ label: 'Total tax on this vest', amount: actual + stateTax, kind: 'total' });
      why.push(
        actual > withheld
          ? `Your employer withheld at the flat supplemental rate of ${formatPct(supplementalRate)}. That is not your marginal rate, so ${formatMoney(actual - withheld)} of federal tax on this vest was never withheld and lands in April.`
          : 'At this salary the flat supplemental withholding covers the tax, so this vest should not produce an April surprise.',
      );
      why.push('RSUs are taxed when they vest, whether or not you sell. Selling enough at vest to cover the shortfall is the usual way people avoid owing money on shares that have since fallen.');
    }

    if (instrument === 'iso' || instrument === 'nso') {
      const spread = Math.max(0, (price - strike) * shares);
      out.push({ label: `Exercise cost — ${shares.toLocaleString()} at ${formatMoney(strike)}`, amount: shares * strike });
      out.push({ label: `Market value at exercise`, amount: shares * price });
      out.push({ label: 'Paper gain on exercise (the spread)', amount: spread });
      if (instrument === 'nso') {
        const fed = calcFederalTax(salaryTaxable + spread, filingStatus) - calcFederalTax(salaryTaxable, filingStatus);
        const st = stateOf(salary + spread) - stateOf(salary);
        out.push({ label: 'Federal tax due at exercise', amount: fed, kind: 'warn' });
        if (stateCode) out.push({ label: 'State tax due at exercise', amount: st });
        out.push({ label: 'Tax owed whether or not you sell', amount: fed + st, kind: 'total' });
        why.push('Non-qualified options are taxed as ordinary income on the spread the day you exercise. Exercise and hold, and this is cash tax owed on a gain that exists only on paper.');
      } else {
        out.push({ label: 'Regular federal tax at exercise', amount: 0 });
        out.push({ label: 'Added to your alternative minimum tax income', amount: spread, kind: 'warn' });
        why.push('Incentive stock options cost nothing in regular tax at exercise. The spread is added to your alternative minimum tax income instead, which can produce a bill on a paper gain you have not realized and may never realize.');
        why.push('This calculator shows the spread that enters the AMT calculation. Whether it produces an actual AMT bill depends on your whole return, which needs more than this page knows.');
      }
      if (sellNow) {
        const gain = Math.max(0, (salePrice - price) * shares);
        const isLong = heldLongEnough;
        const tax = isLong
          ? calcLTCGTax(gain, salaryTaxable + (instrument === 'nso' ? spread : 0), filingStatus)
          : calcFederalTax(salaryTaxable + spread + gain, filingStatus) - calcFederalTax(salaryTaxable + spread, filingStatus);
        out.push({ label: `Gain since exercise at ${formatMoney(salePrice)}`, amount: gain });
        out.push({ label: isLong ? 'Long-term capital gains tax on the sale' : 'Short-term tax on the sale, at ordinary rates', amount: tax });
        why.push(isLong
          ? 'Held long enough for long-term rates, which are materially lower than ordinary rates.'
          : 'Sold inside a year of exercise, so the gain is taxed at ordinary rates rather than capital gains rates.');
      }
    }

    if (instrument === 'espp') {
      const marketPrice = price;
      const purchasePrice = marketPrice * (1 - discount / 100);
      const shareCount = shares;
      const bargain = (marketPrice - purchasePrice) * shareCount;
      const gain = Math.max(0, (salePrice - marketPrice) * shareCount);
      out.push({ label: `Purchase price after ${discount}% discount`, amount: purchasePrice * shareCount });
      out.push({ label: 'Market value on the purchase date', amount: marketPrice * shareCount });
      out.push({ label: 'The discount — taxed as ordinary income', amount: bargain });
      const fed = calcFederalTax(salaryTaxable + bargain, filingStatus) - calcFederalTax(salaryTaxable, filingStatus);
      out.push({ label: 'Federal tax on the discount', amount: fed });
      if (gain > 0) {
        const tax = heldLongEnough
          ? calcLTCGTax(gain, salaryTaxable + bargain, filingStatus)
          : calcFederalTax(salaryTaxable + bargain + gain, filingStatus) - calcFederalTax(salaryTaxable + bargain, filingStatus);
        out.push({ label: heldLongEnough ? 'Long-term capital gains tax on the growth' : 'Short-term tax on the growth', amount: tax });
        out.push({ label: 'Total tax on this sale', amount: fed + tax, kind: 'total' });
      } else {
        out.push({ label: 'Total tax on this sale', amount: fed, kind: 'total' });
      }
      why.push(heldLongEnough
        ? 'Both holding periods cleared, so the growth above the purchase price is a long-term capital gain. The discount itself is still ordinary income — that part never becomes a capital gain.'
        : 'Selling before both holding periods are cleared makes this a disqualifying disposition: the whole discount is ordinary income now, and the growth is taxed at ordinary rates too. Two periods have to be cleared, not one.');
    }

    setRows(out);
    setNotes(why);
    setStale(false);
  };

  const showsSale = instrument !== 'rsu';

  return (
    <div>
      <div className="calc-panel">
        <div className="field-row">
          <label>
            Your salary
            <input type="number" min={0} step={1000} value={salary}
              onChange={(e) => { setSalary(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            Number of shares
            <input type="number" min={0} step={10} value={shares}
              onChange={(e) => { setShares(Number(e.target.value)); touched(); }} />
          </label>
          <label>
            {instrument === 'rsu' ? 'Share price at vest'
              : instrument === 'espp' ? 'Market price on the purchase date'
              : 'Market value at exercise'}
            <input type="number" min={0} step={1} value={price}
              onChange={(e) => { setPrice(Number(e.target.value)); touched(); }} />
          </label>
        </div>

        {(instrument === 'iso' || instrument === 'nso') && (
          <div className="field-row">
            <label>
              Strike price
              <input type="number" min={0} step={1} value={strike}
                onChange={(e) => { setStrike(Number(e.target.value)); touched(); }} />
            </label>
            <label className="check">
              <input type="checkbox" checked={sellNow}
                onChange={(e) => { setSellNow(e.target.checked); touched(); }} />
              I also sold the shares
            </label>
          </div>
        )}

        {instrument === 'espp' && (
          <div className="field-row">
            <label>
              Discount offered
              <input type="number" min={0} max={50} step={1} value={discount}
                onChange={(e) => { setDiscount(Number(e.target.value)); touched(); }} />
            </label>
          </div>
        )}

        {showsSale && (
          <div className="field-row">
            {(sellNow || instrument === 'espp') && (
              <label>
                Sale price
                <input type="number" min={0} step={1} value={salePrice}
                  onChange={(e) => { setSalePrice(Number(e.target.value)); touched(); }} />
              </label>
            )}
            <label className="check">
              <input type="checkbox" checked={heldLongEnough}
                onChange={(e) => { setHeldLongEnough(e.target.checked); touched(); }} />
              {instrument === 'espp'
                ? 'Held two years from the offering date and one from purchase'
                : 'Held more than a year since exercise'}
            </label>
          </div>
        )}

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

        <div className="calc-actions">
          <button type="button" className="btn-calculate" onClick={calculate}>Calculate</button>
          {stale && <span className="stale-note">Inputs changed — press Calculate again</span>}
        </div>
      </div>

      {!rows ? (
        <div className="results-placeholder"><p>Enter your numbers above and press Calculate.</p></div>
      ) : (
        <div className={`results-box${stale ? ' is-stale' : ''}`}>
          <table className="quarter-table">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={r.kind === 'total' ? 'total' : undefined}>
                  <td>{r.label}</td>
                  <td>{formatMoney(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {notes.length > 0 && (
            <div className="result-notes">
              <strong>What this means</strong>
              <ul>{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
