import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createSocket } from "node:dgram";
import dns from "node:dns/promises";
import { createServer } from "node:http";
import { once } from "node:events";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PassThrough } from "node:stream";
import { createDirectAdminRelayFetch } from "./images/directadmin-relay-client.mjs";
import { packagePlugin } from "../../../scripts/package-directadmin-plugin.mjs";
import {
  forwardRequest,
  readBoundedBody,
  DIRECTADMIN_SESSION_COOKIE,
} from "./directadmin-relay.mjs";

const sourceRoot = path.dirname(fileURLToPath(import.meta.url));
const controlOrigin = "https://panel.example.test:2222";
const csrf = "c".repeat(43);

function setCookie(value) {
  return DIRECTADMIN_SESSION_COOKIE + "=" + value + "; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=" + (value ? "120" : "0");
}

function headerBlock(extra = []) {
  return encodeURIComponent([
    "Host: panel.example.test:2222",
    "Cookie: DAID=unrelated-cookie; " + DIRECTADMIN_SESSION_COOKIE + "=session-fixture-secret",
    "Sec-Fetch-Site: same-origin",
    "X-Titan-CSRF: " + csrf,
    "Accept: application/json",
    ...extra,
  ].join("\r\n"));
}

function parseRaw(bytes) {
  const split = bytes.indexOf(Buffer.from("\r\n\r\n"));
  assert.notEqual(split, -1, "RAW entrypoint must write a complete HTTP response");
  const headers = bytes.subarray(0, split).toString("latin1").split("\r\n");
  const status = Number(headers.shift().split(" ")[1]);
  const values = new Map();
  for (const line of headers) {
    const index = line.indexOf(":");
    if (index < 1) continue;
    const name = line.slice(0, index).toLowerCase();
    const value = line.slice(index + 1).trim();
    if (!values.has(name)) values.set(name, []);
    values.get(name).push(value);
  }
  const body = bytes.subarray(split + 4);
  assert.equal(Number(values.get("content-length")?.[0]), body.length);
  return { status, headers: values, body };
}

async function spawnRaw(rawPath, env, input, { keepInputOpen = false, inputChunks } = {}) {
  const child = spawn(rawPath, [], { env, stdio: ["pipe", "pipe", "pipe"] });
  const out = [];
  const err = [];
  child.stdin.on("error", () => {});
  child.stdout.on("data", (part) => out.push(part));
  child.stderr.on("data", (part) => err.push(part));
  if (inputChunks) {
    for (const chunk of inputChunks) {
      if (!child.stdin.write(chunk)) await once(child.stdin, "drain");
      await new Promise((resolve) => setTimeout(resolve, 3));
    }
    child.stdin.end();
  } else if (!keepInputOpen) child.stdin.end(input ?? Buffer.alloc(0));
  const [code, signal] = await once(child, "close");
  return { code, signal, stdout: Buffer.concat(out), stderr: Buffer.concat(err) };
}

async function runExtractedModule(f, env, input, {
  configLoader,
  forward,
  bodyTimeoutMs,
  upstreamTimeoutMs,
  keepInputOpen = false,
  inputChunks,
} = {}) {
  const stdin = new PassThrough();
  const output = [];
  const stdout = { write(chunk) { output.push(Buffer.from(chunk)); return true; } };
  if (inputChunks) {
    for (const chunk of inputChunks) stdin.write(chunk);
    stdin.end();
  } else if (!keepInputOpen) stdin.end(input ?? Buffer.alloc(0));

  const options = { env, stdin, stdout };
  if (configLoader) options.configLoader = configLoader;
  if (forward) options.forward = forward;
  if (bodyTimeoutMs !== undefined) options.bodyTimeoutMs = bodyTimeoutMs;
  if (upstreamTimeoutMs !== undefined) options.upstreamTimeoutMs = upstreamTimeoutMs;
  await f.api.runRawGateway(options);
  const raw = Buffer.concat(output);
  return { ...parseRaw(raw), raw };
}

function runFixtureCore(f, env, input, options = {}) {
  return runExtractedModule(f, env, input, {
    ...options,
    configLoader: async () => f.config,
  });
}

