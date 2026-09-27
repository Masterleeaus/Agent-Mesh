"use strict";
(() => {
    const MAX_ID = 256, MAX_COMPLETED = 256;
    const LEGACY = new Set(["tenant_id", "tenant_company_id", "tenantCompanyId", "companyId"]);
    const authority = Object.freeze({ capability_execute: false, plan_advance: false, plan_complete: false, canonical_promote: false, merge: false, verification: false, repository_write: false, shell: false, database_mutation: false });
    const fail = (c) => { throw new Error(c); };
    const rec = (v, c = "ERR_JOURNEY_RECORD") => { if (!v || typeof v !== "object" || Array.isArray(v))
        fail(c); return v; };
    const str = (v, n) => { if (typeof v !== "string")
        fail(`ERR_JOURNEY_${n.toUpperCase()}_INVALID`); const value = v; if (!value.trim() || value.trim().length > MAX_ID)
        fail(`ERR_JOURNEY_${n.toUpperCase()}_INVALID`); return value.trim(); };
    const noLegacy = (r) => { for (const k of LEGACY)
        if (Object.prototype.hasOwnProperty.call(r, k))
            fail("ERR_JOURNEY_LEGACY_COMPANY_SCOPE"); };
    const contracts = () => { const c = globalThis.TitanInteractionContracts; if (!c || c.schema !== "titan-code-interaction-contracts/v1")
        fail("ERR_JOURNEY_CONTRACTS_REQUIRED"); return c; };
    const freeze = (v) => { if (v && typeof v === "object") {
        Object.freeze(v);
        for (const x of Object.values(v))
            if (x && typeof x === "object" && !Object.isFrozen(x))
                freeze(x);
    } return v; };
    function definition(v) { return contracts().normalize("JourneyDefinition", v); }
    function stepMap(d) { return new Map(d.steps.map((s) => [s.step_id, s])); }
    function context(v) { return contracts().normalize("InteractionContext", v); }
    function normalizeState(v, dv) {
        const r = rec(v);
        noLegacy(r);
        if (r.schema !== "titan-interaction/journey-state/v1")
            fail("ERR_JOURNEY_STATE_SCHEMA");
        const completed = Array.isArray(r.completed_step_ids) ? r.completed_step_ids.map((x) => str(x, "completed_step_id")) : fail("ERR_JOURNEY_COMPLETED_STEPS_INVALID");
        if (completed.length > MAX_COMPLETED || new Set(completed).size !== completed.length)
            fail("ERR_JOURNEY_COMPLETED_STEPS_INVALID");
        const status = r.status;
        if (!["active", "paused", "completed", "cancelled"].includes(String(status)))
            fail("ERR_JOURNEY_STATUS_INVALID");
        if (!Number.isInteger(r.revision) || Number(r.revision) < 0)
            fail("ERR_JOURNEY_REVISION_INVALID");
        const out = { schema: r.schema, state_id: str(r.state_id, "state_id"), journey_id: str(r.journey_id, "journey_id"), journey_version: str(r.journey_version, "journey_version"), company_id: str(r.company_id, "company_id"), actor_id: str(r.actor_id, "actor_id"), device_id: str(r.device_id, "device_id"), correlation_id: str(r.correlation_id, "correlation_id"), current_step_id: str(r.current_step_id, "current_step_id"), completed_step_ids: completed, status, revision: Number(r.revision) };
        if (dv) {
            const d = definition(dv), m = stepMap(d);
            if (out.company_id !== d.company_id)
                fail("ERR_JOURNEY_COMPANY_SCOPE_MISMATCH");
            if (out.journey_id !== d.journey_id || out.journey_version !== d.version)
                fail("ERR_JOURNEY_DEFINITION_MISMATCH");
            if (!m.has(out.current_step_id) || completed.some(x => !m.has(x)))
                fail("ERR_JOURNEY_STEP_UNKNOWN");
        }
        return freeze(out);
    }
    function create(dv, cv) { const d = definition(dv), c = context(cv); if (d.company_id !== c.company_id)
        fail("ERR_JOURNEY_COMPANY_SCOPE_MISMATCH"); return normalizeState({ schema: "titan-interaction/journey-state/v1", state_id: `journey:${d.journey_id}:${c.session_id}`, journey_id: d.journey_id, journey_version: d.version, company_id: d.company_id, actor_id: c.actor_id, device_id: c.device_id, correlation_id: c.correlation_id, current_step_id: d.initial_step_id, completed_step_ids: [], status: "active", revision: 0 }, d); }
    function assertContext(s, cv) { const c = context(cv); if (c.company_id !== s.company_id || c.actor_id !== s.actor_id || c.device_id !== s.device_id || c.correlation_id !== s.correlation_id)
        fail("ERR_JOURNEY_CONTEXT_SCOPE_MISMATCH"); return c; }
    function transition(dv, sv, cv, action) {
        const d = definition(dv), s = normalizeState(sv, d);
        assertContext(s, cv);
        if (s.status === "completed" || s.status === "cancelled")
            fail("ERR_JOURNEY_TERMINAL_STATE");
        if (action === "pause") {
            if (s.status !== "active")
                fail("ERR_JOURNEY_STATE_TRANSITION");
            return normalizeState({ ...s, status: "paused", revision: s.revision + 1 }, d);
        }
        if (action === "resume") {
            if (s.status !== "paused")
                fail("ERR_JOURNEY_STATE_TRANSITION");
            return normalizeState({ ...s, status: "active", revision: s.revision + 1 }, d);
        }
        if (action === "cancel")
            return normalizeState({ ...s, status: "cancelled", revision: s.revision + 1 }, d);
        if (s.status !== "active")
            fail("ERR_JOURNEY_STATE_TRANSITION");
        const m = stepMap(d), cur = m.get(s.current_step_id);
        if (!cur)
            fail("ERR_JOURNEY_STEP_UNKNOWN");
        const done = Array.from(new Set([...s.completed_step_ids, s.current_step_id]));
        const next = cur.next_step_id ?? null;
        return normalizeState({ ...s, current_step_id: next || s.current_step_id, completed_step_ids: done, status: next ? "active" : "completed", revision: s.revision + 1 }, d);
    }
    function serialize(sv, dv) { return JSON.stringify(normalizeState(sv, dv)); }
    function restore(text, dv, cv) { if (typeof text !== "string")
        fail("ERR_JOURNEY_SERIALIZED_STATE_INVALID"); const serialized = text; if (serialized.length > 65536)
        fail("ERR_JOURNEY_SERIALIZED_STATE_INVALID"); let parsed; try {
        parsed = JSON.parse(serialized);
    }
    catch {
        fail("ERR_JOURNEY_SERIALIZED_STATE_INVALID");
    } ; const s = normalizeState(parsed, dv); assertContext(s, cv); return s; }
    const api = freeze({ schema: "titan-code-journey-runtime/v1", version: 1, deterministic: true, network_required: false, provider_required: false, durable_state_format: "json_v1", authority, createState: create, normalizeState, advance: (d, s, c) => transition(d, s, c, "advance"), pause: (d, s, c) => transition(d, s, c, "pause"), resume: (d, s, c) => transition(d, s, c, "resume"), cancel: (d, s, c) => transition(d, s, c, "cancel"), serialize, restore });
    const g = globalThis, existing = g.TitanInteractionJourneyRuntime;
    if (existing && existing.schema !== api.schema)
        fail("ERR_JOURNEY_RUNTIME_CONFLICT");
    if (!existing)
        g.TitanInteractionJourneyRuntime = api;
})();
