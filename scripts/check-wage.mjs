/**
 * Parity tests for the Phase 8 ports (wage.ts and withholding.ts).
 *
 * The legacy math for these calculators lives inside the app.js view functions,
 * which do DOM work and cannot be run in a sandbox. So parity is against a
 * faithful transcription of each legacy formula, checked on at least three
 * input sets per calculator — the same standard the guardrail asks for, applied
 * where the source cannot be executed directly.
 *
 *   node scripts/check-wage.mjs
 */
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

async function load(entry) {
  const out = await build({ entryPoints: [entry], bundle: true, format: 'esm', write: false, platform: 'node', loader: { '.json': 'json' } });
  const path = `/tmp/${entry.split('/').pop().replace('.ts', '')}.mjs`;
  writeFileSync(path, out.outputFiles[0].text);
  return import(path);
}
const wage = await load('src/lib/wage.ts');
const wh = await load('src/lib/withholding.ts');
const ms = await load('src/lib/multi-state.ts');
const mar = await load('src/lib/marriage.ts');
const cg = await load('src/lib/capital-gains.ts');
const cr = await load('src/lib/credits.ts');
const ge = await load('src/lib/gig-economics.ts');
const sb = await load('src/lib/se-business.ts');
const gam = await load('src/lib/gambling.ts');
const est = await load('src/lib/estate.ts');
const rent = await load('src/lib/rental.ts');
const rp = await load('src/lib/retirement-planning.ts');
const fe = await load('src/lib/feie.ts');
const wd = await load('src/lib/work-decisions.ts');
const te = await load('src/lib/tax-engine.ts');

let pass = 0, fail = 0;
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

/* --------- overtime: legacy California daily+weekly, federal weekly --------- */
console.log('\novertimePay');
{
  const days = [['Mon', 10], ['Tue', 10], ['Wed', 10], ['Thu', 10], ['Fri', 8]].map(([day, hours]) => ({ day, hours }));
  // Legacy CA transcription: daily OT over 8, then weekly over 40.
  const legacyCA = () => {
    let reg = 0, ot = 0, wk = 0;
    for (const d of days) {
      const dr = Math.min(d.hours, 8), dot = d.hours - dr;
      const rem = Math.max(0, 40 - wk), r = Math.min(dr, rem), wot = dr - r;
      reg += r; ot += dot + wot; wk += r;
    }
    return { reg, ot };
  };
  const L = legacyCA();
  const r = wage.overtimePay(days, 25, 1.5, 'california');
  ok('CA daily+weekly regular hours match legacy', near(r.regularHours, L.reg, 0.01), `${r.regularHours} vs ${L.reg}`);
  ok('CA overtime hours match legacy', near(r.overtimeHours, L.ot, 0.01), `${r.overtimeHours} vs ${L.ot}`);
  ok('CA pay = reg×25 + ot×37.5', near(r.totalPay, L.reg * 25 + L.ot * 37.5));

  // Federal: 48 hours in the week -> 40 reg, 8 ot.
  const fed = wage.overtimePay(days, 25, 1.5, 'federal');
  ok('federal 48h week -> 40 reg / 8 ot', fed.regularHours === 40 && near(fed.overtimeHours, 8));
}

/* --------------------------- hourly to salary ------------------------------ */
console.log('\nhourlyToSalary');
{
  const cases = [
    { rate: 30, hours: 40, weeks: 52, otMult: 1.5, ot: 0, unpaid: 0, bonus: 0, other: 0 },
    { rate: 25, hours: 40, weeks: 52, otMult: 1.5, ot: 5, unpaid: 2, bonus: 3000, other: 0 },
    { rate: 50, hours: 36, weeks: 50, otMult: 2, ot: 0, unpaid: 0, bonus: 0, other: 5000 },
  ];
  for (const [i, c] of cases.entries()) {
    const ew = c.weeks - c.unpaid;
    const legacy = c.rate * c.hours * ew + c.rate * c.otMult * c.ot * ew + c.bonus + c.other;
    const r = wage.hourlyToSalary(c.rate, c.hours, c.weeks, c.otMult, c.ot, c.unpaid, c.bonus, c.other);
    ok(`hourly->salary case ${i + 1} annual matches legacy`, near(r.annual, legacy), `${r.annual} vs ${legacy}`);
  }
  ok('salaryToHourly inverts a clean 40h year', near(wage.salaryToHourly(62400, 40, 52), 30, 0.01));
}

/* --------------------------------- raise ----------------------------------- */
console.log('\nraise');
{
  const cases = [[60000, 68000, 3], [80000, 78000, 3.5], [100000, 110000, 4]];
  for (const [oldS, newS, inf] of cases) {
    const legacyPct = ((newS - oldS) / oldS) * 100;
    const legacyTarget = oldS * (1 + inf / 100);
    const r = wage.raise(oldS, newS, inf);
    ok(`raise ${oldS}->${newS} percent matches legacy`, near(r.percentChange, legacyPct, 0.01), `${r.percentChange} vs ${legacyPct}`);
    ok(`raise ${oldS}->${newS} vs-inflation matches legacy`, near(r.vsInflation, newS - legacyTarget));
  }
}

