import test from "node:test";
import assert from "node:assert/strict";
import { ExecutionGateway, EXECUTION_CLASSES } from "./execution-gateway.mjs";
import { createBusinessEvidenceExecutionSink } from "./business-evidence-execution-sink.mjs";

function memoryStore({ failOnceFor } = {}) {
  const rows = new Map();
  let failed = false;
  return {
    rows,
    async get(company_id, evidence_id) { return rows.get(`${company_id}:${evidence_id}`) ?? null; },
    async append(entry) {
      if (entry.evidence_id === failOnceFor && !failed) { failed = true; throw new Error("simulated-append-interruption"); }
      const key = `${entry.company_id}:${entry.evidence_id}`;
      if (rows.has(key)) throw new Error("duplicate-primary-key");
      rows.set(key, structuredClone(entry));
      return rows.get(key);
    },
    async acceptedForSubject(company_id, subject_type, subject_id) {
      return [...rows.values()].filter(row => row.company_id === company_id && row.subject_type === subject_type && row.subject_id === subject_id);
    },
  };
}

const request = {
  execution_id: "exec-1", company_id: "company-a", actor_id: "actor-1", agent_id: "agent-1",
  authority_decision_id: "authority-1", decision_id: "decision-1", work_id: "job-1",
  capability: "job.complete", idempotency_key: "job-1-complete",
  authority: { status: "approved" }, risk: { status: "approved" },
};

test("ExecutionGateway routes ACK and verified outcomes into company-scoped canonical evidence", async () => {
  const store = memoryStore();
  const sink = createBusinessEvidenceExecutionSink({ store });
  const gateway = new ExecutionGateway({
    evidenceSink: sink,
    providers: [{
      id: "native-field-service", executionClass: EXECUTION_CLASSES.NATIVE, capabilities: ["job.complete"],
      execute: async () => ({ external_ref: "work-order-1", result: { status: "completed" } }),
      verify: async () => ({ verified: true, verification_id: "verify-1", method: "canonical-reread" }),
    }],
  });
  const result = await gateway.execute(request);
  const records = [...store.rows.values()];
  const ack = records.find(row => row.event_type === "execution.provider_acknowledged");
  const verified = records.find(row => row.event_type === "execution.verified");
  const jobFact = records.find(row => row.event_type === "job.status.verified");
  assert.equal(result.state, "VERIFIED");
  assert.equal(ack.verification_id, null);
  assert.equal(jobFact.payload.status, "completed");
  assert.equal(jobFact.verification_id, "verify-1");
  assert.equal(jobFact.company_id, "company-a");
  assert.equal(jobFact.execution_id, verified.execution_id);
  assert.equal(jobFact.actor_id, "actor-1");
  assert.equal(jobFact.agent_id, "agent-1");
  assert.equal(jobFact.correlation_id, "job-1");
  assert.equal(jobFact.causation_id, "decision-1");
  assert.equal(jobFact.decision_id, verified.decision_id);
  assert.equal(jobFact.authority_decision_id, "authority-1");
});

test("stable evidence identities repair a partial append and make sink replay idempotent", async () => {
  const source = {
    evidence_id: "event-1", execution_id: "exec-2", company_id: "company-a", work_id: "job-2",
    capability: "job.complete", provider: "native", execution_class: "native", state: "VERIFIED",
    finished_at: "2026-10-02T00:00:00Z", accepted_at: "2026-10-02T00:00:01Z",
    verification: { verified: true, verification_id: "verify-2" }, observed_result: { status: "completed" },
    final_outcome: "verified", idempotency_key: "idempotency-2", decision_id: "decision-2",
  };
  const store = memoryStore({ failOnceFor: "event-1:job-reality" });
  const sink = createBusinessEvidenceExecutionSink({ store });
  await assert.rejects(sink(source), /simulated-append-interruption/);
  assert.equal(store.rows.size, 1);
  await sink(source);
  await sink(source);
  assert.equal(store.rows.size, 2);
  assert.equal((await store.get("company-a", "event-1:job-reality")).payload.status, "completed");
});
