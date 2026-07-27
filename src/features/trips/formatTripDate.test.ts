import { describe, expect, it } from "vitest";

import { formatTripDate } from "./formatTripDate";

describe("formatTripDate", () => {
  it("formats a date-only string as day/short-month/year", () => {
    expect(formatTripDate("2026-08-02")).toBe("2 Aug 2026");
  });

  it("returns a fallback string for a null date", () => {
    expect(formatTripDate(null)).toBe("No date yet");
  });
});