/* --------------------------------- bonus ----------------------------------- */
console.log('\nbonusTax');
{
  const cases = [
    { bonus: 10000, salary: 60000, state: 'OH' },
    { bonus: 25000, salary: 200000, state: 'CA' },
    { bonus: 5000, salary: 45000, state: 'TX' },
  ];
  for (const [i, c] of cases.entries()) {
    const r = wh.bonusTax(c.bonus, c.salary, c.state, 'single');
    // Flat federal is legacy's 22% on the bonus, exactly.
    ok(`bonus case ${i + 1} flat federal = 22% of bonus`, near(r.flat.federal, c.bonus * 0.22));
    // Aggregate never withholds more federal than a top-bracket rate would.
    ok(`bonus case ${i + 1} aggregate federal is a marginal delta`, r.aggregate.federal >= 0 && r.aggregate.federal <= c.bonus * 0.37 + 1);
    ok(`bonus case ${i + 1} FICA and state identical across methods`, r.flat.fica === r.aggregate.fica && r.flat.state === r.aggregate.state);
  }
  // At a high salary the marginal rate beats 22%, so flat withholds less -> keeps more now.
  const high = wh.bonusTax(20000, 300000, 'TX', 'single');
  ok('high earner keeps more under the flat method', high.keepsMore === 'flat', `${high.keepsMore}`);
}

/* -------------------------------- W-4 check -------------------------------- */
console.log('\nw4Check');
{
  const r = wh.w4Check(80000, 900, 26, 'OH', 'single');
  ok('W-4 withheld-for-year = perCheck × periods', near(r.withheldForYear, 900 * 26));
  ok('W-4 difference = withheld − projected tax', near(r.difference, r.withheldForYear - r.totalTaxForYear));
  ok('W-4 flags a refund when over-withheld', wh.w4Check(80000, 1500, 26, 'OH', 'single').status === 'refund');
  ok('W-4 flags a bill when under-withheld', wh.w4Check(80000, 200, 26, 'OH', 'single').status === 'owe');
}

/* ------------------------------ W-2 vs 1099 -------------------------------- */
console.log('\ncompareOffers');
{
  const r = wh.compareOffers(
    { salary: 85000, employerHealth: 8000, match401kPct: 4, ptoWeeks: 3 },
    { income: 95000, deductions: 8000, healthCost: 6000, solo401k: 10000 },
    'OH', 'single',
  );
  ok('W-2 total value exceeds its salary (benefits counted)', r.w2TotalValue > 85000, `${Math.round(r.w2TotalValue)}`);
  ok('both take-home figures are positive', r.w2TakeHome > 0 && r.c1099TakeHome > 0);
  ok('a winner is chosen', ['w2', '1099', 'even'].includes(r.winner));
  // Break-even 1099 gross reproduces the W-2 take-home within a dollar.
  const atBreakEven = wh.compareOffers(
    { salary: 85000 }, { income: r.breakEven1099, deductions: 8000, healthCost: 6000, solo401k: 10000 }, 'OH', 'single',
  );
  ok('break-even 1099 gross matches the W-2 take-home', near(atBreakEven.c1099TakeHome, r.w2TakeHome, 200), `${Math.round(atBreakEven.c1099TakeHome)} vs ${Math.round(r.w2TakeHome)}`);
}

/* ------------------------------ multi-state -------------------------------- */
// Parity is against a transcription of multiStateCalculatorView's composition,
// run through the ported engine (whose sub-functions check-engine-parity.mjs
// already pins to legacy). With no resident state, re-sourcing is off and the
// result must match the legacy engine line for line.
console.log('\nmultiStateTax');
{
  const legacyMulti = (totalW2, gross1099, deductions, status, age65, dependents, entries) => {
    const netSE = Math.max(0, gross1099 - deductions);
    const se = te.calcSETax(netSE, undefined, totalW2, status);
    const totalIncome = totalW2 + netSE;
    const agi = totalIncome - se.deductibleHalf;
    const stdDed = te.getStandardDeduction(status, age65);
    const tb = Math.max(0, agi - stdDed);
    const qbi = te.calcQBI(netSE, tb, status);
    const taxable = Math.max(0, tb - qbi);
    const fed = te.calcFederalTax(taxable, status);
    const ctc = Math.min(te.calcChildTaxCredit(dependents, agi, status), fed);
    const eic = te.calcEIC(totalIncome, 0, dependents, status);
    const fedAfter = Math.max(0, fed - ctc - eic);
    let totalState = 0;
    for (const e of entries) {
      const si = e.w2 + e.se1099;
      const sd = totalIncome > 0 ? deductions * (si / totalIncome) : 0;
      const sne = Math.max(0, e.se1099 - sd);
      const sse = sne > 0 ? te.calcSETax(sne, undefined, e.w2, status) : { deductibleHalf: 0 };
      const sagi = si - sse.deductibleHalf;
      totalState += te.calcStateTax(sagi, e.code, undefined, status).tax;
    }
    return { fedAfter, seTax: se.totalSE, totalState, total: fedAfter + se.totalSE + totalState };
  };
  const cases = [
    { totalW2: 85000, total1099: 25000, totalDeductions: 5000, status: 'single', dependents: 0,
      states: [{ code: 'CA', w2: 50000, se1099: 15000 }, { code: 'NY', w2: 35000, se1099: 10000 }] },
    { totalW2: 0, total1099: 120000, totalDeductions: 20000, status: 'mfj', dependents: 2,
      states: [{ code: 'TX', w2: 0, se1099: 70000 }, { code: 'CO', w2: 0, se1099: 50000 }] },
    { totalW2: 140000, total1099: 0, totalDeductions: 0, status: 'hoh', dependents: 1,
      states: [{ code: 'OH', w2: 90000, se1099: 0 }, { code: 'PA', w2: 50000, se1099: 0 }] },
  ];
  for (const [i, c] of cases.entries()) {
    const L = legacyMulti(c.totalW2, c.total1099, c.totalDeductions, c.status, false, c.dependents, c.states);
    const r = ms.multiStateTax(c);
    ok(`multi-state case ${i + 1} total tax matches legacy composition`, near(r.totalTax, L.total), `${Math.round(r.totalTax)} vs ${Math.round(L.total)}`);
    ok(`multi-state case ${i + 1} federal-after-credits matches`, near(r.federalAfterCredits, L.fedAfter));
    ok(`multi-state case ${i + 1} total state tax matches`, near(r.totalStateTax, L.totalState));
  }
  // Reciprocity: resident IL, wages earned in WI (a reciprocity partner) are
  // re-sourced to IL, so WI keeps no wage tax and a note is emitted.
  const recip = ms.multiStateTax({
    totalW2: 60000, total1099: 0, totalDeductions: 0, status: 'single', dependents: 0,
    residentState: 'IL',
    states: [{ code: 'WI', w2: 60000, se1099: 0 }],
  });
  const wiCol = recip.states.find((s) => s.code === 'WI');
  ok('reciprocity re-sources WI wages away and emits a note', recip.reciprocityNotes.length > 0 && (!wiCol || wiCol.income === 0), JSON.stringify(recip.states.map((s) => s.code)));
  const ilCol = recip.states.find((s) => s.code === 'IL');
  ok('reciprocity taxes the re-sourced wages in the resident state (IL)', !!ilCol && ilCol.tax > 0);
}

