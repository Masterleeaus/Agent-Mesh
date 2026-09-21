import { describe, expect, it } from "vitest";
import { buildBusinessOpsBootstrap } from "./business-ops-bootstrap";

const base = {
  userId: "user-1",
  accountId: "account-1",
  accountName: "Titan Cleaning",
} as const;

describe("business ops bootstrap", () => {
  it("declares Business Ops usable without the extension", () => {
    const bootstrap = buildBusinessOpsBootstrap({ ...base, role: "owner" });
    expect(bootstrap.standalone).toBe(true);
    expect(bootstrap.extensionRequired).toBe(false);
    expect(bootstrap.session.accountId).toBe("account-1");
    expect(bootstrap.navigation.routes.invoices).toBe("/app/invoices");
  });

  it("uses the shared authority matrix instead of inventing shell permissions", () => {
    const bootstrap = buildBusinessOpsBootstrap({ ...base, role: "tech" });
    expect(bootstrap.authority.allowedActions).toContain("visits.transition");
    expect(bootstrap.authority.allowedActions).not.toContain("payments.record");
  });
});
