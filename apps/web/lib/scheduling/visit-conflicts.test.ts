import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "@/lib/db-contract";
import { getVisitScheduleConflicts } from "./visit-conflicts";

function clientWithCounts(...counts: Array<string | number>): DbClient {
  const query = vi.fn();
  for (const count of counts) query.mockResolvedValueOnce({ rows: [{ count }], rowCount: 1 });
  return { query } as unknown as DbClient;
}

describe("getVisitScheduleConflicts", () => {
  it("reports a same-job overlap", async () => {
    const client = clientWithCounts(1);
    const result = await getVisitScheduleConflicts(client, {
      accountId: "acct",
      jobId: "job",
      scheduledStart: "2026-09-14T09:00:00.000Z",
      scheduledEnd: "2026-09-14T10:00:00.000Z",
    });
    expect(result).toEqual({ jobOverlapCount: 1, technicianOverlapCount: 0, hasConflict: true });
  });

  it("reports technician overlap across jobs", async () => {
    const client = clientWithCounts(0, 2);
    const result = await getVisitScheduleConflicts(client, {
      accountId: "acct",
      jobId: "job",
      assignedUserId: "tech",
      scheduledStart: "2026-09-14T09:00:00.000Z",
      scheduledEnd: "2026-09-14T10:00:00.000Z",
    });
    expect(result).toEqual({ jobOverlapCount: 0, technicianOverlapCount: 2, hasConflict: true });
  });

  it("excludes the current visit during a reschedule", async () => {
    const client = clientWithCounts(0, 0);
    await getVisitScheduleConflicts(client, {
      accountId: "acct",
      jobId: "job",
      assignedUserId: "tech",
      excludeVisitId: "visit",
      scheduledStart: "2026-09-14T09:00:00.000Z",
      scheduledEnd: "2026-09-14T10:00:00.000Z",
    });
    const calls = (client.query as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toMatch(/id <> \$5/);
    expect(calls[1][0]).toMatch(/id <> \$5/);
  });
});
