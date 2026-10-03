import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { request as httpsRequest } from "node:https";
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { randomBytes } from "node:crypto";
import Database from "better-sqlite3";
import { hash } from "bcryptjs";
import { chromium, expect as expectPage, request as playwrightRequest, type Browser } from "@playwright/test";
import { afterEach, describe, expect, it } from "vitest";
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
import {
  companyNativeCleaningJobsManifest,
  companyNativeWorkOrdersVisitsManifest,
} from "../../../../../packages/storage/src/company-native-schema-manifest";

let origin: string;
let issuer: string;
const companyA = "browser-company-existing";
const companyB = "browser-company-new";
const companyC = "browser-company-cleaning-two";
const actorId = "browser-cleaner-actor";
const deviceId = "browser-web-device";
const userA = { id: "browser-user-existing", email: "existing@example.test", password: "password-browser-a", account: companyA };
const userB = { id: "browser-user-new", email: "new-cleaner@example.test", password: "password-browser-b", account: companyB };
const userC = { id: "browser-user-cleaning-two", email: "cleaning-two@example.test", password: "password-browser-c", account: companyC };
const ids = {
  client: "40000000-0000-4000-8000-000000000001",
  property: "40000000-0000-4000-8000-000000000002",
  job: "40000000-0000-4000-8000-000000000003",
  workOrder: "40000000-0000-4000-8000-000000000004",
  visit: "40000000-0000-4000-8000-000000000005",
  task: "40000000-0000-4000-8000-000000000006",
};

let browser: Browser | undefined;
let nextServer: ChildProcess | undefined;
let fixtureDirectory: string | undefined;
let registryStorage: StorageClient | undefined;
let webRoot: string;
let repoRoot: string;
const placementIds = new Map<string, string>();

async function unusedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolveListen());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("test-port-allocation-failed");
  const port = address.port;
  await new Promise<void>((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
  return port;
}

async function prepareLegacyDatabase(databasePath: string): Promise<void> {
  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations(filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
  const files = (await readdir(join(repoRoot, "db/sqlite"))).filter(name => name.endsWith(".sql")).sort();
  for (const filename of files) {
    if (db.prepare("SELECT 1 FROM schema_migrations WHERE filename=?").get(filename)) continue;
    const sql = await readFile(join(repoRoot, "db/sqlite", filename), "utf8");
    db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations(filename) VALUES(?)").run(filename);
    })();
  }
  const addCompany = db.prepare("INSERT INTO companies(id,name) VALUES(?,?)");
  addCompany.run(companyA, "Existing Profile Company");
  addCompany.run(companyB, "New Cleaning Company");
  addCompany.run(companyC, "Second Cleaning Company");
  const addUser = db.prepare(`INSERT INTO users(id,company_id,email,full_name,password_hash,role)
    VALUES(?,?,?,?,?, 'owner')`);
  addUser.run(userA.id, companyA, userA.email, "Existing Profile Owner", await hash(userA.password, 4));
  addUser.run(userB.id, companyB, userB.email, "New Cleaning Owner", await hash(userB.password, 4));
  addUser.run(userC.id, companyC, userC.email, "Second Cleaning Owner", await hash(userC.password, 4));
  db.close();
}

