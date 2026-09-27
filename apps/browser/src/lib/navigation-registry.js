(function attachTitanZeroBrowserNavigationRegistry(global) {
    'use strict';

    const KIND_GROUP = 'group';
    const KIND_PAGE = 'page';
    const ALLOWED_KINDS = new Set([KIND_GROUP, KIND_PAGE]);
    const store = new Map();

    const DEFAULT_NAVIGATION = Object.freeze([
        { id: 'group.zero', kind: KIND_GROUP, label: 'Titan Zero', order: 10 },
        { id: 'zero.overview', kind: KIND_PAGE, label: 'Zero', icon: '◉', parent: 'group.zero', order: 10, page: 'dashboard', context: 'Company-scoped browser node status, attention and live operational state', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'zero.work', kind: KIND_PAGE, label: 'Work', icon: '▶', parent: 'group.zero', order: 20, page: 'runner', context: 'Start or continue governed browser work for the current company', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'zero.active-work', kind: KIND_PAGE, label: 'Active Work', icon: '⚡', parent: 'group.zero', order: 30, page: 'plans', context: 'Running browser work and exact conversation bindings', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'zero.outcomes', kind: KIND_PAGE, label: 'Outcomes', icon: '✓', parent: 'group.zero', order: 40, page: 'history', context: 'Completed, blocked, stopped and failed work outcomes', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'zero.evidence', kind: KIND_PAGE, label: 'Evidence', icon: '▣', parent: 'group.zero', order: 50, page: 'artifacts', context: 'Verification evidence, receipts and outcome lineage', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },

        { id: 'group.workforce', kind: KIND_GROUP, label: 'Workforce', order: 20 },
        { id: 'workforce.control', kind: KIND_PAGE, label: 'Workforce', icon: '◎', parent: 'group.workforce', order: 10, page: 'workforce', context: 'Company-scoped workforce activity, assignments and governed browser work', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'workforce.browser', kind: KIND_PAGE, label: 'Browser', icon: '🌐', parent: 'group.workforce', order: 20, page: 'browser', context: 'Governed browser actions, observations, screenshots, dialogs and composed work', readiness: 'AVAILABLE', capabilityRequirements: ['browser.snapshot'], dependencyRequirements: [], featureFlag: null },
        { id: 'workforce.intelligence', kind: KIND_PAGE, label: 'Intelligence', icon: '🧠', parent: 'group.workforce', order: 30, page: 'intelligence', context: 'Local and browser intelligence used to assist governed work', readiness: 'AVAILABLE', capabilityRequirements: ['ai.gateway.status'], dependencyRequirements: [], featureFlag: null },

        { id: 'group.systems', kind: KIND_GROUP, label: 'Systems', order: 30 },
        { id: 'systems.connections', kind: KIND_PAGE, label: 'Connections', icon: '🔌', parent: 'group.systems', order: 10, page: 'connections', context: 'Titan Zero, browser, local intelligence and approved integration health', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'systems.mcp', kind: KIND_PAGE, label: 'Tools & MCP', icon: '🧰', parent: 'group.systems', order: 20, page: 'mcp', context: 'Approved tools, resources and governed external capability calls', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'systems.knowledge', kind: KIND_PAGE, label: 'Knowledge', icon: '📚', parent: 'group.systems', order: 30, page: 'knowledge', context: 'Governed company and product knowledge available to the browser node', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },

        { id: 'group.node', kind: KIND_GROUP, label: 'Browser Node', order: 40 },
        { id: 'node.diagnostics', kind: KIND_PAGE, label: 'Diagnostics', icon: '📊', parent: 'group.node', order: 10, page: 'diagnostics', context: 'Browser Node health, recovery and capability diagnostics', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'node.settings', kind: KIND_PAGE, label: 'Settings', icon: '⚙', parent: 'group.node', order: 20, page: 'settings', context: 'Browser Node preferences, local intelligence and recovery settings', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null },
        { id: 'node.about', kind: KIND_PAGE, label: 'About', icon: 'ℹ', parent: 'group.node', order: 30, page: 'about', context: 'Titan Zero Browser Node identity and capability information', readiness: 'AVAILABLE', capabilityRequirements: [], dependencyRequirements: [], featureFlag: null }
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
    global.TitanZeroBrowserNavigationRegistry = global.CodeeNavigationRegistry;
})(typeof globalThis !== 'undefined' ? globalThis : this);
