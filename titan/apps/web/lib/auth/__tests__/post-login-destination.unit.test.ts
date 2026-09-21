import { describe, expect, it } from "vitest";
import {
  readWorkspaceModeCookie,
  resolvePostLoginHref,
} from "../post-login-destination";

describe("resolvePostLoginHref", () => {
  it("sends tech to My Work", () => {
    expect(resolvePostLoginHref("tech", { isPhone: false })).toBe("/app/my-work");
    expect(resolvePostLoginHref("tech", { isPhone: true })).toBe("/app/my-work");
  });

  it("sends admin to Overview", () => {
    expect(resolvePostLoginHref("admin", { isPhone: true })).toBe("/app");
  });

  it("sends desktop owner (auto) to Overview", () => {
    expect(resolvePostLoginHref("owner", { isPhone: false })).toBe("/app");
  });

  it("sends phone owner (auto) to My Work", () => {
    expect(resolvePostLoginHref("owner", { isPhone: true })).toBe("/app/my-work");
  });

  it("honors dv_ws_mode=field cookie for owner on desktop", () => {
    expect(
      resolvePostLoginHref("owner", {
        isPhone: false,
        cookieHeader: "other=1; dv_ws_mode=field",
      }),
    ).toBe("/app/my-work");
  });

  it("honors dv_ws_mode=office cookie for owner on phone", () => {
    expect(
      resolvePostLoginHref("owner", {
        isPhone: true,
        cookieHeader: "dv_ws_mode=office",
      }),
    ).toBe("/app");
  });
});

describe("readWorkspaceModeCookie", () => {
  it("returns null for missing or invalid values", () => {
    expect(readWorkspaceModeCookie(null)).toBeNull();
    expect(readWorkspaceModeCookie("foo=bar")).toBeNull();
    expect(readWorkspaceModeCookie("dv_ws_mode=auto")).toBeNull();
  });
});

describe("Business Ops post-login deep links", () => {
  it("preserves safe standalone app destinations", () => {
    expect(
      resolvePostLoginHref("owner", {
        isPhone: false,
        next: "/app/invoices/inv-123?tab=payments",
      }),
    ).toBe("/app/invoices/inv-123?tab=payments");
  });

  it("canonicalises retained standalone aliases after login", () => {
    expect(
      resolvePostLoginHref("owner", {
        isPhone: false,
        next: "/app/my-day?from=shortcut",
      }),
    ).toBe("/app/my-work?from=shortcut");
  });

  it("rejects dead /app paths instead of landing on a standalone 404", () => {
    expect(
      resolvePostLoginHref("owner", {
        isPhone: false,
        next: "/app/this-route-does-not-exist",
      }),
    ).toBe("/app");
  });

  it("rejects external and non-Business-Ops destinations", () => {
    expect(
      resolvePostLoginHref("owner", {
        isPhone: false,
        next: "https://evil.example/app",
      }),
    ).toBe("/app");
    expect(
      resolvePostLoginHref("owner", {
        isPhone: false,
        next: "/portal/client",
      }),
    ).toBe("/app");
  });
});