/* ------------------------------- marriage ---------------------------------- */
// Parity against a transcription of marriagePenaltyView's composition. The one
// intentional deviation from legacy — using the engine's child tax credit so its
// income phase-out applies, instead of a flat per-child amount — is mirrored in
// the transcription, so the test pins the wiring, and the behavioural checks pin
// the penalty/bonus direction.
console.log('\nmarriageTax');
{
  const legacyMarriage = (aIncome, bIncome, state, dependents, a401k = 0, b401k = 0) => {
    const totalIncome = aIncome + bIncome;
    const aFica = te.calcFICA(aIncome).employeeFICA, bFica = te.calcFICA(bIncome).employeeFICA;
    const aStd = te.getStandardDeduction('single', false), bStd = te.getStandardDeduction('single', false);
    const aTaxable = Math.max(0, aIncome - a401k - aStd), bTaxable = Math.max(0, bIncome - b401k - bStd);
    const aFed = te.calcFederalTax(aTaxable, 'single'), bFed = te.calcFederalTax(bTaxable, 'single');
    const aState = te.calcStateTax(aIncome - a401k, state, undefined, 'single').tax || 0;
    const bState = te.calcStateTax(bIncome - b401k, state, undefined, 'single').tax || 0;
    const higherAGI = Math.max(aIncome - a401k, bIncome - b401k);
    const singleCTC = Math.min(te.calcChildTaxCredit(dependents, higherAGI, 'single'), aFed + bFed);
    const singleTotal = aFed + bFed + aState + bState + aFica + bFica - singleCTC;
    const mfjStd = te.getStandardDeduction('mfj', false);
    const mfjTaxable = Math.max(0, totalIncome - a401k - b401k - mfjStd);
    const mfjFed = te.calcFederalTax(mfjTaxable, 'mfj');
    const mfjState = te.calcStateTax(totalIncome - a401k - b401k, state, undefined, 'mfj').tax || 0;
    const mfjCTC = Math.min(te.calcChildTaxCredit(dependents, totalIncome - a401k - b401k, 'mfj'), mfjFed);
    const mfjTotal = mfjFed + mfjState + aFica + bFica - mfjCTC;
    return { singleTotal, mfjTotal, diff: mfjTotal - singleTotal };
  };
  const cases = [
    [85000, 55000, 'CA', 0], [300000, 280000, 'NY', 2], [180000, 20000, 'TX', 1],
  ];
  for (const [i, c] of cases.entries()) {
    const [a, b, st, deps] = c;
    const L = legacyMarriage(a, b, st, deps);
    const r = mar.marriageTax({ incomeA: a, incomeB: b, stateCode: st, dependents: deps });
    ok(`marriage case ${i + 1} single total matches transcription`, near(r.single.totalTax, L.singleTotal), `${Math.round(r.single.totalTax)} vs ${Math.round(L.singleTotal)}`);
    ok(`marriage case ${i + 1} MFJ total matches transcription`, near(r.mfj.totalTax, L.mfjTotal));
    ok(`marriage case ${i + 1} penalty/bonus difference matches`, near(r.difference, L.diff));
  }
  // Two high, near-equal earners -> a penalty (upper brackets are not doubled).
  ok('near-equal high earners get a marriage penalty', mar.marriageTax({ incomeA: 300000, incomeB: 280000, stateCode: 'NY' }).outcome === 'penalty');
  // One large, one small income -> a bonus (income spreads across wide MFJ brackets).
  ok('a lopsided couple gets a marriage bonus', mar.marriageTax({ incomeA: 180000, incomeB: 20000, stateCode: 'TX' }).outcome === 'bonus');
  // FICA cancels: adding identical FICA to both sides cannot change the difference.
  ok('FICA does not affect the penalty/bonus', near(
    mar.marriageTax({ incomeA: 90000, incomeB: 90000, stateCode: 'PA' }).difference,
    legacyMarriage(90000, 90000, 'PA', 0).diff,
  ));
}

