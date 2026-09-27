// @ts-nocheck
import { RuntimeEventBus, TitanAgentRuntime } from "../../../packages/runtime/agent-runtime/index.mjs";
import { SqliteRunStore } from "../../../packages/runtime/agent-runtime/sqlite-run-store.mjs";
import { WorkforceService } from "./index.js";
import { WorkforceRuntimeAdapter } from "./runtime-adapter.js";
import { SqliteWorkforceStore } from "./sqlite-store.js";

const requiredMethod=(owner,name,label)=>{
  if(!owner||typeof owner[name]!=="function") throw new Error(`production-runtime-port-required:${label}.${name}`);
};
const requiredText=(value,label)=>{const text=String(value??"").trim();if(!text)throw new Error(`${label}-required`);return text;};

/**
 * Single production composition root for the existing TitanAgentRuntime.
 *
 * Storage/workforce/runtime are concrete. Provider-specific reasoning, context,
 * capability and governed authority/execution adapters are mandatory injected
 * ports because this repository does not contain a production inference client
 * and must never substitute an allow-all authority adapter.
 */
export async function createProductionRuntimeBootstrap({storage,ports,eventBus}={}){
  if(!storage||typeof storage.query!=="function") throw new Error("production-runtime-storage-required");
  requiredMethod(ports?.modelRouter,"next","modelRouter");
  requiredMethod(ports?.capabilities,"resolve","capabilities");
  requiredMethod(ports?.contextProvider,"load","contextProvider");
  requiredMethod(ports?.authorityGateway,"authorize","authorityGateway");
  requiredMethod(ports?.authorityGateway,"execute","authorityGateway");

  const runStore=new SqliteRunStore(storage);
  const workforceStore=new SqliteWorkforceStore(storage);
  await runStore.migrate();
  await workforceStore.migrate();

  const events=eventBus??new RuntimeEventBus();
  const runtime=new TitanAgentRuntime({
    store:runStore,
    modelRouter:ports.modelRouter,
    capabilities:ports.capabilities,
    authorityGateway:ports.authorityGateway,
    contextProvider:ports.contextProvider,
    eventBus:events,
  });
  const runtimeAdapter=new WorkforceRuntimeAdapter(runtime);
  const workforce=new WorkforceService(workforceStore,runtimeAdapter,undefined,workforceStore);

  async function dispatch(input){
    const company_id=requiredText(input?.company_id,"company_id");
    const actor_id=requiredText(input?.actor_id,"actor_id");
    const conversation_id=requiredText(input?.conversation_id,"conversation_id");
    const interaction_id=requiredText(input?.interaction_id,"interaction_id");
    const correlation_id=requiredText(input?.correlation_id,"correlation_id");
    const text=requiredText(input?.text,"text");
    const work_id=`zero:${interaction_id}`;

    const existing=await workforceStore.get(company_id,work_id);
    if(existing){
      if(existing.origin?.actor_id!==actor_id||existing.origin?.conversation_id!==conversation_id||existing.origin?.correlation_id!==correlation_id){
        const error=new Error("zero-interaction-idempotency-conflict");
        error.code="ZERO_INTERACTION_CONFLICT";
        throw error;
      }
      return {accepted:true,events:[Object.freeze({id:`${work_id}:accepted`,kind:"work.accepted",company_id,conversation_id,surface:"zero",work_id,state:existing.state,duplicate:true})],continuation_token:work_id};
    }

    const workers=(await workforceStore.listWorkers(company_id))
      .filter(worker=>worker.active&&worker.kind==="digital"&&worker.capabilities.includes("zero.interaction"))
      .sort((a,b)=>a.worker_id.localeCompare(b.worker_id));
    const worker=workers[0];
    if(!worker){
      const error=new Error("zero-workforce-worker-unavailable");
      error.code="ZERO_WORKFORCE_UNAVAILABLE";
      throw error;
    }

    const item=await workforce.create({
      company_id,work_id,objective:text,description:"Zero conversational work",creator:actor_id,
      origin:{actor_id,conversation_id,surface:"zero",correlation_id},
      assignee:worker.worker_id,priority:100,dependencies:[],required_capabilities:["zero.interaction"],
      context_refs:[`conversation:${conversation_id}`,`interaction:${interaction_id}`],evidence_refs:[],
    });

    return {accepted:true,events:[Object.freeze({id:`${work_id}:accepted`,kind:"work.accepted",company_id,conversation_id,surface:"zero",work_id,state:item.state,worker_id:worker.worker_id,duplicate:false})],continuation_token:work_id};
  }

  return Object.freeze({storage,runStore,workforceStore,runtime,events,workforce,dispatch});
}
