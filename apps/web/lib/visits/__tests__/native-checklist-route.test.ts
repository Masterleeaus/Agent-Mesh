import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createIdentitySessionRegistry,
  type IdentitySessionRegistry,
} from "@titan-zero/titan-platform/security-boundary";
import {
  createSqliteStorage,
  initializeSqliteCompanyPlacementRegistry,
  provisionSqliteCompanyPlacement,
  type StorageClient,
} from "../../../../../packages/storage/src/index";
import { companyNativeCleaningJobsManifest, companyNativeVisitChecklistManifest } from "../../../../../packages/storage/src/company-native-schema-manifest";
import { CURRENT_WEB_SESSION_COOKIE_NAME } from "../../auth/current-session";
import { _resetWebSessionRuntimeForTests, getWebSessionRuntime } from "../../auth/web-session-runtime";
import { withVerifiedWebNativeCompanyStore } from "../../company-storage/request-runtime";
import { initializeCleaningProfileForLogin } from "../../company-storage/cleaning-profile-login";
import { expiredSessionLoginRedirectForPath, resolvePostLoginHref } from "../../auth/post-login-destination";
import { GET as getChecklist } from "@/app/api/v1/visits/[id]/checklist/route";
import { PATCH as patchChecklist } from "@/app/api/v1/visits/[id]/checklist/[itemId]/route";
import { POST as createCleaningJob } from "@/app/api/v1/cleaning/jobs/route";
import { GET as readCleaningServiceSetup, PUT as saveCleaningServiceSetup } from "@/app/api/v1/cleaning/service-setup/route";

const origin = "https://field.example.test";
const loginIssuer = `titan:web-login:${origin}`;
const companies = [
  { companyId: "cleaning-company-a", accountId: "legacy-account-a", actorId: "cleaner-actor-a", userId: "legacy-user-a", deviceId: "web-device-a", role: "owner" },
  { companyId: "cleaning-company-b", accountId: "legacy-account-b", actorId: "cleaner-actor-b", userId: "legacy-user-b", deviceId: "web-device-b", role: "tech" },
] as const;
const commonIds = {
  client: "20000000-0000-4000-8000-000000000001",
  property: "20000000-0000-4000-8000-000000000002",
  job: "20000000-0000-4000-8000-000000000003",
  workOrder: "20000000-0000-4000-8000-000000000004",
  visit: "20000000-0000-4000-8000-000000000005",
  task: "20000000-0000-4000-8000-000000000006",
  isolatedVisit: "20000000-0000-4000-8000-000000000007",
  isolatedTask: "20000000-0000-4000-8000-000000000008",
};
const companyBOnlyClientId = "20000000-0000-4000-8000-000000000009";
const companyBOnlyPropertyId = "20000000-0000-4000-8000-000000000010";

let directory: string;
let storeRoot: string;
let fileRoot: string;
let identityStorage: StorageClient;
let identityRegistry: IdentitySessionRegistry;
let oldEnvironment: Record<string, string | undefined>;
const envNames = [
  "TITAN_WEB_PUBLIC_ORIGIN", "TITAN_WEB_IDENTITY_REGISTRY_PATH", "TITAN_WEB_LOGIN_KEY_ID",
  "TITAN_WEB_LOGIN_SIGNING_SECRET", "TITAN_WEB_SESSION_KEY_ID", "TITAN_WEB_SESSION_SIGNING_SECRET",
  "TITAN_WEB_IDENTITY_BINDINGS_JSON", "TITAN_COMPANY_DATA_ROOT",
];

function request(path: string, credential: string, init?: RequestInit): NextRequest {
  const headers = new Headers(init?.headers);
  headers.set("cookie", `${CURRENT_WEB_SESSION_COOKIE_NAME}=${credential}`);
  headers.set("origin", origin);
  return new NextRequest(`${origin}${path}`, {
    ...init,
    headers,
  });
}

