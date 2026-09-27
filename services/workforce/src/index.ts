export type CompanyId = string;
export type WorkId = string;
export type WorkerId = string;

export type WorkerKind = "digital" | "human";
export type WorkState =
  | "CREATED" | "READY" | "CLAIMED" | "IN_PROGRESS" | "BLOCKED"
  | "WAITING" | "WAITING_APPROVAL" | "WAITING_EXTERNAL"
  | "COMPLETED" | "FAILED" | "CANCELLED";

export interface WorkforceWorker {
  company_id: CompanyId;
  worker_id: WorkerId;
  kind: WorkerKind;
  team_id?: string;
  manager_id?: WorkerId;
  capabilities: string[];
  active: boolean;
}

export interface WorkItem {
  company_id: CompanyId;
  work_id: WorkId;
  parent_work_id?: WorkId;
  objective: string;
  description?: string;
  creator: string;
  assignee?: WorkerId;
  team_id?: string;
  priority: number;
  state: WorkState;
  dependencies: WorkId[];
  required_capabilities: string[];
  authority_requirement?: string;
  context_refs: string[];
  evidence_refs: string[];
  result?: unknown;
  escalation?: { reason: string; target?: WorkerId; at: string };
  recurrence?: { rule: string; next_at?: string };
  lease?: { worker_id: WorkerId; expires_at: string };
  created_at: string;
  updated_at: string;
}

export interface WorkforceEvent {
  company_id: CompanyId;
  type: `work.${"created"|"ready"|"claimed"|"started"|"delegated"|"blocked"|"waiting"|"escalated"|"approval_required"|"resumed"|"completed"|"failed"|"cancelled"}` | `worker.${"woken"|"started"|"waiting"|"completed"}`;
  work_id: WorkId;
  at: string;
  actor?: string;
  data?: Record<string, unknown>;
}

export interface WorkforceStore {
  get(companyId: CompanyId, workId: WorkId): Promise<WorkItem | undefined>;
  put(item: WorkItem): Promise<void>;
  list(companyId: CompanyId): Promise<WorkItem[]>;
  appendEvent(event: WorkforceEvent): Promise<void>;
}

export interface AgentRuntimeAdapter {
  wake(input: { company_id: CompanyId; worker_id: WorkerId; work_id: WorkId }): Promise<void>;
}

export interface AuthorityAdapter {
  // Checks existing authority only. Assignment/delegation never modifies authority.
  isSatisfied(input: { company_id: CompanyId; worker_id: WorkerId; requirement: string }): Promise<boolean>;
}

const terminal = new Set<WorkState>(["COMPLETED", "FAILED", "CANCELLED"]);
const transitions: Record<WorkState, ReadonlySet<WorkState>> = {
  CREATED: new Set(["READY", "BLOCKED", "CANCELLED"]),
  READY: new Set(["CLAIMED", "CANCELLED"]),
  CLAIMED: new Set(["IN_PROGRESS", "READY", "CANCELLED"]),
  IN_PROGRESS: new Set(["BLOCKED", "WAITING", "WAITING_APPROVAL", "WAITING_EXTERNAL", "COMPLETED", "FAILED", "CANCELLED"]),
  BLOCKED: new Set(["READY", "FAILED", "CANCELLED"]),
  WAITING: new Set(["READY", "FAILED", "CANCELLED"]),
  WAITING_APPROVAL: new Set(["READY", "FAILED", "CANCELLED"]),
  WAITING_EXTERNAL: new Set(["READY", "FAILED", "CANCELLED"]),
  COMPLETED: new Set(), FAILED: new Set(), CANCELLED: new Set(),
};

export class WorkforceService {
  constructor(private store: WorkforceStore, private runtime?: AgentRuntimeAdapter, private authority?: AuthorityAdapter) {}

  async create(input: Omit<WorkItem, "state"|"created_at"|"updated_at"|"evidence_refs"|"context_refs"> & Partial<Pick<WorkItem,"context_refs"|"evidence_refs">>): Promise<WorkItem> {
    const now = new Date().toISOString();
    const item: WorkItem = { ...input, state: "CREATED", context_refs: input.context_refs ?? [], evidence_refs: input.evidence_refs ?? [], created_at: now, updated_at: now };
    for (const dep of item.dependencies) await this.assertNoCycle(item.company_id, item.work_id, dep);
    await this.store.put(item); await this.event(item, "work.created");
    return this.refreshReadiness(item.company_id, item.work_id);
  }

  async delegate(companyId: CompanyId, workId: WorkId, assignee: WorkerId, actor: string): Promise<WorkItem> {
    const item = await this.require(companyId, workId);
    if (terminal.has(item.state)) throw new Error("terminal work cannot be delegated");
    item.assignee = assignee; item.updated_at = new Date().toISOString();
    await this.store.put(item); await this.event(item, "work.delegated", actor, { assignee });
    return item;
  }

