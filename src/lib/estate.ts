/**
 * Estate tax, gift tax, and the tax treatment of an inheritance by asset type.
 *
 * The 2026 figures come from the dataset: a $15,000,000 basic exclusion, a
 * $19,000 annual gift exclusion ($194,000 to a noncitizen spouse), and a 40% top
 * rate. Nothing here is authored.
 *
 * The inheritance side refuses the "taxable or tax-free" oversimplification. An
 * inheritance is taxed entirely differently by what it is: cash is not income,
 * a brokerage account or house gets a stepped-up basis so only later gains are
 * taxed, a traditional IRA or 401(k) is fully ordinary income as withdrawn
 * (income in respect of a decedent), a Roth and a life-insurance payout are
 * tax-free. This models each.
 */
import {
  calcFederalTax, calcLTCGTax, getStandardDeduction,
} from './tax-engine';
import { federal } from '../data/federal';

const GE = (federal as any).giftAndEstate;
export const BASIC_EXCLUSION = GE.lifetimeEstateTaxExemption as number; // 15,000,000
export const ANNUAL_GIFT_EXCLUSION = GE.annualGiftExclusion as number;  // 19,000
export const NONCITIZEN_SPOUSE_EXCLUSION = GE.noncitizenSpouseAnnualExclusion as number; // 194,000
const TOP_RATE = GE.topEstateTaxRate as number; // 0.40
const TRUST_BRACKETS = (federal as any).estateAndTrustBrackets as Array<{ min: number; max: number | null; rate: number }>;

/* -------------------------------- estate ----------------------------------- */

export interface EstateResult {
  grossEstate: number;
  applicableExclusion: number;
  taxableEstate: number;
  estimatedTax: number;
  owesTax: boolean;
}

/**
 * Federal estate tax. The applicable exclusion is $15m, plus any exclusion
 * ported from a predeceased spouse (portability, up to another $15m). Because
 * an estate only owes once it clears $15m, essentially the entire taxable amount
 * sits in the 40% top bracket — the graduated rates below $1m are immaterial at
 * that size — so the tax is modeled as 40% of the taxable estate. Lifetime
 * taxable gifts already made reduce the exclusion.
 */
export function estateTax(
  grossEstate: number, priorTaxableGifts = 0, portedExclusion = 0,
): EstateResult {
  const estate = Math.max(0, grossEstate);
  const applicableExclusion = Math.max(0, BASIC_EXCLUSION + Math.max(0, portedExclusion) - Math.max(0, priorTaxableGifts));
  const taxableEstate = Math.max(0, estate - applicableExclusion);
  return {
    grossEstate: estate,
    applicableExclusion,
    taxableEstate,
    estimatedTax: Math.round(taxableEstate * TOP_RATE),
    owesTax: taxableEstate > 0,
  };
}

/* --------------------------------- gift ------------------------------------ */

export interface GiftResult {
  annualExclusion: number;
  taxablePerRecipient: number;
  totalTaxableGifts: number;
  /** A gift-tax return (Form 709) is required once any gift exceeds the annual exclusion. */
  returnRequired: boolean;
  remainingLifetimeExclusion: number;
  /** Actual gift tax is due only after lifetime taxable gifts exceed the $15m exclusion. */
  giftTaxDue: number;
}

/**
 * Gift tax on gifts of a given size to a number of recipients. Each recipient
 * gets the annual exclusion ($19,000, or $194,000 to a noncitizen spouse) tax-
 * free; only the excess is a taxable gift, which draws down the $15m lifetime
 * exclusion rather than triggering tax until that is exhausted. A return is
 * required the moment any gift exceeds the annual exclusion, even with no tax due.
 */
