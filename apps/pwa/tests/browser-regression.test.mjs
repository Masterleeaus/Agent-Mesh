import assert from "node:assert/strict";
import { createServer } from "node:http";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { chromium } from "@playwright/test";
import { buildPwa } from "../scripts/build.mjs";

const pwaRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(pwaRoot, "public");
const legacyWorker = readFileSync(new URL("./fixtures/legacy-shell-v1-sw.js", import.meta.url), "utf8");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"], [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".mjs", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"], [".webmanifest", "application/manifest+json; charset=utf-8"],
]);

function temporaryPublic() {
  const root = mkdtempSync(resolve(tmpdir(), "titan-pwa-browser-"));
  const directory = resolve(root, "public");
  mkdirSync(directory, { recursive: true });
  cpSync(publicRoot, directory, { recursive: true });
  return { root, directory };
}

function createStaticServer(initialRoot) {
  let root = initialRoot;
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/api/v1/private-test") {
      response.writeHead(200, { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" });
      response.end("PRIVATE_CANARY");
      return;
    }
    const relativePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = resolve(root, relativePath);
    if (file !== root && !file.startsWith(`${root}${sep}`)) {
      response.writeHead(404).end();
      return;
    }
    try {
      const body = readFileSync(file);
      response.writeHead(200, {
        "cache-control": url.pathname === "/sw.js" ? "no-cache" : "no-store",
        "content-type": contentTypes.get(extname(file)) ?? "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolveServer, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolveServer({
        origin: `http://127.0.0.1:${address.port}`,
        setRoot(value) { root = value; },
        close() { return new Promise((resolveClose, rejectClose) => server.close(error => error ? rejectClose(error) : resolveClose())); },
      });
    });
  });
}

async function withBrowser(run) {
  const executablePath = process.env.PWA_CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    await run(browser);
  } finally {
    await browser.close();
  }
}

