/**
 * Local income tax: city, county, school district and special-district levies.
 *
 * THE DESIGN PROBLEM. Twelve states levy something, in eight different shapes:
 * a percentage of state taxable income, a percentage of gross wages or net
 * profit, a percentage OF THE STATE TAX itself (Yonkers), an own bracket
 * schedule (NYC, Multnomah), a levy that only bites above a floor (Metro SHS),
 * flat dollars per week worked (West Virginia), flat dollars per year (the
 * Portland Arts Tax), and — in Ohio — a rate paired with a credit cap.
 *
 * They cannot be flattened into one rate field without lying, so the shapes are
 * not inferred from the data's fields; each state is read deliberately. What can
 * be computed from income is computed. What needs a fact we do not have — weeks
 * worked inside Huntington, which of 203 Ohio school districts you live in — is
 * returned as needing that input rather than silently assumed.
 *
 * THE RULE THAT MATTERS MOST. Whether a local tax reaches SELF-EMPLOYMENT NET
 * PROFIT is recorded per jurisdiction and is often a different answer from the
 * wage rule. Pennsylvania's EIT reaches sole-proprietor profit but NOT S-corp
 * distributive share; Ohio taxes net profit in full and disallows the state
 * Business Income Deduction while doing it. Getting that wrong is worse than
 * omitting the state.
 */
import localData from '../data/overrides/local-income-tax-2026.json';
import { states } from '../data/states';
import { calcStateTax, formatMoney } from './tax-engine';

const DATA = localData as Record<string, any>;

export function localTaxStates(): string[] {
  return Object.keys(DATA)
    .filter((k) => !k.startsWith('_'))
    .sort((a, b) => (states[a]?.name ?? a).localeCompare(states[b]?.name ?? b));
}

export function localTaxFor(code: string): Record<string, any> | null {
  return code.startsWith('_') ? null : (DATA[code] ?? null);
}

export type LevyShape =
  | 'percentOfIncome'
  | 'percentOfStateTax'
  | 'brackets'
  | 'aboveThreshold'
  | 'flatPerWeek'
  | 'flatPerYear';

export interface Levy {
  jurisdiction: string;
  shape: LevyShape;
  /** Dollars, or null when computing it needs an input we do not have. */
  amount: number | null;
  /** How the charge is worked out, in words, for the page. */
  basis: string;
  /** What is missing, when amount is null. */
  needs?: string;
  reachesSelfEmployment: boolean | null;
  residentOnly?: boolean;
}

const pct = (r: number, dp = 2) => `${(r * 100).toFixed(dp).replace(/\.?0+$/, '')}%`;

/** Tax from [floor, ceiling, rate] rows where the floor is an exemption, not a bracket start. */
function fromBands(income: number, bands: [number, number | null, number][]): number {
  return bands.reduce(
    (t, [lo, hi, rate]) => t + Math.max(0, Math.min(income, hi ?? Infinity) - lo) * rate,
    0,
  );
}

/**
 * The levies in a state, costed at a given income.
 *
 * Deliberately does NOT pick a jurisdiction for the visitor. There is no way to
 * know which of Ohio's 600 municipalities or Indiana's 92 counties applies, and
 * quietly assuming the largest one would be worse than showing the spread.
 */
