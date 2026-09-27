import type { CompanyId, WorkId, WorkItem, WorkforceEvent, WorkforceStore } from "./index.js";

/** Test/reference adapter only. Production persistence is supplied by Agent 1. */
export class MemoryWorkforceStore implements WorkforceStore {
  readonly events: WorkforceEvent[] = [];
  private rows = new Map<string, WorkItem>();
  private key(companyId: CompanyId, workId: WorkId) { return `${companyId}\u0000${workId}`; }
  async get(companyId: CompanyId, workId: WorkId) { const row=this.rows.get(this.key(companyId,workId)); return row ? structuredClone(row) : undefined; }
  async put(item: WorkItem) { this.rows.set(this.key(item.company_id,item.work_id), structuredClone(item)); }
  async list(companyId: CompanyId) { return [...this.rows.values()].filter(x=>x.company_id===companyId).map(x=>structuredClone(x)); }
  async appendEvent(event: WorkforceEvent) { this.events.push(structuredClone(event)); }
}
