import { describe, expect, it } from "vitest";
import {
  STANDALONE_NAVIGATION_SCHEMA,
  getStandalonePageTemplates,
  matchStandalonePageTemplate,
  resolveStandaloneNavigationTarget,
  standaloneNavigationHref,
} from "../standalone-navigation";

describe("standalone navigation", () => {
  it("recognises static and dynamic pages from the generated Merge55 inventory", () => {
    expect(matchStandalonePageTemplate("/app")).toBe("/app");
    expect(matchStandalonePageTemplate("/app/invoices")).toBe("/app/invoices");
    expect(matchStandalonePageTemplate("/app/invoices/inv-123")).toBe("/app/invoices/[id]");
    expect(matchStandalonePageTemplate("/app/jobs/job-1/visits/new")).toBe(
      "/app/jobs/[id]/visits/new",
    );
    expect(matchStandalonePageTemplate("/app/not-a-real-surface")).toBeNull();
  });

  it("prefers concrete routes over a dynamic sibling", () => {
    expect(matchStandalonePageTemplate("/app/estimates/new")).toBe("/app/estimates/new");
    expect(matchStandalonePageTemplate("/app/estimates/quick")).toBe("/app/estimates/quick");
  });

  it("preserves reachable dynamic deep links and query strings", () => {
    expect(standaloneNavigationHref("/app/invoices/inv-123?tab=payments&attention=1")).toBe(
      "/app/invoices/inv-123?tab=payments&attention=1",
    );
  });

  it("canonicalises the retained My Day compatibility alias", () => {
    expect(resolveStandaloneNavigationTarget("/app/my-day?from=legacy")).toEqual({
      schema: STANDALONE_NAVIGATION_SCHEMA,
      requestedTarget: "/app/my-day?from=legacy",
      href: "/app/my-work?from=legacy",
      pathname: "/app/my-work",
      routeTemplate: "/app/my-work",
      aliasApplied: true,
    });
  });

  it("fails closed for dead, external and non-app destinations", () => {
    expect(standaloneNavigationHref("/app/no-such-page")).toBeNull();
    expect(standaloneNavigationHref("https://evil.example/app/jobs")).toBeNull();
    expect(standaloneNavigationHref("//evil.example/app/jobs")).toBeNull();
    expect(standaloneNavigationHref("/portal/client")).toBeNull();
  });

  it("derives its app templates from the current reachability inventory", () => {
    const templates = getStandalonePageTemplates();
    expect(templates).toContain("/app/settings/system-health");
    expect(templates).toContain("/app/my-work/[workOrderId]");
    expect(templates.every((route) => route === "/app" || route.startsWith("/app/"))).toBe(true);
  });
});
