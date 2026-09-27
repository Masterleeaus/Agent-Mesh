import { describe, expect, it } from "vitest";
import { buildCapacity, minutesBetween } from "./capacity";

describe("dispatch capacity", () => {
  it("computes positive scheduled minutes", () => {
    expect(minutesBetween("2026-09-14T08:00:00Z", "2026-09-14T10:30:00Z")).toBe(150);
    expect(minutesBetween("2026-09-14T10:00:00Z", "2026-09-14T09:00:00Z")).toBe(0);
  });

  it("sorts technicians by nominal utilization and ignores completed work", () => {
    const result = buildCapacity(
      [
        { id: "a", full_name: "Alex", email: null },
        { id: "b", full_name: "Blair", email: null },
      ],
      [
        { id: "v1", job_id: "j", work_order_id: null, job_title: "A", client_name: null, property_address: null, assigned_user_id: "a", technician_name: "Alex", scheduled_start: "2026-09-14T08:00:00Z", scheduled_end: "2026-09-14T16:00:00Z", status: "scheduled" },
        { id: "v2", job_id: "j", work_order_id: null, job_title: "B", client_name: null, property_address: null, assigned_user_id: "b", technician_name: "Blair", scheduled_start: "2026-09-14T08:00:00Z", scheduled_end: "2026-09-14T12:00:00Z", status: "completed" },
      ],
      1,
      new Date("2026-09-14T00:00:00Z"),
      new Date("2026-09-15T00:00:00Z"),
    );
    expect(result[0].userId).toBe("b");
    expect(result[0].utilizationPct).toBe(0);
    expect(result[1].utilizationPct).toBe(100);
  });
});
