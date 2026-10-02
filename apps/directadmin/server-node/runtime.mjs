import { createServer as createHttpServer, request as httpRequest } from "node:http";
import { pathToFileURL } from "node:url";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "[::1]"]);
const SERVICE = "titan-server-node-health";
const MAX_DEPENDENCIES = 16;
const MAX_STATUS_REQUESTS = 32;

export function validateDependencies(dependencies) {
  if (!Array.isArray(dependencies)) throw new TypeError("dependencies_must_be_array");
  if (dependencies.length > MAX_DEPENDENCIES) throw new RangeError("dependency_count_exceeded");
  const seen = new Set();
  return dependencies.map((dependency) => {
    if (!dependency || typeof dependency !== "object") throw new TypeError("dependency_must_be_object");
    const id = String(dependency.id ?? "");
    if (!/^[a-z][a-z0-9_-]{0,63}$/.test(id)) throw new TypeError("dependency_id_invalid");
    if (seen.has(id)) throw new TypeError("dependency_id_duplicate");
    seen.add(id);
    let target;
    try { target = new URL(dependency.url); } catch { throw new TypeError("dependency_url_invalid"); }
    if (target.protocol !== "http:" || !LOOPBACK_HOSTS.has(target.hostname) || target.username || target.password || target.search || target.hash) {
      throw new TypeError("dependency_target_must_be_loopback_http");
    }
    const timeoutMs = dependency.timeout_ms ?? 1200;
    if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 5000) throw new TypeError("dependency_timeout_invalid");
    return Object.freeze({ id, url: target.href, critical: dependency.critical !== false, timeoutMs });
  });
}

function fetchLoopbackHealth(url, { signal, headers }) {
  return new Promise((resolve, reject) => {
    // A private agent connects directly. Node's environment proxy must not route
    // loopback probes through an external proxy, and redirects are never followed.
    const request = httpRequest(url, { method: "GET", headers, signal, agent: false }, (response) => {
      const status = response.statusCode;
      response.destroy();
      resolve({ ok: status >= 200 && status < 300, status, body: null });
    });
    request.on("error", reject);
    request.end();
  });
}

async function probe(dependency, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(dependency.url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(dependency.timeoutMs),
      redirect: "error",
    });
    return Object.freeze({
      id: dependency.id,
      critical: dependency.critical,
      status: response.ok ? "healthy" : "unhealthy",
      http_status: response.status,
    });
  } catch {
    return Object.freeze({ id: dependency.id, critical: dependency.critical, status: "unreachable", http_status: null });
  } finally {
    // Only HTTP status is observed. Never retain or consume arbitrary provider bodies.
    try { await response?.body?.cancel(); } catch { /* The probe result is already observed. */ }
  }
}

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  response.end(JSON.stringify(body));
}

export function createServerNodeHealthServer({ dependencies, fetchImpl = fetchLoopbackHealth, maxStatusRequests = MAX_STATUS_REQUESTS } = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch_unavailable");
  if (!Number.isInteger(maxStatusRequests) || maxStatusRequests < 1 || maxStatusRequests > MAX_STATUS_REQUESTS) throw new RangeError("status_request_limit_invalid");
  const checkedDependencies = validateDependencies(dependencies ?? []);
  let activeStatusRequests = 0;
  let pendingObservation;
  const observe = () => {
    if (!pendingObservation) {
      pendingObservation = Promise.all(checkedDependencies.map((dependency) => probe(dependency, fetchImpl)))
        .then((checks) => ({ checks, checked_at: new Date().toISOString() }))
        .finally(() => { pendingObservation = undefined; });
    }
    return pendingObservation;
  };
  const server = createHttpServer(async (request, response) => {
    const method = request.method ?? "GET";
    let pathname;
    try {
      const target = request.url ?? "/";
      if (!target.startsWith("/") || target.startsWith("//") || target.includes("#")) throw new Error("invalid_request_target");
      pathname = new URL(target, "http://127.0.0.1").pathname;
    } catch {
      response.setHeader("connection", "close");
      return json(response, 400, { error: "invalid_request_target" });
    }
    if (method !== "GET" || request.headers["transfer-encoding"] || Number(request.headers["content-length"] ?? 0) !== 0) {
      response.setHeader("connection", "close");
      return json(response, method !== "GET" ? 405 : 400, { error: method !== "GET" ? "method_not_allowed" : "request_body_not_allowed" });
    }
    if (pathname === "/healthz") {
      return json(response, 200, { service: SERVICE, status: "alive", checked_at: new Date().toISOString() });
    }
    if (pathname !== "/v1/status") return json(response, 404, { error: "not_found" });
    if (activeStatusRequests >= maxStatusRequests) return json(response, 503, { error: "status_busy", ready: false });
    activeStatusRequests += 1;
    try {
      const { checks, checked_at } = await observe();
      const unconfigured = checkedDependencies.length === 0;
      const unavailableCritical = unconfigured || checks.some((check) => check.critical && check.status !== "healthy");
      const degraded = unavailableCritical || checks.some((check) => check.status !== "healthy");
      if (response.destroyed) return;
      return json(response, unavailableCritical ? 503 : 200, {
        schema: "titan.server-node.health.v1",
        service: SERVICE,
        status: degraded ? "degraded" : "healthy",
        ready: !unavailableCritical,
        checked_at,
        checks,
        ...(unconfigured ? { reason: "dependencies_not_configured" } : {}),
      });
    } catch {
      if (!response.destroyed) return json(response, 503, { error: "observation_unavailable", ready: false });
    } finally {
      activeStatusRequests -= 1;
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 5_000;
  server.keepAliveTimeout = 5_000;
  server.maxConnections = 64;
  return server;
}

function positivePort(value, fallback) {
  const port = Number(value ?? fallback);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("port_invalid");
  return port;
}

function defaultDependencies() {
  const appPort = positivePort(process.env.APP_PORT, 3000);
  const workforcePort = positivePort(process.env.WORKFORCE_PORT, 3010);
  return [
    { id: "web", url: `http://127.0.0.1:${appPort}/api/health`, critical: true },
    { id: "workforce", url: `http://127.0.0.1:${workforcePort}/ready`, critical: true },
  ];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const configuredHost = process.env.TITAN_SERVER_NODE_BIND ?? "127.0.0.1";
  if (!["127.0.0.1", "::1", "[::1]"].includes(configuredHost)) throw new Error("bind_host_must_be_loopback");
  const host = configuredHost === "[::1]" ? "::1" : configuredHost;
  const port = positivePort(process.env.TITAN_SERVER_NODE_PORT, 3099);
  let dependencies;
  if (process.env.TITAN_SERVER_NODE_DEPENDENCIES) {
    try { dependencies = JSON.parse(process.env.TITAN_SERVER_NODE_DEPENDENCIES); } catch { throw new Error("dependencies_json_invalid"); }
  } else { dependencies = defaultDependencies(); }
  const server = createServerNodeHealthServer({ dependencies });
  server.listen(port, host, () => console.log(JSON.stringify({ service: SERVICE, listening: true, host, port })));
  const shutdown = () => server.close(() => process.exit(0));
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
