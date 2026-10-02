import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkerDatabaseClient, type WorkerDatabaseClient } from "../db-runtime.js";
import { emitInvoiceFollowup, type OverdueInvoice } from "../invoice-followup.js";
import { emitVisitReminder, type EligibleVisit } from "../visit-reminder.js";
import { advanceBookingConfirmedNextRun, advanceInvoiceFollowupNextRun } from "./lifecycle.js";
import type { AutomationRow, RunResult } from "./types.js";
let client: WorkerDatabaseClient;
beforeEach(async () => {
  vi.stubEnv("DATABASE_DIALECT", "sqlite"); vi.stubEnv("SQLITE_PATH", ":memory:");
  client = await createWorkerDatabaseClient();
  await client.query(`CREATE TABLE audit_log (account_id TEXT,entity_type TEXT,entity_id TEXT,action TEXT,
    actor_id TEXT,old_value TEXT,new_value TEXT)`);
});
afterEach(async () => { await client.close(); vi.unstubAllEnvs(); });
const invoice: OverdueInvoice = { id:"invoice-1",account_id:"company-a",client_id:"client-a",invoice_number:"INV-1",
  status:"overdue",total_cents:100,paid_cents:0,due_date:"2026-01-01",client_name:"Example",client_email:null };
describe("portable automation database contracts", () => {
  it("matches exact cadence evidence across JSON whitespace and does not confuse 7 with 70", async () => {
    await client.query(`INSERT INTO audit_log(account_id,entity_type,entity_id,new_value)
      VALUES($1,'invoice_followup',$2,$3)`, [invoice.account_id,invoice.id,JSON.stringify({ days_overdue_step:70 },null,2)]);
    expect(await emitInvoiceFollowup(client,invoice,"automation",7)).toBe(true);
    expect(await emitInvoiceFollowup(client,invoice,"automation",7)).toBe(false);
    expect(await emitInvoiceFollowup(client,invoice,"automation",70)).toBe(false);
    expect((await client.query("SELECT * FROM audit_log")).rows).toHaveLength(2);
  });
  it("same invoice/cadence identity in company A cannot suppress company B", async () => {
    expect(await emitInvoiceFollowup(client,invoice,"automation",7)).toBe(true);
    expect(await emitInvoiceFollowup(client,{...invoice,account_id:"company-b"},"automation",7)).toBe(true);
    const records = await client.query<{account_id:string}>("SELECT account_id FROM audit_log ORDER BY account_id");
    expect(records.rows).toEqual([{account_id:"company-a"},{account_id:"company-b"}]);
  });
  it("real SELECT rows suppress an existing company-bound visit reminder", async () => {
    const visit: EligibleVisit = {id:"visit",account_id:"company-a",job_id:"job",client_id:"client",assigned_user_id:null,
      scheduled_start:"2026-10-02T12:00:00Z",job_title:"Service",client_name:"Example",client_email:"test@example.invalid",property_address:null,tech_name:null};
    await client.query("INSERT INTO audit_log(account_id,entity_type,entity_id) VALUES($1,'visit_reminder',$2)",[visit.account_id,visit.id]);
    expect(await emitVisitReminder(client,visit,"automation")).toBe(false);
    expect((await client.query("SELECT * FROM audit_log")).rows).toHaveLength(1);
  });
  it.each([[advanceBookingConfirmedNextRun,1800],[advanceInvoiceFollowupNextRun,3600]] as const)("executes SQLite lifecycle interval %s / %s seconds", async (advance,seconds) => {
    await client.query("CREATE TABLE automations(id TEXT PRIMARY KEY,last_run_at TEXT,next_run_at TEXT,updated_at TEXT)");
    await client.query("INSERT INTO automations(id,next_run_at) VALUES('a','2000-01-01'),('b','2000-01-01')");
    const automation: AutomationRow = {id:"a",account_id:"company-a",type:"test",config:{},enabled:true,next_run_at:"2000-01-01"};
    const result: RunResult = {automationId:"a",accountId:"company-a",sent:0,skipped:0,errors:0};
    await advance(client,automation,result);
    const rows=await client.query<{id:string;last_run_at:string;next_run_at:string}>("SELECT * FROM automations ORDER BY id");
    expect(Date.parse(`${rows.rows[0].next_run_at}Z`)-Date.parse(`${rows.rows[0].last_run_at}Z`)).toBe(seconds*1000);
    expect(rows.rows[1].next_run_at).toBe("2000-01-01");
  });
});
