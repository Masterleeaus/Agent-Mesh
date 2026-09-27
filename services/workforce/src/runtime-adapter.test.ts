import test from "node:test";
import assert from "node:assert/strict";
import { WorkforceRuntimeAdapter } from "./runtime-adapter.js";

const runtimeRecorder = () => {
  const starts: any[] = [];
  return {
    starts,
    runtime: {
      async start(input: unknown) { starts.push(input); return {}; },
    },
  };
};

test("Zero-origin work preserves authenticated actor and conversation into runtime", async () => {
  const { starts, runtime } = runtimeRecorder();
  const adapter = new WorkforceRuntimeAdapter(runtime);

  await adapter.wake({
    company_id: "company-1",
    worker_id: "dispatch-agent",
    work_id: "work-1",
    origin: {
      actor_id: "owner-42",
      conversation_id: "zero-conversation-9",
      surface: "zero",
      correlation_id: "corr-9",
    },
  });

  assert.equal(starts.length, 1);
  assert.equal(starts[0].company_id, "company-1");
  assert.equal(starts[0].agent_id, "dispatch-agent");
  assert.equal(starts[0].actor_id, "owner-42");
  assert.equal(starts[0].conversation_id, "zero-conversation-9");
  assert.equal(starts[0].work_id, "work-1");
  assert.equal("authority" in starts[0], false);
  assert.equal("authority_context" in starts[0], false);
});

test("system-origin work uses deterministic fallback identity without inventing authority", async () => {
  const { starts, runtime } = runtimeRecorder();
  const adapter = new WorkforceRuntimeAdapter(runtime);

  await adapter.wake({ company_id: "company-1", worker_id: "scheduler-agent", work_id: "work-system" });

  assert.equal(starts[0].actor_id, "scheduler-agent");
  assert.equal(starts[0].conversation_id, "work:work-system");
  assert.equal("authority" in starts[0], false);
});
