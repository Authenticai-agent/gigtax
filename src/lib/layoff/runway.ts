/**
 * Layoff runway — the anchor calculator (task_layoff.md Phase 2).
 *
 * Chains the other three engines into the one answer that matters: how many
 * months until the money runs out. Net severance and net monthly UI (already net
 * of tax — the UI-taxability feedback happens upstream) plus savings and any
 * other income fund essential spending and the chosen health premium, month by
 * month, until the balance hits zero. Returns the runway, the month UI is
 * exhausted, the month-by-month balance for the chart, and the break-even
 * job-start month.
 */
const WEEKS_PER_MONTH = 52 / 12; // 4.333…
const HORIZON_MONTHS = 60;

export interface RunwayInput {
  savings: number;
  netSeverance: number;
  /** Monthly UI already net of tax. */
  monthlyUINet: number;
  uiWeeks: number;
  monthlyEssentialSpend: number;
  healthPremiumMonthly: number;
  otherMonthlyIncome: number;
}

export interface RunwayMonth { month: number; income: number; balance: number; uiActive: boolean }

export interface RunwayResult {
  startingBalance: number;
  monthlyBurn: number;
  uiDurationMonths: number;
  monthUIExhausts: number;
  monthsOfRunway: number;
  runsOut: boolean;
  /** First month the balance would go negative — you need income by then. */
  breakEvenJobStartMonth: number | null;
  balanceCurve: RunwayMonth[];
}

export function runway(i: RunwayInput): RunwayResult {
  const startingBalance = i.savings + i.netSeverance;
  const uiDurationMonths = i.uiWeeks / WEEKS_PER_MONTH;
  const outflow = i.monthlyEssentialSpend + i.healthPremiumMonthly;

  const balanceCurve: RunwayMonth[] = [];
  let balance = startingBalance;
  let breakEven: number | null = null;
  let lastPositiveMonth = 0;

  for (let m = 1; m <= HORIZON_MONTHS; m++) {
    const uiActive = m <= uiDurationMonths;
    // Partial UI in the month it runs out.
    const uiThisMonth = m <= Math.floor(uiDurationMonths)
      ? i.monthlyUINet
      : uiActive ? i.monthlyUINet * (uiDurationMonths - Math.floor(uiDurationMonths)) : 0;
    const income = i.otherMonthlyIncome + uiThisMonth;
    balance += income - outflow;
    balanceCurve.push({ month: m, income: Math.round(income), balance: Math.round(balance), uiActive });
    if (balance >= 0) lastPositiveMonth = m;
    if (balance < 0 && breakEven === null) { breakEven = m; break; }
  }

  const runsOut = breakEven !== null;
  return {
    startingBalance: Math.round(startingBalance),
    monthlyBurn: Math.round(outflow),
    uiDurationMonths: Math.round(uiDurationMonths * 10) / 10,
    monthUIExhausts: Math.ceil(uiDurationMonths),
    monthsOfRunway: runsOut ? lastPositiveMonth : HORIZON_MONTHS,
    runsOut,
    breakEvenJobStartMonth: breakEven,
    balanceCurve,
  };
}
