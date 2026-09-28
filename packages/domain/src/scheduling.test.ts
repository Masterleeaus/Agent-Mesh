import { describe, expect, it } from "vitest";
import { planAssignment, planDispatchRecovery } from "./scheduling";

const context = { company_id: "a", actor_id: "manager", correlation_id: "c", idempotency_key: "i" };
const candidate = (worker_id: string, extra = {}) => ({ worker_id, company_id: "a", available: true, eligible: true, territory_match: true, required_skills: ["plumbing"], skills: ["plumbing"], active_assignment_count: 0, estimated_minutes: 30, ...extra });

describe("native scheduling contracts", () => {
  it("selects deterministic eligible capacity and preserves revision/idempotency", () => {
    expect(planAssignment(context, { company_id: "a", revision: 7 }, [candidate("b"), candidate("a")])).toMatchObject({ worker_id: "a", expected_revision: 7, idempotency_key: "i" });
  });
  it("rejects cross-company or skill-ineligible assignment", () => {
    expect(() => planAssignment(context, { company_id: "b", revision: 1 }, [candidate("x")])).toThrow("dispatch_company_mismatch");
    expect(() => planAssignment(context, { company_id: "a", revision: 1 }, [candidate("x", { skills: [] })])).toThrow("dispatch_no_eligible_worker");
  });
  it("recovers disruption by reassignment and escalates when capacity is absent", () => {
    expect(planDispatchRecovery(context, { company_id: "a", assigned_worker_id: "old" }, [candidate("new")])).toEqual({ kind: "REASSIGN", worker_id: "new", reason: "WORKER_UNAVAILABLE" });
        expect(planDispatchRecovery(context, { company_id: "a", assigned_worker_id: "old" }, [candidate("remote", { territory_match: false })])).toEqual({ kind: "REASSIGN", worker_id: "remote", reason: "TERRITORY_DISRUPTION" });
    expect(planDispatchRecovery(context, { company_id: "a", assigned_worker_id: "old" }, [])).toEqual({ kind: "ESCALATE", reason: "NO_ELIGIBLE_WORKER" });
  });
});