async function provisionCompanies(input: {
  identityPath: string;
  storeRoot: string;
  fileRoot: string;
}): Promise<void> {
  registryStorage = createSqliteStorage(input.identityPath);
  const identity: IdentitySessionRegistry = await createIdentitySessionRegistry({
    storage: registryStorage,
    storage_role: "GLOBAL_REGISTRY",
  });
  await initializeSqliteCompanyPlacementRegistry({ storage: registryStorage, storage_role: "GLOBAL_REGISTRY" });
  await identity.putActor({ actor_id: actorId, status: "active" }, null);
  await identity.putDevice({ device_id: deviceId, actor_id: actorId, status: "active" }, null);

  for (const company of [
    { id: companyA, user: userA },
    { id: companyB, user: userB },
    { id: companyC, user: userC },
  ]) {
    await identity.putCompany({ company_id: company.id, status: "active" }, null);
    await identity.putMembership({ actor_id: actorId, company_id: company.id, role: "owner", status: "active" }, null);
    await identity.putExternalBinding({
      binding_id: `browser-login-${company.id}`,
      provider: issuer,
      subject: userA.id,
      actor_id: actorId,
      company_id: company.id,
      status: "active",
    }, null);
  }

  for (const companyId of [companyA, companyB, companyC]) {
    const placement = await provisionSqliteCompanyPlacement({
      registry: {
        storage: registryStorage,
        storage_role: "GLOBAL_REGISTRY",
        companyStoreRoot: input.storeRoot,
        companyFileStoreRoot: input.fileRoot,
      },
      company_id: companyId,
      company_name: companyId,
      schema_version: companyId === companyB || companyId === companyC
        ? companyNativeCleaningJobsManifest.schema_version
        : companyNativeWorkOrdersVisitsManifest.schema_version,
    });
    placementIds.set(companyId, placement.placement_id);
    const store = createSqliteStorage(join(input.storeRoot, `${placement.placement_id}.sqlite`));
    if (companyId === companyA) {
      await store.query("UPDATE companies SET settings=$1 WHERE id=$2", [JSON.stringify({
        retained_setting: "leave-me-alone",
        vertical_profile: {
          schema: "titan.company.vertical-profile.v1",
          company_id: companyA,
          revision: 6,
          profile: {
            pack_id: "saved-company-pack",
            pack_version: "2.0.0",
            module_id: "saved.vertical",
            module_version: "2.0.0",
          },
        },
      }), companyA]);
    } else if (companyId === companyB) {
      await store.query("INSERT INTO clients(id,company_id,name) VALUES($1,$2,$3)", [ids.client, companyB, "New Cleaning Client"]);
      await store.query("INSERT INTO properties(id,company_id,client_id,address) VALUES($1,$2,$3,$4)", [ids.property, companyB, ids.client, "8 Cleaning Lane"]);
      await store.query("UPDATE companies SET settings=$1 WHERE id=$2", [JSON.stringify({ vertical_profile: {
        schema: "titan.company.vertical-profile.v1", company_id: companyB, revision: 1,
        profile: { pack_id: "cleaning-workforce", pack_version: "1.0.0", module_id: "titan.workforce.cleaning", module_version: "1.0.0" },
      } }), companyB]);
      await store.query("INSERT INTO jobs(id,company_id,client_id,property_id,title,created_by) VALUES($1,$2,$3,$4,$5,$6)", [ids.job, companyB, ids.client, ids.property, "Cleaning turnover", actorId]);
      await store.query("INSERT INTO work_orders(id,company_id,job_id,client_id,title,created_by) VALUES($1,$2,$3,$4,$5,$6)", [ids.workOrder, companyB, ids.job, ids.client, "Cleaning turnover work", actorId]);
      await store.query("INSERT INTO work_order_tasks(id,company_id,work_order_id,label) VALUES($1,$2,$3,$4)", [ids.task, companyB, ids.workOrder, "Wipe kitchen surfaces"]);
      await store.query("INSERT INTO visits(id,company_id,job_id,assigned_user_id,scheduled_start,scheduled_end,work_order_id) VALUES($1,$2,$3,$4,$5,$6,$7)", [ids.visit, companyB, ids.job, actorId, "2026-10-03T10:00:00.000Z", "2026-10-03T11:00:00.000Z", ids.workOrder]);
      await store.query("INSERT INTO visit_tasks(company_id,visit_id,work_order_id,task_id,item_key,section) VALUES($1,$2,$3,$4,$5,$6)", [companyB, ids.visit, ids.workOrder, ids.task, "cleaning_surface_wipe", "Kitchen"]);
    } else {
      await store.query("INSERT INTO clients(id,company_id,name) VALUES($1,$2,$3)", [ids.client, companyC, "Second Cleaning Client"]);
      await store.query("INSERT INTO properties(id,company_id,client_id,address) VALUES($1,$2,$3,$4)", [ids.property, companyC, ids.client, "10 Cleaning Lane"]);
      await store.query("UPDATE companies SET settings=$1 WHERE id=$2", [JSON.stringify({ vertical_profile: {
        schema: "titan.company.vertical-profile.v1", company_id: companyC, revision: 1,
        profile: { pack_id: "cleaning-workforce", pack_version: "1.0.0", module_id: "titan.workforce.cleaning", module_version: "1.0.0" },
      } }), companyC]);
    }
    await store.close();
  }
  await registryStorage.close();
  registryStorage = undefined;
}

