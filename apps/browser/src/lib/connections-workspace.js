(function attachCodeeConnectionsWorkspace(global) {
    'use strict';

    const SECTION_ORDER = Object.freeze(['free-ai','local-ai','premium-byo','mcp','repository-host','artifact-host','browser']);
    const VALID_STATES = new Set(['CONNECTED','DEGRADED','MISSING','AUTH_FAILED','DISABLED','RATE_LIMITED','UNAVAILABLE']);
    const text = (value, max = 240) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
    const list = value => Array.isArray(value) ? value : [];
    const state = value => VALID_STATES.has(text(value, 40).toUpperCase()) ? text(value, 40).toUpperCase() : 'DEGRADED';
    const aggregate = (rows, fallback = 'MISSING') => {
        const values = list(rows).map(row => state(row?.state));
        if (!values.length) return fallback;
        if (values.every(v => v === 'CONNECTED')) return 'CONNECTED';
        if (values.some(v => v === 'CONNECTED')) return 'DEGRADED';
        if (values.every(v => v === 'AUTH_FAILED')) return 'AUTH_FAILED';
        if (values.every(v => v === 'RATE_LIMITED')) return 'RATE_LIMITED';
        if (values.every(v => v === 'DISABLED')) return 'DISABLED';
        if (values.every(v => v === 'UNAVAILABLE')) return 'UNAVAILABLE';
        if (values.every(v => v === 'MISSING')) return 'MISSING';
        return 'DEGRADED';
    };
    function providerClass(row) {
        const lifecycle = text(row?.lifecycle || 'ACTIVE', 80).toUpperCase();
        if (lifecycle === 'LOCAL') return 'local-ai';
        if (['FREE','FREE_LIMITED'].includes(lifecycle)) return 'free-ai';
        return 'premium-byo';
    }
    function safeProvider(row) {
        return Object.freeze({
            id: text(row?.id, 160),
            name: text(row?.displayName || row?.id || 'AI provider', 160),
            lifecycle: text(row?.lifecycle || 'ACTIVE', 80).toUpperCase(),
            transport: text(row?.transport || '', 80),
            state: state(row?.state || (row?.probe?.ok === true ? 'CONNECTED' : row?.probe?.code || 'DEGRADED')),
            lastCheckedAt: text(row?.lastCheckedAt || row?.probe?.checkedAt || '', 80),
            reason: text(row?.reason || row?.probe?.code || '', 160)
        });
    }
    function action(available, route = '', reason = '') {
        return Object.freeze({ available: available === true, route: text(route, 120), reason: text(reason, 160) });
    }
    function actions(kind, hasConnections = false) {
        const canProbe = kind !== 'browser' || hasConnections;
        return Object.freeze({
            test: action(canProbe, '', canProbe ? '' : 'browser-execution-not-enabled'),
            reconnect: action(canProbe, '', canProbe ? '' : 'runtime-not-probeable'),
            configure: action(kind === 'mcp', 'settings', kind === 'mcp' ? '' : 'configuration-owned-by-subsystem'),
            disable: action(false, '', 'disable-owned-by-subsystem')
        });
    }
    function rowById(rows, id) { return list(rows).find(row => row?.id === id) || null; }
    function hostSection(id, title, sourceId, rows, description) {
        const source = rowById(rows, sourceId) || { state: 'MISSING' };
        return Object.freeze({ id, title, description, state: state(source.state), lastCheckedAt: text(source.lastCheckedAt, 80), lastError: source.state === 'CONNECTED' ? '' : text(source.reason, 160), connections: Object.freeze([]), actions: actions(id, source.state !== 'MISSING' && source.state !== 'UNAVAILABLE') });
    }
    function providerSection(id, title, providers, description) {
        const rows = Object.freeze(list(providers).filter(row => providerClass(row) === id).map(safeProvider));
        return Object.freeze({ id, title, description, state: aggregate(rows), lastCheckedAt: text(rows.map(r => r.lastCheckedAt).filter(Boolean).sort().at(-1) || '', 80), lastError: text(rows.find(r => r.state !== 'CONNECTED')?.reason || '', 160), connections: rows, actions: actions(id, rows.length > 0) });
    }
    function build(input = {}) {
        const registry = input.registry && typeof input.registry === 'object' ? input.registry : { rows: [] };
        const rows = list(registry.rows);
        const providers = list(input.providers);
        const mcp = rowById(rows, 'mcp') || { state: 'MISSING' };
        const sections = Object.freeze([
            providerSection('free-ai', 'Free AI', providers, 'Free cloud inference providers registered with Codee.'),
            providerSection('local-ai', 'Local AI', providers, 'Local/offline inference providers such as Ollama-compatible runtimes.'),
            providerSection('premium-byo', 'Premium / BYO AI', providers, 'Premium or bring-your-own provider connections.'),
            Object.freeze({ id:'mcp', title:'Titan MCP', description:'Governed Titan MCP runtime and configured servers.', state:state(mcp.state), lastCheckedAt:text(mcp.lastCheckedAt,80), lastError:mcp.state==='CONNECTED'?'':text(mcp.reason,160), connections:Object.freeze([]), actions:actions('mcp', mcp.state!=='MISSING') }),
            hostSection('repository-host','Repository Host','repository.host',rows,'Privileged repository mutation, backup and rollback host.'),
            hostSection('artifact-host','Artifact Verification Host','artifact.host',rows,'Independent byte/hash/ZIP artifact verification host.'),
            hostSection('browser','Browser','browser.runtime',rows,'Governed browser observation and execution runtime.')
        ]);
        return Object.freeze({ schema:'codee.connections.workspace.v1', generatedAt:text(input.generatedAt || registry.generatedAt || new Date().toISOString(),80), order:SECTION_ORDER, sections });
    }
    global.CodeeConnectionsWorkspace = Object.freeze({ SECTION_ORDER, build });
})(typeof globalThis !== 'undefined' ? globalThis : this);
