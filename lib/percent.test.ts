import { describe, it, expect } from "vitest";
import { fractionToPercent, percentToFraction } from "./percent";

describe("fractionToPercent", () => {
  it("converts a fraction to a percent string", () => {
    expect(fractionToPercent(0.1)).toBe("10");
    expect(fractionToPercent(0.0825)).toBe("8.25");
    expect(fractionToPercent(0)).toBe("0");
  });

  it("absorbs binary-float noise (0.085 * 100 ≈ 8.4999…)", () => {
    expect(fractionToPercent(0.085)).toBe("8.5");
  });
});

describe("percentToFraction", () => {
  it("converts a typed percent to a fraction", () => {
    expect(percentToFraction("8.5")).toBeCloseTo(0.085, 10);
    expect(percentToFraction("10")).toBeCloseTo(0.1, 10);
    expect(percentToFraction("0")).toBe(0);
  });

  it("treats an empty string as 0 (no tax)", () => {
    expect(percentToFraction("")).toBe(0);
  });

  it("returns NaN for non-numeric input (so validation rejects it)", () => {
    expect(Number.isNaN(percentToFraction("8.5%"))).toBe(true);
    expect(Number.isNaN(percentToFraction("abc"))).toBe(true);
  });

  it("round-trips with fractionToPercent", () => {
    expect(percentToFraction(fractionToPercent(0.085))).toBeCloseTo(0.085, 10);
  });
});
