/** NegotiationGenerator — composes a ready-to-send counter-offer email. Nothing stored. */
import { useId, useState } from 'react';
import { generateNegotiation, type Situation, type Ask, type Tone } from '../../lib/negotiation';

const SITUATIONS: [Situation, string][] = [
  ['lowball', 'The offer is low for the role'],
  ['fair', 'Fair, but there’s room to improve'],
  ['competing', 'I have a competing offer'],
  ['post_layoff', 'I’m negotiating after a layoff'],
];
const ASKS: [Ask, string][] = [
  ['base', 'More base salary'],
  ['signon', 'A sign-on bonus'],
  ['start_date', 'A later start date'],
  ['remote', 'Remote / flexible work'],
];
const TONES: [Tone, string][] = [['warm', 'Warm'], ['direct', 'Direct'], ['formal', 'Formal']];

export default function NegotiationGenerator({ presetRole = '' }: { presetRole?: string }) {
  const [situation, setSituation] = useState<Situation>('fair');
  const [asks, setAsks] = useState<Ask[]>(['base']);
  const [tone, setTone] = useState<Tone>('warm');
  const [role, setRole] = useState(presetRole);
  const [mgr, setMgr] = useState('');
  const [name, setName] = useState('');
  const [currentBase, setCurrentBase] = useState(150000);
  const [targetBase, setTargetBase] = useState(165000);
  const [competingBase, setCompetingBase] = useState(0);
  const [signOn, setSignOn] = useState(0);
  const [startWeeks, setStartWeeks] = useState(2);
  const [remoteDetail, setRemoteDetail] = useState('');
  const [marketNumber, setMarketNumber] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof generateNegotiation> | null>(null);
  const [copied, setCopied] = useState('');
  const id = useId();

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
  const toggleAsk = (a: Ask) => setAsks((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  const gen = () => {
    setResult(generateNegotiation({
      situation, asks, tone, role: role.trim(), hiringManager: mgr, yourName: name,
      currentBase, targetBase, competingBase: competingBase || undefined, signOnAmount: signOn || undefined,
      delayedStartWeeks: startWeeks, remoteDetail, marketNumber: marketNumber || undefined,
    }));
    setCopied('');
  };
  const copy = (text: string, which: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(which); setTimeout(() => setCopied(''), 2000); });
  };

  return (
    <div className="calc-panel">
      <div className="calc-grid">
        <div className="form-group"><label htmlFor={`${id}-sit`}>Your situation</label><select id={`${id}-sit`} value={situation} onChange={(e) => setSituation(e.target.value as Situation)}>{SITUATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label htmlFor={`${id}-tone`}>Tone</label><select id={`${id}-tone`} value={tone} onChange={(e) => setTone(e.target.value as Tone)}>{TONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="form-group"><label htmlFor={`${id}-role`}>Role</label><input id={`${id}-role`} type="text" value={role} placeholder="e.g. Software Engineer" onChange={(e) => setRole(e.target.value)} /></div>
        <div className="form-group"><label htmlFor={`${id}-mgr`}>Hiring manager's name</label><input id={`${id}-mgr`} type="text" value={mgr} placeholder="optional" onChange={(e) => setMgr(e.target.value)} /></div>
        <div className="form-group"><label htmlFor={`${id}-name`}>Your name</label><input id={`${id}-name`} type="text" value={name} placeholder="optional" onChange={(e) => setName(e.target.value)} /></div>
        <div className="form-group"><label htmlFor={`${id}-cur`}>Current offer base</label><input id={`${id}-cur`} type="number" min={0} value={currentBase} onChange={(e) => setCurrentBase(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-tgt`}>Base you want</label><input id={`${id}-tgt`} type="number" min={0} value={targetBase} onChange={(e) => setTargetBase(num(e.target.value))} /></div>
        <div className="form-group"><label htmlFor={`${id}-mkt`}>Market number (from BLS)</label><input id={`${id}-mkt`} type="number" min={0} value={marketNumber} onChange={(e) => setMarketNumber(num(e.target.value))} /><p className="field-note">Optional. Look your role up on <a href="https://www.bls.gov/oes/current/oes_nat.htm" rel="noopener">BLS OES</a> and cite it.</p></div>
        {situation === 'competing' && <div className="form-group"><label htmlFor={`${id}-comp`}>Competing offer base</label><input id={`${id}-comp`} type="number" min={0} value={competingBase} onChange={(e) => setCompetingBase(num(e.target.value))} /></div>}
        {asks.includes('signon') && <div className="form-group"><label htmlFor={`${id}-so`}>Sign-on bonus you want</label><input id={`${id}-so`} type="number" min={0} value={signOn} onChange={(e) => setSignOn(num(e.target.value))} /></div>}
        {asks.includes('start_date') && <div className="form-group"><label htmlFor={`${id}-sw`}>Weeks to delay start</label><input id={`${id}-sw`} type="number" min={0} value={startWeeks} onChange={(e) => setStartWeeks(num(e.target.value))} /></div>}
        {asks.includes('remote') && <div className="form-group"><label htmlFor={`${id}-rd`}>Remote arrangement</label><input id={`${id}-rd`} type="text" value={remoteDetail} placeholder="e.g. two remote days a week" onChange={(e) => setRemoteDetail(e.target.value)} /></div>}
      </div>
      <fieldset className="ask-set">
        <legend>What do you want to ask for?</legend>
        {ASKS.map(([v, l]) => (
          <label key={v} className="ask-check"><input type="checkbox" checked={asks.includes(v)} onChange={() => toggleAsk(v)} /> {l}</label>
        ))}
      </fieldset>
      <div className="calc-actions">
        <button type="button" className="btn-calculate" onClick={gen}>{result ? 'Regenerate' : 'Write my email'}</button>
      </div>
      {result === null ? (<div className="results-placeholder"><p>Your details never leave your browser — the email is composed on your device.</p></div>) : (
        <>
          <div className="results-box">
            <h3>Your email</h3>
            <p className="email-subject"><strong>Subject:</strong> {result.subject}</p>
            <pre className="email-body">{result.email}</pre>
            <button type="button" className="btn-copy" onClick={() => copy(`Subject: ${result.subject}\n\n${result.email}`, 'email')}>{copied === 'email' ? 'Copied' : 'Copy email'}</button>
          </div>
          <div className="results-box">
            <h3>If they call instead — what to say</h3>
            <pre className="email-body">{result.phone}</pre>
            <button type="button" className="btn-copy" onClick={() => copy(result.phone, 'phone')}>{copied === 'phone' ? 'Copied' : 'Copy script'}</button>
          </div>
          <div className="callout">
            <strong>Before you send</strong>
            <ul>{result.notes.map((n, k) => <li key={k}>{n}</li>)}</ul>
          </div>
        </>
      )}
    </div>
  );
}
