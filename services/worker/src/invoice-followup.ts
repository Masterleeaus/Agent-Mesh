import type { DatabaseClient } from "./db-client.js";
import { logger } from "./logger.js";
import { invoiceFollowupEmailHtml } from "@titan-zero/email-templates";
import { appUrl } from "./mailer.js";
import { enqueueNotification } from "./notification/enqueue.js";
import { PRIORITY } from "./notification/priority.js";
import type { AutomationRow, RunResult } from "./automations/types.js";

export function calendarDaysOverdue(dueDate: string | null | undefined, now: Date = new Date(), timeZone = "America/New_York"): number {
  if (!dueDate) return 0;
  const ymd = (input: Date | string): string => {
    if (typeof input === "string") {
      const s = input.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const utcMidnight = s.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.\d+)?(?:Z|[+-]00:00)$/);
      if (utcMidnight) return utcMidnight[1];
    }
    const d = typeof input === "string" ? new Date(input) : input;
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  };
  const dueYmd = ymd(dueDate), nowYmd = ymd(now);
  if (!dueYmd || !nowYmd) return 0;
  const [dy, dm, dd] = dueYmd.split("-").map(Number), [ny, nm, nd] = nowYmd.split("-").map(Number);
  const days = Math.round((Date.UTC(dy, dm - 1, dd) - Date.UTC(ny, nm - 1, nd)) / 86_400_000);
  return days < 0 ? -days : 0;
}

export type { AutomationRow, RunResult };
export interface OverdueInvoice { id:string; account_id:string; client_id:string; invoice_number:string; status:string; total_cents:number; paid_cents:number; due_date:string; client_name:string|null; client_email:string|null; }
const DEFAULT_DAYS_OVERDUE = [7,14,30];

export async function findDueFollowups(client: DatabaseClient): Promise<AutomationRow[]> {
  const { rows } = await client.query<AutomationRow>(`SELECT id, account_id, type, config, enabled, next_run_at FROM automations WHERE type = 'invoice_followup' AND enabled = true AND next_run_at <= $1`, [new Date().toISOString()]);
  return rows;
}

export async function findOverdueInvoices(client: DatabaseClient, automation: AutomationRow): Promise<OverdueInvoice[]> {
  const { rows } = await client.query<OverdueInvoice>(`SELECT i.id, i.account_id, i.client_id, i.invoice_number, i.status, i.total_cents, i.paid_cents, i.due_date, c.name AS client_name, c.email AS client_email FROM invoices i JOIN clients c ON c.id = i.client_id LEFT JOIN jobs j ON j.id = i.job_id WHERE i.account_id = $1 AND i.status IN ('overdue','sent','partial') AND i.due_date IS NOT NULL AND (i.job_id IS NULL OR i.invoice_kind = 'deposit' OR j.status NOT IN ('draft','quoted','scheduled','in_progress')) ORDER BY i.due_date ASC`, [automation.account_id]);
  return rows.filter(i => calendarDaysOverdue(i.due_date) > 0);
}

export function getCadenceSteps(dueDate:string, daysOverdue:number[], now?:Date): number[] { const elapsed=calendarDaysOverdue(dueDate,now??new Date()); return daysOverdue.filter(d=>elapsed>=d).sort((a,b)=>a-b); }

export async function emitInvoiceFollowup(client: DatabaseClient, invoice: OverdueInvoice, automationId:string, cadenceStep:number): Promise<boolean> {
  const existing = await client.query<{new_value:string|Record<string,unknown>|null}>(`SELECT new_value FROM audit_log WHERE entity_type = 'invoice_followup' AND entity_id = $1 AND account_id = $2`, [invoice.id, invoice.account_id]);
  for (const row of existing.rows) {
    let value: Record<string,unknown> = {};
    if (typeof row.new_value === "string") { try { value=JSON.parse(row.new_value) as Record<string,unknown>; } catch { value={}; } }
    else if (row.new_value && typeof row.new_value === "object") value=row.new_value;
    if (Number(value.days_overdue_step) === cadenceStep) return false;
  }
  if (invoice.client_email && invoice.client_name) {
    const balanceCents=invoice.total_cents-invoice.paid_cents;
    const enqueueResult=await enqueueNotification(client,{accountId:invoice.account_id,clientId:invoice.client_id,automationType:"invoice_followup",priority:PRIORITY.HIGH,toAddress:invoice.client_email,subject:`Payment reminder: Invoice ${invoice.invoice_number} is ${cadenceStep} days overdue`,htmlBody:invoiceFollowupEmailHtml({clientName:invoice.client_name,invoiceNumber:invoice.invoice_number,totalCents:invoice.total_cents,balanceCents,daysOverdue:cadenceStep,viewUrl:`${appUrl()}/app/invoices/${invoice.id}`}),idempotencyKey:`invoice_followup:${invoice.id}:${cadenceStep}`,entityType:"invoice",entityId:invoice.id,cancelOnEvents:["invoice.paid","invoice.void"],metadata:{automationId,cadenceStep}});
    if(enqueueResult==="suppressed") return false;
  }
  await client.query(`INSERT INTO audit_log (account_id, entity_type, entity_id, action, actor_id, old_value, new_value) VALUES ($1,'invoice_followup',$2,'insert',$3,NULL,$4)`,[invoice.account_id,invoice.id,automationId,JSON.stringify({automation_id:automationId,days_overdue_step:cadenceStep,invoice_number:invoice.invoice_number,invoice_status:invoice.status,total_cents:invoice.total_cents,paid_cents:invoice.paid_cents,amount_due_cents:invoice.total_cents-invoice.paid_cents,due_date:invoice.due_date,client_id:invoice.client_id,client_name:invoice.client_name,followup_queued_at:new Date().toISOString()})]);
  return true;
}

export async function processInvoiceFollowup(client: DatabaseClient, automation: AutomationRow): Promise<RunResult> {
  const result:RunResult={automationId:automation.id,accountId:automation.account_id,sent:0,skipped:0,errors:0};
  const days=(automation.config.days_overdue as number[]|undefined)??DEFAULT_DAYS_OVERDUE;
  for(const invoice of await findOverdueInvoices(client,automation)) for(const step of getCadenceSteps(invoice.due_date,days)) try { if (await emitInvoiceFollowup(client,invoice,automation.id,step)) result.sent++; else result.skipped++; } catch(error){result.errors++;logger.error("invoice-followup: failed",error,{invoiceId:invoice.id,step});}
  return result;
}
