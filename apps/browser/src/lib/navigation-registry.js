(function attachCodeeNavigationRegistry(global) {
    'use strict';

    const KIND_GROUP = 'group';
    const KIND_PAGE = 'page';
    const ALLOWED_KINDS = new Set([KIND_GROUP, KIND_PAGE]);
    const store = new Map();

    const DEFAULT_NAVIGATION = Object.freeze([
        { id: 'group.workspace', kind: KIND_GROUP, label: 'Workspace', order: 10 },
        { id: 'workspace.dashboard', kind: KIND_PAGE, label: 'Dashboard', icon: '🏠', parent: 'group.workspace', order: 10, page: 'dashboard', context: 'Codee project and runtime overview', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'workspace.runner', kind: KIND_PAGE, label: 'Runner', icon: '▶', parent: 'group.workspace', order: 20, page: 'runner', context: 'Conversation-aware plan orchestration', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'workspace.plans', kind: KIND_PAGE, label: 'Active Plans', icon: '⚡', parent: 'group.workspace', order: 30, page: 'plans', context: 'Active plan monitoring', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'workspace.history', kind: KIND_PAGE, label: 'History', icon: '🕘', parent: 'group.workspace', order: 40, page: 'history', context: 'Completed, failed, blocked and stopped plan history', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'workspace.artifacts', kind: KIND_PAGE, label: 'Artifacts', icon: '📦', parent: 'group.workspace', order: 50, page: 'artifacts', context: 'Verified artifact lineage and receipts', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },

        { id: 'group.intelligence', kind: KIND_GROUP, label: 'Intelligence', order: 20 },
        { id: 'intelligence.brain', kind: KIND_PAGE, label: 'Intelligence', icon: '🧠', parent: 'group.intelligence', order: 10, page: 'intelligence', context: 'Codee project understanding and reasoning', readiness: 'AVAILABLE', capabilityRequirements: ['ai.gateway.status'], dependencyRequirements: [], featureFlag: null },
        { id: 'intelligence.workforce', kind: KIND_PAGE, label: 'AI Workforce', icon: '🤖', parent: 'group.intelligence', order: 20, page: 'workforce', context: 'Fourteen specialist managers and their evidence', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'intelligence.repository', kind: KIND_PAGE, label: 'Repository', icon: '🗂', parent: 'group.intelligence', order: 30, page: 'repository', context: 'Repository intelligence workspace', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'intelligence.titan', kind: KIND_PAGE, label: 'Titan Zero', icon: '🧩', parent: 'group.intelligence', order: 40, page: 'titan-zero', context: 'Titan Zero architecture and extension intelligence', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'intelligence.browser', kind: KIND_PAGE, label: 'Browser', icon: '🌐', parent: 'group.intelligence', order: 50, page: 'browser', context: 'Browser Control Engine runtime and governed tab inventory', readiness: 'AVAILABLE', capabilityRequirements: ['browser.snapshot'], dependencyRequirements: ['browser.execution'], featureFlag: null },

        { id: 'group.infrastructure', kind: KIND_GROUP, label: 'Infrastructure', order: 30 },
        { id: 'infrastructure.connections', kind: KIND_PAGE, label: 'Connections', icon: '🔌', parent: 'group.infrastructure', order: 10, page: 'connections', context: 'AI, MCP, host and browser connection health', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'infrastructure.mcp', kind: KIND_PAGE, label: 'MCP', icon: '🧰', parent: 'group.infrastructure', order: 20, page: 'mcp', context: 'Governed MCP tools, resources and calls', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'infrastructure.repository-host', kind: KIND_PAGE, label: 'Repository Host', icon: '🖥', parent: 'group.infrastructure', order: 30, page: 'repository-host', context: 'Privileged repository host, backups and rollback capability', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: ['repository.host'], featureFlag: null },

        { id: 'group.knowledge', kind: KIND_GROUP, label: 'Knowledge', order: 40 },
        { id: 'knowledge.prompts', kind: KIND_PAGE, label: 'Prompts', icon: '📝', parent: 'group.knowledge', order: 10, page: 'prompts', context: 'Prompt library', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'knowledge.skills', kind: KIND_PAGE, label: 'Skills', icon: '🛠', parent: 'group.knowledge', order: 20, page: 'skills', context: 'Skills library', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'knowledge.knowledge', kind: KIND_PAGE, label: 'Knowledge', icon: '📚', parent: 'group.knowledge', order: 30, page: 'knowledge', context: 'Governed project and product knowledge', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },

        { id: 'group.system', kind: KIND_GROUP, label: 'System', order: 50 },
        { id: 'system.diagnostics', kind: KIND_PAGE, label: 'Diagnostics', icon: '📊', parent: 'group.system', order: 10, page: 'diagnostics', context: 'Runtime diagnostics', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'system.settings', kind: KIND_PAGE, label: 'Settings', icon: '⚙', parent: 'group.system', order: 20, page: 'settings', context: 'Codee preferences', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'system.about', kind: KIND_PAGE, label: 'About', icon: 'ℹ', parent: 'group.system', order: 30, page: 'about', context: 'Codee information', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null }
    ]);

    function clone(value, seen = new WeakMap()) {
        if (!value || typeof value !== 'object') return value;
        if (seen.has(value)) return seen.get(value);
        const out = Array.isArray(value) ? [] : {};
        seen.set(value, out);
        for (const [key, child] of Object.entries(value)) out[key] = clone(child, seen);
        return out;
    }

    function deepFreeze(value, seen = new WeakSet()) {
        if (!value || typeof value !== 'object' || seen.has(value)) return value;
        seen.add(value);
        for (const child of Object.values(value)) deepFreeze(child, seen);
        return Object.freeze(value);
    }

    function normalizeString(value) { return String(value ?? '').trim(); }
    function normalizeList(value) {
        return Array.from(new Set((Array.isArray(value) ? value : []).map(normalizeString).filter(Boolean))).slice(0, 64);
    }

    function normalizeEntry(record) {
        if (!record || typeof record !== 'object') throw new Error('Navigation entry must be an object');
        const id = normalizeString(record.id);
        const kind = normalizeString(record.kind).toLowerCase();
        const label = normalizeString(record.label);
        if (!id) throw new Error('Navigation entry requires a stable id');
        if (!ALLOWED_KINDS.has(kind)) throw new Error(`Navigation entry ${id} has invalid kind`);
        if (!label) throw new Error(`Navigation entry ${id} requires a label`);
        const page = kind === KIND_PAGE ? normalizeString(record.page).toLowerCase() : '';
        const parent = normalizeString(record.parent) || null;
        if (kind === KIND_PAGE && !page) throw new Error(`Navigation page ${id} requires a destination`);
        const normalized = {
            id,
            kind,
            label: label.slice(0, 120),
            icon: normalizeString(record.icon).slice(0, 16),
            parent,
            order: Number.isFinite(Number(record.order)) ? Math.max(-100000, Math.min(100000, Math.round(Number(record.order)))) : 0,
            page: page || null,
            context: normalizeString(record.context).slice(0, 240),
            readiness: normalizeString(record.readiness || 'AVAILABLE').toUpperCase(),
            capabilityRequirements: normalizeList(record.capabilityRequirements),
            dependencyRequirements: normalizeList(record.dependencyRequirements),
            featureFlag: normalizeString(record.featureFlag) || null
        };
        return deepFreeze(normalized);
    }

    function register(record) {
        const normalized = normalizeEntry(record);
        if (store.has(normalized.id)) throw new Error(`Duplicate navigation id: ${normalized.id}`);
        store.set(normalized.id, normalized);
        return normalized;
    }

    function registerMany(records) {
        const list = Array.isArray(records) ? records : [];
        const staged = list.map(normalizeEntry);
        const seen = new Set(store.keys());
        for (const entry of staged) {
            if (seen.has(entry.id)) throw new Error(`Duplicate navigation id: ${entry.id}`);
            seen.add(entry.id);
        }
        for (const entry of staged) store.set(entry.id, entry);
        return staged.length;
    }

    function installDefaults() {
        if (store.size) return store.size;
        registerMany(DEFAULT_NAVIGATION);
        return store.size;
    }

    function list() {
        return Array.from(store.values())
            .sort((a, b) => (a.parent || '').localeCompare(b.parent || '') || a.order - b.order || a.id.localeCompare(b.id));
    }

    function validate({ availableViews = null } = {}) {
        const entries = list();
        const errors = [];
        const ids = new Set(entries.map(entry => entry.id));
        const destinations = new Map();
        const views = Array.isArray(availableViews) ? new Set(availableViews.map(item => normalizeString(item).toLowerCase()).filter(Boolean)) : null;
        for (const entry of entries) {
            if (entry.parent && !ids.has(entry.parent)) errors.push({ code: 'MISSING_PARENT', id: entry.id, parent: entry.parent });
            if (entry.kind !== KIND_PAGE) continue;
            if (destinations.has(entry.page)) errors.push({ code: 'DUPLICATE_DESTINATION', id: entry.id, page: entry.page, otherId: destinations.get(entry.page) });
            else destinations.set(entry.page, entry.id);
            if (views && !views.has(entry.page) && !['CONTRACT_ONLY','COMING_NEXT','DISABLED'].includes(entry.readiness)) {
                errors.push({ code: 'VIEW_UNAVAILABLE', id: entry.id, page: entry.page });
            }
        }
        return deepFreeze({ ok: errors.length === 0, errors, entryCount: entries.length });
    }

    function snapshot(options = {}) {
        const validation = validate(options);
        return deepFreeze({ entries: list().map(entry => clone(entry)), validation: clone(validation) });
    }

    const registry = {
        installDefaults,
        register,
        registerMany,
        get(id) { return store.get(normalizeString(id)) || null; },
        list,
        validate,
        snapshot,
        clear() { store.clear(); },
        defaults() { return DEFAULT_NAVIGATION.map(entry => clone(entry)); }
    };

    global.CodeeNavigationRegistry = Object.freeze(registry);
})(typeof globalThis !== 'undefined' ? globalThis : this);
