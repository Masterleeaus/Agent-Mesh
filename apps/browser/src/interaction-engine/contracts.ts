/**
 * Browser-native Interaction Engine canonical contracts.
 *
 * Ported from the retained Titan Interaction Engine 10.3.2 contract surface.
 * The browser runtime keeps stable caller-supplied identities and enforces the
 * canonical company_id boundary. It does not create authority or generate IDs.
 */

(() => {
  type JsonPrimitive = string | number | boolean | null;
  type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

  type InteractionAuthorityBoundary = Readonly<{
    plan_advance: false;
    plan_complete: false;
    canonical_promote: false;
    merge: false;
    verification: false;
    repository_write: false;
    shell: false;
    database_mutation: false;
  }>;

  type InteractionContext = Readonly<{
    schema: "titan-interaction/context/v1";
    interaction_id: string;
    company_id: string;
    actor_id: string;
    device_id: string;
    session_id: string;
    correlation_id: string;
    surface: string;
    locale?: string;
    metadata?: Readonly<Record<string, JsonValue>>;
  }>;

  type InteractionIntent = Readonly<{
    schema: "titan-interaction/intent/v1";
    intent_id: string;
    company_id: string;
    correlation_id: string;
    kind: string;
    confidence: number;
    source: "deterministic" | "local_model" | "provider" | "user";
    slots?: Readonly<Record<string, JsonValue>>;
  }>;

  type CapabilityIntent = Readonly<{
    schema: "titan-interaction/capability-intent/v1";
    capability_intent_id: string;
    company_id: string;
    correlation_id: string;
    capability_id: string;
    availability: "local" | "deferred" | "online_required";
    risk: "low" | "medium" | "high" | "critical";
    parameters?: Readonly<Record<string, JsonValue>>;
  }>;

  type PresentationIntent = Readonly<{
    schema: "titan-interaction/presentation-intent/v1";
    presentation_intent_id: string;
    company_id: string;
    correlation_id: string;
    surface: string;
    mode: string;
    payload?: Readonly<Record<string, JsonValue>>;
  }>;

  type InteractionResult = Readonly<{
    schema: "titan-interaction/result/v1";
    result_id: string;
    company_id: string;
    correlation_id: string;
    status: "ok" | "partial" | "needs_input" | "deferred" | "refused" | "error";
    intent?: InteractionIntent;
    capability_intent?: CapabilityIntent;
    presentation_intent?: PresentationIntent;
    data?: JsonValue;
    authority: InteractionAuthorityBoundary;
  }>;

  type WizardStepDefinition = Readonly<{
    step_id: string;
    kind: string;
    required?: boolean;
    fields?: readonly string[];
    next_step_id?: string | null;
  }>;

  type WizardDefinition = Readonly<{
    schema: "titan-interaction/wizard-definition/v1";
    wizard_id: string;
    version: string;
    company_id: string;
    steps: readonly WizardStepDefinition[];
    initial_step_id: string;
  }>;

  type JourneyStepDefinition = Readonly<{
    step_id: string;
    wizard_id?: string;
    capability_id?: string;
    offline_policy: "allowed" | "deferred" | "online_required";
    next_step_id?: string | null;
  }>;

  type JourneyDefinition = Readonly<{
    schema: "titan-interaction/journey-definition/v1";
    journey_id: string;
    version: string;
    company_id: string;
    steps: readonly JourneyStepDefinition[];
    initial_step_id: string;
  }>;

  type ContractName =
    | "InteractionContext"
    | "InteractionIntent"
    | "CapabilityIntent"
    | "PresentationIntent"
    | "InteractionResult"
    | "WizardDefinition"
    | "JourneyDefinition";

  const MAX_ID = 256;
  const MAX_KEY = 128;
  const MAX_STEPS = 256;
  const LEGACY_COMPANY_KEYS = new Set(["tenant_id", "tenant_company_id", "tenantCompanyId", "companyId"]);

  const authorityBoundary: InteractionAuthorityBoundary = Object.freeze({
    plan_advance: false,
    plan_complete: false,
    canonical_promote: false,
    merge: false,
    verification: false,
    repository_write: false,
    shell: false,
    database_mutation: false
  });

  function fail(code: string): never {
    throw new Error(code);
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function requireRecord(value: unknown, code = "ERR_INTERACTION_CONTRACT_RECORD"): Record<string, unknown> {
    if (!isRecord(value)) fail(code);
    return value;
  }

  function requireString(value: unknown, field: string, max = MAX_ID): string {
    if (typeof value !== "string") fail(`ERR_INTERACTION_${field.toUpperCase()}_REQUIRED`);
    const normalized = value.trim();
    if (!normalized || normalized.length > max) fail(`ERR_INTERACTION_${field.toUpperCase()}_INVALID`);
    return normalized;
  }

  function requireCompany(record: Record<string, unknown>): string {
    for (const key of LEGACY_COMPANY_KEYS) {
      if (Object.prototype.hasOwnProperty.call(record, key)) fail("ERR_INTERACTION_LEGACY_COMPANY_SCOPE");
    }
    return requireString(record.company_id, "company_id");
  }

  function requireCorrelation(record: Record<string, unknown>): string {
    return requireString(record.correlation_id, "correlation_id");
  }

  function requireSchema(record: Record<string, unknown>, expected: string): void {
    if (record.schema !== expected) fail("ERR_INTERACTION_SCHEMA_MISMATCH");
  }

  function requireConfidence(value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
      fail("ERR_INTERACTION_CONFIDENCE_INVALID");
    }
    return value;
  }

  function boundedRecord(value: unknown, field: string): Record<string, JsonValue> | undefined {
    if (value === undefined) return undefined;
    const record = requireRecord(value, `ERR_INTERACTION_${field.toUpperCase()}_INVALID`);
    const keys = Object.keys(record);
    if (keys.length > 64 || keys.some((key) => !key || key.length > MAX_KEY)) {
      fail(`ERR_INTERACTION_${field.toUpperCase()}_BOUNDS`);
    }
    return structuredClone(record) as Record<string, JsonValue>;
  }

  function freezeDeep<T>(value: T): Readonly<T> {
    if (value && typeof value === "object") {
      Object.freeze(value);
      for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
    }
    return value as Readonly<T>;
  }

  function sameScope(record: Record<string, unknown>, expectedCompany: string, expectedCorrelation?: string): void {
    if (requireCompany(record) !== expectedCompany) fail("ERR_INTERACTION_COMPANY_SCOPE_MISMATCH");
    if (expectedCorrelation !== undefined && requireCorrelation(record) !== expectedCorrelation) {
      fail("ERR_INTERACTION_CORRELATION_MISMATCH");
    }
  }

  function normalizeContext(value: unknown): InteractionContext {
    const record = requireRecord(value);
    requireSchema(record, "titan-interaction/context/v1");
    const context: InteractionContext = {
      schema: "titan-interaction/context/v1",
      interaction_id: requireString(record.interaction_id, "interaction_id"),
      company_id: requireCompany(record),
      actor_id: requireString(record.actor_id, "actor_id"),
      device_id: requireString(record.device_id, "device_id"),
      session_id: requireString(record.session_id, "session_id"),
      correlation_id: requireCorrelation(record),
      surface: requireString(record.surface, "surface", 128),
      ...(record.locale === undefined ? {} : { locale: requireString(record.locale, "locale", 64) }),
      ...(record.metadata === undefined ? {} : { metadata: boundedRecord(record.metadata, "metadata") })
    };
    return freezeDeep(context) as InteractionContext;
  }

  function normalizeIntent(value: unknown, expectedCompany?: string, expectedCorrelation?: string): InteractionIntent {
    const record = requireRecord(value);
    requireSchema(record, "titan-interaction/intent/v1");
    const company = requireCompany(record);
    const correlation = requireCorrelation(record);
    if (expectedCompany !== undefined && company !== expectedCompany) fail("ERR_INTERACTION_COMPANY_SCOPE_MISMATCH");
    if (expectedCorrelation !== undefined && correlation !== expectedCorrelation) fail("ERR_INTERACTION_CORRELATION_MISMATCH");
    const allowedSources = new Set(["deterministic", "local_model", "provider", "user"]);
    const source = requireString(record.source, "source", 32);
    if (!allowedSources.has(source)) fail("ERR_INTERACTION_INTENT_SOURCE_INVALID");
    const result: InteractionIntent = {
      schema: "titan-interaction/intent/v1",
      intent_id: requireString(record.intent_id, "intent_id"),
      company_id: company,
      correlation_id: correlation,
      kind: requireString(record.kind, "kind", 128),
      confidence: requireConfidence(record.confidence),
      source: source as InteractionIntent["source"],
      ...(record.slots === undefined ? {} : { slots: boundedRecord(record.slots, "slots") })
    };
    return freezeDeep(result) as InteractionIntent;
  }

  function normalizeCapabilityIntent(value: unknown, expectedCompany?: string, expectedCorrelation?: string): CapabilityIntent {
    const record = requireRecord(value);
    requireSchema(record, "titan-interaction/capability-intent/v1");
    const company = requireCompany(record);
    const correlation = requireCorrelation(record);
    if (expectedCompany !== undefined && company !== expectedCompany) fail("ERR_INTERACTION_COMPANY_SCOPE_MISMATCH");
    if (expectedCorrelation !== undefined && correlation !== expectedCorrelation) fail("ERR_INTERACTION_CORRELATION_MISMATCH");
    const availability = requireString(record.availability, "availability", 32);
    const risk = requireString(record.risk, "risk", 32);
    if (!new Set(["local", "deferred", "online_required"]).has(availability)) fail("ERR_INTERACTION_AVAILABILITY_INVALID");
    if (!new Set(["low", "medium", "high", "critical"]).has(risk)) fail("ERR_INTERACTION_RISK_INVALID");
    const result: CapabilityIntent = {
      schema: "titan-interaction/capability-intent/v1",
      capability_intent_id: requireString(record.capability_intent_id, "capability_intent_id"),
      company_id: company,
      correlation_id: correlation,
      capability_id: requireString(record.capability_id, "capability_id"),
      availability: availability as CapabilityIntent["availability"],
      risk: risk as CapabilityIntent["risk"],
      ...(record.parameters === undefined ? {} : { parameters: boundedRecord(record.parameters, "parameters") })
    };
    return freezeDeep(result) as CapabilityIntent;
  }

  function normalizePresentationIntent(value: unknown, expectedCompany?: string, expectedCorrelation?: string): PresentationIntent {
    const record = requireRecord(value);
    requireSchema(record, "titan-interaction/presentation-intent/v1");
    const company = requireCompany(record);
    const correlation = requireCorrelation(record);
    if (expectedCompany !== undefined && company !== expectedCompany) fail("ERR_INTERACTION_COMPANY_SCOPE_MISMATCH");
    if (expectedCorrelation !== undefined && correlation !== expectedCorrelation) fail("ERR_INTERACTION_CORRELATION_MISMATCH");
    const result: PresentationIntent = {
      schema: "titan-interaction/presentation-intent/v1",
      presentation_intent_id: requireString(record.presentation_intent_id, "presentation_intent_id"),
      company_id: company,
      correlation_id: correlation,
      surface: requireString(record.surface, "surface", 128),
      mode: requireString(record.mode, "mode", 128),
      ...(record.payload === undefined ? {} : { payload: boundedRecord(record.payload, "payload") })
    };
    return freezeDeep(result) as PresentationIntent;
  }

  function normalizeResult(value: unknown): InteractionResult {
    const record = requireRecord(value);
    requireSchema(record, "titan-interaction/result/v1");
    const company = requireCompany(record);
    const correlation = requireCorrelation(record);
    const status = requireString(record.status, "status", 32);
    if (!new Set(["ok", "partial", "needs_input", "deferred", "refused", "error"]).has(status)) {
      fail("ERR_INTERACTION_RESULT_STATUS_INVALID");
    }
    const result: InteractionResult = {
      schema: "titan-interaction/result/v1",
      result_id: requireString(record.result_id, "result_id"),
      company_id: company,
      correlation_id: correlation,
      status: status as InteractionResult["status"],
      ...(record.intent === undefined ? {} : { intent: normalizeIntent(record.intent, company, correlation) }),
      ...(record.capability_intent === undefined ? {} : { capability_intent: normalizeCapabilityIntent(record.capability_intent, company, correlation) }),
      ...(record.presentation_intent === undefined ? {} : { presentation_intent: normalizePresentationIntent(record.presentation_intent, company, correlation) }),
      ...(record.data === undefined ? {} : { data: structuredClone(record.data) as JsonValue }),
      authority: authorityBoundary
    };
    return freezeDeep(result) as InteractionResult;
  }

  function normalizeSteps<T extends { step_id: string; next_step_id?: string | null }>(
    raw: unknown,
    mapper: (record: Record<string, unknown>) => T
  ): readonly T[] {
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_STEPS) fail("ERR_INTERACTION_STEPS_INVALID");
    const steps = raw.map((entry) => mapper(requireRecord(entry, "ERR_INTERACTION_STEP_INVALID")));
    const ids = new Set(steps.map((step) => step.step_id));
    if (ids.size !== steps.length) fail("ERR_INTERACTION_DUPLICATE_STEP_ID");
    for (const step of steps) {
      if (step.next_step_id && !ids.has(step.next_step_id)) fail("ERR_INTERACTION_STEP_TARGET_UNKNOWN");
    }
    return freezeDeep(steps) as readonly T[];
  }

  function normalizeWizardDefinition(value: unknown): WizardDefinition {
    const record = requireRecord(value);
    requireSchema(record, "titan-interaction/wizard-definition/v1");
    const steps = normalizeSteps(record.steps, (step): WizardStepDefinition => ({
      step_id: requireString(step.step_id, "step_id"),
      kind: requireString(step.kind, "step_kind", 128),
      ...(step.required === undefined ? {} : { required: Boolean(step.required) }),
      ...(step.fields === undefined ? {} : {
        fields: freezeDeep((Array.isArray(step.fields) ? step.fields : fail("ERR_INTERACTION_FIELDS_INVALID")).map((field) => requireString(field, "field", 128))) as readonly string[]
      }),
      ...(step.next_step_id === undefined ? {} : { next_step_id: step.next_step_id === null ? null : requireString(step.next_step_id, "next_step_id") })
    }));
    const initial = requireString(record.initial_step_id, "initial_step_id");
    if (!steps.some((step) => step.step_id === initial)) fail("ERR_INTERACTION_INITIAL_STEP_UNKNOWN");
    return freezeDeep({
      schema: "titan-interaction/wizard-definition/v1",
      wizard_id: requireString(record.wizard_id, "wizard_id"),
      version: requireString(record.version, "version", 64),
      company_id: requireCompany(record),
      steps,
      initial_step_id: initial
    }) as WizardDefinition;
  }

  function normalizeJourneyDefinition(value: unknown): JourneyDefinition {
    const record = requireRecord(value);
    requireSchema(record, "titan-interaction/journey-definition/v1");
    const steps = normalizeSteps(record.steps, (step): JourneyStepDefinition => {
      const offlinePolicy = requireString(step.offline_policy, "offline_policy", 32);
      if (!new Set(["allowed", "deferred", "online_required"]).has(offlinePolicy)) {
        fail("ERR_INTERACTION_OFFLINE_POLICY_INVALID");
      }
      if (step.wizard_id === undefined && step.capability_id === undefined) fail("ERR_INTERACTION_JOURNEY_STEP_TARGET_REQUIRED");
      return {
        step_id: requireString(step.step_id, "step_id"),
        ...(step.wizard_id === undefined ? {} : { wizard_id: requireString(step.wizard_id, "wizard_id") }),
        ...(step.capability_id === undefined ? {} : { capability_id: requireString(step.capability_id, "capability_id") }),
        offline_policy: offlinePolicy as JourneyStepDefinition["offline_policy"],
        ...(step.next_step_id === undefined ? {} : { next_step_id: step.next_step_id === null ? null : requireString(step.next_step_id, "next_step_id") })
      };
    });
    const initial = requireString(record.initial_step_id, "initial_step_id");
    if (!steps.some((step) => step.step_id === initial)) fail("ERR_INTERACTION_INITIAL_STEP_UNKNOWN");
    return freezeDeep({
      schema: "titan-interaction/journey-definition/v1",
      journey_id: requireString(record.journey_id, "journey_id"),
      version: requireString(record.version, "version", 64),
      company_id: requireCompany(record),
      steps,
      initial_step_id: initial
    }) as JourneyDefinition;
  }

  function serialize(contract: unknown): string {
    return JSON.stringify(contract);
  }

  function deserialize(name: ContractName, serialized: string): unknown {
    if (typeof serialized !== "string" || serialized.length === 0 || serialized.length > 1_000_000) {
      fail("ERR_INTERACTION_SERIALIZED_CONTRACT_INVALID");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(serialized);
    } catch {
      fail("ERR_INTERACTION_SERIALIZED_CONTRACT_INVALID");
    }
    return normalize(name, parsed);
  }

  function normalize(name: ContractName, value: unknown): unknown {
    switch (name) {
      case "InteractionContext": return normalizeContext(value);
      case "InteractionIntent": return normalizeIntent(value);
      case "CapabilityIntent": return normalizeCapabilityIntent(value);
      case "PresentationIntent": return normalizePresentationIntent(value);
      case "InteractionResult": return normalizeResult(value);
      case "WizardDefinition": return normalizeWizardDefinition(value);
      case "JourneyDefinition": return normalizeJourneyDefinition(value);
      default: return fail("ERR_INTERACTION_CONTRACT_UNKNOWN");
    }
  }

  const api = freezeDeep({
    schema: "titan-code-interaction-contracts/v1" as const,
    version: 1 as const,
    company_scope: "company_id" as const,
    normalize,
    serialize,
    deserialize,
    validateScope(value: unknown, expectedCompany: string, expectedCorrelation?: string): true {
      sameScope(requireRecord(value), requireString(expectedCompany, "expected_company_id"), expectedCorrelation);
      return true;
    },
    authority: authorityBoundary
  });

  type TitanInteractionContractsGlobal = typeof globalThis & {
    TitanInteractionContracts?: typeof api;
  };
  const target = globalThis as TitanInteractionContractsGlobal;
  if (target.TitanInteractionContracts && target.TitanInteractionContracts.schema !== api.schema) {
    fail("ERR_INTERACTION_CONTRACTS_CONFLICT");
  }
  target.TitanInteractionContracts = target.TitanInteractionContracts ?? api;
})();