/* ------------------------- capital gains engine ---------------------------- */
console.log('\ninvestmentTax');
{
  // NIIT is 0 below the threshold, so at these incomes investmentTax's total
  // federal tax equals the crypto view's federal composition — but with the
  // engine's dataset-backed LTCG brackets, not the legacy view's stale hardcoded
  // ones (the documented staleness fix). Cases stay under $200k so NIIT is off.
  const cryptoLegacyFed = (stGain, ltGain, stLoss, ltLoss, staking, nft, otherW2, status) => {
    const netST = Math.max(0, stGain - stLoss);
    const netLT = Math.max(0, ltGain - ltLoss);
    const ordinary = staking + nft + otherW2 + netST;
    const std = te.getStandardDeduction(status, false);
    const taxableOrdinary = Math.max(0, ordinary - std);
    const fedOrdinary = te.calcFederalTax(taxableOrdinary, status);
    const fedLT = te.calcLTCGTax(netLT, taxableOrdinary, status); // corrected LTCG
    return fedOrdinary + fedLT;
  };
  const cases = [
    { stGain: 5000, ltGain: 15000, stLoss: 0, ltLoss: 0, staking: 2000, nft: 0, otherW2: 40000, status: 'single' },
    { stGain: 0, ltGain: 30000, stLoss: 0, ltLoss: 0, staking: 0, nft: 3000, otherW2: 60000, status: 'mfj' },
    { stGain: 8000, ltGain: 0, stLoss: 1000, ltLoss: 0, staking: 500, nft: 0, otherW2: 30000, status: 'hoh' },
  ];
  for (const [i, c] of cases.entries()) {
    const L = cryptoLegacyFed(c.stGain, c.ltGain, c.stLoss, c.ltLoss, c.staking, c.nft, c.otherW2, c.status);
    const r = cg.investmentTax({
      status: c.status, otherOrdinaryIncome: c.otherW2 + c.staking,
      shortTermGains: c.stGain + c.nft, shortTermLosses: c.stLoss,
      longTermGains: c.ltGain, longTermLosses: c.ltLoss, applyStandardDeduction: true,
    });
    ok(`crypto case ${i + 1} total federal matches corrected composition`, near(r.totalFederalTax, L, 1), `${Math.round(r.totalFederalTax)} vs ${Math.round(L)}`);
    ok(`crypto case ${i + 1} NIIT is zero below the threshold`, r.niit.tax === 0);
  }
  // 0% LTCG bracket: a low-income single filer pays no tax on a long-term gain.
  const zero = cg.investmentTax({ status: 'single', otherOrdinaryIncome: 20000, longTermGains: 5000, applyStandardDeduction: true });
  ok('low-income long-term gain is taxed at 0%', zero.preferentialTax === 0);
  // Qualified dividends beat ordinary dividends at the same amount and income.
  const q = cg.investmentTax({ status: 'single', otherOrdinaryIncome: 90000, qualifiedDividends: 10000, applyStandardDeduction: true });
  const o = cg.investmentTax({ status: 'single', otherOrdinaryIncome: 90000, ordinaryDividends: 10000, applyStandardDeduction: true });
  ok('qualified dividends are taxed less than ordinary dividends', q.totalInvestmentTax < o.totalInvestmentTax, `${Math.round(q.totalInvestmentTax)} vs ${Math.round(o.totalInvestmentTax)}`);
  // Capital-loss limit: a big net loss deducts $3,000 and carries the rest over.
  const loss = cg.investmentTax({ status: 'single', shortTermLosses: 10000, longTermGains: 0 });
  ok('net capital loss deducts $3,000 this year', near(loss.capitalLossDeduction, 3000));
  ok('net capital loss carries $7,000 forward', near(loss.capitalLossCarryover, 7000));
  const lossMFS = cg.investmentTax({ status: 'mfs', shortTermLosses: 10000 });
  ok('MFS capital-loss deduction is $1,500', near(lossMFS.capitalLossDeduction, 1500));
  // NIIT: a high earner with investment income pays 3.8% above the threshold.
  const niit = cg.investmentTax({ status: 'single', otherOrdinaryIncome: 250000, longTermGains: 40000, applyStandardDeduction: true });
  ok('NIIT applies above the MAGI threshold', niit.niit.tax > 0 && near(niit.niit.tax, 40000 * 0.038, 1), `${Math.round(niit.niit.tax)}`);
}

/* ------------------------------- cost basis -------------------------------- */
console.log('\ncostBasis');
{
  // Two lots: 100 @ $10 (long-term), then 100 @ $20 (short-term). Sell 100 @ $30.
  const lots = [
    { shares: 100, cost: 1000, daysHeld: 400 },  // long-term, $10/sh
    { shares: 100, cost: 2000, daysHeld: 100 },  // short-term, $20/sh
  ];
  const fifo = cg.costBasis(lots, 'fifo', 100, 30);
  ok('FIFO sells the oldest lot (basis $1,000)', near(fifo.basis, 1000) && near(fifo.longTermGain, 2000) && fifo.shortTermGain === 0);
  const lifo = cg.costBasis(lots, 'lifo', 100, 30);
  ok('LIFO sells the newest lot (basis $2,000)', near(lifo.basis, 2000) && near(lifo.shortTermGain, 1000) && lifo.longTermGain === 0);
  ok('FIFO and LIFO give different gains here', !near(fifo.gain, lifo.gain));
  const spec = cg.costBasis([{ ...lots[0], selected: false }, { ...lots[1], selected: true }], 'specific', 100, 30);
  ok('specific-ID uses only the selected lot', near(spec.basis, 2000));
  const avg = cg.costBasis(lots, 'average', 100, 30);
  ok('average cost basis is the blended $15/share', near(avg.basis, 1500));
  // Selling across both lots splits the gain into short and long term.
  const split = cg.costBasis(lots, 'fifo', 150, 30);
  ok('a cross-lot sale splits short and long term', split.longTermGain > 0 && split.shortTermGain > 0);
}

