import { describe, expect, it } from "vitest";
import {
  UI_RUNTIME_REACHABILITY_INVENTORY,
  getReachabilityRoute,
  getUnresolvedStaticNavigationTargets,
  summarizeReachabilityInventory,
} from "../reachability-inventory";

describe("UI runtime reachability inventory", () => {
  it("is pinned to the reconciled Merge62 Manager baseline", () => {
    expect(UI_RUNTIME_REACHABILITY_INVENTORY.generatedAgainst.managerMerge).toBe("62");
    expect(UI_RUNTIME_REACHABILITY_INVENTORY.generatedAgainst.sha256).toBe(
      "806ae84bee5c9b5911ef33c76581d222615abc4cb8fee1188aac60ade22603bb",
    );
  });

  it("inventories user pages, runtime handlers and boundary components", () => {
    const summary = summarizeReachabilityInventory();
    expect(summary.pageRoutes).toBe(75);
    expect(summary.routeHandlers).toBe(227);
    expect(summary.layouts).toBeGreaterThan(0);
    expect(summary.loadingBoundaries).toBe(20);
    expect(summary.errorBoundaries).toBe(1);
    expect(summary.staticNavigationTargets).toBeGreaterThan(20);
  });

  it("has no unresolved literal internal navigation targets in the scanned roots", () => {
    expect(getUnresolvedStaticNavigationTargets()).toEqual([]);
  });

  it("contains representative standalone destinations", () => {
    for (const route of [
      "/app",
      "/app/jobs",
      "/app/dispatch",
      "/app/invoices",
      "/app/settings",
      "/portal/login",
    ]) {
      expect(getReachabilityRoute(route), route).not.toBeNull();
    }
  });

  it("keeps inventory observational rather than executable", () => {
    const serialized = JSON.stringify(UI_RUNTIME_REACHABILITY_INVENTORY);
    expect(serialized).not.toContain("executionPermitted");
    expect(serialized).not.toContain("mutationCommand");
  });
});
