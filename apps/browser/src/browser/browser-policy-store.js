(function attachCodeeBrowserPolicyStore(global) {
    'use strict';

    const STORAGE_KEY = 'codeeBrowserPolicyV1';
    const MAX_AUDIT_EVENTS = 120;
    let memoryState = null;
    let mutationQueue = Promise.resolve();

    function requirePolicy() {
        if (!global.CodeeBrowserPolicy) throw new Error('Browser policy runtime is unavailable');
    }

    function clone(value) {
        if (value === null || value === undefined) return value;
        return JSON.parse(JSON.stringify(value));
    }

    function sessionArea() {
        const area = global.chrome?.storage?.session;
        return area && typeof area.get === 'function' && typeof area.set === 'function' ? area : null;
    }

    function emptyState() {
        return { version: 1, tabs: {}, audit: [] };
    }

    function sanitizeAuditRow(row) {
        if (!row || typeof row !== 'object') return null;
        const tabId = Number(row.tabId);
        return {
            at: Number.isFinite(Number(row.at)) ? Math.floor(Number(row.at)) : Date.now(),
            action: String(row.action || 'event').slice(0, 48),
            tabId: Number.isInteger(tabId) && tabId >= 0 ? tabId : null,
            origin: String(row.origin || '').slice(0, 512),
            grant: String(row.grant || '').slice(0, 64),
            capabilityId: String(row.capabilityId || '').slice(0, 128),
            fromState: String(row.fromState || '').slice(0, 64),
            toState: String(row.toState || '').slice(0, 64),
            reason: String(row.reason || '').slice(0, 160)
        };
    }

    function sanitizeState(raw) {
        requirePolicy();
        const state = emptyState();
        const sourceTabs = raw?.tabs && typeof raw.tabs === 'object' ? raw.tabs : {};
        for (const [key, value] of Object.entries(sourceTabs).slice(0, 200)) {
            if (!/^tab_\d+$/.test(key)) continue;
            const normalized = global.CodeeBrowserPolicy.normalizeRecord(value, Date.now());
            if (normalized && normalized.state !== 'disconnected') state.tabs[key] = normalized;
        }
        const audit = Array.isArray(raw?.audit) ? raw.audit : [];
        state.audit = audit.map(sanitizeAuditRow).filter(Boolean).slice(-MAX_AUDIT_EVENTS);
        return state;
    }

    async function readState() {
        const area = sessionArea();
        if (area) {
            const result = await area.get([STORAGE_KEY]);
            return sanitizeState(result?.[STORAGE_KEY]);
        }
        return sanitizeState(memoryState || emptyState());
    }

    async function writeState(state) {
        const safe = sanitizeState(state);
        const area = sessionArea();
        if (area) await area.set({ [STORAGE_KEY]: safe });
        else memoryState = clone(safe);
        return safe;
    }

    function tabKey(tabId) {
        const number = Number(tabId);
        if (!Number.isInteger(number) || number < 0) throw new Error('Invalid browser tab id');
        return `tab_${number}`;
    }

    function appendAudit(state, row) {
        const safe = sanitizeAuditRow(row);
        if (!safe) return;
        state.audit = [...(Array.isArray(state.audit) ? state.audit : []), safe].slice(-MAX_AUDIT_EVENTS);
    }

    function enqueue(mutator) {
        const operation = mutationQueue.then(async () => {
            const state = await readState();
            return mutator(state);
        });
        mutationQueue = operation.catch(() => {});
        return operation;
    }

    function failure(error) {
        return { ok: false, reason: String(error?.code || error?.message || error || 'browser-policy-error').slice(0, 160) };
    }

    async function connect(tab, options = {}) {
        requirePolicy();
        return enqueue(async state => {
            try {
                const now = Date.now();
                const record = global.CodeeBrowserPolicy.connect(tab, { now, ttlMs: options.ttlMs });
                const key = tabKey(record.tabId);
                const previous = state.tabs[key] || null;
                state.tabs[key] = record;
                appendAudit(state, { at: now, action: 'connect', tabId: record.tabId, origin: record.origin, fromState: previous?.state || 'disconnected', toState: record.state, reason: 'explicit-user-connection' });
                await writeState(state);
                return { ok: true, record: clone(record), sessionStorageAvailable: !!sessionArea() };
            } catch (error) { return failure(error); }
        });
    }

    async function grant(tab, grantName, options = {}) {
        requirePolicy();
        return enqueue(async state => {
            try {
                const now = Date.now();
                const target = global.CodeeBrowserPolicy.inspectTarget(tab);
                if (!target.ok) return { ok: false, reason: target.reason };
                const key = tabKey(target.tabId);
                const previous = state.tabs[key] || null;
                if (!previous) return { ok: false, reason: 'not-connected' };
                const record = global.CodeeBrowserPolicy.grant(previous, tab, grantName, { now, ttlMs: options.ttlMs });
                state.tabs[key] = record;
                appendAudit(state, { at: now, action: 'grant', tabId: record.tabId, origin: record.origin, grant: grantName, fromState: previous.state, toState: record.state, reason: 'explicit-user-grant' });
                await writeState(state);
                return { ok: true, record: clone(record), sessionStorageAvailable: !!sessionArea() };
            } catch (error) { return failure(error); }
        });
    }

    async function revoke(tabId, grantName, options = {}) {
        requirePolicy();
        return enqueue(async state => {
            try {
                const now = Date.now();
                const key = tabKey(tabId);
                const previous = state.tabs[key] || null;
                if (!previous) return { ok: false, reason: 'not-connected' };
                const record = global.CodeeBrowserPolicy.revoke(previous, grantName, { now });
                if (record.state === 'disconnected') delete state.tabs[key];
                else state.tabs[key] = record;
                appendAudit(state, { at: now, action: 'revoke', tabId: Number(tabId), origin: previous.origin, grant: grantName, fromState: previous.state, toState: record.state, reason: String(options.reason || 'explicit-user-revoke').slice(0, 160) });
                await writeState(state);
                return { ok: true, record: record.state === 'disconnected' ? null : clone(record), state: record.state, sessionStorageAvailable: !!sessionArea() };
            } catch (error) { return failure(error); }
        });
    }

    async function disconnect(tabId, options = {}) {
        return enqueue(async state => {
            try {
                const now = Date.now();
                const key = tabKey(tabId);
                const previous = state.tabs[key] || null;
                delete state.tabs[key];
                appendAudit(state, { at: now, action: 'disconnect', tabId: Number(tabId), origin: previous?.origin || '', fromState: previous?.state || 'disconnected', toState: 'disconnected', reason: String(options.reason || 'explicit-user-disconnect').slice(0, 160) });
                await writeState(state);
                return { ok: true, record: null, previous: clone(previous), sessionStorageAvailable: !!sessionArea() };
            } catch (error) { return failure(error); }
        });
    }

    async function get(tabId) {
        await mutationQueue;
        try {
            const state = await readState();
            const key = tabKey(tabId);
            const record = state.tabs[key] || null;
            return { ok: true, record: clone(record), sessionStorageAvailable: !!sessionArea() };
        } catch (error) { return failure(error); }
    }

    async function list() {
        await mutationQueue;
        const state = await readState();
        return {
            ok: true,
            records: Object.values(state.tabs).map(clone),
            sessionStorageAvailable: !!sessionArea()
        };
    }

    async function authorize(capabilityId, tab, capability) {
        requirePolicy();
        const now = Date.now();
        if (capability?.permissionClass === 'tab_metadata' || capability?.id === 'browser.tabs') {
            return global.CodeeBrowserPolicy.authorize(null, capability, null, { now });
        }
        const target = global.CodeeBrowserPolicy.inspectTarget(tab);
        if (!target.ok) return { ok: false, reason: target.reason, state: 'disconnected' };
        const current = await get(target.tabId);
        if (!current.ok) return current;
        const result = global.CodeeBrowserPolicy.authorize(current.record, capability, tab, { now });
        if (!result.ok || capability?.permissionClass === 'developer_execute') {
            enqueue(async state => {
                appendAudit(state, { at: now, action: 'authorize', tabId: target.tabId, origin: target.origin, capabilityId, fromState: current.record?.state || 'disconnected', toState: current.record?.state || 'disconnected', reason: result.reason });
                await writeState(state);
                return true;
            }).catch(() => {});
        }
        return result;
    }

    async function audit(limit = 40) {
        await mutationQueue;
        const state = await readState();
        const bounded = Math.max(1, Math.min(120, Number(limit) || 40));
        return state.audit.slice(-bounded).map(clone);
    }

    async function status() {
        await mutationQueue;
        const state = await readState();
        const records = Object.values(state.tabs);
        const states = { 'connected-read': 0, 'connected-interactive': 0, 'developer-evaluate-enabled': 0 };
        for (const record of records) if (Object.prototype.hasOwnProperty.call(states, record.state)) states[record.state] += 1;
        return {
            policyVersion: global.CodeeBrowserPolicy.POLICY_VERSION,
            connectedTabs: records.length,
            states,
            developerExecutionEnabledTabs: states['developer-evaluate-enabled'],
            sessionStorageAvailable: !!sessionArea(),
            persistence: sessionArea() ? 'chrome.storage.session' : 'worker-memory-fail-closed',
            auditEvents: state.audit.length,
            defaultTtlMs: clone(global.CodeeBrowserPolicy.DEFAULT_TTL_MS),
            maxTtlMs: clone(global.CodeeBrowserPolicy.MAX_TTL_MS)
        };
    }

    global.CodeeBrowserPolicyStore = Object.freeze({
        STORAGE_KEY,
        MAX_AUDIT_EVENTS,
        connect,
        grant,
        revoke,
        disconnect,
        get,
        list,
        authorize,
        audit,
        status
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
