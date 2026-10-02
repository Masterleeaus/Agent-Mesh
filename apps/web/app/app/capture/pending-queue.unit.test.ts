import { describe, expect, it } from "vitest";
import { buildPendingStorageKey, normalizePendingCompanyId, savePending, listPending, removePending } from "./pending-queue";

describe("pending capture storage company scope", () => {
  it("requires company_id", () => {
    expect(() => normalizePendingCompanyId("")).toThrow(/company_id is required/i);
  });

  it("namespaces the same capture id by company", () => {
    expect(buildPendingStorageKey("company-a", "capture-1"))
      .not.toBe(buildPendingStorageKey("company-b", "capture-1"));
  });

  it("builds a stable encoded key", () => {
    expect(buildPendingStorageKey("company/a", "capture 1")).toBe("company%2Fa|capture%201");
  });
  it("isolates save, list and delete when two companies reuse a capture ID", async () => {
    await savePending({ id: "shared", company_id: "a", transcript: "A private note" });
    await savePending({ id: "shared", company_id: "b", transcript: "B private note" });
    expect(await listPending("a")).toEqual([{ id: "shared", company_id: "a", transcript: "A private note" }]);
    await removePending("a", "shared");
    expect(await listPending("a")).toEqual([]);
    expect(await listPending("b")).toEqual([{ id: "shared", company_id: "b", transcript: "B private note" }]);
    await removePending("b", "shared");
  });

  it("fails closed on every operation without company context", async () => {
    await expect(savePending({ id: "x", company_id: " " })).rejects.toThrow(/company_id/);
    await expect(listPending("")).rejects.toThrow(/company_id/);
    await expect(removePending("", "x")).rejects.toThrow(/company_id/);
  });

  it("cannot collide through encoded delimiters", () => {
    expect(buildPendingStorageKey("a|b", "c")).not.toBe(buildPendingStorageKey("a", "b|c"));
  });
});