export function levyExamples(code: string, income: number): Levy[] {
  const d = localTaxFor(code);
  if (!d) return [];
  const out: Levy[] = [];
  const seRule = d.appliesToSelfEmploymentNetProfit ?? null;
  const add = (l: Levy) => out.push(l);

  // Flat county rates — Maryland on state taxable income, Indiana on state AGI.
  if (d.rates) {
    const base = code === 'MD' ? 'Maryland taxable income' : 'Indiana adjusted gross income';
    for (const [name, rate] of Object.entries(d.rates as Record<string, number>)) {
      add({
        jurisdiction: `${name} County`, shape: 'percentOfIncome', amount: income * rate,
        basis: `${pct(rate)} of ${base}`, reachesSelfEmployment: seRule,
      });
    }
  }

  if (code === 'OH') {
    for (const [name, c] of Object.entries(d.cities as Record<string, any>)) {
      add({
        jurisdiction: name, shape: 'percentOfIncome', amount: income * c.rate,
        basis: `${pct(c.rate)} of municipal taxable income`
          + (creditIsCapped(c) ? `, with the credit for tax paid elsewhere capped at ${pct(c.creditRateLimit ?? 0)}` : ''),
        reachesSelfEmployment: true,
      });
    }
    const sd = d.schoolDistrictIncomeTax;
    if (sd) {
      add({
        jurisdiction: 'School district (if yours levies)', shape: 'percentOfIncome', amount: null,
        basis: `${pct(sd.rateRange[0], 2)} to ${pct(sd.rateRange[1])} on top of the municipal tax, in ${sd.districtsLevying} of Ohio's districts`,
        needs: 'which school district you live in — it is separate from your city and filed on form SD 100 with the state return',
        reachesSelfEmployment: true, residentOnly: true,
      });
    }
  }

  if (code === 'MI') {
    for (const [name, [res, non]] of Object.entries(d.cities as Record<string, [number, number]>)) {
      add({
        jurisdiction: name, shape: 'percentOfIncome', amount: income * res,
        basis: `${pct(res)} if you live there, ${pct(non)} if you only work there`,
        reachesSelfEmployment: true,
      });
    }
  }

  if (code === 'NY') {
    add({
      jurisdiction: 'New York City', shape: 'brackets',
      amount: fromBands(income, d.nycResidentTax.bracketsSingle),
      basis: `four brackets from ${pct(0.03078, 3)} to ${pct(0.03876, 3)} of NYC taxable income`,
      reachesSelfEmployment: true, residentOnly: true,
    });
    const stateTax = calcStateTax(income, 'NY', undefined, 'single').tax;
    add({
      jurisdiction: 'Yonkers', shape: 'percentOfStateTax',
      amount: stateTax * d.yonkersResidentSurcharge.rate,
      basis: `${pct(d.yonkersResidentSurcharge.rate)} of your New York STATE tax — ${formatMoney(stateTax)} at this income — not of the income itself`,
      reachesSelfEmployment: true, residentOnly: true,
    });
    add({
      jurisdiction: 'New York City unincorporated business tax',
      shape: 'percentOfIncome', amount: income * d.nycUnincorporatedBusinessTax.rate,
      basis: `${pct(d.nycUnincorporatedBusinessTax.rate)} on unincorporated business income — sole proprietors and partnerships, and it reaches nonresidents`,
      reachesSelfEmployment: true, residentOnly: false,
    });
  }

  if (code === 'OR') {
    const m = d.jurisdictions['Metro Supportive Housing Services'];
    add({
      jurisdiction: 'Metro Supportive Housing Services', shape: 'aboveThreshold',
      amount: Math.max(0, income - m.thresholdSingle) * m.rate,
      basis: `${pct(m.rate)} of Oregon taxable income above ${formatMoney(m.thresholdSingle)} single, ${formatMoney(m.thresholdJoint)} joint`,
      reachesSelfEmployment: true,
    });
    const p = d.jurisdictions['Multnomah County Preschool for All'];
    add({
      jurisdiction: 'Multnomah County Preschool for All', shape: 'brackets',
      amount: fromBands(income, p.bracketsSingle),
      basis: `${pct(0.015)} above ${formatMoney(125000)} and ${pct(0.03)} above ${formatMoney(250000)}, single`,
      reachesSelfEmployment: true,
    });
    const a = d.jurisdictions['Portland Arts Tax'];
    add({
      jurisdiction: 'Portland Arts Tax', shape: 'flatPerYear', amount: a.flatAmount,
      basis: `${formatMoney(a.flatAmount)} a year, flat — not a rate, and not prorated for part-year residents`,
      reachesSelfEmployment: true, residentOnly: true,
    });
  }

  if (code === 'WV') {
    for (const [name, j] of Object.entries(d.jurisdictions as Record<string, any>)) {
      add({
        jurisdiction: name, shape: 'flatPerWeek', amount: null,
        basis: `${formatMoney(j.perWeek)} for every week you work in the city`,
        needs: 'weeks worked inside the city — the charge does not depend on what you earn, so someone on $30,000 and someone on $300,000 pay exactly the same',
        reachesSelfEmployment: j.appliesToSelfEmployed ?? null,
      });
    }
  }

  if (code === 'PA') {
    add({
      jurisdiction: 'Most municipalities (Act 32 earned income tax)', shape: 'percentOfIncome',
      amount: income * d.eit.mostCommon,
      basis: `${pct(d.eit.mostCommon)} is the most common combined rate; the range runs to ${pct(d.eit.typicalRange[1])}`,
      reachesSelfEmployment: true,
    });
    const ph = d.philadelphia.wageTax2026[0];
    add({
      jurisdiction: 'Philadelphia', shape: 'percentOfIncome', amount: income * ph.resident,
      basis: `${pct(ph.resident, 3)} resident, ${pct(ph.nonresident, 3)} nonresident — and the rate changes on 1 July, not 1 January, so a calendar year blends two`,
      reachesSelfEmployment: true,
    });
    add({
      jurisdiction: 'Pittsburgh', shape: 'percentOfIncome', amount: income * d.pittsburgh.residentTotal,
      basis: `${pct(d.pittsburgh.residentTotal)} resident — ${pct(d.pittsburgh.cityShare)} city plus ${pct(d.pittsburgh.schoolShare)} school, and the school share does not reach nonresidents`,
      reachesSelfEmployment: true,
    });
    add({
      jurisdiction: 'Local Services Tax', shape: 'flatPerYear', amount: d.localServicesTax.statutoryMaxPerYear,
      basis: `up to ${formatMoney(d.localServicesTax.statutoryMaxPerYear)} a year in flat dollars, by work location, exempt below ${formatMoney(d.localServicesTax.lowIncomeExemptionThreshold)} of earned income`,
      reachesSelfEmployment: true,
    });
  }

  // Named city levies with a single rate, or a resident/nonresident pair.
  if (code === 'KY' || code === 'AL' || code === 'MO' || code === 'DE') {
    for (const [name, j] of Object.entries(d.jurisdictions as Record<string, any>)) {
      if (typeof j.resident === 'number') {
        add({
          jurisdiction: name, shape: 'percentOfIncome', amount: income * j.resident,
          basis: `${pct(j.resident)} resident, ${pct(j.nonresident, 3)} nonresident`,
          reachesSelfEmployment: j.netProfit != null ? true : seRule,
        });
      } else if (typeof j.earnedIncomeTax === 'number') {
        add({
          jurisdiction: name, shape: 'percentOfIncome', amount: income * j.earnedIncomeTax,
          basis: `${pct(j.earnedIncomeTax)} on wages and the same on net profits`,
          reachesSelfEmployment: true,
        });
      } else if (typeof j.rate === 'number') {
        add({
          jurisdiction: name, shape: 'percentOfIncome', amount: income * j.rate,
          basis: pct(j.rate), reachesSelfEmployment: seRule,
        });
      }
    }
  }

  return out;
}

