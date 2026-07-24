/** RtoCostCalculator — true annual cost of a return-to-office mandate. Nothing stored. */
import { useId, useState } from 'react';
import { rtoCost, DEFAULT_MILEAGE_RATE, type CommuteMode } from '../../lib/rtoCost';
import { RTO_DEFAULTS, WORK_HOURS_PER_YEAR } from '../../data/rto-defaults';
import { formatMoney } from '../../lib/tax-engine';

const MODES: [CommuteMode, string][] = [['car', 'Drive'], ['transit', 'Public transit'], ['walk_bike', 'Walk / bike']];

export default function RtoCostCalculator() {
  const [days, setDays] = useState(3);
  const [mode, setMode] = useState<CommuteMode>('car');
  const [distance, setDistance] = useState(20);
  const [mileageRate, setMileageRate] = useState(DEFAULT_MILEAGE_RATE);
  const [parking, setParking] = useState(0);
  const [fare, setFare] = useState(RTO_DEFAULTS.transitFareRoundTrip.value);
  const [minutes, setMinutes] = useState(40);
  const [salary, setSalary] = useState(90000);
  const [lunch, setLunch] = useState(RTO_DEFAULTS.lunchDeltaPerOfficeDay.value);
  const [wardrobe, setWardrobe] = useState(300);
  const [childcare, setChildcare] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof rtoCost> | null>(null);
  const [stale, setStale] = useState(false);
  const id = useId();

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    setResult(rtoCost({
      daysInOfficePerWeek: days, oneWayDistanceMiles: distance, mode, mileageRatePerMile: mileageRate,
      parkingPerOfficeDay: parking, transitFareRoundTrip: fare, commuteMinutesEachWay: minutes,
      hourlyValueOfTime: salary / WORK_HOURS_PER_YEAR, lunchDeltaPerOfficeDay: lunch, coffeeDeltaPerOfficeDay: 0,
      wardrobePerYear: wardrobe, childcareDeltaPerOfficeDay: childcare, weeksWorkedPerYear: RTO_DEFAULTS.weeksWorkedPerYear.value,
      marginalTaxRate: RTO_DEFAULTS.marginalTaxRate.value,
    }));
    setStale(false);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label htmlFor={`${id}-days`}>Days in office per week (the mandate)</label><input id={`${id}-days`} type="number" min={0} max={7} value={days} onChange={(e) => ed(setDays)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-mode`}>How you'd commute</label><select id={`${id}-mode`} value={mode} onChange={(e) => ed(setMode)(e.target.value as CommuteMode)}>{MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        {mode === 'car' && <div className="form-group"><label htmlFor={`${id}-dist`}>One-way distance (miles)</label><input id={`${id}-dist`} type="number" min={0} value={distance} onChange={(e) => ed(setDistance)(num(e.target.value))} /></div>}
        {mode === 'car' && <div className="form-group"><label htmlFor={`${id}-rate`}>Cost per mile</label><input id={`${id}-rate`} type="number" step="0.01" min={0} value={mileageRate} onChange={(e) => ed(setMileageRate)(num(e.target.value))} /><p className="field-note">2026 IRS standard rate, {DEFAULT_MILEAGE_RATE * 100}¢/mi. Edit to your own cost.</p></div>}
        {mode === 'transit' && <div className="form-group"><label htmlFor={`${id}-fare`}>Transit fare, round trip</label><input id={`${id}-fare`} type="number" step="0.25" min={0} value={fare} onChange={(e) => ed(setFare)(num(e.target.value))} /><p className="field-note">Per office day. Enter your own fare.</p></div>}
        <div className="form-group"><label htmlFor={`${id}-park`}>Parking per office day</label><input id={`${id}-park`} type="number" min={0} value={parking} onChange={(e) => ed(setParking)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-min`}>Commute time each way (minutes)</label><input id={`${id}-min`} type="number" min={0} value={minutes} onChange={(e) => ed(setMinutes)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-sal`}>Your salary</label><input id={`${id}-sal`} type="number" min={0} value={salary} onChange={(e) => ed(setSalary)(num(e.target.value))} /><p className="field-note">Sets the value of your commute time ({formatMoney(Math.round(salary / WORK_HOURS_PER_YEAR))}/hr).</p></div>
        <div className="form-group"><label htmlFor={`${id}-lunch`}>Lunch / coffee bought out, per office day</label><input id={`${id}-lunch`} type="number" min={0} value={lunch} onChange={(e) => ed(setLunch)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-ward`}>Work wardrobe, per year</label><input id={`${id}-ward`} type="number" min={0} value={wardrobe} onChange={(e) => ed(setWardrobe)(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-care`}>Extra childcare per office day</label><input id={`${id}-care`} type="number" min={0} value={childcare} onChange={(e) => ed(setChildcare)(num(e.target.value))} /><p className="field-note">Only the days in-office adds.</p></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Calculate the true cost'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Nothing you enter is stored or sent anywhere — it runs in your browser.</p></div>) : (
        <>
          <div className="share-card">
            <p className="share-label">Your {result.mandate.daysPerWeek}-day-a-week mandate costs</p>
            <p className="share-figure">{formatMoney(result.mandate.annualMoney)}/yr</p>
            <p className="share-sub">out of pocket, plus <strong>{result.mandate.annualHours} hours</strong> of your life — equivalent to a <strong>{formatMoney(result.mandate.equivalentRaise)}</strong> raise to break even</p>
          </div>
          <div className={stale ? 'results-box is-stale' : 'results-box'}>
            <h3>Dollars and hours, kept separate</h3>
            <div className="result-line"><span>Out of pocket per year</span><span className="num">{formatMoney(result.mandate.annualMoney)}</span></div>
            <div className="result-line"><span>Hours per year in the commute</span><span className="num">{result.mandate.annualHours} hrs</span></div>
            <div className="result-line"><span>If you value that time at your wage</span><span className="num">{formatMoney(result.mandate.annualTimeValue)}</span></div>
            <div className="result-line total"><span>Money + time combined</span><span className="num">{formatMoney(result.mandate.totalWithTime)}</span></div>
            <div className="result-line"><span>Pre-tax raise that neutralises the cash cost</span><span className="num">{formatMoney(result.mandate.equivalentRaise)}</span></div>
          </div>
          <div className="results-box">
            <h3>Full RTO vs your mandate vs remote</h3>
            <div className="result-line"><span>Full RTO (5 days)</span><span className="num">{formatMoney(result.fullRto.annualMoney)} · {result.fullRto.annualHours} hrs</span></div>
            <div className="result-line"><span>Your mandate ({result.mandate.daysPerWeek} days)</span><span className="num">{formatMoney(result.mandate.annualMoney)} · {result.mandate.annualHours} hrs</span></div>
            <div className="result-line"><span>Fully remote</span><span className="num">{formatMoney(0)} · 0 hrs</span></div>
          </div>
          <div className="share-card">
            <p className="share-label">If this pushes you to negotiate</p>
            <p className="share-sub">Carry the {formatMoney(result.mandate.equivalentRaise)} neutralising raise into the <a href="/salary-negotiation-script-generator/">negotiation script generator</a>, or check your <a href="/layoff-runway-calculator/">runway</a> before you quit.</p>
          </div>
          <details className="methodology">
            <summary>Methodology &amp; sources</summary>
            <p>Cash cost = (commute + parking + lunch/coffee + extra childcare) per office day × days × {RTO_DEFAULTS.weeksWorkedPerYear.value} weeks, plus the annual wardrobe. Driving uses your cost-per-mile (default the 2026 IRS standard rate, {DEFAULT_MILEAGE_RATE * 100}¢/mi second-half). Time is shown as hours and, separately, valued at your salary ÷ {WORK_HOURS_PER_YEAR}. The neutralising raise grosses the cash cost up by a {RTO_DEFAULTS.marginalTaxRate.value * 100}% marginal rate, because you pay commute costs with after-tax dollars.</p>
            <p className="src">Sources: IRS Notice 2026-10 / Announcement 2026-11 (standard mileage rate); {RTO_DEFAULTS.lunchDeltaPerOfficeDay.source}; {RTO_DEFAULTS.transitFareRoundTrip.source}. All defaults editable. Not financial advice.</p>
          </details>
        </>
      )}
    </div>
  );
}
