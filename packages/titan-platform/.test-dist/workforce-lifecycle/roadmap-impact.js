"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TITAN_OUTCOME_OWNERSHIP_CLASSES = exports.TITAN_WORKFORCE_IMPACT_MODES = void 0;
exports.defineRoadmapWorkforceImpact = defineRoadmapWorkforceImpact;
exports.assertRoadmapWorkforceImpactCoverage = assertRoadmapWorkforceImpactCoverage;
exports.validateRoadmapAgentModelProjection = validateRoadmapAgentModelProjection;
exports.validateRoadmapWorkforceCoverage = validateRoadmapWorkforceCoverage;
exports.reconcileRoadmapWorkforceImpact = reconcileRoadmapWorkforceImpact;
exports.starterAgentRegistrySnapshot = starterAgentRegistrySnapshot;
exports.auditRoadmapWorkforceCoverage = auditRoadmapWorkforceCoverage;
exports.recommendWorkforceCoverageClosures = recommendWorkforceCoverageClosures;
exports.projectAuthoritativeRoadmapCoverage = projectAuthoritativeRoadmapCoverage;
exports.classifyAuthoritativeRoadmapOutcomeOwnership = classifyAuthoritativeRoadmapOutcomeOwnership;
exports.validateAuthoritativeRoadmapWorkforceCompletion = validateAuthoritativeRoadmapWorkforceCompletion;
const contracts_js_1 = require("./contracts.js");
exports.TITAN_WORKFORCE_IMPACT_MODES = Object.freeze([
    'REUSE_EXISTING_AGENT',
    'EXTEND_EXISTING_AGENT',
    'CREATE_NEW_AGENT',
    'SURFACE_BINDING_EXISTING_AGENTS',
    'NO_AGENT_INFRASTRUCTURE_ONLY',
]);
const ID_RE = /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/;
const LEGACY_SCOPE_KEYS = new Set(['tenant_id', 'tenant_company_id', 'tenant']);
function id(value, field) {
    const result = String(value ?? '').trim().toLowerCase();
    if (!ID_RE.test(result))
        throw new Error(`${field}-invalid`);
    return result;
}
function ids(value, field) {
    if (!Array.isArray(value))
        throw new Error(`${field}-array-required`);
    return Object.freeze([...new Set(value.map((entry) => id(entry, field)))].sort());
}
function texts(value, field) {
    if (!Array.isArray(value))
        throw new Error(`${field}-array-required`);
    return Object.freeze([...new Set(value.map((entry) => String(entry ?? '').trim()).filter(Boolean))].sort());
}
function assertNoLegacyBoundary(input) {
    for (const key of Object.keys(input))
        if (LEGACY_SCOPE_KEYS.has(key))
            throw new Error(`legacy-company-boundary:${key}`);
}
function defineRoadmapWorkforceImpact(input) {
    assertNoLegacyBoundary(input);
    const company_id = (0, contracts_js_1.assertTitanWorkforceLifecycleCompany)(String(input.company_id ?? '').trim());
    const goal_id = id(input.goal_id, 'goal_id');
    const subgoal_id = id(input.subgoal_id, 'subgoal_id');
    const mode = String(input.mode ?? '');
    if (!exports.TITAN_WORKFORCE_IMPACT_MODES.includes(mode))
        throw new Error('workforce-impact-mode-invalid');
    const owning_agent_ids = ids(input.owning_agent_ids ?? [], 'owning_agent_ids');
    const rawDeltas = input.registry_deltas ?? [];
    if (!Array.isArray(rawDeltas))
        throw new Error('registry_deltas-array-required');
    const registry_deltas = Object.freeze(rawDeltas.map((raw, index) => {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
            throw new Error(`registry_deltas[${index}]-object-required`);
        const delta = raw;
        const operation = String(delta.operation ?? '');
        if (!['REUSE', 'EXTEND', 'CREATE'].includes(operation))
            throw new Error(`registry_deltas[${index}].operation-invalid`);
        return Object.freeze({
            agent_id: id(delta.agent_id, `registry_deltas[${index}].agent_id`),
            operation,
            capability_ids: ids(delta.capability_ids ?? [], `registry_deltas[${index}].capability_ids`),
        });
    }));
    const justification = String(input.infrastructure_only_justification ?? '').trim();
    if (mode === 'NO_AGENT_INFRASTRUCTURE_ONLY') {
        if (owning_agent_ids.length || registry_deltas.length)
            throw new Error('infrastructure-only-must-not-own-agent');
        if (justification.length < 20)
            throw new Error('infrastructure-only-justification-required');
    }
    else {
        if (!owning_agent_ids.length)
            throw new Error('owning-agent-ids-required');
        if (!registry_deltas.length)
            throw new Error('registry-deltas-required');
        if (justification)
            throw new Error('infrastructure-only-justification-not-applicable');
        const owners = new Set(owning_agent_ids);
        for (const delta of registry_deltas)
            if (!owners.has(delta.agent_id))
                throw new Error(`registry-delta-agent-not-owner:${delta.agent_id}`);
        const expected = mode === 'REUSE_EXISTING_AGENT' || mode === 'SURFACE_BINDING_EXISTING_AGENTS' ? 'REUSE' : mode === 'EXTEND_EXISTING_AGENT' ? 'EXTEND' : 'CREATE';
        if (registry_deltas.some((delta) => delta.operation !== expected))
            throw new Error(`registry-delta-operation-mismatch:${expected}`);
    }
    return Object.freeze({
        schema: 'titan.workforce.roadmap-impact.v1', company_id, goal_id, subgoal_id, mode,
        owning_agent_ids, registry_deltas,
        infrastructure_only_justification: mode === 'NO_AGENT_INFRASTRUCTURE_ONLY' ? justification : null,
        identity_grants_authority: false,
    });
}
function assertRoadmapWorkforceImpactCoverage(impacts, expectedSubgoalIds) {
    const seen = new Set();
    for (const impact of impacts) {
        if (seen.has(impact.subgoal_id))
            throw new Error(`duplicate-workforce-impact:${impact.subgoal_id}`);
        seen.add(impact.subgoal_id);
    }
    const missing = expectedSubgoalIds.map((value) => id(value, 'expected_subgoal_id')).filter((value) => !seen.has(value));
    if (missing.length)
        throw new Error(`missing-workforce-impact:${missing.join(',')}`);
}
/** Validate the Agent Mesh roadmap projection at the package boundary without making
 * the runtime depend on the Agent Mesh roadmap file itself. */
