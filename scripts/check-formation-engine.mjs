/**
 * Unit tests for the formation comparison engine.
 *
 * The spec names five: dedupe of the comparison set, foreign-registration
 * stacking, threshold behavior in NV/TX/OH, null propagation to unquantified
 * flags, and the self-agent restriction. Plus the two acceptance checks that
 * came out of live data errors.
 *
 * The stacking test is the one that matters. If it ever passes while Wyoming
 * comes out cheaper than the home state for a business operating elsewhere,
 * the engine has silently dropped the operating state's obligations and the
 * whole tool is lying in the direction its readers already believe.
 *
 *   node scripts/check-formation-engine.mjs
 */
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

const out = await build({
  entryPoints: ['src/lib/formation-compare.ts'],
  bundle: true, format: 'esm', write: false, platform: 'node', loader: { '.json': 'json' },
});
const tmp = '/tmp/formation-compare.mjs';
writeFileSync(tmp, out.outputFiles[0].text);
const { compareFormationStates, rankByFiveYear, FIXED_COMPARISON_STATES } = await import(tmp);

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};
const money = (n) => (n === null ? 'null' : '$' + Math.round(n).toLocaleString('en-US'));

const base = {
  homeState: 'OH', workState: 'OH', entity: 'llc',
  annualRevenue: 150_000, annualProfit: 110_000,
  ownerSalary: 0, ownerDistributions: 110_000,
  numberOfOwners: 1, numberOfEmployees: 0,
  agentTier: 'standard', filingStatus: 'single',
};

/* ---------------------------------------------------------------- 1. dedupe */
console.log('\n1. comparison set');
{
  const r = compareFormationStates({ ...base, homeState: 'DE', workState: 'DE', candidateState: 'DE' });
  const codes = r.columns.map((c) => c.state);
  ok('a state appearing as home, work and candidate appears once',
    codes.filter((c) => c === 'DE').length === 1, codes.join(','));
  ok('the six fixed states are all present',
    FIXED_COMPARISON_STATES.every((s) => codes.includes(s)), codes.join(','));
  ok('at most nine columns', codes.length <= 9, `${codes.length}`);

  const r2 = compareFormationStates({ ...base, homeState: 'OH', workState: 'PA', candidateState: 'MT' });
  const c2 = r2.columns.map((c) => c.state);
  ok('home, work and candidate all appear when different',
    ['OH', 'PA', 'MT'].every((s) => c2.includes(s)), c2.join(','));
  ok('home state comes first', c2[0] === 'OH', c2.join(','));
}

/* -------------------------------------------- 2. foreign-registration stacking */
console.log('\n2. foreign registration stacking — the myth math');
{
  const r = compareFormationStates(base);   // Ohio consultant, operates in Ohio
  const oh = r.columns.find((c) => c.state === 'OH');
  const wy = r.columns.find((c) => c.state === 'WY');
  const de = r.columns.find((c) => c.state === 'DE');

  ok('the operating state column carries no foreign registration',
    oh.foreignRegistration.oneTime === 0 && oh.foreignRegistration.operatingState === null);
  ok('an out-of-state column carries Ohio foreign registration',
    wy.foreignRegistration.oneTime !== null && wy.foreignRegistration.operatingState === 'OH',
    `${money(wy.foreignRegistration.oneTime)}`);
  ok('an out-of-state column is flagged as adding operating-state obligations',
    wy.flags.includes('operating-state-obligations-added'));

  ok('ACCEPTANCE CHECK 1 — Wyoming costs MORE than Ohio over five years',
    wy.fiveYearTotal > oh.fiveYearTotal,
    `WY ${money(wy.fiveYearTotal)} vs OH ${money(oh.fiveYearTotal)}`);
  ok('Delaware also costs more than Ohio over five years',
    de.fiveYearTotal > oh.fiveYearTotal,
    `DE ${money(de.fiveYearTotal)} vs OH ${money(oh.fiveYearTotal)}`);
  ok('the home state ranks cheapest for a business operating at home',
    rankByFiveYear(r)[0].state === 'OH', rankByFiveYear(r)[0].state);

  // The invariant, checked across every column rather than a chosen pair.
  const cheaperThanHome = r.columns.filter((c) => !c.isOperatingState && c.fiveYearTotal < oh.fiveYearTotal);
  ok('NO out-of-state column beats the operating state',
    cheaperThanHome.length === 0,
    cheaperThanHome.map((c) => `${c.state} ${money(c.fiveYearTotal)}`).join(', '));
}

