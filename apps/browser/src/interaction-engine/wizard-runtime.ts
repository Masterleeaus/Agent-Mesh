(() => {
  'use strict';

  type JsonPrimitive = string | number | boolean | null;
  type WizardStep = Readonly<{
    step_id: string;
    kind: string;
    required?: boolean;
    fields?: readonly string[];
    next_step_id?: string | null;
  }>;
  type WizardDefinition = Readonly<{
    schema: 'titan-interaction/wizard-definition/v1';
    wizard_id: string;
    version: string;
    company_id: string;
    steps: readonly WizardStep[];
    initial_step_id: string;
  }>;
  type BranchRule = Readonly<{
    field: string;
    operator?: 'equals' | 'not_equals' | 'in' | 'present';
    value?: JsonPrimitive | readonly JsonPrimitive[];
    target_step_id: string | null;
    priority?: number;
  }>;
  type BranchTable = Readonly<Record<string, readonly BranchRule[]>>;

  const MAX_BRANCH_RULES_PER_STEP = 64;
  const MAX_INPUT_FIELDS = 128;
  const LEGACY_COMPANY_KEYS = ['tenant_id', 'tenant_company_id', 'tenantCompanyId', 'companyId'];
  const authority = Object.freeze({
    capability_execute: false,
    plan_advance: false,
    plan_complete: false,
    canonical_promote: false,
    merge: false,
    verification: false,
    repository_write: false,
    shell: false,
    database_mutation: false
  });

  function fail(code: string): never { throw new Error(code); }
  function record(value: unknown, code = 'ERR_WIZARD_RECORD_INVALID'): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code);
    return value as Record<string, unknown>;
  }
  function string(value: unknown, code: string, max = 256): string {
    if (typeof value !== 'string') fail(code);
    const out = value.trim();
    if (!out || out.length > max) fail(code);
    return out;
  }
  function cloneFreeze<T>(value: T): T {
    const cloned = structuredClone(value);
    const freeze = (node: unknown): unknown => {
      if (!node || typeof node !== 'object' || Object.isFrozen(node)) return node;
      for (const child of Object.values(node as Record<string, unknown>)) freeze(child);
      return Object.freeze(node);
    };
    return freeze(cloned) as T;
  }
  function contracts(): { normalize(name: string, value: unknown): unknown } {
    const api = (globalThis as typeof globalThis & { TitanInteractionContracts?: { normalize(name: string, value: unknown): unknown } }).TitanInteractionContracts;
    if (!api) fail('ERR_WIZARD_CONTRACTS_UNAVAILABLE');
    return api;
  }
  function normalizeDefinition(value: unknown): WizardDefinition {
    return contracts().normalize('WizardDefinition', value) as WizardDefinition;
  }
  function assertNoLegacyScope(value: Record<string, unknown>): void {
    for (const key of LEGACY_COMPANY_KEYS) if (Object.prototype.hasOwnProperty.call(value, key)) fail('ERR_WIZARD_LEGACY_COMPANY_SCOPE');
  }
  function stepMap(definition: WizardDefinition): Map<string, WizardStep> {
    return new Map(definition.steps.map((step) => [step.step_id, step]));
  }
  function validateBranchTable(definition: WizardDefinition, raw: unknown): BranchTable {
    if (raw === undefined || raw === null) return Object.freeze({});
    const branchRecord = record(raw, 'ERR_WIZARD_BRANCH_TABLE_INVALID');
    const steps = stepMap(definition);
    const normalized: Record<string, readonly BranchRule[]> = {};
    for (const [stepId, value] of Object.entries(branchRecord)) {
      if (!steps.has(stepId)) fail('ERR_WIZARD_BRANCH_STEP_UNKNOWN');
      if (!Array.isArray(value) || value.length > MAX_BRANCH_RULES_PER_STEP) fail('ERR_WIZARD_BRANCH_RULES_INVALID');
      const rules = value.map((entry, index): BranchRule => {
        const item = record(entry, 'ERR_WIZARD_BRANCH_RULE_INVALID');
        const field = string(item.field, 'ERR_WIZARD_BRANCH_FIELD_INVALID', 128);
        const operator = item.operator === undefined ? 'equals' : string(item.operator, 'ERR_WIZARD_BRANCH_OPERATOR_INVALID', 32);
        if (!['equals', 'not_equals', 'in', 'present'].includes(operator)) fail('ERR_WIZARD_BRANCH_OPERATOR_INVALID');
        const target = item.target_step_id === null ? null : string(item.target_step_id, 'ERR_WIZARD_BRANCH_TARGET_INVALID');
        if (target !== null && !steps.has(target)) fail('ERR_WIZARD_BRANCH_TARGET_UNKNOWN');
        const priority = item.priority === undefined ? index : Number(item.priority);
        if (!Number.isInteger(priority) || priority < 0 || priority > 1_000_000) fail('ERR_WIZARD_BRANCH_PRIORITY_INVALID');
        if (operator === 'in') {
          if (!Array.isArray(item.value) || item.value.length === 0 || item.value.length > 64) fail('ERR_WIZARD_BRANCH_VALUE_INVALID');
        } else if (operator !== 'present' && item.value === undefined) {
          fail('ERR_WIZARD_BRANCH_VALUE_REQUIRED');
        }
        return cloneFreeze({ field, operator: operator as BranchRule['operator'], ...(operator === 'present' ? {} : { value: structuredClone(item.value) as BranchRule['value'] }), target_step_id: target, priority });
      }).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
      normalized[stepId] = Object.freeze(rules);
    }
    return Object.freeze(normalized);
  }
  function safeInputs(raw: unknown): Readonly<Record<string, unknown>> {
    const inputs = raw === undefined ? {} : record(raw, 'ERR_WIZARD_INPUT_INVALID');
    assertNoLegacyScope(inputs);
    const entries = Object.entries(inputs);
    if (entries.length > MAX_INPUT_FIELDS) fail('ERR_WIZARD_INPUT_TOO_LARGE');
    for (const [key, value] of entries) {
      if (!key || key.length > 128) fail('ERR_WIZARD_INPUT_FIELD_INVALID');
      if (typeof value === 'string' && value.length > 16_384) fail('ERR_WIZARD_INPUT_VALUE_TOO_LARGE');
    }
    return cloneFreeze(inputs);
  }
  function present(value: unknown): boolean {
    return value !== undefined && value !== null && (typeof value !== 'string' || value.trim().length > 0);
  }
  function primitiveEquals(left: unknown, right: unknown): boolean {
    return (['string', 'number', 'boolean'].includes(typeof left) || left === null) && left === right;
  }
  function ruleMatches(rule: BranchRule, inputs: Readonly<Record<string, unknown>>): boolean {
    const actual = inputs[rule.field];
    switch (rule.operator) {
      case 'present': return present(actual);
      case 'not_equals': return !primitiveEquals(actual, rule.value);
      case 'in': return Array.isArray(rule.value) && rule.value.some((candidate) => primitiveEquals(actual, candidate));
      case 'equals':
      default: return primitiveEquals(actual, rule.value);
    }
  }
  function requiredFields(step: WizardStep): readonly string[] {
    return step.required ? Object.freeze([...(step.fields ?? [])]) : Object.freeze([]);
  }
  function validateStep(definition: WizardDefinition, stepId: string, rawInputs?: unknown): Readonly<{ valid: boolean; missing_fields: readonly string[]; errors: readonly string[] }> {
    const step = stepMap(definition).get(stepId);
    if (!step) fail('ERR_WIZARD_STEP_UNKNOWN');
    const inputs = safeInputs(rawInputs);
    const missing = requiredFields(step).filter((field) => !present(inputs[field]));
    return cloneFreeze({ valid: missing.length === 0, missing_fields: missing, errors: missing.map((field) => `required:${field}`) });
  }
  function nextStep(definition: WizardDefinition, stepId: string, rawInputs?: unknown, rawBranches?: unknown): string | null {
    const steps = stepMap(definition);
    const step = steps.get(stepId);
    if (!step) fail('ERR_WIZARD_STEP_UNKNOWN');
    const inputs = safeInputs(rawInputs);
    const validation = validateStep(definition, stepId, inputs);
    if (!validation.valid) fail('ERR_WIZARD_STEP_VALIDATION_FAILED');
    const branches = validateBranchTable(definition, rawBranches);
    for (const rule of branches[stepId] ?? []) if (ruleMatches(rule, inputs)) return rule.target_step_id;
    return step.next_step_id ?? null;
  }
  function createSession(definitionValue: unknown, companyId: string): Readonly<Record<string, unknown>> {
    const definition = normalizeDefinition(definitionValue);
    const expectedCompany = string(companyId, 'ERR_WIZARD_COMPANY_REQUIRED');
    if (definition.company_id !== expectedCompany) fail('ERR_WIZARD_COMPANY_SCOPE_MISMATCH');
    return cloneFreeze({
      schema: 'titan-code-wizard-session/v1',
      wizard_id: definition.wizard_id,
      wizard_version: definition.version,
      company_id: definition.company_id,
      current_step_id: definition.initial_step_id,
      completed: false,
      authority
    });
  }
  function advance(definitionValue: unknown, sessionValue: unknown, rawInputs?: unknown, rawBranches?: unknown): Readonly<Record<string, unknown>> {
    const definition = normalizeDefinition(definitionValue);
    const session = record(sessionValue, 'ERR_WIZARD_SESSION_INVALID');
    assertNoLegacyScope(session);
    if (string(session.wizard_id, 'ERR_WIZARD_SESSION_INVALID') !== definition.wizard_id) fail('ERR_WIZARD_SESSION_DEFINITION_MISMATCH');
    if (string(session.wizard_version, 'ERR_WIZARD_SESSION_INVALID', 64) !== definition.version) fail('ERR_WIZARD_SESSION_VERSION_MISMATCH');
    if (string(session.company_id, 'ERR_WIZARD_SESSION_INVALID') !== definition.company_id) fail('ERR_WIZARD_COMPANY_SCOPE_MISMATCH');
    const currentStep = string(session.current_step_id, 'ERR_WIZARD_SESSION_INVALID');
    const target = nextStep(definition, currentStep, rawInputs, rawBranches);
    return cloneFreeze({
      schema: 'titan-code-wizard-session/v1',
      wizard_id: definition.wizard_id,
      wizard_version: definition.version,
      company_id: definition.company_id,
      current_step_id: target ?? currentStep,
      completed: target === null,
      authority
    });
  }

  const api = Object.freeze({
    schema: 'titan-code-wizard-runtime/v1',
    version: 1,
    company_scope: 'company_id',
    deterministic: true,
    network_required: false,
    provider_required: false,
    parseDefinition: normalizeDefinition,
    validateBranches(definitionValue: unknown, branches: unknown): BranchTable { return validateBranchTable(normalizeDefinition(definitionValue), branches); },
    validateStep(definitionValue: unknown, stepId: string, inputs?: unknown) { return validateStep(normalizeDefinition(definitionValue), string(stepId, 'ERR_WIZARD_STEP_ID_INVALID'), inputs); },
    nextStep(definitionValue: unknown, stepId: string, inputs?: unknown, branches?: unknown) { return nextStep(normalizeDefinition(definitionValue), string(stepId, 'ERR_WIZARD_STEP_ID_INVALID'), inputs, branches); },
    createSession,
    advance,
    authority
  });

  type WizardGlobal = typeof globalThis & { TitanInteractionWizardRuntime?: typeof api };
  const target = globalThis as WizardGlobal;
  if (target.TitanInteractionWizardRuntime && target.TitanInteractionWizardRuntime.schema !== api.schema) fail('ERR_WIZARD_RUNTIME_CONFLICT');
  target.TitanInteractionWizardRuntime = target.TitanInteractionWizardRuntime ?? api;
})();
