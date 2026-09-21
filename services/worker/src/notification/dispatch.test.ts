import { beforeEach, describe, expect, it, vi } from "vitest";
import { dispatchNotificationQueue } from "./dispatch.js";
import { sendEmail } from "../mailer.js";
import { checkGovernor, getRules, updateCooldown } from "./governor.js";

vi.mock("../mailer.js", () => ({ sendEmail: vi.fn() }));
vi.mock("./governor.js", () => ({
  getRules: vi.fn(),
  checkGovernor: vi.fn(),
  updateCooldown: vi.fn(),
}));
vi.mock("../logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const queueRow = {
  id: "11111111-1111-1111-1111-111111111111",
  account_id: "22222222-2222-2222-2222-222222222222",
  client_id: "33333333-3333-3333-3333-333333333333",
  automation_type: "visit-reminder",
  priority: 20,
  to_address: "client@example.com",
  subject: "Visit reminder",
  html_body: "<p>Reminder</p>",
  idempotency_key: "visit-reminder:1",
  attempt_count: 1,
  max_attempts: 5,
  entity_type: "visit",
  entity_id: "44444444-4444-4444-4444-444444444444",
  metadata: {},
  lease_id: "55555555-5555-5555-5555-555555555555",
};

function makeClient(row = queueRow) {
  const events: string[] = [];
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    events.push(sql.trim().split(/\s+/).slice(0, 4).join(" "));
    if (sql.includes("WITH candidates AS")) return { rows: [row], rowCount: 1 };
    if (sql.includes("UPDATE notification_queue") && sql.includes("lease_id = $6::uuid")) {
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("attempt_count = GREATEST")) return { rows: [], rowCount: 1 };
    return { rows: [], rowCount: 1, params };
  });
  return { query, events };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRules).mockResolvedValue({} as never);
  vi.mocked(checkGovernor).mockResolvedValue({ ok: true } as never);
  vi.mocked(updateCooldown).mockResolvedValue(undefined as never);
});

describe("notification delivery leasing", () => {
  it("commits the claim before calling the external email provider", async () => {
    const client = makeClient();
    const order: string[] = [];
    client.query.mockImplementation(async (sql: string, params?: unknown[]) => {
      if (sql === "COMMIT") order.push("claim-committed");
      if (sql.includes("WITH candidates AS")) return { rows: [queueRow], rowCount: 1 };
      if (sql.includes("UPDATE notification_queue") && sql.includes("lease_id = $6::uuid")) {
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 1, params };
    });
    vi.mocked(sendEmail).mockImplementation(async () => {
      order.push("provider-called");
      return { ok: true, providerMessageId: "smtp-message-1" };
    });

    const result = await dispatchNotificationQueue(client as never);

    expect(order.indexOf("claim-committed")).toBeLessThan(order.indexOf("provider-called"));
    expect(result.sent).toBe(1);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("notification_delivery_attempts"),
      expect.arrayContaining(["delivered", "smtp-message-1"])
    );
  });

  it("retries a failed provider delivery and preserves attempt history", async () => {
    const client = makeClient();
    vi.mocked(sendEmail).mockResolvedValue({ ok: false, error: "temporary SMTP failure" });

    const result = await dispatchNotificationQueue(client as never);

    expect(result.retried).toBe(1);
    expect(result.failed).toBe(0);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("notification_delivery_attempts"),
      expect.arrayContaining(["failed", "temporary SMTP failure"])
    );
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE notification_queue"),
      expect.arrayContaining(["pending"])
    );
  });

  it("dead-letters a delivery after its configured maximum attempts", async () => {
    const client = makeClient({ ...queueRow, max_attempts: 1 });
    vi.mocked(sendEmail).mockResolvedValue({ ok: false, error: "permanent failure" });

    const result = await dispatchNotificationQueue(client as never);

    expect(result.failed).toBe(1);
    expect(result.retried).toBe(0);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("notification_delivery_attempts"),
      expect.arrayContaining(["dead_letter", "permanent failure"])
    );
  });

  it("releases a governor-delayed row without consuming a provider attempt", async () => {
    const client = makeClient();
    vi.mocked(checkGovernor).mockResolvedValue({
      ok: false,
      delayUntil: new Date("2030-01-01T00:00:00.000Z"),
    } as never);

    const result = await dispatchNotificationQueue(client as never);

    expect(result.delayed).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("attempt_count   = GREATEST(attempt_count - 1, 0)"),
      expect.any(Array)
    );
  });
});
