(function attachCodeeConnectionRegistry(global) {
    'use strict';

    const STATES = Object.freeze(['CONNECTED', 'DEGRADED', 'MISSING', 'AUTH_FAILED', 'DISABLED', 'RATE_LIMITED', 'UNAVAILABLE']);

    function list(value) { return Array.isArray(value) ? value : []; }
    function text(value, max = 240) { return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max); }
    function timestamp(value) { const parsed = Date.parse(String(value || '')); return Number.isFinite(parsed) ? parsed : 0; }
    function newestCheckedAt(rows) {
        let newest = '';
        let score = 0;
        for (const row of list(rows)) {
            const candidate = text(row?.probe?.checkedAt || row?.evidence?.checkedAt || '', 80);
            const candidateScore = timestamp(candidate);
            if (candidateScore > score) { score = candidateScore; newest = candidate; }
        }
        return newest;
    }
    function normalizeCode(value) {
        const code = text(value, 80).toUpperCase().replace(/[^A-Z0-9_]+/g, '_');
        if (code.includes('AUTH') || code === '401' || code === '403') return 'AUTH_FAILED';
        if (code.includes('RATE') || code === '429') return 'RATE_LIMITED';
        if (code.includes('DISABLED') || code.includes('RETIRED')) return 'DISABLED';
        if (code.includes('UNAVAILABLE') || code.includes('OFFLINE') || code.includes('TIMEOUT') || code.includes('NETWORK')) return 'UNAVAILABLE';
        if (code.includes('MISSING') || code.includes('NOT_FOUND')) return 'MISSING';
        return 'DEGRADED';
    }
    function stateFromProbe(probe, fallback = 'DEGRADED') {
        if (!probe || typeof probe !== 'object') return fallback;
        if (probe.ok === true || probe.healthy === true || ['CONNECTED', 'READY', 'HEALTHY', 'OK'].includes(text(probe.state || probe.status, 40).toUpperCase())) return 'CONNECTED';
        return normalizeCode(probe.code || probe.state || probe.status || probe.reason || fallback);
    }
    function aggregate(items, options = {}) {
        const rows = list(items);
        const enabledRows = rows.filter(row => options.isDisabled ? !options.isDisabled(row) : true);
        if (!rows.length) return { state: 'MISSING', total: 0, enabled: 0, connected: 0, degraded: 0, authFailed: 0, rateLimited: 0, unavailable: 0, disabled: 0, lastCheckedAt: '' };
        if (!enabledRows.length) return { state: 'DISABLED', total: rows.length, enabled: 0, connected: 0, degraded: 0, authFailed: 0, rateLimited: 0, unavailable: 0, disabled: rows.length, lastCheckedAt: newestCheckedAt(rows) };
        const counts = { CONNECTED: 0, DEGRADED: 0, MISSING: 0, AUTH_FAILED: 0, DISABLED: rows.length - enabledRows.length, RATE_LIMITED: 0, UNAVAILABLE: 0 };
        for (const row of enabledRows) counts[stateFromProbe(row?.probe)] += 1;
        let state = 'DEGRADED';
        if (counts.CONNECTED === enabledRows.length) state = 'CONNECTED';
        else if (counts.CONNECTED > 0) state = 'DEGRADED';
        else if (counts.AUTH_FAILED === enabledRows.length) state = 'AUTH_FAILED';
        else if (counts.RATE_LIMITED === enabledRows.length) state = 'RATE_LIMITED';
        else if (counts.UNAVAILABLE === enabledRows.length) state = 'UNAVAILABLE';
        else if (counts.MISSING === enabledRows.length) state = 'MISSING';
        return {
            state, total: rows.length, enabled: enabledRows.length,
            connected: counts.CONNECTED, degraded: counts.DEGRADED + counts.MISSING,
            authFailed: counts.AUTH_FAILED, rateLimited: counts.RATE_LIMITED,
            unavailable: counts.UNAVAILABLE, disabled: counts.DISABLED,
            lastCheckedAt: newestCheckedAt(rows)
        };
    }
    function providerDisabled(row) { return ['RETIRED', 'DISABLED'].includes(text(row?.lifecycle, 40).toUpperCase()); }
    function providerUnavailableProbe(row) {
        if (text(row?.lifecycle, 40).toUpperCase() === 'TEMPORARILY_UNAVAILABLE' && !row?.probe) return { ...row, probe: { ok: false, code: 'UNAVAILABLE' } };
        return row;
    }
    function singleHost(input, id, title) {
        const row = input && typeof input === 'object' ? input : {};
        let state;
        if (row.disabled === true) state = 'DISABLED';
        else if (row.detected !== true) state = 'MISSING';
        else if (row.evidence?.verified === true) state = 'CONNECTED';
        else state = stateFromProbe(row.probe, 'DEGRADED');
        return Object.freeze({ id, title, state, healthy: state === 'CONNECTED', lastCheckedAt: text(row.probe?.checkedAt || row.evidence?.checkedAt || '', 80), reason: state === 'CONNECTED' ? '' : text(row.reason || row.probe?.code || row.probe?.reason || (state === 'DEGRADED' ? 'probe-evidence-missing' : ''), 160) });
    }
    function browserRow(input) {
        const row = input && typeof input === 'object' ? input : {};
        let state;
        if (row.disabled === true) state = 'DISABLED';
        else if (row.registered !== true) state = 'MISSING';
        else if (row.executionEnabled !== true) state = 'UNAVAILABLE';
        else state = stateFromProbe(row.probe, 'DEGRADED');
        return Object.freeze({ id: 'browser.runtime', title: 'Browser Runtime', state, healthy: state === 'CONNECTED', lastCheckedAt: text(row.probe?.checkedAt || '', 80), reason: state === 'CONNECTED' ? '' : text(row.reason || row.probe?.code || row.probe?.reason || (state === 'UNAVAILABLE' ? 'browser-execution-not-enabled' : 'probe-evidence-missing'), 160) });
    }
    function aggregateRow(id, title, stats, reason = '') {
        return Object.freeze({ id, title, state: stats.state, healthy: stats.state === 'CONNECTED', total: stats.total, enabled: stats.enabled, connected: stats.connected, degraded: stats.degraded, authFailed: stats.authFailed, rateLimited: stats.rateLimited, unavailable: stats.unavailable, disabled: stats.disabled, lastCheckedAt: stats.lastCheckedAt, reason: text(reason, 160) });
    }
    function build(input = {}) {
        const providers = list(input.aiProviders).map(providerUnavailableProbe);
        const cloudProviders = providers.filter(row => text(row?.lifecycle, 40).toUpperCase() !== 'LOCAL');
        const localProviders = providers.filter(row => text(row?.lifecycle, 40).toUpperCase() === 'LOCAL');
        const cloud = aggregate(cloudProviders, { isDisabled: providerDisabled });
        const local = aggregate(localProviders, { isDisabled: providerDisabled });
        const mcpInput = input.mcp && typeof input.mcp === 'object' ? input.mcp : {};
        let mcpStats;
        if (mcpInput.runtimeInstalled !== true) mcpStats = { state: 'MISSING', total: 0, enabled: 0, connected: 0, degraded: 0, authFailed: 0, rateLimited: 0, unavailable: 0, disabled: 0, lastCheckedAt: '' };
        else mcpStats = aggregate(list(mcpInput.connections), { isDisabled: row => row?.enabled === false });
        const rows = Object.freeze([
            aggregateRow('ai.providers', 'AI Providers', cloud),
            aggregateRow('ai.local', 'Local AI', local),
            aggregateRow('mcp', 'Titan MCP', mcpStats, mcpInput.runtimeInstalled === true && mcpStats.total === 0 ? 'no-mcp-connections' : ''),
            singleHost(input.repositoryHost, 'repository.host', 'Repository Host'),
            singleHost(input.artifactHost, 'artifact.host', 'Artifact Verification Host'),
            browserRow(input.browser)
        ]);
        const summary = Object.freeze({
            total: rows.length,
            connected: rows.filter(row => row.state === 'CONNECTED').length,
            degraded: rows.filter(row => row.state === 'DEGRADED').length,
            missing: rows.filter(row => row.state === 'MISSING').length,
            authFailed: rows.filter(row => row.state === 'AUTH_FAILED').length,
            disabled: rows.filter(row => row.state === 'DISABLED').length,
            rateLimited: rows.filter(row => row.state === 'RATE_LIMITED').length,
            unavailable: rows.filter(row => row.state === 'UNAVAILABLE').length
        });
        return Object.freeze({ schema: 'codee.connection.registry.v1', generatedAt: text(input.generatedAt || new Date().toISOString(), 80), rows, summary });
    }

    global.CodeeConnectionRegistry = Object.freeze({ STATES, build, stateFromProbe });
})(typeof globalThis !== 'undefined' ? globalThis : this);
