import test from "node:test";
import assert from "node:assert/strict";
import { WorkforceRuntimeAdapter } from "./runtime-adapter.js";

const runtimeRecorder = (recoverable: any = null) => {
  const starts: any[] = [];
  const resumes: any[] = [];
  return {
    starts,
    resumes,
    runtime: {
      async findRecoverableByWork() { return recoverable; },
      async resume(input: unknown) { resumes.push(input); return {}; },
      async start(input: unknown) { starts.push(input); return {}; },
    },
  };
};

test("wake resumes the existing non-terminal run for the same company and work item", async () => {
  const r = runtimeRecorder({ run_id: "run-1", state: "WAITING_EXTERNAL", agent_id: "agent-1" });
  await new WorkforceRuntimeAdapter(r.runtime).wake({ company_id: "c1", worker_id: "agent-1", work_id: "w1", origin: { actor_id: "one-1", conversation_id: "conv-1" } });
  assert.equal(r.starts.length, 0);
  assert.deepEqual(r.resumes, [{ company_id: "c1", run_id: "run-1" }]);
});

test("chat-originated work preserves One actor and Zero conversation when starting runtime", async () => {
  const r = runtimeRecorder();
  await new WorkforceRuntimeAdapter(r.runtime).wake({ company_id: "c1", worker_id: "agent-1", work_id: "w1", origin: { actor_id: "one-1", conversation_id: "conv-zero-1", correlation_id: "corr-1", source_surface: "zero" } });
  assert.equal(r.starts.length, 1);
  assert.equal(r.starts[0].actor_id, "one-1");
  assert.equal(r.starts[0].conversation_id, "conv-zero-1");
  assert.equal(r.starts[0].company_id, "c1");
  assert.equal(r.starts[0].work_id, "w1");
});

test("system-originated work falls back to worker actor and deterministic work conversation", async () => {
  const r = runtimeRecorder();
  await new WorkforceRuntimeAdapter(r.runtime).wake({ company_id: "c1", worker_id: "agent-1", work_id: "w1" });
  assert.equal(r.starts[0].actor_id, "agent-1");
  assert.equal(r.starts[0].conversation_id, "work:w1");
});

test("recoverable run identity cannot be replaced by a conflicting assignee", async () => {
  const r = runtimeRecorder({ run_id: "run-1", state: "WAITING_APPROVAL", agent_id: "agent-original" });
  await assert.rejects(
    new WorkforceRuntimeAdapter(r.runtime).wake({ company_id: "c1", worker_id: "agent-other", work_id: "w1", origin: { actor_id: "one-1", conversation_id: "conv-1" } }),
    /runtime-work-assignee-conflict/,
  );
  assert.equal(r.resumes.length, 0);
  assert.equal(r.starts.length, 0);
});
