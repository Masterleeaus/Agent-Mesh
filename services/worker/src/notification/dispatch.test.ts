import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkerDatabaseClient, type WorkerDatabaseClient } from "../db-runtime.js";
import { dispatchNotificationQueue } from "./dispatch.js";
import { enqueueNotification } from "./enqueue.js";
import { sendEmail } from "../mailer.js";
import * as governor from "./governor.js";
import { logger } from "../logger.js";

vi.mock("../mailer.js", () => ({ sendEmail: vi.fn() }));
vi.mock("../logger.js", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const NOW = new Date("2026-10-02T12:00:00.000Z");
const directories: string[] = [];
const clients: WorkerDatabaseClient[] = [];
let transactionOpen = false;
let path = "";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("DATABASE_DIALECT", "sqlite");
  vi.stubEnv("SQLITE_PATH", "");
  transactionOpen = false;
  vi.mocked(sendEmail).mockResolvedValue({ ok: true, providerMessageId: "smtp-ack-1" });
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  for (const client of clients.splice(0)) await client.close();
  for (const dir of directories.splice(0)) await rm(dir, { recursive: true, force: true });
});

async function connect(filename: string): Promise<WorkerDatabaseClient> {
  vi.stubEnv("SQLITE_PATH", filename);
  const raw = await createWorkerDatabaseClient();
  clients.push(raw);
  return {
    dialect: raw.dialect,
    close: () => raw.close(),
    async query<T>(sql: string, params: unknown[] = []) {
      // Exercise the real adapter and reject missing positional bindings, which
      // the former SQL-substring mocks silently accepted.
      for (const match of sql.matchAll(/\$(\d+)/g)) expect(Number(match[1])).toBeLessThanOrEqual(params.length);
      const result = await raw.query<T>(sql, params);
      if (/^BEGIN/.test(sql)) transactionOpen = true;
      if (sql === "COMMIT" || sql === "ROLLBACK") transactionOpen = false;
      return result;
    },
  };
}
async function fixture(): Promise<WorkerDatabaseClient> {
  const dir = await mkdtemp(join(tmpdir(), "titan-notifications-")); directories.push(dir);
  path = join(dir, "worker.sqlite");
  const c = await connect(path);
  await c.query(`CREATE TABLE notification_queue (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL, client_id TEXT, automation_type TEXT NOT NULL,
    priority INTEGER NOT NULL, to_address TEXT NOT NULL, subject TEXT NOT NULL, html_body TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE, attempt_count INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 3,
    entity_type TEXT, entity_id TEXT, cancel_on_events TEXT NOT NULL DEFAULT '[]', metadata TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'pending',
    next_attempt_at TEXT NOT NULL, lease_id TEXT, locked_at TEXT, locked_until TEXT, sent_at TEXT, failed_at TEXT,
    failure_reason TEXT, provider_message_id TEXT)`);
  await c.query(`CREATE TABLE notification_delivery_attempts (
    id TEXT PRIMARY KEY NOT NULL, notification_id TEXT NOT NULL, account_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL, status TEXT NOT NULL, provider TEXT NOT NULL,
    provider_message_id TEXT, error TEXT, started_at TEXT NOT NULL, finished_at TEXT NOT NULL,
    UNIQUE(notification_id, attempt_number))`);
  await c.query(`CREATE TABLE automation_settings (account_id TEXT PRIMARY KEY, cooldown_hours INTEGER,
    max_per_day INTEGER, working_hours_start INTEGER, working_hours_end INTEGER, working_hours_tz TEXT)`);
  await c.query(`CREATE TABLE notification_cooldowns (account_id TEXT, client_id TEXT, last_sent_at TEXT, PRIMARY KEY(account_id,client_id))`);
  await c.query(`CREATE TABLE communications_log (id TEXT PRIMARY KEY NOT NULL, account_id TEXT NOT NULL,
    client_id TEXT, channel TEXT, direction TEXT, outcome TEXT, body_preview TEXT, external_id TEXT)`);
  return c;
}
async function seed(c: WorkerDatabaseClient, id = "n1", account = "company-a") {
  await c.query(`INSERT INTO notification_queue
    (id,account_id,client_id,automation_type,priority,to_address,subject,html_body,idempotency_key,next_attempt_at)
    VALUES($1,$2,$3,'visit_reminder',10,'test@example.invalid','Test','<p>Test</p>',$4,$5)`,
    [id, account, `client-${account}`, `key-${id}`, new Date(NOW.getTime() - 1000).toISOString()]);
}
async function row(c: WorkerDatabaseClient, id = "n1") { return (await c.query<Record<string, unknown>>("SELECT * FROM notification_queue WHERE id=$1", [id])).rows[0]; }

