import { describe, expect, it } from "vitest";
import { FINAL_REACHABILITY_MATRIX } from "../final-reachability-matrix";

const summary = FINAL_REACHABILITY_MATRIX.summary;

describe("final UI/runtime reachability matrix", () => {
  it("covers the complete current route graph", () => {
    expect(summary.pageRoutes).toBe(75);
    expect(summary.routeHandlers).toBe(227);
    expect(FINAL_REACHABILITY_MATRIX.pageMatrix).toHaveLength(75);
    expect(FINAL_REACHABILITY_MATRIX.routeHandlerMatrix).toHaveLength(227);
  });

  it("has no unresolved literal navigation targets or dead page paths", () => {
    expect(summary.unresolvedLiteralNavigationTargets).toBe(0);
    expect(summary.knownDeadPagePaths).toBe(0);
  });

  it("retains only the intentional compatibility route", () => {
    expect(summary.compatibilityRoutes).toBe(1);
    expect(FINAL_REACHABILITY_MATRIX.compatibilityRoutes).toEqual([
      expect.objectContaining({ from: "/app/my-day", to: "/app/my-work", retained: true }),
    ]);
  });

  it("keeps every declared native service surface reachable", () => {
    expect(summary.nativeServiceSurfacesReady).toBe(summary.nativeServiceSurfacesTotal);
    expect(summary.nativeServiceSurfacesTotal).toBe(9);
  });

  it("records the only proven dead runtime export removed in Pass 10", () => {
    expect(summary.deadRuntimeExportsRemoved).toEqual(["STANDALONE_ROUTE_ALIASES"]);
  });
});
