import { describe, expect, it } from "vitest";
import { addRecurrencePeriod, nextRecurrenceAfter, scheduledWindowForDate } from "./recurrence-rules.js";

describe("recurrence rules", () => {
  it("clamps month-end recurrence without drifting into the next month", () => {
    expect(addRecurrencePeriod("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(addRecurrencePeriod("2028-01-31", "monthly")).toBe("2028-02-29");
  });

  it("supports the existing maintenance-plan frequencies", () => {
    expect(addRecurrencePeriod("2026-02-15", "quarterly")).toBe("2026-05-15");
    expect(addRecurrencePeriod("2026-02-15", "biannual")).toBe("2026-08-15");
    expect(addRecurrencePeriod("2026-02-15", "annual")).toBe("2027-02-15");
  });

  it("advances overdue plans to the first future recurrence", () => {
    expect(nextRecurrenceAfter("2026-01-10", "monthly", "2026-09-12")).toBe("2026-10-10");
  });

  it("uses the deterministic default field window", () => {
    expect(scheduledWindowForDate("2026-09-12")).toEqual({
      start: "2026-09-12T09:00:00.000Z",
      end: "2026-09-12T10:00:00.000Z",
    });
  });
});