async function createReadyCompanyStore(company: (typeof companies)[number]): Promise<void> {
  const manifest = company === companies[0] ? companyNativeCleaningJobsManifest : companyNativeVisitChecklistManifest;
  const placement = await provisionSqliteCompanyPlacement({
    registry: { storage: identityStorage, storage_role: "GLOBAL_REGISTRY", companyStoreRoot: storeRoot, companyFileStoreRoot: fileRoot },
    company_id: company.companyId,
    company_name: company.companyId,
    schema_version: manifest.schema_version,
  });
  const placementId = placement.placement_id;
  const storage = createSqliteStorage(join(storeRoot, `${placementId}.sqlite`));
  try {
    const id = commonIds;
    await storage.query("INSERT INTO clients(id,company_id,name) VALUES($1,$2,$3)", [id.client, company.companyId, `${company.companyId} client`]);
    await storage.query("INSERT INTO properties(id,company_id,client_id,address) VALUES($1,$2,$3,$4)", [id.property, company.companyId, id.client, `${company.companyId} address`]);
    await storage.query("INSERT INTO jobs(id,company_id,client_id,property_id,title,created_by) VALUES($1,$2,$3,$4,$5,$6)", [id.job, company.companyId, id.client, id.property, `${company.companyId} cleaning job`, company.actorId]);
    await storage.query("INSERT INTO work_orders(id,company_id,job_id,client_id,title,created_by) VALUES($1,$2,$3,$4,$5,$6)", [id.workOrder, company.companyId, id.job, id.client, `${company.companyId} work order`, company.actorId]);
    await storage.query("INSERT INTO work_order_tasks(id,company_id,work_order_id,label,note) VALUES($1,$2,$3,$4,$5)", [id.task, company.companyId, id.workOrder, `${company.companyId} checklist task`, `work-order-${company.companyId}`]);
    await storage.query("INSERT INTO visits(id,company_id,job_id,assigned_user_id,scheduled_start,scheduled_end,work_order_id) VALUES($1,$2,$3,$4,$5,$6,$7)", [id.visit, company.companyId, id.job, company.actorId, "2026-10-03T10:00:00.000Z", "2026-10-03T11:00:00.000Z", id.workOrder]);
    await storage.query("INSERT INTO visit_tasks(company_id,visit_id,work_order_id,task_id,item_key,section,disposition,note) VALUES($1,$2,$3,$4,$5,$6,NULL,$7)", [company.companyId, id.visit, id.workOrder, id.task, "cleaning_surface_wipe", "Kitchen", `original-${company.companyId}`]);

    if (company === companies[0]) {
      await storage.query("UPDATE companies SET settings=$1 WHERE id=$2", [JSON.stringify({
        retained_setting: "keep-company-a",
        vertical_profile: {
          schema: "titan.company.vertical-profile.v1",
          company_id: company.companyId,
          revision: 4,
          profile: { pack_id: "existing-company-pack", pack_version: "2.0.0", module_id: "existing.vertical", module_version: "2.0.0" },
        },
      }), company.companyId]);
    } else {
      await storage.query("INSERT INTO clients(id,company_id,name) VALUES($1,$2,$3)", [companyBOnlyClientId, company.companyId, "B only client"]);
      await storage.query("INSERT INTO properties(id,company_id,client_id,address) VALUES($1,$2,$3,$4)", [companyBOnlyPropertyId, company.companyId, companyBOnlyClientId, "B only address"]);
    }

    if (company === companies[0]) {
      await storage.query("INSERT INTO visits(id,company_id,job_id,assigned_user_id,scheduled_start,scheduled_end,work_order_id) VALUES($1,$2,$3,$4,$5,$6,$7)", [id.isolatedVisit, company.companyId, id.job, company.actorId, "2026-10-03T12:00:00.000Z", "2026-10-03T13:00:00.000Z", id.workOrder]);
      await storage.query("INSERT INTO work_order_tasks(id,company_id,work_order_id,label) VALUES($1,$2,$3,$4)", [id.isolatedTask, company.companyId, id.workOrder, "A-only secret task"]);
      await storage.query("INSERT INTO visit_tasks(company_id,visit_id,work_order_id,task_id,item_key,section) VALUES($1,$2,$3,$4,$5,$6)", [company.companyId, id.isolatedVisit, id.workOrder, id.isolatedTask, "a_only", "Private"]);
    }
  } finally {
    await storage.close();
  }
}

