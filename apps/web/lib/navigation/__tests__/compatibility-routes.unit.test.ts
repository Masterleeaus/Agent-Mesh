import { describe, expect, it } from "vitest";
import {
  STANDALONE_COMPATIBILITY_ROUTES,
  canonicalStandalonePathname,
  standaloneCompatibilityTarget,
} from "../compatibility-routes";

describe("standalone compatibility routes", () => {
  it("keeps compatibility aliases unique and canonical", () => {
    const sources = STANDALONE_COMPATIBILITY_ROUTES.map((entry) => entry.from);
    expect(new Set(sources).size).toBe(sources.length);
    for (const entry of STANDALONE_COMPATIBILITY_ROUTES) {
      expect(entry.from).not.toBe(entry.to);
      expect(entry.from.startsWith("/app/")).toBe(true);
      expect(entry.to === "/app" || entry.to.startsWith("/app/")).toBe(true);
    }
  });

  it("resolves the retained My Day entry point to My Work", () => {
    expect(canonicalStandalonePathname("/app/my-day")).toBe("/app/my-work");
    expect(standaloneCompatibilityTarget("/app/my-day")).toBe("/app/my-work");
    expect(standaloneCompatibilityTarget("/app/jobs")).toBeNull();
  });
});