function validateRoadmapAgentModelProjection(input) {
    const raw = (input.agent_model ?? input);
    const mode = String(raw.workforce_impact ?? '');
    if (!exports.TITAN_WORKFORCE_IMPACT_MODES.includes(mode))
        throw new Error('roadmap-agent-model-workforce-impact-invalid');
    const owners = ids(raw.owning_agent_ids ?? [], 'roadmap.agent_model.owning_agent_ids');
    const reason = String(raw.no_agent_reason ?? '').trim();
    if (mode === 'NO_AGENT_INFRASTRUCTURE_ONLY') {
        if (owners.length)
            throw new Error('roadmap-infrastructure-only-must-not-own-agent');
        if (reason.length < 20)
            throw new Error('roadmap-infrastructure-only-reason-required');
    }
    else {
        if (!owners.length)
            throw new Error('roadmap-owning-agent-ids-required');
        if (raw.registry_delta == null)
            throw new Error('roadmap-registry-delta-required');
        if (reason)
            throw new Error('roadmap-no-agent-reason-not-applicable');
    }
    return Object.freeze({ valid: true, mode });
}
function validateRoadmapWorkforceCoverage(subgoals) {
    const seen = new Set();
    for (const subgoal of subgoals) {
        const subgoalId = id(subgoal.subgoal_id, 'roadmap.subgoal_id');
        if (seen.has(subgoalId))
            throw new Error(`duplicate-roadmap-subgoal:${subgoalId}`);
        seen.add(subgoalId);
        validateRoadmapAgentModelProjection(subgoal);
    }
    return Object.freeze({ checked: seen.size, valid: true });
}
/** Reconcile a roadmap declaration against a canonical registry snapshot.
 * REUSE/EXTEND owners must already exist; CREATE owners must not. Capability
 * references on REUSE must already be registered. This validates identity only
 * and never grants execution authority. */