/* ------------------------------------------------- 3. state income tax is fixed */
console.log('\n3. state income tax does not move with the formation state');
{
  const r = compareFormationStates({ ...base, homeState: 'CA', workState: 'CA' });
  const set = new Set(r.columns.map((c) => Math.round(c.stateIncomeTax)));
  ok('every column reports the same state income tax', set.size === 1,
    [...set].map(money).join(' / '));
  ok('a California resident still owes California on a Wyoming column',
    r.columns.find((c) => c.state === 'WY').stateIncomeTax > 0,
    money(r.columns.find((c) => c.state === 'WY').stateIncomeTax));
}

/* --------------------------------------------------------------- 4. thresholds */
console.log('\n4. gross receipts thresholds');
{
  const below = compareFormationStates({ ...base, homeState: 'NV', workState: 'NV', annualRevenue: 1_000_000 });
  const nvLow = below.columns.find((c) => c.state === 'NV');
  ok('Nevada is $0 below the $4m Commerce Tax threshold, with the reason given',
    nvLow.grossReceiptsTax.amount === 0 && nvLow.grossReceiptsTax.thresholdMet === false,
    `${money(nvLow.grossReceiptsTax.amount)}`);

  const above = compareFormationStates({ ...base, homeState: 'NV', workState: 'NV', annualRevenue: 9_000_000 });
  const nvHigh = above.columns.find((c) => c.state === 'NV');
  ok('Nevada computes null above the threshold — the rate varies by industry',
    nvHigh.grossReceiptsTax.amount === null && nvHigh.grossReceiptsTax.thresholdMet === true);

  const txLow = compareFormationStates({ ...base, homeState: 'TX', workState: 'TX', annualRevenue: 1_000_000 })
    .columns.find((c) => c.state === 'TX');
  ok('Texas is $0 below the margin-tax threshold', txLow.grossReceiptsTax.amount === 0);
  const txHigh = compareFormationStates({ ...base, homeState: 'TX', workState: 'TX', annualRevenue: 5_000_000 })
    .columns.find((c) => c.state === 'TX');
  ok('Texas computes a real figure above the threshold at 0.75%',
    txHigh.grossReceiptsTax.amount !== null && txHigh.grossReceiptsTax.amount > 0,
    money(txHigh.grossReceiptsTax.amount));

  const ohHigh = compareFormationStates({ ...base, annualRevenue: 10_000_000 })
    .columns.find((c) => c.state === 'OH');
  ok('Ohio charges CAT only above the $6m exclusion',
    ohHigh.grossReceiptsTax.amount !== null && ohHigh.grossReceiptsTax.amount > 0,
    money(ohHigh.grossReceiptsTax.amount));
}

/* ------------------------------------------------------- 5. null propagation */
console.log('\n5. nulls become unquantified, never zero');
{
  const r = compareFormationStates({ ...base, homeState: 'NM', workState: 'NM' });
  const nm = r.columns.find((c) => c.state === 'NM');
  ok('New Mexico has no confirmed formation fee', nm.formationFee.amount === null);
  ok('and it is listed as unquantified rather than treated as zero',
    nm.unquantified.some((u) => /formation fee/i.test(u)), nm.unquantified.join(' | '));

  /*
   * To read a state's OWN foreign qualification fee it has to be the operating
   * state — the fee shown on a column is the fee of the state you operate in,
   * not of the state in the column heading. Getting that backwards is what the
   * first draft of this test did.
   */
  const sdOperating = compareFormationStates({ ...base, homeState: 'SD', workState: 'SD', entity: 's-corp' });
  const viewFromWy = sdOperating.columns.find((c) => c.state === 'WY');
  ok('South Dakota corp foreign fee is null after the data fix',
    viewFromWy.foreignRegistration.oneTime === null,
    money(viewFromWy.foreignRegistration.oneTime));
  ok('and surfaces as unquantified on the column',
    viewFromWy.unquantified.some((u) => /foreign registration/i.test(u)),
    viewFromWy.unquantified.join(' | '));

  const wa = compareFormationStates({ ...base, homeState: 'WA', workState: 'WA', annualRevenue: 3_000_000 })
    .columns.find((c) => c.state === 'WA');
  ok('ACCEPTANCE CHECK 4 — a prose-only regime flags the column',
    wa.flags.includes('prose-only-grt') && wa.grossReceiptsTax.amount === null);
}

