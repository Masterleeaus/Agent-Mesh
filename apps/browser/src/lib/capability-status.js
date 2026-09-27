(function attachCodeeCapabilityStatus(global) {
    'use strict';

    const READINESS = Object.freeze([
        'READY', 'DISABLED', 'CONTRACT_ONLY', 'HOST_REQUIRED', 'PROVIDER_REQUIRED',
        'MCP_REQUIRED', 'CONNECTION_REQUIRED', 'DEPENDENCY_MISSING', 'UNAVAILABLE'
    ]);

    const MUTATING_TOKENS = Object.freeze(['write', 'delete', 'remove', 'mutation', 'mutate', 'command', 'execute', 'run']);

    function text(value, max = 240) {
        return String(value ?? '').trim().slice(0, max);
    }

    function uniqueText(values, max = 240) {
        return Array.from(new Set((Array.isArray(values) ? values : [])
            .map(value => text(value, max))
            .filter(Boolean)));
    }

    function subsystemFor(id) {
        if (id.startsWith('repository.host.')) return 'Repository Host';
        if (id.startsWith('repository.')) return 'Repository Intelligence';
        if (id.startsWith('browser.')) return 'Browser Engine';
        if (id.startsWith('workforce.')) return 'AI Workforce';
        if (id.startsWith('mcp.')) return 'MCP';
        if (id.startsWith('ai.')) return 'Provider Gateway';
        if (id.startsWith('titan.')) return 'Titan Zero';
        const prefix = id.split('.')[0] || 'codee';
        return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    function operationFor(record, id) {
        const declared = text(record?.operationClass, 40).toUpperCase();
        if (declared) return declared;
        if (/\.(delete|remove)$/.test(id)) return 'DESTRUCTIVE';
        if (id === 'mcp.tool.call') return 'EXECUTE';
        if (/\.(command|execute|run)$/.test(id)) return 'EXECUTE';
        if (/\.(write|mutation\.authorize|mutation\.prepare)$/.test(id) || id.includes('.mutation.')) return 'WRITE';
        if (/\.(verify|verification\.)/.test(id) || id.includes('.verification.')) return 'VERIFY';
        if (record?.readOnly === false || MUTATING_TOKENS.some(token => id.includes(`.${token}`))) return 'EXECUTE';
        return 'READ';
    }

    function riskFor(record, operationClass) {
        const declared = text(record?.risk, 24).toLowerCase();
        if (['low', 'medium', 'high', 'critical'].includes(declared)) return declared;
        if (operationClass === 'DESTRUCTIVE') return 'critical';
        if (['WRITE', 'EXECUTE'].includes(operationClass)) return 'high';
        if (['INTERACT', 'NAVIGATE', 'SESSION'].includes(operationClass)) return 'medium';
        return 'low';
    }

    function dependenciesFor(id, record) {
        const out = uniqueText(record?.dependencies || record?.dependencyRequirements || []);
        if (id.startsWith('repository.host.')) out.push('repository.host');
        if (id.startsWith('mcp.')) out.push('mcp.runtime');
        if (id.startsWith('browser.')) out.push('browser.execution');
        if (id.startsWith('ai.')) out.push('provider.gateway');
        if (id === 'workforce.ai.request') out.push('provider.gateway');
        return uniqueText(out);
    }

    function repositoryHostFunctionFor(id) {
        if (id.endsWith('.write')) return 'writeFile';
        if (id.endsWith('.delete')) return 'deleteFile';
        if (id.endsWith('.command')) return 'runCommand';
        return null;
    }

    function readinessFor(record, id, runtime) {
        if (record?.implementation?.status === 'contract_only') return { readiness: 'CONTRACT_ONLY', executionAvailable: false, reason: 'implementation-contract-only' };

        if (id.startsWith('browser.')) {
            if (!runtime.browser?.registered) return { readiness: 'DEPENDENCY_MISSING', executionAvailable: false, reason: 'browser-runtime-missing' };
            if (!runtime.browser?.executionEnabled) return { readiness: 'CONTRACT_ONLY', executionAvailable: false, reason: 'browser-execution-not-enabled' };
            return { readiness: 'READY', executionAvailable: true, reason: '' };
        }

        if (id.startsWith('repository.host.')) {
            if (runtime.repository?.hostBridge !== 'detected') return { readiness: 'HOST_REQUIRED', executionAvailable: false, reason: 'repository-host-missing' };
            const functionName = repositoryHostFunctionFor(id);
            if (functionName && runtime.repository?.hostCapabilities?.repository?.[functionName] !== true) {
                return { readiness: 'HOST_REQUIRED', executionAvailable: false, reason: `repository-host-${functionName}-missing` };
            }
            return { readiness: 'READY', executionAvailable: true, reason: '' };
        }

        if (id.startsWith('repository.')) {
            if (!runtime.repository?.registered) return { readiness: 'DEPENDENCY_MISSING', executionAvailable: false, reason: 'repository-pack-missing' };
            if (runtime.repository?.settings?.enabled === false) return { readiness: 'DISABLED', executionAvailable: false, reason: 'repository-disabled' };
            return { readiness: 'READY', executionAvailable: true, reason: '' };
        }

        if (id.startsWith('mcp.')) {
            if (!runtime.mcp?.runtimeInstalled) return { readiness: 'MCP_REQUIRED', executionAvailable: false, reason: 'mcp-runtime-missing' };
            if (id !== 'mcp.connections.list' && Number(runtime.mcp?.connections || 0) < 1) {
                return { readiness: 'CONNECTION_REQUIRED', executionAvailable: false, reason: 'mcp-connection-missing' };
            }
            return { readiness: 'READY', executionAvailable: true, reason: '' };
        }

        if (id.startsWith('ai.')) {
            if (!runtime.ai?.gatewayInstalled) return { readiness: 'PROVIDER_REQUIRED', executionAvailable: false, reason: 'provider-gateway-missing' };
            return { readiness: 'READY', executionAvailable: true, reason: '' };
        }

        if (id.startsWith('workforce.')) {
            if (!runtime.workforce?.registered) return { readiness: 'DEPENDENCY_MISSING', executionAvailable: false, reason: 'workforce-runtime-missing' };
            if (runtime.workforce?.settings?.enabled === false) return { readiness: 'DISABLED', executionAvailable: false, reason: 'workforce-disabled' };
            if (id === 'workforce.ai.request' && !runtime.workforce?.dependencies?.providerGateway) {
                return { readiness: 'PROVIDER_REQUIRED', executionAvailable: false, reason: 'provider-gateway-missing' };
            }
            if (id.startsWith('workforce.mutation') && !runtime.workforce?.dependencies?.mcpRuntime && !runtime.workforce?.dependencies?.repositoryPack) {
                return { readiness: 'DEPENDENCY_MISSING', executionAvailable: false, reason: 'mutation-target-missing' };
            }
            return { readiness: 'READY', executionAvailable: true, reason: '' };
        }

        return { readiness: 'READY', executionAvailable: true, reason: '' };
    }

    function normalize(record, source, runtime) {
        const id = text(record?.id, 200);
        if (!id) return null;
        const operationClass = operationFor(record, id);
        const state = readinessFor(record, id, runtime);
        const subsystem = subsystemFor(id);
        const owner = text(record?.implementation?.owner || record?.owner || record?.pack || subsystem, 160);
        return Object.freeze({
            id,
            title: text(record?.title || record?.name || id, 240),
            subsystem,
            owner,
            source,
            readiness: state.readiness,
            executionAvailable: Boolean(state.executionAvailable),
            reason: text(state.reason, 240),
            operationClass,
            risk: riskFor(record, operationClass),
            dependencies: dependenciesFor(id, record)
        });
    }

    function build(input = {}) {
        const registry = input.registry && typeof input.registry === 'object' ? input.registry : {};
        const runtime = {
            ai: input.ai || {}, browser: input.browser || {}, repository: input.repository || {},
            workforce: input.workforce || {}, mcp: input.mcp || {}
        };
        const records = [
            ...(Array.isArray(registry.capabilities) ? registry.capabilities.map(row => [row, 'capability']) : []),
            ...(Array.isArray(registry.repositoryCapabilities) ? registry.repositoryCapabilities.map(row => [row, 'repository-capability']) : [])
        ];
        const byId = new Map();
        for (const [record, source] of records) {
            const normalized = normalize(record, source, runtime);
            if (!normalized) continue;
            if (!byId.has(normalized.id) || source === 'capability') byId.set(normalized.id, normalized);
        }
        const rows = Array.from(byId.values()).sort((a, b) => a.subsystem.localeCompare(b.subsystem) || a.id.localeCompare(b.id));
        const byReadiness = Object.fromEntries(READINESS.map(state => [state, 0]));
        const bySubsystem = {};
        let available = 0;
        for (const row of rows) {
            byReadiness[row.readiness] = Number(byReadiness[row.readiness] || 0) + 1;
            bySubsystem[row.subsystem] = Number(bySubsystem[row.subsystem] || 0) + 1;
            if (row.executionAvailable) available += 1;
        }
        return Object.freeze({
            schema: 'codee.capability.status.v1',
            total: rows.length,
            rows: Object.freeze(rows),
            summary: Object.freeze({
                available,
                blocked: rows.length - available,
                contractOnly: Number(byReadiness.CONTRACT_ONLY || 0),
                byReadiness: Object.freeze(byReadiness),
                bySubsystem: Object.freeze(bySubsystem)
            })
        });
    }

    global.CodeeCapabilityStatus = Object.freeze({ READINESS, build });
})(typeof globalThis !== 'undefined' ? globalThis : this);
