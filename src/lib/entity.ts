/**
 * Entity comparison: sole proprietor / LLC, S corporation, C corporation.
 *
 * The engine's compareEntities() covers sole proprietor, LLC and S corp but
 * has no C corporation at all, ignores the payroll and filing cost of running
 * an S corp, and ignores what the STATE charges the company — which is what
 * decides the answer in about a third of states. This adds those, and composes
 * the existing engine and the researched state dataset rather than duplicating
 * either.
 *
 * WHY THE C CORP IS NOT SIMPLY WORSE. Its 21% rate is lower than most owners'
 * personal rates, so profit LEFT INSIDE the company is taxed lightly. What
 * makes it expensive is taking the money out: the company pays 21%, then the
 * shareholder pays dividend tax on what is distributed. So the answer turns
 * entirely on how much you actually need to withdraw — which is why this asks.
 */
import {
  calcFederalTax, calcSETax, calcFICA, calcQBI, calcLTCGTax, calcStateTax,
  getStandardDeduction, formatMoney,
} from './tax-engine';
import { entityTypes } from '../data/federal';
import { entityLevelTax, PAYROLL_ADMIN_COST, DEFENSIBLE_SALARY_PCT } from './scorp';
import type { Disclosure } from './scorp';

const CCORP_RATE = (entityTypes as any).cCorporation.corporateTaxRate as number;

export interface EntityOption {
  key: 'soleProp' | 'sCorp' | 'cCorp';
  label: string;
  /** Total tax across every layer, including entity-level state charges. */
  totalTax: number;
  /** What lands in your pocket after tax and after running costs. */
  afterTax: number;
  /** Rows for the breakdown table. */
  lines: Array<{ label: string; amount: number }>;
  /** Running cost of the structure — payroll, filings — not a tax. */
  runningCost: number;
  /** Charges that are real but need facts this calculator does not have. */
  disclosures: Disclosure[];
  /** Why this option lands where it does. */
  note: string;
}

export interface EntityInput {
  netProfit: number;
  /** Other W-2 wages, which use up the Social Security wage base first. */
  otherW2: number;
  filingStatus: string;
  stateCode: string;
  /** Share of profit taken as salary in the S corp. */
  salaryPct: number;
  /**
   * How much of the profit you actually need to live on.
   *
   * This is the input that decides the C corporation, and the one every
   * simplified comparison leaves out. Money left in the company is taxed once
   * at 21%; money taken out is taxed again as a dividend.
   */
  withdrawPct: number;
  /** Annual payroll and filing cost of running a corporation. */
  runningCost: number;
}

export interface EntityComparison {
  options: EntityOption[];
  best: EntityOption;
  /** Difference between best and the sole proprietor baseline. */
  savingVsSoleProp: number;
  warnings: string[];
}

