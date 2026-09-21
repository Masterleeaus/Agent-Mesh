"use strict";
(() => {
    'use strict';
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
    function fail(code) { throw new Error(code); }
    function record(value, code = 'ERR_WIZARD_RECORD_INVALID') {
        if (!value || typeof value !== 'object' || Array.isArray(value))
            fail(code);
        return value;
    }
    function string(value, code, max = 256) {
        if (typeof value !== 'string')
            fail(code);
        const out = value.trim();
        if (!out || out.length > max)
            fail(code);
        return out;
    }
    function cloneFreeze(value) {
        const cloned = structuredClone(value);
        const freeze = (node) => {
            if (!node || typeof node !== 'object' || Object.isFrozen(node))
                return node;
            for (const child of Object.values(node))
                freeze(child);
            return Object.freeze(node);
        };
        return freeze(cloned);
    }
    function contracts() {
        const api = globalThis.TitanInteractionContracts;
        if (!api)
            fail('ERR_WIZARD_CONTRACTS_UNAVAILABLE');
        return api;
    }
    function normalizeDefinition(value) {
        return contracts().normalize('WizardDefinition', value);
    }
    function assertNoLegacyScope(value) {
        for (const key of LEGACY_COMPANY_KEYS)
            if (Object.prototype.hasOwnProperty.call(value, key))
                fail('ERR_WIZARD_LEGACY_COMPANY_SCOPE');
    }
    function stepMap(definition) {
        return new Map(definition.steps.map((step) => [step.step_id, step]));
    }
    function validateBranchTable(definition, raw) {
        if (raw === undefined || raw === null)
            return Object.freeze({});
        const branchRecord = record(raw, 'ERR_WIZARD_BRANCH_TABLE_INVALID');
        const steps = stepMap(definition);
        const normalized = {};
        for (const [stepId, value] of Object.entries(branchRecord)) {
            if (!steps.has(stepId))
                fail('ERR_WIZARD_BRANCH_STEP_UNKNOWN');
            if (!Array.isArray(value) || value.length > MAX_BRANCH_RULES_PER_STEP)
                fail('ERR_WIZARD_BRANCH_RULES_INVALID');
            const rules = value.map((entry, index) => {
                const item = record(entry, 'ERR_WIZARD_BRANCH_RULE_INVALID');
                const field = string(item.field, 'ERR_WIZARD_BRANCH_FIELD_INVALID', 128);
                const operator = item.operator === undefined ? 'equals' : string(item.operator, 'ERR_WIZARD_BRANCH_OPERATOR_INVALID', 32);
                if (!['equals', 'not_equals', 'in', 'present'].includes(operator))
                    fail('ERR_WIZARD_BRANCH_OPERATOR_INVALID');
                const target = item.target_step_id === null ? null : string(item.target_step_id, 'ERR_WIZARD_BRANCH_TARGET_INVALID');
                if (target !== null && !steps.has(target))
                    fail('ERR_WIZARD_BRANCH_TARGET_UNKNOWN');
                const priority = item.priority === undefined ? index : Number(item.priority);
                if (!Number.isInteger(priority) || priority < 0 || priority > 1_000_000)
                    fail('ERR_WIZARD_BRANCH_PRIORITY_INVALID');
                if (operator === 'in') {
                    if (!Array.isArray(item.value) || item.value.length === 0 || item.value.length > 64)
                        fail('ERR_WIZARD_BRANCH_VALUE_INVALID');
                }
                else if (operator !== 'present' && item.value === undefined) {
                    fail('ERR_WIZARD_BRANCH_VALUE_REQUIRED');
                }
                return cloneFreeze({ field, operator: operator, ...(operator === 'present' ? {} : { value: structuredClone(item.value) }), target_step_id: target, priority });
            }).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
            normalized[stepId] = Object.freeze(rules);
        }
        return Object.freeze(normalized);
    }
    function safeInputs(raw) {
        const inputs = raw === undefined ? {} : record(raw, 'ERR_WIZARD_INPUT_INVALID');
        assertNoLegacyScope(inputs);
        const entries = Object.entries(inputs);
        if (entries.length > MAX_INPUT_FIELDS)
            fail('ERR_WIZARD_INPUT_TOO_LARGE');
        for (const [key, value] of entries) {
            if (!key || key.length > 128)
                fail('ERR_WIZARD_INPUT_FIELD_INVALID');
            if (typeof value === 'string' && value.length > 16_384)
                fail('ERR_WIZARD_INPUT_VALUE_TOO_LARGE');
        }
        return cloneFreeze(inputs);
    }
    function present(value) {
        return value !== undefined && value !== null && (typeof value !== 'string' || value.trim().length > 0);
    }
    function primitiveEquals(left, right) {
        return (['string', 'number', 'boolean'].includes(typeof left) || left === null) && left === right;
    }
    function ruleMatches(rule, inputs) {
        const actual = inputs[rule.field];
        switch (rule.operator) {
            case 'present': return present(actual);
            case 'not_equals': return !primitiveEquals(actual, rule.value);
            case 'in': return Array.isArray(rule.value) && rule.value.some((candidate) => primitiveEquals(actual, candidate));
            case 'equals':
            default: return primitiveEquals(actual, rule.value);
        }
    }
    function requiredFields(step) {
        return step.required ? Object.freeze([...(step.fields ?? [])]) : Object.freeze([]);
    }
    function validateStep(definition, stepId, rawInputs) {
        const step = stepMap(definition).get(stepId);
        if (!step)
            fail('ERR_WIZARD_STEP_UNKNOWN');
        const inputs = safeInputs(rawInputs);
        const missing = requiredFields(step).filter((field) => !present(inputs[field]));
        return cloneFreeze({ valid: missing.length === 0, missing_fields: missing, errors: missing.map((field) => `required:${field}`) });
    }
    function nextStep(definition, stepId, rawInputs, rawBranches) {
        const steps = stepMap(definition);
        const step = steps.get(stepId);
        if (!step)
            fail('ERR_WIZARD_STEP_UNKNOWN');
        const inputs = safeInputs(rawInputs);
        const validation = validateStep(definition, stepId, inputs);
        if (!validation.valid)
            fail('ERR_WIZARD_STEP_VALIDATION_FAILED');
        const branches = validateBranchTable(definition, rawBranches);
        for (const rule of branches[stepId] ?? [])
            if (ruleMatches(rule, inputs))
                return rule.target_step_id;
        return step.next_step_id ?? null;
    }
    function createSession(definitionValue, companyId) {
        const definition = normalizeDefinition(definitionValue);
        const expectedCompany = string(companyId, 'ERR_WIZARD_COMPANY_REQUIRED');
        if (definition.company_id !== expectedCompany)
            fail('ERR_WIZARD_COMPANY_SCOPE_MISMATCH');
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
    function advance(definitionValue, sessionValue, rawInputs, rawBranches) {
        const definition = normalizeDefinition(definitionValue);
        const session = record(sessionValue, 'ERR_WIZARD_SESSION_INVALID');
        assertNoLegacyScope(session);
        if (string(session.wizard_id, 'ERR_WIZARD_SESSION_INVALID') !== definition.wizard_id)
            fail('ERR_WIZARD_SESSION_DEFINITION_MISMATCH');
        if (string(session.wizard_version, 'ERR_WIZARD_SESSION_INVALID', 64) !== definition.version)
            fail('ERR_WIZARD_SESSION_VERSION_MISMATCH');
        if (string(session.company_id, 'ERR_WIZARD_SESSION_INVALID') !== definition.company_id)
            fail('ERR_WIZARD_COMPANY_SCOPE_MISMATCH');
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
        validateBranches(definitionValue, branches) { return validateBranchTable(normalizeDefinition(definitionValue), branches); },
        validateStep(definitionValue, stepId, inputs) { return validateStep(normalizeDefinition(definitionValue), string(stepId, 'ERR_WIZARD_STEP_ID_INVALID'), inputs); },
        nextStep(definitionValue, stepId, inputs, branches) { return nextStep(normalizeDefinition(definitionValue), string(stepId, 'ERR_WIZARD_STEP_ID_INVALID'), inputs, branches); },
        createSession,
        advance,
        authority
    });
    const target = globalThis;
    if (target.TitanInteractionWizardRuntime && target.TitanInteractionWizardRuntime.schema !== api.schema)
        fail('ERR_WIZARD_RUNTIME_CONFLICT');
    target.TitanInteractionWizardRuntime = target.TitanInteractionWizardRuntime ?? api;
})();
