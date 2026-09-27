import type { WorkforceService, WorkItem, WorkerId } from "@titan-zero/workforce";
import type {
  ZeroDispatchEvent,
  ZeroRuntimeDispatcher,
  ZeroRuntimeDispatchInput,
  ZeroRuntimeDispatchResult,
} from "./runtime-dispatch";

export type ZeroWorkerSelector = (input: ZeroRuntimeDispatchInput) => Promise<WorkerId> | WorkerId;

/**
 * Production Zero ingress adapter.
 *
 * Zero creates canonical WorkItems and delegates execution to Workforce. Workforce is
 * responsible for waking/resuming TitanAgentRuntime. This adapter does not execute
 * tools, make authority decisions, or create a second runtime/workforce path.
 */
export class ZeroWorkforceDispatcher implements ZeroRuntimeDispatcher {
  constructor(
    private readonly workforce: WorkforceService,
    private readonly selectWorker: ZeroWorkerSelector,
  ) {}

  async dispatch(input: ZeroRuntimeDispatchInput): Promise<ZeroRuntimeDispatchResult> {
    const worker_id = input.requested_agent_id?.trim() || await this.selectWorker(input);
    if (!worker_id) throw new Error("zero-workforce-worker-required");

    const work_id = input.continuation_token?.trim() || `zero:${input.interaction_id}`;
    let work: WorkItem;

    if (input.continuation_token) {
      work = await this.workforce.resume(input.company_id, work_id, input.actor_id);
    } else {
      work = await this.workforce.create({
        company_id: input.company_id,
        work_id,
        objective: input.text,
        description: input.text,
        creator: input.actor_id,
        origin: {
          actor_id: input.actor_id,
          conversation_id: input.conversation_id,
          surface: "zero",
          correlation_id: input.correlation_id,
        },
        assignee: worker_id,
        priority: 100,
        dependencies: [],
        required_capabilities: [],
      });
    }

    const event: ZeroDispatchEvent = {
      id: `${input.interaction_id}:work:${work.work_id}`,
      kind: "work.accepted",
      conversation_id: input.conversation_id,
      company_id: input.company_id,
      surface: "zero",
      work_id: work.work_id,
      worker_id: work.assignee ?? worker_id,
      state: work.state,
      correlation_id: input.correlation_id,
    };

    return {
      accepted: true,
      events: [event],
      continuation_token: work.work_id,
    };
  }
}