async function waitForController(page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

test("legacy app-only deployment reproduces the stale shell badge", async t => {
  const oldTree = temporaryPublic();
  const newTree = temporaryPublic();
  t.after(() => {
    rmSync(oldTree.root, { recursive: true, force: true });
    rmSync(newTree.root, { recursive: true, force: true });
  });

  writeFileSync(resolve(oldTree.directory, "sw.js"), legacyWorker);
  writeFileSync(resolve(oldTree.directory, "app.mjs"), `
    document.documentElement.dataset.shellRelease = "legacy";
    document.querySelector("#network").textContent = "Online";
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  `);
  writeFileSync(resolve(newTree.directory, "sw.js"), legacyWorker);
  writeFileSync(resolve(newTree.directory, "app.mjs"), `
    document.documentElement.dataset.shellRelease = "updated";
    document.querySelector("#network").textContent = navigator.onLine ? "Network available" : "Browser offline · shell only";
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  `);

  const oldOutput = resolve(oldTree.root, "dist");
  const newOutput = resolve(newTree.root, "dist");
  cpSync(oldTree.directory, oldOutput, { recursive: true });
  cpSync(newTree.directory, newOutput, { recursive: true });
  const server = await createStaticServer(oldOutput);
  t.after(() => server.close());

  await withBrowser(async browser => {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    const page = await context.newPage();
    await page.goto(`${server.origin}/?mode=zero`);
    await waitForController(page);
    await page.waitForFunction(() => document.documentElement.dataset.shellRelease === "legacy");

    server.setRoot(newOutput);
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    assert.equal(await page.locator("#network").textContent(), "Online");
    assert.equal(await page.locator("html").getAttribute("data-shell-release"), "legacy");

    await context.setOffline(true);
    await page.waitForFunction(() => navigator.onLine === false);
    assert.equal(await page.locator("#network").textContent(), "Online");
    assert.equal(await page.locator("html").getAttribute("data-shell-release"), "legacy");
    await context.close();
  });
});

test("versioned built shell updates, reports offline accurately, and caches no private routes", async t => {
  const releaseA = temporaryPublic();
  const releaseB = temporaryPublic();
  t.after(() => {
    rmSync(releaseA.root, { recursive: true, force: true });
    rmSync(releaseB.root, { recursive: true, force: true });
  });

  const currentApp = readFileSync(resolve(publicRoot, "app.mjs"), "utf8");
  writeFileSync(resolve(releaseA.directory, "app.mjs"), `${currentApp}\ndocument.documentElement.dataset.shellRelease = "release-a";\n`);
  writeFileSync(resolve(releaseB.directory, "app.mjs"), `${currentApp}\ndocument.documentElement.dataset.shellRelease = "release-b";\n`);
  const outputA = resolve(releaseA.root, "dist");
  const outputB = resolve(releaseB.root, "dist");
  const versionA = buildPwa({ publicDir: releaseA.directory, outputDir: outputA });
  const versionB = buildPwa({ publicDir: releaseB.directory, outputDir: outputB });
  assert.notEqual(versionA, versionB, "an app-only change must change the service worker cache version");
  const workerB = readFileSync(resolve(outputB, "sw.js"), "utf8");
  assert.ok(workerB.includes(versionB), "the built worker must contain the content-derived cache version");

  const server = await createStaticServer(outputA);
  t.after(() => server.close());

  await withBrowser(async browser => {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    let page = await context.newPage();
    await page.goto(`${server.origin}/?mode=go`);
    await waitForController(page);
    await page.waitForFunction(() => document.documentElement.dataset.shellRelease === "release-a");
    await page.waitForFunction(() => document.querySelector("#network")?.dataset.online === "true");
    assert.equal(await page.locator("#network").textContent(), "Network available");
    assert.match(await page.locator("#connection-copy").textContent(), /no authenticated Workforce connection/i);
    assert.equal(await page.locator("#mode-title").textContent(), "Go · Workforce not configured");
    assert.match(await page.locator("#installation-status").textContent(), /public shell is ready/i);

    await page.locator('[data-mode="hub"]').click();
    await page.waitForURL(/mode=hub/);
    assert.equal(await page.locator("#mode-title").textContent(), "Hub · Workforce not configured");
    assert.equal(await page.evaluate(() => localStorage.length), 0);
    assert.equal(await page.evaluate(() => sessionStorage.length), 0);
    assert.equal(await page.evaluate(() => fetch("/api/v1/private-test").then(response => response.text())), "PRIVATE_CANARY");

    server.setRoot(outputB);
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await page.waitForFunction(async ({ versionA, versionB }) => {
      const names = await caches.keys();
      const registration = await navigator.serviceWorker.getRegistration();
      return names.includes(`titan-pwa-shell-${versionB}`)
        && !names.includes(`titan-pwa-shell-${versionA}`)
        && registration?.active?.state === "activated";
    }, { versionA, versionB });
    await page.close();
    page = await context.newPage();
    await page.goto(`${server.origin}/?mode=hub`);
    await waitForController(page);
    await page.waitForFunction(() => document.documentElement.dataset.shellRelease === "release-b");

    await context.setOffline(true);
    await page.waitForFunction(() => navigator.onLine === false);
    assert.equal(await page.locator("#network").textContent(), "Browser offline · shell only");
    const offlineResponse = await page.reload();
    assert.equal(offlineResponse?.fromServiceWorker(), true, "an offline reload must use the public shell service worker");
    await page.waitForFunction(() => document.documentElement.dataset.shellRelease === "release-b");
    assert.equal(await page.locator("#mode-title").textContent(), "Hub · Workforce not configured");
    assert.match(await page.locator("#connection-copy").textContent(), /no authenticated Workforce connection|Only the public shell is available/i);
    assert.equal(await page.locator("html").getAttribute("data-shell-release"), "release-b");

    const cachedPaths = await page.evaluate(async () => {
      const names = await caches.keys();
      const entries = await Promise.all(names.map(async name => (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)));
      return entries.flat();
    });
    assert.ok(cachedPaths.includes("/app.mjs"));
    assert.ok(!cachedPaths.some(path => /^\/(?:api|auth|signin|signout|portal|company|app)(?:\/|$)/.test(path)), "private routes must never enter the shell cache");
    await context.close();
  });
});
