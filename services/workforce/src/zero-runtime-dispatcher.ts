import { Buffer } from "node:buffer";
import type {
  CompanyId,
  WorkId,
  WorkItem,
  WorkforceStore,
  WorkforceWorker,
  WorkforceWorkerStore,
  WorkerId,
} from "./index.js";
import { WorkforceService } from "./index.js";

export type ZeroRuntimeEvent = {
  event_id?: string;
  type: string;
  company_id: CompanyId;
  run_id?: string;
  conversation_id?: string;
  work_id?: WorkId;
  agent_id?: WorkerId;
  evidence_ref?: string | null;
  [key: string]: unknown;
};

export interface ZeroPersistentRuntimePort {
  events: { subscribe(listener: (event: ZeroRuntimeEvent) => void): () => void };
  findRecoverableByWork(input: { company_id: CompanyId; work_id: WorkId }): Promise<{
    run_id: string;
    company_id?: CompanyId;
    work_id?: WorkId;
    conversation_id?: string;
    agent_id: WorkerId;
    state: string;
  } | null>;
  start(input: {
    company_id: CompanyId;
    actor_id: string;
    agent_id: WorkerId;
    conversation_id: string;
    work_id: WorkId;
    role: string;
    messages: Array<{ role: string; content: string }>;
  }): Promise<ZeroRuntimeRun>;
  resume(input: {
    company_id: CompanyId;
    run_id: string;
    input: { role: string; content: string };
  }): Promise<ZeroRuntimeRun>;
}

export type ZeroRuntimeRun = {
  run_id: string;
  company_id: CompanyId;
  conversation_id: string;
  work_id: WorkId;
  agent_id: WorkerId;
  state: string;
  result?: unknown;
  error?: unknown;
};

export type ZeroWorkforceDispatchInput = {
  company_id: CompanyId;
  actor_id: string;
  conversation_id: string;
  interaction_id: string;
  client_message_id: string;
  text: string;
  correlation_id: string;
  requested_agent_id?: WorkerId;
  continuation_token?: string;
};

export type ZeroWorkforceDispatchEvent = {
  id: string;
  kind: string;
  conversation_id: string;
  company_id: CompanyId;
  surface: "zero";
  work_id?: WorkId;
  run_id?: string;
  agent_id?: WorkerId;
  [key: string]: unknown;
};

export type ZeroWorkforceDispatchResult = {
  accepted: true;
  events: ZeroWorkforceDispatchEvent[];
  continuation_token?: string;
};

type Continuation = { work_id: WorkId; run_id: string };
const terminalRuntimeStates = new Set(["COMPLETED", "FAILED", "CANCELLED"]);
const waitingWorkStates = new Set(["WAITING", "WAITING_APPROVAL", "WAITING_EXTERNAL"]);

function required(value: unknown, code: string): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function encodeContinuation(value: Continuation): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeContinuation(token: string): Continuation {
  try {
    const parsed = JSON.parse(Buffer.from(required(token, "zero-continuation-required"), "base64url").toString("utf8")) as Partial<Continuation>;
    return {
      work_id: required(parsed.work_id, "zero-continuation-work-id-required"),
      run_id: required(parsed.run_id, "zero-continuation-run-id-required"),
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("zero-continuation-")) throw error;
    throw new Error("zero-continuation-invalid");
  }
}

/**
 * Canonical Zero -> Workforce -> persistent runtime bridge.
 *
 * Zero only contributes One's intent and correlation metadata. A real Workforce
 * WorkItem is created and assigned to an existing digital workforce actor before
 * TitanAgentRuntime is entered. This bridge does not grant authority; tool execution
 * remains behind the runtime's Decision/Risk/Authority/ExecutionGateway boundary.
 */
export class ZeroWorkforceRuntimeDispatcher {
  constructor(
    private readonly workforce: WorkforceService,
    private readonly store: WorkforceStore,
    private readonly workers: WorkforceWorkerStore,
    private readonly runtime: ZeroPersistentRuntimePort,
  ) {}

  async dispatch(input: ZeroWorkforceDispatchInput): Promise<ZeroWorkforceDispatchResult> {
    const normalized = this.normalize(input);
    const runtimeEvents: ZeroRuntimeEvent[] = [];

    const unsubscribe = this.runtime.events.subscribe((event) => {
      if (event.company_id !== normalized.company_id) return;
      if (event.conversation_id && event.conversation_id !== normalized.conversation_id) return;
      runtimeEvents.push(structuredClone(event));
    });

    try {
      if (normalized.continuation_token) return await this.resume(normalized, runtimeEvents);
      return await this.start(normalized, runtimeEvents);
    } finally {
      unsubscribe();
    }
  }

