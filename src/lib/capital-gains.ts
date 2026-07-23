/**
 * Investment income tax — the shared engine behind the capital-gains, dividend,
 * interest, crypto and cost-basis calculators. One engine, many presets: each
 * page fills a different subset of the same inputs.
 *
 * Federal only for now. State capital-gains treatment is deliberately not
 * modeled here — most states tax gains as ordinary income, but Washington
 * levies a standalone 7% tax and several states grant partial LTCG exclusions,
 * and none of that is in the verified dataset yet. A state layer waits on the
 * skeleton in src/data/overrides/state-capital-gains-2026.json being filled and
 * signed off. Until then these calculators say plainly that state tax is extra.
 *
 * Every rate and threshold is read from src/data/federal.ts — the LTCG brackets,
 * the 3.8% NIIT and its four thresholds, and the $3,000 ($1,500 MFS) annual
 * capital-loss limit, all sourced there.
 */
import {
  calcFederalTax, calcLTCGTax, calcStateTax, getStandardDeduction,
} from './tax-engine';
import { federal } from '../data/federal';
import { stateCapGains } from '../data/state-capital-gains';
import { states } from '../data/states';

const CG = (federal as any).capitalGains;
const NIIT = CG.niit;

/** The NIIT MAGI threshold for a filing status. */
export function niitThreshold(status: string): number {
  if (status === 'mfj') return NIIT.thresholdMFJ;
  if (status === 'mfs') return NIIT.thresholdMFS;
  if (status === 'hoh') return NIIT.thresholdHOH;
  return NIIT.thresholdSingle;
}

/** The annual net-capital-loss deduction against ordinary income. */
function lossLimit(status: string): number {
  return status === 'mfs' ? CG.annualLossLimitMFS : CG.annualLossLimit;
}

export interface NIITResult {
  threshold: number;
  /** The amount actually hit — the lesser of net investment income and MAGI over threshold. */
  taxable: number;
  tax: number;
}

/**
 * Net Investment Income Tax: 3.8% on the LESSER of net investment income and the
 * amount by which modified AGI exceeds the status threshold. So it only bites
 * once MAGI clears the threshold, and never taxes more than the investment
 * income itself.
 */
export function calcNIIT(netInvestmentIncome: number, magi: number, status: string): NIITResult {
  const threshold = niitThreshold(status);
  const over = Math.max(0, magi - threshold);
  const taxable = Math.max(0, Math.min(Math.max(0, netInvestmentIncome), over));
  return { threshold, taxable, tax: taxable * NIIT.rate };
}

export interface InvestmentInput {
  status?: string;
  /** Ordinary income already taxed as ordinary — wages, business profit — that positions the LTCG brackets. */
  otherOrdinaryIncome?: number;
  shortTermGains?: number;
  shortTermLosses?: number;
  longTermGains?: number;
  longTermLosses?: number;
  /** Qualified dividends — taxed at the preferential LTCG rates. */
  qualifiedDividends?: number;
  /** Ordinary (non-qualified) dividends — taxed as ordinary income. */
  ordinaryDividends?: number;
  /** Taxable interest — ordinary income. */
  taxableInterest?: number;
  /** Whether to apply the standard deduction (a standalone calc) or not (a preset feeding off other income). */
  applyStandardDeduction?: boolean;
}

export interface InvestmentResult {
  status: string;
  /** Short-term gain after netting losses, taxed at ordinary rates. */
  netShortTerm: number;
  /** Long-term gain after netting losses, taxed at preferential rates. */
  netLongTerm: number;
  /** A net capital loss beyond what offsets gains this year. */
  capitalLossDeduction: number;
  capitalLossCarryover: number;
  /** Preferentially-taxed amount = net long-term gain + qualified dividends. */
  preferentialIncome: number;
  ordinaryInvestmentIncome: number;
  taxableOrdinaryIncome: number;
  /** Marginal ordinary tax attributable to the ordinary investment income only. */
  ordinaryTax: number;
  /** Full ordinary tax on all ordinary income, other income included. */
  ordinaryTaxTotal: number;
  preferentialTax: number;
  niit: NIITResult;
  /** Marginal tax on the investment income (ordinary slice + preferential + NIIT). */
  totalInvestmentTax: number;
  /** Grand total federal tax including tax on other ordinary income. */
  totalFederalTax: number;
  /** Blended rate on the investment income alone (gains + dividends + interest). */
  effectiveRateOnInvestment: number;
}