export function giftTax(
  giftPerRecipient: number, numRecipients: number,
  priorLifetimeTaxableGifts = 0, toNoncitizenSpouse = false,
): GiftResult {
  const gift = Math.max(0, giftPerRecipient);
  const recipients = Math.max(0, Math.floor(numRecipients));
  const annualExclusion = toNoncitizenSpouse ? NONCITIZEN_SPOUSE_EXCLUSION : ANNUAL_GIFT_EXCLUSION;
  const taxablePerRecipient = Math.max(0, gift - annualExclusion);
  const totalTaxableGifts = taxablePerRecipient * recipients;
  const priorGifts = Math.max(0, priorLifetimeTaxableGifts);
  const cumulative = priorGifts + totalTaxableGifts;
  const remaining = Math.max(0, BASIC_EXCLUSION - cumulative);
  return {
    annualExclusion,
    taxablePerRecipient,
    totalTaxableGifts,
    returnRequired: taxablePerRecipient > 0,
    remainingLifetimeExclusion: remaining,
    giftTaxDue: Math.round(Math.max(0, cumulative - BASIC_EXCLUSION) * TOP_RATE),
  };
}

/* ----------------------------- inheritance --------------------------------- */

export type InheritedAsset = 'cash' | 'brokerage' | 'property' | 'traditional_ira' | 'roth' | 'life_insurance' | 'annuity';

export interface InheritanceResult {
  assetType: InheritedAsset;
  /** The amount received tax-free at inheritance. */
  taxFreeAtInheritance: number;
  /** Taxable income this asset produces (on sale or withdrawal). */
  taxableAmount: number;
  estimatedTax: number;
  treatment: string;
}

/**
 * How an inherited asset is taxed. `value` is the amount or fair-market value at
 * the date of death; `saleOrWithdrawal` is what is later sold or withdrawn; for a
 * stepped-up asset `salePrice` is the later sale price (gain is only the post-
 * death appreciation); for an annuity `basis` is the owner's cost basis.
 */
export function inheritanceTreatment(
  assetType: InheritedAsset,
  value: number,
  otherOrdinaryIncome = 0,
  status = 'single',
  salePrice = 0,
  basis = 0,
): InheritanceResult {
  const v = Math.max(0, value);
  const std = getStandardDeduction(status, false);
  const ordinaryTaxOn = (amount: number) => {
    if (amount <= 0) return 0;
    const withAmt = calcFederalTax(Math.max(0, otherOrdinaryIncome + amount - std), status);
    const without = calcFederalTax(Math.max(0, otherOrdinaryIncome - std), status);
    return Math.max(0, withAmt - without);
  };

  switch (assetType) {
    case 'cash':
      return { assetType, taxFreeAtInheritance: v, taxableAmount: 0, estimatedTax: 0,
        treatment: 'Inherited cash is not taxable income to you. The estate, if large enough, may have owed estate tax before you received it.' };
    case 'life_insurance':
      return { assetType, taxFreeAtInheritance: v, taxableAmount: 0, estimatedTax: 0,
        treatment: 'A life-insurance death benefit is received income-tax-free by the beneficiary. Any interest paid on top of the benefit is taxable.' };
    case 'roth':
      return { assetType, taxFreeAtInheritance: v, taxableAmount: 0, estimatedTax: 0,
        treatment: 'An inherited Roth IRA is withdrawn tax-free if the account was open five years. It must generally be emptied within 10 years, but the withdrawals are not taxed.' };
    case 'brokerage':
    case 'property': {
      // Stepped-up basis: basis becomes FMV at death, so only post-death gain is taxed.
      const gain = Math.max(0, salePrice - v);
      const taxableOrdinary = Math.max(0, otherOrdinaryIncome - std);
      const tax = calcLTCGTax(gain, taxableOrdinary, status);
      return { assetType, taxFreeAtInheritance: v, taxableAmount: gain, estimatedTax: Math.round(tax),
        treatment: `Your basis is stepped up to the ${assetType === 'property' ? 'home' : "account"}'s value at the date of death, so pre-death appreciation is never taxed. Only gain above that stepped-up basis is taxed — as a long-term capital gain — when you sell.` };
    }
    case 'traditional_ira': {
      // Income in respect of a decedent: fully ordinary income as withdrawn, no step-up.
      const withdrawal = salePrice > 0 ? Math.min(salePrice, v) : v;
      return { assetType, taxFreeAtInheritance: 0, taxableAmount: withdrawal, estimatedTax: Math.round(ordinaryTaxOn(withdrawal)),
        treatment: 'An inherited traditional IRA or 401(k) is fully taxable as ordinary income as you withdraw it — there is no step-up. Most non-spouse heirs must empty it within 10 years, which can stack the income into high-tax years.' };
    }
    case 'annuity': {
      // The gain above the owner's basis is ordinary income (income in respect of a decedent).
      const gain = Math.max(0, v - Math.max(0, basis));
      return { assetType, taxFreeAtInheritance: Math.max(0, basis), taxableAmount: gain, estimatedTax: Math.round(ordinaryTaxOn(gain)),
        treatment: 'An inherited annuity is part return of the owner’s basis (tax-free) and part gain (taxable as ordinary income). There is no step-up on the gain.' };
    }
  }
}