/* --------------------------------------------------------- 6. self-agent rule */
console.log('\n6. self-agent restriction');
{
  const r = compareFormationStates({ ...base, agentTier: 'self' });
  const oh = r.columns.find((c) => c.state === 'OH');
  const wy = r.columns.find((c) => c.state === 'WY');
  ok('ACCEPTANCE CHECK 5 — self-agent is free in the home state', oh.agentCost === 0);
  ok('self-agent is refused elsewhere and falls back to a paid tier',
    wy.agentCost > 0 && wy.flags.includes('self-agent-unavailable'), money(wy.agentCost));
  ok('and the refusal is explained in a warning',
    r.warnings.some((w) => w.kind === 'self-agent'));
}

/* ------------------------------------------------ 7 & 8. acceptance checks */
console.log('\n7-8. acceptance checks from live data errors');
{
  // Same rule as above: operate in Mississippi, then read its foreign fee off
  // any other column. This is the check that catches the state-row-instead-of-
  // entity-row bug found live in South Dakota.
  const llcForeign = compareFormationStates({ ...base, homeState: 'MS', workState: 'MS', entity: 'llc' })
    .columns.find((c) => c.state === 'WY').foreignRegistration.oneTime;
  const corpForeign = compareFormationStates({ ...base, homeState: 'MS', workState: 'MS', entity: 's-corp' })
    .columns.find((c) => c.state === 'WY').foreignRegistration.oneTime;
  ok('ACCEPTANCE CHECK 7 — Mississippi foreign LLC $250 and foreign corp $500 differ',
    llcForeign === 250 && corpForeign === 500, `llc ${money(llcForeign)}, corp ${money(corpForeign)}`);

  const nv = compareFormationStates({ ...base, homeState: 'NV', workState: 'NV', agentTier: 'self' })
    .columns.find((c) => c.state === 'NV');
  // $75 formation + $150 initial list + 5 x ($150 list + $200 license) = $1,975
  ok('ACCEPTANCE CHECK 8 — Nevada five-year total counts the Initial List once',
    Math.round(nv.fiveYearTotal) === 1975, money(nv.fiveYearTotal));
}

/* ------------------------------------------------------------ 9. short circuit */
console.log('\n9. sole proprietor short-circuits');
{
  const r = compareFormationStates({ ...base, entity: 'sole-prop' });
  ok('no columns are produced', r.columns.length === 0);
  ok('and the reason is stated', Boolean(r.shortCircuit), r.shortCircuit ?? '');
}

/* -------------------------------------------- 10. the Ohio worked example */
console.log('\n10. the worked example, printed in full');
{
  const r = compareFormationStates(base);
  console.log(`\n  Ohio consultant, LLC, $150,000 revenue / $110,000 profit`);
  console.log(`  Federal (identical in every column): ${money(r.federal.tax)}`);
  console.log(`  State income tax to Ohio (identical in every column): ${money(r.columns[0].stateIncomeTax)}\n`);
  console.log('  state  formation  foreign   annual   5-year    flags');
  for (const c of rankByFiveYear(r)) {
    console.log(`  ${c.state.padEnd(6)} ${money(c.formationFee.amount).padStart(9)} ${money(c.foreignRegistration.oneTime).padStart(8)} ${money(c.annualTotal).padStart(8)} ${money(c.fiveYearTotal).padStart(8)}    ${c.unquantified.length ? `+${c.unquantified.length} unquantified` : ''}`);
  }
  const wy = r.columns.find((c) => c.state === 'WY');
  const oh = r.columns.find((c) => c.state === 'OH');
  console.log(`\n  Wyoming costs ${money(wy.fiveYearTotal - oh.fiveYearTotal)} MORE than Ohio over five years.`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
