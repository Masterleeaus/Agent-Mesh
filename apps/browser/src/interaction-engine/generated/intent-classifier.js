"use strict";
/**
 * Deterministic, browser-local Interaction Engine intent classifier.
 *
 * No provider, Bridge, model, network, clock or random dependency is used.
 * The same normalized input and caller context always yield the same intent.
 */
(() => {
    const MAX_INPUT = 4096;
    const RULES = Object.freeze([
        Object.freeze({ kind: "help", confidence: 0.99, phrases: ["help me", "what can you do", "show help"], tokens: ["help"] }),
        Object.freeze({ kind: "cancel", confidence: 0.99, phrases: ["never mind", "nevermind", "stop this", "cancel this"], tokens: ["cancel", "abort"] }),
        Object.freeze({ kind: "confirm", confidence: 0.97, phrases: ["go ahead", "do it", "sounds good"], tokens: ["confirm", "yes", "proceed"] }),
        Object.freeze({ kind: "reject", confidence: 0.97, phrases: ["do not", "don't", "no thanks"], tokens: ["reject", "decline", "no"] }),
        Object.freeze({ kind: "schedule", confidence: 0.93, phrases: ["book an appointment", "schedule appointment", "make a booking"], tokens: ["schedule", "appointment", "booking"] }),
        Object.freeze({ kind: "quote", confidence: 0.93, phrases: ["create a quote", "make a quote", "send a quote"], tokens: ["quote", "estimate"] }),
        Object.freeze({ kind: "invoice", confidence: 0.93, phrases: ["create an invoice", "send an invoice", "issue invoice"], tokens: ["invoice"] }),
        Object.freeze({ kind: "customer.lookup", confidence: 0.91, phrases: ["find customer", "look up customer", "search customer"], allTokens: ["customer"], tokens: ["find", "lookup", "search"] }),
        Object.freeze({ kind: "job.lookup", confidence: 0.91, phrases: ["find job", "look up job", "search job"], allTokens: ["job"], tokens: ["find", "lookup", "search"] }),
        Object.freeze({ kind: "status", confidence: 0.88, phrases: ["what is the status", "show status"], tokens: ["status", "progress"] })
    ]);
    function fail(code) { throw new Error(code); }
    function normalizeInput(value) {
        if (typeof value !== "string")
            fail("ERR_INTERACTION_CLASSIFIER_INPUT_REQUIRED");
        const trimmed = value.trim();
        if (!trimmed || trimmed.length > MAX_INPUT)
            fail("ERR_INTERACTION_CLASSIFIER_INPUT_INVALID");
        return trimmed
            .normalize("NFKC")
            .toLocaleLowerCase("en")
            .replace(/[’‘]/g, "'")
            .replace(/[^a-z0-9._'\-\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
    function requireContext(value) {
        const contracts = globalThis.TitanInteractionContracts;
        if (!contracts)
            fail("ERR_INTERACTION_CONTRACTS_UNAVAILABLE");
        return contracts.normalize("InteractionContext", value);
    }
    function tokenize(text) {
        return new Set(text.split(" ").filter(Boolean));
    }
    function ruleMatches(rule, text, tokens) {
        if (rule.phrases?.some((phrase) => text.includes(phrase)))
            return true;
        if (rule.allTokens && !rule.allTokens.every((token) => tokens.has(token)))
            return false;
        if (rule.tokens?.some((token) => tokens.has(token)))
            return true;
        return Boolean(rule.allTokens?.length && rule.allTokens.every((token) => tokens.has(token)));
    }
    function stableIntentId(context, kind) {
        const safeKind = kind.replace(/[^a-z0-9._-]/g, "-").slice(0, 96) || "unknown";
        return `intent:${context.interaction_id}:${safeKind}`.slice(0, 256);
    }
    function classify(input, contextValue) {
        const context = requireContext(contextValue);
        const text = normalizeInput(input);
        const tokens = tokenize(text);
        const matched = RULES.find((rule) => ruleMatches(rule, text, tokens));
        const kind = matched?.kind ?? "unknown";
        const confidence = matched?.confidence ?? 0;
        const record = Object.freeze({
            schema: "titan-interaction/intent/v1",
            intent_id: stableIntentId(context, kind),
            company_id: context.company_id,
            correlation_id: context.correlation_id,
            kind,
            confidence,
            source: "deterministic",
            ...(kind === "unknown" ? { slots: Object.freeze({ normalized_input: text.slice(0, 512) }) } : {})
        });
        const contracts = globalThis.TitanInteractionContracts;
        if (!contracts)
            fail("ERR_INTERACTION_CONTRACTS_UNAVAILABLE");
        return contracts.normalize("InteractionIntent", record);
    }
    const api = Object.freeze({
        schema: "titan-code-interaction-intent-classifier/v1",
        version: 1,
        mode: "deterministic_offline",
        network_required: false,
        provider_required: false,
        rules_count: RULES.length,
        classify,
        normalizeInput
    });
    const target = globalThis;
    if (target.TitanInteractionIntentClassifier && target.TitanInteractionIntentClassifier.schema !== api.schema) {
        fail("ERR_INTERACTION_CLASSIFIER_CONFLICT");
    }
    target.TitanInteractionIntentClassifier = target.TitanInteractionIntentClassifier ?? api;
})();
