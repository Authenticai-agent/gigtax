/** GenderPayGapCalculator — the male/female median gap for an occupation and its lifetime cost. */
import { useState } from 'react';
import { genderPayGap } from '../../lib/personal-finance';
import { formatMoney, formatPct } from '../../lib/tax-engine';
import { OCCUPATIONS } from '../../data/occupations-pay';

const GENDERS = [['female', 'Woman'], ['male', 'Man'], ['all', 'Prefer not to say']] as const;

export default function GenderPayGapCalculator() {
  const [occIdx, setOcc] = useState(0);
  const [salary, setSalary] = useState(95000);
  const [gender, setGender] = useState<'male' | 'female' | 'all'>('female');
  const [careerYears, setYears] = useState(25);
  const [result, setResult] = useState<(ReturnType<typeof genderPayGap> & { note: string }) | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => {
    const occ = OCCUPATIONS[occIdx];
    setResult({ ...genderPayGap(occ, salary, gender, careerYears, 0.07), note: occ.note });
    setStale(false);
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Occupation</label><select value={occIdx} onChange={(e) => ed(setOcc)(Number(e.target.value))}>{OCCUPATIONS.map((o, i) => <option key={o.name} value={i}>{o.name}</option>)}</select></div>
        <div className="form-group"><label>Your salary</label><input type="number" min={0} value={salary} onChange={(e) => ed(setSalary)(num(e.target.value))} /></div>
        <div className="form-group"><label>You are a…</label><select value={gender} onChange={(e) => ed(setGender)(e.target.value as 'male' | 'female' | 'all')}>{GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Years left in your career</label><input type="number" min={0} value={careerYears} onChange={(e) => ed(setYears)(num(e.target.value))} /></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Show the gap'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Pick your occupation and salary.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>The gap in this occupation</h3>
          <div className="result-line"><span>Median gap (men vs women)</span><span className="num">{formatMoney(result.occupationGap)}</span></div>
          <div className="result-line"><span>Women earn less by</span><span className="num">{formatPct(result.occupationGapPct)}</span></div>
          <div className="result-line"><span>Median for your group</span><span className="num">{formatMoney(result.yourMedian)}</span></div>
          <div className="result-line"><span>You vs that median</span><span className="num">{result.vsYourMedian >= 0 ? '+' : ''}{formatMoney(result.vsYourMedian)}</span></div>
          <div className="result-line"><span>Lifetime cost of the gap (plain sum)</span><span className="num">{formatMoney(result.lifetimeGapSimple)}</span></div>
          <div className="result-line total"><span>Lifetime cost if invested (at 7%)</span><span className="num">{formatMoney(result.lifetimeGapInvested)}</span></div>
          <p className="results-note">
            {result.note} The medians are reference figures for the occupation — not a statement about your pay, which
            you entered yourself. The lifetime cost carries the annual gap over your remaining career; invested, it
            compounds into a much larger number, which is the real long-run price of an unaddressed gap. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
