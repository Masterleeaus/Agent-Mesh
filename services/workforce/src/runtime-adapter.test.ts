import test from "node:test";
import assert from "node:assert/strict";
import { WorkforceRuntimeAdapter } from "./runtime-adapter.js";

test("wake resumes the existing non-terminal run for the same company and work item", async () => {
  const calls: Array<{ kind: string; input: unknown }> = [];
  const runtime = {
    async findRecoverableByWork(input: { company_id: string; work_id: string }) {
      calls.push({ kind: "find", input });
      return { run_id: "run-1", state: "WAITING_EXTERNAL", agent_id: "agent-1" };
    },
    async resume(input: { company_id: string; run_id: string }) {
      calls.push({ kind: "resume", input });
      return {};
    },
    async start(input: unknown) {
      calls.push({ kind: "start", input });
      return {};
    },
  };

  await new WorkforceRuntimeAdapter(runtime).wake({ company_id: "c1", worker_id: "agent-1", work_id: "w1" });

  assert.deepEqual(calls.map((call) => call.kind), ["find", "resume"]);
  assert.deepEqual(calls[1]?.input, { company_id: "c1", run_id: "run-1" });
});

test("wake starts a deterministic work-bound run only when no recoverable run exists", async () => {
  const starts: any[] = [];
  const runtime = {
    async findRecoverableByWork() { return null; },
    async resume() { throw new Error("unexpected resume"); },
    async start(input: unknown) { starts.push(input); return {}; },
  };

  await new WorkforceRuntimeAdapter(runtime).wake({ company_id: "c1", worker_id: "agent-1", work_id: "w1" });

  assert.equal(starts.length, 1);
  assert.deepEqual(starts[0], {
    company_id: "c1",
    actor_id: "agent-1",
    agent_id: "agent-1",
    conversation_id: "work:w1",
    work_id: "w1",
    role: "workforce-worker",
    messages: [{ role: "system", content: "Work item w1 is ready. Load its governed context and continue it." }],
  });
});
