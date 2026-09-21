import test from "node:test";
import assert from "node:assert/strict";

import {
  applyGoReceipt,
  createGoFieldSession,
  prepareGoIssue,
  prepareGoTransition,
  revalidateGoQueue,
} from "../app/titan/runtime/go-field-runtime.mjs";

const base = {
  company_id: "demo_001",
  actor_id: "worker_alex",
  device_id: "device_go_01",
  job_id: "job_2048",
  projection_revision: "go-rev-4",
};

test("blocks travel until route, equipment and access are ready", () => {
  const session = createGoFieldSession({ ...base, route_ready: false, equipment_ready: false, access_status: "pending" });
  const result = prepareGoTransition(session, "travel", { online: true });

  assert.equal(result.status, "blocked");
  assert.deepEqual(result.blockers.map((item) => item.code), ["route_not_ready", "equipment_not_ready", "access_not_confirmed"]);
  assert.equal(result.session.stage, "ready");
  assert.equal(result.intent, null);
});

test("prepares a governed transition intent without advancing the visit", () => {
  const session = createGoFieldSession({ ...base, route_ready: true, equipment_ready: true, access_status: "confirmed" });
  const result = prepareGoTransition(session, "travel", { online: true, now: "2026-09-16T06:00:00Z" });

  assert.equal(result.status, "awaiting_receipt");
  assert.equal(result.session.stage, "ready");
  assert.equal(result.intent.transport, "titan-command-bus");
  assert.equal(result.intent.execution_authorised, false);
  assert.equal(result.intent.company_id, "demo_001");
  assert.match(result.intent.idempotency_key, /^go:job_2048:travel:/);
});

test("advances only after a matching server receipt", () => {
  const session = createGoFieldSession({ ...base, route_ready: true, equipment_ready: true, access_status: "confirmed" });
  const prepared = prepareGoTransition(session, "travel", { online: true, now: "2026-09-16T06:00:00Z" });
  const advanced = applyGoReceipt(prepared.session, prepared.intent, {
    company_id: "demo_001",
    command_id: prepared.intent.command_id,
    correlation_id: prepared.intent.correlation_id,
    status: "accepted",
    receipt_id: "receipt_1",
  });

  assert.equal(advanced.stage, "travel");
  assert.equal(advanced.last_receipt_id, "receipt_1");
});

test("queues safe offline actions with device scope and preserves current stage", () => {
  const session = createGoFieldSession({ ...base, route_ready: true, equipment_ready: true, access_status: "confirmed" });
  const result = prepareGoTransition(session, "travel", { online: false, now: "2026-09-16T06:00:00Z" });

  assert.equal(result.status, "queued_offline");
  assert.equal(result.session.stage, "ready");
  assert.equal(result.queue_item.device_id, "device_go_01");
  assert.equal(result.queue_item.company_id, "demo_001");
  assert.equal(result.queue_item.base_projection_revision, "go-rev-4");
});

test("reconnect revalidation detects stale queued work before replay", () => {
  const session = createGoFieldSession({ ...base, route_ready: true, equipment_ready: true, access_status: "confirmed" });
  const queued = prepareGoTransition(session, "travel", { online: false, now: "2026-09-16T06:00:00Z" });

  const conflict = revalidateGoQueue([queued.queue_item], { company_id: "demo_001", actor_id: "worker_alex", device_id: "device_go_01", projection_revision: "go-rev-5" });
  assert.equal(conflict.ready.length, 0);
  assert.equal(conflict.conflicts[0].reason, "projection_changed");
});

test("completion requires every task and the required evidence", () => {
  const session = createGoFieldSession({ ...base, stage: "work", route_ready: true, equipment_ready: true, access_status: "confirmed", checklist: [true, true, false], evidence_count: 1, required_evidence_count: 2 });
  const result = prepareGoTransition(session, "complete", { online: true });

  assert.equal(result.status, "blocked");
  assert.deepEqual(result.blockers.map((item) => item.code), ["checklist_incomplete", "evidence_missing"]);
});

test("site issues prepare a dispatch escalation and critical signal", () => {
  const session = createGoFieldSession({ ...base, route_ready: true, equipment_ready: true, access_status: "confirmed" });
  const result = prepareGoIssue(session, { type: "access_problem", note: "Rear gate is locked", online: true, now: "2026-09-16T06:00:00Z" });

  assert.equal(result.status, "awaiting_receipt");
  assert.equal(result.intent.capability_id, "field.issue.report");
  assert.equal(result.signal.kind, "field_access_at_risk");
  assert.equal(result.signal.severity, "critical");
  assert.equal(result.signal.authority_neutral, true);
});
