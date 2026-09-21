import { describe, expect, it, vi } from "vitest";
import { processWorkflowEvents, workflowEventOutboxInternals } from "./workflow-events.js";

vi.mock("./notification/enqueue.js", () => ({
  cancelNotificationsForEntity: vi.fn(async () => 0),
}));

function clientWithRows(rows: Record<string, unknown>[]) {
  const query = vi.fn()
    .mockResolvedValueOnce({ rows })
    .mockResolvedValue({ rows: [] });
  return { query };
}

describe("workflow event reliable outbox", () => {
  it("uses bounded exponential retry delays", () => {
    expect(workflowEventOutboxInternals.retryDelaySeconds(1)).toBe(5);
    expect(workflowEventOutboxInternals.retryDelaySeconds(2)).toBe(10);
    expect(workflowEventOutboxInternals.retryDelaySeconds(20)).toBe(3600);
  });

  it("claims and completes an event without changing producer contracts", async () => {
    const client = clientWithRows([
      {
        id: "11111111-1111-1111-1111-111111111111",
        account_id: "22222222-2222-2222-2222-222222222222",
        event_type: "job.updated",
        entity_type: "job",
        entity_id: "33333333-3333-3333-3333-333333333333",
        payload: {},
        attempts: 0,
      },
    ]);

    await expect(processWorkflowEvents(client as never, { batchSize: 10 })).resolves.toBe(1);
    expect(client.query).toHaveBeenCalledTimes(2);
    expect((client.query as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain("FOR UPDATE SKIP LOCKED");
    expect((client.query as ReturnType<typeof vi.fn>).mock.calls[1][0]).toContain("status = 'completed'");
  });
});