/* --------------------------------- credits --------------------------------- */
console.log('\ncredits: EITC');
{
  // 1 child, single: phase-in at 34%, plateau at $4,427, phase-out to $51,593.
  const inRange = cr.eitc(6000, 0, 1, 'single');
  ok('EITC phases in at 34% for a low earner', near(inRange.credit, Math.round(0.34 * 6000)), `${inRange.credit}`);
  const plateau = cr.eitc(20000, 0, 1, 'single');
  ok('EITC hits the max credit on the plateau', plateau.credit === 4427);
  const phasedOut = cr.eitc(60000, 0, 1, 'single');
  ok('EITC is zero past the income limit', phasedOut.credit === 0);
  const invest = cr.eitc(20000, 20000, 1, 'single');
  ok('too much investment income disqualifies EITC', invest.credit === 0 && invest.investmentDisqualified);
  // MFJ uses the exact 2026 phase-out figures (Rev. Proc. 2025-32).
  const mfj2 = cr.eitc(40000, 0, 2, 'mfj');
  ok('MFJ EITC uses exact 2026 phase-out (2 kids: 31160 / 65899)', mfj2.phaseoutStart === 31160 && mfj2.incomeLimit === 65899);
  const single2 = cr.eitc(40000, 0, 2, 'single');
  ok('MFJ credit beats single at the same income (wider phase-out)', mfj2.credit > single2.credit);
}

console.log('\ncredits: CTC');
{
  const full = cr.childTaxCredit(2, 100000, 'single');
  ok('CTC is $2,200/child below the phase-out', full.credit === 4400);
  ok('CTC refundable portion caps at $1,700/child', full.refundablePortion === 3400);
  // Single phase-out starts at $200k, $50 lost per $1,000 over.
  const phasing = cr.childTaxCredit(2, 210000, 'single');
  ok('CTC phases out $50 per $1,000 over $200k', near(phasing.credit, 4400 - 10 * 50), `${phasing.credit}`);
  const mfjFull = cr.childTaxCredit(2, 210000, 'mfj');
  ok('MFJ CTC is unreduced at $210k (phase-out starts $400k)', mfjFull.credit === 4400);
}

console.log('\ncredits: dependent care');
{
  const low = cr.dependentCareCredit(3000, 1, 15000);
  ok('care credit rate is 35% at $15,000 AGI', low.rate === 0.35 && low.credit === 1050);
  const high = cr.dependentCareCredit(6000, 2, 60000);
  ok('care credit rate floors at 20% for high AGI', high.rate === 0.2 && high.credit === 1200);
  const capped = cr.dependentCareCredit(10000, 1, 15000);
  ok('one-child expenses cap at $3,000', capped.cappedExpenses === 3000);
  const twoCap = cr.dependentCareCredit(10000, 2, 15000);
  ok('two-child expenses cap at $6,000', twoCap.cappedExpenses === 6000);
  ok('no qualifying persons means no credit', cr.dependentCareCredit(5000, 0, 20000).credit === 0);
}

console.log('\ncredits: saver\'s');
{
  // Exact tiers (Notice 2025-67): single 50% ≤$24,250, 20% ≤$26,250, 10% ≤$40,250.
  const fifty = cr.saversCredit(24000, 'single', 2000);
  ok('saver\'s 50% tier at low AGI gives $1,000', fifty.rate === 0.5 && fifty.credit === 1000);
  const ten = cr.saversCredit(30000, 'single', 2000);
  ok('saver\'s 10% tier at $30k single gives $200', ten.rate === 0.1 && ten.credit === 200);
  const over = cr.saversCredit(45000, 'single', 2000);
  ok('saver\'s ineligible above $40,250 single', !over.eligible && over.credit === 0);
  // MFJ 50% ≤$48,500, 20% ≤$52,500: $50k lands in the 20% tier on a $4,000 cap.
  const mfj = cr.saversCredit(50000, 'mfj', 4000);
  ok('MFJ saver\'s 20% tier at $50k gives $800', mfj.rate === 0.2 && mfj.credit === 800);
}

console.log('\ncredits: ACA (engine)');
{
  const sub = te.calcACASubsidy(40000, 2, 12000);
  ok('ACA subsidy is positive under 400% FPL', sub.eligible && sub.subsidy > 0, JSON.stringify(sub));
  const cliff = te.calcACASubsidy(200000, 2, 12000);
  ok('ACA over the 400% cliff gets no subsidy', !cliff.eligible && cliff.subsidy === 0);
}