function reconcileRoadmapWorkforceImpact(impact, registry) {
    if (registry.company_id !== impact.company_id)
        throw new Error('workforce-impact-cross-company-registry-rejected');
    const canonical = new Map(registry.agents.map((agent) => [id(agent.agent_id, 'registry.agent_id'), new Set(ids(agent.capability_ids ?? [], 'registry.capability_ids'))]));
    if (impact.mode === 'NO_AGENT_INFRASTRUCTURE_ONLY')
        return Object.freeze({ valid: true, checked_agents: 0, identity_grants_authority: false });
    for (const delta of impact.registry_deltas) {
        const existing = canonical.get(delta.agent_id);
        if (delta.operation === 'CREATE') {
            if (existing)
                throw new Error(`workforce-impact-create-agent-already-exists:${delta.agent_id}`);
            continue;
        }
        if (!existing)
            throw new Error(`workforce-impact-canonical-agent-missing:${delta.agent_id}`);
        if (delta.operation === 'REUSE') {
            for (const capabilityId of delta.capability_ids)
                if (!existing.has(capabilityId))
                    throw new Error(`workforce-impact-reuse-capability-missing:${delta.agent_id}:${capabilityId}`);
        }
    }
    return Object.freeze({ valid: true, checked_agents: impact.registry_deltas.length, identity_grants_authority: false });
}
/** Adapter for the existing starter-agent registry so the roadmap contract can
 * consume canonical agent identities without making that legacy/ported registry
 * authoritative for execution. */
function starterAgentRegistrySnapshot(company_id, input) {
    const company = (0, contracts_js_1.assertTitanWorkforceLifecycleCompany)(company_id);
    const agents = Array.isArray(input.agents) ? input.agents : [];
    return Object.freeze({
        company_id: company,
        agents: Object.freeze(agents.map((raw, index) => {
            if (!raw || typeof raw !== 'object' || Array.isArray(raw))
                throw new Error(`starter-registry-agents[${index}]-object-required`);
            const agent = raw;
            return Object.freeze({
                agent_id: id(agent.role_definition_id ?? agent.agent_id ?? agent.agent_key, `starter-registry-agents[${index}].agent_id`),
                capability_ids: ids(agent.capability_ids ?? agent.operational_domains ?? [], `starter-registry-agents[${index}].capability_ids`),
            });
        })),
    });
}
/** Whole-roadmap workforce coverage audit. Missing ownership is reported as a
 * closure finding rather than auto-creating a generic agent. Infrastructure-only
 * subgoals are excluded from workforce coverage requirements. */
