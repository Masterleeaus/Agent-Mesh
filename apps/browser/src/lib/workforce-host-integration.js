(function attachCodeeWorkforceHostIntegration(global) {
'use strict';

const PACK_ID = 'codee-managers-ai-workforce';
const DEFAULTS = Object.freeze({
    enabled: true,
    maxManagersPerTask: 3,
    allowAdvisoryAI: true,
    requireEvidence: true,
    planAdvanceAuthority: false,
    directMutation: false,
    consumeRepositoryPack: true,
    consumeMcpRuntime: true,
    maxContextChars: 12000,
    maxTaskChars: 8000
});
const LIMITS = Object.freeze({
    maxManagers: 5,
    maxTaskChars: 8000,
    maxContextChars: 20000,
    maxEvidenceItems: 40,
    maxEvidenceValueChars: 4000,
    maxActions: 30,
    maxNotes: 30,
    maxChangedFiles: 500,
    maxCommands: 100,
    maxClaims: 100
});

function clamp(value, min, max, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

function normalizeSettings(value) {
    const input = value && typeof value === 'object' ? value : {};
    return {
        enabled: input.enabled !== false,
        maxManagersPerTask: clamp(input.maxManagersPerTask, 1, LIMITS.maxManagers, DEFAULTS.maxManagersPerTask),
        allowAdvisoryAI: input.allowAdvisoryAI !== false,
        requireEvidence: input.requireEvidence !== false,
        planAdvanceAuthority: false,
        directMutation: false,
        consumeRepositoryPack: input.consumeRepositoryPack !== false,
        consumeMcpRuntime: input.consumeMcpRuntime !== false,
        maxContextChars: clamp(input.maxContextChars, 2000, LIMITS.maxContextChars, DEFAULTS.maxContextChars),
        maxTaskChars: LIMITS.maxTaskChars
    };
}

function redact(value, max = LIMITS.maxTaskChars) {
    const raw = String(value ?? '');
    const safe = global.CodeeRepositoryPolicy?.redactText
        ? global.CodeeRepositoryPolicy.redactText(raw)
        : raw
            .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, '$1 [REDACTED]')
            .replace(/\b(api[_-]?key|token|secret|password|cookie|authorization)\s*[:=]\s*(['"]?)[^\s,'";]+\2/gi, '$1=[REDACTED]');
    return safe.slice(0, max);
}

function sanitizeStructured(value, depth = 0, seen = new WeakSet()) {
    if (depth > 6) return '[TRUNCATED]';
    if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') return value;
    if (typeof value === 'string') return redact(value, LIMITS.maxEvidenceValueChars);
    if (typeof value !== 'object') return String(value).slice(0, 500);
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    if (Array.isArray(value)) return value.slice(0, 50).map(item => sanitizeStructured(item, depth + 1, seen));
    const out = Object.create(null);
    for (const [key, child] of Object.entries(value).slice(0, 80)) {
        if (/^(password|passwd|secret|token|api[_-]?key|authorization|cookie|session|credential|client[_-]?secret)$/i.test(key)) {
            out[key] = '[REDACTED]';
            continue;
        }
        out[String(key).slice(0, 120)] = sanitizeStructured(child, depth + 1, seen);
    }
    return out;
}

function summarizeMutationChange(change) {
    const input = change && typeof change === 'object' ? change : {};
    const summary = Object.create(null);
    summary.keys = Object.keys(input).slice(0, 40).map(key => String(key).slice(0, 120));
    if (typeof input.content === 'string') summary.contentChars = input.content.length;
    if (typeof input.command === 'string') summary.command = redact(input.command, 4000);
    if (input.scope && typeof input.scope === 'object') summary.scope = sanitizeStructured(input.scope);
    return summary;
}

function sanitizeInput(input = {}) {
    const source = input && typeof input === 'object' ? input : {};
    const out = Object.create(null);
    for (const key of ['text', 'task', 'goal', 'reason', 'action']) {
        if (source[key] !== undefined) out[key] = redact(source[key]);
    }
    for (const key of ['runId', 'planId', 'stepId']) {
        if (source[key] !== undefined && source[key] !== null) out[key] = String(source[key]).slice(0, 256);
    }
    if (Array.isArray(source.changedFiles)) {
        out.changedFiles = source.changedFiles.slice(0, LIMITS.maxChangedFiles)
            .filter(path => global.CodeeRepositoryPolicy?.isInScope ? global.CodeeRepositoryPolicy.isInScope(path) : true)
            .map(path => global.CodeeRepositoryPolicy?.normalize ? global.CodeeRepositoryPolicy.normalize(path) : String(path));
    }
    return out;
}

function availableCapabilityIds(settings = DEFAULTS) {
    const effective = normalizeSettings(settings);
    const snapshot = global.CodeeCapabilityRegistry?.snapshot?.() || {};
    return Array.from(new Set([
        ...(snapshot.capabilities || []).map(item => String(item?.id || '')),
        ...(snapshot.repositoryCapabilities || []).map(item => String(item?.id || ''))
    ].filter(Boolean).filter(id => {
        if (id.startsWith('repository.') && !effective.consumeRepositoryPack) return false;
        if (id.startsWith('mcp.') && !effective.consumeMcpRuntime) return false;
        return true;
    })));
}


function createReceiverHost() {
    if (!global.CodeeCapabilityRegistry) throw new Error('Codee capability registry is unavailable');
    return {
        registerManager: manager => global.CodeeCapabilityRegistry.registerManager(manager),
        registerPrompts: rows => global.CodeeCapabilityRegistry.registerPrompts(rows || []),
        registerSkills: rows => global.CodeeCapabilityRegistry.registerSkills(rows || []),
        registerProfiles: rows => global.CodeeCapabilityRegistry.registerProfiles(rows || []),
        registerContextProvider: row => global.CodeeCapabilityRegistry.registerContextProvider(row),
        registerDiagnosticsSection: row => global.CodeeCapabilityRegistry.registerDiagnosticsSection(row),
        registerSettingsSection: row => global.CodeeCapabilityRegistry.registerSettingsSection(row)
    };
}

function managerById(id) {
    return global.CodeeCapabilityRegistry?.getManager?.(id)
        || global.CodeeManagerRegistry?.get?.(id)
        || null;
}

function prepare(input = {}, settings = DEFAULTS) {
    const effective = normalizeSettings(settings);
    const safeInput = sanitizeInput(input);
    if (!effective.enabled) {
        return {
            enabled: false,
            classification: null,
            primary: null,
            supporting: [],
            managers: [],
            evidenceRequests: [],
            workOrders: [],
            readiness: [],
            risk: { level: 'low', approval: false },
            authority: { advancePlan: false, directMutation: false }
        };
    }

    const routed = global.CodeeManagerRouter.route(safeInput);
    const selected = (routed.candidates || []).slice(0, effective.maxManagersPerTask);
    const managers = selected.length ? selected : [routed.primary].filter(Boolean);
    const capabilities = availableCapabilityIds(effective);
    const workOrders = managers.map(manager => global.CodeeWorkOrder.create({
        task: safeInput.text || safeInput.task || safeInput.goal || '',
        managerId: manager.id,
        runId: safeInput.runId || null,
        planId: safeInput.planId || null,
        stepId: safeInput.stepId || null,
        context: { tools: global.CodeeContextStrategy.select(routed.classification?.tags || []) }
    }));
    const readiness = managers.map(manager => global.CodeeCapabilityResolver.resolve(manager, capabilities));
    const requestedCapabilities = Array.from(new Set(global.CodeeContextStrategy.select(routed.classification?.tags || [])))
        .filter(id => !(id.startsWith('repository.') && !effective.consumeRepositoryPack))
        .filter(id => !(id.startsWith('mcp.') && !effective.consumeMcpRuntime));
    const evidenceRequests = requestedCapabilities.map((capability, index) => ({
        id: `evidence-request-${index + 1}`,
        capability,
        mode: capability.startsWith('mcp.') ? 'mcp' : 'repository',
        authority: { executeMutation: false, advancePlan: false }
    }));
    const risk = global.CodeeWorkforceRiskClassifier.classify(safeInput);

    return {
        enabled: true,
        classification: routed.classification,
        primary: managers[0] || null,
        supporting: managers.slice(1),
        managers,
        evidenceRequests,
        requestedCapabilities,
        workOrders,
        readiness,
        risk,
        evidenceRequired: effective.requireEvidence,
        handoffs: [],
        authority: { advancePlan: false, directMutation: false, createPlanDraftOnly: true }
    };
}

function buildContext(preflight, maxChars = DEFAULTS.maxContextChars) {
    if (!preflight?.enabled || !preflight?.primary) return '';
    const managerLine = [preflight.primary, ...(preflight.supporting || [])]
        .filter(Boolean)
        .map((manager, index) => `${index === 0 ? 'Primary' : 'Supporting'}: ${manager.name} (${manager.id})`)
        .join('\n');
    const requestLine = (preflight.evidenceRequests || []).map(item => `- ${item.capability}`).join('\n') || '- none';
    const readiness = (preflight.readiness || []).map(item => `${item.managerId}: ${item.ready ? 'ready' : `degraded; missing ${item.missing.join(', ')}`}`).join('\n') || 'none';
    return [
        'CODEE MANAGERS & AI WORKFORCE — ADVISORY PREFLIGHT',
        'Authority: managers may analyze, recommend, hand off, request evidence and prepare plan drafts. They may NOT advance/complete/skip Codee plan steps or execute mutations directly.',
        managerLine,
        `Task tags: ${(preflight.classification?.tags || []).join(', ') || 'general'}`,
        `Risk: ${preflight.risk?.level || 'low'}${preflight.risk?.approval ? ' / approval recommended' : ''}`,
        'Requested evidence capabilities:',
        requestLine,
        `Manager readiness: ${readiness}`,
        'Treat external AI output as advisory evidence until Codee verifies and accepts it.'
    ].join('\n').slice(0, clamp(maxChars, 2000, LIMITS.maxContextChars, DEFAULTS.maxContextChars));
}

function makePlanDraft(input = {}, settings = DEFAULTS) {
    const effective = normalizeSettings(settings);
    const safe = sanitizeInput(input);
    const preflight = prepare(safe, effective);
    const managerIds = preflight.managers.map(manager => manager.id);
    const evidence = Array.isArray(input.evidence)
        ? input.evidence.slice(0, LIMITS.maxEvidenceItems).map((item, index) => ({
            id: String(item?.id || `e${index + 1}`).slice(0, 128),
            kind: String(item?.kind || 'evidence').slice(0, 80),
            value: redact(item?.value ?? item?.summary ?? '', LIMITS.maxEvidenceValueChars)
        }))
        : [];
    const start = global.CodeePlanStarter.prepare({
        goal: safe.goal || safe.task || safe.text || '',
        evidence,
        constraints: Array.isArray(input.constraints) ? input.constraints.slice(0, 30).map(value => redact(value, 1000)) : [],
        managerIds
    });
    const primaryName = preflight.primary?.name || 'Architecture Manager';
    const suggestedSteps = [
        `Gather and verify the evidence requested by ${primaryName}.`,
        `Implement the approved changes for: ${safe.goal || safe.task || safe.text || 'the requested task'}.`,
        'Run targeted verification and review rollback/backup evidence for any managed mutation.',
        'Package and report the verified result without advancing any existing Codee plan from manager output alone.'
    ];
    return {
        ...start,
        preflight,
        suggestedSteps,
        authority: { createOnly: true, advance: false, complete: false, skip: false }
    };
}

function createAdvisoryAiRequest(payload = {}, settings = DEFAULTS) {
    const effective = normalizeSettings(settings);
    if (!effective.enabled || !effective.allowAdvisoryAI) {
        return { ok: false, unavailable: true, advisory: true, reason: 'workforce-advisory-ai-disabled', authority: { executeResult: false, advancePlan: false } };
    }
    const safe = sanitizeInput(payload);
    const managerId = String(payload.managerId || '').slice(0, 128);
    if (!managerById(managerId)) return { ok: false, unavailable: true, advisory: true, reason: 'unknown-manager', managerId, authority: { executeResult: false, advancePlan: false } };
    const request = global.CodeeProviderAssistanceRequest.create({
        managerId,
        task: safe.task || safe.text || safe.goal || '',
        reason: safe.reason || '',
        preferredProvider: String(payload.preferredProvider || 'auto').slice(0, 80),
        contextRefs: Array.isArray(payload.contextRefs) ? payload.contextRefs.slice(0, 40).map(value => redact(value, 256)) : []
    });
    const authority = { executeResult: false, advancePlan: false };
    const gateway = global.CodeeProviderGateway;
    const wrapSuccess = providerResult => ({ ok: true, advisory: true, request, providerResult: sanitizeStructured(providerResult), authority });
    const wrapFailure = error => ({ ok: false, advisory: true, request, error: redact(error?.message || error, 2000), authority });
    if (gateway && typeof gateway.requestAdvisory === 'function') {
        try {
            const result = gateway.requestAdvisory(request);
            if (result && typeof result.then === 'function') return result.then(wrapSuccess, wrapFailure);
            return wrapSuccess(result);
        } catch (error) {
            return wrapFailure(error);
        }
    }
    return { ok: true, queued: true, advisory: true, request, reason: 'provider-gateway-not-installed', authority };
}

async function executeToolRequest(request, settings = DEFAULTS) {
    const effective = normalizeSettings(settings);
    if (!effective.enabled) return { ok: false, unavailable: true, reason: 'workforce-disabled', mayAdvancePlan: false };
    const capability = String(request?.capability || '').slice(0, 240);
    if (/^(repository\.(?:host\.)?(?:write|delete|command)|server\.|database\.(?:write|update|delete|insert|command|execute))/i.test(capability)) {
        return { ok: false, forbidden: true, reason: 'manager-direct-mutation-forbidden-use-governed-mutation-request', capability, mayAdvancePlan: false };
    }
    const managerId = String(request?.managerId || '').slice(0, 128);
    if (!managerById(managerId)) return { ok: false, unavailable: true, reason: 'unknown-manager', managerId, mayAdvancePlan: false };
    global.CodeeDelegationPolicy.authorize({ action: capability });
    if (capability.startsWith('repository.')) {
        if (!effective.consumeRepositoryPack) return { ok: false, unavailable: true, reason: 'repository-consumption-disabled', mayAdvancePlan: false };
        if (!global.CodeeRepositoryHostIntegration?.callCapability) return { ok: false, unavailable: true, reason: 'repository-runtime-not-installed', mayAdvancePlan: false };
        return global.CodeeRepositoryHostIntegration.callCapability(capability, sanitizeStructured(request?.args && typeof request.args === 'object' ? request.args : {}));
    }
    if (capability.startsWith('mcp.')) {
        if (!effective.consumeMcpRuntime) return { ok: false, unavailable: true, reason: 'mcp-consumption-disabled', mayAdvancePlan: false };
        if (!global.CodeeRepositoryHostIntegration?.callCapability) return { ok: false, unavailable: true, reason: 'mcp-runtime-not-installed', mayAdvancePlan: false };
        return global.CodeeRepositoryHostIntegration.callCapability(capability, sanitizeStructured(request?.args && typeof request.args === 'object' ? request.args : {}));
    }
    return { ok: false, unavailable: true, reason: 'unsupported-workforce-tool', capability, mayAdvancePlan: false };
}

async function routeGovernedMutation(request, settings = DEFAULTS) {
    const effective = normalizeSettings(settings);
    if (!effective.enabled) return { ok: false, unavailable: true, reason: 'workforce-disabled', mayAdvancePlan: false };
    const raw = request && typeof request === 'object' ? request : {};
    const action = String(raw.action || '').slice(0, 240);
    const target = String(raw.target || '');
    const managerId = String(raw.managerId || '').slice(0, 128);
    if (!managerById(managerId)) return { ok: false, unavailable: true, reason: 'unknown-manager', managerId, mayAdvancePlan: false };
    const change = raw.change && typeof raw.change === 'object' ? raw.change : {};
    const envelope = global.CodeeGovernedMutationRequest.create({
        managerId, action, target: target.slice(0, 2000), change: summarizeMutationChange(change),
        runId: raw.runId || null, planId: raw.planId || null, stepId: raw.stepId || null,
        reason: redact(raw.reason || '', 2000)
    });

    if (!global.CodeeRepositoryHostIntegration?.callCapability) {
        return { ok: false, unavailable: true, reason: 'privileged-mutation-runtime-not-installed', request: envelope, mayAdvancePlan: false };
    }

    if (['repository.write', 'repository.host.write'].includes(action)) {
        return global.CodeeRepositoryHostIntegration.callCapability('repository.host.write', {
            path: target,
            content: String(change.content ?? ''),
            meta: { source: 'workforce', managerId: envelope.managerId, requestId: envelope.id, reason: envelope.reason }
        });
    }
    if (['repository.delete', 'repository.host.delete'].includes(action)) {
        return global.CodeeRepositoryHostIntegration.callCapability('repository.host.delete', {
            path: target,
            meta: { source: 'workforce', managerId: envelope.managerId, requestId: envelope.id, reason: envelope.reason }
        });
    }
    if (['repository.command', 'repository.host.command'].includes(action)) {
        return global.CodeeRepositoryHostIntegration.callCapability('repository.host.command', {
            command: String(change.command || target || ''),
            scope: change.scope || {},
            meta: { source: 'workforce', managerId: envelope.managerId, requestId: envelope.id, reason: envelope.reason }
        });
    }

    return {
        ok: false,
        unavailable: true,
        reason: 'titan-mcp-or-privileged-host-route-not-installed',
        request: envelope,
        requirements: envelope.requirements,
        mayAdvancePlan: false
    };
}

function callCapability(id, payload = {}, settings = DEFAULTS) {
    const effective = normalizeSettings(settings);
    if (!effective.enabled) return { ok: false, unavailable: true, reason: 'workforce-disabled', mayAdvancePlan: false };
    const key = String(id || '');
    const p = payload && typeof payload === 'object' ? payload : {};
    switch (key) {
        case 'workforce.classify': return global.CodeeWorkforceTaskClassifier.classify(sanitizeInput(p));
        case 'workforce.route': return global.CodeeManagerRouter.route(sanitizeInput(p));
        case 'workforce.orchestrate': return prepare(p, effective);
        case 'workforce.evidence.bundle': return global.CodeeEvidenceBundle.create({ ...p, items: Array.isArray(p.items) ? p.items.slice(0, LIMITS.maxEvidenceItems).map(item => sanitizeStructured(item)) : [] });
        case 'workforce.recommend': return global.CodeeRecommendationEnvelope.create({ ...p, summary: redact(p.summary || '', 4000), actions: Array.isArray(p.actions) ? p.actions.slice(0, LIMITS.maxActions).map(v => redact(v, 1000)) : [] });
        case 'workforce.handoff': return global.CodeeHandoffBuilder.build({ ...p, evidence: sanitizeStructured(p.evidence || null), notes: Array.isArray(p.notes) ? p.notes.slice(0, LIMITS.maxNotes).map(v => redact(v, 1000)) : [] });
        case 'workforce.conflicts.resolve': return global.CodeeManagerConflictResolver.resolve(Array.isArray(p.recommendations) ? p.recommendations.slice(0, 40).map(item => sanitizeStructured(item)) : []);
        case 'workforce.plan.start': return makePlanDraft(p, effective);
        case 'workforce.ai.request': return createAdvisoryAiRequest(p, effective);
        case 'workforce.health': {
            const snapshot = global.CodeeCapabilityRegistry?.snapshot?.() || {};
            const available = Object.fromEntries(availableCapabilityIds(effective).map(id => [id, true]));
            return (snapshot.managers || []).filter(manager => String(manager?.id || '').endsWith('-manager')).map(manager => global.CodeeManagerHealth.inspect(manager, available));
        }
        case 'workforce.capabilities.resolve': {
            const manager = managerById(p.managerId);
            if (!manager) return { ok: false, unavailable: true, reason: 'unknown-manager', managerId: String(p.managerId || '').slice(0, 128), ready: false, missing: [] };
            return global.CodeeCapabilityResolver.resolve(manager, availableCapabilityIds(effective));
        }
        case 'workforce.context.select': return global.CodeeContextStrategy.select(Array.isArray(p.tags) ? p.tags.slice(0, 30) : []);
        case 'workforce.manifest': return global.CodeeWorkforceManifest.build(global.CodeeManagerRegistry.list());
        case 'workforce.tool.request': {
            const capability = String(p.capability || '').slice(0, 240);
            const managerId = String(p.managerId || '').slice(0, 128);
            try { global.CodeeDelegationPolicy.authorize({ action: capability }); } catch { return { ok:false, forbidden:true, reason:'manager-direct-mutation-forbidden-use-governed-mutation-request', capability, mayAdvancePlan:false }; }
            if (!managerById(managerId)) return { ok:false, unavailable:true, reason:'unknown-manager', managerId, mayAdvancePlan:false };
            return global.CodeeManagerToolRequest.create({
                managerId, capability,
                args: sanitizeStructured(p.args && typeof p.args === 'object' ? p.args : {}),
                runId: p.runId == null ? null : String(p.runId).slice(0, 256),
                planId: p.planId == null ? null : String(p.planId).slice(0, 256),
                stepId: p.stepId == null ? null : String(p.stepId).slice(0, 256),
                reason: redact(p.reason || '', 2000)
            });
        }
        case 'workforce.mutation.request': {
            const managerId = String(p.managerId || '').slice(0, 128);
            if (!managerById(managerId)) return { ok:false, unavailable:true, reason:'unknown-manager', managerId, mayAdvancePlan:false };
            return global.CodeeGovernedMutationRequest.create({ ...p, managerId, action: String(p.action || '').slice(0, 240), target: redact(p.target || '', 2000), change: summarizeMutationChange(p.change), reason: redact(p.reason || '', 2000) });
        }
        case 'workforce.verification.request': return global.CodeeVerificationRequest.create({ ...p, changedFiles: Array.isArray(p.changedFiles) ? p.changedFiles.slice(0, LIMITS.maxChangedFiles).filter(path => global.CodeeRepositoryPolicy?.isInScope ? global.CodeeRepositoryPolicy.isInScope(path) : true).map(path => global.CodeeRepositoryPolicy?.normalize ? global.CodeeRepositoryPolicy.normalize(path) : String(path)) : [], commands: Array.isArray(p.commands) ? p.commands.slice(0, LIMITS.maxCommands).map(v => redact(v, 4000)) : [], claims: Array.isArray(p.claims) ? p.claims.slice(0, LIMITS.maxClaims).map(v => redact(v, 2000)) : [] });
        case 'workforce.session': return global.CodeeManagerSession.create({ ...sanitizeInput(p), managerId: String(p.managerId || '').slice(0, 128) });
        default: return { ok: false, unavailable: true, reason: 'unknown-workforce-capability', capability: key, mayAdvancePlan: false };
    }
}

function register(settings) {
    if (!global.CodeeWorkforceReceiverAdapter) throw new Error('Workforce receiver adapter is unavailable');
    if (!global.CodeeCapabilityRegistry) throw new Error('Codee capability registry is unavailable');
    const effective = normalizeSettings(settings);
    const result = global.CodeeWorkforceReceiverAdapter.register(createReceiverHost());
    const descriptor = global.CodeeManagerWorkforcePack.registrationDescriptor();
    for (const id of descriptor.capabilities) {
        global.CodeeCapabilityRegistry.registerCapability({
            id, pack: PACK_ID, category: 'Managers & AI Workforce',
            authority: { advancePlan: false, directMutation: false, implementsMcpRuntime: false }
        });
    }
    global.CodeeCapabilityRegistry.registerContextProvider({
        id: 'workforce-runner-routing', surface: 'runner', priority: 70,
        provide: (_snapshot, input) => prepare(input || {}, effective)
    });
    global.CodeeCapabilityRegistry.registerContextProvider({
        id: 'workforce-plan-starter', surface: 'multi_step_plans', priority: 70,
        provide: (_snapshot, input) => makePlanDraft(input || {}, effective)
    });
    global.CodeeCapabilityRegistry.registerDiagnosticsSection({
        id: 'managers-workforce', title: 'Managers & AI Workforce',
        build: (_snapshot, input) => ({ preflight: prepare(input || {}, effective), status: statusPayload(effective) })
    });
    global.CodeeCapabilityRegistry.registerSettingsSection({
        id: 'managers-workforce', title: 'Managers & AI Workforce', defaults: effective,
        fields: [
            { key: 'enabled', type: 'boolean', label: 'Enable manager routing' },
            { key: 'maxManagersPerTask', type: 'number', min: 1, max: 5, label: 'Maximum managers per task' },
            { key: 'allowAdvisoryAI', type: 'boolean', label: 'Allow advisory AI requests' },
            { key: 'requireEvidence', type: 'boolean', label: 'Require evidence-backed recommendations' },
            { key: 'consumeRepositoryPack', type: 'boolean', label: 'Use Repository & Coding Intelligence' },
            { key: 'consumeMcpRuntime', type: 'boolean', label: 'Use Codee MCP evidence' },
            { key: 'planAdvanceAuthority', type: 'boolean', locked: true, value: false, label: 'Managers may advance plans' },
            { key: 'directMutation', type: 'boolean', locked: true, value: false, label: 'Managers may mutate directly' }
        ]
    });
    return { ...result, settings: effective, capabilities: descriptor.capabilities.length };
}

function statusPayload(settings = DEFAULTS) {
    const effective = normalizeSettings(settings);
    const descriptor = global.CodeeManagerWorkforcePack?.registrationDescriptor?.() || null;
    const registry = global.CodeeCapabilityRegistry?.snapshot?.() || {};
    const managerIds = new Set((descriptor?.managers || []).map(item => String(item?.id || '')));
    const promptIds = new Set((descriptor?.prompts || []).map(item => String(item?.id || '')));
    const skillIds = new Set((descriptor?.skills || []).map(item => String(item?.id || '')));
    const profileIds = new Set((descriptor?.profiles || []).map(item => String(item?.id || '')));
    const capabilityIds = new Set(descriptor?.capabilities || []);
    const available = new Set(availableCapabilityIds(effective));
    const managers = (registry.managers || []).filter(item => managerIds.has(String(item?.id || '')));
    const health = managers.map(manager => global.CodeeManagerHealth.inspect(manager, Object.fromEntries(Array.from(available).map(id => [id, true]))));
    return {
        registered: Boolean(descriptor),
        pack: descriptor ? { id: descriptor.id, version: descriptor.version, title: descriptor.title, authority: descriptor.authority } : null,
        settings: effective,
        counts: {
            managers: managers.length,
            capabilities: (registry.capabilities || []).filter(item => capabilityIds.has(String(item?.id || ''))).length,
            prompts: (registry.prompts || []).filter(item => promptIds.has(String(item?.id || ''))).length,
            skills: (registry.skills || []).filter(item => skillIds.has(String(item?.id || ''))).length,
            profiles: (registry.profiles || []).filter(item => profileIds.has(String(item?.id || ''))).length
        },
        health,
        dependencies: {
            repositoryPack: Boolean(global.CodeeRepositoryHostIntegration),
            mcpRuntime: Boolean(global.CodeeRepositoryHostIntegration?.getMcpAdapter?.()),
            providerGateway: Boolean(global.CodeeProviderGateway)
        },
        authority: { planAdvance: false, directMutation: false, planDraftOnly: true, implementsMcpRuntime: false, aiOutputsAdvisory: true }
    };
}

function registryPayload(settings = DEFAULTS) {
    const status = statusPayload(settings);
    const registry = global.CodeeCapabilityRegistry?.snapshot?.() || {};
    const descriptor = global.CodeeManagerWorkforcePack?.registrationDescriptor?.() || {};
    const ids = rows => new Set((rows || []).map(item => String(item?.id || '')).filter(Boolean));
    const managerIds = ids(descriptor.managers || []), promptIds = ids(descriptor.prompts || []), skillIds = ids(descriptor.skills || []), profileIds = ids(descriptor.profiles || []), capabilityIds = new Set(descriptor.capabilities || []);
    return {
        status,
        managers: (registry.managers || []).filter(item => managerIds.has(String(item?.id || ''))),
        capabilities: (registry.capabilities || []).filter(item => capabilityIds.has(String(item?.id || ''))),
        prompts: (registry.prompts || []).filter(item => promptIds.has(String(item?.id || ''))),
        skills: (registry.skills || []).filter(item => skillIds.has(String(item?.id || ''))),
        profiles: (registry.profiles || []).filter(item => profileIds.has(String(item?.id || ''))),
        contextProviders: (registry.contextProviders || []).filter(item => String(item?.id || '').startsWith('workforce-')),
        diagnosticsSections: (registry.diagnosticsSections || []).filter(item => String(item?.id || '').startsWith('managers-workforce')),
        settingsSections: (registry.settingsSections || []).filter(item => String(item?.id || '').startsWith('managers-workforce'))
    };
}

global.CodeeWorkforceHostIntegration = Object.freeze({
    PACK_ID, DEFAULTS, LIMITS, normalizeSettings, sanitizeInput, register, prepare, buildContext, makePlanDraft,
    createAdvisoryAiRequest, executeToolRequest, routeGovernedMutation, callCapability, statusPayload, registryPayload, availableCapabilityIds, sanitizeStructured, summarizeMutationChange
});
})(typeof globalThis !== 'undefined' ? globalThis : this);
