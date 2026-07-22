/**
 * Runs the legacy engine and the ported one over the same input grid and reports
 * every figure that disagrees.
 *
 * The port was done by hand from legacy/js/tax-engine.js. This is the only way to
 * know it stayed faithful — and, where it deliberately did not, to keep a record
 * of exactly which differences are intentional.
 *
 * Three known differences, all of them legacy bugs that the port fixes:
 *
 *   1. Additional Medicare Tax. Legacy omits the 0.9% on earnings above
 *      $200k single / $250k MFJ, despite carrying the figures in its own
 *      dataset under federal.selfEmployment.additionalMedicare. It understates
 *      SE tax and FICA for high earners — $1,524.60 at $400k single.
 *   2. Ohio's exempt-below-$26,050 threshold, which legacy does not apply.
 *   3. Maryland, Nebraska, South Carolina and West Virginia brackets, which
 *      legacy does not have at all, so it returns $0 tax for all four.
 *
 * Anything outside those three is a regression and fails the run.
 *
 *   node scripts/check-engine-parity.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';

if (!existsSync('legacy/js/tax-engine.js')) {
  console.log('legacy/ not present — skipping engine parity check.');
  process.exit(0);
}

const bundle = join(tmpdir(), `ported-engine-${process.pid}.mjs`);
execSync(`npx esbuild src/lib/tax-engine.ts --bundle --format=esm --outfile=${bundle} --log-level=error`);

const cfg = JSON.parse(readFileSync('legacy/data/config.json', 'utf8'));
const sandbox = { window: {}, console, Intl, Math, JSON, Number, Object, Array, isNaN, parseFloat, parseInt, String, Boolean };
vm.createContext(sandbox);
vm.runInContext(readFileSync('legacy/js/tax-engine.js', 'utf8'), sandbox);
sandbox.__CFG__ = cfg;
vm.runInContext('TAX_DATA = __CFG__;', sandbox);
const L = sandbox.window.TaxEngine;
const P = await import(bundle);

/** States whose figures legacy gets wrong, and why. */
const KNOWN_STATE_FIXES = {
  MD: 'no brackets in legacy — returns $0',
  NE: 'no brackets in legacy — returns $0',
  SC: 'no brackets in legacy — returns $0',
  WV: 'no brackets in legacy — returns $0',
  OH: 'legacy ignores the exempt-below-$26,050 threshold',
};

const STATES = Object.keys(cfg.states);
const STATUSES = ['single', 'mfj', 'hoh', 'mfs'];
const INCOMES = [0, 12000, 30000, 50000, 75000, 120000, 200000, 400000, 1200000];
const near = (a, b) => Math.abs((a ?? 0) - (b ?? 0)) < 0.02;

let compared = 0;
const expected = { addMedicare: 0, stateFix: 0 };
const regressions = [];

for (const status of STATUSES) {
  for (const income of INCOMES) {
    compared += 2;
    const ls = L.calcSETax(income, cfg, 0);
    const ps = P.calcSETax(income, undefined, 0, status);
    if (!near(ls.totalSE, ps.totalSE)) {
      if (near(ps.totalSE - ls.totalSE, ps.additionalMedicareTax ?? 0)) expected.addMedicare++;
      else regressions.push(`calcSETax (${status}, ${income}): ${ls.totalSE} vs ${ps.totalSE}`);
    }
    const lf = L.calcFICA(income, cfg, 0);
    const pf = P.calcFICA(income, undefined, 0, status);
    if (!near(lf.totalFICA, pf.totalFICA)) {
      if (near(pf.totalFICA - lf.totalFICA, pf.additionalMedicareTax ?? 0)) expected.addMedicare++;
      else regressions.push(`calcFICA (${status}, ${income}): ${lf.totalFICA} vs ${pf.totalFICA}`);
    }

    for (const fn of ['calcFederalTax', 'getStandardDeduction', 'calcQBI', 'calcChildTaxCredit', 'calcEIC', 'calcSeniorDeductionOBBBA']) {
      compared++;
      const args = {
        calcFederalTax: [[income, status, cfg], [income, status]],
        getStandardDeduction: [[status, false, cfg], [status, false]],
        calcQBI: [[income, income, status, cfg], [income, income, status]],
        calcChildTaxCredit: [[2, income, status, cfg], [2, income, status]],
        calcEIC: [[income, 0, 1, status, cfg], [income, 0, 1, status]],
        calcSeniorDeductionOBBBA: [[income, status, cfg], [income, status]],
      }[fn];
      const a = L[fn](...args[0]);
      const b = P[fn](...args[1]);
      if (!near(a, b)) regressions.push(`${fn} (${status}, ${income}): ${a} vs ${b}`);
    }

    for (const st of STATES) {
      compared++;
      const a = L.calcStateTax(income, st, cfg, status).tax;
      const b = P.calcStateTax(income, st, undefined, status).tax;
      if (!near(a, b)) {
        if (KNOWN_STATE_FIXES[st]) expected.stateFix++;
        else regressions.push(`calcStateTax (${st}, ${status}, ${income}): ${a} vs ${b}`);
      }
    }
  }
}

console.log(`\nEngine parity — ${compared.toLocaleString()} figures compared`);
console.log(`  ${expected.stateFix} state-tax differences, all in ${Object.keys(KNOWN_STATE_FIXES).join('/')} (known legacy bugs)`);
console.log(`  ${expected.addMedicare} SE/FICA differences, all the Additional Medicare Tax legacy omits`);

if (regressions.length) {
  console.log(`\n${regressions.length} UNEXPLAINED difference(s) — the port has drifted:`);
  regressions.slice(0, 20).forEach((r) => console.log('  ✗ ' + r));
  process.exit(1);
}
console.log('\nNo unexplained differences. The port is faithful.\n');
