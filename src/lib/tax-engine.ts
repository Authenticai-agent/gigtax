/**
 * MoneyScope — core tax engine.
 *
 * Ported verbatim from legacy/js/tax-engine.js. The calculation logic is
 * unchanged; only the module wiring is new: instead of fetching config at
 * runtime, the verified 2026 dataset is imported directly from src/data.
 * Every `data` argument defaults to that dataset. Do not alter a formula here
 * without a corresponding, sourced change in src/data.
 */
import { taxData } from '../data';
import type { TaxData } from '../data/types';

// Preserves the legacy module-global that calcSSDITaxable referenced.
const TAX_DATA = taxData;

export function formatMoney(n: number | null | undefined): string {
  if (n === undefined || n === null) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function formatPct(n: number | null | undefined): string {
  if (n === undefined || n === null) return '0%';
  return (n * 100).toFixed(1) + '%';
}

/* Federal Income Tax */
export function calcFederalTax(taxableIncome: number, status = 'single', data: any = taxData): number {
  const brackets = data.federal.brackets[status] || data.federal.brackets.single;
  let tax = 0;
  for (const b of brackets) {
    const max = b.max !== null ? b.max : Infinity;
    const taxableInBracket = Math.max(0, Math.min(taxableIncome, max) - b.min);
    if (taxableInBracket > 0) tax += taxableInBracket * b.rate;
  }
  return Math.max(0, tax);
}

/* Self-Employment Tax */
export function calcSETax(netSEIncome: number, data: any = taxData, w2WagesAlreadyTaxed = 0) {
  const se = data.federal.selfEmployment;
  const netEarnings = netSEIncome * se.netEarningsMultiplier;
  const remainingSSWageBase = Math.max(0, se.socialSecurityWageBase - w2WagesAlreadyTaxed);
  const ssTaxable = Math.min(netEarnings, remainingSSWageBase);
  const medicareTaxable = netEarnings;
  const socialSecurityTax = ssTaxable * se.socialSecurityRate;
  const medicareTax = medicareTaxable * se.medicareRate;
  const totalSE = socialSecurityTax + medicareTax;
  const deductibleHalf = totalSE * se.selfDeductionRate;
  return { totalSE, deductibleHalf, socialSecurityTax, medicareTax, netEarnings };
}

/* FICA Payroll Tax (W-2 salary, S-Corp) - no 92.35% multiplier, no deductible half */
export function calcFICA(wages: number, data: any = taxData, w2WagesAlreadyTaxed = 0) {
  const se = data.federal.selfEmployment;
  const remainingSSWageBase = Math.max(0, se.socialSecurityWageBase - w2WagesAlreadyTaxed);
  const ssTaxable = Math.min(wages, remainingSSWageBase);
  const medicareTaxable = wages;
  const socialSecurityTax = ssTaxable * se.socialSecurityRate;
  const medicareTax = medicareTaxable * se.medicareRate;
  const totalFICA = socialSecurityTax + medicareTax;
  return { totalFICA, employeeFICA: totalFICA * 0.5, employerFICA: totalFICA * 0.5, socialSecurityTax, medicareTax };
}

/* OBBBA Senior Deduction (separate from standard deduction additional amount) */
export function calcSeniorDeductionOBBBA(agi: number, status: string, data: any = taxData): number {
  const sd = data.federal.standardDeduction.seniorDeductionOBBBA;
  if (!sd) return 0;
  const maxAmount = status === 'mfj' ? sd.amountMFJ : sd.amount;
  const phaseoutStart = status === 'mfj' ? sd.phaseoutStartMFJ : sd.phaseoutStartSingle;
  if (agi <= phaseoutStart) return maxAmount;
  const excess = agi - phaseoutStart;
  const reduction = excess * sd.phaseoutRate;
  return Math.max(0, maxAmount - reduction);
}

/* Standard Deduction */
export function getStandardDeduction(status: string, age65Plus = false, data: any = taxData): number {
  let base = data.federal.standardDeduction[status] || data.federal.standardDeduction.single;
  if (age65Plus) {
    const isMarried = (status === 'mfj' || status === 'mfs');
    base += isMarried ? data.federal.standardDeduction.additionalAge65MFJ : data.federal.standardDeduction.additionalAge65Single;
  }
  return base;
}

/* QBI Deduction */
export function calcQBI(qbiIncome: number, taxableIncomeBeforeQBI: number, status: string, data: any = taxData, isSSTB = false, w2WagesPaid = 0, qualifiedPropertyBasis = 0): number {
  const qbi = data.selfEmploymentDeductions.qualifiedBusinessIncomeDeduction;
  let deduction = qbiIncome * qbi.rate;
  const phaseoutStart = status === 'mfj' ? qbi.phaseoutMFJ : qbi.phaseoutSingle;
  const phaseoutRange = status === 'mfj' ? qbi.phaseoutRangeMFJ : qbi.phaseoutRangeSingle;
  if (taxableIncomeBeforeQBI > phaseoutStart) {
    const intoPhaseout = taxableIncomeBeforeQBI - phaseoutStart;
    const pctThrough = Math.min(1, intoPhaseout / phaseoutRange);
    if (isSSTB) {
      deduction *= (1 - pctThrough);
    }
  }
  // For non-SSTBs above phase-out, apply wage/property limitation (IRC §199A(b)(2))
  // If no W-2 wages paid, the deduction is limited to $0 for high earners
  if (taxableIncomeBeforeQBI > phaseoutStart + phaseoutRange && !isSSTB) {
    const wageLimit = w2WagesPaid * 0.50;
    const altLimit = (w2WagesPaid * 0.25) + (qualifiedPropertyBasis * 0.025);
    deduction = Math.min(deduction, Math.max(wageLimit, altLimit));
  }
  deduction = Math.max(0, Math.min(deduction, taxableIncomeBeforeQBI * qbi.rate));
  return deduction;
}

/* Qualified Dividend 0% Rate Threshold */
export function getQDZeroRateThreshold(status: string, data: any = taxData): number {
  const brackets = data.federal.capitalGains.longTerm[status] || data.federal.capitalGains.longTerm.single;
  return brackets[0].max || 0; // Upper bound of 0% bracket
}

/* Child Tax Credit with Phaseout */
export function calcChildTaxCredit(childrenCount: number, agi: number, status: string, data: any = taxData): number {
  const ctc = data.federal.childTaxCredit;
  let credit = childrenCount * ctc.amountPerChild;
  const phaseoutStart = status === 'mfj' ? ctc.phaseoutStartMFJ : ctc.phaseoutStartSingle;
  if (agi > phaseoutStart) {
    const excess = agi - phaseoutStart;
    const phaseoutAmount = Math.ceil(excess / 1000) * (ctc.phaseoutRate * 1000);
    credit = Math.max(0, credit - phaseoutAmount);
  }
  return credit;
}

/* Earned Income Credit */
export function calcEIC(earnedIncome: number, investmentIncome: number, childrenCount: number, status: string, data: any = taxData): number {
  const eic = data.federal.earnedIncomeCredit;
  if (investmentIncome > eic.investmentIncomeLimit) return 0;
  const brackets = eic.brackets;
  const bracket = brackets.find((b: any) => b.children === childrenCount);
  if (!bracket) return 0;
  if (earnedIncome > bracket.incomeLimit) return 0;
  if (earnedIncome <= bracket.phaseoutStart) return bracket.maxCredit;
  // Linear phaseout from phaseoutStart to incomeLimit
  const phaseoutRange = bracket.incomeLimit - bracket.phaseoutStart;
  const intoPhaseout = earnedIncome - bracket.phaseoutStart;
  const phaseoutPct = intoPhaseout / phaseoutRange;
  return Math.max(0, Math.round(bracket.maxCredit * (1 - phaseoutPct)));
}

/* State Income Tax */
export function calcStateTax(income: number, stateCode: string, data: any = taxData, status = 'single') {
  const state = data.states[stateCode];
  if (!state) return { tax: 0, effectiveRate: 0 };
  if (state.noIncomeTax || state.type === 'none') return { tax: 0, effectiveRate: 0 };
  // Subtract state standard deduction if available (callers should pass AGI)
  const stateStd = state.standardDeduction ? (state.standardDeduction[status] || 0) : 0;
  const stateTaxable = Math.max(0, income - stateStd);
  if (state.type === 'flat') {
    let tax = stateTaxable * state.rate;
    if (state.mentalHealthSurcharge && stateTaxable > state.mentalHealthThreshold) {
      tax += (stateTaxable - state.mentalHealthThreshold) * state.mentalHealthSurcharge;
    }
    return { tax, effectiveRate: income > 0 ? tax / income : 0 };
  }
  let tax = 0;
  const brackets = (status === 'mfj' && state.brackets_mfj) ? state.brackets_mfj : (state.brackets_single || []);
  for (const b of brackets) {
    const max = b[1] !== null ? b[1] : Infinity;
    const taxableInBracket = Math.max(0, Math.min(stateTaxable, max) - b[0]);
    if (taxableInBracket > 0) tax += taxableInBracket * b[2];
  }
  if (state.mentalHealthSurcharge && stateTaxable > state.mentalHealthThreshold) {
    tax += (stateTaxable - state.mentalHealthThreshold) * state.mentalHealthSurcharge;
  }
  return { tax, effectiveRate: income > 0 ? tax / income : 0 };
}

/* SSDI Taxability (Pub 915) */
export function calcSSDITaxable(annualSSDI: number, otherAGI: number, taxExemptInterest: number, filingStatus: string) {
  const combined = otherAGI + (taxExemptInterest || 0) + (annualSSDI * 0.5);
  const tiers = (TAX_DATA as any).incomeSources.ssdi.taxability.tiers;

  // MFS living together: always 85% taxable
  if (filingStatus === 'mfs_living_together') return { taxable: annualSSDI * 0.85, combined, tier: '85% always' };

  // Read thresholds from JSON
  const statusTiers = tiers[filingStatus] || tiers.single;
  const lower = statusTiers[0].combinedIncomeMax;  // $25K single / $32K MFJ
  const upper = statusTiers[1].combinedIncomeMax;    // $34K single / $44K MFJ
  const maxPct = (TAX_DATA as any).incomeSources.ssdi.taxability.maximumTaxablePct;

  if (combined <= lower) return { taxable: 0, combined, tier: '0%' };

  let baseAmount = 0;
  if (combined > lower && combined <= upper) {
    baseAmount = Math.min(annualSSDI * 0.5, (combined - lower) * 0.5);
    return { taxable: baseAmount, combined, tier: 'up to 50%' };
  }

  const thresholdAmount = (upper - lower) * 0.5; // $4,500 single / $6,000 MFJ
  baseAmount = Math.min(annualSSDI * maxPct, (combined - upper) * maxPct + Math.min(annualSSDI * 0.5, thresholdAmount));
  return { taxable: baseAmount, combined, tier: 'up to 85%' };
}

/* ACA Subsidy */
export function calcACASubsidy(magi: number, householdSize: number, benchmarkPremium: number, data: any = taxData) {
  const fpl = data.acaSubsidy.fpl2026['persons' + Math.min(householdSize, 8)] || (data.acaSubsidy.fpl2026.persons8 + (householdSize - 8) * data.acaSubsidy.fpl2026.additionalPerPerson);
  const fplPct = magi / fpl;
  if (fplPct > 4.0) return { eligible: false, fplPct, fpl, subsidy: 0, maxPremium: 0, cliffRisk: true };
  const ap = data.acaSubsidy.applicablePercentages2026.find((a: any) => fplPct >= a.fplMin && (a.fplMax === null || fplPct < a.fplMax));
  if (!ap || ap.pct === null) return { eligible: false, fplPct, fpl, subsidy: 0, maxPremium: 0, cliffRisk: true };
  const maxPremium = magi * ap.pct / 12;
  const subsidy = Math.max(0, benchmarkPremium - maxPremium);
  const cliff400 = data.acaSubsidy.cliffThresholds400pct['persons' + Math.min(householdSize, 6)] || (data.acaSubsidy.cliffThresholds400pct.persons6 + (householdSize - 6) * data.acaSubsidy.fpl2026.additionalPerPerson);
  return { eligible: true, fplPct, fpl, subsidy: Math.round(subsidy), maxPremium: Math.round(maxPremium), cliffRisk: magi > cliff400 * 0.9 };
}

/* Entity Comparison: Sole Prop vs LLC vs S-Corp */
export function compareEntities(netProfit: number, w2Income: number, status: string, stateCode: string, data: any = taxData) {
  const stdDed = getStandardDeduction(status, false, data);

  // Sole Prop
  const se1 = calcSETax(netProfit, data, w2Income);
  const agi1 = w2Income + netProfit - se1.deductibleHalf;
  const taxableBeforeQBI1 = Math.max(0, agi1 - stdDed);
  const qbi1 = calcQBI(netProfit, taxableBeforeQBI1, status, data);
  const taxable1 = Math.max(0, taxableBeforeQBI1 - qbi1);
  const fed1 = calcFederalTax(taxable1, status, data);
  const stateRes1 = calcStateTax(agi1, stateCode, data, status);
  const total1 = fed1 + se1.totalSE + stateRes1.tax;

  // LLC (same as sole prop)
  const total2 = total1;

  // S-Corp
  const salary = Math.max(0, netProfit * 0.4);
  const distribution = Math.max(0, netProfit - salary);
  const fica3 = calcFICA(salary, data, w2Income);
  const agi3 = w2Income + salary + distribution; // S-Corp: no SE deduction on personal return
  const taxableBeforeQBI3 = Math.max(0, agi3 - stdDed);
  const qbi3 = calcQBI(distribution, taxableBeforeQBI3, status, data);
  const taxable3 = Math.max(0, taxableBeforeQBI3 - qbi3);
  const fed3 = calcFederalTax(taxable3, status, data);
  const stateRes3 = calcStateTax(agi3, stateCode, data, status);
  const total3 = fed3 + fica3.totalFICA + stateRes3.tax;

  return {
    soleProp: { totalTax: total1, fedTax: fed1, seTax: se1.totalSE, qbi: qbi1, stateTax: stateRes1.tax, afterTax: netProfit + w2Income - total1 },
    llc: { totalTax: total2, fedTax: fed1, seTax: se1.totalSE, qbi: qbi1, stateTax: stateRes1.tax, afterTax: netProfit + w2Income - total2 },
    sCorp: { totalTax: total3, fedTax: fed3, seTax: fica3.totalFICA, qbi: qbi3, stateTax: stateRes3.tax, afterTax: netProfit + w2Income - total3, salary, distribution }
  };
}

/* Capital Gains Tax (short-term taxed as ordinary, long-term at preferential rates) */
export function calcCapitalGains(shortTermProceeds: number, shortTermBasis: number, longTermProceeds: number, longTermBasis: number, taxableIncomeBeforeCG: number, status: string, data: any = taxData) {
  const shortTermGain = Math.max(0, shortTermProceeds - shortTermBasis);
  const longTermGain = Math.max(0, longTermProceeds - longTermBasis);
  const totalGain = shortTermGain + longTermGain;
  const brackets = data.federal.capitalGains.longTerm[status] || data.federal.capitalGains.longTerm.single;

  // Short-term: taxed at ordinary rates (already included in taxable income)
  const shortTermTax = calcFederalTax(taxableIncomeBeforeCG + shortTermGain, status, data) - calcFederalTax(taxableIncomeBeforeCG, status, data);

  // Long-term: preferential rates - brackets stack on top of ordinary income + short-term gains
  const taxableBeforeLT = taxableIncomeBeforeCG + shortTermGain;
  let longTermTax = 0;
  const cgBrackets = brackets;
  for (let i = 0; i < cgBrackets.length; i++) {
    const b = cgBrackets[i];
    const min = b.min, max = b.max, rate = b.rate;
    if (taxableBeforeLT + longTermGain <= min) break;
    const bracketStart = Math.max(min, taxableBeforeLT);
    const bracketEnd = max !== null ? Math.min(max, taxableBeforeLT + longTermGain) : taxableBeforeLT + longTermGain;
    if (bracketEnd > bracketStart) {
      longTermTax += (bracketEnd - bracketStart) * rate;
    }
  }

  // NIIT (Net Investment Income Tax) - 3.8% above threshold
  const niit = data.federal.capitalGains.niit;
  const niitThreshold = status === 'mfj' ? niit.thresholdMFJ : niit.thresholdSingle;
  const niitTaxable = Math.max(0, Math.min(shortTermGain + longTermGain, Math.max(0, taxableIncomeBeforeCG + totalGain - niitThreshold)));
  const niitTax = niitTaxable * niit.rate;

  return { shortTermGain, longTermGain, totalGain, shortTermTax, longTermTax, niitTax, totalCGTax: shortTermTax + longTermTax + niitTax };
}

/* Long-Term Capital Gains Tax (standalone, given pre-computed LTCG gain) */
export function calcLTCGTax(ltcgGain: number, taxableOrdinaryIncome: number, status: string, data: any = taxData): number {
  const brackets = data.federal.capitalGains.longTerm[status] || data.federal.capitalGains.longTerm.single;
  let tax = 0;
  const cgStart = taxableOrdinaryIncome;
  const cgEnd = taxableOrdinaryIncome + ltcgGain;
  for (const b of brackets) {
    if (cgEnd <= b.min) break;
    const segStart = Math.max(b.min, cgStart);
    const segEnd = b.max !== null ? Math.min(b.max, cgEnd) : cgEnd;
    if (segEnd > segStart) {
      tax += (segEnd - segStart) * b.rate;
    }
  }
  return tax;
}

/* Stock Options Tax (simplified) */
export function calcOptionsTax(isoShares: number, isoExercisePrice: number, isoFMV: number, nsoShares: number, nsoExercisePrice: number, nsoFMV: number, status: string, data: any = taxData) {
  // ISO: No regular tax at exercise, but AMT adjustment = (FMV - exercisePrice) * shares
  const isoBargain = Math.max(0, isoFMV - isoExercisePrice) * isoShares;
  // NSO: Ordinary income at exercise = (FMV - exercisePrice) * shares
  const nsoOrdinary = Math.max(0, nsoFMV - nsoExercisePrice) * nsoShares;
  return { isoBargainElement: isoBargain, nsoOrdinaryIncome: nsoOrdinary, totalCompensationIncome: nsoOrdinary };
}

/* Quarterly Estimated Tax */
export function calcQuarterly(annualTax: number, priorYearTax: number, priorYearAGI: number, data: any = taxData) {
  const safeHarbor = (priorYearAGI > 150000) ? priorYearTax * 1.10 : priorYearTax;
  // If no prior year tax (first year filer), use 90% of current year
  const target = priorYearTax > 0 ? Math.min(annualTax * 0.90, safeHarbor) : annualTax * 0.90;
  const q = data.federal.quarterlyEstimated.quarters;
  return { target, perQuarter: target / 4, quarters: q, safeHarbor };
}

/* 1099-K Reconciliation */
export function reconcile1099K(gross1099K: number, platformFees: number, refunds: number, shippingCharged: number, cogs: number, otherDeductions: number) {
  const net = gross1099K - platformFees - refunds - shippingCharged - cogs - otherDeductions;
  return { gross: gross1099K, netTaxable: Math.max(0, net), deductions: platformFees + refunds + shippingCharged + cogs + otherDeductions };
}

/* Brand Deal Calculator */
export function calcBrandDeal(dealAmount: number, otherIncome: number, deductions: number, status: string, stateCode: string, data: any = taxData) {
  const netSE = dealAmount - deductions;
  const se = calcSETax(netSE, data);
  const agi = otherIncome + netSE - se.deductibleHalf;
  const stdDed = getStandardDeduction(status, false, data);
  const taxableBeforeQBI = Math.max(0, agi - stdDed);
  const qbi = calcQBI(netSE, taxableBeforeQBI, status, data);
  const taxable = Math.max(0, taxableBeforeQBI - qbi);
  const fed = calcFederalTax(taxable, status, data);
  const stateRes = calcStateTax(agi, stateCode, data, status);
  const totalTax = fed + se.totalSE + stateRes.tax;
  return { dealAmount, netSE, seTax: se.totalSE, qbi, fedTax: fed, stateTax: stateRes.tax, totalTax, afterTax: dealAmount - totalTax, setAsidePct: dealAmount > 0 ? totalTax / dealAmount : 0 };
}

/* Combined W-2 + SE Calculator */
export function calcCombined(w2Income: number, seGross: number, seDeductions: number, status: string, stateCode: string, data: any = taxData, age65 = false) {
  const netSE = Math.max(0, seGross - seDeductions);
  const se = calcSETax(netSE, data, w2Income);
  const totalIncome = w2Income + netSE;
  const agi = totalIncome - se.deductibleHalf;
  const stdDed = getStandardDeduction(status, age65, data);
  const taxableBeforeQBI = Math.max(0, agi - stdDed);
  const qbi = calcQBI(netSE, taxableBeforeQBI, status, data);
  const taxable = Math.max(0, taxableBeforeQBI - qbi);
  const fed = calcFederalTax(taxable, status, data);
  const stateRes = calcStateTax(agi, stateCode, data, status);
  const totalTax = fed + se.totalSE + stateRes.tax;
  const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0;
  return { w2Income, netSE, totalIncome, agi, taxableBeforeQBI, taxable, qbi, fedTax: fed, seTax: se.totalSE, stateTax: stateRes.tax, totalTax, effectiveRate, afterTax: totalIncome - totalTax };
}

/* Deductions Builder */
export function buildDeductionsList(profileKey: string, data: any = taxData): string[] {
  const all: string[] = [];
  const p = data.platforms;
  for (const cat of Object.values(p) as any[]) {
    if (cat[profileKey]) {
      const item = cat[profileKey];
      if (item.keyDeductions) all.push(...item.keyDeductions);
      if (item.keyDeductions_ifBusiness) all.push(...item.keyDeductions_ifBusiness);
      if (item.keyDeductions_if1099) all.push(...item.keyDeductions_if1099);
    }
  }
  return [...new Set(all)];
}

/* S-Corp Salary Optimizer */
export function optimizeSCorpSalary(netProfit: number, w2Income: number, status: string, stateCode: string, data: any = taxData, payrollAdminCost = 0) {
  const results = [];
  const stdDed = getStandardDeduction(status, false, data);
  for (let pct = 20; pct <= 60; pct += 5) {
    const salary = netProfit * (pct / 100);
    const fica = calcFICA(salary, data, w2Income);
    const dist = Math.max(0, netProfit - salary - fica.employerFICA - payrollAdminCost);
    const agi = w2Income + salary + dist; // S-Corp: no SE deduction on personal return
    const taxableBeforeQBI = Math.max(0, agi - stdDed);
    // QBI is based on S-Corp qualified business income (net profit minus reasonable compensation)
    const qbi = calcQBI(netProfit - salary, taxableBeforeQBI, status, data);
    const taxable = Math.max(0, taxableBeforeQBI - qbi);
    const fed = calcFederalTax(taxable, status, data);
    const stateRes = calcStateTax(agi, stateCode, data, status);
    const total = fed + fica.totalFICA + stateRes.tax + payrollAdminCost;
    results.push({ pct, salary, distribution: dist, totalTax: total, fedTax: fed, seTax: fica.totalFICA, stateTax: stateRes.tax, qbi, payrollAdminCost });
  }
  const best = results.reduce((a, b) => a.totalTax < b.totalTax ? a : b);
  return { results, best };
}

/* Delaware Franchise Tax */
export function calcDelawareFranchiseTax(authorizedShares: number, grossAssets: number, issuedShares: number, isLargeCorp = false, data: any = taxData) {
  const ft = data.entityTypes.delawareCCorp.franchiseTax;
  const maxCap = isLargeCorp ? ft.authorizedSharesMethod.maximum_largeCorporateFiler : ft.authorizedSharesMethod.maximum_standard;
  const sched = ft.authorizedSharesMethod.schedule;
  let authMethod = sched['5000_or_fewer_shares'];
  if (authorizedShares > 5000) {
    if (authorizedShares <= 10000) authMethod = sched['5001_to_10000_shares'];
    else {
      const extraBlocks = Math.ceil((authorizedShares - 10000) / 10000);
      authMethod = sched['5001_to_10000_shares'] + extraBlocks * sched['each_additional_10000_shares'];
    }
  }
  authMethod = Math.min(authMethod, maxCap);
  const apv = ft.assumedParValueMethod;
  // Proper Delaware APV formula: (grossAssets / issuedShares * authorizedShares / 1,000,000) * rate
  const assumedParValue = issuedShares > 0 ? grossAssets / issuedShares : 0;
  const assumedParValueCapital = assumedParValue * authorizedShares;
  const units = Math.ceil(assumedParValueCapital / 1000000);
  const parValueMethod = Math.max(apv.minimum, units * apv.ratePerMillionGrossAssets);
  const parCap = isLargeCorp ? apv.maximum_largeCorporateFiler : apv.maximum_standard;
  const parCapped = Math.min(parValueMethod, parCap || maxCap);
  return { authMethod, parValueMethod: parCapped, best: Math.min(authMethod, parCapped), filingFee: ft.annual_report_fee_nonexempt };
}

export const TaxEngine = {
  formatMoney, formatPct,
  calcFederalTax, calcSETax, calcFICA, getStandardDeduction, calcQBI,
  calcStateTax, calcSSDITaxable, calcACASubsidy,
  getQDZeroRateThreshold, calcChildTaxCredit, calcSeniorDeductionOBBBA, calcEIC,
  calcCapitalGains, calcLTCGTax, calcOptionsTax,
  compareEntities, calcQuarterly, reconcile1099K,
  calcBrandDeal, calcCombined, buildDeductionsList,
  optimizeSCorpSalary, calcDelawareFranchiseTax,
};

export type { TaxData };
