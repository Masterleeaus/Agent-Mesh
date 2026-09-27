import type { AgentRuntimeAdapter, CompanyId, WorkOrigin, WorkerId, WorkId } from "./index.js";

export interface TitanRuntimeStartPort {
  start(input:{company_id:CompanyId;actor_id:string;agent_id:WorkerId;conversation_id:string;work_id:WorkId;role:string;messages:Array<{role:string;content:string}>}):Promise<unknown>;
}

/** Correlation-only origin metadata grants no execution authority. */
export class WorkforceRuntimeAdapter implements AgentRuntimeAdapter {
  constructor(private readonly runtime:TitanRuntimeStartPort){}
  async wake(input:{company_id:CompanyId;worker_id:WorkerId;work_id:WorkId;origin?:WorkOrigin}){
    await this.runtime.start({
      company_id:input.company_id,
      actor_id:input.origin?.actor_id??input.worker_id,
      agent_id:input.worker_id,
      conversation_id:input.origin?.conversation_id??`work:${input.work_id}`,
      work_id:input.work_id,
      role:"workforce-worker",
      messages:[{role:"system",content:`Work item ${input.work_id} is ready. Load its governed context and continue it.`}],
    });
  }
}