async function waitForServer(baseUrl: string, timeoutMs: number): Promise<void> {
  const end = Date.now() + timeoutMs;
  let lastError = "not-started";
  while (Date.now() < end) {
    if (nextServer?.exitCode !== null && nextServer?.exitCode !== undefined) {
      throw new Error(`next-dev-exited:${nextServer.exitCode}`);
    }
    try {
      const status = await new Promise<number>((resolveRequest, reject) => {
        const request = httpsRequest(`${baseUrl}/login`, { rejectUnauthorized: false }, response => {
          response.resume();
          resolveRequest(response.statusCode ?? 0);
        });
        request.once("error", reject);
        request.end();
      });
      if (status >= 200 && status < 400) return;
      lastError = `http-${status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await delay(250);
  }
  throw new Error(`next-dev-not-ready:${lastError}`);
}

afterEach(async () => {
  await browser?.close().catch(() => undefined);
  browser = undefined;
  if (nextServer && nextServer.exitCode === null) {
    nextServer.kill("SIGTERM");
    await Promise.race([
      new Promise<void>(resolveExit => nextServer?.once("exit", () => resolveExit())),
      delay(5_000),
    ]);
    if (nextServer.exitCode === null) nextServer.kill("SIGKILL");
  }
  nextServer = undefined;
  await registryStorage?.close().catch(() => undefined);
  registryStorage = undefined;
  if (fixtureDirectory) await rm(fixtureDirectory, { recursive: true, force: true });
  fixtureDirectory = undefined;
});

describe("Cleaning first-run browser journey", () => {
  it("logs in, expires in-browser, returns through re-login, and opens the new company's Cleaning home and checklist", async () => {
    webRoot = process.cwd();
    repoRoot = resolve(webRoot, "../..");
    fixtureDirectory = await mkdtemp(join(tmpdir(), "titan-cleaning-browser-"));
    const port = await unusedPort();
    const baseUrl = `https://localhost:${port}`;
    origin = baseUrl;
    issuer = `titan:web-login:${origin}`;
    const appDatabase = join(fixtureDirectory, "legacy-app.sqlite");
    const identityPath = join(fixtureDirectory, "global-registry.sqlite");
    const storeRoot = join(fixtureDirectory, "company-stores");
    const fileRoot = join(fixtureDirectory, "company-files");
    const tlsKey = join(fixtureDirectory, "localhost-key.pem");
    const tlsCert = join(fixtureDirectory, "localhost-cert.pem");
    await mkdir(storeRoot, { mode: 0o700 });
    await mkdir(fileRoot, { mode: 0o700 });
    execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", tlsKey,
      "-out", tlsCert, "-days", "1", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1"], { stdio: "ignore" });
    await prepareLegacyDatabase(appDatabase);
    await provisionCompanies({ identityPath, storeRoot, fileRoot });

    const runtimeEnvironment = {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(port),
      DATABASE_URL: `file:${appDatabase}`,
      DATABASE_DIALECT: "sqlite",
      TITAN_DEPLOYMENT_PROFILE: "test",
      AUTH_SECRET: "browser-test-auth-secret-long-enough-0001",
      TITAN_WEB_PUBLIC_ORIGIN: origin,
      TITAN_WEB_IDENTITY_REGISTRY_PATH: identityPath,
      TITAN_WEB_LOGIN_KEY_ID: "browser-login-key",
      TITAN_WEB_LOGIN_SIGNING_SECRET: randomBytes(32).toString("base64url"),
      TITAN_WEB_SESSION_KEY_ID: "browser-session-key",
      TITAN_WEB_SESSION_SIGNING_SECRET: randomBytes(32).toString("base64url"),
      TITAN_WEB_IDENTITY_BINDINGS_JSON: JSON.stringify([
        { legacy_user_id: userA.id, legacy_account_id: userA.account, company_id: companyA, actor_id: actorId, device_id: deviceId },
        { legacy_user_id: userA.id, legacy_account_id: userB.account, company_id: companyB, actor_id: actorId, device_id: deviceId },
        { legacy_user_id: userA.id, legacy_account_id: userC.account, company_id: companyC, actor_id: actorId, device_id: deviceId },
      ]),
      TITAN_COMPANY_DATA_ROOT: storeRoot,
      E2E_DISABLE_LOGIN_RATE_LIMIT: "1",
      NEXT_TELEMETRY_DISABLED: "1",
    };
    nextServer = spawn(process.execPath, [
      resolve(webRoot, "node_modules/next/dist/bin/next"),
      "dev", "--experimental-https", "--experimental-https-key", tlsKey,
      "--experimental-https-cert", tlsCert, "--hostname", "0.0.0.0", "--port", String(port),
    ], { cwd: webRoot, env: runtimeEnvironment, stdio: ["ignore", "pipe", "pipe"] });
    let serverOutput = "";
    nextServer.stdout?.on("data", chunk => { serverOutput = `${serverOutput}${chunk}`.slice(-8_000); });
    nextServer.stderr?.on("data", chunk => { serverOutput = `${serverOutput}${chunk}`.slice(-8_000); });
    try {
      await waitForServer(baseUrl, 90_000);
    } catch (error) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}\n${serverOutput}`);
    }

    const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"], ...(systemChromium ? { executablePath: systemChromium } : {}) });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    page.on("pageerror", error => { serverOutput = `${serverOutput}\nPAGEERROR: ${error.message}`.slice(-8_000); });
    page.on("console", message => { if (message.type() === "error") serverOutput = `${serverOutput}\nCONSOLE: ${message.text()}`.slice(-8_000); });
    // Existing non-Cleaning profile stays selected through the real password route.
    await page.goto(`${baseUrl}/login`);
    await page.getByLabel("Email").fill(userA.email);
    await page.getByLabel("Password").fill(userA.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(url => url.pathname === "/app", { timeout: 45_000 });
    const existingCookie = (await context.cookies()).find(cookie => cookie.name === "__Host-titan-web-session");
    expect(existingCookie).toMatchObject({ secure: true, httpOnly: true, sameSite: "Lax", path: "/" });
    const aPlacementId = placementIds.get(companyA);
    if (!aPlacementId) throw new Error("company-a-placement-missing");
    await expectPage(page.getByRole("heading", { name: "Cleaning workspace" })).toHaveCount(0);
    const aStore = createSqliteStorage(join(storeRoot, `${aPlacementId}.sqlite`));
    try {
      const settings = JSON.parse((await aStore.query<{ settings: string }>("SELECT settings FROM companies WHERE id=$1", [companyA])).rows[0]!.settings);
      expect(settings).toMatchObject({ retained_setting: "leave-me-alone", vertical_profile: { revision: 6, profile: { module_id: "saved.vertical" } } });
    } finally { await aStore.close(); }
    expect((await context.request.get(`${baseUrl}/api/v1/visits/${ids.visit}/checklist`)).status()).toBe(503);

    // Company choices are memberships attached to one stable external identity.
    expect(await page.getByLabel("Company").count()).toBe(1);
    await page.getByLabel("Company").selectOption(companyB);
    await expectPage(page.getByRole("heading", { name: "Cleaning workspace" })).toBeVisible({ timeout: 30_000 });

    await context.clearCookies();
    await page.addInitScript(() => {
      const nativeSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = ((callback: TimerHandler, timeout?: number, ...args: unknown[]) => {
        let selectedDelay = timeout;
        if (typeof selectedDelay === "number" && selectedDelay >= 280_000 && selectedDelay <= 300_000
          && sessionStorage.getItem("titan-expiry-timer-ready") === "1"
          && !sessionStorage.getItem("titan-expiry-timer-fired")) {
          sessionStorage.setItem("titan-expiry-timer-fired", "1");
          selectedDelay = 15_000;
        }
        return nativeSetTimeout(callback, selectedDelay, ...args);
      }) as typeof window.setTimeout;
    });
    await page.goto(`${baseUrl}/login`);
    await page.getByLabel("Email").fill(userA.email);
    await page.getByLabel("Password").fill(userA.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(url => url.pathname === "/app", { timeout: 45_000 });
    await page.getByLabel("Company").selectOption(companyB);
    await expectPage(page.getByRole("heading", { name: "Cleaning workspace" })).toBeVisible({ timeout: 30_000 });
    const setupApiResponse = await context.request.get(`${baseUrl}/api/v1/cleaning/service-setup`);
    if (!setupApiResponse.ok()) throw new Error(`Cleaning setup GET ${setupApiResponse.status()}: ${await setupApiResponse.text()}\n${serverOutput}`);
    await expectPage(page.getByTestId("cleaning-service-config-boundary")).toContainText("company-provided prices are configured separately");

    const bCookie = (await context.cookies()).find(cookie => cookie.name === "__Host-titan-web-session");
    expect(bCookie).toBeTruthy();
    expect(bCookie!.expires).toBeGreaterThan(Date.now() / 1000);
    expect(bCookie!.expires).toBeLessThanOrEqual(Date.now() / 1000 + 300);

    await page.evaluate(() => sessionStorage.setItem("titan-expiry-timer-ready", "1"));
    await page.reload();
    await expectPage(page.getByRole("heading", { name: "Cleaning workspace" })).toBeVisible({ timeout: 30_000 });
    await page.waitForURL(url => url.pathname === "/login" && url.searchParams.get("reason") === "session-expired", { timeout: 25_000 });
    const loginUrl = new URL(page.url());
    expect(loginUrl.searchParams.get("next")).toBe("/app");
    await expectPage(page.getByRole("status")).toContainText("Your secure sign-in expired");
    await page.getByLabel("Email").fill(userA.email);
    await page.getByLabel("Password").fill(userA.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(url => url.pathname === "/app", { timeout: 45_000 });
    await page.getByLabel("Company").selectOption(companyB);
    await expectPage(page.getByRole("heading", { name: "Cleaning workspace" })).toBeVisible({ timeout: 30_000 });

    // Configure through the actual company-scoped browser form after the
    // expiry journey, then reload to prove saved rate and recurrence restore.
    await expectPage(page.getByLabel("Regular clean", { exact: false }).first()).toBeVisible({ timeout: 20_000 });
    await page.getByLabel("Regular clean", { exact: false }).first().check();
    await page.getByLabel("Regular clean hourly rate").fill("42.50");
    await page.getByLabel("End-of-lease / bond clean", { exact: false }).check();
    await expectPage(page.getByText("Quote required.", { exact: true })).toBeVisible();
    await expectPage(page.getByLabel("End-of-lease / bond clean fixed price")).toHaveCount(0);
    await page.getByLabel("Enable recurring configuration").check();
    await page.getByRole("checkbox", { name: "Weekly" }).check();
    await page.getByLabel("Default frequency").selectOption("weekly");
    await page.getByRole("button", { name: "Save service setup" }).click();
    await expectPage(page.getByRole("status").filter({ hasText: "Cleaning service setup saved" })).toBeVisible();
    const staleSave = await context.request.put(`${baseUrl}/api/v1/cleaning/service-setup`, {
      data: {
        expected_revision: 0,
        selections: [{ service_id: "regular_clean", mode: "hourly", hourly_rate: 999 }],
        recurring: { enabled: false, supported_frequencies: [], default_frequency: null },
      },
    });
    expect(staleSave.status()).toBe(409);
    await page.getByRole("button", { name: "Reload saved setup" }).click();
    await expectPage(page.getByLabel("Regular clean hourly rate")).toHaveValue("42.5");
    await expectPage(page.getByLabel("Enable recurring configuration")).toBeChecked();
    await expectPage(page.getByRole("checkbox", { name: "Weekly" })).toBeChecked();
    await expectPage(page.getByLabel("Default frequency")).toHaveValue("weekly");
    await expectPage(page.getByTestId("cleaning-service-config-boundary")).toContainText("company-provided prices are configured separately");

    const checklistResponse = await context.request.get(`${baseUrl}/api/v1/visits/${ids.visit}/checklist`);
    expect(checklistResponse.status()).toBe(200);
    expect((await checklistResponse.json()).visit).toMatchObject({ company_id: companyB, work_order_id: ids.workOrder });

    const bPlacementId = placementIds.get(companyB);
    if (!bPlacementId) throw new Error("company-b-placement-missing");
    const bStore = createSqliteStorage(join(storeRoot, `${bPlacementId}.sqlite`));
    try {
      const settings = JSON.parse((await bStore.query<{ settings: string }>("SELECT settings FROM companies WHERE id=$1", [companyB])).rows[0]!.settings);
      expect(settings.vertical_profile).toMatchObject({ company_id: companyB, revision: 1, profile: { module_id: "titan.workforce.cleaning" } });
      expect(settings.cleaning_service_setup).toMatchObject({ company_id: companyB, revision: 1, data: {
        selections: [
          { job_type_id: "domestic_recurring", pricing: { mode: "hourly", hourly_rate: 42.5 } },
          { job_type_id: "bond_end_of_lease", pricing: { mode: "quote_required" } },
        ],
        recurrence: { enabled: true, supported_frequencies: ["weekly"], default_frequency: "weekly" },
      } });
    } finally { await bStore.close(); }

    const bJobResponse = await context.request.post(`${baseUrl}/api/v1/cleaning/jobs`, { headers: { origin }, data: {
      service_id: "domestic_recurring", client_id: ids.client, property_id: ids.property,
      title: "Weekly home clean", scheduled_start: "2026-10-05T09:00:00.000Z", scheduled_end: "2026-10-05T11:00:00.000Z",
    } });
    expect(bJobResponse.status()).toBe(201);
    const bJobResult = (await bJobResponse.json()).data;
    expect(bJobResult).toMatchObject({ company_id: companyB, service_id: "domestic_recurring", service_setup_revision: 1,
      pricing_snapshot: { mode: "hourly", fixed_price: null, hourly_rate: 42.5, currency: "AUD" },
      recurrence_snapshot: { enabled: true, default_frequency: "weekly", supported_frequencies: ["weekly"] } });
    const bRoundTripStore = createSqliteStorage(join(storeRoot, `${bPlacementId}.sqlite`));
    const bNativeJob = (await bRoundTripStore.query<{ company_id: string; service_id: string; service_setup_revision: number;
      service_pricing_snapshot: string; service_recurrence_snapshot: string }>(
      "SELECT company_id,service_id,service_setup_revision,service_pricing_snapshot,service_recurrence_snapshot FROM jobs WHERE id=$1",
      [bJobResult.job_id],
    )).rows[0];
    expect(bNativeJob).toMatchObject({ company_id: companyB, service_id: "domestic_recurring", service_setup_revision: 1 });
    expect(JSON.parse(bNativeJob!.service_pricing_snapshot)).toMatchObject({ mode: "hourly", hourly_rate: 42.5, currency: "AUD" });
    expect(JSON.parse(bNativeJob!.service_recurrence_snapshot)).toMatchObject({ enabled: true, default_frequency: "weekly" });
    expect((await bRoundTripStore.query<{ company_id: string; job_id: string }>("SELECT company_id,job_id FROM visits WHERE id=$1", [bJobResult.visit_id])).rows[0])
      .toEqual({ company_id: companyB, job_id: bJobResult.job_id });
    await bRoundTripStore.close();

    // A different authenticated company with a non-Cleaning profile cannot
    // read or mutate the saved Cleaning configuration.
    await page.getByLabel("Company").selectOption(companyA);
    await expectPage(page.getByLabel("Company")).toHaveValue(companyA);
    expect((await context.request.get(`${baseUrl}/api/v1/cleaning/service-setup`)).status()).toBe(409);
    const bStoreAfterA = createSqliteStorage(join(storeRoot, `${bPlacementId}.sqlite`));
    try {
      const settings = JSON.parse((await bStoreAfterA.query<{ settings: string }>("SELECT settings FROM companies WHERE id=$1", [companyB])).rows[0]!.settings);
      expect(settings.cleaning_service_setup).toMatchObject({ company_id: companyB, revision: 1, data: { selections: [
        { job_type_id: "domestic_recurring", pricing: { hourly_rate: 42.5 } },
        { job_type_id: "bond_end_of_lease", pricing: { mode: "quote_required" } },
      ] } });
    } finally { await bStoreAfterA.close(); }

    // Switch the same authenticated actor through the real canonical selector.
    const beforeFirstSwitch = (await context.cookies()).find(cookie => cookie.name === "__Host-titan-web-session");
    expect(beforeFirstSwitch).toBeTruthy();
    await page.getByLabel("Company").selectOption(companyC);
    await expectPage(page.getByRole("heading", { name: "Cleaning workspace" })).toBeVisible({ timeout: 30_000 });
    await expectPage(page.getByLabel("Company")).toHaveValue(companyC);
    const afterFirstSwitch = (await context.cookies()).find(cookie => cookie.name === "__Host-titan-web-session");
    expect(afterFirstSwitch).toBeTruthy();
    expect(afterFirstSwitch!.expires).toBeLessThanOrEqual(beforeFirstSwitch!.expires + 1);
    const staleSession = await playwrightRequest.newContext({
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: { cookie: `__Host-titan-web-session=${beforeFirstSwitch!.value}` },
    });
    try { expect((await staleSession.get(`${baseUrl}/api/v1/cleaning/service-setup`)).status()).toBe(401); }
    finally { await staleSession.dispose(); }

    // Company C chooses distinct service/rate/cadence from company B.
    await expectPage(page.getByLabel("Deep clean", { exact: false }).first()).toBeVisible({ timeout: 20_000 });
    await page.getByLabel("Deep clean", { exact: false }).first().check();
    await page.getByLabel("Deep clean fixed price").fill("275.00");
    await page.getByLabel("Enable recurring configuration").check();
    await page.getByRole("checkbox", { name: "Monthly" }).check();
    await page.getByLabel("Default frequency").selectOption("monthly");
    await page.getByRole("button", { name: "Save service setup" }).click();
    await expectPage(page.getByRole("status").filter({ hasText: "Cleaning service setup saved" })).toBeVisible();
    await page.getByRole("button", { name: "Reload saved setup" }).click();
    await expectPage(page.getByLabel("Deep clean fixed price")).toHaveValue("275");
    await expectPage(page.getByLabel("Default frequency")).toHaveValue("monthly");

    const cPlacementId = placementIds.get(companyC);
    if (!cPlacementId) throw new Error("company-c-placement-missing");
    const cStore = createSqliteStorage(join(storeRoot, `${cPlacementId}.sqlite`));
    try {
      const settings = JSON.parse((await cStore.query<{ settings: string }>("SELECT settings FROM companies WHERE id=$1", [companyC])).rows[0]!.settings);
      expect(settings).toMatchObject({ vertical_profile: { company_id: companyC, profile: { module_id: "titan.workforce.cleaning" } },
        cleaning_service_setup: { company_id: companyC, revision: 1, data: {
          selections: [{ job_type_id: "deep_clean", pricing: { mode: "fixed", fixed_price: 275 } }],
          recurrence: { enabled: true, supported_frequencies: ["monthly"], default_frequency: "monthly" },
        } } });
    } finally { await cStore.close(); }

    const cJobResponse = await context.request.post(`${baseUrl}/api/v1/cleaning/jobs`, { headers: { origin }, data: {
      service_id: "deep_clean", client_id: ids.client, property_id: ids.property,
      title: "Deep clean", scheduled_start: "2026-10-06T09:00:00.000Z", scheduled_end: "2026-10-06T13:00:00.000Z",
    } });
    expect(cJobResponse.status()).toBe(201);
    const cJobResult = (await cJobResponse.json()).data;
    expect(cJobResult).toMatchObject({ company_id: companyC, service_id: "deep_clean", service_setup_revision: 1,
      pricing_snapshot: { mode: "fixed", fixed_price: 275, hourly_rate: null, currency: "AUD" },
      recurrence_snapshot: { enabled: true, default_frequency: "monthly", supported_frequencies: ["monthly"] } });
    const cRoundTripStore = createSqliteStorage(join(storeRoot, `${cPlacementId}.sqlite`));
    const cNative = await cRoundTripStore.query<{ company_id: string; service_id: string; service_setup_revision: number;
      service_pricing_snapshot: string; service_recurrence_snapshot: string }>(
      "SELECT company_id,service_id,service_setup_revision,service_pricing_snapshot,service_recurrence_snapshot FROM jobs WHERE id=$1",
      [cJobResult.job_id],
    );
    expect(cNative.rows[0]).toMatchObject({ company_id: companyC, service_id: "deep_clean", service_setup_revision: 1 });
    expect(JSON.parse(cNative.rows[0]!.service_pricing_snapshot)).toMatchObject({ mode: "fixed", fixed_price: 275, currency: "AUD" });
    expect((await cRoundTripStore.query<{ company_id: string; job_id: string }>("SELECT company_id,job_id FROM visits WHERE id=$1", [cJobResult.visit_id])).rows[0])
      .toEqual({ company_id: companyC, job_id: cJobResult.job_id });
    await cRoundTripStore.close();

    const beforeSecondSwitch = (await context.cookies()).find(cookie => cookie.name === "__Host-titan-web-session");
    expect(beforeSecondSwitch).toBeTruthy();
    await page.getByLabel("Company").selectOption(companyB);
    await expectPage(page.getByRole("heading", { name: "Cleaning workspace" })).toBeVisible({ timeout: 30_000 });
    await expectPage(page.getByLabel("Company")).toHaveValue(companyB);
    const afterSecondSwitch = (await context.cookies()).find(cookie => cookie.name === "__Host-titan-web-session");
    expect(afterSecondSwitch).toBeTruthy();
    expect(afterSecondSwitch!.expires).toBeLessThanOrEqual(beforeSecondSwitch!.expires + 1);
    await expectPage(page.getByLabel("Regular clean hourly rate")).toHaveValue("42.5");
    await expectPage(page.getByLabel("Default frequency")).toHaveValue("weekly");
    expect(await page.getByLabel("Deep clean", { exact: false }).first().isChecked()).toBe(false);

    await page.getByLabel("Company").selectOption(companyC);
    await expectPage(page.getByRole("heading", { name: "Cleaning workspace" })).toBeVisible({ timeout: 30_000 });
    await expectPage(page.getByLabel("Company")).toHaveValue(companyC);
    await expectPage(page.getByLabel("Deep clean fixed price")).toHaveValue("275");
    await expectPage(page.getByLabel("Default frequency")).toHaveValue("monthly");
    await context.close();
  }, 180_000);
});
