/** RemoteResidencyChecker — domestic + international remote-work tax rules map. Nothing stored. */
import { useId, useState } from 'react';
import { domesticResidency, internationalResidency, REMOTE_COUNTRIES, type RuleItem } from '../../lib/remoteResidency';
import { states } from '../../data/states';
import { formatMoney } from '../../lib/tax-engine';

type Mode = 'domestic' | 'international';
const stateOptions = Object.entries(states).map(([c, s]) => [c, s.name] as const).sort((a, b) => a[1].localeCompare(b[1]));

function RuleList({ items }: { items: RuleItem[] }) {
  return (
    <ul className="rule-list">
      {items.map((it, k) => (
        <li key={k} className={`rule-item ${it.kind}`}>
          <p className="rule-title">{it.title}</p>
          <p className="rule-detail">{it.detail}</p>
        </li>
      ))}
    </ul>
  );
}

export default function RemoteResidencyChecker({ presetMode = 'domestic', presetCountry = 'PT', presetWorkState = 'NY' }: { presetMode?: Mode; presetCountry?: string; presetWorkState?: string }) {
  const [mode, setMode] = useState<Mode>(presetMode);
  const [homeState, setHome] = useState('CA');
  const [workState, setWork] = useState(presetWorkState);
  const [necessity, setNecessity] = useState(false);
  const [country, setCountry] = useState(presetCountry);
  const [fei, setFei] = useState(120000);
  const [otherIncome, setOther] = useState(0);
  const [domestic, setDomestic] = useState<ReturnType<typeof domesticResidency> | null>(null);
  const [intl, setIntl] = useState<ReturnType<typeof internationalResidency> | null>(null);
  const id = useId();

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const run = () => {
    if (mode === 'domestic') { setDomestic(domesticResidency({ homeState, workState, employerNecessity: necessity })); setIntl(null); }
    else { setIntl(internationalResidency({ country, foreignEarnedIncome: fei, otherUSIncome: otherIncome })); setDomestic(null); }
  };

  return (
    <div className="calc-panel">
      <div className="mode-toggle" role="group" aria-label="Mode">
        <button type="button" aria-pressed={mode === 'domestic'} onClick={() => { setMode('domestic'); setIntl(null); }}>Two US states</button>
        <button type="button" aria-pressed={mode === 'international'} onClick={() => { setMode('international'); setDomestic(null); }}>US company, living abroad</button>
      </div>

      {mode === 'domestic' ? (
        <div className="calc-grid">
          <div className="form-group"><label htmlFor={`${id}-home`}>State you live in</label><select id={`${id}-home`} value={homeState} onChange={(e) => setHome(e.target.value)}>{stateOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div className="form-group"><label htmlFor={`${id}-work`}>State your employer is in</label><select id={`${id}-work`} value={workState} onChange={(e) => setWork(e.target.value)}>{stateOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label className="ask-check"><input type="checkbox" checked={necessity} onChange={(e) => setNecessity(e.target.checked)} /> My employer requires me to work remotely</label>
          </div>
        </div>
      ) : (
        <div className="calc-grid">
          <div className="form-group"><label htmlFor={`${id}-cty`}>Country you'd work from</label><select id={`${id}-cty`} value={country} onChange={(e) => setCountry(e.target.value)}>{REMOTE_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
          <div className="form-group"><label htmlFor={`${id}-fei`}>Your earned income</label><input id={`${id}-fei`} type="number" min={0} value={fei} onChange={(e) => setFei(num(e.target.value))} /><p className="field-note">Salary/wages earned while abroad.</p></div>
          <div className="form-group"><label htmlFor={`${id}-oth`}>Other US income</label><input id={`${id}-oth`} type="number" min={0} value={otherIncome} onChange={(e) => setOther(num(e.target.value))} /><p className="field-note">Investments, US-source income.</p></div>
        </div>
      )}

      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={run}>Map my rules</button>
      </div>

      {domestic && <RuleList items={domestic.items} />}
      {intl && (
        <>
          {intl.feie.taxWithFeie < intl.feie.taxWithoutFeie && (
            <div className="results-box">
              <h3>Rough FEIE effect in {intl.countryName}</h3>
              <div className="result-line"><span>Excludable earned income (2026 cap {formatMoney(intl.feieLimit)})</span><span className="num">{formatMoney(intl.feie.exclusion)}</span></div>
              <div className="result-line"><span>US federal tax without the exclusion</span><span className="num">{formatMoney(intl.feie.taxWithoutFeie)}</span></div>
              <div className="result-line total"><span>US federal tax with the FEIE</span><span className="num">{formatMoney(intl.feie.taxWithFeie)}</span></div>
              <p className="results-note">An estimate, and only if you pass a residence test. Not a filing.</p>
            </div>
          )}
          <RuleList items={intl.items} />
        </>
      )}

      {(domestic || intl) && (
        <div className="callout">
          <strong>This maps the rules — it doesn't file them</strong>
          Cross-border tax is fact-specific and the penalties for getting it wrong are real. Treat this as a map of what applies, then confirm your situation with a qualified professional before you rely on it.
        </div>
      )}
      {!domestic && !intl && <div className="results-placeholder"><p>Nothing you enter is stored or sent anywhere — it runs in your browser.</p></div>}
    </div>
  );
}
