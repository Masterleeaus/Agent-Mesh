"use strict";
(() => {
    "use strict";
    const MAX_CAPABILITIES = 512;
    const MAX_ID = 256;
    const MAX_META_STRING = 512;
    const allowedAvailability = new Set(["local", "deferred", "online_required"]);
    const allowedRisk = new Set(["low", "medium", "high", "critical"]);
    function fail(code) { throw new Error(code); }
    function record(value, code = "ERR_INTERACTION_CAPABILITY_ROUTER_RECORD_INVALID") {
        if (!value || typeof value !== "object" || Array.isArray(value))
            fail(code);
        return value;
    }
    function str(value, field, max = MAX_ID) {
        if (typeof value !== "string")
            fail(`ERR_INTERACTION_CAPABILITY_ROUTER_${field.toUpperCase()}_INVALID`);
        const out = value.trim();
        if (!out || out.length > max)
            fail(`ERR_INTERACTION_CAPABILITY_ROUTER_${field.toUpperCase()}_INVALID`);
        return out;
    }
    function rejectLegacyTenantAliases(value) {
        for (const key of ["tenant_company_id", "tenant_id", "tenantCompanyId", "tenantId"]) {
            if (Object.prototype.hasOwnProperty.call(value, key))
                fail("ERR_INTERACTION_LEGACY_TENANT_ALIAS_REJECTED");
        }
    }
    function freeze(value) {
        if (!value || typeof value !== "object" || Object.isFrozen(value))
            return value;
        Object.freeze(value);
        for (const child of Object.values(value))
            freeze(child);
        return value;
    }
    function normalizeContext(value) {
        const input = record(value, "ERR_INTERACTION_CAPABILITY_ROUTER_CONTEXT_INVALID");
        rejectLegacyTenantAliases(input);
        if (input.schema !== "titan-interaction/context/v1")
            fail("ERR_INTERACTION_CAPABILITY_ROUTER_CONTEXT_SCHEMA_INVALID");
        return freeze({
            schema: "titan-interaction/context/v1",
            company_id: str(input.company_id, "company_id"),
            actor_id: str(input.actor_id, "actor_id"),
            device_id: str(input.device_id, "device_id"),
            correlation_id: str(input.correlation_id, "correlation_id"),
            ...(input.session_id === undefined ? {} : { session_id: str(input.session_id, "session_id") })
        });
    }
    function normalizeIntent(value) {
        const contracts = globalThis.TitanInteractionContracts;
        if (!contracts?.normalize)
            fail("ERR_INTERACTION_CONTRACTS_UNAVAILABLE");
        const normalized = contracts.normalize("CapabilityIntent", value);
        return normalized;
    }
    function boundedRecords(input) {
        if (input === undefined)
            return [];
        if (!Array.isArray(input))
            fail("ERR_INTERACTION_CAPABILITY_ROUTER_REGISTRY_INVALID");
        if (input.length > MAX_CAPABILITIES)
            fail("ERR_INTERACTION_CAPABILITY_ROUTER_REGISTRY_LIMIT");
        return input.map((item) => {
            const r = record(item, "ERR_INTERACTION_CAPABILITY_ROUTER_REGISTRY_RECORD_INVALID");
            const id = str(r.id, "registry_id");
            const out = { id };
            for (const key of ["availability", "offline_policy", "risk", "readOnly", "local", "requiresOnline", "requiresProvider"]) {
                const v = r[key];
                if (v === undefined)
                    continue;
                if (typeof v === "string")
                    out[key] = v.slice(0, MAX_META_STRING);
                else if (typeof v === "boolean")
                    out[key] = v;
            }
            return freeze(out);
        });
    }
    function normalizeSnapshot(value) {
        const r = value === undefined ? {} : record(value, "ERR_INTERACTION_CAPABILITY_ROUTER_REGISTRY_INVALID");
        return freeze({
            capabilities: boundedRecords(r.capabilities),
            repositoryCapabilities: boundedRecords(r.repositoryCapabilities)
        });
    }
    function readSharedRegistry() {
        const registry = globalThis.CodeeCapabilityRegistry;
        if (!registry?.snapshot)
            return null;
        return normalizeSnapshot(registry.snapshot());
    }
    function findCapability(snapshot, capabilityId) {
        const all = [...(snapshot.capabilities ?? []), ...(snapshot.repositoryCapabilities ?? [])];
        return all.find((item) => item.id === capabilityId) ?? null;
    }
    function deriveRoute(intent, capability) {
        const declared = capability.availability ?? capability.offline_policy;
        if (typeof declared === "string") {
            if (declared === "allowed" || declared === "local")
                return "local";
            if (declared === "deferred")
                return "deferred";
            if (declared === "online_required")
                return "online_required";
        }
        if (capability.requiresOnline === true || capability.requiresProvider === true)
            return "online_required";
        if (capability.local === true)
            return "local";
        return intent.availability;
    }
    function route(value, contextValue, registrySnapshot) {
        const intentRecord = record(value, "ERR_INTERACTION_CAPABILITY_ROUTER_INTENT_INVALID");
        rejectLegacyTenantAliases(intentRecord);
        const contextRecord = record(contextValue, "ERR_INTERACTION_CAPABILITY_ROUTER_CONTEXT_INVALID");
        rejectLegacyTenantAliases(contextRecord);
        const intent = normalizeIntent(value);
        const context = normalizeContext(contextValue);
        if (intent.company_id !== context.company_id)
            fail("ERR_INTERACTION_COMPANY_SCOPE_MISMATCH");
        if (intent.correlation_id !== context.correlation_id)
            fail("ERR_INTERACTION_CORRELATION_MISMATCH");
        if (!allowedAvailability.has(intent.availability))
            fail("ERR_INTERACTION_AVAILABILITY_INVALID");
        if (!allowedRisk.has(intent.risk))
            fail("ERR_INTERACTION_RISK_INVALID");
        const explicit = registrySnapshot === undefined ? null : normalizeSnapshot(registrySnapshot);
        const shared = explicit ? null : readSharedRegistry();
        const snapshot = explicit ?? shared ?? freeze({ capabilities: [], repositoryCapabilities: [] });
        const source = explicit ? "registry_snapshot" : shared ? "shared_registry" : "none";
        const capability = findCapability(snapshot, intent.capability_id);
        const approvalRequired = intent.risk === "high" || intent.risk === "critical";
        const authority = freeze({
            capability_execute: false,
            plan_advance: false,
            plan_complete: false,
            canonical_promote: false,
            merge: false,
            verification: false,
            repository_write: false
        });
        if (!capability) {
            return freeze({
                schema: "titan-interaction/capability-route/v1",
                capability_intent_id: intent.capability_intent_id,
                company_id: intent.company_id,
                correlation_id: intent.correlation_id,
                capability_id: intent.capability_id,
                known: false,
                route: "unavailable",
                approval_required: approvalRequired,
                executable: false,
                reason: "unknown_capability",
                source,
                network_used: false,
                provider_used: false,
                bridge_used: false,
                authority
            });
        }
        const selected = deriveRoute(intent, capability);
        return freeze({
            schema: "titan-interaction/capability-route/v1",
            capability_intent_id: intent.capability_intent_id,
            company_id: intent.company_id,
            correlation_id: intent.correlation_id,
            capability_id: intent.capability_id,
            known: true,
            route: selected,
            approval_required: approvalRequired,
            executable: false,
            reason: approvalRequired ? "approval_required" : `route_${selected}`,
            source,
            network_used: false,
            provider_used: false,
            bridge_used: false,
            authority
        });
    }
    const api = freeze({
        schema: "titan-code-interaction-capability-router/v1",
        version: 1,
        max_registry_entries: MAX_CAPABILITIES,
        route,
        authority: freeze({ capability_execute: false, plan_advance: false, canonical_promote: false })
    });
    const target = globalThis;
    if (target.TitanInteractionCapabilityRouter && target.TitanInteractionCapabilityRouter.schema !== api.schema) {
        fail("ERR_INTERACTION_CAPABILITY_ROUTER_CONFLICT");
    }
    target.TitanInteractionCapabilityRouter = target.TitanInteractionCapabilityRouter ?? api;
})();
