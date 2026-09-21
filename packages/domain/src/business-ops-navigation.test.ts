import { describe, expect, it } from "vitest";
import {
  buildBusinessOpsHref,
  sanitizeBusinessOpsTarget,
} from "./business-ops-navigation";

describe("buildBusinessOpsHref", () => {
  it("builds shared route destinations", () => {
    expect(buildBusinessOpsHref({ type: "route", route: "schedule" })).toBe("/app/schedule");
  });

  it("builds entity deep links and query parameters", () => {
    expect(
      buildBusinessOpsHref({
        type: "entity",
        entityType: "invoice",
        entityId: "inv-123",
        query: { attention: 1 },
      }),
    ).toBe("/app/invoices/inv-123?attention=1");
  });

  it("rejects path injection through entity ids", () => {
    expect(() =>
      buildBusinessOpsHref({ type: "entity", entityType: "job", entityId: "../settings" }),
    ).toThrow();
  });
});

describe("sanitizeBusinessOpsTarget", () => {
  it("keeps safe Business Ops paths and query strings", () => {
    expect(sanitizeBusinessOpsTarget("/app/invoices/inv-1?tab=payments")).toBe(
      "/app/invoices/inv-1?tab=payments",
    );
  });

  it("rejects absolute, protocol-relative, and non-app redirects", () => {
    expect(sanitizeBusinessOpsTarget("https://evil.example/app")).toBeNull();
    expect(sanitizeBusinessOpsTarget("//evil.example/app")).toBeNull();
    expect(sanitizeBusinessOpsTarget("/portal/client")).toBeNull();
  });
});