async function fixture(t, responseMode = "normal") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "titan-da-relay-"));
  const packageOutput = path.join(dir, "package");
  const extracted = path.join(dir, "extract");
  fs.mkdirSync(extracted);
  const packed = packagePlugin({ sourceDir: sourceRoot, outputDir: packageOutput });
  const tar = spawn("/usr/bin/tar", ["-xzf", packed.archive, "-C", extracted], { stdio: "ignore" });
  const [tarCode] = await once(tar, "close");
  assert.equal(tarCode, 0);

  const requests = [];
  const upstream = createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const record = {
        method: request.method,
        path: request.url,
        headers: request.headers,
        body: Buffer.concat(chunks),
      };
      requests.push(record);
      if (responseMode === "hang") return;
      response.setHeader("cache-control", "no-store");
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.setHeader("x-content-type-options", "nosniff");
      response.setHeader("referrer-policy", "no-referrer");
      response.setHeader("content-security-policy", "default-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'");
      response.setHeader("x-frame-options", "SAMEORIGIN");
      if (responseMode === "set-cookie") response.setHeader("set-cookie", setCookie("new-session-fixture"));
      if (responseMode === "clear-cookie") response.setHeader("set-cookie", setCookie(""));
      if (responseMode === "duplicate-cookie") response.setHeader("set-cookie", [setCookie("first-session"), setCookie("second-session")]);
      if (responseMode === "malformed-cookie") {
        response.setHeader("set-cookie", DIRECTADMIN_SESSION_COOKIE + "=bad value; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=120");
      }
      if (responseMode === "busy") {
        response.statusCode = 503;
        response.end(JSON.stringify({ error: "directadmin-busy", read_only: true }));
        return;
      }
      if (responseMode === "redirect") {
        response.statusCode = 302;
        response.setHeader("location", "https://attacker.invalid/");
        response.end("{}");
        return;
      }
      if (responseMode === "large-response") {
        response.end(Buffer.alloc(1024 * 1024 + 1, "x"));
        return;
      }
      response.end(JSON.stringify({ ok: true }));
    });
  });
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");
  const address = upstream.address();
  const configPath = path.join(dir, "directadmin-relay.json");
  const writeConfig = (workforceOrigin = "http://127.0.0.1:" + address.port, publicOrigin = controlOrigin) => {
    fs.writeFileSync(configPath, JSON.stringify({
      schema: "titan.server-node.directadmin-relay.v2",
      cookie_boundary: "apache-443-strip-titan-cookie-v1",
      public_origin: publicOrigin,
      workforce_origin: workforceOrigin,
    }), { mode: 0o644 });
    fs.chmodSync(configPath, 0o644);
  };
  writeConfig();
  const upstreamUrl = new URL("http://127.0.0.1:" + address.port);
  const config = Object.freeze({
    publicHost: new URL(controlOrigin).host,
    publicOrigin: controlOrigin,
    upstreamOrigin: upstreamUrl.origin,
    upstreamUrl,
  });
  const relayModulePath = path.join(extracted, "directadmin-relay.mjs");
  const api = await import(pathToFileURL(relayModulePath).href + "?fixture=" + encodeURIComponent(dir));
  const env = {
    NODE_ENV: "test",
    TITAN_SERVER_NODE_HOME: extracted,
    TITAN_SERVER_NODE_DIRECTADMIN_RELAY_TEST_NODE_BIN: process.execPath,
    TITAN_SERVER_NODE_DIRECTADMIN_RELAY_TEST_CONFIG: configPath,
  };
  t.after(async () => {
    upstream.closeAllConnections();
    await new Promise((resolve) => upstream.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return {
    dir,
    rawPath: path.join(extracted, "user/directadmin-gateway.raw"),
    relayModulePath,
    configPath,
    writeConfig,
    env,
    config,
    api,
    requests,
    upstream,
  };
}

function cgi(f, {
  route = "context", method = "GET", headerLines = [], body = "", extraEnv = {}, queryExtras = "",
  headerEncoding = "percent-crlf",
} = {}) {
  const flags = "route=" + route + "&headers_to_env=yes" + (method === "POST" ? "&pipe_post=yes" : "") + queryExtras;
  const browserHeaders = [...headerLines];
  if (method === "GET" && !browserHeaders.some((line) => /^(?:origin|referer):/i.test(line))) {
    browserHeaders.push("Referer: " + controlOrigin + "/CMD_PLUGINS/titan-server-node/admin/index.html");
  }
  let headers = headerBlock(browserHeaders);
  if (headerEncoding === "form-crlf") {
    headers = headers.replace(/%20/g, "+");
  } else if (headerEncoding === "percent-lf") {
    headers = encodeURIComponent([
      "Host: panel.example.test:2222",
      "Cookie: DAID=unrelated-cookie; " + DIRECTADMIN_SESSION_COOKIE + "=session-fixture-secret",
      "Sec-Fetch-Site: same-origin",
      "X-Titan-CSRF: " + csrf,
      "Accept: application/json",
      ...browserHeaders,
    ].join("\n"));
  }
  const input = Buffer.from(body, "utf8");
  return {
    env: {
      ...f.env,
      REQUEST_METHOD: method,
      QUERY_STRING: flags,
      HEADERS: headers,
      ...(method === "POST" ? { POST: "stdin=true", CONTENT_LENGTH: String(input.length), CONTENT_TYPE: "application/json" } : {}),
      ...extraEnv,
    },
    input,
  };
}

test("extracted RAW module core maps Workforce projection and strips unrelated DirectAdmin cookies", async (t) => {
  const f = await fixture(t, "set-cookie");
  const { env, input } = cgi(f, {
    route: "workforce-projection",
    headerLines: ["Referer: " + controlOrigin + "/CMD_PLUGINS/titan_workforce/admin/index.html"],
  });
  delete env.ORIGIN;
  const response = await runFixtureCore(f, env, input);
  assert.equal(response.status, 200);
  assert.deepEqual(response.headers.get("set-cookie"), [setCookie("new-session-fixture")]);
  assert.equal(response.headers.get("cache-control")[0], "no-store");
  assert.equal(response.body.toString(), '{"ok":true}');
  assert.equal(response.raw.toString().includes("session-fixture-secret"), false);
  assert.equal(response.raw.toString().includes("unrelated-cookie"), false);
  assert.equal(f.requests.length, 1);
  const request = f.requests[0];
  assert.equal(request.method, "GET");
  assert.equal(request.path, "/v1/directadmin/titan_workforce/projection");
  assert.equal(request.headers.host, "panel.example.test:2222");
  assert.equal(request.headers.cookie, DIRECTADMIN_SESSION_COOKIE + "=session-fixture-secret");
  assert.equal(request.headers.origin, undefined);
  assert.equal(request.headers.referer, controlOrigin + "/CMD_PLUGINS/titan_workforce/admin/index.html");
  assert.equal(request.headers["sec-fetch-site"], "same-origin");
  assert.equal(request.headers["x-titan-csrf"], csrf);
  assert.equal(request.headers.authorization, undefined);
  assert.equal(request.headers["x-titan-company-id"], undefined);
  assert.equal(request.headers["directadmin-uid"], undefined);
  assert.equal(request.headers["directadmin-role"], undefined);
  assert.equal(request.body.length, 0);
});

test("POST intent uses pipe_post stdin and preserves only approved SDK headers/body", async (t) => {
  const f = await fixture(t, "clear-cookie");
  const body = JSON.stringify({
    company_id: "company-a",
    actor_id: "actor-a",
    context_revision: "context-2",
    capability_id: "workforce.manage",
    operation_id: "operation-2",
    correlation_id: "correlation-2",
    input: { action: "pause", work_id: "work-1" },
  });
  const { env, input } = cgi(f, {
    route: "workforce-intents",
    method: "POST",
    body,
    headerLines: [
      "Origin: " + controlOrigin,
      "Content-Type: application/json",
      "Content-Length: " + Buffer.byteLength(body),
    ],
  });
  const response = await runFixtureCore(f, env, input);
  assert.equal(response.status, 200);
  assert.deepEqual(response.headers.get("set-cookie"), [setCookie("")]);
  assert.equal(f.requests.length, 1);
  const request = f.requests[0];
  assert.equal(request.method, "POST");
  assert.equal(request.path, "/v1/directadmin/titan_workforce/intents");
  assert.equal(request.headers.host, "panel.example.test:2222");
  assert.equal(request.headers.cookie, DIRECTADMIN_SESSION_COOKIE + "=session-fixture-secret");
  assert.equal(request.headers["content-type"], "application/json");
  assert.equal(request.headers["content-length"], String(Buffer.byteLength(body)));
  assert.equal(request.headers.authorization, undefined);
  assert.equal(request.body.toString(), body);
});

test("DA-like URL-encoded HEADERS variants and fragmented pipe_post stdin reach the fixed gateway", async (t) => {
  const f = await fixture(t);
  const formEncoded = cgi(f, {
    route: "workforce-projection",
    headerEncoding: "form-crlf",
    headerLines: ["Referer: " + controlOrigin + "/CMD_PLUGINS/titan_workforce/admin/index.html"],
  });
  const formResult = await runFixtureCore(f, formEncoded.env, formEncoded.input);
  assert.equal(formResult.status, 200);
  assert.equal(f.requests[0].path, "/v1/directadmin/titan_workforce/projection");
  assert.equal(f.requests[0].headers.cookie, DIRECTADMIN_SESSION_COOKIE + "=session-fixture-secret");
  assert.equal(f.requests[0].headers.referer, controlOrigin + "/CMD_PLUGINS/titan_workforce/admin/index.html");

  const lfEncoded = cgi(f, {
    route: "workforce-projection",
    headerEncoding: "percent-lf",
    headerLines: ["Referer: " + controlOrigin + "/CMD_PLUGINS/titan_workforce/admin/index.html"],
  });
  const lfResult = await runFixtureCore(f, lfEncoded.env, lfEncoded.input);
  assert.equal(lfResult.status, 200);
  assert.equal(f.requests.length, 2);

  const body = JSON.stringify({
    company_id: "company-a", actor_id: "actor-a", context_revision: "revision-a",
    capability_id: "capability-a", operation_id: "operation-a", correlation_id: "correlation-a", input: {},
  });
  const post = cgi(f, {
    route: "workforce-intents", method: "POST", body,
    headerEncoding: "form-crlf",
    headerLines: ["Origin: " + controlOrigin, "Content-Type: application/json", "Content-Length: " + Buffer.byteLength(body)],
  });
  const pieces = [Buffer.from(body.slice(0, 7)), Buffer.from(body.slice(7, 29)), Buffer.from(body.slice(29))];
  const postResult = await runFixtureCore(f, post.env, undefined, { inputChunks: pieces });
  assert.equal(postResult.status, 200);
  assert.equal(f.requests.length, 3);
  assert.equal(f.requests[2].path, "/v1/directadmin/titan_workforce/intents");
  assert.deepEqual(f.requests[2].body, Buffer.from(body));
});

test("shared browser fetch helper maps fixed SDK routes and refuses arbitrary URLs, methods, and identity headers", async () => {
  const calls = [];
  const fetcher = createDirectAdminRelayFetch(async (input, init) => {
    calls.push({ input, init });
    return new Response("{}", { status: 200 });
  });
  const result = await fetcher("/v1/directadmin/titan_workforce/intents", {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json", "X-Titan-CSRF": csrf },
    body: "{}",
  });
  assert.equal(result.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, "/CMD_PLUGINS/titan-server-node/directadmin-gateway.raw?route=workforce-intents&headers_to_env=yes&pipe_post=yes");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.equal((await fetcher("/v1/directadmin/context?company_id=company-a", { method: "GET" })).status, 400);
  assert.equal((await fetcher("https://attacker.invalid/v1/directadmin/context", { method: "GET" })).status, 400);
  assert.equal((await fetcher("/v1/directadmin/context", { method: "POST", body: "{}" })).status, 405);
  assert.equal((await fetcher("/v1/directadmin/context", { method: "GET", headers: { "X-Titan-Actor-ID": "forged" } })).status, 400);
  assert.equal(calls.length, 1);
});

test("duplicate headers, cookie names, query keys and JSON keys fail before Workforce", async (t) => {
  const f = await fixture(t);
  const badCases = [
    cgi(f, { route: "context", headerLines: ["Host: panel.example.test:2222"] }),
    cgi(f, { route: "context", headerLines: ["Cookie: " + DIRECTADMIN_SESSION_COOKIE + "=one; " + DIRECTADMIN_SESSION_COOKIE + "=two"] }),
    cgi(f, { route: "context", headerLines: ["X-Titan-Actor-ID: forged"] }),
    cgi(f, { route: "context", queryExtras: "&route=context" }),
    cgi(f, { route: "context", queryExtras: "&target=http%3A%2F%2F127.0.0.1%3A9999" }),
    cgi(f, { route: "company", method: "POST", body: '{"company_id":"a","company_id":"b"}',
      headerLines: ["Origin: " + controlOrigin, "Content-Type: application/json"] }),
    cgi(f, { route: "company", method: "POST", body: '{"company_id":["company-a"]}',
      headerLines: ["Origin: " + controlOrigin, "Content-Type: application/json"] }),
    cgi(f, { route: "company", method: "POST", body: '{"company_id":"company-a","actor_id":"forged"}',
      headerLines: ["Origin: " + controlOrigin, "Content-Type: application/json"] }),
    cgi(f, { route: "titan-zero-intents", method: "POST", body: '{"company_id":"company-a","actor_id":"actor-a","context_revision":"revision-a","capability_id":"capability-a","operation_id":"operation-a","correlation_id":"correlation-a","input":{},"role":"admin"}',
      headerLines: ["Origin: " + controlOrigin, "Content-Type: application/json"] }),
    cgi(f, { route: "context", headerLines: ["Origin: https://evil.example"] }),
    cgi(f, { route: "context", headerLines: ["Authorization: Bearer forged"] }),
  ];
  badCases[0].env.HEADERS = encodeURIComponent([
    "Host: panel.example.test:2222",
    "Host: panel.example.test:2222",
    "Cookie: " + DIRECTADMIN_SESSION_COOKIE + "=session-fixture-secret",
    "Sec-Fetch-Site: same-origin", "X-Titan-CSRF: " + csrf, "Accept: application/json",
  ].join("\r\n"));
  for (const bad of badCases) {
    const result = await runFixtureCore(f, bad.env, bad.input);
    assert.equal(result.status >= 400, true);
  }
  assert.equal(f.requests.length, 0);
});

test("extracted RAW entrypoint stays disabled for test env, caller fields, and legacy configs", async (t) => {
  const f = await fixture(t);
  const origins = [
    "https://titanzero.io:2222",
    "https://other.example.test:2222",
    "https://future-control.example:8443",
  ];
  const configs = [
    (publicOrigin) => ({ schema: "titan.server-node.directadmin-relay.v1", public_origin: publicOrigin, workforce_origin: f.config.upstreamOrigin }),
    (publicOrigin) => ({ schema: "titan.server-node.directadmin-relay.v2", cookie_boundary: "apache-443-strip-titan-cookie-v1", public_origin: publicOrigin, workforce_origin: f.config.upstreamOrigin }),
  ];
  for (const publicOrigin of origins) {
    for (const makeConfig of configs) {
      fs.writeFileSync(f.configPath, JSON.stringify(makeConfig(publicOrigin)), { mode: 0o644 });
      const request = cgi(f, {
        route: "context",
        headerLines: [
          "Node_Env: test",
          "Titan-Server-Node-DirectAdmin-Relay-Test-Config: " + f.configPath,
        ],
        extraEnv: {
          HTTP_NODE_ENV: "test",
          HTTP_TITAN_SERVER_NODE_DIRECTADMIN_RELAY_TEST_CONFIG: f.configPath,
        },
      });
      const result = await spawnRaw(f.rawPath, request.env, request.input);
      const response = parseRaw(result.stdout);
      assert.equal(response.status, 503, publicOrigin + " / " + makeConfig(publicOrigin).schema);
      assert.equal(response.body.toString(), '{"error":"cookie_boundary_unverified","read_only":true}');
      assert.equal(result.stdout.toString().includes("session-fixture-secret"), false);
      assert.equal(result.stderr.length, 0);
      assert.equal(f.requests.length, 0);
    }
  }

  const request = cgi(f, { route: "context", queryExtras: "&target=http%3A%2F%2F127.0.0.1%3A3010" });
  const invalidQuery = await spawnRaw(f.rawPath, request.env, request.input);
  assert.equal(parseRaw(invalidQuery.stdout).status, 400);
  assert.equal(invalidQuery.stdout.toString().includes("session-fixture-secret"), false);
  assert.equal(f.requests.length, 0);

  const validTransport = cgi(f, { route: "context" });
  const noAmbientSelection = await runExtractedModule(f, {
    ...validTransport.env,
    NODE_ENV: "production",
    TITAN_SERVER_NODE_DIRECTADMIN_RELAY_TEST_CONFIG: f.configPath,
  }, validTransport.input);
  assert.equal(noAmbientSelection.status, 503);
  assert.equal(noAmbientSelection.body.toString(), '{"error":"cookie_boundary_unverified","read_only":true}');
  assert.equal(f.requests.length, 0);
});

test("busy gateway backpressure and redirects are handled without following them", async (t) => {
  const busy = await fixture(t, "busy");
  const request = cgi(busy, { route: "context" });
  const busyResponse = await runFixtureCore(busy, request.env, request.input);
  assert.equal(busyResponse.status, 503);
  assert.equal(busyResponse.body.toString(), '{"error":"directadmin-busy","read_only":true}');
  assert.equal(busy.requests.length, 1);

  const redirect = await fixture(t, "redirect");
  const redirectRequest = cgi(redirect, { route: "context" });
  const refused = await runFixtureCore(redirect, redirectRequest.env, redirectRequest.input);
  assert.equal(refused.status, 502);
  assert.equal(redirect.requests.length, 1);
});

test("duplicate and malformed upstream Set-Cookie headers fail closed", async (t) => {
  for (const mode of ["duplicate-cookie", "malformed-cookie"]) {
    const f = await fixture(t, mode);
    const request = cgi(f, { route: "context" });
    const response = await runFixtureCore(f, request.env, request.input);
    assert.equal(response.status, 502, mode);
    assert.equal(response.body.toString(), '{"error":"workforce_response_invalid","read_only":true}');
    assert.equal(f.requests.length, 1);
    assert.equal(response.raw.toString().includes("first-session"), false);
    assert.equal(response.raw.toString().includes("bad value"), false);
  }
});

test("oversized Workforce responses exceed the 1 MiB cap and are not relayed", async (t) => {
  const f = await fixture(t, "large-response");
  const request = cgi(f, { route: "context" });
  const response = await runFixtureCore(f, request.env, request.input);
  assert.equal(response.status, 502);
  assert.equal(response.body.toString(), '{"error":"workforce_response_too_large","read_only":true}');
  assert.equal(response.body.length < 1024, true);
  assert.equal(f.requests.length, 1);
});

test("the overall Workforce deadline includes DNS and blocks a connection after late resolution", async (t) => {
  const upstreamRequests = [];
  const upstream = createServer((request, response) => {
    upstreamRequests.push(request.url);
    response.end("{}");
  });
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");
  t.after(async () => {
    upstream.closeAllConnections();
    await new Promise((resolve) => upstream.close(resolve));
  });
  const config = {
    publicHost: "panel.example.test:2222",
    publicOrigin: controlOrigin,
    // This direct unit seam bypasses config policy only to observe a would-be
    // connection on loopback if an expired lookup were allowed to continue.
    upstreamUrl: new URL("http://workforce.internal:" + upstream.address().port),
  };
  const envelope = {
    route: { method: "GET", path: "/v1/directadmin/context" },
    cookie: DIRECTADMIN_SESSION_COOKIE + "=session-fixture-secret",
    csrf,
    accept: "application/json",
    referer: controlOrigin + "/CMD_PLUGINS/titan-server-node/admin/index.html",
  };
  let lookupStarted = false;
  let resolveLookup;
  const startedAt = Date.now();
  await assert.rejects(
    forwardRequest(config, envelope, Buffer.alloc(0), {
      timeoutMs: 35,
      resolveAddresses: () => {
        lookupStarted = true;
        return new Promise((resolve) => { resolveLookup = resolve; });
      },
    }),
    (error) => error.status === 504 && error.code === "workforce_timeout",
  );
  assert.equal(lookupStarted, true);
  assert.equal(Date.now() - startedAt < 300, true);
  resolveLookup([{ address: "127.0.0.1", family: 4 }]);
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.deepEqual(upstreamRequests, []);
});

test("the extracted RAW module cancels injected native DNS on its deadline", async (t) => {
  const f = await fixture(t);
  const dnsServer = createSocket("udp4");
  let queryCount = 0;
  dnsServer.on("message", () => { queryCount++; }); // Intentionally withhold answers.
  dnsServer.bind(0, "127.0.0.1");
  await once(dnsServer, "listening");
  t.after(() => dnsServer.close());

  const address = dnsServer.address();
  const request = cgi(f, { route: "context" });
  const config = {
    ...f.config,
    upstreamUrl: new URL("http://workforce-" + process.pid + ".internal:" + f.upstream.address().port),
  };
  const forward = (requestConfig, envelope, body, options) => f.api.forwardRequest(requestConfig, envelope, body, {
    ...options,
    createResolver: () => {
      const resolver = new dns.Resolver();
      resolver.setServers(["127.0.0.1:" + address.port]);
      return resolver;
    },
  });
  const startedAt = Date.now();
  const result = await runExtractedModule(f, request.env, request.input, {
    configLoader: async () => config,
    forward,
    upstreamTimeoutMs: 40,
  });
  const elapsed = Date.now() - startedAt;

  assert.equal(result.status, 504);
  assert.equal(queryCount > 0, true, "the native Resolver query must be outstanding when timed out");
  assert.equal(elapsed < 500, true, "standalone RAW process should exit promptly after resolver cancellation");
});

test("mixed private and public DNS answers are rejected before connecting", async () => {
  const config = {
    publicHost: "panel.example.test:2222",
    publicOrigin: controlOrigin,
    upstreamUrl: new URL("https://workforce.internal:3010"),
  };
  const envelope = {
    route: { method: "GET", path: "/v1/directadmin/context" },
    cookie: DIRECTADMIN_SESSION_COOKIE + "=session-fixture-secret",
    csrf,
    accept: "application/json",
    referer: controlOrigin + "/CMD_PLUGINS/titan-server-node/admin/index.html",
  };
  let lookupOptions;
  await assert.rejects(
    forwardRequest(config, envelope, Buffer.alloc(0), {
      timeoutMs: 200,
      resolveAddresses: async (_host, options) => {
        lookupOptions = options;
        return [
          { address: "10.20.30.40", family: 4 },
          { address: "203.0.113.10", family: 4 },
        ];
      },
    }),
    (error) => error.status === 502 && error.code === "workforce_target_not_private",
  );
  assert.deepEqual(lookupOptions, { all: true, verbatim: true });
});

test("POST body caps/timeouts and Workforce upstream timeout return bounded RAW errors", async (t) => {
  const f = await fixture(t, "hang");
  const body = '{"company_id":"company-a"}';
  const post = cgi(f, {
    route: "company",
    method: "POST",
    body,
    headerLines: ["Origin: " + controlOrigin, "Content-Type: application/json", "Content-Length: " + Buffer.byteLength(body)],
  });
  const stalled = await runFixtureCore(f, post.env, undefined, { keepInputOpen: true, bodyTimeoutMs: 35 });
  assert.equal(stalled.status, 408);
  assert.equal(f.requests.length, 0);

  const tooLargeBody = "x".repeat(64 * 1024 + 1);
  const large = cgi(f, {
    route: "company",
    method: "POST",
    body: tooLargeBody,
    headerLines: ["Origin: " + controlOrigin, "Content-Type: application/json", "Content-Length: " + Buffer.byteLength(tooLargeBody)],
  });
  const oversized = await runFixtureCore(f, large.env, large.input);
  assert.equal(oversized.status, 413);
  assert.equal(f.requests.length, 0);

  const get = cgi(f, { route: "context" });
  const timedOut = await runFixtureCore(f, get.env, get.input, { upstreamTimeoutMs: 35 });
  assert.equal(timedOut.status, 504);
  assert.equal(f.requests.length, 1);
});

test("bounded body reader rejects stalled streams", async () => {
  const { PassThrough } = await import("node:stream");
  const stream = new PassThrough();
  const result = readBoundedBody(stream, { timeoutMs: 20 });
  await assert.rejects(result, (error) => error.code === "request_body_timeout");
});
