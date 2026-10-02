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
  [".png", "image/png"], [".svg", "image/svg+xml"], [".webmanifest", "application/manifest+json; charset=utf-8"],
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
  let unavailablePath = null;
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === unavailablePath) {
      response.writeHead(503, { "cache-control": "no-store" }).end();
      return;
    }
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
        setUnavailable(value) { unavailablePath = value; },
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

async function updateServiceWorker(page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const terminalState = new Promise(resolve => {
      const timeout = setTimeout(() => resolve("timeout"), 10000);
      registration.addEventListener("updatefound", () => {
        const candidate = registration.installing;
        const onState = () => {
          if (candidate.state === "activated" || candidate.state === "redundant") {
            clearTimeout(timeout);
            resolve(candidate.state);
          }
        };
        candidate.addEventListener("statechange", onState);
        onState();
      }, { once: true });
    });
    try { await registration.update(); } catch {}
    return terminalState;
  });
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

test("versioned built shell supports install, accessible controls, and interrupted updates", async t => {
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
    const page = await context.newPage();
    await page.goto(`${server.origin}/?mode=zero`);
    await waitForController(page);
    await page.waitForFunction(() => document.documentElement.dataset.shellRelease === "release-a");
    await page.waitForFunction(() => document.querySelector("#network")?.dataset.online === "true");
    assert.equal(await page.locator("#network").textContent(), "Network available");
    assert.match(await page.locator("#connection-copy").textContent(), /no authenticated Workforce connection/i);
    assert.equal(await page.locator("#mode-title").textContent(), "Zero · Workforce not configured");
    assert.match(await page.locator("#installation-status").textContent(), /public shell is ready/i);

    const manifest = await page.evaluate(async () => (await fetch("/manifest.webmanifest")).json());
    assert.equal(manifest.id, "/");
    assert.equal(manifest.start_url, "/?mode=zero");
    assert.ok(manifest.icons.some(icon => icon.sizes === "192x192" && icon.type === "image/png"));
    assert.ok(manifest.icons.some(icon => icon.sizes === "512x512" && icon.type === "image/png"));
    const touchIcon = await page.evaluate(() => document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href"));
    assert.equal(touchIcon, "/icon-180.png");
    const iconPixels = await page.evaluate(async () => Promise.all([180, 192, 512].map(async size => {
      const image = await createImageBitmap(await (await fetch(`/icon-${size}.png`)).blob());
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = image.width;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      return { size: image.width, height: image.height, cornerAlpha: context.getImageData(0, 0, 1, 1).data[3] };
    })));
    assert.deepEqual(iconPixels, [180, 192, 512].map(size => ({ size, height: size, cornerAlpha: 255 })));

    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator('[data-mode="zero"]').evaluate(element => getComputedStyle(element).transitionDuration), "0s");
    assert.equal(await page.getByRole("navigation", { name: "Choose Titan mode" }).count(), 1);
    assert.equal(await page.getByRole("button", { name: /Go Field.*assigned work and capture/ }).count(), 1);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-mode")), "zero");
    assert.equal(await page.locator('[data-mode="zero"]').evaluate(element => getComputedStyle(element).outlineStyle), "solid");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-mode")), "go");
    await page.keyboard.press("Space");
    await page.waitForURL(/mode=go/);
    assert.equal(await page.locator('[data-mode="go"]').getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator("#mode-title").textContent(), "Go · Workforce not configured");

    await page.locator('[data-mode="hub"]').click();
    await page.waitForURL(/mode=hub/);
    assert.equal(await page.locator("#mode-title").textContent(), "Hub · Workforce not configured");
    assert.equal(await page.locator('[data-mode="hub"]').getAttribute("aria-pressed"), "true");
    assert.match(await page.locator("#connection-copy").textContent(), /no authenticated Workforce connection/i);
    await page.goto(`${server.origin}/?mode=uncommissioned`);
    await page.waitForFunction(() => document.querySelector("#mode-title")?.textContent === "Zero · Workforce not configured");
    assert.equal(await page.locator('[data-mode="zero"]').getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator('[data-mode="go"]').getAttribute("aria-pressed"), "false");
    await page.goto(`${server.origin}/?mode=hub`);
    await page.waitForFunction(() => document.querySelector("#mode-title")?.textContent === "Hub · Workforce not configured");
    assert.equal(await page.evaluate(() => localStorage.length), 0);
    assert.equal(await page.evaluate(() => sessionStorage.length), 0);
    assert.equal(await page.evaluate(() => fetch("/api/v1/private-test").then(response => response.text())), "PRIVATE_CANARY");

    server.setRoot(outputB);
    server.setUnavailable("/icon-512.png");
    assert.equal(await updateServiceWorker(page), "redundant", "a failed precache update must be discarded");
    const interruptedCacheState = await page.evaluate(async ({ versionA, versionB }) => {
      const names = await caches.keys();
      const previousCache = await caches.open(`titan-pwa-shell-${versionA}`);
      const paths = (await previousCache.keys()).map(request => new URL(request.url).pathname);
      return {
        previous: names.includes(`titan-pwa-shell-${versionA}`),
        candidate: names.includes(`titan-pwa-shell-${versionB}`),
        previousShellComplete: ["/index.html", "/app.mjs", "/icon-512.png"].every(path => paths.includes(path)),
      };
    }, { versionA, versionB });
    assert.deepEqual(interruptedCacheState, { previous: true, candidate: false, previousShellComplete: true });
    assert.equal(await page.locator("html").getAttribute("data-shell-release"), "release-a", "a failed update must not replace the open document");

    server.setUnavailable(null);
    assert.equal(await updateServiceWorker(page), "activated");
    await page.waitForFunction(async ({ versionA, versionB }) => {
      const names = await caches.keys();
      const registration = await navigator.serviceWorker.getRegistration();
      return names.includes(`titan-pwa-shell-${versionB}`)
        && !names.includes(`titan-pwa-shell-${versionA}`)
        && registration?.active?.state === "activated";
    }, { versionA, versionB });
    assert.equal(await page.locator("html").getAttribute("data-shell-release"), "release-a", "service-worker activation must not force-reload an open document");
    const updatedPage = await context.newPage();
    await updatedPage.goto(`${server.origin}/?mode=hub`);
    await waitForController(updatedPage);
    await updatedPage.waitForFunction(() => document.documentElement.dataset.shellRelease === "release-b");

    await context.setOffline(true);
    await updatedPage.waitForFunction(() => navigator.onLine === false);
    assert.equal(await updatedPage.locator("#network").textContent(), "Browser offline · shell only");
    const offlineResponse = await updatedPage.reload();
    assert.equal(offlineResponse?.fromServiceWorker(), true, "an offline reload must use the public shell service worker");
    await updatedPage.waitForFunction(() => document.documentElement.dataset.shellRelease === "release-b");
    assert.equal(await updatedPage.locator("#mode-title").textContent(), "Hub · Workforce not configured");
    assert.match(await updatedPage.locator("#connection-copy").textContent(), /no authenticated Workforce connection|Only the public shell is available/i);
    assert.equal(await updatedPage.locator("html").getAttribute("data-shell-release"), "release-b");

    const cachedPaths = await updatedPage.evaluate(async () => {
      const names = await caches.keys();
      const entries = await Promise.all(names.map(async name => (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)));
      return entries.flat();
    });
    assert.ok(cachedPaths.includes("/app.mjs"));
    assert.ok(cachedPaths.includes("/icon-180.png"));
    assert.ok(cachedPaths.includes("/icon-192.png"));
    assert.ok(cachedPaths.includes("/icon-512.png"));
    assert.ok(!cachedPaths.some(path => /^\/(?:api|auth|signin|signout|portal|company|app)(?:\/|$)/.test(path)), "private routes must never enter the shell cache");
    await context.close();
  });
});
