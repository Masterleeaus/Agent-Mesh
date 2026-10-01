import { normalizePwaContext } from "./scope.mjs";

/** Read-only, same-origin projection transport. Mutations are deliberately not exposed. */
export function createPwaProjectionClient({ apiBaseUrl, context, fetchImpl = globalThis.fetch, origin = globalThis.location?.origin }) {
  const scope = normalizePwaContext(context);
  if (typeof fetchImpl !== "function") throw new Error("fetch:unavailable");
  if (!apiBaseUrl || !origin) throw new Error("pwa-api:unconfigured");
  const base = new URL(apiBaseUrl, origin);
  if (base.origin !== origin || base.protocol !== "https:" && base.hostname !== "localhost") throw new Error("pwa-api:origin-not-approved");

  return Object.freeze({
    context: scope,
    async get(path, { signal } = {}) {
      if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) throw new Error("pwa-api:path-invalid");
      const url = new URL(path, base);
      if (url.origin !== base.origin) throw new Error("pwa-api:cross-origin-path");
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
