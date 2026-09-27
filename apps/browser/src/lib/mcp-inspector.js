(function attachCodeeMcpInspector(global) {
    'use strict';

    const MUTATING = new Set(['WRITE','EXECUTE','DESTRUCTIVE']);
    const SECRET_VALUE_KEYS = new Set(['default','example','examples','const','value','secret','token','password','authorization','credential']);

    function text(value, max = 240) {
        return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
    }
    function list(value) { return Array.isArray(value) ? value : []; }
    function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
    function safeUrl(value) {
        try { const url = new URL(String(value || '')); return ['http:','https:'].includes(url.protocol) ? url.origin : ''; }
        catch { return ''; }
    }
    function sanitizeSchema(value, depth = 0) {
        if (depth > 8) return '[bounded]';
        if (Array.isArray(value)) return Object.freeze(value.slice(0, 80).map(item => sanitizeSchema(item, depth + 1)));
        if (!value || typeof value !== 'object') {
            if (typeof value === 'string') return text(value, 500);
            if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
            return null;
        }
        const out = {};
        for (const [rawKey, rawValue] of Object.entries(value).slice(0, 160)) {
            const key = text(rawKey, 120);
            if (!key || SECRET_VALUE_KEYS.has(key.toLowerCase())) continue;
            out[key] = sanitizeSchema(rawValue, depth + 1);
        }
        return Object.freeze(out);
    }
    function operationClass(tool, classification) {
        const name = text(tool?.name, 200).toLowerCase();
        if (classification === 'READ' && /(^|_)(verify|health|status|manifest|check|validate|inspect)(_|$)/.test(name)) return 'VERIFY';
        if (classification === 'COORDINATE') return 'EXECUTE';
        return ['READ','WRITE','EXECUTE','DESTRUCTIVE'].includes(classification) ? classification : 'UNKNOWN';
    }
    function riskFloor(operation, classification) {
        if (classification === 'UNKNOWN') return 'BLOCKED';
        if (operation === 'DESTRUCTIVE') return 'CRITICAL';
        if (operation === 'WRITE') return 'HIGH';
        if (operation === 'EXECUTE') return 'MEDIUM';
        return 'LOW';
    }
    function classifyTool(tool) {
        const gateway = global.CodeeMcpGovernanceGateway;
        const result = gateway?.classifyTool ? gateway.classifyTool(tool) : { ok:false, classification:'UNKNOWN', reason:'mcp-governance-gateway-missing' };
        const classification = result?.ok === true ? text(result.classification, 40).toUpperCase() : 'UNKNOWN';
        return { classification, result: result || {} };
    }
    function sanitizePrompt(prompt) {
        return Object.freeze({
            name: text(prompt?.name, 200),
            description: text(prompt?.description, 1000),
            arguments: Object.freeze(list(prompt?.arguments).slice(0, 80).map(arg => Object.freeze({
                name: text(arg?.name, 160), required: arg?.required === true, description: text(arg?.description, 500)
            })))
        });
    }
    function sanitizeApproval(row) {
        return Object.freeze({
            approvalId: text(row?.approvalId, 240),
            connectionId: text(row?.connectionId, 200),
            tool: text(row?.name || row?.tool, 200),
            classification: text(row?.classification, 40).toUpperCase() || 'UNKNOWN',
            ticketId: text(row?.ticketId, 240) || null,
            argumentsSha256: text(row?.argumentsSha256, 128) || null,
            exactArgumentsBound: row?.exactArgumentsBound === true,
            targets: Object.freeze(list(row?.targets).slice(0, 50).map(value => text(value, 500)).filter(Boolean)),
            backupDomains: Object.freeze(list(row?.backupDomains).slice(0, 24).map(value => text(value, 80)).filter(Boolean)),
            backupIds: Object.freeze(list(row?.backupIds).slice(0, 24).map(value => text(value, 240)).filter(Boolean)),
            createdAt: Number(row?.createdAt || 0) || null,
            expiresAt: Number(row?.expiresAt || 0) || null
        });
    }
    function sanitizeReceipt(row) {
        return Object.freeze({
            id: text(row?.id || row?.receiptId, 240),
            connectionId: text(row?.connectionId, 200),
            tool: text(row?.tool || row?.name, 200),
            classification: text(row?.classification, 40).toUpperCase() || 'UNKNOWN',
            ticketId: text(row?.ticketId, 240) || null,
            argumentsSha256: text(row?.argumentsSha256, 128) || null,
            backupIds: Object.freeze(list(row?.backupIds).slice(0, 24).map(value => text(value, 240)).filter(Boolean)),
            backupDomains: Object.freeze(list(row?.backupDomains || row?.coverage).slice(0, 24).map(value => text(value, 80)).filter(Boolean)),
            verificationLevel: text(row?.verificationLevel || row?.verification?.level, 120) || null,
            verified: row?.verified === true || row?.verification?.verified === true,
            serverCommitted: row?.serverCommitted === true || row?.postCommitEvidence?.server_committed === true,
            createdAt: text(row?.createdAt, 100) || null
        });
    }
    function build(input = {}) {
        const approvals = list(input.approvals).map(sanitizeApproval);
        const receipts = list(input.receipts).map(sanitizeReceipt);
        const discoveries = object(input.discoveries);
        const servers = list(input.connections).slice(0, 20).map(connection => {
            const id = text(connection?.id, 200);
            const discoveryRow = object(discoveries[id]);
            const discovery = discoveryRow.ok === true ? object(discoveryRow.value) : {};
            const serverApprovals = approvals.filter(row => row.connectionId === id);
            const serverReceipts = receipts.filter(row => row.connectionId === id);
            const tools = list(discovery.tools).slice(0, 300).map(tool => {
                const classified = classifyTool(tool);
                const classification = classified.classification;
                const operation = operationClass(tool, classification);
                const pending = serverApprovals.find(row => row.tool === text(tool?.name, 200)) || null;
                const lastReceipt = serverReceipts.find(row => row.tool === text(tool?.name, 200)) || null;
                const mutating = MUTATING.has(classification);
                const known = classification !== 'UNKNOWN';
                const blockedReason = !known
                    ? text(classified.result?.reason || 'mcp-tool-classification-unknown', 160)
                    : (mutating ? (pending ? 'approval-required' : 'governed-mutation-prepare-required') : '');
                const policy = object(classified.result?.policy);
                return Object.freeze({
                    name: text(tool?.name, 200),
                    description: text(tool?.description, 1200),
                    classification,
                    operationClass: operation,
                    riskFloor: riskFloor(operation, classification),
                    classificationSource: text(classified.result?.source || (known ? 'local-policy' : 'blocked'), 80),
                    inputSchema: sanitizeSchema(tool?.inputSchema || tool?.input_schema || {}),
                    backupDomains: Object.freeze(list(policy.backup_domains).slice(0, 24).map(value => text(value, 80)).filter(Boolean)),
                    ticketable: policy.ticketable === true,
                    exactArgumentsRequired: policy.exact_arguments_required === true,
                    requiresApproval: mutating,
                    executionAvailable: known && !mutating,
                    executionMode: !known ? 'BLOCKED' : (mutating ? 'APPROVAL_REQUIRED' : 'GOVERNED_READ'),
                    blockedReason,
                    pendingApprovalId: pending?.approvalId || null,
                    lastCall: lastReceipt ? Object.freeze({ receiptId:lastReceipt.id, verified:lastReceipt.verified, verificationLevel:lastReceipt.verificationLevel, createdAt:lastReceipt.createdAt }) : null
                });
            });
            const capabilities = object(discovery.capabilities);
            const resourcesDeclared = Boolean(capabilities.resources);
            return Object.freeze({
                connection: Object.freeze({
                    id, name: text(connection?.name, 160) || 'Titan MCP', origin: safeUrl(connection?.baseUrl), endpoint: text(connection?.endpoint, 200), enabled: connection?.enabled !== false
                }),
                discoveryState: discoveryRow.ok === true ? 'READY' : (connection?.enabled === false ? 'DISABLED' : 'UNAVAILABLE'),
                discoveryError: discoveryRow.ok === true ? '' : text(discoveryRow.error || 'mcp-discovery-unavailable', 500),
                server: Object.freeze({
                    name: text(discovery?.serverInfo?.name, 160) || null,
                    version: text(discovery?.serverInfo?.version, 80) || null,
                    protocolVersion: text(discovery?.protocolVersion, 80) || null,
                    discoveredAt: text(discovery?.discoveredAt, 100) || null,
                    twoPhaseMutationTickets: discovery?.twoPhaseMutationTickets === true,
                    mutationGuarantee: text(discovery?.mutationGuarantee, 120) || null,
                    contractHash: text(discovery?.contractHash, 128) || null
                }),
                tools: Object.freeze(tools),
                prompts: Object.freeze(list(discovery.prompts).slice(0, 200).map(sanitizePrompt)),
                resources: Object.freeze({ state:'UNAVAILABLE', declared:resourcesDeclared, count:0, reason:'titan-mcp-resources-not-exposed' }),
                approvals: Object.freeze(serverApprovals),
                receipts: Object.freeze(serverReceipts)
            });
        });
        const summary = Object.freeze({
            servers: servers.length,
            readyServers: servers.filter(row => row.discoveryState === 'READY').length,
            tools: servers.reduce((sum,row)=>sum+row.tools.length,0),
            prompts: servers.reduce((sum,row)=>sum+row.prompts.length,0),
            resources: 0,
            pendingApprovals: approvals.length,
            mutationReceipts: receipts.length,
            blockedTools: servers.reduce((sum,row)=>sum+row.tools.filter(tool=>tool.classification==='UNKNOWN').length,0)
        });
        return Object.freeze({ schema:'codee.mcp.inspector.v1', generatedAt:text(input.generatedAt,100), summary, servers:Object.freeze(servers) });
    }

    global.CodeeMcpInspector = Object.freeze({ build, sanitizeSchema });
})(typeof globalThis !== 'undefined' ? globalThis : this);
