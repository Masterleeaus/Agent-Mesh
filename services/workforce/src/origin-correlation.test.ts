import test from "node:test";
import assert from "node:assert/strict";
import { WorkforceService } from "./index.js";
import { MemoryWorkforceStore } from "./memory-store.js";

const origin = {
  actor_id: "owner-42",
  conversation_id: "zero-conversation-9",
  surface: "zero" as const,
  correlation_id: "corr-9",
};

test("WorkItem persists Zero origin and forwards it to digital runtime wake", async () => {
  const store = new MemoryWorkforceStore();
  const wakes: any[] = [];
  const service = new WorkforceService(store, { async wake(input) { wakes.push(input); } });

  const item = await service.create({
    company_id: "company-1",
    work_id: "work-1",
    objective: "Cover Emma's clean tomorrow",
    creator: "owner-42",
    origin,
    assignee: "dispatch-agent",
    priority: 1,
    dependencies: [],
    required_capabilities: ["schedule.cover"],
  });

  assert.deepEqual(item.origin, origin);
  assert.deepEqual((await store.get("company-1", "work-1"))?.origin, origin);
  assert.equal(wakes.length, 1);
  assert.deepEqual(wakes[0].origin, origin);
});

test("delegation preserves origin and origin metadata does not satisfy authority", async () => {
  const store = new MemoryWorkforceStore();
  let authorityChecks = 0;
  const service = new WorkforceService(
    store,
    undefined,
    { async isSatisfied() { authorityChecks += 1; return false; } },
  );

  await service.create({
    company_id: "company-1",
    work_id: "work-2",
    objective: "Move customer visit",
    creator: "owner-42",
    origin,
    priority: 1,
    dependencies: [],
    required_capabilities: [],
    authority_requirement: "schedule.change",
  });
  await service.delegate("company-1", "work-2", "scheduler-agent", "manager-agent");

  assert.deepEqual((await store.get("company-1", "work-2"))?.origin, origin);
  assert.equal(authorityChecks, 0);

  const claimed = await service.claim("company-1", "work-2", "scheduler-agent");
  assert.equal(authorityChecks, 1);
  assert.equal(claimed.state, "WAITING_APPROVAL");
});
