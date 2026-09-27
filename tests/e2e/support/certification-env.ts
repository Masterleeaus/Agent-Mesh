import { createHash } from "node:crypto";
import type { TestInfo } from "@playwright/test";

export const CERTIFICATION_COMPANIES = {
  primary: {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Demo Account",
  },
  isolation: {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Other Account",
  },
} as const;

export const CERTIFICATION_USERS = {
  owner: {
    email: "owner@test.com",
    password: "password",
    role: "owner",
    companyId: CERTIFICATION_COMPANIES.primary.id,
  },
  admin: {
    email: "admin@test.com",
    password: "password",
    role: "admin",
    companyId: CERTIFICATION_COMPANIES.primary.id,
  },
  tech: {
    email: "tech@test.com",
    password: "password",
    role: "tech",
    companyId: CERTIFICATION_COMPANIES.primary.id,
  },
  isolationOwner: {
    email: "owner-b@test.com",
    password: "password",
    role: "owner",
    companyId: CERTIFICATION_COMPANIES.isolation.id,
  },
} as const;

export type CertificationActor = keyof typeof CERTIFICATION_USERS;

export function certificationBaseUrl(): string {
  return process.env.TEST_BASE_URL ?? process.env.BASE_URL ?? "http://localhost:3000";
}

export function certificationRunId(): string {
  const raw = process.env.E2E_RUN_ID ?? "local";
  const sanitized = raw.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "local";
}

export function deterministicFixtureLabel(
  testInfo: Pick<TestInfo, "titlePath" | "project" | "retry">,
  subject: string,
  companyId = CERTIFICATION_COMPANIES.primary.id,
): string {
  const identity = [
    certificationRunId(),
    testInfo.project.name,
    String(testInfo.retry),
    ...testInfo.titlePath,
    companyId,
    subject,
  ].join("|");
  const suffix = createHash("sha256").update(identity).digest("hex").slice(0, 10);
  const cleanSubject = subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36);
  return `e2e-${certificationRunId()}-${cleanSubject}-${suffix}`;
}

export function assertCertificationSeedContract(): void {
  if (CERTIFICATION_COMPANIES.primary.id === CERTIFICATION_COMPANIES.isolation.id) {
    throw new Error("Certification seed contract requires two distinct companies");
  }
  for (const [actor, user] of Object.entries(CERTIFICATION_USERS)) {
    if (!user.email || !user.password || !user.companyId || !user.role) {
      throw new Error(`Certification seed contract incomplete for ${actor}`);
    }
  }
}
