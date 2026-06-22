// Tax rate is stored as a fraction (0.085) but entered/displayed as a percent
// (8.5), which is what an accountant expects to type. These convert between the
// two and absorb binary-float noise (0.085 * 100 === 8.499999999999998).

/** Fraction → percent string for display: 0.085 → "8.5", 0 → "0". */
export function fractionToPercent(fraction: number): string {
  return parseFloat((fraction * 100).toFixed(6)).toString();
}

/** Typed percent string → fraction: "8.5" → 0.085. NaN if not a number. */
export function percentToFraction(percent: string): number {
  const n = Number(percent);
  return Number.isFinite(n) ? n / 100 : NaN;
}
