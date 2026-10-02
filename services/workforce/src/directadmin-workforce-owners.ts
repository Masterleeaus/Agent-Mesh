import type { WorkItem, WorkforceStore, WorkforceWorker, WorkforceWorkerStore } from "./index.js";

/** Structural boundary shared with #1049's canonical DirectAdmin gateway SDK.
 * The host receives the Fetch handler from the commissioned operator module; it
 * does not implement cookie, CSRF, session, company-switch or logout transport. */
export type DirectAdminBridgeContext = Readonly<{
  actor_id: string;
  company_id: string;
  context_revision: string;
  authority: "not-carried";
}>;

export type DirectAdminProjection = Readonly<{
  company_id: string;
  source: string;
  freshness: string | null;
  evidence_refs: readonly string[];
  data: Readonly<Record<string, unknown>>;
}>;

export type DirectAdminWorkforceIntent = Readonly<{
  company_id: string;
  actor_id: string;
  capability_id: string;
  operation_id: string;
  correlation_id: string;
  input: Readonly<Record<string, unknown>>;
}>;

export type DirectAdminGatewayOwners = Readonly<{
  projection(plugin: "titan_workforce" | string, context: DirectAdminBridgeContext): Promise<DirectAdminProjection>;
  requestIntent(
    plugin: "titan_workforce" | string,
    intent: DirectAdminWorkforceIntent,
    context: DirectAdminBridgeContext,
    revalidate: () => Promise<DirectAdminBridgeContext>,
  ): Promise<{ receipt_id: string }>;
}>;

export type DirectAdminFetchHandler = (request: Request) => Promise<Response>;
export type DirectAdminGatewayFactory = (owners: DirectAdminGatewayOwners) => DirectAdminFetchHandler;

export type DirectAdminWorkforceRuntime = Readonly<{
  workforceStore: WorkforceStore & WorkforceWorkerStore;
  runStore: { findByWork(company_id: string, work_id: string): Promise<unknown> };
}>;

export class DirectAdminWorkforceActionDenied extends Error {
  readonly code = "directadmin-workforce-action-unsupported";
  readonly status = 403;

  constructor(action: string) {
    super(`DirectAdmin Workforce action is not supported: ${action}`);
    this.name = "DirectAdminWorkforceActionDenied";
  }
}

const PROPOSED_ACTIONS = new Set(["pause", "resume", "cancel", "reassign", "escalate", "revoke"]);
const id = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 1024 && !/[\u0000-\u001f\u007f]/u.test(value);
const stringRefs = (value: unknown): value is string[] => Array.isArray(value) && value.every(ref => id(ref));

function requireContext(context: DirectAdminBridgeContext): void {
  if (!id(context?.company_id) || !id(context?.actor_id) || !id(context?.context_revision) || context.authority !== "not-carried") {
    throw new Error("directadmin-workforce-context-invalid");
  }
}

function projectWorker(company_id: string, worker: WorkforceWorker) {
  if (worker.company_id !== company_id || !id(worker.worker_id) || !["digital", "human"].includes(worker.kind) ||
      typeof worker.active !== "boolean" || !Array.isArray(worker.capabilities) || worker.capabilities.some(value => !id(value))) {
    throw new Error("directadmin-workforce-record-invalid");
  }
  return Object.freeze({ company_id, worker_id: worker.worker_id, kind: worker.kind,
    active: worker.active, capabilities: Object.freeze([...worker.capabilities]),
    ...(id(worker.manager_id) ? { manager_id: worker.manager_id } : {}),
    ...(id(worker.team_id) ? { team_id: worker.team_id } : {}),
  });
}

function projectWork(company_id: string, work: WorkItem, run_id?: string) {
  if (work.company_id !== company_id || !id(work.work_id) || !id(work.state) ||
      !stringRefs(work.context_refs) || !stringRefs(work.evidence_refs)) {
    throw new Error("directadmin-workforce-record-invalid");
  }
  return Object.freeze({ company_id, work_id: work.work_id, state: work.state,
    context_refs: Object.freeze([...work.context_refs]), evidence_refs: Object.freeze([...work.evidence_refs]),
    ...(id(work.assignee) ? { assignee: work.assignee } : {}),
    ...(id(run_id) ? { run_id } : {}),
  });
}

