import assert from "node:assert/strict";
import test from "node:test";

import {
  analyseGoSchedule,
  prepareScheduleRecovery,
} from "../app/titan/runtime/go-schedule-intelligence.mjs";

const schedule = {
  company_id: "demo_001",
  actor_id: "worker_alex",
  device_id: "go_device_01",
  projection_revision: "go-schedule-rev-5",
  now_minutes: 8 * 60 + 12,
  jobs: [
    { job_id: "job_2048", start_minutes: 9 * 60, duration_minutes: 90, travel_minutes: 12, access: "confirmed", supplies: "ready", parking: "known" },
    { job_id: "job_2091", start_minutes: 11 * 60 + 15, duration_minutes: 80, travel_minutes: 14, access: "confirmed", supplies: "missing_item", parking: "known" },
    { job_id: "job_2117", start_minutes: 14 * 60, duration_minutes: 150, travel_minutes: 24, access: "unconfirmed", supplies: "ready", parking: "limited" },
  ],
};

test("forecasts field risks before they damage the day", () => {
  const result = analyseGoSchedule(schedule);

  assert.equal(result.company_id, "demo_001");
  assert.equal(result.health, "at_risk");
  assert.equal(result.jobs[0].risk_level, "clear");
  assert.equal(result.jobs[1].risks[0].code, "supply_missing");
  assert.ok(result.jobs[2].risks.some(({ code }) => code === "access_unconfirmed"));
  assert.ok(result.jobs[2].risks.some(({ code }) => code === "parking_limited"));
  assert.equal(result.summary.jobs_needing_preparation, 2);
});

test("rejects legacy tenant aliases from schedule projections", () => {
  assert.throws(
    () => analyseGoSchedule({ ...schedule, tenant_company_id: "legacy" }),
    /tenant_company_id-not-authoritative/,
  );
});

test("prepares recovery through Command Bus without changing the schedule", () => {
  const analysis = analyseGoSchedule(schedule);
  const recovery = prepareScheduleRecovery(analysis, {
    job_id: "job_2117",
    action: "notify_dispatch",
    note: "Key pickup is not confirmed; verify before departure.",
    now: "2026-09-16T08:12:00.000Z",
  });

  assert.equal(recovery.status, "awaiting_receipt");
  assert.equal(recovery.intent.company_id, "demo_001");
  assert.equal(recovery.intent.capability_id, "schedule.recovery");
  assert.equal(recovery.intent.transport, "titan-command-bus");
  assert.equal(recovery.intent.execution_authorised, false);
  assert.equal(recovery.intent.requires_receipt, true);
  assert.equal(recovery.schedule_changed, false);
});

test("queues field recovery offline but never authorises replay", () => {
  const analysis = analyseGoSchedule(schedule);
  const recovery = prepareScheduleRecovery(analysis, {
    job_id: "job_2091",
    action: "prepare_customer_eta",
    note: "Arrival may shift by 10 minutes.",
    online: false,
    now: "2026-09-16T08:13:00.000Z",
  });

  assert.equal(recovery.status, "queued_offline");
  assert.equal(recovery.queue_item.replay_authorised, false);
  assert.equal(recovery.queue_item.requires_revalidation, true);
  assert.equal(recovery.schedule_changed, false);
});