/**
 * The shared computation. Nets capital losses (within category, then across, then
 * up to the annual limit against ordinary income with the rest carried forward),
 * taxes short-term gains and non-qualified income at ordinary rates, long-term
 * gains and qualified dividends at the preferential rates stacked on top, and
 * applies the NIIT to the whole net investment income above the MAGI threshold.
 */
export function investmentTax(input: InvestmentInput): InvestmentResult {
  const status = input.status ?? 'single';
  const other = Math.max(0, input.otherOrdinaryIncome ?? 0);
  const stGains = Math.max(0, input.shortTermGains ?? 0);
  const stLosses = Math.max(0, input.shortTermLosses ?? 0);
  const ltGains = Math.max(0, input.longTermGains ?? 0);
  const ltLosses = Math.max(0, input.longTermLosses ?? 0);
  const qualDiv = Math.max(0, input.qualifiedDividends ?? 0);
  const ordDiv = Math.max(0, input.ordinaryDividends ?? 0);
  const interest = Math.max(0, input.taxableInterest ?? 0);

  // Loss netting: combine within each category, then let a loss in one category
  // offset a gain in the other, then deduct any remaining net loss against
  // ordinary income up to the annual limit and carry the rest forward.
  const stCat = stGains - stLosses;
  const ltCat = ltGains - ltLosses;
  const combined = stCat + ltCat;
  let netShortTerm = 0;
  let netLongTerm = 0;
  let capitalLossDeduction = 0;
  let capitalLossCarryover = 0;
  if (combined >= 0) {
    if (stCat >= 0 && ltCat >= 0) { netShortTerm = stCat; netLongTerm = ltCat; }
    else if (stCat < 0) { netLongTerm = Math.max(0, ltCat + stCat); }
    else { netShortTerm = Math.max(0, stCat + ltCat); }
  } else {
    const netLoss = -combined;
    capitalLossDeduction = Math.min(lossLimit(status), netLoss);
    capitalLossCarryover = netLoss - capitalLossDeduction;
  }

  // Ordinary side: other income + short-term gains + ordinary dividends +
  // interest, less any capital-loss deduction, less the standard deduction if
  // this is a standalone calculation.
  const ordinaryInvestmentIncome = netShortTerm + ordDiv + interest;
  const grossOrdinary = other + ordinaryInvestmentIncome;
  const std = input.applyStandardDeduction ? getStandardDeduction(status, false) : 0;
  const taxableOrdinaryIncome = Math.max(0, grossOrdinary - capitalLossDeduction - std);
  const ordinaryTaxAll = calcFederalTax(taxableOrdinaryIncome, status);
  // The investment share of the ordinary tax is the marginal slice the
  // short-term gains, ordinary dividends and interest add on top of other income.
  const otherTaxable = Math.max(0, other - std);
  const ordinaryTaxOther = calcFederalTax(otherTaxable, status);
  const ordinaryTax = Math.max(0, ordinaryTaxAll - ordinaryTaxOther);

  // Preferential side: long-term gains + qualified dividends, stacked on top of
  // taxable ordinary income.
  const preferentialIncome = netLongTerm + qualDiv;
  const preferentialTax = calcLTCGTax(preferentialIncome, taxableOrdinaryIncome, status);

  // NIIT on the full net investment income above the MAGI threshold. MAGI here is
  // all ordinary income plus preferential income (a close proxy — the calculators
  // do not model the handful of MAGI add-backs).
  const netInvestmentIncome = ordinaryInvestmentIncome + preferentialIncome;
  const magi = grossOrdinary + preferentialIncome;
  const niit = calcNIIT(netInvestmentIncome, magi, status);

  const totalInvestmentTax = ordinaryTax + preferentialTax + niit.tax;
  const totalFederalTax = ordinaryTaxAll + preferentialTax + niit.tax;
  const investmentBase = netInvestmentIncome;
  return {
    status,
    netShortTerm, netLongTerm,
    capitalLossDeduction, capitalLossCarryover,
    preferentialIncome, ordinaryInvestmentIncome,
    taxableOrdinaryIncome, ordinaryTax, ordinaryTaxTotal: ordinaryTaxAll,
    preferentialTax, niit,
    totalInvestmentTax, totalFederalTax,
    effectiveRateOnInvestment: investmentBase > 0 ? totalInvestmentTax / investmentBase : 0,
  };
}

