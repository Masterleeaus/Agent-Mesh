import { createServer as createHttpServer } from "node:http";
import { pathToFileURL } from "node:url";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
const SERVICE = "titan-server-node-health";

export function validateDependencies(dependencies) {
  if (!Array.isArray(dependencies)) throw new TypeError("dependencies_must_be_array");
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

async function probe(dependency, fetchImpl) {
  try {
    const response = await fetchImpl(dependency.url, {
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
  }
}

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  response.end(JSON.stringify(body));
}

export function createServerNodeHealthServer({ dependencies, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch_unavailable");
  const checkedDependencies = validateDependencies(dependencies ?? []);
  const server = createHttpServer(async (request, response) => {
    const method = request.method ?? "GET";
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (method !== "GET") return json(response, 405, { error: "method_not_allowed" });
    if (pathname === "/healthz") {
      return json(response, 200, { service: SERVICE, status: "alive", checked_at: new Date().toISOString() });
    }
    if (pathname !== "/v1/status") return json(response, 404, { error: "not_found" });
    const checks = await Promise.all(checkedDependencies.map((dependency) => probe(dependency, fetchImpl)));
    const unavailableCritical = checks.some((check) => check.critical && check.status !== "healthy");
    const degraded = checks.some((check) => check.status !== "healthy");
    const status = unavailableCritical ? "degraded" : degraded ? "degraded" : "healthy";
    return json(response, unavailableCritical ? 503 : 200, {
      schema: "titan.server-node.health.v1",
      service: SERVICE,
      status,
      ready: !unavailableCritical,
      checked_at: new Date().toISOString(),
      checks,
    });
  });
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
  const host = process.env.TITAN_SERVER_NODE_BIND ?? "127.0.0.1";
  if (!LOOPBACK_HOSTS.has(host)) throw new Error("bind_host_must_be_loopback");
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