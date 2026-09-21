import { describe, expect, it } from "vitest";
import { resolveBusinessOpsCommand } from "./business-ops-commands";

describe("business ops commands", () => {
  it("maps action command ids to server-owned authority", () => {
    const resolved = resolveBusinessOpsCommand({ commandId: "payments.record", invoiceId: "inv-123" });
    expect(resolved.requiredAction).toBe("payments.record");
    expect(resolved.href).toBe("/app/invoices/inv-123?tab=payments&mode=record");
    expect(resolved.mode).toBe("action_handoff");
  });

  it("builds creation handoffs without duplicating navigation knowledge", () => {
    const resolved = resolveBusinessOpsCommand({ commandId: "jobs.create", clientId: "c-1", propertyId: "p-2" });
    expect(resolved.requiredAction).toBe("jobs.create");
    expect(resolved.href).toContain("/app/jobs?");
    expect(resolved.href).toContain("mode=create");
    expect(resolved.href).toContain("clientId=c-1");
    expect(resolved.href).toContain("propertyId=p-2");
  });

  it("rejects ids that could escape the canonical entity route", () => {
    expect(() => resolveBusinessOpsCommand({ commandId: "invoices.send", invoiceId: "../settings" })).toThrow();
  });
});
