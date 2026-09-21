import { describe, expect, it } from "vitest";
import {
  BUSINESS_OPS_ACTIONS,
  buildBusinessOpsAuthoritySnapshot,
  canBusinessOpsAction,
} from "./business-ops-authority";

describe("business ops authority", () => {
  it("gives owners every declared action", () => {
    const snapshot = buildBusinessOpsAuthoritySnapshot("owner");
    expect(snapshot.allowedActions).toEqual([...BUSINESS_OPS_ACTIONS]);
  });

  it("does not let admins perform owner-only reversals/settings/deletes", () => {
    expect(canBusinessOpsAction("admin", "account.manage_settings")).toBe(false);
    expect(canBusinessOpsAction("admin", "period.reopen")).toBe(false);
    expect(canBusinessOpsAction("admin", "records.delete")).toBe(false);
    expect(canBusinessOpsAction("admin", "payments.record")).toBe(true);
  });

  it("keeps technicians on field-safe actions", () => {
    expect(canBusinessOpsAction("tech", "jobs.create")).toBe(true);
    expect(canBusinessOpsAction("tech", "visits.transition")).toBe(true);
    expect(canBusinessOpsAction("tech", "visits.update_checklist")).toBe(true);
    expect(canBusinessOpsAction("tech", "invoices.send")).toBe(false);
    expect(canBusinessOpsAction("tech", "jobs.view_all")).toBe(false);
  });
});