function auditRoadmapWorkforceCoverage(projections, registry) {
    const canonical = new Set(registry.agents.map((agent) => id(agent.agent_id, 'registry.agent_id')));
    const findings = [];
    const outcomeOwners = new Map();
    for (const projection of projections) {
        const subgoalId = id(projection.subgoal_id, 'coverage.subgoal_id');
        if (projection.mode === 'NO_AGENT_INFRASTRUCTURE_ONLY')
            continue;
        const owners = ids(projection.owning_agent_ids ?? [], 'coverage.owning_agent_ids');
        const painPoints = ids(projection.pain_point_ids ?? [], 'coverage.pain_point_ids');
        const outcomes = ids(projection.outcome_ids ?? [], 'coverage.outcome_ids');
        if (!owners.length && (painPoints.length || outcomes.length)) {
            for (const subject of [...painPoints, ...outcomes])
                findings.push(Object.freeze({
                    kind: 'MISSING_OWNER', subject_id: subject, subgoal_ids: Object.freeze([subgoalId]), agent_ids: Object.freeze([]),
                }));
            continue;
        }
        for (const owner of owners)
            if (!canonical.has(owner))
                findings.push(Object.freeze({
                    kind: 'MISSING_CANONICAL_AGENT', subject_id: owner, subgoal_ids: Object.freeze([subgoalId]), agent_ids: Object.freeze([owner]),
                }));
        for (const outcome of outcomes) {
            const entry = outcomeOwners.get(outcome) ?? { subgoals: new Set(), agents: new Set() };
            entry.subgoals.add(subgoalId);
            owners.forEach((owner) => entry.agents.add(owner));
            outcomeOwners.set(outcome, entry);
        }
    }
    for (const [outcome, ownership] of outcomeOwners)
        if (ownership.agents.size > 1)
            findings.push(Object.freeze({
                kind: 'CONFLICTING_OUTCOME_OWNERS', subject_id: outcome,
                subgoal_ids: Object.freeze([...ownership.subgoals].sort()), agent_ids: Object.freeze([...ownership.agents].sort()),
            }));
    return Object.freeze({ valid: findings.length === 0, findings: Object.freeze(findings) });
}
/** Convert audit findings into deterministic design recommendations. This is
 * advisory only: it never mutates the registry, creates an agent, or grants
 * authority. Ambiguity fails to MANUAL_REVIEW rather than guessing. */
function recommendWorkforceCoverageClosures(findings, registry, context = {}) {
    const infrastructure = new Set((context.infrastructure_subject_ids ?? []).map((v) => id(v, 'closure.infrastructure_subject_id')));
    const required = context.required_capability_by_subject ?? {};
    const agents = registry.agents.map((agent) => ({
        agent_id: id(agent.agent_id, 'closure.registry.agent_id'),
        capabilities: new Set(ids(agent.capability_ids ?? [], 'closure.registry.capability_ids')),
    })).sort((a, b) => a.agent_id.localeCompare(b.agent_id));
    return Object.freeze([...findings].sort((a, b) => `${a.kind}:${a.subject_id}`.localeCompare(`${b.kind}:${b.subject_id}`)).map((finding) => {
        const subject = id(finding.subject_id, 'closure.subject_id');
        if (finding.kind === 'CONFLICTING_OUTCOME_OWNERS')
            return Object.freeze({
                finding_kind: finding.kind, subject_id: subject, action: 'MANUAL_REVIEW',
                candidate_agent_ids: Object.freeze([...finding.agent_ids].sort()), reason_code: 'AMBIGUOUS_OWNERSHIP',
                confidence: 'REVIEW_REQUIRED', identity_grants_authority: false,
            });
        if (infrastructure.has(subject))
            return Object.freeze({
                finding_kind: finding.kind, subject_id: subject, action: 'NO_AGENT_INFRASTRUCTURE_ONLY',
                candidate_agent_ids: Object.freeze([]), reason_code: 'INFRASTRUCTURE_ONLY',
                confidence: 'HIGH', identity_grants_authority: false,
            });
        const capability = String(required[subject] ?? '').trim().toLowerCase();
        const exact = capability ? agents.filter((agent) => agent.capabilities.has(capability)) : [];
        if (exact.length === 1)
            return Object.freeze({
                finding_kind: finding.kind, subject_id: subject, action: 'REUSE_EXISTING_AGENT',
                candidate_agent_ids: Object.freeze([exact[0].agent_id]), reason_code: 'CANONICAL_CAPABILITY_MATCH',
                confidence: 'HIGH', identity_grants_authority: false,
            });
        if (exact.length > 1)
            return Object.freeze({
                finding_kind: finding.kind, subject_id: subject, action: 'MANUAL_REVIEW',
                candidate_agent_ids: Object.freeze(exact.map((agent) => agent.agent_id)), reason_code: 'AMBIGUOUS_OWNERSHIP',
                confidence: 'REVIEW_REQUIRED', identity_grants_authority: false,
            });
        if (finding.kind === 'MISSING_CANONICAL_AGENT')
            return Object.freeze({
                finding_kind: finding.kind, subject_id: subject, action: 'CREATE_NEW_AGENT',
                candidate_agent_ids: Object.freeze([]), reason_code: 'NO_SUITABLE_CANONICAL_IDENTITY',
                confidence: 'MEDIUM', identity_grants_authority: false,
            });
        if (agents.length === 1 && capability)
            return Object.freeze({
                finding_kind: finding.kind, subject_id: subject, action: 'EXTEND_EXISTING_AGENT',
                candidate_agent_ids: Object.freeze([agents[0].agent_id]), reason_code: 'CANONICAL_IDENTITY_EXTENSION',
                confidence: 'MEDIUM', identity_grants_authority: false,
            });
        return Object.freeze({
            finding_kind: finding.kind, subject_id: subject, action: 'CREATE_NEW_AGENT',
            candidate_agent_ids: Object.freeze([]), reason_code: 'NO_SUITABLE_CANONICAL_IDENTITY',
            confidence: 'MEDIUM', identity_grants_authority: false,
        });
    }));
}
/** Adapter for the authoritative roadmap JSON. It intentionally projects only
 * workforce ownership fields and never treats prose as a canonical ID. */
