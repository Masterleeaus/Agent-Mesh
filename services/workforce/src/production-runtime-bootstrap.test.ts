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

async function registerManager(bootstrap:any) {
  await bootstrap.workforce.registerWorker({
    company_id,
    worker_id:"zero-gm",
    kind:"digital",
    capabilities:["work.delegate"],
    active:true,
  });
}

test("production bootstrap composes the canonical Zero dispatcher over SQLite workforce and persistent runtime", async()=>{
  const storage=createSqliteStorage(":memory:");
  const bootstrap=await createProductionRuntimeBootstrap({storage,ports:ports()});
  assert.ok(bootstrap.zeroDispatcher);
  await registerManager(bootstrap);
  const input={company_id,actor_id:"owner-1",conversation_id:"conv-1",interaction_id:"int-1",client_message_id:"msg-1",text:"Handle tomorrow.",correlation_id:"corr-1"};
  const result=await bootstrap.dispatch(input);
  assert.equal(result.accepted,true);
  const workId="zero:conv-1:msg-1";
  const work=await bootstrap.workforceStore.get(company_id,workId);
  assert.equal(work?.origin?.actor_id,"owner-1");
  assert.equal(work?.origin?.conversation_id,"conv-1");
  assert.equal(work?.origin?.correlation_id,"corr-1");
  assert.equal(work?.assignee,"zero-gm");
  const rows=await storage.query<{payload:string}>(`SELECT payload FROM agent_runs WHERE company_id=$1 AND work_id=$2`,[company_id,workId]);
  assert.equal(rows.rowCount,1);
  const persisted=JSON.parse(rows.rows[0]!.payload);
  assert.equal(persisted.actor_id,"owner-1");
  assert.equal(persisted.conversation_id,"conv-1");
  await storage.close();
});

test("production bootstrap uses canonical company + conversation + client-message idempotency", async()=>{
  const storage=createSqliteStorage(":memory:");
  const bootstrap=await createProductionRuntimeBootstrap({storage,ports:ports()});
  await registerManager(bootstrap);
  const input={company_id,actor_id:"owner-1",conversation_id:"conv-1",interaction_id:"int-duplicate",client_message_id:"msg-dup",text:"What needs attention?",correlation_id:"corr-dup"};
  await bootstrap.dispatch(input);
  await bootstrap.dispatch(input);
  const workId="zero:conv-1:msg-dup";
  const work=await storage.query(`SELECT work_id FROM workforce_work_items WHERE company_id=$1 AND work_id=$2`,[company_id,workId]);
  const runs=await storage.query(`SELECT run_id FROM agent_runs WHERE company_id=$1 AND work_id=$2`,[company_id,workId]);
  assert.equal(work.rowCount,1);
  assert.equal(runs.rowCount,1);
  await storage.close();
});

test("production bootstrap refuses incomplete provider ports", async()=>{
  const storage=createSqliteStorage(":memory:");
  await assert.rejects(()=>createProductionRuntimeBootstrap({storage,ports:{modelRouter:ports().modelRouter} as any}),/production-runtime-port-required/);
  await storage.close();
});

test("completed replay retains the durable run identity after bootstrap restart", async () => {
  const storage = createSqliteStorage(":memory:");
  try {
    const first = await createProductionRuntimeBootstrap({ storage, ports: ports() });
    await registerManager(first);
    const input = { company_id, actor_id: "owner-1", conversation_id: "replay", interaction_id: "int", client_message_id: "msg", text: "Inspect", correlation_id: "corr" };
    const initial = await first.dispatch(input);
    const runId = initial.events.find((e: any) => e.kind === "run.started")?.run_id;
    assert.ok(runId);
    const restarted = await createProductionRuntimeBootstrap({ storage, ports: ports() });
    const replay = await restarted.dispatch(input);
    assert.equal(replay.events.find((e: any) => e.kind === "work.state")?.run_id, runId);
  } finally { await storage.close(); }
});

test("production continuation resumes once with the authenticated user's input", async () => {
  const storage = createSqliteStorage(":memory:");
  try {
    const seen: any[] = [];
    const configured = ports();
    configured.modelRouter = { async next(input: any) {
      seen.push(structuredClone(input));
      return seen.length === 1 ? { wait: { state: "WAITING_USER" } } : { final: "handled" };
    } } as any;
    const bootstrap = await createProductionRuntimeBootstrap({ storage, ports: configured });
    await registerManager(bootstrap);
    const input = { company_id, actor_id: "owner-1", conversation_id: "resume", interaction_id: "int", client_message_id: "msg", text: "Inspect", correlation_id: "corr" };
    const waiting = await bootstrap.dispatch(input);
    assert.ok(waiting.continuation_token);
    await assert.rejects(() => bootstrap.dispatch({ ...input, company_id: "company-b", continuation_token: waiting.continuation_token }), /work-not-found/);
    const done = await bootstrap.dispatch({ ...input, client_message_id: "reply", text: "Continue with this answer", continuation_token: waiting.continuation_token });
    assert.equal(seen.length, 2);
    assert.equal(seen[1].messages.at(-1).content, "Continue with this answer");
    assert.equal(done.events.at(-1)?.state, "COMPLETED");
    const runs = await storage.query("SELECT run_id FROM agent_runs WHERE company_id=$1", [company_id]);
    assert.equal(runs.rowCount, 1);
  } finally { await storage.close(); }
});

test("concurrent Zero delivery creates only one WorkItem and persistent run", async () => {
 const storage=createSqliteStorage(':memory:');
 try {
  const bootstrap=await createProductionRuntimeBootstrap({storage,ports:ports()});await registerManager(bootstrap);
  const input={company_id,actor_id:'owner',conversation_id:'parallel',interaction_id:'int',client_message_id:'message',correlation_id:'corr',text:'Inspect'};
  await Promise.all([bootstrap.dispatch(input),bootstrap.dispatch(input)]);
  assert.equal((await storage.query('SELECT run_id FROM agent_runs WHERE company_id=$1 AND work_id=$2',[company_id,'zero:parallel:message'])).rowCount,1);
 }finally{await storage.close();}
});

test("production bootstrap composes canonical authority gateway and refuses incomplete resolver ports", async()=>{
  const storage=createSqliteStorage(":memory:");
  const base=ports();
  await assert.rejects(
    ()=>createProductionRuntimeBootstrap({storage,ports:{modelRouter:base.modelRouter,capabilities:base.capabilities,contextProvider:base.contextProvider,executionGateway:{async execute(){return {state:"VERIFIED",verified:true};}}} as any}),
    /production-runtime-port-required:governanceResolver.resolve/,
  );
  await storage.close();
});
