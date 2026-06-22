import { describe, it, expect } from "vitest";
import { formatMoney, formatDate, formatDateTime } from "./format";

describe("formatMoney", () => {
  it("formats USD with the dollar sign and grouping", () => {
    expect(formatMoney(12000, "USD")).toBe("$12,000.00");
  });

  it("distinguishes CAD from USD", () => {
    expect(formatMoney(9605, "CAD")).toBe("CA$9,605.00");
  });

  it("formats GBP with the pound sign", () => {
    expect(formatMoney(51500, "GBP")).toBe("£51,500.00");
  });

  it("renders cents", () => {
    expect(formatMoney(1234.5, "USD")).toBe("$1,234.50");
  });
});

describe("formatDate", () => {
  it("formats a 'YYYY-MM-DD' string as a short UTC date", () => {
    expect(formatDate("2026-05-04")).toBe("May 4, 2026");
  });

  // The function pins timeZone:UTC precisely so the rendered day never drifts
  // with the server's local timezone — a late-UTC instant stays on its UTC day.
  it("does not drift the day for a late-UTC timestamp", () => {
    expect(formatDate("2026-01-01T23:30:00Z")).toBe("Jan 1, 2026");
  });
});

describe("formatDateTime", () => {
  it("includes date and time in UTC", () => {
    // Assert on parts (avoid coupling to the exact AM/PM space character ICU uses).
    const out = formatDateTime("2026-05-04T14:05:00Z");
    expect(out).toContain("May 4, 2026");
    expect(out).toMatch(/2:05/);
    expect(out).toMatch(/PM/);
  });
});
