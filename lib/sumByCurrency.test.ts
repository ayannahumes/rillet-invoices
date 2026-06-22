import { describe, it, expect } from "vitest";
import { sumByCurrency } from "./sumByCurrency";

describe("sumByCurrency", () => {
  it("returns an empty map for no items", () => {
    expect(sumByCurrency([]).size).toBe(0);
  });

  it("sums amounts within the same currency", () => {
    const totals = sumByCurrency([
      { currency: "USD", amount: 100 },
      { currency: "USD", amount: 50.5 },
    ]);
    expect(totals.get("USD")).toBe(150.5);
    expect(totals.size).toBe(1);
  });

  it("keeps currencies separate — never combines them", () => {
    const totals = sumByCurrency([
      { currency: "USD", amount: 100 },
      { currency: "CAD", amount: 200 },
      { currency: "USD", amount: 25 },
    ]);
    expect(totals.get("USD")).toBe(125);
    expect(totals.get("CAD")).toBe(200);
    expect(totals.size).toBe(2);
  });

  it("preserves insertion order of currencies", () => {
    const totals = sumByCurrency([
      { currency: "GBP", amount: 1 },
      { currency: "USD", amount: 1 },
    ]);
    expect([...totals.keys()]).toEqual(["GBP", "USD"]);
  });
});