function projectAuthoritativeRoadmapCoverage(roadmap) {
    if (!roadmap || typeof roadmap !== 'object' || Array.isArray(roadmap))
        throw new Error('roadmap-object-required');
    const goals = roadmap.goals;
    if (!Array.isArray(goals))
        throw new Error('roadmap-goals-required');
    const projections = [];
    const unresolved = [];
    for (const goalRaw of goals) {
        if (!goalRaw || typeof goalRaw !== 'object' || Array.isArray(goalRaw))
            continue;
        const subgoals = goalRaw.subgoals;
        if (!Array.isArray(subgoals))
            continue;
        for (const subRaw of subgoals) {
            if (!subRaw || typeof subRaw !== 'object' || Array.isArray(subRaw))
                continue;
            const sub = subRaw;
            const subgoalId = id(sub.subgoal_id, 'roadmap.subgoal_id');
            const model = sub.agent_model;
            if (!model || typeof model !== 'object' || Array.isArray(model))
                continue;
            const agent = model;
            const mode = String(agent.workforce_impact ?? '').trim().toUpperCase();
            if (!exports.TITAN_WORKFORCE_IMPACT_MODES.includes(mode))
                throw new Error(`${subgoalId}-invalid-workforce-impact`);
            const painIds = ids(agent.pain_point_ids ?? [], `${subgoalId}.pain_point_ids`);
            const outcomeIds = ids(agent.outcome_ids ?? [], `${subgoalId}.outcome_ids`);
            projections.push(Object.freeze({ subgoal_id: subgoalId, mode, owning_agent_ids: ids(agent.owning_agent_ids ?? [], `${subgoalId}.owning_agent_ids`), pain_point_ids: painIds, outcome_ids: outcomeIds }));
            const painText = texts(agent.pain_points ?? [], `${subgoalId}.pain_points`);
            const outcomeText = texts(agent.desired_outcomes ?? [], `${subgoalId}.desired_outcomes`);
            if (!painIds.length && painText.length)
                unresolved.push(Object.freeze({ subgoal_id: subgoalId, kind: 'PAIN_POINT', values: Object.freeze(painText) }));
            if (!outcomeIds.length && outcomeText.length)
                unresolved.push(Object.freeze({ subgoal_id: subgoalId, kind: 'OUTCOME', values: Object.freeze(outcomeText) }));
        }
    }
    return Object.freeze({ projections: Object.freeze(projections.sort((a, b) => a.subgoal_id.localeCompare(b.subgoal_id))), unresolved_text_only: Object.freeze(unresolved.sort((a, b) => `${a.subgoal_id}:${a.kind}`.localeCompare(`${b.subgoal_id}:${b.kind}`))) });
}
exports.TITAN_OUTCOME_OWNERSHIP_CLASSES = Object.freeze([
    'EXCLUSIVE_PRIMARY', 'SHARED_COLLABORATIVE', 'SUPPORTING', 'CROSS_SURFACE_REUSE', 'AMBIGUOUS_MULTI_OWNER',
]);
function ownershipEvidence(roadmap) {
    if (!roadmap || typeof roadmap !== 'object' || Array.isArray(roadmap))
        throw new Error('roadmap-object-required');
    const goals = roadmap.goals;
    if (!Array.isArray(goals))
        throw new Error('roadmap-goals-required');
    const out = [];
    for (const goalRaw of goals) {
        if (!goalRaw || typeof goalRaw !== 'object' || Array.isArray(goalRaw))
            continue;
        const subgoals = goalRaw.subgoals;
        if (!Array.isArray(subgoals))
            continue;
        for (const subRaw of subgoals) {
            if (!subRaw || typeof subRaw !== 'object' || Array.isArray(subRaw))
                continue;
            const sub = subRaw;
            const model = sub.agent_model;
            if (!model || typeof model !== 'object' || Array.isArray(model))
                continue;
            const agent = model;
            const mode = String(agent.workforce_impact ?? '').trim().toUpperCase();
            if (!exports.TITAN_WORKFORCE_IMPACT_MODES.includes(mode))
                throw new Error(`${String(sub.subgoal_id)}-invalid-workforce-impact`);
            const delta = agent.registry_delta && typeof agent.registry_delta === 'object' && !Array.isArray(agent.registry_delta) ? agent.registry_delta : {};
            out.push(Object.freeze({
                subgoal_id: id(sub.subgoal_id, 'ownership.subgoal_id'), mode,
                agent_ids: ids(agent.owning_agent_ids ?? [], 'ownership.owning_agent_ids'),
                outcome_ids: ids(agent.outcome_ids ?? [], 'ownership.outcome_ids'),
                registry_delta_type: String(delta.type ?? '').trim().toUpperCase(),
                definition_home: delta.definition_home ? id(delta.definition_home, 'ownership.definition_home') : null,
                canonical_definition_homes: ids(Array.isArray(delta.canonical_definition_homes) ? delta.canonical_definition_homes : (delta.canonical_definition_homes && typeof delta.canonical_definition_homes === 'object' ? Object.values(delta.canonical_definition_homes) : (delta.canonical_definition_homes ? [delta.canonical_definition_homes] : [])), 'ownership.canonical_definition_homes'),
                uniqueness_nonduplication: String(agent.uniqueness_nonduplication ?? '').trim(),
            }));
        }
    }
    return Object.freeze(out.sort((a, b) => a.subgoal_id.localeCompare(b.subgoal_id)));
}
/** Classifies multi-agent outcome involvement using explicit roadmap structure only.
 * It never guesses a primary owner from prose and never turns ownership into authority. */