/* --------------------------------- cost basis ------------------------------ */

export type LotMethod = 'fifo' | 'lifo' | 'specific' | 'average';

export interface Lot {
  /** Shares acquired in this lot. */
  shares: number;
  /** Total cost of the lot (price × shares + fees). */
  cost: number;
  /** Days held at the time of sale — >365 is long-term. */
  daysHeld: number;
  /** Marks a lot as selected, for the specific-identification method. */
  selected?: boolean;
}

export interface CostBasisResult {
  sharesSold: number;
  proceeds: number;
  basis: number;
  gain: number;
  shortTermGain: number;
  longTermGain: number;
  /** Weighted-average holding flag: true when the matched shares are all long-term. */
  allLongTerm: boolean;
}

/**
 * Cost basis and gain for a sale, under FIFO, LIFO, specific-identification or
 * average-cost lot matching. Pure arithmetic — no tax rate enters here; the gain
 * it produces is fed into investmentTax(). Long-term is more than 365 days held.
 */
export function costBasis(
  lots: Lot[], method: LotMethod, sharesToSell: number, salePricePerShare: number,
): CostBasisResult {
  const sell = Math.max(0, sharesToSell);
  const price = Math.max(0, salePricePerShare);
  const proceeds = sell * price;

  if (method === 'average') {
    const totalShares = lots.reduce((s, l) => s + l.shares, 0);
    const totalCost = lots.reduce((s, l) => s + l.cost, 0);
    const avg = totalShares > 0 ? totalCost / totalShares : 0;
    const matched = Math.min(sell, totalShares);
    const basis = matched * avg;
    const gain = matched * price - basis;
    // Average cost still tracks holding period per share; report long-term only
    // when every share in the account is long-term (the conservative reading).
    const allLong = lots.every((l) => l.daysHeld > 365);
    return {
      sharesSold: matched, proceeds: matched * price, basis, gain,
      shortTermGain: allLong ? 0 : gain, longTermGain: allLong ? gain : 0, allLongTerm: allLong,
    };
  }

  // Order the lots by the matching rule.
  let ordered = [...lots];
  if (method === 'fifo') ordered = lots.slice();          // oldest first, as entered
  else if (method === 'lifo') ordered = lots.slice().reverse();
  else if (method === 'specific') ordered = lots.filter((l) => l.selected);

  let remaining = sell;
  let basis = 0, shortTermGain = 0, longTermGain = 0, matchedShares = 0;
  for (const lot of ordered) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, lot.shares);
    const lotUnit = lot.shares > 0 ? lot.cost / lot.shares : 0;
    const lotBasis = take * lotUnit;
    const lotGain = take * price - lotBasis;
    basis += lotBasis;
    matchedShares += take;
    if (lot.daysHeld > 365) longTermGain += lotGain; else shortTermGain += lotGain;
    remaining -= take;
  }
  return {
    sharesSold: matchedShares,
    proceeds: matchedShares * price,
    basis,
    gain: matchedShares * price - basis,
    shortTermGain, longTermGain,
    allLongTerm: shortTermGain === 0 && longTermGain !== 0,
  };
}

