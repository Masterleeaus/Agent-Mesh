/**
 * Bounded, deterministic LocalBrain core for Titan Code Interaction Engine.
 *
 * LocalBrain interprets input through the deterministic intent classifier,
 * selects only caller-supplied local context that matches canonical scope,
 * scores confidence, and recommends clarification/escalation. It never calls
 * providers, Bridge, Ollama, network APIs, tools, repository writers or Plan Runner.
 */
(() => {
  type JsonPrimitive = string | number | boolean | null;
  type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

  type InteractionContextLike = Readonly<{
    schema: "titan-interaction/context/v1";
    interaction_id: string;
    company_id: string;
    actor_id: string;
    device_id: string;
    session_id: string;
    correlation_id: string;
    surface: string;
  }>;

  type IntentLike = Readonly<{
    schema: "titan-interaction/intent/v1";
    intent_id: string;
    company_id: string;
    correlation_id: string;
    kind: string;
    confidence: number;
    source: "deterministic";
    slots?: Readonly<Record<string, JsonValue>>;
  }>;

  type LocalContextCandidate = Readonly<{
    context_id: string;
    company_id: string;
    actor_id?: string;
    device_id?: string;
    session_id?: string;
    relevance?: number;
    data?: Readonly<Record<string, JsonValue>>;
  }>;

  type EscalationRecommendation = "none" | "clarify" | "optional_local_model" | "optional_provider";
  type LocalBrainDisposition = "resolved" | "needs_input" | "escalation_recommended";

  type LocalBrainResult = Readonly<{
    schema: "titan-code-interaction-localbrain-result/v1";
    version: 1;
    interaction_id: string;
    company_id: string;
    correlation_id: string;
    intent: IntentLike;
    confidence: number;
    disposition: LocalBrainDisposition;
    escalation: EscalationRecommendation;
    selected_context_ids: readonly string[];
    cloud_used: false;
    network_used: false;
    provider_used: false;
    bridge_used: false;
    authority: Readonly<{
      plan_advance: false;
      plan_complete: false;
      canonical_promote: false;
      merge: false;
      verification: false;
      repository_write: false;
      shell: false;
      database_mutation: false;
      capability_execute: false;
    }>;
  }>;

  type LocalBrainOptions = Readonly<{
    local_context?: readonly LocalContextCandidate[];
    minimum_confidence?: number;
    model_escalation_confidence?: number;
    provider_escalation_confidence?: number;
    max_context_items?: number;
  }>;

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
  } as const);

  function fail(code: string): never { throw new Error(code); }

  function requireContext(value: unknown): InteractionContextLike {
    const contracts = (globalThis as typeof globalThis & {
      TitanInteractionContracts?: { normalize(name: string, value: unknown): unknown };
    }).TitanInteractionContracts;
    if (!contracts) fail("ERR_LOCALBRAIN_CONTRACTS_UNAVAILABLE");
    return contracts.normalize("InteractionContext", value) as InteractionContextLike;
  }

  function classify(input: unknown, context: InteractionContextLike): IntentLike {
    const classifier = (globalThis as typeof globalThis & {
      TitanInteractionIntentClassifier?: { classify(input: unknown, context: unknown): unknown };
    }).TitanInteractionIntentClassifier;
    if (!classifier) fail("ERR_LOCALBRAIN_CLASSIFIER_UNAVAILABLE");
    return classifier.classify(input, context) as IntentLike;
  }

  function boundedConfidence(value: unknown, fallback: number): number {
    if (value === undefined) return fallback;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
      fail("ERR_LOCALBRAIN_CONFIDENCE_THRESHOLD_INVALID");
    }
    return value;
  }

  function boundedPositiveInteger(value: unknown, fallback: number, max: number): number {
    if (value === undefined) return fallback;
    if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > max) {
      fail("ERR_LOCALBRAIN_CONTEXT_LIMIT_INVALID");
    }
    return value as number;
  }

  function normalizeContextCandidate(value: unknown): LocalContextCandidate {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail("ERR_LOCALBRAIN_CONTEXT_INVALID");
    const record = value as Record<string, unknown>;
    for (const forbidden of ["tenant_id", "tenant_company_id", "tenantCompanyId", "companyId"]) {
      if (Object.prototype.hasOwnProperty.call(record, forbidden)) fail("ERR_LOCALBRAIN_LEGACY_COMPANY_SCOPE");
    }
    const contextId = typeof record.context_id === "string" ? record.context_id.trim() : "";
    const companyId = typeof record.company_id === "string" ? record.company_id.trim() : "";
    if (!contextId || contextId.length > MAX_CONTEXT_ID) fail("ERR_LOCALBRAIN_CONTEXT_ID_INVALID");
    if (!companyId) fail("ERR_LOCALBRAIN_CONTEXT_COMPANY_REQUIRED");
    const optionalId = (name: string): string | undefined => {
      if (record[name] === undefined) return undefined;
      if (typeof record[name] !== "string" || !(record[name] as string).trim()) fail(`ERR_LOCALBRAIN_${name.toUpperCase()}_INVALID`);
      return (record[name] as string).trim();
    };
    const relevance = record.relevance === undefined ? 0 : boundedConfidence(record.relevance, 0);
    let data: Readonly<Record<string, JsonValue>> | undefined;
    if (record.data !== undefined) {
      if (!record.data || typeof record.data !== "object" || Array.isArray(record.data)) fail("ERR_LOCALBRAIN_CONTEXT_DATA_INVALID");
      const keys = Object.keys(record.data as Record<string, unknown>);
      if (keys.length > 64) fail("ERR_LOCALBRAIN_CONTEXT_DATA_BOUNDS");
      data = Object.freeze(structuredClone(record.data as Record<string, JsonValue>));
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

  function scopeRank(candidate: LocalContextCandidate, context: InteractionContextLike): number {
    if (candidate.company_id !== context.company_id) return -1;
    if (candidate.actor_id !== undefined && candidate.actor_id !== context.actor_id) return -1;
    if (candidate.device_id !== undefined && candidate.device_id !== context.device_id) return -1;
    if (candidate.session_id !== undefined && candidate.session_id !== context.session_id) return -1;
    return (candidate.session_id === context.session_id ? 8 : 0)
      + (candidate.device_id === context.device_id ? 4 : 0)
      + (candidate.actor_id === context.actor_id ? 2 : 0)
      + (candidate.relevance ?? 0);
  }

  function selectLocalContext(values: readonly LocalContextCandidate[] | undefined, context: InteractionContextLike, maxItems: number): readonly LocalContextCandidate[] {
    if (values === undefined) return Object.freeze([]);
    if (!Array.isArray(values) || values.length > MAX_CONTEXT_CANDIDATES) fail("ERR_LOCALBRAIN_CONTEXT_BOUNDS");
    const normalized = values.map(normalizeContextCandidate);
    const selected = normalized
      .map((candidate, index) => ({ candidate, index, rank: scopeRank(candidate, context) }))
      .filter((entry) => entry.rank >= 0)
      .sort((a, b) => b.rank - a.rank || a.index - b.index)
      .slice(0, maxItems)
      .map((entry) => entry.candidate);
    return Object.freeze(selected);
  }

  function decideDisposition(intent: IntentLike, minimum: number, modelThreshold: number, providerThreshold: number): { disposition: LocalBrainDisposition; escalation: EscalationRecommendation } {
    if (providerThreshold > modelThreshold || modelThreshold > minimum) fail("ERR_LOCALBRAIN_THRESHOLD_ORDER_INVALID");
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

  function reason(input: unknown, contextValue: unknown, options: LocalBrainOptions = {}): LocalBrainResult {
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
    schema: "titan-code-interaction-localbrain/v1" as const,
    version: 1 as const,
    mode: "bounded_deterministic_offline" as const,
    cloud_used: false as const,
    network_required: false as const,
    provider_required: false as const,
    bridge_required: false as const,
    thresholds: Object.freeze({
      minimum_confidence: DEFAULT_MINIMUM_CONFIDENCE,
      model_escalation_confidence: DEFAULT_MODEL_ESCALATION_CONFIDENCE,
      provider_escalation_confidence: DEFAULT_PROVIDER_ESCALATION_CONFIDENCE
    }),
    reason,
    selectLocalContext
  });

  type LocalBrainGlobal = typeof globalThis & { TitanInteractionLocalBrain?: typeof api };
  const target = globalThis as LocalBrainGlobal;
  if (target.TitanInteractionLocalBrain && target.TitanInteractionLocalBrain.schema !== api.schema) {
    fail("ERR_LOCALBRAIN_CONFLICT");
  }
  target.TitanInteractionLocalBrain = target.TitanInteractionLocalBrain ?? api;
})();