function classifyAuthoritativeRoadmapOutcomeOwnership(roadmap) {
    const evidence = ownershipEvidence(roadmap);
    const byOutcome = new Map();
    for (const row of evidence)
        for (const outcome of row.outcome_ids)
            (byOutcome.get(outcome) ?? (byOutcome.set(outcome, []), byOutcome.get(outcome))).push(row);
    const results = [];
    for (const [outcome, rows] of [...byOutcome].sort(([a], [b]) => a.localeCompare(b))) {
        const agents = [...new Set(rows.flatMap(r => r.agent_ids))].sort();
        const subgoals = [...new Set(rows.map(r => r.subgoal_id))].sort();
        if (agents.length <= 1) {
            results.push(Object.freeze({ outcome_id: outcome, classification: 'EXCLUSIVE_PRIMARY', subgoal_ids: Object.freeze(subgoals), agent_ids: Object.freeze(agents), blocking: false, reason_code: 'SINGLE_OWNER', identity_grants_authority: false }));
            continue;
        }
        if (rows.every(r => r.mode === 'SURFACE_BINDING_EXISTING_AGENTS')) {
            results.push(Object.freeze({ outcome_id: outcome, classification: 'CROSS_SURFACE_REUSE', subgoal_ids: Object.freeze(subgoals), agent_ids: Object.freeze(agents), blocking: false, reason_code: 'SURFACE_REUSE', identity_grants_authority: false }));
            continue;
        }
        const homes = new Set(rows.flatMap(r => [...(r.definition_home ? [r.definition_home] : []), ...r.canonical_definition_homes]));
        const definitionReuse = homes.size === 1 && rows.every(r => r.registry_delta_type === 'CANONICAL_AGENT_SEED' || r.registry_delta_type === 'REFERENCE_CANONICAL_AGENT');
        if (definitionReuse) {
            results.push(Object.freeze({ outcome_id: outcome, classification: 'SHARED_COLLABORATIVE', subgoal_ids: Object.freeze(subgoals), agent_ids: Object.freeze(agents), blocking: false, reason_code: 'CANONICAL_DEFINITION_REUSE', identity_grants_authority: false }));
            continue;
        }
        const explicitRoster = rows.length === 1 && rows[0].registry_delta_type.includes('ROSTER') && /non-duplicat|roster|hierarchy/i.test(rows[0].uniqueness_nonduplication);
        if (explicitRoster) {
            results.push(Object.freeze({ outcome_id: outcome, classification: 'SHARED_COLLABORATIVE', subgoal_ids: Object.freeze(subgoals), agent_ids: Object.freeze(agents), blocking: false, reason_code: 'EXPLICIT_SHARED_ROSTER', identity_grants_authority: false }));
            continue;
        }
        results.push(Object.freeze({ outcome_id: outcome, classification: 'AMBIGUOUS_MULTI_OWNER', subgoal_ids: Object.freeze(subgoals), agent_ids: Object.freeze(agents), blocking: true, reason_code: 'UNCLASSIFIED_MULTI_OWNER', identity_grants_authority: false }));
    }
    return Object.freeze(results);
}
/** Completion gate for SG-02. Business-facing work fails closed on missing ownership,
 * invalid registry impact, or unresolved multi-owner outcomes. */