export function compareEntityChoices(input: EntityInput): EntityComparison {
  const { netProfit, otherW2, filingStatus, stateCode, salaryPct, withdrawPct, runningCost } = input;
  const stdDed = getStandardDeduction(filingStatus, false);
  const warnings: string[] = [];

  /* ---------------------------------------------- sole proprietor / LLC ---- */
  const se = calcSETax(netProfit, undefined, otherW2, filingStatus);
  const agiSole = otherW2 + netProfit - se.deductibleHalf;
  const beforeQbiSole = Math.max(0, agiSole - stdDed);
  const qbiSole = calcQBI(netProfit, beforeQbiSole, filingStatus);
  const fedSole = calcFederalTax(Math.max(0, beforeQbiSole - qbiSole), filingStatus);
  const stateSole = stateTaxOn(agiSole, stateCode, filingStatus);
  const totalSole = fedSole + se.totalSE + stateSole;

  const soleProp: EntityOption = {
    key: 'soleProp',
    label: 'Sole proprietor or LLC',
    totalTax: totalSole,
    afterTax: netProfit + otherW2 - totalSole,
    runningCost: 0,
    disclosures: [],
    lines: [
      { label: 'Self-employment tax on the whole profit', amount: se.totalSE },
      { label: 'Federal income tax', amount: fedSole },
      { label: 'State income tax', amount: stateSole },
    ],
    note: 'Self-employment tax applies to every dollar of profit. An LLC on its own changes your legal position, not your tax — it is taxed identically to a sole proprietorship unless you elect otherwise.',
  };

  /* ------------------------------------------------------------- S corp ---- */
  const salary = Math.max(0, netProfit * (salaryPct / 100));
  const fica = calcFICA(salary, undefined, otherW2, filingStatus);
  // The owner bears both halves: the employer share comes out of the same profit.
  const distribution = Math.max(0, netProfit - salary - fica.employerFICA - runningCost);
  const agiS = otherW2 + salary + distribution;
  const beforeQbiS = Math.max(0, agiS - stdDed);
  const qbiS = calcQBI(distribution, beforeQbiS, filingStatus);
  const fedS = calcFederalTax(Math.max(0, beforeQbiS - qbiS), filingStatus);
  const stateS = stateTaxOn(agiS, stateCode, filingStatus);
  const entity = entityLevelTax(stateCode, netProfit);
  const totalS = fedS + fica.totalFICA + stateS + (entity.unknown ? 0 : entity.amount);

  const sCorp: EntityOption = {
    key: 'sCorp',
    label: 'S corporation',
    totalTax: totalS,
    afterTax: netProfit + otherW2 - totalS - runningCost,
    runningCost,
    disclosures: entity.disclosures,
    lines: [
      { label: `Payroll tax on ${formatMoney(salary)} of salary`, amount: fica.totalFICA },
      { label: 'Federal income tax', amount: fedS },
      { label: 'State income tax', amount: stateS },
      ...(entity.unknown || entity.amount === 0 ? [] : [{ label: 'What the state charges the company', amount: entity.amount }]),
    ],
    note: `Payroll tax applies only to the ${formatMoney(salary)} salary, not to the ${formatMoney(distribution)} distribution. That is the whole saving, and it is reduced by the payroll and filing cost of running the company.`,
  };

  /* ------------------------------------------------------------- C corp ---- */
  // Salary is deductible to the company; what is left is taxed at 21%; what you
  // then withdraw is taxed again as a qualified dividend.
  const cSalary = Math.max(0, netProfit * (salaryPct / 100));
  const cFica = calcFICA(cSalary, undefined, otherW2, filingStatus);
  const corporateProfit = Math.max(0, netProfit - cSalary - cFica.employerFICA - runningCost);
  const corporateTax = corporateProfit * CCORP_RATE;
  const afterCorporate = corporateProfit - corporateTax;
  const dividend = afterCorporate * (withdrawPct / 100);
  const retained = afterCorporate - dividend;

  const agiC = otherW2 + cSalary;
  const beforeDedC = Math.max(0, agiC - stdDed);
  const fedCSalary = calcFederalTax(beforeDedC, filingStatus);
  // Qualified dividends stack on top of ordinary income at capital-gains rates.
  const dividendTax = dividend > 0 ? calcLTCGTax(dividend, beforeDedC, filingStatus) : 0;
  const stateC = stateTaxOn(agiC + dividend, stateCode, filingStatus);
  const totalC = corporateTax + fedCSalary + cFica.totalFICA + dividendTax + stateC;

  const cCorp: EntityOption = {
    key: 'cCorp',
    label: 'C corporation',
    totalTax: totalC,
    // Retained profit is yours but not in your pocket, so it is excluded from
    // take-home and reported separately rather than quietly counted as income.
    afterTax: cSalary + dividend + otherW2 - fedCSalary - cFica.totalFICA - dividendTax - stateC,
    runningCost,
    disclosures: [],
    lines: [
      { label: `Corporation tax at ${(CCORP_RATE * 100).toFixed(0)}% on ${formatMoney(corporateProfit)}`, amount: corporateTax },
      { label: `Payroll tax on ${formatMoney(cSalary)} of salary`, amount: cFica.totalFICA },
      { label: 'Federal income tax on your salary', amount: fedCSalary },
      ...(dividendTax > 0 ? [{ label: `Dividend tax on ${formatMoney(dividend)} withdrawn`, amount: dividendTax }] : []),
      { label: 'State income tax', amount: stateC },
    ],
    note: retained > 0
      ? `${formatMoney(retained)} stays in the company, taxed once at ${(CCORP_RATE * 100).toFixed(0)}% and not yet taxed to you. It is not in your pocket — take it out later and dividend tax applies then.`
      : 'Taking all the profit out means paying corporation tax and then dividend tax on the same money. That double layer is what usually makes a C corporation the expensive option for an owner who needs the cash.',
  };

  const options = [soleProp, sCorp, cCorp];
  // Compare on what you actually keep, not on tax paid: the C corp can show a
  // low tax figure purely because the money is still inside the company.
  const best = options.reduce((a, b) => (b.afterTax > a.afterTax ? b : a));

  /* -------------------------------------------------------- warnings ------ */
  // The percentage warning is not enough on its own. 40% of a small profit is a
  // salary nobody could defend for full-time work, and the arithmetic will still
  // recommend the election. Flag the ABSOLUTE figure, which is what an examiner
  // actually looks at.
  if (salary > 0 && salary < 25000) {
    warnings.push(
      `A ${formatMoney(salary)} salary is very low in absolute terms. If you work in this business full time, that is difficult to defend as reasonable compensation whatever percentage of profit it represents — and it is the figure itself, not the percentage, that gets examined. The S corporation saving shown here depends on it.`,
    );
  }
  if (salaryPct < 30) {
    warnings.push(
      `A salary of ${salaryPct}% of profit is low. Compensation has to be reasonable for the work you actually do, and setting it too low invites reclassification and back payroll tax with interest. The cheapest row is the riskiest one.`,
    );
  }
  if (netProfit < 40000 && best.key === 'sCorp') {
    warnings.push(
      'At this level of profit the payroll and filing cost is a large share of the saving. The arithmetic may favour electing, but the margin is thin enough that a year of lower profit reverses it.',
    );
  }
  // Two very different situations share the same flag in the dataset, and
  // conflating them misleads. Tennessee taxes an S corporation's income as if
  // it were a C corporation, so electing genuinely creates a tax. Texas has no
  // corporate income tax at all — its margin tax falls on every entity alike,
  // so the election gives no relief but costs nothing extra either.
  if (entity.taxedAsCCorp && entity.amount > 0) {
    warnings.push(
      `This state does not recognize the federal S election and charges the company ${formatMoney(entity.amount)} — ${entity.basis}. Electing here creates a state tax rather than avoiding one, and that is already counted above.`,
    );
  } else if (entity.taxedAsCCorp) {
    warnings.push(
      'This state does not give an S corporation any relief from its own business tax — that tax falls on every entity alike. It is not an extra cost of electing, but it is not avoided by electing either.',
    );
  }
  if (entity.unknown) {
    warnings.push('What this state charges an S corporation has not been researched yet, so the S corporation figure counts the federal saving only and is probably optimistic.');
  }
  if (retained > 0) {
    warnings.push(
      `The C corporation figure assumes you leave ${formatMoney(retained)} in the company. That money is not income to you yet — comparing take-home is only fair if you genuinely do not need it.`,
    );
  }

  return { options, best, savingVsSoleProp: best.afterTax - soleProp.afterTax, warnings };
}

function stateTaxOn(income: number, stateCode: string, status: string): number {
  return stateCode ? calcStateTax(income, stateCode, undefined, status).tax : 0;
}

export { PAYROLL_ADMIN_COST, DEFENSIBLE_SALARY_PCT, CCORP_RATE };
