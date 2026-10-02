import { executionEvidenceToBusinessEvidence } from "./business-evidence-adapter.mjs";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Bridges ExecutionGateway lifecycle records into the company-scoped canonical
 * evidence store. Event IDs are stable across retries, so a failed second append
 * can be recovered by replaying the original gateway record.
 */
export function createBusinessEvidenceExecutionSink({ store, projection_version = "execution-reality.v1" } = {}) {
  if (!store || typeof store.append !== "function" || typeof store.get !== "function") {
    throw new Error("business-evidence-store-required");
  }

  async function appendIdempotently(entry) {
    const existing = await store.get(entry.company_id, entry.evidence_id);
    if (existing) {
      if (!same(existing, entry)) throw new Error("business-evidence-id-collision");
      return existing;
    }
    try {
      return await store.append(entry);
    } catch (error) {
      const raced = await store.get(entry.company_id, entry.evidence_id);
      if (raced && same(raced, entry)) return raced;
      throw error;
    }
  }

  return async function persistExecutionEvidence(source) {
    const execution = executionEvidenceToBusinessEvidence(source, { projection_version });
    await appendIdempotently(execution);

    // Only the gateway's independently verified outcome may change job reality.
    // The derived row is separate and stable-ID replay repairs a crash between
    // the execution receipt and job projection append.
    if (source.state === "VERIFIED" && source.work_id && String(source.capability ?? "").startsWith("job.")) {
      const observed = source.observed_result ?? {};
      const status = observed.status ?? observed.state ?? source.final_outcome;
      const fact = Object.freeze({
        ...execution,
        evidence_id: `${source.evidence_id}:job-reality`,
        event_type: "job.status.verified",
        subject_type: "job",
        subject_id: source.work_id,
        causation_id: source.evidence_id,
        verification_id: execution.verification_id,
        payload: Object.freeze({ status }),
      });
      await appendIdempotently(fact);
    }
  };
}