function validateAuthoritativeRoadmapWorkforceCompletion(roadmap) {
    const projection = projectAuthoritativeRoadmapCoverage(roadmap);
    const blockers = [];
    for (const row of projection.projections) {
        if (row.mode === 'NO_AGENT_INFRASTRUCTURE_ONLY')
            continue;
        if (!row.owning_agent_ids.length && (row.pain_point_ids.length || row.outcome_ids.length))
            blockers.push({ subgoal_id: row.subgoal_id, code: 'MISSING_OWNER', subject_id: row.subgoal_id });
    }
    for (const unresolved of projection.unresolved_text_only)
        blockers.push({ subgoal_id: unresolved.subgoal_id, code: `UNRESOLVED_${unresolved.kind}_IDS`, subject_id: unresolved.subgoal_id });
    for (const c of classifyAuthoritativeRoadmapOutcomeOwnership(roadmap))
        if (c.blocking)
            for (const sg of c.subgoal_ids)
                blockers.push({ subgoal_id: sg, code: c.classification, subject_id: c.outcome_id });
    blockers.sort((a, b) => `${a.subgoal_id}:${a.code}:${a.subject_id}`.localeCompare(`${b.subgoal_id}:${b.code}:${b.subject_id}`));
    return Object.freeze({ valid: blockers.length === 0, checked: projection.projections.length, blockers: Object.freeze(blockers.map((b) => Object.freeze(b))), identity_grants_authority: false });
}
