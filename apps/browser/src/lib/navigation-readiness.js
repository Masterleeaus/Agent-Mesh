(function attachCodeeNavigationReadiness(global) {
    'use strict';

    const STATES = Object.freeze(['AVAILABLE','BETA','CONTRACT_ONLY','COMING_NEXT','DISABLED','DEPENDENCY_MISSING']);
    const INTERACTIVE = new Set(['AVAILABLE','BETA']);

    function setOf(value) {
        if (value instanceof Set) return value;
        return new Set((Array.isArray(value) ? value : []).map(item => String(item || '').trim()).filter(Boolean));
    }

    function hasRequirement(requirement, source) {
        if (!requirement) return true;
        if (source instanceof Set) return source.has(requirement);
        if (Array.isArray(source)) return source.includes(requirement);
        if (source && typeof source === 'object') return source[requirement] === true || source[requirement]?.available === true || source[requirement]?.ready === true;
        return false;
    }

    function resolve(entry, context = {}) {
        if (!entry || entry.kind !== 'page') return Object.freeze({ state: 'DISABLED', interactive: false, reason: 'not-a-page' });
        const requested = STATES.includes(String(entry.readiness || '').toUpperCase()) ? String(entry.readiness).toUpperCase() : 'AVAILABLE';
        if (entry.featureFlag && !hasRequirement(entry.featureFlag, context.featureFlags)) return Object.freeze({ state: 'DISABLED', interactive: false, reason: `feature-disabled:${entry.featureFlag}` });
        if (requested === 'CONTRACT_ONLY' || requested === 'COMING_NEXT' || requested === 'DISABLED') return Object.freeze({ state: requested, interactive: false, reason: requested.toLowerCase() });
        const views = context.availableViews == null ? null : setOf(context.availableViews);
        if (views && !views.has(entry.page)) return Object.freeze({ state: 'DEPENDENCY_MISSING', interactive: false, reason: `view-missing:${entry.page}` });
        for (const dependency of entry.dependencyRequirements || []) {
            if (!hasRequirement(dependency, context.dependencies)) return Object.freeze({ state: 'DEPENDENCY_MISSING', interactive: false, reason: `dependency-missing:${dependency}` });
        }
        const capabilities = setOf(context.capabilities);
        for (const capability of entry.capabilityRequirements || []) {
            if (!capabilities.has(capability)) return Object.freeze({ state: 'DEPENDENCY_MISSING', interactive: false, reason: `capability-missing:${capability}` });
        }
        return Object.freeze({ state: requested, interactive: INTERACTIVE.has(requested), reason: requested === 'BETA' ? 'beta' : 'ready' });
    }

    function resolveAll(entries, context = {}) {
        return (Array.isArray(entries) ? entries : []).map(entry => Object.freeze({ ...entry, resolved: resolve(entry, context) }));
    }

    global.CodeeNavigationReadiness = Object.freeze({ STATES, resolve, resolveAll });
})(typeof globalThis !== 'undefined' ? globalThis : this);
