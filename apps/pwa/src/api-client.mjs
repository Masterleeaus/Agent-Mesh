import { normalizePwaContext } from "./scope.mjs";

function hasPathBoundaryEscape(path) {
  const endpointPath = path.split(/[?#]/, 1)[0].slice(1);
  const separatorCount = value => (value.match(/\//g) ?? []).length;
  const hasDotSegment = value => value.split("/").some(segment => segment === "." || segment === "..");
  const allowedSeparators = separatorCount(endpointPath);
  let decoded = endpointPath;

  for (let depth = 0; depth < 8; depth += 1) {
    if (decoded.includes("\\") || hasDotSegment(decoded)) return true;

    let next;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      return true;
    }
    if (next.includes("\\") || hasDotSegment(next) || separatorCount(next) > allowedSeparators) return true;
    if (next === decoded) return false;
    decoded = next;
  }

  return /%[\da-f]{2}/i.test(decoded);
}

/** Read-only, same-origin projection transport. Mutations are deliberately not exposed. */
export function createPwaProjectionClient({ apiBaseUrl, context, fetchImpl = globalThis.fetch, origin = globalThis.location?.origin }) {
  const scope = normalizePwaContext(context);
  if (typeof fetchImpl !== "function") throw new Error("fetch:unavailable");
  if (!apiBaseUrl || !origin) throw new Error("pwa-api:unconfigured");
  const base = new URL(apiBaseUrl, origin);
  if (base.origin !== origin || base.protocol !== "https:" && base.hostname !== "localhost") throw new Error("pwa-api:origin-not-approved");
  const basePath = base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`;

  return Object.freeze({
    context: scope,
    async get(path, { signal } = {}) {
      if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) throw new Error("pwa-api:path-invalid");
      if (hasPathBoundaryEscape(path)) throw new Error("pwa-api:path-invalid");
      const url = new URL(path.slice(1), `${base.origin}${basePath}`);
      if (url.origin !== base.origin || !url.pathname.startsWith(basePath)) throw new Error("pwa-api:path-invalid");
      const response = await fetchImpl(url, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        headers: { accept: "application/json", "x-titan-surface": scope.surface },
        signal,
      });
      if (!response.ok) throw new Error(`pwa-api:http-${response.status}`);
      const data = await response.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("pwa-api:invalid-projection");
      if (data.company_id !== scope.company_id) throw new Error("pwa-api:company-mismatch");
      return Object.freeze(structuredClone(data));
    },
  });
}
