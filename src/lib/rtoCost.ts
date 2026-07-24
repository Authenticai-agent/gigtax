/**
 * Return-to-office cost engine (add-on task 4). Pure arithmetic on the user's
 * own inputs — no tax tables beyond the IRS standard mileage rate, which is
 * imported from the verified federal dataset.
 *
 * Design choice the file calls for: report money and time as SEPARATE headline
 * figures, never silently monetising hours into one number. `annualMoney` is
 * out-of-pocket dollars; `annualHours` is time; `totalWithTime` monetises the
 * hours only for the people who want that view. The "equivalent raise" grosses
 * up the out-of-pocket money by a marginal rate, because commute costs are paid
 * with after-tax dollars.
 */
import { MILEAGE_2026 } from './deductions';

export type CommuteMode = 'car' | 'transit' | 'walk_bike';

export interface RtoInput {
  /** The mandate under test, days in office per week. */
  daysInOfficePerWeek: number;
  oneWayDistanceMiles: number;
  mode: CommuteMode;
  /** Per-mile car cost; defaults to the 2026 second-half IRS rate. */
  mileageRatePerMile: number;
  parkingPerOfficeDay: number;
  transitFareRoundTrip: number;
  commuteMinutesEachWay: number;
  hourlyValueOfTime: number;
  lunchDeltaPerOfficeDay: number;
  coffeeDeltaPerOfficeDay: number;
  wardrobePerYear: number;
  childcareDeltaPerOfficeDay: number;
  weeksWorkedPerYear: number;
  marginalTaxRate: number;
}

export interface RtoScenario {
  daysPerWeek: number;
  annualMoney: number;
  annualHours: number;
  annualTimeValue: number;
  totalWithTime: number;
  equivalentRaise: number;
}

export interface RtoResult {
  moneyPerOfficeDay: number;
  hoursPerOfficeDay: number;
  mandate: RtoScenario;
  fullRto: RtoScenario;
  remote: RtoScenario;
  mileageRateUsed: number;
}

function commuteMoneyPerDay(i: RtoInput): number {
  const travel = i.mode === 'car'
    ? 2 * i.oneWayDistanceMiles * i.mileageRatePerMile
    : i.mode === 'transit'
      ? i.transitFareRoundTrip
      : 0; // walk / bike
  return travel + i.parkingPerOfficeDay;
}

function scenario(i: RtoInput, daysPerWeek: number): RtoScenario {
  const moneyPerDay = commuteMoneyPerDay(i) + i.lunchDeltaPerOfficeDay + i.coffeeDeltaPerOfficeDay + i.childcareDeltaPerOfficeDay;
  const hoursPerDay = (i.commuteMinutesEachWay * 2) / 60;
  const daysPerYear = daysPerWeek * i.weeksWorkedPerYear;

  const annualMoney = moneyPerDay * daysPerYear + (daysPerWeek > 0 ? i.wardrobePerYear : 0);
  const annualHours = hoursPerDay * daysPerYear;
  const annualTimeValue = annualHours * i.hourlyValueOfTime;
  const equivalentRaise = i.marginalTaxRate < 1 ? annualMoney / (1 - i.marginalTaxRate) : annualMoney;

  return {
    daysPerWeek,
    annualMoney: Math.round(annualMoney),
    annualHours: Math.round(annualHours),
    annualTimeValue: Math.round(annualTimeValue),
    totalWithTime: Math.round(annualMoney + annualTimeValue),
    equivalentRaise: Math.round(equivalentRaise),
  };
}

export function rtoCost(i: RtoInput): RtoResult {
  return {
    moneyPerOfficeDay: Math.round(commuteMoneyPerDay(i) + i.lunchDeltaPerOfficeDay + i.coffeeDeltaPerOfficeDay + i.childcareDeltaPerOfficeDay),
    hoursPerOfficeDay: Math.round(((i.commuteMinutesEachWay * 2) / 60) * 10) / 10,
    mandate: scenario(i, i.daysInOfficePerWeek),
    fullRto: scenario(i, 5),
    remote: scenario(i, 0),
    mileageRateUsed: i.mileageRatePerMile,
  };
}

/** The 2026 IRS rate the tool defaults the car field to (second-half, current). */
export const DEFAULT_MILEAGE_RATE = MILEAGE_2026.secondHalf;