beforeEach(async () => {
  _resetWebSessionRuntimeForTests();
  oldEnvironment = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
  directory = await mkdtemp(join(tmpdir(), "titan-native-checklist-route-"));
  storeRoot = join(directory, "companies");
  fileRoot = join(directory, "company-files");
  await mkdir(storeRoot, { mode: 0o700 });
  await mkdir(fileRoot, { mode: 0o700 });
  const registryPath = join(directory, "global-registry.sqlite");
  const bindings = companies.map(company => ({
    legacy_user_id: company.userId,
    legacy_account_id: company.accountId,
    company_id: company.companyId,
    actor_id: company.actorId,
    device_id: company.deviceId,
  }));
  Object.assign(process.env, {
    TITAN_WEB_PUBLIC_ORIGIN: origin,
    TITAN_WEB_IDENTITY_REGISTRY_PATH: registryPath,
    TITAN_WEB_LOGIN_KEY_ID: "web-login-test-key",
    TITAN_WEB_LOGIN_SIGNING_SECRET: randomBytes(32).toString("base64url"),
    TITAN_WEB_SESSION_KEY_ID: "web-session-test-key",
    TITAN_WEB_SESSION_SIGNING_SECRET: randomBytes(32).toString("base64url"),
    TITAN_WEB_IDENTITY_BINDINGS_JSON: JSON.stringify(bindings),
    TITAN_COMPANY_DATA_ROOT: storeRoot,
  });

  identityStorage = createSqliteStorage(registryPath);
  identityRegistry = await createIdentitySessionRegistry({ storage: identityStorage, storage_role: "GLOBAL_REGISTRY" });
  await initializeSqliteCompanyPlacementRegistry({ storage: identityStorage, storage_role: "GLOBAL_REGISTRY" });
  for (const company of companies) {
    await identityRegistry.putActor({ actor_id: company.actorId, status: "active" }, null);
    await identityRegistry.putCompany({ company_id: company.companyId, status: "active" }, null);
    await identityRegistry.putMembership({ actor_id: company.actorId, company_id: company.companyId, role: company.role, status: "active" }, null);
    await identityRegistry.putDevice({ device_id: company.deviceId, actor_id: company.actorId, status: "active" }, null);
    await identityRegistry.putExternalBinding({ binding_id: `web-login-${company.companyId}`, provider: loginIssuer, subject: company.userId, actor_id: company.actorId, company_id: company.companyId, status: "active" }, null);
  }
  await createReadyCompanyStore(companies[0]);
  await createReadyCompanyStore(companies[1]);
});

afterEach(async () => {
  await getWebSessionRuntime().then(runtime => runtime.close()).catch(() => undefined);
  _resetWebSessionRuntimeForTests();
  await identityStorage?.close();
  await rm(directory, { recursive: true, force: true });
  for (const name of envNames) {
    const previous = oldEnvironment[name];
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  }
  vi.useRealTimers();
});