/* ---------------------------- state cap-gains layer ------------------------ */
console.log('\nstate cap-gains layer');
{
  // Washington: 7% excise on long-term gain above the $278,000 exemption; ST untaxed.
  const wa = cg.stateGainsTax('WA', 200000, 30000, 500000, 'single');
  ok('WA excise = 7% of long-term gain over $278k', near(wa.stateTax, (500000 - 278000) * 0.07), `${wa.stateTax}`);
  const waShort = cg.stateGainsTax('WA', 200000, 50000, 0, 'single');
  ok('WA does not tax short-term gains', waShort.stateTax === 0);
  // Missouri exempts capital gains (HB 594) but still taxes dividends/interest.
  const mo = cg.stateGainsTax('MO', 80000, 10000, 100000, 'single');
  ok('MO taxes no capital gains (HB 594)', mo.stateTax === 0 && mo.treatment === 'none');
  ok('MO still taxes ordinary investment income', cg.stateOrdinaryTaxOn('MO', 80000, 5000, 'single') > 0);
  // Montana: reduced flat rate on long-term gains.
  const mt = cg.stateGainsTax('MT', 60000, 0, 50000, 'single');
  ok('MT taxes long-term gains at the reduced rate', near(mt.stateTax, 50000 * 0.041), `${mt.stateTax}`);
  // South Carolina: 44% exclusion means less than the full ordinary tax.
  const scExcl = cg.stateGainsTax('SC', 80000, 0, 100000, 'single');
  const scFull = cg.stateOrdinaryTaxOn('SC', 80000, 100000, 'single');
  ok('SC exclusion taxes less than full ordinary', scExcl.stateTax > 0 && scExcl.stateTax < scFull, `${scExcl.stateTax} vs ${Math.round(scFull)}`);
  // No-income-tax and Washington: ordinary investment income is untaxed.
  ok('TX taxes no ordinary investment income', cg.stateOrdinaryTaxOn('TX', 80000, 5000, 'single') === 0);
  ok('WA taxes no ordinary investment income (dividends/interest)', cg.stateOrdinaryTaxOn('WA', 80000, 5000, 'single') === 0);
  // Ordinary state: marginal rate on the whole gain.
  const ca = cg.stateGainsTax('CA', 100000, 0, 50000, 'single');
  ok('CA taxes gains as ordinary income (positive)', ca.stateTax > 0 && ca.treatment === 'ordinary');
}

/* ------------------------------ gig economics ------------------------------ */
console.log('\ngig economics');
{
  // Mileage: 5,000 miles each half at 72.5c / 76c = $3,625 + $3,800 = $7,425.
  const m = ge.mileageDeduction(5000, 5000);
  ok('mileage splits at the July rate change ($7,425 on 10k miles)', near(m.totalDeduction, 7425), `${m.totalDeduction}`);
  ok('mileage blended rate is between the two rates', m.blendedRate > 0.725 && m.blendedRate < 0.76);
  // Vehicle: 12,000 miles at 25 mpg, $3.50/gal -> fuel = 480 gal * $3.50 = $1,680.
  const v = ge.vehicleCost(12000, 25, 3.50, 2000, 1500, 3000, 0);
  ok('vehicle fuel cost = gallons x price', near(v.fuelCost, (12000 / 25) * 3.50), `${v.fuelCost}`);
  ok('vehicle cost per mile = total / miles', near(v.costPerMile, v.totalCost / 12000));
  // Gig unit: $20k over 500 hours, 8,000 first-half miles -> profit $14,200, $28.40/hr.
  const g = ge.gigUnitEconomics(20000, 500, 8000, 0, 0);
  ok('gig net profit = gross - mileage', near(g.netProfit, 20000 - 8000 * 0.725), `${g.netProfit}`);
  ok('gig net per hour = profit / hours', near(g.netPerHour, g.netProfit / 500));
  ok('gig gross per hour = gross / hours', near(g.grossPerHour, 40));
}

/* ------------------------------ SE business -------------------------------- */
console.log('\nSE business');
{
  // seRetirement: employer piece is 20% of net SE earnings; solo adds the deferral.
  const r = sb.seRetirement(100000, 40);
  ok('SE retirement net earnings = profit - half SE tax', near(r.netSEEarnings, 100000 - r.seTaxDeductibleHalf));
  ok('employer contribution is 20% of net SE earnings', near(r.employerContribution, 0.20 * r.netSEEarnings));
  ok('solo total = employee deferral + employer, under the cap', near(r.soloTotal, Math.min(r.soloEmployeeDeferral + r.employerContribution, r.combinedMax)));
  ok('SEP total is the employer piece, capped', near(r.sepTotal, Math.min(r.employerContribution, 72000)));
  // Age 62 gets the special 60-63 combined cap.
  const older = sb.seRetirement(400000, 62);
  ok('age 60-63 uses the higher combined cap ($83,250)', older.combinedMax === 83250 && older.soloTotal <= 83250);

  // sellerProfit port: transcribe the tax composition and match on 3 input sets.
  const legacySeller = (rev, cogs, fees, ship, other, state, status) => {
    const expenses = cogs + fees + ship + other;
    const net = Math.max(0, rev - expenses);
    const se = te.calcSETax(net, undefined, 0, status);
    const agi = net - se.deductibleHalf;
    const std = te.getStandardDeduction(status, false);
    const bq = Math.max(0, agi - std);
    const qbi = te.calcQBI(net, bq, status);
    const fed = te.calcFederalTax(Math.max(0, bq - qbi), status);
    const stTax = state ? te.calcStateTax(agi, state, undefined, status).tax : 0;
    return { net, total: se.totalSE + fed + stTax };
  };
  const sellerCases = [
    [50000, 15000, 5000, 3000, 2000, 'OH', 'single'],
    [120000, 40000, 12000, 8000, 5000, 'CA', 'mfj'],
    [30000, 5000, 3000, 1000, 500, 'TX', 'single'],
  ];
  for (const [i, c] of sellerCases.entries()) {
    const [rev, cogs, fees, ship, other, state, status] = c;
    const L = legacySeller(rev, cogs, fees, ship, other, state, status);
    const r2 = sb.sellerProfit(rev, cogs, fees, ship, other, state, status);
    ok(`seller case ${i + 1} net profit matches`, near(r2.netProfit, L.net));
    ok(`seller case ${i + 1} total tax matches legacy composition`, near(r2.totalTax, L.total), `${Math.round(r2.totalTax)} vs ${Math.round(L.total)}`);
  }

  // freelanceRate port: the solved gross revenue reproduces the target take-home.
  const fr = sb.freelanceRate(90000, 5000, 'CA', 'single', 4, 25, 40);
  ok('freelance solved take-home hits the target', near(fr.takeHome, 90000, 100), `${Math.round(fr.takeHome)}`);
  ok('freelance hourly rate = gross / billable hours', near(fr.hourlyRate, fr.grossRevenue / fr.annualBillableHours));
  ok('freelance project rate = hourly x project hours', near(fr.projectRate, fr.hourlyRate * 40));
}

