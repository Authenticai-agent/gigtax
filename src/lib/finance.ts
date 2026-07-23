/**
 * Shared personal-finance math — the standard time-value-of-money formulas the
 * lifestyle and personal-finance calculators are built on.
 *
 * None of this is tax data: it is compound interest, annuities and loan
 * amortization, the same formulas every financial calculator uses. Rates of
 * return and inflation are always caller-supplied assumptions, never facts baked
 * in here — the calculators surface them as editable inputs and label them as
 * assumptions.
 */

/** Future value of a single lump sum growing at an annual rate for n years. */
export function futureValueLump(present: number, annualRate: number, years: number): number {
  return present * Math.pow(1 + annualRate, years);
}

/**
 * Future value of a recurring contribution (an ordinary annuity), compounded per
 * period. Default is monthly contributions compounded monthly.
 */
export function futureValueAnnuity(payment: number, annualRate: number, years: number, perYear = 12): number {
  const r = annualRate / perYear;
  const n = years * perYear;
  if (r === 0) return payment * n;
  return payment * ((Math.pow(1 + r, n) - 1) / r);
}

/** Level payment that amortizes a loan (mortgage, car, card) over a term. */
export function loanPayment(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

/**
 * Months to pay off a balance at a fixed monthly payment and APR. Returns
 * Infinity when the payment cannot even cover the interest.
 */
export function payoffMonths(balance: number, annualRate: number, payment: number): number {
  const r = annualRate / 12;
  if (r === 0) return Math.ceil(balance / payment);
  if (payment <= balance * r) return Infinity;
  return Math.ceil(-Math.log(1 - (balance * r) / payment) / Math.log(1 + r));
}

/** The real (inflation-adjusted) rate from a nominal rate and inflation. */
export function realRate(nominalRate: number, inflation: number): number {
  return (1 + nominalRate) / (1 + inflation) - 1;
}

/** Total interest paid over the life of a loan. */
export function totalInterest(principal: number, annualRate: number, months: number): number {
  return loanPayment(principal, annualRate, months) * months - principal;
}