  private normalize(input: ZeroWorkforceDispatchInput): ZeroWorkforceDispatchInput {
    return {
      ...input,
      company_id: required(input.company_id, "zero-company-id-required"),
      actor_id: required(input.actor_id, "zero-actor-id-required"),
      conversation_id: required(input.conversation_id, "zero-conversation-id-required"),
      interaction_id: required(input.interaction_id, "zero-interaction-id-required"),
      client_message_id: required(input.client_message_id, "zero-client-message-id-required"),
      text: required(input.text, "zero-text-required"),
      correlation_id: required(input.correlation_id, "zero-correlation-id-required"),
      requested_agent_id: input.requested_agent_id?.trim() || undefined,
      continuation_token: input.continuation_token?.trim() || undefined,
    };
  }

  private async start(input: ZeroWorkforceDispatchInput, runtimeEvents: ZeroRuntimeEvent[]): Promise<ZeroWorkforceDispatchResult> {
    const work_id = `zero:${input.conversation_id}:${input.client_message_id}`;
    const existing = await this.store.get(input.company_id, work_id);
    if (existing) {
      this.assertOrigin(existing, input);
      const run = await this.runtime.findRecoverableByWork({ company_id: input.company_id, work_id });
      return this.result(input, existing, runtimeEvents, run ?? undefined);
    }

    const worker = await this.resolveWorker(input.company_id, input.requested_agent_id);
    await this.workforce.create({
      company_id: input.company_id,
      work_id,
      objective: input.text,
      description: "Intent delegated by One through Zero.",
      creator: input.actor_id,
      origin: {
        actor_id: input.actor_id,
        conversation_id: input.conversation_id,
        surface: "zero",
        correlation_id: input.correlation_id,
      },
      assignee: worker.worker_id,
      team_id: worker.team_id,
      priority: 50,
      dependencies: [],
      required_capabilities: [],
      context_refs: [],
      evidence_refs: [],
    });

    await this.workforce.claim(input.company_id, work_id, worker.worker_id);
    await this.workforce.start(input.company_id, work_id, worker.worker_id);

    const run = await this.runtime.start({
      company_id: input.company_id,
      actor_id: input.actor_id,
      agent_id: worker.worker_id,
      conversation_id: input.conversation_id,
      work_id,
      role: "workforce-manager",
      messages: [{ role: "user", content: input.text }],
    });
    this.assertRun(run, input.company_id, work_id, input.conversation_id, worker.worker_id);
    await this.syncWorkFromRun(run, runtimeEvents);
    const work = (await this.store.get(input.company_id, work_id))!;
    return this.result(input, work, runtimeEvents, run);
  }

  private async resume(input: ZeroWorkforceDispatchInput, runtimeEvents: ZeroRuntimeEvent[]): Promise<ZeroWorkforceDispatchResult> {
    const continuation = decodeContinuation(input.continuation_token!);
    const work = await this.store.get(input.company_id, continuation.work_id);
    if (!work) throw new Error("zero-continuation-work-not-found");
    this.assertOrigin(work, input);
    if (!work.assignee) throw new Error("zero-continuation-work-unassigned");

    const recoverable = await this.runtime.findRecoverableByWork({ company_id: input.company_id, work_id: work.work_id });
    if (!recoverable || recoverable.run_id !== continuation.run_id) throw new Error("zero-continuation-run-not-found");
    if (recoverable.agent_id !== work.assignee) throw new Error("zero-continuation-agent-conflict");

    if (waitingWorkStates.has(work.state)) await this.workforce.resume(input.company_id, work.work_id, input.actor_id);
    const refreshed = await this.store.get(input.company_id, work.work_id);
    if (!refreshed) throw new Error("zero-continuation-work-not-found");
    if (refreshed.state === "READY") await this.workforce.claim(input.company_id, work.work_id, work.assignee);
    const claimed = await this.store.get(input.company_id, work.work_id);
    if (claimed?.state === "CLAIMED") await this.workforce.start(input.company_id, work.work_id, work.assignee);

    const run = await this.runtime.resume({
      company_id: input.company_id,
      run_id: continuation.run_id,
      input: { role: "user", content: input.text },
    });
    this.assertRun(run, input.company_id, work.work_id, input.conversation_id, work.assignee);
    await this.syncWorkFromRun(run, runtimeEvents);
    const updated = (await this.store.get(input.company_id, work.work_id))!;
    return this.result(input, updated, runtimeEvents, run);
  }

