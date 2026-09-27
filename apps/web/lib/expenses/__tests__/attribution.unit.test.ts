import { describe, expect, it, vi } from "vitest";
import { resolveExpenseAttribution } from "../attribution";
describe("resolveExpenseAttribution", () => {
  it("inherits client and property from a tenant-scoped job", async () => {
    const query=vi.fn().mockResolvedValue({ rows:[{id:"j1",client_id:"c1",property_id:"p1"}] });
    await expect(resolveExpenseAttribution({query} as any,"a1",{jobId:"j1"}))
      .resolves.toEqual({job_id:"j1",client_id:"c1",property_id:"p1"});
  });
  it("rejects a conflicting client attribution", async () => {
    const query=vi.fn().mockResolvedValue({ rows:[{id:"j1",client_id:"c1",property_id:"p1"}] });
    await expect(resolveExpenseAttribution({query} as any,"a1",{jobId:"j1",clientId:"other"}))
      .rejects.toMatchObject({code:"ATTRIBUTION_MISMATCH"});
  });
});
