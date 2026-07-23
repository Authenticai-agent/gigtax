/** CompAuditRiskCalculator — score an S-corp owner's reasonable-comp audit risk. */
import { useState } from 'react';
import { sCorpAuditRisk, type Industry, type OwnerStructure, type Credentials } from '../../lib/comp-audit-risk';
import { formatMoney } from '../../lib/tax-engine';

const INDUSTRIES: [Industry, string][] = [
  ['software', 'Software / SaaS / Tech'], ['consulting', 'Consulting / Professional services'],
  ['medical', 'Medical / Dental / Healthcare'], ['legal', 'Legal / Accounting / CPA'],
  ['construction', 'Construction / Trades'], ['retail', 'E-commerce / Retail'],
  ['creative', 'Creative / Marketing / Media'], ['realestate', 'Real estate / Property'],
  ['other', 'Other / General business'],
];
const OWNERS: [OwnerStructure, string][] = [
  ['0', 'Just me (100% owner-worker)'], ['1', '1 other owner who also works'],
  ['1passive', '1 other owner who is passive'], ['2plus', '2+ other owners'],
];
const CREDS: [Credentials, string][] = [
  ['expert', 'Advanced degree / 10+ years'], ['senior', 'Senior / 5-10 years'],
  ['mid', 'Mid-level / 2-5 years'], ['entry', 'Entry-level / under 2 years'],
];
const HOURS = [40, 30, 20, 10, 5];
const LEVEL_CLASS: Record<string, string> = { Low: 'ok', Moderate: 'warn', High: 'warn', Critical: 'bad' };

export default function CompAuditRiskCalculator() {
  const [profit, setProfit] = useState(200000);
  const [salary, setSalary] = useState(40000);
  const [industry, setIndustry] = useState<Industry>('consulting');
  const [years, setYears] = useState(3);
  const [employees, setEmployees] = useState(0);
  const [owners, setOwners] = useState<OwnerStructure>('0');
  const [hours, setHours] = useState(40);
  const [credentials, setCreds] = useState<Credentials>('expert');
  const [result, setResult] = useState<ReturnType<typeof sCorpAuditRisk> | null>(null);
  const [stale, setStale] = useState(false);

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const ed = <T,>(f: (v: T) => void) => (v: T) => { f(v); if (result) setStale(true); };
  const calc = () => { setResult(sCorpAuditRisk({ profit, salary, industry, years, employees, owners, hours, credentials })); setStale(false); };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label>Net profit before your salary</label><input type="number" min={0} value={profit} onChange={(e) => ed(setProfit)(num(e.target.value))} /></div>
        <div className="form-group"><label>Your current W-2 salary</label><input type="number" min={0} value={salary} onChange={(e) => ed(setSalary)(num(e.target.value))} /></div>
        <div className="form-group"><label>Industry / role</label><select value={industry} onChange={(e) => ed(setIndustry)(e.target.value as Industry)}>{INDUSTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Years in business</label><input type="number" min={0} value={years} onChange={(e) => ed(setYears)(num(e.target.value))} /></div>
        <div className="form-group"><label>Employees (excluding you)</label><input type="number" min={0} value={employees} onChange={(e) => ed(setEmployees)(num(e.target.value))} /></div>
        <div className="form-group"><label>Other owners</label><select value={owners} onChange={(e) => ed(setOwners)(e.target.value as OwnerStructure)}>{OWNERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label>Your weekly hours</label><select value={hours} onChange={(e) => ed(setHours)(Number(e.target.value))}>{HOURS.map((h) => <option key={h} value={h}>{h === 5 ? 'Under 10' : `${h}+`} hours</option>)}</select></div>
        <div className="form-group"><label>Your credentials</label><select value={credentials} onChange={(e) => ed(setCreds)(e.target.value as Credentials)}>{CREDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={calc}>{result ? 'Recalculate' : 'Score my audit risk'}</button>
        {stale && <span className="stale-note">Inputs changed — press Recalculate</span>}
      </div>
      {result === null ? (<div className="results-placeholder"><p>Enter your profit and salary to score your reasonable-comp audit risk.</p></div>) : (
        <div className={stale ? 'results-box is-stale' : 'results-box'}>
          <h3>Audit risk: <span className={`pill ${LEVEL_CLASS[result.level]}`}>{result.score}/100 · {result.level}</span></h3>
          <div className="result-line"><span>Your salary ratio</span><span className="num">{(result.ratio * 100).toFixed(1)}%</span></div>
          <div className="result-line"><span>Industry benchmark ({result.benchmark.label})</span><span className="num">{(result.benchmark.min * 100).toFixed(0)}–{(result.benchmark.max * 100).toFixed(0)}%</span></div>
          <div className="result-line"><span>Recommended salary range</span><span className="num">{formatMoney(result.recommendedMin)} – {formatMoney(result.recommendedMax)}</span></div>
          <div className="result-line"><span>Benchmark target salary</span><span className="num">{formatMoney(result.recommendedTarget)}</span></div>
          <div className="result-line total"><span>Payroll tax the IRS could reclaim vs target</span><span className="num">{formatMoney(result.payrollTaxAtRisk)}</span></div>
          <p className="results-note">
            Score breakdown: {result.factors.map((f) => `${f.label} ${f.points >= 0 ? '+' : ''}${f.points}`).join(', ')}.
            The IRS won <em>Watson v. Commissioner</em> (8th Cir. 2012) — a $24k salary on $200k+ profit was unreasonable and
            $175k of distributions was reclassified as wages. Benchmarks here are practitioner rules of thumb, not IRS
            figures; a formal reasonable-compensation study is your best audit defense. Not tax or legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
