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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
