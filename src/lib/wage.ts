/**
 * Wage arithmetic — overtime, hourly/salary conversion, and raises.
 *
 * No tax data enters these. They are pay computations, ported from the legacy
 * views of the same names, and the parity tests in check-wage.mjs compare them
 * to a faithful transcription of the legacy formulas. Where a figure would need
 * the tax engine (the take-home on a raise, say) the page links to the paycheck
 * calculator rather than duplicating it here.
 */

/* ------------------------------------------------------- overtime pay ------ */

export type OvertimeRule = 'federal' | 'california';

export interface DayHours { day: string; hours: number }

export interface OvertimeResult {
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  /** Blended rate across all hours worked. */
  effectiveHourly: number;
}

/**
 * Weekly pay from a set of daily hours, under either federal (weekly-only) or
 * California (daily-and-weekly) overtime rules.
 *
 * Federal FLSA: overtime is hours over 40 in the week. California: overtime is
 * hours over 8 in a day OR over 40 in the week, whichever gives more — the
 * legacy calculator resolves this per day against a running weekly total, and
 * this reproduces that exactly.
 */
export function overtimePay(
  days: DayHours[],
  hourlyRate: number,
  multiplier = 1.5,
  rule: OvertimeRule = 'california',
  dailyThreshold = 8,
  weeklyThreshold = 40,
): OvertimeResult {
  const rate = Math.max(0, hourlyRate);
  let regularHours = 0;
  let overtimeHours = 0;
  let weeklyRegularAccum = 0;

  for (const d of days) {
    const h = Math.max(0, d.hours);
    if (rule === 'federal') {
      // Weekly only: everything is regular until the week passes 40.
      const remainingWeeklyReg = Math.max(0, weeklyThreshold - weeklyRegularAccum);
      const reg = Math.min(h, remainingWeeklyReg);
      const ot = h - reg;
      regularHours += reg;
      overtimeHours += ot;
      weeklyRegularAccum += reg;
    } else {
      // California: daily overtime first, then whatever the week has left.
      const dailyReg = Math.min(h, dailyThreshold);
      const dailyOt = h - dailyReg;
      const remainingWeeklyReg = Math.max(0, weeklyThreshold - weeklyRegularAccum);
      const reg = Math.min(dailyReg, remainingWeeklyReg);
      const weeklyOt = dailyReg - reg;
      regularHours += reg;
      overtimeHours += dailyOt + weeklyOt;
      weeklyRegularAccum += reg;
    }
  }

  const regularPay = regularHours * rate;
  const overtimePayAmt = overtimeHours * rate * multiplier;
  const totalPay = regularPay + overtimePayAmt;
  const totalHours = regularHours + overtimeHours;
  return {
    regularHours, overtimeHours, regularPay, overtimePay: overtimePayAmt,
    totalPay, effectiveHourly: totalHours > 0 ? totalPay / totalHours : 0,
  };
}

/* --------------------------------------------------- hourly to salary ------ */

export interface HourlyToSalaryResult {
  annual: number;
  monthly: number;
  biweekly: number;
  weekly: number;
  daily: number;
  /** Blended rate once overtime and unpaid weeks are counted. */
  effectiveHourly: number;
}

/**
 * Annualise an hourly wage, accounting for overtime hours, unpaid weeks off,
 * and any bonus or other income. Ported from hourlyToSalaryView.
 */
export function hourlyToSalary(
  hourlyRate: number,
  hoursPerWeek: number,
  weeksPerYear = 52,
  overtimeMultiplier = 1.5,
  overtimeHoursPerWeek = 0,
  unpaidWeeks = 0,
  bonus = 0,
  other = 0,
): HourlyToSalaryResult {
  const rate = Math.max(0, hourlyRate);
  const effectiveWeeks = Math.max(0, weeksPerYear - unpaidWeeks);
  const regularPay = rate * Math.max(0, hoursPerWeek) * effectiveWeeks;
  const overtimePayAmt = rate * overtimeMultiplier * Math.max(0, overtimeHoursPerWeek) * effectiveWeeks;
  const annual = regularPay + overtimePayAmt + Math.max(0, bonus) + Math.max(0, other);
  const totalHours = (Math.max(0, hoursPerWeek) + Math.max(0, overtimeHoursPerWeek)) * effectiveWeeks;
  return {
    annual,
    monthly: annual / 12,
    biweekly: annual / 26,
    weekly: annual / 52,
    daily: annual / 260,
    effectiveHourly: totalHours > 0 ? annual / totalHours : 0,
  };
}

/** Hourly rate implied by a salary. The inverse, for the salary-to-hourly page. */
export function salaryToHourly(annual: number, hoursPerWeek = 40, weeksPerYear = 52): number {
  const totalHours = Math.max(0, hoursPerWeek) * Math.max(1, weeksPerYear);
  return totalHours > 0 ? Math.max(0, annual) / totalHours : 0;
}

/* ------------------------------------------------------------ raise -------- */

export interface RaiseResult {
  oldTotal: number;
  newTotal: number;
  dollarChange: number;
  percentChange: number;
  isRaise: boolean;
  /** Salary that would merely keep pace with inflation. */
  inflationTarget: number;
  /** Positive means the raise beats inflation; negative means it lags. */
  vsInflation: number;
}

/**
 * Old comp against new comp: the percentage change, and whether it keeps pace
 * with inflation. Ported from raiseCalculatorView. Salary plus bonus on each
 * side; the take-home difference is a link to the paycheck calculator, not a
 * figure computed here.
 */
export function raise(
  oldSalary: number,
  newSalary: number,
  inflationPct = 3,
  oldBonus = 0,
  newBonus = 0,
): RaiseResult {
  const oldTotal = Math.max(0, oldSalary) + Math.max(0, oldBonus);
  const newTotal = Math.max(0, newSalary) + Math.max(0, newBonus);
  const dollarChange = newTotal - oldTotal;
  const inflationTarget = oldTotal * (1 + inflationPct / 100);
  return {
    oldTotal, newTotal, dollarChange,
    percentChange: oldTotal > 0 ? (dollarChange / oldTotal) * 100 : 0,
    isRaise: dollarChange >= 0,
    inflationTarget,
    vsInflation: newTotal - inflationTarget,
  };
}