/* ------------------------------- state layer ------------------------------- */

/**
 * Marginal state tax on an ordinary-income amount (dividends, interest, staking)
 * stacked on top of other income. Returns 0 for states with no income tax — which
 * calcStateTax already reports as zero — so the no-income-tax and Washington cases
 * fall out for free here. Capital gains are NOT ordinary-income everywhere, so
 * gains use stateGainsTax() instead.
 */
export function stateOrdinaryTaxOn(stateCode: string, otherIncome: number, amount: number, status = 'single'): number {
  if (!stateCode || amount <= 0) return 0;
  const withAmt = calcStateTax(otherIncome + amount, stateCode, undefined, status).tax;
  const without = calcStateTax(otherIncome, stateCode, undefined, status).tax;
  return Math.max(0, withAmt - without);
}

export interface StateGainsResult {
  stateTax: number;
  treatment: string;
  /** Plain-English description of how the state treats the gain. */
  note: string;
}

/**
 * State tax on capital gains, honoring each state's treatment from the
 * signed-off dataset — which the ordinary-income path cannot capture. Missouri,
 * for instance, still taxes wages but exempts capital gains (HB 594), so it is
 * 'none' here even though calcStateTax would tax ordinary income there. Washington
 * levies its 7% excise even though it has no income tax at all.
 */
export function stateGainsTax(
  stateCode: string, otherIncome: number, netShortTerm: number, netLongTerm: number, status = 'single',
): StateGainsResult {
  const rule = (stateCapGains as any)[stateCode];
  const name = states[stateCode]?.name ?? stateCode;
  const st = Math.max(0, netShortTerm);
  const lt = Math.max(0, netLongTerm);
  if (!rule) return { stateTax: 0, treatment: 'unknown', note: 'No state selected.' };

  switch (rule.treatment) {
    case 'none':
      return { stateTax: 0, treatment: 'none', note: `${name} does not tax capital gains.` };
    case 'excluded': {
      const excl = rule.ltcgExclusionPct ?? 0;
      const taxable = st + lt * (1 - excl);
      return {
        stateTax: Math.round(stateOrdinaryTaxOn(stateCode, otherIncome, taxable, status)),
        treatment: 'excluded',
        note: `${name} excludes ${Math.round(excl * 100)}% of long-term gains, then taxes the rest as income.`,
      };
    }
    case 'reduced_rate': {
      // Long-term gains at the state's preferential flat rate; short-term ordinary.
      const rate = rule.specialRate ?? 0;
      const ltTax = lt * rate;
      const stTax = stateOrdinaryTaxOn(stateCode, otherIncome, st, status);
      return {
        stateTax: Math.round(ltTax + stTax),
        treatment: 'reduced_rate',
        note: `${name} taxes long-term gains at a reduced ${(rate * 100).toFixed(2).replace(/\.?0+$/, '')}% rate; short-term as income.`,
      };
    }
    case 'special': {
      // Washington: a standalone excise on long-term gains above an exemption;
      // short-term not taxed. The extra 2.9% over $1m is flagged in the note.
      const rate = rule.specialRate ?? 0;
      const threshold = rule.specialRateThreshold ?? 0;
      const taxed = Math.max(0, lt - threshold);
      return {
        stateTax: Math.round(taxed * rate),
        treatment: 'special',
        note: `${name} levies a ${(rate * 100).toFixed(0)}% excise on long-term gains above $${threshold.toLocaleString()} (an extra 2.9% applies over $1,000,000); short-term gains are untaxed.`,
      };
    }
    default: // 'ordinary'
      return {
        stateTax: Math.round(stateOrdinaryTaxOn(stateCode, otherIncome, st + lt, status)),
        treatment: 'ordinary',
        note: `${name} taxes capital gains as ordinary income — no preferential rate.`,
      };
  }
}