  private async resolveWorker(company_id: CompanyId, requested?: WorkerId): Promise<WorkforceWorker> {
    if (requested) {
      const worker = await this.workers.getWorker(company_id, requested);
      if (!worker || !worker.active || worker.kind !== "digital") throw new Error("zero-requested-agent-unavailable");
      return worker;
    }

    const managers = (await this.workers.listWorkers(company_id))
      .filter((worker) => worker.active && worker.kind === "digital" && worker.capabilities.includes("work.delegate"))
      .sort((a, b) => a.worker_id.localeCompare(b.worker_id));
    if (!managers.length) throw new Error("zero-workforce-manager-unavailable");
    return managers[0];
  }

  private assertOrigin(work: WorkItem, input: ZeroWorkforceDispatchInput): void {
    if (work.company_id !== input.company_id) throw new Error("zero-work-company-conflict");
    if (work.origin?.conversation_id !== input.conversation_id) throw new Error("zero-work-conversation-conflict");
    if (work.origin?.actor_id !== input.actor_id) throw new Error("zero-work-actor-conflict");
    if (work.origin?.surface !== "zero") throw new Error("zero-work-surface-conflict");
  }

  private assertRun(run: ZeroRuntimeRun, company_id: CompanyId, work_id: WorkId, conversation_id: string, agent_id: WorkerId): void {
    if (run.company_id !== company_id) throw new Error("zero-runtime-company-conflict");
    if (run.work_id !== work_id) throw new Error("zero-runtime-work-conflict");
    if (run.conversation_id !== conversation_id) throw new Error("zero-runtime-conversation-conflict");
    if (run.agent_id !== agent_id) throw new Error("zero-runtime-agent-conflict");
  }

  private async syncWorkFromRun(run: ZeroRuntimeRun, runtimeEvents: ZeroRuntimeEvent[]): Promise<void> {
    const actor = run.agent_id;
    const evidence = runtimeEvents
      .filter((event) => event.run_id === run.run_id && typeof event.evidence_ref === "string" && event.evidence_ref)
      .map((event) => String(event.evidence_ref));

    if (run.state === "COMPLETED") {
      await this.workforce.complete(run.company_id, run.work_id, actor, run.result, evidence);
      return;
    }
    if (run.state === "FAILED") {
      await this.workforce.fail(run.company_id, run.work_id, actor, run.error ?? run.result);
      return;
    }
    if (run.state === "CANCELLED") {
      await this.workforce.cancel(run.company_id, run.work_id, actor);
      return;
    }
    if (run.state === "WAITING_APPROVAL") {
      await this.workforce.wait(run.company_id, run.work_id, actor, "WAITING_APPROVAL");
      return;
    }
    if (run.state === "WAITING_EXTERNAL") {
      await this.workforce.wait(run.company_id, run.work_id, actor, "WAITING_EXTERNAL");
      return;
    }
    if (run.state.startsWith("WAITING_") || run.state === "SUSPENDED") {
      await this.workforce.wait(run.company_id, run.work_id, actor, "WAITING");
    }
  }

  private result(
    input: ZeroWorkforceDispatchInput,
    work: WorkItem,
    runtimeEvents: ZeroRuntimeEvent[],
    run?: { run_id: string; state: string; agent_id: WorkerId },
  ): ZeroWorkforceDispatchResult {
    const events: ZeroWorkforceDispatchEvent[] = runtimeEvents.map((event, index) => ({
      ...event,
      id: event.event_id ?? `${event.run_id ?? work.work_id}:${index}`,
      kind: event.type,
      company_id: input.company_id,
      conversation_id: input.conversation_id,
      surface: "zero" as const,
      work_id: event.work_id ?? work.work_id,
      run_id: event.run_id ?? run?.run_id,
      agent_id: event.agent_id ?? run?.agent_id ?? work.assignee,
    }));
    events.push({
      id: `work:${work.work_id}:${work.updated_at}`,
      kind: "work.state",
      company_id: input.company_id,
      conversation_id: input.conversation_id,
      surface: "zero",
      work_id: work.work_id,
      run_id: run?.run_id,
      agent_id: run?.agent_id ?? work.assignee,
      state: work.state,
    });

    return {
      accepted: true,
      events,
      ...(run && !terminalRuntimeStates.has(run.state)
        ? { continuation_token: encodeContinuation({ work_id: work.work_id, run_id: run.run_id }) }
        : {}),
    };
  }
}
