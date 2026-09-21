import { describe, expect, it } from "vitest";
import { summarizeAttendance } from "./attendance";

describe("summarizeAttendance", () => {
  it("derives weekly overtime without mutating clock facts", () => {
    const rows = [
      { user_id: "u1", clock_in_at: "2026-09-07T00:00:00.000Z", clock_out_at: "2026-09-08T16:00:00.000Z", status: "closed" as const },
      { user_id: "u1", clock_in_at: "2026-09-09T00:00:00.000Z", clock_out_at: "2026-09-09T08:00:00.000Z", status: "closed" as const },
    ];
    const summary = summarizeAttendance("u1", rows, 40 * 60, new Date("2026-09-10T00:00:00.000Z"));
    expect(summary.workedMinutes).toBe(48 * 60);
    expect(summary.regularMinutes).toBe(40 * 60);
    expect(summary.overtimeMinutes).toBe(8 * 60);
  });

  it("counts open sessions to now", () => {
    const summary = summarizeAttendance("u1", [
      { user_id: "u1", clock_in_at: "2026-09-09T08:00:00.000Z", clock_out_at: null, status: "open" },
    ], 40 * 60, new Date("2026-09-09T10:30:00.000Z"));
    expect(summary.workedMinutes).toBe(150);
    expect(summary.openSessionCount).toBe(1);
  });
});
