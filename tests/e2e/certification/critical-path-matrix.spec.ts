import { test, expect } from "@playwright/test";
import matrix from "./critical-path-matrix.generated.json";

test.describe("E2E certification critical-path matrix", () => {
  test("matrix is company-scoped and authority-neutral", async () => {
    expect(matrix.company_boundary).toBe("company_id");
    expect(matrix.authority_invariant).toContain("never be treated as execution authority");
  });

  test("matrix covers the end-to-end business and workforce journey", async () => {
    const ids = new Set(matrix.stages.map((stage) => stage.id));
    for (const required of [
      "onboarding", "lead_intake", "customer_property", "quote_estimate", "booking",
      "schedule_dispatch", "job_visit", "invoice", "payment", "rebooking",
      "workforce_governance", "company_security",
    ]) expect(ids.has(required)).toBe(true);
  });

  test("all declared evidence files and routes exist unless the row is intentionally missing", async () => {
    for (const stage of matrix.stages) {
      for (const evidence of stage.surface_route_evidence) expect(evidence.exists, `${stage.id}: ${evidence.route}`).toBe(true);
      for (const evidence of stage.api_route_evidence) expect(evidence.exists, `${stage.id}: ${evidence.route}`).toBe(true);
      for (const evidence of stage.e2e_evidence) expect(evidence.exists, `${stage.id}: ${evidence.spec}`).toBe(true);
    }
  });

  test("gaps remain explicit instead of being silently certified", async () => {
    expect(matrix.coverage_summary.MISSING).toBeGreaterThan(0);
    expect(matrix.coverage_summary.PARTIAL).toBeGreaterThan(0);
  });
});
