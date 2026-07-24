/**
 * Salary-negotiation script generator (add-on task 1). Pure template engine —
 * no API, no tax data. A situation × ask × tone matrix of hand-written blocks,
 * composed into a ready-to-send email plus a short phone variant, with the
 * user's own numbers interpolated. Market figures are never invented: the tool
 * frames the ask around whatever number the user brings from BLS.
 *
 * The blocks are written to sound like a person, not a template — the whole
 * tool lives or dies on that.
 */
import { formatMoney } from './tax-engine';

export type Situation = 'lowball' | 'fair' | 'competing' | 'post_layoff';
export type Ask = 'base' | 'signon' | 'start_date' | 'remote';
export type Tone = 'warm' | 'direct' | 'formal';

export interface NegotiationInput {
  situation: Situation;
  asks: Ask[];
  tone: Tone;
  role: string;
  hiringManager?: string;
  yourName?: string;
  currentBase: number;
  targetBase: number;
  competingBase?: number;
  signOnAmount?: number;
  delayedStartWeeks?: number;
  remoteDetail?: string;
  marketNumber?: number;
}

export interface NegotiationScript {
  subject: string;
  email: string;
  phone: string;
  notes: string[];
}

const greeting = (tone: Tone, mgr: string): string =>
  tone === 'formal' ? `Dear ${mgr},` : tone === 'direct' ? `Hi ${mgr},` : `Hi ${mgr},`;

const opener = (tone: Tone, role: string): string => {
  const r = role.trim();
  const offer = r ? `the ${r} offer` : 'the offer';
  const position = r ? `the ${r} position` : 'the position';
  if (tone === 'formal') return `Thank you for the offer for ${position}. I'm genuinely excited about the role and the team, and I've read through the details carefully.`;
  if (tone === 'direct') return `Thanks for ${offer} — I'm excited about it and want to move forward. Before I sign, I'd like to talk through the compensation.`;
  return `Thank you so much for ${offer} — I'm really excited about the team and the work. I'd love to get to yes, and there's one part I'd like to discuss first.`;
};

const situationFraming = (i: NegotiationInput): string => {
  const mkt = i.marketNumber ? ` Based on market data for this role (I'm looking at around ${formatMoney(i.marketNumber)}),` : ' Based on my research and the scope of the role,';
  switch (i.situation) {
    case 'lowball':
      return `${mkt} the base is below what I'd expected for the level of the role, and I'd like to close that gap before we finalise.`;
    case 'fair':
      return `${mkt} the offer is close, and I think there's room to get it to a number that reflects the value I'll bring from day one.`;
    case 'competing':
      return i.competingBase
        ? `I want to be transparent: I have another offer at ${formatMoney(i.competingBase)} base. I'd rather be here, and matching or closing that gap would make the decision easy.`
        : `I want to be transparent that I'm considering another offer. I'd rather be here, and getting the compensation right would make the decision easy.`;
    case 'post_layoff':
      return `${mkt} I'll be direct: I'm coming off a layoff, so getting the total package right matters more than usual — but I'm evaluating this on the role, and I think there's room to align on the number.`;
  }
};

const askBlock = (i: NegotiationInput, ask: Ask): string => {
  switch (ask) {
    case 'base':
      return `On base salary, I'd like to bring it from ${formatMoney(i.currentBase)} to ${formatMoney(i.targetBase)}. That number reflects the scope of the role and the market for it, and it's where I'd feel great signing.`;
    case 'signon':
      return i.signOnAmount
        ? `A sign-on bonus of ${formatMoney(i.signOnAmount)} would help bridge the gap${i.situation === 'post_layoff' ? ' — it offsets income I lost between roles' : ''}, and it's a one-time cost rather than an ongoing one, which I know is often easier to approve.`
        : `A sign-on bonus would help bridge the gap${i.situation === 'post_layoff' ? ' and offset income I lost between roles' : ''}, and it's a one-time cost that's often easier to approve than base.`;
    case 'start_date':
      return `I'd also like to push my start date back by ${i.delayedStartWeeks ?? 2} weeks. It lets me wrap up cleanly and start fully focused, and it costs nothing to grant.`;
    case 'remote':
      return `On location, I'd like to confirm ${i.remoteDetail || 'a remote or flexible arrangement'}. It's a significant part of the total value of the role for me, and I want to make sure we're aligned before I sign.`;
  }
};