/* -------------------------------- gambling --------------------------------- */
console.log('\ngambling (2026 90% loss rule)');
{
  // Break even: $50k won, $50k lost. Only 90% ($45k) is deductible, so $5k stays taxable.
  const be = gam.gamblingTax(50000, 50000, 120000, 'single', 20000, 'OH', 0);
  ok('break-even: deductible losses are 90% capped at winnings', near(be.deductibleLosses, 45000), `${be.deductibleLosses}`);
  ok('break-even: $5k of losses are non-deductible', near(be.nonDeductibleLosses, 5000));
  ok('break-even still owes tax under the 2026 rule', be.breakEvenTax > 0);
  // Winnings, no losses: full winnings taxed, nothing to deduct.
  const win = gam.gamblingTax(30000, 0, 80000, 'single', 0, 'OH', 0);
  ok('winnings with no losses give no deduction', win.deductibleLosses === 0 && win.federalTaxOnWinnings > 0);
  // Loss deduction only helps if itemizing beats the standard deduction.
  const small = gam.gamblingTax(2000, 2000, 60000, 'single', 0, '', 0);
  ok('small winnings: standard deduction beats itemizing the loss', !small.usingItemized);
}

/* ---------------------------- estate / gift / inheritance ------------------- */
console.log('\nestate, gift & inheritance');
{
  // Estate: $20m estate -> $5m over the $15m exclusion -> 40% = $2m.
  const e = est.estateTax(20000000, 0, 0);
  ok('estate tax = 40% of the amount over $15m', near(e.estimatedTax, 2000000) && e.taxableEstate === 5000000);
  ok('a $10m estate owes nothing', est.estateTax(10000000).estimatedTax === 0);
  // Portability lifts the exclusion.
  const port = est.estateTax(25000000, 0, 15000000);
  ok('portability adds a spouse\'s exclusion (no tax on $25m with $15m ported)', port.estimatedTax === 0);

  // Gift: $50k to one person -> $19k excluded -> $31k taxable, return required, no tax due.
  const g = est.giftTax(50000, 1, 0, false);
  ok('gift: annual exclusion is $19k, excess is taxable', g.taxablePerRecipient === 31000);
  ok('gift over the exclusion requires a return', g.returnRequired && g.giftTaxDue === 0);
  ok('a $15k gift needs no return', !est.giftTax(15000, 1).returnRequired);
  // Noncitizen spouse: $194k exclusion.
  ok('noncitizen-spouse gift under $194k is not taxable', est.giftTax(150000, 1, 0, true).taxablePerRecipient === 0);

  // Inheritance by asset type.
  ok('inherited cash is not taxable', est.inheritanceTreatment('cash', 100000).estimatedTax === 0);
  ok('inherited life insurance is not taxable', est.inheritanceTreatment('life_insurance', 500000).estimatedTax === 0);
  ok('inherited Roth is not taxable', est.inheritanceTreatment('roth', 200000).estimatedTax === 0);
  // Stepped-up brokerage: only gain above date-of-death value is taxed, as LTCG.
  const brk = est.inheritanceTreatment('brokerage', 100000, 80000, 'single', 120000, 0);
  ok('stepped-up basis taxes only post-death gain', brk.taxableAmount === 20000 && brk.estimatedTax > 0);
  ok('no gain if sold at the stepped-up value', est.inheritanceTreatment('property', 100000, 80000, 'single', 100000).estimatedTax === 0);
  // Traditional IRA is fully ordinary income; a Roth of the same size is not.
  const ira = est.inheritanceTreatment('traditional_ira', 100000, 80000, 'single', 100000);
  ok('inherited traditional IRA is fully taxable as ordinary income', ira.taxableAmount === 100000 && ira.estimatedTax > 0);
  // Annuity: only the gain above basis is taxable.
  const ann = est.inheritanceTreatment('annuity', 100000, 80000, 'single', 0, 60000);
  ok('inherited annuity taxes only the gain above basis', ann.taxableAmount === 40000);
}

/* ---------------------------- Phase 14 remainder --------------------------- */
console.log('\nrental income');
{
  // $48k rent, $275k building basis -> $10k depreciation; $31.3k expenses -> $16.7k profit.
  const r = rent.rentalIncome(48000, 275000, 12000, 4500, 1800, 3000, 0, 80000, 'single', 'OH', false);
  ok('rental depreciation = basis / 27.5', near(r.depreciation, 275000 / 27.5) && near(r.depreciation, 10000));
  ok('rental net income = rent - expenses', near(r.netIncome, 16700), `${r.netIncome}`);
  ok('Schedule E rental owes no SE tax', r.seTax === 0);
  ok('Schedule C rental owes SE tax', rent.rentalIncome(48000, 275000, 12000, 4500, 1800, 3000, 0, 80000, 'single', 'OH', true).seTax > 0);
}

