import test from "node:test";
import assert from "node:assert/strict";
import { createSqliteStorage } from "../../../packages/storage/src/index.js";
import { createProductionRuntimeBootstrap } from "./production-runtime-bootstrap.js";

const company_id="company-bootstrap";

function ports(final="handled") {
  return {
    modelRouter:{async next(){return {final};}},
    capabilities:{async resolve(){return null;}},
    authorityGateway:{async authorize(){return {status:"denied",decision_id:"deny-test"};},async execute(){throw new Error("execute-must-not-be-called");}},
    contextProvider:{async load(input:any){return {company_id:input.company_id};}},
  };
}

test("production bootstrap composes canonical SQLite workforce and persistent runtime while preserving Zero origin", async()=>{
  const storage=createSqliteStorage(":memory:");
  const bootstrap=await createProductionRuntimeBootstrap({storage,ports:ports()});
  await bootstrap.workforce.registerWorker({company_id,worker_id:"zero-gm",kind:"digital",capabilities:["zero.interaction"],active:true});
  const result=await bootstrap.dispatch({company_id,actor_id:"owner-1",conversation_id:"conv-1",interaction_id:"int-1",client_message_id:"msg-1",text:"Handle tomorrow.",correlation_id:"corr-1"});
  assert.equal(result.accepted,true);
  const work=await bootstrap.workforceStore.get(company_id,"zero:int-1");
  assert.equal(work?.origin?.actor_id,"owner-1");
  assert.equal(work?.origin?.conversation_id,"conv-1");
  assert.equal(work?.origin?.correlation_id,"corr-1");
  const rows=await storage.query<{payload:string}>(`SELECT payload FROM agent_runs WHERE company_id=$1 AND work_id=$2`,[company_id,"zero:int-1"]);
  assert.equal(rows.rowCount,1);
  const persisted=JSON.parse(rows.rows[0]!.payload);
  assert.equal(persisted.actor_id,"owner-1");
  assert.equal(persisted.conversation_id,"conv-1");
  await storage.close();
});

test("production bootstrap is idempotent by company + interaction", async()=>{
  const storage=createSqliteStorage(":memory:");
  const bootstrap=await createProductionRuntimeBootstrap({storage,ports:ports()});
  await bootstrap.workforce.registerWorker({company_id,worker_id:"zero-gm",kind:"digital",capabilities:["zero.interaction"],active:true});
  const input={company_id,actor_id:"owner-1",conversation_id:"conv-1",interaction_id:"int-duplicate",client_message_id:"msg-dup",text:"What needs attention?",correlation_id:"corr-dup"};
  await bootstrap.dispatch(input); await bootstrap.dispatch(input);
  const work=await storage.query(`SELECT work_id FROM workforce_work_items WHERE company_id=$1 AND work_id=$2`,[company_id,"zero:int-duplicate"]);
  const runs=await storage.query(`SELECT run_id FROM agent_runs WHERE company_id=$1 AND work_id=$2`,[company_id,"zero:int-duplicate"]);
  assert.equal(work.rowCount,1); assert.equal(runs.rowCount,1);
  await storage.close();
});

test("production bootstrap refuses incomplete provider ports", async()=>{
  const storage=createSqliteStorage(":memory:");
  await assert.rejects(()=>createProductionRuntimeBootstrap({storage,ports:{modelRouter:ports().modelRouter} as any}),/production-runtime-port-required/);
  await storage.close();
});
