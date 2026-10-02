import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("indexedDB", new IDBFactory());
});
afterEach(() => vi.unstubAllGlobals());

describe("pending capture durable company isolation", () => {
  it("preserves media across module restart and deletes only the selected company's item", async () => {
    const queue = await import("./pending-queue");
    await queue.savePending({ id: "same", company_id: "a", audio: new Blob(["private-a"]), transcript: "A" });
    await queue.savePending({ id: "same", company_id: "b", transcript: "B" });
    vi.resetModules();
    const restarted = await import("./pending-queue");
    const a = await restarted.listPending("a");
    expect(a).toHaveLength(1);
    expect(a[0].id).toBe("same");
    expect(await a[0].audio!.text()).toBe("private-a");
    expect((await restarted.listPending("b")).map(item => item.transcript)).toEqual(["B"]);
    await restarted.removePending("a", "same");
    vi.resetModules();
    const reloaded = await import("./pending-queue");
    expect(await reloaded.listPending("a")).toEqual([]);
    expect((await reloaded.listPending("b")).map(item => item.transcript)).toEqual(["B"]);
  });

  it("retains historical unscoped records without attributing or replaying them", async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("dovetails-promise-capture", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("pending", { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction("pending", "readwrite");
      tx.objectStore("pending").put({ id: "old", transcript: "Unknown owner" });
      tx.oncomplete = () => resolve();
    });
    const queue = await import("./pending-queue");
    expect(await queue.listPending("a")).toEqual([]);
    expect(await queue.listPending("b")).toEqual([]);
    const retained = await new Promise<unknown>((resolve) => {
      const request = db.transaction("pending").objectStore("pending").get("old");
      request.onsuccess = () => resolve(request.result);
    });
    expect(retained).toEqual({ id: "old", transcript: "Unknown owner" });
    db.close();
  });
});
