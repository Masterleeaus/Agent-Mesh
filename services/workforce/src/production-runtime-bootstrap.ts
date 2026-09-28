// @ts-nocheck
import { RuntimeEventBus, TitanAgentRuntime } from "../../../packages/runtime/agent-runtime/index.mjs";
import { SqliteRunStore } from "../../../packages/runtime/agent-runtime/sqlite-run-store.mjs";
import { WorkforceService } from "./index.js";
import { WorkforceRuntimeAdapter } from "./runtime-adapter.js";
import { SqliteWorkforceStore } from "./sqlite-store.js";
import { ZeroWorkforceRuntimeDispatcher } from "./zero-runtime-dispatcher.js";

const requiredMethod=(owner,name,label)=>{if(!owner||typeof owner[name]!=="function")throw new Error(`production-runtime-port-required:${label}.${name}`);};

export async function createProductionRuntimeBootstrap({storage,ports,eventBus}={}){
  if(!storage||typeof storage.query!=="function")throw new Error("production-runtime-storage-required");
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

  // One canonical Zero -> Workforce -> persistent-runtime bridge. Keep dispatch as
  // a compatibility alias so existing composition roots do not gain a second path.
  const zeroDispatcher=new ZeroWorkforceRuntimeDispatcher(
    workforce,
    workforceStore,
    workforceStore,
    runtime,
  );
  const dispatch=(input)=>zeroDispatcher.dispatch(input);

  return Object.freeze({
    storage,
    runStore,
    workforceStore,
    runtime,
    events,
    workforce,
    zeroDispatcher,
    dispatch,
  });
}
