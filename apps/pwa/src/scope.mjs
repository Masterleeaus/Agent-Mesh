export const TITAN_SURFACES = Object.freeze(["zero", "go", "hub"]);
const LEGACY_TENANT_KEYS = new Set(["tenant_id", "tenant_company_id", "workspace_tenant_id"]);

export function assertCanonicalCompanyBoundary(value, path = "value") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertCanonicalCompanyBoundary(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (LEGACY_TENANT_KEYS.has(key)) throw new Error(`${path}.${key}:legacy-tenant-boundary`);
    assertCanonicalCompanyBoundary(child, `${path}.${key}`);
  }
}

const required = (value, field) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field}:required`);
  return value.trim();
};

export function normalizePwaContext(input) {
  assertCanonicalCompanyBoundary(input, "context");
  const surface = required(input?.surface, "surface").toLowerCase();
  if (!TITAN_SURFACES.includes(surface)) throw new Error("surface:unsupported");
  return Object.freeze({
    company_id: required(input?.company_id, "company_id"),
    actor_id: required(input?.actor_id, "actor_id"),
    device_id: required(input?.device_id, "device_id"),
    surface,
    context_revision: required(input?.context_revision, "context_revision"),
    session_revision: required(input?.session_revision, "session_revision"),
    audience_id: input?.audience_id == null ? null : required(input.audience_id, "audience_id"),
  });
}

function scopeKey(context) {
  const c = normalizePwaContext(context);
  // Revisions are part of the privacy partition: a refreshed or revoked server
  // context must never read projections captured under its predecessor.
  return [c.company_id, c.actor_id, c.device_id, c.surface, c.audience_id ?? "company", c.context_revision, c.session_revision]
    .map(encodeURIComponent).join(":");
}

/**
 * Ephemeral projection working set. It is intentionally memory-only until the
 * canonical credential/key lifecycle and encrypted browser store are defined.
 * It cannot enqueue or authorise a mutation.
 */
export class PwaProjectionWorkingSet {
  #scope;
  #maxEntries;
  #entries = new Map();

  constructor(context, { maxEntries = 64 } = {}) {
    this.#scope = scopeKey(context);
    if (!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > 512) throw new Error("maxEntries:out-of-range");
    this.#maxEntries = maxEntries;
  }

  put(context, projectionId, projection) {
    if (scopeKey(context) !== this.#scope) throw new Error("working-set:scope-changed");
    assertCanonicalCompanyBoundary(projection, "projection");
    if (!projection || projection.company_id !== normalizePwaContext(context).company_id) throw new Error("working-set:company-mismatch");
    const id = required(projectionId, "projection_id");
    if (!this.#entries.has(id) && this.#entries.size >= this.#maxEntries) this.#entries.delete(this.#entries.keys().next().value);
    this.#entries.set(id, structuredClone(projection));
  }

  get(context, projectionId) {
    if (scopeKey(context) !== this.#scope) throw new Error("working-set:scope-changed");
    const result = this.#entries.get(required(projectionId, "projection_id"));
    return result === undefined ? null : structuredClone(result);
  }

  rotate(context) {
    this.#entries.clear();
    this.#scope = scopeKey(context);
  }

  clear() { this.#entries.clear(); }
  get size() { return this.#entries.size; }
}