function creditIsCapped(c: any): boolean {
  return (c.creditPct ?? 1) < 1 || (c.creditRateLimit ?? Infinity) < c.rate;
}

/**
 * Ohio cities where the credit for tax paid to your work city is capped below
 * your own city's rate. This is the one that changes the answer by DIRECTION:
 * a resident who works elsewhere still owes their home city the difference,
 * where a full-credit city would leave them owing nothing.
 */
export function ohioCreditTraps(): Array<{ city: string; rate: number; cap: number; owed: number }> {
  const d = localTaxFor('OH');
  if (!d?.cities) return [];
  return Object.entries(d.cities as Record<string, any>)
    .filter(([, c]) => creditIsCapped(c))
    .map(([city, c]) => ({
      city,
      rate: c.rate,
      cap: (c.creditRateLimit ?? 0) * (c.creditPct ?? 1),
      owed: Math.max(0, c.rate - (c.creditRateLimit ?? 0) * (c.creditPct ?? 1)),
    }))
    .sort((a, b) => b.owed - a.owed);
}

/**
 * Whether the state's local tax reaches self-employment net profit.
 *
 * Not simply a field read. Two entries do not carry a boolean: West Virginia
 * records prose ("n/a as a rate; self-employed people working in the city are
 * liable for the flat weekly fee") because the levy is not a rate at all, and
 * New York records the answer per levy rather than per state. Reading the field
 * naively made both render as "not confirmed" — the one wrong answer this
 * dataset exists to avoid, because unconfirmed reads as "you don't owe it".
 */
export function reachesSelfEmployment(code: string): boolean | null {
  const d = localTaxFor(code);
  if (!d) return null;
  if (typeof d.appliesToSelfEmploymentNetProfit === 'boolean') {
    return d.appliesToSelfEmploymentNetProfit;
  }
  // Fall back to the levies themselves — unanimous or nothing.
  const perLevy = code === 'NY'
    ? [d.nycResidentTax, d.nycUnincorporatedBusinessTax, d.yonkersResidentSurcharge]
        .map((l) => l?.appliesToSelfEmploymentNetProfit)
    : Object.values(d.jurisdictions ?? {}).map((j: any) => j.appliesToSelfEmployed);
  const known = perLevy.filter((v) => typeof v === 'boolean');
  if (!known.length) return null;
  return known.every((v) => v === true) ? true : known.every((v) => v === false) ? false : null;
}

/** The traps a state page must state, drawn from the researched notes. */
export function localTraps(code: string): string[] {
  const d = localTaxFor(code);
  if (!d) return [];
  return [
    d._notes, d.stackingRule, d.namingTrap, d.remoteWorkRule,
    d.creditCapsAreNotUniform, d.businessIncomeDeductionNote,
    d.eit?.sCorpNote, d.eit?.selfEmploymentNote, d.localServicesTax?.selfEmploymentNote,
    d.nonresidentRule, d.generalRule, d.statewideTransitTax,
    // West Virginia records its self-employment answer as prose, not a boolean,
    // because the levy is not a rate. It belongs on the page either way.
    typeof d.appliesToSelfEmploymentNetProfit === 'string'
      ? d.appliesToSelfEmploymentNetProfit
      : null,
  ].filter((s): s is string => typeof s === 'string' && s.length > 0);
}

/** One-line description of a state's shape, for the hub table. */
export function localShape(code: string): string {
  return localTaxFor(code)?.shape ?? '';
}

/** The spread across a state's computable levies — what the hub table shows. */
export function localRange(code: string, income: number): { low: number; high: number } | null {
  const amounts = levyExamples(code, income)
    .map((l) => l.amount)
    .filter((a): a is number => a !== null);
  if (!amounts.length) return null;
  return { low: Math.min(...amounts), high: Math.max(...amounts) };
}