describe("notification delivery with disposable SQLite", () => {
  it("commits the lease before provider I/O and atomically records the acknowledgement", async () => {
    const c = await fixture(); await seed(c);
    vi.mocked(sendEmail).mockImplementation(async () => {
      expect(transactionOpen).toBe(false);
      expect(await row(c)).toMatchObject({ status: "processing", attempt_count: 1, failure_reason: "delivery-outcome-unknown" });
      return { ok: true, providerMessageId: "smtp-ack-1" };
    });
    const result = await dispatchNotificationQueue(c);
    expect(vi.mocked(logger.error).mock.calls).toEqual([]);
    expect(result).toMatchObject({ sent: 1, failed: 0 });
    expect(await row(c)).toMatchObject({ status: "sent", attempt_count: 1, lease_id: null, provider_message_id: "smtp-ack-1" });
    expect((await c.query("SELECT account_id,status,provider_message_id FROM notification_delivery_attempts")).rows)
      .toEqual([{ account_id: "company-a", status: "delivered", provider_message_id: "smtp-ack-1" }]);
    expect((await c.query("SELECT account_id,external_id FROM communications_log")).rows)
      .toEqual([{ account_id: "company-a", external_id: "smtp-ack-1" }]);
  });
  it("retries explicitly not-sent failures once due and preserves numbered attempt history", async () => {
    const c = await fixture(); await seed(c);
    vi.mocked(sendEmail).mockResolvedValueOnce({ ok: false, error: "SMTP rejected", deliveryOutcome: "not-sent" });
    expect(await dispatchNotificationQueue(c)).toMatchObject({ retried: 1, failed: 0 });
    expect(await row(c)).toMatchObject({ status: "pending", attempt_count: 1, lease_id: null });
    expect(await dispatchNotificationQueue(c)).toMatchObject({ sent: 0 });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date(NOW.getTime() + 6 * 60_000));
    expect(await dispatchNotificationQueue(c)).toMatchObject({ sent: 1 });
    expect((await c.query("SELECT attempt_number,status FROM notification_delivery_attempts ORDER BY attempt_number")).rows)
      .toEqual([{ attempt_number: 1, status: "failed" }, { attempt_number: 2, status: "delivered" }]);
  });
  it("dead-letters a known rejection at the maximum and never exceeds the attempt ceiling", async () => {
    const c = await fixture(); await seed(c); await c.query("UPDATE notification_queue SET max_attempts=1");
    vi.mocked(sendEmail).mockResolvedValue({ ok: false, error: "rejected", deliveryOutcome: "not-sent" });
    expect(await dispatchNotificationQueue(c)).toMatchObject({ failed: 1 });
    expect(await row(c)).toMatchObject({ status: "dead_letter", attempt_count: 1 });
    vi.setSystemTime(new Date(NOW.getTime() + 60 * 60_000)); await dispatchNotificationQueue(c);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
  it("governor delay preserves the previous attempt count and releases the claim", async () => {
    const c = await fixture(); await seed(c); await c.query("UPDATE notification_queue SET attempt_count=1");
    vi.spyOn(governor, "checkGovernor").mockResolvedValue({ ok: false, delayUntil: new Date(NOW.getTime() + 3600_000) });
    expect(await dispatchNotificationQueue(c)).toMatchObject({ delayed: 1, failed: 0 });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(await row(c)).toMatchObject({ status: "pending", attempt_count: 1, lease_id: null, next_attempt_at: "2026-10-02T13:00:00.000Z" });
    expect((await c.query("SELECT * FROM notification_delivery_attempts")).rows).toEqual([]);
  });
  it("recovers only expired pre-provider claims and does not refund an attempt", async () => {
    const c = await fixture(); await seed(c);
    await c.query("UPDATE notification_queue SET status='processing',lease_id='old',locked_until=$1,failure_reason='delivery-claimed',attempt_count=1", [NOW.toISOString()]);
    expect(await dispatchNotificationQueue(c)).toMatchObject({ sent: 1 });
    expect(await row(c)).toMatchObject({ status: "sent", attempt_count: 2 });
  });
  it.each(["delivery-outcome-unknown", null])("quarantines expired ambiguous or legacy processing leases (%s)", async (reason) => {
    const c = await fixture(); await seed(c);
    await c.query("UPDATE notification_queue SET status='processing',lease_id='old',locked_until=$1,failure_reason=$2,attempt_count=1", [NOW.toISOString(), reason]);
    await dispatchNotificationQueue(c);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(await row(c)).toMatchObject({ status: "dead_letter", failure_reason: "delivery-outcome-unknown", attempt_count: 1, lease_id: null });
  });
  it("two database connections cannot send the same active lease", async () => {
    const c = await fixture(); await seed(c); const second = await connect(path);
    let release!: () => void; let entered!: () => void;
    const inProvider = new Promise<void>(resolve => { entered = resolve; });
    const waiting = new Promise<void>(resolve => { release = resolve; });
    vi.mocked(sendEmail).mockImplementation(async () => { entered(); await waiting; return { ok: true, providerMessageId: "smtp-ack-1" }; });
    const first = dispatchNotificationQueue(c); await inProvider;
    expect(await dispatchNotificationQueue(second)).toMatchObject({ sent: 0 });
    release(); expect(await first).toMatchObject({ sent: 1 }); expect(sendEmail).toHaveBeenCalledTimes(1);
  });
  it("rejects an expired claim before provider I/O", async () => {
    const c = await fixture(); await seed(c);
    vi.spyOn(governor, "checkGovernor").mockImplementation(async () => { vi.setSystemTime(new Date(NOW.getTime() + 6 * 60_000)); return { ok: true }; });
    await dispatchNotificationQueue(c); expect(sendEmail).not.toHaveBeenCalled();
    expect((await row(c)).attempt_count).toBe(0);
  });
  it("a provider acknowledgement followed by DB failure is never replayed after restart", async () => {
    const c = await fixture(); await seed(c);
    const broken: WorkerDatabaseClient = { ...c, query: async (sql, params) => {
      if (sql.includes("INSERT INTO notification_delivery_attempts")) throw new Error("storage interrupted");
      return c.query(sql, params);
    } };
    expect(await dispatchNotificationQueue(broken)).toMatchObject({ failed: 1, sent: 0 });
    expect(await row(c)).toMatchObject({ status: "processing", failure_reason: "delivery-outcome-unknown" });
    vi.setSystemTime(new Date(NOW.getTime() + 6 * 60_000));
    const restarted = await connect(path); await dispatchNotificationQueue(restarted);
    expect(sendEmail).toHaveBeenCalledTimes(1); expect((await row(c)).status).toBe("dead_letter");
  });
  it("an uncertain transport error is quarantined, not blindly retried", async () => {
    const c = await fixture(); await seed(c);
    vi.mocked(sendEmail).mockResolvedValue({ ok: false, error: "connection closed after DATA", deliveryOutcome: "unknown" });
    expect(await dispatchNotificationQueue(c)).toMatchObject({ failed: 1, retried: 0 });
    expect(await row(c)).toMatchObject({ status: "dead_letter", failure_reason: "delivery-outcome-unknown" });
  });
  it("stale lease ownership cannot finalize or write another company's outcome", async () => {
    const c = await fixture(); await seed(c);
    vi.mocked(sendEmail).mockImplementation(async () => {
      await c.query("UPDATE notification_queue SET account_id='company-b',lease_id='replacement' WHERE id='n1'");
      return { ok: true, providerMessageId: "smtp-ack-1" };
    });
    expect(await dispatchNotificationQueue(c)).toMatchObject({ sent: 0, failed: 1 });
    expect(await row(c)).toMatchObject({ account_id: "company-b", lease_id: "replacement", status: "processing" });
    expect((await c.query("SELECT * FROM notification_delivery_attempts")).rows).toEqual([]);
  });
  it("processes separate companies without mixing their receipts or cooldowns", async () => {
    const c = await fixture(); await seed(c); await seed(c, "n2", "company-b");
    expect(await dispatchNotificationQueue(c)).toMatchObject({ sent: 2 });
    expect((await c.query("SELECT notification_id,account_id FROM notification_delivery_attempts ORDER BY notification_id")).rows)
      .toEqual([{ notification_id: "n1", account_id: "company-a" }, { notification_id: "n2", account_id: "company-b" }]);
    expect((await c.query("SELECT account_id FROM notification_cooldowns ORDER BY account_id")).rows)
      .toEqual([{ account_id: "company-a" }, { account_id: "company-b" }]);
  });
  it("does not send cancelled, future, or max-attempt work", async () => {
    const c = await fixture(); await seed(c, "cancelled"); await seed(c, "future"); await seed(c, "exhausted");
    await c.query("UPDATE notification_queue SET status='cancelled' WHERE id='cancelled'");
    await c.query("UPDATE notification_queue SET next_attempt_at=$1 WHERE id='future'", ["2026-10-02 13:00:00"]);
    await c.query("UPDATE notification_queue SET attempt_count=max_attempts WHERE id='exhausted'");
    await dispatchNotificationQueue(c); expect(sendEmail).not.toHaveBeenCalled();
  });
  it("a stale enqueue read cannot resurrect a concurrently quarantined notification", async () => {
    const c = await fixture(); let interleaved = false;
    const racing: WorkerDatabaseClient = { ...c, query: async (sql, params) => {
      if (!interleaved && sql.includes("FROM notification_queue WHERE idempotency_key")) {
        interleaved = true;
        await seed(c);
        await c.query("UPDATE notification_queue SET status='dead_letter',attempt_count=1,failure_reason='delivery-outcome-unknown'");
        return { rows: [], rowCount: 0 };
      }
      return c.query(sql,params);
    } };
    const result = await enqueueNotification(racing,{ accountId:"company-a",clientId:null,automationType:"visit_reminder",
      priority:10,toAddress:"test@example.invalid",subject:"Test",htmlBody:"Test",idempotencyKey:"key-n1" });
    expect(result).toBe("duplicate");
    expect(await row(c)).toMatchObject({status:"dead_letter",attempt_count:1,failure_reason:"delivery-outcome-unknown"});
    await dispatchNotificationQueue(c); expect(sendEmail).not.toHaveBeenCalled();
  });
  it("an enqueue cannot take over a different company's idempotency key", async () => {
    const c=await fixture(); await seed(c);
    await c.query("UPDATE notification_queue SET status='failed',attempt_count=1");
    await expect(enqueueNotification(c,{ accountId:"company-b",clientId:null,automationType:"visit_reminder",
      priority:10,toAddress:"test@example.invalid",subject:"Test",htmlBody:"Test",idempotencyKey:"key-n1" }))
      .rejects.toThrow("notification-idempotency-company-mismatch");
    expect(await row(c)).toMatchObject({account_id:"company-a",status:"failed",attempt_count:1});
  });
  it("safe failed requeue retains attempt history and cannot refill an exhausted budget", async () => {
    const c=await fixture(); await seed(c);
    const opts={ accountId:"company-a",clientId:null,automationType:"visit_reminder",priority:10,
      toAddress:"test@example.invalid",subject:"Test",htmlBody:"Test",idempotencyKey:"key-n1" };
    await c.query("UPDATE notification_queue SET status='failed',attempt_count=1,failure_reason='SMTP rejected'");
    expect(await enqueueNotification(c,opts)).toBe("enqueued");
    expect(await row(c)).toMatchObject({status:"pending",attempt_count:1});
    await c.query("UPDATE notification_queue SET status='failed',attempt_count=max_attempts");
    expect(await enqueueNotification(c,opts)).toBe("duplicate");
    expect(await row(c)).toMatchObject({status:"failed",attempt_count:3});
  });
  it("unknown-delivery evidence cannot be reopened even if a legacy row is marked failed", async () => {
    const c=await fixture(); await seed(c);
    await c.query("UPDATE notification_queue SET status='failed',attempt_count=1,failure_reason='delivery-outcome-unknown'");
    expect(await enqueueNotification(c,{ accountId:"company-a",clientId:null,automationType:"visit_reminder",priority:10,
      toAddress:"test@example.invalid",subject:"Test",htmlBody:"Test",idempotencyKey:"key-n1" })).toBe("duplicate");
    expect(await row(c)).toMatchObject({status:"failed",attempt_count:1,failure_reason:"delivery-outcome-unknown"});
  });
  it("overlapping dispatch calls on one client share one committed poll", async () => {
    const c=await fixture(); await seed(c); let entered!:()=>void; let release!:()=>void;
    const waiting=new Promise<void>(resolve=>{release=resolve;});
    const governorEntered=new Promise<void>(resolve=>{entered=resolve;});
    let held=false; let begins=0;
    const shared: WorkerDatabaseClient = {...c,query:async<T>(sql:string,params?:unknown[])=>{
      if(sql.startsWith("BEGIN")) begins++;
      const result=await c.query<T>(sql,params);
      if(!held && sql.includes("FROM automation_settings")){held=true;entered();await waiting;}
      return result;
    }};
    const first=dispatchNotificationQueue(shared); await governorEntered;
    const second=dispatchNotificationQueue(shared);
    for(let i=0;i<8;i++) await Promise.resolve();
    const claimsBeforeRelease=begins; release();
    await Promise.allSettled([first,second]);
    expect(claimsBeforeRelease).toBe(1);
    expect(await row(c)).toMatchObject({status:"sent",attempt_count:1});
    vi.setSystemTime(new Date(NOW.getTime()+6*60_000)); await dispatchNotificationQueue(shared);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
  it("bounds a claim batch to twenty rows", async () => {
    const c = await fixture(); for (let i = 0; i < 21; i++) await seed(c, `n${i}`);
    expect(await dispatchNotificationQueue(c)).toMatchObject({ sent: 20 }); expect(sendEmail).toHaveBeenCalledTimes(20);
  });
});