describe("native visit checklist routes", () => {
  it("expires, returns through re-login, preserves company A profile, and opens fresh-v3 company B checklist", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const runtime = await getWebSessionRuntime();
    const initial = await runtime.issueForAuthenticatedWebUser(companies[0].userId, companies[0].accountId);
    const initialProfile = await initializeCleaningProfileForLogin({ issued: initial });
    expect(initialProfile).toMatchObject({
      status: "retained",
      revision: 4,
      profile: { pack_id: "existing-company-pack", module_id: "existing.vertical" },
    });

    const protectedPath = `/app/visits/${commonIds.visit}`;
    const expiryHref = expiredSessionLoginRedirectForPath(protectedPath);
    const expiryUrl = new URL(expiryHref, origin);
    expect(expiryUrl.pathname).toBe("/login");
    expect(expiryUrl.searchParams.get("reason")).toBe("session-expired");
    expect(resolvePostLoginHref("owner", { next: expiryUrl.searchParams.get("next") })).toBe(protectedPath);

    // Expire the signed five-minute session in this disposable test clock; the
    // request must reject it before a subsequent fresh password-backed issue.
    vi.setSystemTime(new Date(Date.parse(initial.context.expires_at) + 1_000));
    expect(Date.parse(initial.context.expires_at) - Date.now()).toBeLessThan(0);
    const expiredChecklist = await getChecklist(request(`/api/v1/visits/${commonIds.visit}/checklist`, initial.credential));
    expect(expiredChecklist.status).toBe(401);

    const reLogin = await runtime.issueForAuthenticatedWebUser(companies[0].userId, companies[0].accountId);
    const retainedAfterReLogin = await initializeCleaningProfileForLogin({ issued: reLogin });
    expect(retainedAfterReLogin).toMatchObject({ status: "retained", revision: 4, profile: { module_id: "existing.vertical" } });
    const companyASettings = await withVerifiedWebNativeCompanyStore({
      currentSession: reLogin,
      revalidateSession: () => runtime.resolveCredential(reLogin.credential),
      requiredSchemaVersions: [companyNativeVisitChecklistManifest.schema_version, companyNativeCleaningJobsManifest.schema_version],
      operation: async storage => (await storage.query<{ settings: string }>(
        "SELECT settings FROM companies WHERE id=$1", [companies[0].companyId],
      )).rows[0]?.settings,
    });
    expect(JSON.parse(companyASettings!)).toMatchObject({
      retained_setting: "keep-company-a",
      vertical_profile: { company_id: companies[0].companyId, revision: 4, profile: { module_id: "existing.vertical" } },
    });

    const companyBLogin = await runtime.issueForAuthenticatedWebUser(companies[1].userId, companies[1].accountId);
    const companyBProfile = await initializeCleaningProfileForLogin({ issued: companyBLogin });
    expect(companyBProfile).toMatchObject({ status: "selected", revision: 1, profile: { module_id: "titan.workforce.cleaning" } });

    const checklist = await getChecklist(request(`/api/v1/visits/${commonIds.visit}/checklist`, companyBLogin.credential));
    expect(checklist.status).toBe(200);
    expect((await checklist.json()).visit).toMatchObject({ company_id: companies[1].companyId, work_order_id: commonIds.workOrder });
  });

  it("uses the verified current session and each READY physical company store for list and update", async () => {
    const runtime = await getWebSessionRuntime();
    const a = await runtime.issueForAuthenticatedWebUser(companies[0].userId, companies[0].accountId);
    const b = await runtime.issueForAuthenticatedWebUser(companies[1].userId, companies[1].accountId);

    const justIssuedCompany = await withVerifiedWebNativeCompanyStore({
      currentSession: a,
      revalidateSession: () => runtime.resolveCredential(a.credential),
      requiredSchemaVersions: [companyNativeVisitChecklistManifest.schema_version, companyNativeCleaningJobsManifest.schema_version],
      operation: async storage => (await storage.query<{ id: string }>(
        "SELECT id FROM companies WHERE id=$1", [companies[0].companyId],
      )).rows[0]?.id,
    });
    expect(justIssuedCompany).toBe(companies[0].companyId);

    const aResponse = await getChecklist(request(`/api/v1/visits/${commonIds.visit}/checklist`, a.credential));
    expect(aResponse.status).toBe(200);
    const aBody = await aResponse.json();
    expect(aBody.visit).toMatchObject({ company_id: companies[0].companyId, property_id: commonIds.property, job_id: commonIds.job, work_order_id: commonIds.workOrder });
    expect(aBody.data).toHaveLength(1);
    expect(aBody.data[0]).toMatchObject({ company_id: companies[0].companyId, account_id: companies[0].companyId, label: `${companies[0].companyId} checklist task`, note: `original-${companies[0].companyId}`, disposition: null });

    const bResponse = await getChecklist(request(`/api/v1/visits/${commonIds.visit}/checklist`, b.credential));
    expect(bResponse.status).toBe(200);
    const bBody = await bResponse.json();
    expect(bBody.visit.company_id).toBe(companies[1].companyId);
    expect(bBody.data[0]).toMatchObject({ company_id: companies[1].companyId, label: `${companies[1].companyId} checklist task`, note: `original-${companies[1].companyId}`, disposition: null });

    const update = await patchChecklist(request(`/api/v1/visits/${commonIds.visit}/checklist/${commonIds.task}`, a.credential, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ disposition: "ok", note: "completed for A", company_id: companies[1].companyId }),
    }));
    expect(update.status).toBe(200);
    expect((await update.json()).data).toMatchObject({ company_id: companies[0].companyId, disposition: "ok", note: "completed for A" });

    const bAfterUpdate = await getChecklist(request(`/api/v1/visits/${commonIds.visit}/checklist`, b.credential));
    expect((await bAfterUpdate.json()).data[0]).toMatchObject({ disposition: null, note: `original-${companies[1].companyId}` });

    const crossCompany = await getChecklist(request(`/api/v1/visits/${commonIds.isolatedVisit}/checklist`, b.credential));
    expect(crossCompany.status).toBe(404);
  });

  it("creates a native Cleaning job/visit from saved setup, isolates companies, and keeps its price snapshot immutable", async () => {
    const runtime = await getWebSessionRuntime();
    const a = await runtime.issueForAuthenticatedWebUser(companies[0].userId, companies[0].accountId);
    const bPlacement = (await identityStorage.query<{ placement_id: string }>(
      "SELECT placement_id FROM titan_company_storage_placements WHERE company_id=$1", [companies[0].companyId],
    )).rows[0]?.placement_id;
    if (!bPlacement) throw new Error("company-a-placement-missing");
    const store = createSqliteStorage(join(storeRoot, `${bPlacement}.sqlite`));
    try {
      const companySettings = (await store.query<{ settings: string }>("SELECT settings FROM companies WHERE id=$1", [companies[0].companyId])).rows[0];
      const settings = JSON.parse(companySettings!.settings) as {
        vertical_profile: { profile: Record<string, string> };
        [key: string]: unknown;
      };
      settings.vertical_profile.profile = {
        pack_id: "titan.cleaning-workforce-pack", pack_version: "1.0.0",
        module_id: "titan.workforce.cleaning", module_version: "1.0.0",
      };
      await store.query("UPDATE companies SET settings=$1 WHERE id=$2", [JSON.stringify(settings), companies[0].companyId]);

      const configured = await saveCleaningServiceSetup(request("/api/v1/cleaning/service-setup", a.credential, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expected_revision: 0,
          selections: [{ service_id: "regular_clean", mode: "hourly", hourly_rate: 42.5, minimum_charge: 25, currency: "AUD" }],
          recurring: { enabled: true, supported_frequencies: ["weekly"], default_frequency: "weekly" },
        }),
      }));
      expect(configured.status).toBe(200);
      expect((await configured.json()).data.revision).toBe(1);
      const setupRead = await readCleaningServiceSetup(request("/api/v1/cleaning/service-setup", a.credential));
      expect((await setupRead.json()).data).toMatchObject({ revision: 1,
        selections: [{ service_id: "regular_clean", job_type_id: "domestic_recurring" }] });

      const created = await createCleaningJob(request("/api/v1/cleaning/jobs", a.credential, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          service_id: "regular_clean", expected_setup_revision: 1,
          client_id: commonIds.client, property_id: commonIds.property, title: "Saved setup job",
          scheduled_start: "2026-10-05T09:00:00.000Z", scheduled_end: "2026-10-05T11:00:00.000Z",
        }),
      }));
      expect(created.status).toBe(201);
      const createdData = (await created.json()).data;
      expect(createdData).toMatchObject({
        company_id: companies[0].companyId,
        service_id: "regular_clean",
        job_type_id: "domestic_recurring",
        service_setup_revision: 1,
        pricing_snapshot: { mode: "hourly", hourly_rate: 42.5, minimum_charge: 25, currency: "AUD" },
        recurrence_snapshot: { enabled: true, supported_frequencies: ["weekly"], default_frequency: "weekly" },
      });
      const persisted = (await store.query<{ company_id: string; service_id: string; job_type_id: string; service_setup_revision: number;
        service_pricing_snapshot: string; service_recurrence_snapshot: string }>(
        `SELECT company_id,service_id,job_type_id,service_setup_revision,service_pricing_snapshot,service_recurrence_snapshot
           FROM jobs WHERE id=$1`, [createdData.job_id],
      )).rows[0];
      expect(persisted).toMatchObject({ company_id: companies[0].companyId, service_id: "regular_clean",
        job_type_id: "domestic_recurring", service_setup_revision: 1 });
      expect(JSON.parse(persisted!.service_pricing_snapshot)).toEqual(createdData.pricing_snapshot);
      expect(JSON.parse(persisted!.service_recurrence_snapshot)).toEqual(createdData.recurrence_snapshot);
      expect((await store.query<{ company_id: string; job_id: string }>(
        "SELECT company_id,job_id FROM visits WHERE id=$1", [createdData.visit_id],
      )).rows[0]).toEqual({ company_id: companies[0].companyId, job_id: createdData.job_id });

      const jobTypeAsService = await createCleaningJob(request("/api/v1/cleaning/jobs", a.credential, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ service_id: "domestic_recurring", expected_setup_revision: 1,
          client_id: commonIds.client, title: "Retained type is not a service id",
          scheduled_start: "2026-10-05T11:00:00.000Z", scheduled_end: "2026-10-05T12:00:00.000Z" }),
      }));
      expect(jobTypeAsService.status).toBe(409);

      const bOnly = await createCleaningJob(request("/api/v1/cleaning/jobs", a.credential, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ service_id: "regular_clean", expected_setup_revision: 1,
          client_id: companyBOnlyClientId, property_id: companyBOnlyPropertyId, title: "Cross company attempt",
          scheduled_start: "2026-10-05T12:00:00.000Z", scheduled_end: "2026-10-05T13:00:00.000Z" }),
      }));
      expect(bOnly.status).toBe(404);

      const changedSetup = await saveCleaningServiceSetup(request("/api/v1/cleaning/service-setup", a.credential, {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ expected_revision: 1,
          selections: [{ service_id: "regular_clean", mode: "hourly", hourly_rate: 99, minimum_charge: 25, currency: "AUD" }],
          recurring: { enabled: true, supported_frequencies: ["weekly"], default_frequency: "weekly" } }),
      }));
      expect(changedSetup.status).toBe(200);
      expect((await changedSetup.json()).data.revision).toBe(2);
      const stale = await createCleaningJob(request("/api/v1/cleaning/jobs", a.credential, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ service_id: "regular_clean", expected_setup_revision: 1, client_id: commonIds.client,
          property_id: commonIds.property, title: "Stale revision attempt", scheduled_start: "2026-10-06T09:00:00.000Z",
          scheduled_end: "2026-10-06T11:00:00.000Z" }),
      }));
      expect(stale.status).toBe(409);
      await store.query("UPDATE companies SET settings=json_set(settings,'$.cleaning_service_setup.data.selections[0].job_type_id','deep_clean') WHERE id=$1", [companies[0].companyId]);
      const mismatchedMapping = await createCleaningJob(request("/api/v1/cleaning/jobs", a.credential, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ service_id: "regular_clean", expected_setup_revision: 2, client_id: commonIds.client,
          property_id: commonIds.property, title: "Forged retained type", scheduled_start: "2026-10-06T12:00:00.000Z",
          scheduled_end: "2026-10-06T13:00:00.000Z" }),
      }));
      expect(mismatchedMapping.status).toBe(409);
      await store.query("UPDATE companies SET settings=json_set(settings,'$.cleaning_service_setup.data.selections[0].job_type_id','domestic_recurring') WHERE id=$1", [companies[0].companyId]);
      const oldSnapshot = (await store.query<{ service_pricing_snapshot: string }>(
        "SELECT service_pricing_snapshot FROM jobs WHERE id=$1", [createdData.job_id],
      )).rows[0]?.service_pricing_snapshot;
      expect(JSON.parse(oldSnapshot!)).toMatchObject({ hourly_rate: 42.5 });
      await expect(store.query("UPDATE jobs SET service_pricing_snapshot=$1 WHERE id=$2", ["{}", createdData.job_id]))
        .rejects.toThrow(/cleaning-job-snapshot-immutable/);
      const changedSetupJob = await createCleaningJob(request("/api/v1/cleaning/jobs", a.credential, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ service_id: "regular_clean", expected_setup_revision: 2, client_id: commonIds.client,
          property_id: commonIds.property, title: "Updated rate job", scheduled_start: "2026-10-07T09:00:00.000Z",
          scheduled_end: "2026-10-07T11:00:00.000Z" }),
      }));
      expect(changedSetupJob.status).toBe(201);
      expect((await changedSetupJob.json()).data.pricing_snapshot.hourly_rate).toBe(99);
    } finally { await store.close(); }
  });

  it("denies revoked and missing credentials before opening checklist business state", async () => {
    const runtime = await getWebSessionRuntime();
    const a = await runtime.issueForAuthenticatedWebUser(companies[0].userId, companies[0].accountId);
    const missing = await getChecklist(new NextRequest(`${origin}/api/v1/visits/${commonIds.visit}/checklist`));
    expect(missing.status).toBe(401);

    await runtime.revokeCredential(a.credential);
    const revoked = await getChecklist(request(`/api/v1/visits/${commonIds.visit}/checklist`, a.credential));
    expect(revoked.status).toBe(401);
  });

  it("fails closed for a placement whose native manifest does not meet the checklist operation", async () => {
    const runtime = await getWebSessionRuntime();
    const a = await runtime.issueForAuthenticatedWebUser(companies[0].userId, companies[0].accountId);
    await identityStorage.query("UPDATE titan_company_storage_placements SET schema_version='company-native-work-orders-visits-v2' WHERE company_id=$1", [companies[0].companyId]);
    const response = await getChecklist(request(`/api/v1/visits/${commonIds.visit}/checklist`, a.credential));
    expect(response.status).toBe(503);
  });
});