  async claim(companyId: CompanyId, workId: WorkId, workerId: WorkerId, leaseMs = 60_000): Promise<WorkItem> {
    const item = await this.require(companyId, workId);
    if (item.state !== "READY") throw new Error(`work is ${item.state}, not READY`);
    if (item.assignee && item.assignee !== workerId) throw new Error("work assigned to another worker");
    if (item.authority_requirement && this.authority && !(await this.authority.isSatisfied({company_id: companyId, worker_id: workerId, requirement: item.authority_requirement}))) {
      return this.transition(companyId, workId, "WAITING_APPROVAL", workerId);
    }
    item.assignee = workerId; item.lease = { worker_id: workerId, expires_at: new Date(Date.now()+leaseMs).toISOString() };
    await this.store.put(item);
    return this.transition(companyId, workId, "CLAIMED", workerId);
  }

  async start(companyId: CompanyId, workId: WorkId, actor: string) { return this.transition(companyId, workId, "IN_PROGRESS", actor); }
  async complete(companyId: CompanyId, workId: WorkId, actor: string, result?: unknown, evidence: string[] = []) {
    const item = await this.require(companyId, workId); item.result = result; item.evidence_refs.push(...evidence); await this.store.put(item);
    const done = await this.transition(companyId, workId, "COMPLETED", actor);
    for (const candidate of await this.store.list(companyId)) if (candidate.dependencies.includes(workId)) await this.refreshReadiness(companyId, candidate.work_id);
    return done;
  }
  async fail(companyId: CompanyId, workId: WorkId, actor: string, result?: unknown) { const i=await this.require(companyId,workId); i.result=result; await this.store.put(i); return this.transition(companyId,workId,"FAILED",actor); }
  async cancel(companyId: CompanyId, workId: WorkId, actor: string) { return this.transition(companyId,workId,"CANCELLED",actor); }
  async wait(companyId: CompanyId, workId: WorkId, actor: string, kind: "WAITING"|"WAITING_APPROVAL"|"WAITING_EXTERNAL" = "WAITING") { return this.transition(companyId,workId,kind,actor); }
  async resume(companyId: CompanyId, workId: WorkId, actor: string) { const i=await this.transition(companyId,workId,"READY",actor); await this.event(i,"work.resumed",actor); await this.wakeIfDigital(i); return i; }
  async escalate(companyId: CompanyId, workId: WorkId, actor: string, reason: string, target?: WorkerId) { const i=await this.require(companyId,workId); i.escalation={reason,target,at:new Date().toISOString()}; if(target)i.assignee=target; await this.store.put(i); await this.event(i,"work.escalated",actor,{reason,target}); return i; }

  async refreshReadiness(companyId: CompanyId, workId: WorkId): Promise<WorkItem> {
    const item = await this.require(companyId, workId); if (terminal.has(item.state) || !["CREATED","BLOCKED"].includes(item.state)) return item;
    const deps = await Promise.all(item.dependencies.map(id => this.require(companyId,id)));
    const ready = deps.every(d => d.state === "COMPLETED");
    if (ready) { const next=await this.transition(companyId,workId,"READY","system"); await this.wakeIfDigital(next); return next; }
    if (item.state === "CREATED") return this.transition(companyId,workId,"BLOCKED","system");
    return item;
  }

  private async wakeIfDigital(item: WorkItem) { if (item.assignee && this.runtime) { await this.runtime.wake({company_id:item.company_id,worker_id:item.assignee,work_id:item.work_id}); await this.event(item,"worker.woken","dispatcher"); } }
  private async transition(companyId: CompanyId, workId: WorkId, next: WorkState, actor: string): Promise<WorkItem> { const i=await this.require(companyId,workId); if(!transitions[i.state].has(next)) throw new Error(`invalid transition ${i.state} -> ${next}`); i.state=next; i.updated_at=new Date().toISOString(); if(next!=="CLAIMED") i.lease=undefined; await this.store.put(i); const suffix: Record<string,string>={READY:"ready",CLAIMED:"claimed",IN_PROGRESS:"started",BLOCKED:"blocked",WAITING:"waiting",WAITING_APPROVAL:"approval_required",WAITING_EXTERNAL:"waiting",COMPLETED:"completed",FAILED:"failed",CANCELLED:"cancelled"}; await this.event(i,`work.${suffix[next]}` as WorkforceEvent["type"],actor); return i; }
  private async require(companyId: CompanyId, workId: WorkId) { const i=await this.store.get(companyId,workId); if(!i) throw new Error("work not found in company"); return i; }
  private async assertNoCycle(companyId: CompanyId, workId: WorkId, depId: WorkId, seen=new Set<string>()): Promise<void> { if(depId===workId) throw new Error("circular dependency"); if(seen.has(depId)) return; seen.add(depId); const dep=await this.store.get(companyId,depId); if(!dep) throw new Error("dependency not found in company"); for(const parent of dep.dependencies) await this.assertNoCycle(companyId,workId,parent,seen); }
  private event(i:WorkItem,type:WorkforceEvent["type"],actor?:string,data?:Record<string,unknown>){return this.store.appendEvent({company_id:i.company_id,type,work_id:i.work_id,at:new Date().toISOString(),actor,data});}
}
