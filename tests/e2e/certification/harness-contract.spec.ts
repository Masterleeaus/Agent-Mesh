import {
  test,
  expect,
  authenticateAs,
} from "../support/certification-fixtures";
import {
  CERTIFICATION_COMPANIES,
  CERTIFICATION_USERS,
  deterministicFixtureLabel,
} from "../support/certification-env";

test.describe("Certification harness contract", () => {
  test("seed identities are company-scoped and authority is explicit", async ({ page }) => {
    expect(CERTIFICATION_COMPANIES.primary.id).not.toBe(CERTIFICATION_COMPANIES.isolation.id);
    expect(CERTIFICATION_USERS.admin.companyId).toBe(CERTIFICATION_COMPANIES.primary.id);
    expect(CERTIFICATION_USERS.tech.companyId).toBe(CERTIFICATION_COMPANIES.primary.id);
    expect(CERTIFICATION_USERS.isolationOwner.companyId).toBe(CERTIFICATION_COMPANIES.isolation.id);

    const admin = await authenticateAs(page, "admin");
    expect(admin.companyId).toBe(CERTIFICATION_COMPANIES.primary.id);
    expect(admin.role).toBe("admin");
  });

  test("cross-company actor authenticates into the isolation company only", async ({ page }) => {
    const otherOwner = await authenticateAs(page, "isolationOwner");
    expect(otherOwner.companyId).toBe(CERTIFICATION_COMPANIES.isolation.id);
    expect(otherOwner.companyId).not.toBe(CERTIFICATION_COMPANIES.primary.id);
  });

  test("fixture labels are deterministic and company-sensitive", async ({ certification }, testInfo) => {
    const first = certification.label("customer", testInfo);
    const second = certification.label("customer", testInfo);
    const otherCompany = deterministicFixtureLabel(testInfo, "customer", CERTIFICATION_COMPANIES.isolation.id);

    expect(first).toBe(second);
    expect(first).not.toBe(otherCompany);
    expect(first).toContain(`e2e-${certification.runId}-customer-`);
  });
});