/** DirectAdmin is a read-only projection here until a canonical admin authority
 * owner can authorize lifecycle mutations and persist their accepted evidence. */
export function createDirectAdminWorkforceOwners(runtime: DirectAdminWorkforceRuntime): DirectAdminGatewayOwners {
  if (typeof runtime?.workforceStore?.listWorkers !== "function" || typeof runtime.workforceStore.list !== "function" ||
      typeof runtime.runStore?.findByWork !== "function") throw new Error("directadmin-workforce-runtime-invalid");

  return Object.freeze({
    async projection(plugin, context) {
      requireContext(context);
      if (plugin !== "titan_workforce") throw new Error("directadmin-workforce-plugin-invalid");
      const company_id = context.company_id;
      const [workers, work] = await Promise.all([
        runtime.workforceStore.listWorkers(company_id), runtime.workforceStore.list(company_id),
      ]);
      // Refuse malformed or cross-company payloads even if a storage adapter
      // violates its company-filtered query contract.
      const projectedWorkers = workers.map(worker => projectWorker(company_id, worker));
      const projectedWork = await Promise.all(work.map(async item => {
        const run = await runtime.runStore.findByWork(company_id, item.work_id) as { company_id?: unknown; run_id?: unknown } | null;
        if (run && (run.company_id !== company_id || !id(run.run_id))) throw new Error("directadmin-workforce-run-invalid");
        return projectWork(company_id, item, run?.run_id as string | undefined);
      }));
      const evidence_refs = [...new Set(projectedWork.flatMap(item => item.evidence_refs))];
      if (evidence_refs.length > 256) throw new Error("directadmin-workforce-projection-too-large");
      return Object.freeze({
        company_id,
        source: "canonical-workforce-runtime",
        freshness: new Date().toISOString(),
        evidence_refs: Object.freeze(evidence_refs),
        data: Object.freeze({
          schema: "titan.workforce-cockpit.v1",
          company_id,
          discovery: Object.freeze({ company_id, workers: Object.freeze(projectedWorkers), controls: Object.freeze([]) }),
          status: Object.freeze({ company_id, work: Object.freeze(projectedWork) }),
        }),
      });
    },

    async requestIntent(plugin, intent, context, revalidate) {
      requireContext(context);
      if (plugin !== "titan_workforce" || intent.company_id !== context.company_id || intent.actor_id !== context.actor_id ||
          !id(intent.capability_id) || !id(intent.operation_id) || !id(intent.correlation_id) ||
          !intent.input || typeof intent.input !== "object" || Array.isArray(intent.input) ||
          typeof intent.input.action !== "string" ||
          Object.keys(intent.input).some(key => !["action", "work_id", "reason", "target_worker_id"].includes(key))) {
        throw new Error("directadmin-workforce-intent-invalid");
      }
      const action = intent.input.action;
      if (!PROPOSED_ACTIONS.has(action) || !id(intent.input.work_id) || typeof intent.input.reason !== "string" ||
          !intent.input.reason.trim() || intent.input.reason.length > 2000 ||
          (intent.input.target_worker_id !== undefined && !id(intent.input.target_worker_id))) {
        throw new Error("directadmin-workforce-intent-invalid");
      }
      // The SDK has already revalidated ingress. Revalidate at the owner boundary
      // before a denial so revocation/company switch never looks like acceptance.
      const current = await revalidate();
      requireContext(current);
      if (current.company_id !== context.company_id || current.actor_id !== context.actor_id ||
          current.context_revision !== context.context_revision) throw new Error("directadmin-workforce-context-changed");
      // Do not call WorkforceService lifecycle primitives here: they have no
      // DirectAdmin caller-management authority gate. No state/event/evidence is
      // written, and no receipt is fabricated.
      throw new DirectAdminWorkforceActionDenied(action);
    },
  });
}