console.log('\nretirement withdrawal & Roth conversion');
{
  const early = rp.retirementWithdrawal(20000, 45, 80000, 'single', 'OH', false);
  ok('early withdrawal adds a 10% penalty', near(early.earlyPenalty, 2000));
  ok('withdrawal after 59.5 has no penalty', rp.retirementWithdrawal(20000, 65, 80000, 'single', 'OH', false).earlyPenalty === 0);
  ok('Roth withdrawal is tax-free', rp.retirementWithdrawal(20000, 45, 80000, 'single', 'OH', true).totalTax === 0);
  const conv = rp.rothConversion(30000, 50000, 'single', '');
  ok('Roth conversion is taxed as ordinary income', conv.federalTax > 0 && conv.marginalBracket > 0);
}

console.log('\nFEIE (stacking)');
{
  const f = fe.feie(100000, 20000, 'single');
  ok('FEIE excludes up to the earned income', f.exclusion === 100000);
  ok('FEIE saves tax but stacking limits it', f.savings > 0 && f.taxWithFeie < f.taxWithoutFeie);
  ok('FEIE exclusion is capped at the 2026 limit', fe.feie(200000, 0, 'single').exclusion === fe.FEIE_LIMIT);
}

console.log('\nsecond-income breakeven');
{
  const s = wd.secondIncomeBreakeven(90000, 40000, 'mfj', 'OH', 12000, 3000);
  ok('second income is taxed at the marginal rate', s.marginalFederalTax > 0 && s.fica > 0);
  ok('keep-rate is less than 100% after tax and costs', s.keepRate < 1 && s.netKept < 40000);
  ok('childcare and work costs reduce what is kept', s.netKept === Math.round((40000 - s.totalTax - 15000) * 1) || near(s.netKept, 40000 - s.totalTax - 15000));
}

console.log('\ntrucking cost per mile');
{
  const t = ge.truckingCostPerMile(120000, 2.00, 6.5, 4.00, 0.15, 12000, 24000, 8000);
  ok('trucking fuel cost = diesel / mpg', near(t.fuelCostPerMile, 4.00 / 6.5));
  ok('trucking net per mile = revenue - total cost', near(t.netPerMile, 2.00 - t.totalCostPerMile));
  ok('trucking annual net = net per mile x miles', near(t.annualNet, t.netPerMile * 120000));
}

console.log('\nbrand deal (marginal)');
{
  // The deal's tax is SE tax + the MARGINAL income tax it adds — not household tax.
  const b = sb.brandDeal(18000, 60000, 2000, 'single', 'OH');
  ok('brand deal SE tax is on net SE income', b.seTax > 0 && near(b.afterTax, b.dealAmount - b.totalTax));
  // After-tax must be a sane fraction of the deal (roughly 55–75% kept), not negative.
  ok('brand-deal after-tax is a sane share of the deal', b.afterTax > b.dealAmount * 0.5 && b.afterTax < b.dealAmount, `${Math.round(b.afterTax)} of ${b.dealAmount}`);
  ok('brand-deal set-aside is under half the deal', b.setAsidePct < 0.5);
}

/* --------------------------- gambling-tax phase ---------------------------- */
console.log('\ngambling tax phase');
{
  // Lottery: $100m jackpot, $60m cash value. Annuity payment = jackpot / 30.
  const lot = gam.lotteryTax(100000000, 60000000, 0, 'single', 'OH');
  ok('lottery annuity payment = jackpot / 30', near(lot.annualPayment, 100000000 / 30, 1));
  ok('lottery lump sum is taxed near the top rate', lot.lumpSumTax > 60000000 * 0.35 && lot.lumpSumTax < 60000000 * 0.45);
  ok('lottery withholding is 24% of the cash value', near(lot.federalWithheld, 60000000 * 0.24, 1));
  // W-2G: 24% withheld often differs from the actual marginal tax.
  const w2g = gam.w2gReconcile(10000, 60000, 0, 'single', 0);
  ok('W-2G withholding is 24% of winnings', near(w2g.federalWithheld, 2400));
  ok('W-2G difference = withheld − actual tax', near(w2g.difference, w2g.federalWithheld - w2g.actualFederalTax));
  // Professional vs casual gambler.
  const pro = gam.professionalGambler(100000, 60000, 15000, 30000, 'single', 'OH');
  ok('professional gambler deducts losses (90%) and expenses', near(pro.netProfit, 100000 - 54000 - 15000));
  ok('professional pays SE tax; a winner/loser is picked', pro.professionalSeTax > 0 && typeof pro.betterAsProfessional === 'boolean');
  // Social Security drag.
  const ss = gam.gamblingSocialSecurityImpact(30000, 20000, 24000, 'single');
  ok('a win pulls more Social Security into tax', ss.extraTaxableSS > 0 && ss.taxableSSWith > ss.taxableSSWithout);
  // ACA subsidy loss.
  const aca = gam.gamblingACAImpact(30000, 40000, 2, 1000);
  ok('a win cuts the ACA subsidy', aca.subsidyLost >= 0 && aca.subsidyWith <= aca.subsidyWithout);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
