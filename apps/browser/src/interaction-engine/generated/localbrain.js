"use strict";
/**
 * Bounded, deterministic LocalBrain core for Titan Code Interaction Engine.
 *
 * LocalBrain interprets input through the deterministic intent classifier,
 * selects only caller-supplied local context that matches canonical scope,
 * scores confidence, and recommends clarification/escalation. It never calls
 * providers, Bridge, Ollama, network APIs, tools, repository writers or Plan Runner.
 */
(() => {
    const DEFAULT_MINIMUM_CONFIDENCE = 0.85;
    const DEFAULT_MODEL_ESCALATION_CONFIDENCE = 0.55;
    const DEFAULT_PROVIDER_ESCALATION_CONFIDENCE = 0.25;
    const DEFAULT_MAX_CONTEXT_ITEMS = 8;
    const MAX_CONTEXT_CANDIDATES = 64;
    const MAX_CONTEXT_ID = 256;
    const authority = Object.freeze({
        plan_advance: false,
        plan_complete: false,
        canonical_promote: false,
        merge: false,
        verification: false,
        repository_write: false,
        shell: false,
        database_mutation: false,
        capability_execute: false
    });
    function fail(code) { throw new Error(code); }
    function requireContext(value) {
        const contracts = globalThis.TitanInteractionContracts;
        if (!contracts)
            fail("ERR_LOCALBRAIN_CONTRACTS_UNAVAILABLE");
        return contracts.normalize("InteractionContext", value);
    }
    function classify(input, context) {
        const classifier = globalThis.TitanInteractionIntentClassifier;
        if (!classifier)
            fail("ERR_LOCALBRAIN_CLASSIFIER_UNAVAILABLE");
        return classifier.classify(input, context);
    }
    function boundedConfidence(value, fallback) {
        if (value === undefined)
            return fallback;
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
            fail("ERR_LOCALBRAIN_CONFIDENCE_THRESHOLD_INVALID");
        }
        return value;
    }
    function boundedPositiveInteger(value, fallback, max) {
        if (value === undefined)
            return fallback;
        if (!Number.isInteger(value) || value < 1 || value > max) {
            fail("ERR_LOCALBRAIN_CONTEXT_LIMIT_INVALID");
        }
        return value;
    }
    function normalizeContextCandidate(value) {
        if (!value || typeof value !== "object" || Array.isArray(value))
            fail("ERR_LOCALBRAIN_CONTEXT_INVALID");
        const record = value;
        for (const forbidden of ["tenant_id", "tenant_company_id", "tenantCompanyId", "companyId"]) {
            if (Object.prototype.hasOwnProperty.call(record, forbidden))
                fail("ERR_LOCALBRAIN_LEGACY_COMPANY_SCOPE");
        }
        const contextId = typeof record.context_id === "string" ? record.context_id.trim() : "";
        const companyId = typeof record.company_id === "string" ? record.company_id.trim() : "";
        if (!contextId || contextId.length > MAX_CONTEXT_ID)
            fail("ERR_LOCALBRAIN_CONTEXT_ID_INVALID");
        if (!companyId)
            fail("ERR_LOCALBRAIN_CONTEXT_COMPANY_REQUIRED");
        const optionalId = (name) => {
            if (record[name] === undefined)
                return undefined;
            if (typeof record[name] !== "string" || !record[name].trim())
                fail(`ERR_LOCALBRAIN_${name.toUpperCase()}_INVALID`);
            return record[name].trim();
        };
        const relevance = record.relevance === undefined ? 0 : boundedConfidence(record.relevance, 0);
        let data;
        if (record.data !== undefined) {
            if (!record.data || typeof record.data !== "object" || Array.isArray(record.data))
                fail("ERR_LOCALBRAIN_CONTEXT_DATA_INVALID");
            const keys = Object.keys(record.data);
            if (keys.length > 64)
                fail("ERR_LOCALBRAIN_CONTEXT_DATA_BOUNDS");
            data = Object.freeze(structuredClone(record.data));
        }
        return Object.freeze({
            context_id: contextId,
            company_id: companyId,
            ...(optionalId("actor_id") === undefined ? {} : { actor_id: optionalId("actor_id") }),
            ...(optionalId("device_id") === undefined ? {} : { device_id: optionalId("device_id") }),
            ...(optionalId("session_id") === undefined ? {} : { session_id: optionalId("session_id") }),
            relevance,
            ...(data === undefined ? {} : { data })
        });
    }
    function scopeRank(candidate, context) {
        if (candidate.company_id !== context.company_id)
            return -1;
        if (candidate.actor_id !== undefined && candidate.actor_id !== context.actor_id)
            return -1;
        if (candidate.device_id !== undefined && candidate.device_id !== context.device_id)
            return -1;
        if (candidate.session_id !== undefined && candidate.session_id !== context.session_id)
            return -1;
        return (candidate.session_id === context.session_id ? 8 : 0)
            + (candidate.device_id === context.device_id ? 4 : 0)
            + (candidate.actor_id === context.actor_id ? 2 : 0)
            + (candidate.relevance ?? 0);
    }
    function selectLocalContext(values, context, maxItems) {
        if (values === undefined)
            return Object.freeze([]);
        if (!Array.isArray(values) || values.length > MAX_CONTEXT_CANDIDATES)
            fail("ERR_LOCALBRAIN_CONTEXT_BOUNDS");
        const normalized = values.map(normalizeContextCandidate);
        const selected = normalized
            .map((candidate, index) => ({ candidate, index, rank: scopeRank(candidate, context) }))
            .filter((entry) => entry.rank >= 0)
            .sort((a, b) => b.rank - a.rank || a.index - b.index)
            .slice(0, maxItems)
            .map((entry) => entry.candidate);
        return Object.freeze(selected);
    }
    function decideDisposition(intent, minimum, modelThreshold, providerThreshold) {
        if (providerThreshold > modelThreshold || modelThreshold > minimum)
            fail("ERR_LOCALBRAIN_THRESHOLD_ORDER_INVALID");
        if (intent.kind !== "unknown" && intent.confidence >= minimum) {
            return { disposition: "resolved", escalation: "none" };
        }
        if (intent.confidence >= modelThreshold) {
            return { disposition: "needs_input", escalation: "clarify" };
        }
        if (intent.confidence >= providerThreshold) {
            return { disposition: "escalation_recommended", escalation: "optional_local_model" };
        }
        return { disposition: "escalation_recommended", escalation: "optional_provider" };
    }
    function reason(input, contextValue, options = {}) {
        const context = requireContext(contextValue);
        const minimum = boundedConfidence(options.minimum_confidence, DEFAULT_MINIMUM_CONFIDENCE);
        const modelThreshold = boundedConfidence(options.model_escalation_confidence, DEFAULT_MODEL_ESCALATION_CONFIDENCE);
        const providerThreshold = boundedConfidence(options.provider_escalation_confidence, DEFAULT_PROVIDER_ESCALATION_CONFIDENCE);
        const maxItems = boundedPositiveInteger(options.max_context_items, DEFAULT_MAX_CONTEXT_ITEMS, DEFAULT_MAX_CONTEXT_ITEMS);
        const intent = classify(input, context);
        const selected = selectLocalContext(options.local_context, context, maxItems);
        const decision = decideDisposition(intent, minimum, modelThreshold, providerThreshold);
        return Object.freeze({
            schema: "titan-code-interaction-localbrain-result/v1",
            version: 1,
            interaction_id: context.interaction_id,
            company_id: context.company_id,
            correlation_id: context.correlation_id,
            intent,
            confidence: intent.confidence,
            disposition: decision.disposition,
            escalation: decision.escalation,
            selected_context_ids: Object.freeze(selected.map((candidate) => candidate.context_id)),
            cloud_used: false,
            network_used: false,
            provider_used: false,
            bridge_used: false,
            authority
        });
    }
    const api = Object.freeze({
        schema: "titan-code-interaction-localbrain/v1",
        version: 1,
        mode: "bounded_deterministic_offline",
        cloud_used: false,
        network_required: false,
        provider_required: false,
        bridge_required: false,
        thresholds: Object.freeze({
            minimum_confidence: DEFAULT_MINIMUM_CONFIDENCE,
            model_escalation_confidence: DEFAULT_MODEL_ESCALATION_CONFIDENCE,
            provider_escalation_confidence: DEFAULT_PROVIDER_ESCALATION_CONFIDENCE
        }),
        reason,
        selectLocalContext
    });
    const target = globalThis;
    if (target.TitanInteractionLocalBrain && target.TitanInteractionLocalBrain.schema !== api.schema) {
        fail("ERR_LOCALBRAIN_CONFLICT");
    }
    target.TitanInteractionLocalBrain = target.TitanInteractionLocalBrain ?? api;
})();
