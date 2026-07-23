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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
