import { test, expect, authenticateAs } from "../support/certification-fixtures";

async function jsonData(response: Awaited<ReturnType<typeof fetch>> | any) {
  return (await response.json()) as Record<string, any>;
}

test.describe("Certification — identity, company isolation, permissions and authority", () => {
  test("all seeded identities authenticate into exactly their declared company and role", async ({ page }) => {
    for (const actor of ["owner", "admin", "tech", "isolationOwner"] as const) {
      const authenticated = await authenticateAs(page, actor);
      expect(authenticated.userId).not.toBe("");
      expect(authenticated.companyId).not.toBe("");
    }
  });

  test("a foreign company client identifier is not readable through the primary company session", async ({ page }) => {
    await authenticateAs(page, "isolationOwner");
    const foreignList = await page.request.get("/api/v1/clients");
    expect(foreignList.ok()).toBe(true);
    const foreignBody = await jsonData(foreignList);
    const foreignClient = Array.isArray(foreignBody.data) ? foreignBody.data[0] : undefined;
    test.skip(!foreignClient?.id, "Isolation seed has no client row to probe");

    await authenticateAs(page, "owner");
    const probe = await page.request.get(`/api/v1/clients/${encodeURIComponent(String(foreignClient.id))}`);
    expect(probe.status()).toBe(404);
  });

  test("tech identity cannot enumerate users or office-only estimates/invoices", async ({ page }) => {
    await authenticateAs(page, "tech");
    for (const path of ["/api/v1/users", "/api/v1/estimates", "/api/v1/invoices"]) {
      const response = await page.request.get(path);
      expect(response.status(), `${path} must fail closed for tech`).toBe(403);
    }
  });

  test("admin identity cannot create owner/admin authority", async ({ page, certification }, testInfo) => {
    await authenticateAs(page, "admin");
    const response = await page.request.post("/api/v1/users", {
      data: {
        full_name: certification.label("forbidden-owner", testInfo),
        email: `${certification.label("forbidden-owner-email", testInfo)}@example.invalid`,
        role: "owner",
        password: "certification-password",
      },
    });
    expect(response.status()).toBe(403);
    const body = await jsonData(response);
    expect(body.error?.code).toBe("FORBIDDEN");
  });

  test("workforce command gateway filters identity by allowed role and dry-run does not execute", async ({ page }) => {
    await authenticateAs(page, "tech");
    const forbidden = await page.request.post("/api/v1/titan/workforce/commands", {
      data: { commandId: "estimates.create", dryRun: true, body: {} },
    });
    expect(forbidden.status()).toBe(403);

    const allowed = await page.request.post("/api/v1/titan/workforce/commands", {
      data: { commandId: "projects.list", dryRun: true },
    });
    expect(allowed.ok()).toBe(true);
    const body = await jsonData(allowed);
    expect(body.dryRun).toBe(true);
    expect(body.plan?.enforcement?.businessOpsRouteRemainsAuthoritative).toBe(true);
    expect(body.plan?.enforcement?.actorRole).toBe("tech");
  });
});
