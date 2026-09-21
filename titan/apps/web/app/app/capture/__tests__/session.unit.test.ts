import { describe, expect, it } from "vitest";
import {
  allowlistedPostLoginNext,
  loginRedirectForPath,
  pathnameFromHeaders,
  requestTargetFromHeaders,
  resolvePostLoginHref,
} from "@/lib/auth/post-login-destination";

describe("Business Ops post-login allowlist", () => {
  it("honors safe internal /app destinations", () => {
    expect(allowlistedPostLoginNext("/app/capture")).toBe("/app/capture");
    expect(allowlistedPostLoginNext("/app/jobs/job-1?tab=visits")).toBe("/app/jobs/job-1?tab=visits");
    expect(allowlistedPostLoginNext("/app")).toBe("/app");
    expect(allowlistedPostLoginNext("https://evil.example/app/capture")).toBeNull();
    expect(allowlistedPostLoginNext("//evil.example")).toBeNull();
  });

  it("lands on the requested Business Ops destination after login", () => {
    expect(
      resolvePostLoginHref("owner", { isPhone: true, next: "/app/capture" }),
    ).toBe("/app/capture");
    expect(
      resolvePostLoginHref("admin", { next: "/app/jobs/job-1" }),
    ).toBe("/app/jobs/job-1");
  });

  it("sends unauthenticated Business Ops routes to login with an encoded next target", () => {
    expect(loginRedirectForPath("/app/capture")).toBe("/login?next=%2Fapp%2Fcapture");
    expect(loginRedirectForPath("/app")).toBe("/login?next=%2Fapp");
    expect(loginRedirectForPath("/portal/client")).toBe("/login");
  });

  it("reads path and query from middleware request headers", () => {
    const headers = new Headers({
      "x-pathname": "/app/invoices/inv-1",
      "x-request-target": "/app/invoices/inv-1?tab=payments",
    });
    expect(pathnameFromHeaders(headers)).toBe("/app/invoices/inv-1");
    expect(requestTargetFromHeaders(headers)).toBe("/app/invoices/inv-1?tab=payments");
  });
});