/* --------------------------- estate/trust income (1041) -------------------- */

/** Income tax on income retained by an estate or trust, using the compressed brackets. */
export function trustIncomeTax(taxableIncome: number): number {
  let tax = 0;
  const inc = Math.max(0, taxableIncome);
  for (const b of TRUST_BRACKETS) {
    if (inc <= b.min) break;
    const top = b.max === null ? inc : Math.min(inc, b.max);
    tax += (top - b.min) * b.rate;
  }
  return Math.round(tax);
}

export interface Trust1041Result {
  totalIncome: number;
  amountDistributed: number;
  retainedIncome: number;
  /** Tax the trust pays on retained income (compressed brackets). */
  trustTax: number;
  /** Tax the beneficiary pays on the distributed income (their individual rate). */
  beneficiaryTax: number;
  totalTax: number;
  /** Tax if the trust retained everything instead of distributing. */
  taxIfAllRetained: number;
  /** Tax saved by distributing instead of retaining. */
  savingsFromDistributing: number;
}

/**
 * A Form 1041 comparison: income a trust or estate distributes to a beneficiary
 * gets a distribution deduction and is taxed to the beneficiary at their
 * (usually lower) individual rate; income it retains is taxed to the trust at the
 * compressed brackets that hit 37% at $16,000. The gap is why distributing income
 * out is the central 1041 planning move.
 */
export function estateTrust1041(
  totalIncome: number, expenses: number, amountDistributed: number,
  beneficiaryOtherIncome: number, beneficiaryStatus = 'single',
): Trust1041Result {
  const income = Math.max(0, totalIncome);
  const exp = Math.max(0, expenses);
  const distributable = Math.max(0, income - exp);
  const distributed = Math.min(Math.max(0, amountDistributed), distributable);
  const retained = Math.max(0, distributable - distributed);

  const trustTax = trustIncomeTax(retained);
  const std = getStandardDeduction(beneficiaryStatus, false);
  const benWith = calcFederalTax(Math.max(0, beneficiaryOtherIncome + distributed - std), beneficiaryStatus);
  const benWithout = calcFederalTax(Math.max(0, beneficiaryOtherIncome - std), beneficiaryStatus);
  const beneficiaryTax = Math.max(0, benWith - benWithout);

  return {
    totalIncome: income,
    amountDistributed: distributed,
    retainedIncome: retained,
    trustTax,
    beneficiaryTax: Math.round(beneficiaryTax),
    totalTax: trustTax + Math.round(beneficiaryTax),
    taxIfAllRetained: trustIncomeTax(distributable),
    savingsFromDistributing: trustIncomeTax(distributable) - (trustTax + Math.round(beneficiaryTax)),
  };
}

/* ------------------------ generation-skipping transfer --------------------- */

export interface GSTResult {
  transfer: number;
  exemptionAvailable: number;
  taxableAmount: number;
  gstTax: number;
}

/**
 * Generation-skipping transfer tax: a flat 40% on transfers to a "skip person"
 * (a grandchild or an unrelated person 37.5+ years younger) above the GST
 * exemption, which is $15,000,000 for 2026 — the same amount as the estate
 * exemption but a separate allowance. The GST tax is ON TOP of any gift or estate
 * tax on the same transfer, which the copy stresses.
 */
export function gstTax(transfer: number, priorExemptionUsed = 0): GSTResult {
  const t = Math.max(0, transfer);
  const exemptionAvailable = Math.max(0, BASIC_EXCLUSION - Math.max(0, priorExemptionUsed));
  const taxableAmount = Math.max(0, t - exemptionAvailable);
  return {
    transfer: t,
    exemptionAvailable,
    taxableAmount,
    gstTax: Math.round(taxableAmount * TOP_RATE),
  };
}
