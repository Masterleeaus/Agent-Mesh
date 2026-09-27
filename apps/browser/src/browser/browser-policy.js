(function attachCodeeBrowserPolicy(global) {
    'use strict';

    const POLICY_VERSION = 1;
    const STATES = Object.freeze(['disconnected', 'connected-read', 'connected-interactive', 'developer-evaluate-enabled']);
    const GRANTS = Object.freeze(['read', 'interactive', 'developer_execute']);
    const DEFAULT_TTL_MS = Object.freeze({
        read: 30 * 60 * 1000,
        interactive: 15 * 60 * 1000,
        developer_execute: 5 * 60 * 1000
    });
    const MAX_TTL_MS = Object.freeze({
        read: 4 * 60 * 60 * 1000,
        interactive: 60 * 60 * 1000,
        developer_execute: 15 * 60 * 1000
    });
    const MIN_TTL_MS = 1000;
    const RESTRICTED_HOSTS = new Set(['chromewebstore.google.com', 'chrome.google.com']);

    function clone(value) {
        if (value === null || value === undefined) return value;
        return JSON.parse(JSON.stringify(value));
    }

    function policyError(code, message) {
        const error = new Error(message || code);
        error.code = code;
        return error;
    }

    function safeNow(value) {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? Math.floor(number) : Date.now();
    }

    function normalizeTabId(value) {
        if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
        const number = Number(value);
        return Number.isInteger(number) && number >= 0 ? number : null;
    }

    function inspectTarget(tab) {
        const tabId = normalizeTabId(tab?.id ?? tab?.tabId);
        if (tabId === null) return { ok: false, reason: 'invalid-tab' };
        const rawUrl = String(tab?.url || '').trim();
        if (!rawUrl || rawUrl.length > 8192) return { ok: false, reason: 'invalid-url', tabId };
        let url;
        try { url = new URL(rawUrl); } catch (_error) { return { ok: false, reason: 'invalid-url', tabId }; }
        if (!['http:', 'https:'].includes(url.protocol)) return { ok: false, reason: 'restricted-scheme', tabId, scheme: url.protocol };
        const hostname = String(url.hostname || '').toLowerCase();
        if (RESTRICTED_HOSTS.has(hostname) && (hostname !== 'chrome.google.com' || url.pathname.toLowerCase().includes('/webstore'))) {
            return { ok: false, reason: 'restricted-origin', tabId, origin: url.origin };
        }
        if (url.username || url.password) return { ok: false, reason: 'credential-bearing-url', tabId, origin: url.origin };
        return { ok: true, tabId, origin: url.origin, scheme: url.protocol, hostname };
    }

    function ttlFor(grant, requested) {
        if (!GRANTS.includes(grant)) throw policyError('invalid-grant', `Unknown browser grant: ${grant}`);
        const number = Number(requested);
        if (!Number.isFinite(number) || number <= 0) return DEFAULT_TTL_MS[grant];
        return Math.max(MIN_TTL_MS, Math.min(MAX_TTL_MS[grant], Math.floor(number)));
    }

    function normalizeGrant(raw, now) {
        if (!raw || typeof raw !== 'object') return null;
        const grantedAt = Number(raw.grantedAt);
        const expiresAt = Number(raw.expiresAt);
        if (!Number.isFinite(grantedAt) || !Number.isFinite(expiresAt) || expiresAt <= now || expiresAt <= grantedAt) return null;
        return { grantedAt: Math.floor(grantedAt), expiresAt: Math.floor(expiresAt) };
    }

    function deriveState(grants) {
        const read = !!grants.read;
        const interactive = read && !!grants.interactive;
        const developer = interactive && !!grants.developer_execute;
        if (developer) return 'developer-evaluate-enabled';
        if (interactive) return 'connected-interactive';
        if (read) return 'connected-read';
        return 'disconnected';
    }

    function normalizeRecord(record, nowValue = Date.now()) {
        const now = safeNow(nowValue);
        if (!record || typeof record !== 'object') return null;
        const tabId = normalizeTabId(record.tabId);
        const origin = String(record.origin || '').slice(0, 2048);
        if (tabId === null || !/^https?:\/\//i.test(origin)) return null;
        const grants = Object.create(null);
        for (const grant of GRANTS) {
            const normalized = normalizeGrant(record.grants?.[grant], now);
            if (normalized) grants[grant] = normalized;
        }
        if (!grants.read) {
            delete grants.interactive;
            delete grants.developer_execute;
        } else if (!grants.interactive) {
            delete grants.developer_execute;
        }
        const connectedAt = Number(record.connectedAt);
        const updatedAt = Number(record.updatedAt);
        return {
            version: POLICY_VERSION,
            tabId,
            origin,
            state: deriveState(grants),
            connectedAt: Number.isFinite(connectedAt) ? Math.floor(connectedAt) : now,
            updatedAt: Number.isFinite(updatedAt) ? Math.floor(updatedAt) : now,
            grants: clone(grants)
        };
    }

    function assertTargetMatches(record, tab, nowValue = Date.now()) {
        const target = inspectTarget(tab);
        if (!target.ok) throw policyError(target.reason, `Browser target rejected: ${target.reason}`);
        const normalized = normalizeRecord(record, nowValue);
        if (!normalized || normalized.state === 'disconnected') throw policyError('not-connected', 'Browser tab is not connected');
        if (normalized.tabId !== target.tabId) throw policyError('tab-mismatch', 'Browser policy tab does not match target tab');
        if (normalized.origin !== target.origin) throw policyError('origin-mismatch', 'Browser policy origin does not match current tab origin');
        return { target, record: normalized };
    }

    function connect(tab, options = {}) {
        const target = inspectTarget(tab);
        if (!target.ok) throw policyError(target.reason, `Browser target rejected: ${target.reason}`);
        const now = safeNow(options.now);
        const ttlMs = ttlFor('read', options.ttlMs);
        return {
            version: POLICY_VERSION,
            tabId: target.tabId,
            origin: target.origin,
            state: 'connected-read',
            connectedAt: now,
            updatedAt: now,
            grants: {
                read: { grantedAt: now, expiresAt: now + ttlMs }
            }
        };
    }

    function grant(record, tab, grantName, options = {}) {
        const grantNameSafe = String(grantName || '');
        if (!GRANTS.includes(grantNameSafe)) throw policyError('invalid-grant', `Unknown browser grant: ${grantNameSafe}`);
        const now = safeNow(options.now);
        const normalizedAtNow = normalizeRecord(record, now);
        const { target } = assertTargetMatches(normalizedAtNow, tab, now);
        if (grantNameSafe === 'interactive' && !normalizedAtNow.grants.read) throw policyError('read-grant-required', 'Read grant is required before interactive access');
        if (grantNameSafe === 'developer_execute' && !normalizedAtNow.grants.interactive) throw policyError('interactive-grant-required', 'Interactive grant is required before developer execution');
        const ttlMs = ttlFor(grantNameSafe, options.ttlMs);
        const grants = clone(normalizedAtNow.grants) || {};
        grants[grantNameSafe] = { grantedAt: now, expiresAt: now + ttlMs };
        const next = normalizeRecord({
            ...normalizedAtNow,
            origin: target.origin,
            updatedAt: now,
            grants
        }, now);
        return clone(next);
    }

    function revoke(record, grantName, options = {}) {
        const grantNameSafe = String(grantName || '');
        if (!GRANTS.includes(grantNameSafe)) throw policyError('invalid-grant', `Unknown browser grant: ${grantNameSafe}`);
        const now = safeNow(options.now);
        const normalized = normalizeRecord(record, now);
        if (!normalized) throw policyError('not-connected', 'Browser tab is not connected');
        const grants = clone(normalized.grants) || {};
        if (grantNameSafe === 'read') {
            delete grants.read;
            delete grants.interactive;
            delete grants.developer_execute;
        } else if (grantNameSafe === 'interactive') {
            delete grants.interactive;
            delete grants.developer_execute;
        } else {
            delete grants.developer_execute;
        }
        return clone(normalizeRecord({ ...normalized, updatedAt: now, grants }, now));
    }

    function requiredStateFor(permissionClass) {
        if (permissionClass === 'tab_metadata') return 'disconnected';
        if (permissionClass === 'tab_session') return 'connected-read';
        if (permissionClass === 'page_read' || permissionClass === 'page_diagnostics') return 'connected-read';
        if (permissionClass === 'page_navigation' || permissionClass === 'page_interact') return 'connected-interactive';
        if (permissionClass === 'developer_execute') return 'developer-evaluate-enabled';
        return null;
    }

    function stateRank(state) {
        return STATES.indexOf(state);
    }

    function authorize(record, capability, tab, options = {}) {
        if (!capability || typeof capability !== 'object' || !String(capability.id || '').startsWith('browser.')) {
            return { ok: false, reason: 'unknown-capability' };
        }
        if (capability.id === 'browser.tabs' || capability.permissionClass === 'tab_metadata') {
            return { ok: true, reason: 'tab-metadata', state: 'disconnected', requiredState: 'disconnected', policyOnly: true };
        }
        const target = inspectTarget(tab);
        if (!target.ok) return { ok: false, reason: target.reason, state: 'disconnected' };
        if (capability.id === 'browser.connect') {
            return { ok: true, reason: 'connect-allowed', state: 'disconnected', requiredState: 'disconnected', policyOnly: true, origin: target.origin };
        }
        const now = safeNow(options.now);
        const normalized = normalizeRecord(record, now);
        if (!normalized || normalized.state === 'disconnected') return { ok: false, reason: 'not-connected', state: 'disconnected' };
        if (normalized.tabId !== target.tabId) return { ok: false, reason: 'tab-mismatch', state: normalized.state };
        if (normalized.origin !== target.origin) return { ok: false, reason: 'origin-mismatch', state: normalized.state, origin: normalized.origin, currentOrigin: target.origin };
        if (capability.id === 'browser.disconnect') {
            return { ok: true, reason: 'disconnect-allowed', state: normalized.state, requiredState: 'connected-read', policyOnly: true };
        }
        const requiredState = requiredStateFor(capability.permissionClass);
        if (!requiredState) return { ok: false, reason: 'unsupported-permission-class', state: normalized.state };
        const currentRank = stateRank(normalized.state);
        const requiredRank = stateRank(requiredState);
        if (currentRank < requiredRank) {
            const reason = requiredState === 'connected-interactive'
                ? 'interactive-grant-required'
                : requiredState === 'developer-evaluate-enabled'
                    ? 'developer-execute-grant-required'
                    : 'read-grant-required';
            return { ok: false, reason, state: normalized.state, requiredState };
        }
        return {
            ok: true,
            reason: 'authorized',
            state: normalized.state,
            requiredState,
            origin: normalized.origin,
            policyOnly: true
        };
    }

    global.CodeeBrowserPolicy = Object.freeze({
        POLICY_VERSION,
        STATES,
        GRANTS,
        DEFAULT_TTL_MS,
        MAX_TTL_MS,
        inspectTarget,
        normalizeRecord,
        connect,
        grant,
        revoke,
        authorize,
        requiredStateFor,
        ttlFor
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
