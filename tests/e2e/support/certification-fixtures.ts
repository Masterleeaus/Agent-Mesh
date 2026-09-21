import {
  test as base,
  expect,
  type APIResponse,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  CERTIFICATION_COMPANIES,
  CERTIFICATION_USERS,
  assertCertificationSeedContract,
  certificationBaseUrl,
  certificationRunId,
  deterministicFixtureLabel,
  type CertificationActor,
} from "./certification-env";

type AuthenticatedActor = {
  actor: CertificationActor;
  userId: string;
  email: string;
  role: string;
  companyId: string;
};

type CertificationContext = {
  runId: string;
  baseURL: string;
  primaryCompanyId: string;
  isolationCompanyId: string;
  label(subject: string, testInfo: TestInfo, companyId?: string): string;
};

type CertificationFixtures = {
  certification: CertificationContext;
};

export const test = base.extend<CertificationFixtures>({
  certification: async ({}, use) => {
    assertCertificationSeedContract();
    await use({
      runId: certificationRunId(),
      baseURL: certificationBaseUrl(),
      primaryCompanyId: CERTIFICATION_COMPANIES.primary.id,
      isolationCompanyId: CERTIFICATION_COMPANIES.isolation.id,
      label: (subject, testInfo, companyId) =>
        deterministicFixtureLabel(testInfo, subject, companyId ?? CERTIFICATION_COMPANIES.primary.id),
    });
  },
});

export { expect };

async function parseLoginResponse(response: APIResponse): Promise<Record<string, unknown>> {
  expect(response.ok(), `login failed with ${response.status()}`).toBe(true);
  return (await response.json()) as Record<string, unknown>;
}

export async function authenticateAs(page: Page, actor: CertificationActor): Promise<AuthenticatedActor> {
  const expected = CERTIFICATION_USERS[actor];
  const response = await page.request.post("/api/v1/auth/login", {
    data: { email: expected.email, password: expected.password },
  });
  const body = await parseLoginResponse(response);
  const user = body.user as Record<string, unknown> | undefined;

  expect(user, `${actor} login must return a user`).toBeTruthy();
  expect(user?.email).toBe(expected.email);
  expect(user?.role).toBe(expected.role);
  expect(user?.account_id).toBe(expected.companyId);

  return {
    actor,
    userId: String(user?.id ?? ""),
    email: String(user?.email ?? ""),
    role: String(user?.role ?? ""),
    companyId: String(user?.account_id ?? ""),
  };
}

export async function loginPrimaryAdmin(page: Page): Promise<AuthenticatedActor> {
  return authenticateAs(page, "admin");
}

export async function loginIsolationOwner(page: Page): Promise<AuthenticatedActor> {
  return authenticateAs(page, "isolationOwner");
}
