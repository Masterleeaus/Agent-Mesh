(() => {
  "use strict";

  type JsonRecord = Readonly<Record<string, unknown>>;
  type Availability = "local" | "deferred" | "online_required";
  type Risk = "low" | "medium" | "high" | "critical";

  type CapabilityIntent = Readonly<{
    schema: "titan-interaction/capability-intent/v1";
    capability_intent_id: string;
    company_id: string;
    correlation_id: string;
    capability_id: string;
    availability: Availability;
    risk: Risk;
    parameters?: Readonly<Record<string, unknown>>;
  }>;

  type InteractionContext = Readonly<{
    schema: "titan-interaction/context/v1";
    company_id: string;
    actor_id: string;
    device_id: string;
    correlation_id: string;
    session_id?: string;
  }>;

  type RegistryRecord = Readonly<Record<string, unknown>>;
  type RegistrySnapshot = Readonly<{
    capabilities?: ReadonlyArray<RegistryRecord>;
    repositoryCapabilities?: ReadonlyArray<RegistryRecord>;
  }>;

  type RouteResult = Readonly<{
    schema: "titan-interaction/capability-route/v1";
    capability_intent_id: string;
    company_id: string;
    correlation_id: string;
    capability_id: string;
    known: boolean;
    route: Availability | "unavailable";
    approval_required: boolean;
    executable: false;
    reason: string;
    source: "registry_snapshot" | "shared_registry" | "none";
    network_used: false;
    provider_used: false;
    bridge_used: false;
    authority: Readonly<{
      capability_execute: false;
      plan_advance: false;
      plan_complete: false;
      canonical_promote: false;
      merge: false;
      verification: false;
      repository_write: false;
    }>;
  }>;

  const MAX_CAPABILITIES = 512;
  const MAX_ID = 256;
  const MAX_META_STRING = 512;
  const allowedAvailability = new Set<Availability>(["local", "deferred", "online_required"]);
  const allowedRisk = new Set<Risk>(["low", "medium", "high", "critical"]);

  function fail(code: string): never { throw new Error(code); }
  function record(value: unknown, code = "ERR_INTERACTION_CAPABILITY_ROUTER_RECORD_INVALID"): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
    return value as Record<string, unknown>;
  }
  function str(value: unknown, field: string, max = MAX_ID): string {
    if (typeof value !== "string") fail(`ERR_INTERACTION_CAPABILITY_ROUTER_${field.toUpperCase()}_INVALID`);
    const out = value.trim();
    if (!out || out.length > max) fail(`ERR_INTERACTION_CAPABILITY_ROUTER_${field.toUpperCase()}_INVALID`);
    return out;
  }
  function rejectLegacyTenantAliases(value: Record<string, unknown>): void {
    for (const key of ["tenant_company_id", "tenant_id", "tenantCompanyId", "tenantId"]) {
      if (Object.prototype.hasOwnProperty.call(value, key)) fail("ERR_INTERACTION_LEGACY_TENANT_ALIAS_REJECTED");
    }
  }
  function freeze<T>(value: T): T {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
    return value;
  }
  function normalizeContext(value: unknown): InteractionContext {
    const input = record(value, "ERR_INTERACTION_CAPABILITY_ROUTER_CONTEXT_INVALID");
    rejectLegacyTenantAliases(input);
    if (input.schema !== "titan-interaction/context/v1") fail("ERR_INTERACTION_CAPABILITY_ROUTER_CONTEXT_SCHEMA_INVALID");
    return freeze({
      schema: "titan-interaction/context/v1" as const,
      company_id: str(input.company_id, "company_id"),
      actor_id: str(input.actor_id, "actor_id"),
      device_id: str(input.device_id, "device_id"),
      correlation_id: str(input.correlation_id, "correlation_id"),
      ...(input.session_id === undefined ? {} : { session_id: str(input.session_id, "session_id") })
    });
  }
  function normalizeIntent(value: unknown): CapabilityIntent {
    const contracts = (globalThis as typeof globalThis & { TitanInteractionContracts?: { normalize?: (name: string, value: unknown) => unknown } }).TitanInteractionContracts;
    if (!contracts?.normalize) fail("ERR_INTERACTION_CONTRACTS_UNAVAILABLE");
    const normalized = contracts.normalize("CapabilityIntent", value) as CapabilityIntent;
    return normalized;
  }
  function boundedRecords(input: unknown): RegistryRecord[] {
    if (input === undefined) return [];
    if (!Array.isArray(input)) fail("ERR_INTERACTION_CAPABILITY_ROUTER_REGISTRY_INVALID");
    if (input.length > MAX_CAPABILITIES) fail("ERR_INTERACTION_CAPABILITY_ROUTER_REGISTRY_LIMIT");
    return input.map((item) => {
      const r = record(item, "ERR_INTERACTION_CAPABILITY_ROUTER_REGISTRY_RECORD_INVALID");
      const id = str(r.id, "registry_id");
      const out: Record<string, unknown> = { id };
      for (const key of ["availability", "offline_policy", "risk", "readOnly", "local", "requiresOnline", "requiresProvider"]) {
        const v = r[key];
        if (v === undefined) continue;
        if (typeof v === "string") out[key] = v.slice(0, MAX_META_STRING);
        else if (typeof v === "boolean") out[key] = v;
      }
      return freeze(out);
    });
  }
  function normalizeSnapshot(value: unknown): RegistrySnapshot {
    const r = value === undefined ? {} : record(value, "ERR_INTERACTION_CAPABILITY_ROUTER_REGISTRY_INVALID");
    return freeze({
      capabilities: boundedRecords(r.capabilities),
      repositoryCapabilities: boundedRecords(r.repositoryCapabilities)
    });
  }
  function readSharedRegistry(): RegistrySnapshot | null {
    const registry = (globalThis as typeof globalThis & { CodeeCapabilityRegistry?: { snapshot?: () => unknown } }).CodeeCapabilityRegistry;
    if (!registry?.snapshot) return null;
    return normalizeSnapshot(registry.snapshot());
  }
  function findCapability(snapshot: RegistrySnapshot, capabilityId: string): RegistryRecord | null {
    const all = [...(snapshot.capabilities ?? []), ...(snapshot.repositoryCapabilities ?? [])];
    return all.find((item) => item.id === capabilityId) ?? null;
  }
  function deriveRoute(intent: CapabilityIntent, capability: RegistryRecord): Availability {
    const declared = capability.availability ?? capability.offline_policy;
    if (typeof declared === "string") {
      if (declared === "allowed" || declared === "local") return "local";
      if (declared === "deferred") return "deferred";
      if (declared === "online_required") return "online_required";
    }
    if (capability.requiresOnline === true || capability.requiresProvider === true) return "online_required";
    if (capability.local === true) return "local";
    return intent.availability;
  }
  function route(value: unknown, contextValue: unknown, registrySnapshot?: unknown): RouteResult {
    const intentRecord = record(value, "ERR_INTERACTION_CAPABILITY_ROUTER_INTENT_INVALID");
    rejectLegacyTenantAliases(intentRecord);
    const contextRecord = record(contextValue, "ERR_INTERACTION_CAPABILITY_ROUTER_CONTEXT_INVALID");
    rejectLegacyTenantAliases(contextRecord);

    const intent = normalizeIntent(value);
    const context = normalizeContext(contextValue);
    if (intent.company_id !== context.company_id) fail("ERR_INTERACTION_COMPANY_SCOPE_MISMATCH");
    if (intent.correlation_id !== context.correlation_id) fail("ERR_INTERACTION_CORRELATION_MISMATCH");
    if (!allowedAvailability.has(intent.availability)) fail("ERR_INTERACTION_AVAILABILITY_INVALID");
    if (!allowedRisk.has(intent.risk)) fail("ERR_INTERACTION_RISK_INVALID");

    const explicit = registrySnapshot === undefined ? null : normalizeSnapshot(registrySnapshot);
    const shared = explicit ? null : readSharedRegistry();
    const snapshot = explicit ?? shared ?? freeze({ capabilities: [], repositoryCapabilities: [] });
    const source: RouteResult["source"] = explicit ? "registry_snapshot" : shared ? "shared_registry" : "none";
    const capability = findCapability(snapshot, intent.capability_id);
    const approvalRequired = intent.risk === "high" || intent.risk === "critical";
    const authority = freeze({
      capability_execute: false as const,
      plan_advance: false as const,
      plan_complete: false as const,
      canonical_promote: false as const,
      merge: false as const,
      verification: false as const,
      repository_write: false as const
    });

    if (!capability) {
      return freeze({
        schema: "titan-interaction/capability-route/v1" as const,
        capability_intent_id: intent.capability_intent_id,
        company_id: intent.company_id,
        correlation_id: intent.correlation_id,
        capability_id: intent.capability_id,
        known: false,
        route: "unavailable" as const,
        approval_required: approvalRequired,
        executable: false as const,
        reason: "unknown_capability",
        source,
        network_used: false as const,
        provider_used: false as const,
        bridge_used: false as const,
        authority
      });
    }

    const selected = deriveRoute(intent, capability);
    return freeze({
      schema: "titan-interaction/capability-route/v1" as const,
      capability_intent_id: intent.capability_intent_id,
      company_id: intent.company_id,
      correlation_id: intent.correlation_id,
      capability_id: intent.capability_id,
      known: true,
      route: selected,
      approval_required: approvalRequired,
      executable: false as const,
      reason: approvalRequired ? "approval_required" : `route_${selected}`,
      source,
      network_used: false as const,
      provider_used: false as const,
      bridge_used: false as const,
      authority
    });
  }

  const api = freeze({
    schema: "titan-code-interaction-capability-router/v1" as const,
    version: 1 as const,
    max_registry_entries: MAX_CAPABILITIES,
    route,
    authority: freeze({ capability_execute: false as const, plan_advance: false as const, canonical_promote: false as const })
  });

  const target = globalThis as typeof globalThis & { TitanInteractionCapabilityRouter?: typeof api };
  if (target.TitanInteractionCapabilityRouter && target.TitanInteractionCapabilityRouter.schema !== api.schema) {
    fail("ERR_INTERACTION_CAPABILITY_ROUTER_CONFLICT");
  }
  target.TitanInteractionCapabilityRouter = target.TitanInteractionCapabilityRouter ?? api;
})();
