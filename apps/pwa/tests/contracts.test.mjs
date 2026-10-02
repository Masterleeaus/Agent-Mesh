import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createPwaProjectionClient } from "../src/api-client.mjs";
import { normalizePwaContext, PwaProjectionWorkingSet } from "../src/scope.mjs";
const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const context = (company_id = "c-a", surface = "go", actor_id = "worker-1", device_id = "device-1") => ({ company_id, surface, actor_id, device_id, context_revision: "r1", session_revision: "s1" });

test("requires explicit canonical company, actor, device and one of three modes", () => {
  assert.equal(normalizePwaContext(context()).company_id, "c-a");
  assert.throws(() => normalizePwaContext({ ...context(), company_id: "" }), /company_id:required/);
  assert.throws(() => normalizePwaContext({ ...context(), surface: "command" }), /surface:unsupported/);
  assert.throws(() => normalizePwaContext({ ...context(), tenant_id: "c-a" }), /legacy-tenant-boundary/);
});

test("working set rejects company, actor, device and mode rotation; explicit rotate clears it", () => {
  const store = new PwaProjectionWorkingSet(context(), { maxEntries: 2 });
  store.put(context(), "today", { company_id: "c-a", work: [1] });
  assert.deepEqual(store.get(context(), "today").work, [1]);
  assert.throws(() => store.get(context("c-b"), "today"), /scope-changed/);
  assert.throws(() => store.get(context("c-a", "zero"), "today"), /scope-changed/);
  assert.throws(() => store.get({ ...context(), context_revision: "r2" }, "today"), /scope-changed/);
  assert.throws(() => store.get({ ...context(), session_revision: "s2" }, "today"), /scope-changed/);
  assert.throws(() => store.put(context(), "bad", { company_id: "c-b" }), /company-mismatch/);
  store.rotate(context("c-b"));
  assert.equal(store.size, 0);
  assert.equal(store.get(context("c-b"), "today"), null);
  store.put(context("c-b"), "fresh", { company_id: "c-b", id: "fresh" });
  store.rotate({ ...context("c-b"), context_revision: "r2" });
  assert.equal(store.size, 0);
  store.put({ ...context("c-b"), context_revision: "r2" }, "latest", { company_id: "c-b" });
  store.rotate({ ...context("c-b"), context_revision: "r2", session_revision: "s2" });
  assert.equal(store.size, 0);
});

test("working set is bounded and evicts oldest projection", () => {
  const store = new PwaProjectionWorkingSet(context(), { maxEntries: 2 });
  store.put(context(), "a", { company_id: "c-a", id: "a" });
  store.put(context(), "b", { company_id: "c-a", id: "b" });
  store.put(context(), "c", { company_id: "c-a", id: "c" });
  assert.equal(store.size, 2);
  assert.equal(store.get(context(), "a"), null);
});

test("projection client is same-origin, GET-only, no-store and validates response company", async () => {
  let seen;
  const api = createPwaProjectionClient({ apiBaseUrl: "/api/v1/", context: context(), origin: "https://titan.example", fetchImpl: async (url, options) => {
    seen = { url: String(url), options };
    return { ok: true, json: async () => ({ company_id: "c-a", result: [] }) };
  } });
  assert.deepEqual(await api.get("/work/today"), { company_id: "c-a", result: [] });
  assert.equal(seen.url, "https://titan.example/api/v1/work/today");
  assert.equal(seen.options.method, "GET");
  assert.equal(seen.options.cache, "no-store");
  assert.equal(seen.options.credentials, "same-origin");
  assert.throws(() => createPwaProjectionClient({ apiBaseUrl: "https://evil.example/", context: context(), origin: "https://titan.example", fetchImpl: fetch }), /origin-not-approved/);
  await assert.rejects(api.get("//evil.example/data"), /path-invalid/);
  await assert.rejects(api.get("/../private"), /path-invalid/);
  await assert.rejects(api.get("/..%2fprivate"), /path-invalid/);
  await assert.rejects(api.get("/..%5cprivate"), /path-invalid/);
  await assert.rejects(api.get("/..%252fprivate"), /path-invalid/);
  const wrongCompany = createPwaProjectionClient({ apiBaseUrl: "/api/", context: context(), origin: "https://titan.example", fetchImpl: async () => ({ ok: true, json: async () => ({ company_id: "c-b" }) }) });
  await assert.rejects(wrongCompany.get("/projection"), /company-mismatch/);
});

test("PWA shell has one install identity, three modes and no business data in worker caches", async () => {
  const manifest = JSON.parse(await read("public/manifest.webmanifest"));
  const html = await read("public/index.html");
  const worker = await read("public/sw.js");
  assert.equal(manifest.start_url, "/?mode=zero");
  assert.equal(manifest.scope, "/");
  for (const mode of ["zero", "go", "hub"]) assert.match(manifest.shortcuts.map(item => item.url).join(" "), new RegExp(`mode=${mode}`));
  assert.match(html, /data-mode="zero"/);
  assert.match(html, /data-mode="go"/);
  assert.match(html, /data-mode="hub"/);
  assert.match(worker, /const PRIVATE = \/\^\\\//);
  assert.match(worker, /if \(url\.origin !== self\.location\.origin \|\| PRIVATE\.test\(url\.pathname\)\) return/);
  assert.doesNotMatch(worker, /caches\.open\([^)]*\)\.then\(cache => cache\.put\(request, response\.clone\(\)\)\)[\s\S]{0,300}api/);
});