const closer = (tone: Tone): string => {
  if (tone === 'formal') return `I'm confident we can find a number that works for both of us, and I'm ready to sign as soon as we do. Thank you for considering this.`;
  if (tone === 'direct') return `If we can get there, I'm ready to sign. Happy to jump on a call if that's easier.`;
  return `I'm really hoping we can make this work — I'd love to say yes. Happy to talk it through on a call whenever suits you.`;
};

export function generateNegotiation(i: NegotiationInput): NegotiationScript {
  const mgr = i.hiringManager?.trim() || 'there';
  const name = i.yourName?.trim() || '[Your name]';
  const asks = i.asks.length ? i.asks : ['base'];

  const askLines = asks.map((a) => askBlock(i, a));
  const askSection = asks.length === 1
    ? askLines[0]
    : `There are a couple of things I'd like to discuss:\n\n${askLines.map((l) => `• ${l}`).join('\n\n')}`;

  const email = [
    greeting(i.tone, mgr),
    '',
    opener(i.tone, i.role),
    '',
    situationFraming(i),
    '',
    askSection,
    '',
    closer(i.tone),
    '',
    i.tone === 'formal' ? 'Sincerely,' : 'Best,',
    name,
  ].join('\n');

  const roleLabel = i.role?.trim();
  const subjectLead = roleLabel ? `${roleLabel} offer` : 'Your offer';
  const subject = i.situation === 'competing'
    ? `${subjectLead} — quick conversation before I sign`
    : `${subjectLead} — one thing I'd love to discuss`;

  const primary = asks[0];
  const phoneAsk = primary === 'base'
    ? `I'm excited about the offer. The one thing holding me back is base — I'm hoping we can get from ${formatMoney(i.currentBase)} to ${formatMoney(i.targetBase)}. Is there room there?`
    : primary === 'signon'
      ? `I'm excited about the offer. Would a sign-on bonus be possible to help bridge the gap? It's a one-time cost and it would make this easy to say yes to.`
      : primary === 'start_date'
        ? `I'm excited about the offer. Could we push the start date back a couple of weeks? It lets me start fully focused.`
        : `I'm excited about the offer. Can we confirm ${i.remoteDetail || 'the remote/flexible arrangement'} before I sign? It's a big part of the value for me.`;

  const phone = [
    `Thanks so much for the offer — I'm really excited about ${roleLabel ? `the ${roleLabel} role` : 'the role'}.`,
    phoneAsk,
    `[Then stop talking. Let them respond. Silence is your friend here.]`,
    i.situation === 'competing' && i.competingBase ? `If they ask: "I have another offer at ${formatMoney(i.competingBase)}, but I'd rather be here."` : `If they push back: "I understand there may be constraints — what's possible on your end?"`,
  ].join('\n\n');

  const notes: string[] = [
    'Send this by email if you want a paper trail and time to think; use the phone script if they call first.',
    'Name one number and stop. The most common mistake is over-explaining and negotiating against yourself.',
  ];
  if (!i.marketNumber) notes.push('Bring a market number: look up your role on the BLS Occupational Employment and Wage Statistics (OES) and cite it. The ask lands harder with a source behind it.');
  if (i.situation === 'post_layoff') notes.push('A sign-on framed as offsetting lost income between roles is often more approvable than base — you carried real cost during the gap.');
  if (i.asks.includes('base') && i.targetBase <= i.currentBase) notes.push('Your target base is not above the current offer — double-check the numbers, or the base ask will read oddly.');

  return { subject, email, phone, notes };
}
