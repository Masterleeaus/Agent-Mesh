(function attachCodeeDashboardStatus(global) {
    'use strict';

    const TERMINAL_PLAN_STATES = new Set(['complete', 'completed', 'stopped', 'failed', 'cancelled', 'canceled']);

    function list(value) { return Array.isArray(value) ? value : []; }
    function text(value, max = 240) { return String(value ?? '').trim().slice(0, max); }
    function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
    function timestamp(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        const parsed = Date.parse(String(value || ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }
    function activityTime(plan) {
        return Math.max(
            number(plan?.completedAt), number(plan?.lastDispatchedAt), number(plan?.updatedAt), number(plan?.startedAt),
            ...list(plan?.artifactHistory).map(item => timestamp(item?.createdAt))
        );
    }
    function isActivePlan(plan) {
        const state = text(plan?.dispatchStatus, 80).toLowerCase();
        return Boolean(plan && !TERMINAL_PLAN_STATES.has(state));
    }
    function newest(rows, score) {
        return list(rows).slice().sort((a, b) => score(b) - score(a))[0] || null;
    }
    function latestArtifact(plans, currentPlan) {
        const preferred = list(currentPlan?.artifactHistory);
        const pool = preferred.length ? preferred : list(plans).flatMap(plan => list(plan?.artifactHistory));
        return newest(pool, item => timestamp(item?.createdAt) || number(item?.acceptedAt));
    }
    function stackLabel(stack) {
        const row = stack && typeof stack === 'object' ? stack : {};
        if (row.laravel) return `Laravel ${text(row.laravel, 80)}`;
        if (row.react) return `React ${text(row.react, 80)}`;
        if (row.livewire) return `Livewire ${text(row.livewire, 80)}`;
        return 'Unknown';
    }
    function runtimeLabel(stack) {
        const row = stack && typeof stack === 'object' ? stack : {};
        if (row.php) return `PHP ${text(row.php, 80)}`;
        if (row.vite) return `Vite ${text(row.vite, 80)}`;
        return 'Unknown';
    }
    function build(input = {}) {
        const plans = list(input.plans).filter(item => item && typeof item === 'object');
        const activePlans = plans.filter(isActivePlan);
        const currentPlan = newest(activePlans.length ? activePlans : plans, activityTime);
        const artifact = latestArtifact(plans, currentPlan);
        const artifactReceipt = artifact?.verificationReceipt && typeof artifact.verificationReceipt === 'object' ? artifact.verificationReceipt : null;
        const ai = input.ai && typeof input.ai === 'object' ? input.ai : {};
        const browser = input.browser && typeof input.browser === 'object' ? input.browser : {};
        const repository = input.repository && typeof input.repository === 'object' ? input.repository : {};
        const titanZero = input.titanZero && typeof input.titanZero === 'object' ? input.titanZero : {};
        const workforce = input.workforce && typeof input.workforce === 'object' ? input.workforce : {};
        const mcp = input.mcp && typeof input.mcp === 'object' ? input.mcp : {};
        const artifactHost = input.artifactHost && typeof input.artifactHost === 'object' ? input.artifactHost : {};
        const diagnostics = input.diagnostics && typeof input.diagnostics === 'object' ? input.diagnostics : {};
        const connectionRegistry = input.connections && typeof input.connections === 'object' ? input.connections : { rows: [] };
        const connectionRows = list(connectionRegistry.rows);
        const connectionState = id => text(connectionRows.find(row => row?.id === id)?.state, 40);
        const connectionDashboardState = (id, fallback) => {
            const state = connectionState(id);
            if (!state) return fallback;
            if (state === 'CONNECTED') return 'READY';
            if (['AUTH_FAILED','RATE_LIMITED'].includes(state)) return 'ATTENTION';
            if (state === 'UNAVAILABLE' && id === 'browser.runtime') return 'CONTRACT_ONLY';
            return state;
        };
        const aiConnectionDashboardState = () => {
            const cloud = connectionState('ai.providers');
            const local = connectionState('ai.local');
            if (!cloud && !local) return ai.inferenceReady === true ? 'READY' : (ai.gatewayInstalled === true ? 'DEGRADED' : 'MISSING');
            if (cloud === 'CONNECTED' || local === 'CONNECTED') return 'READY';
            if ([cloud, local].some(state => ['AUTH_FAILED','RATE_LIMITED'].includes(state))) return 'ATTENTION';
            if ([cloud, local].some(state => state === 'DEGRADED')) return 'DEGRADED';
            if ([cloud, local].some(state => state === 'UNAVAILABLE')) return 'UNAVAILABLE';
            if ([cloud, local].every(state => !state || state === 'MISSING')) return 'MISSING';
            if ([cloud, local].every(state => !state || state === 'DISABLED')) return 'DISABLED';
            return 'DEGRADED';
        };
        const repoLatest = repository.latestAnalysis && typeof repository.latestAnalysis === 'object' ? repository.latestAnalysis : {};
        const titanLatest = titanZero.latestAnalysis && typeof titanZero.latestAnalysis === 'object' ? titanZero.latestAnalysis : {};
        const project = repoLatest.project && typeof repoLatest.project === 'object' ? repoLatest.project : {};
        const stack = titanLatest.project?.stack && typeof titanLatest.project.stack === 'object' ? titanLatest.project.stack : {};
        const connections = list(mcp.connections);
        const approvals = list(mcp.pendingApprovals);
        const receipts = list(mcp.receipts);
        const latestMcpReceipt = newest(receipts, item => timestamp(item?.createdAt));
        const safeHost = repository.backupPolicy || {};
        const repositoryHostDetected = repository.hostBridge === 'detected';
        const repositoryHostSafe = repositoryHostDetected && safeHost.createBackup === true && safeHost.verifyBackup === true && safeHost.verifyMutation === true && safeHost.auditMutation === true;
        const attention = [];

        if (approvals.length) attention.push({ code: 'MCP_APPROVALS_PENDING', severity: 'warning', count: approvals.length, text: `${approvals.length} MCP approval${approvals.length === 1 ? '' : 's'} pending` });
        if (currentPlan?.lastArtifactValidationReason) attention.push({ code: 'ARTIFACT_VERIFICATION_HELD', severity: 'warning', text: text(currentPlan.lastArtifactValidationReason, 500) });
        if (currentPlan?.lastDispatchError) attention.push({ code: 'PLAN_DISPATCH_ERROR', severity: 'error', text: text(currentPlan.lastDispatchError, 500) });
        if (number(diagnostics.failures) > 0) attention.push({ code: 'DIAGNOSTIC_FAILURES', severity: 'error', count: number(diagnostics.failures), text: `${number(diagnostics.failures)} diagnostic failure${number(diagnostics.failures) === 1 ? '' : 's'}` });
        if (number(diagnostics.warnings) > 0) attention.push({ code: 'DIAGNOSTIC_WARNINGS', severity: 'warning', count: number(diagnostics.warnings), text: `${number(diagnostics.warnings)} diagnostic warning${number(diagnostics.warnings) === 1 ? '' : 's'}` });
        if (!repositoryHostDetected) attention.push({ code: 'REPOSITORY_HOST_MISSING', severity: 'info', text: 'Repository Host is not connected; read intelligence remains available.' });
        if (!artifactHost.connected) attention.push({ code: 'ARTIFACT_HOST_MISSING', severity: 'info', text: 'Independent artifact verification host is not connected.' });

        return Object.freeze({
            schema: 'codee.dashboard.status.v1',
            generatedAt: text(input.generatedAt || new Date().toISOString(), 80),
            project: Object.freeze({
                name: text(project.name || titanLatest.project?.name || 'Codee Project', 160),
                recognizedTitanZero: titanLatest.project?.recognized === true,
                framework: text(project.framework || stackLabel(stack), 160),
                runtime: text(project.runtime || runtimeLabel(stack), 160),
                branch: text(repoLatest.git?.branch || 'Unknown', 240),
                files: number(repoLatest.inventory?.files),
                extensionFiles: number(repoLatest.inventory?.extensionFiles),
                lastAnalyzedAt: text(repoLatest.analyzedAt || titanLatest.analyzedAt || '', 80)
            }),
            plan: Object.freeze({
                activeCount: activePlans.length,
                totalCount: plans.length,
                current: currentPlan ? Object.freeze({
                    planId: text(currentPlan.planId, 240),
                    runId: text(currentPlan.runId, 240),
                    status: text(currentPlan.dispatchStatus || 'unknown', 80),
                    stepNumber: Math.max(0, number(currentPlan.stepIndex) + 1),
                    stepTotal: list(currentPlan.plan).length,
                    currentStepId: text(currentPlan.currentStepId, 240),
                    tabId: Number.isInteger(Number(currentPlan.dashboardTabId)) ? Number(currentPlan.dashboardTabId) : null,
                    requiresRestart: currentPlan.requiresRestart === true
                }) : null
            }),
            artifact: Object.freeze({
                artifactId: text(artifact?.artifactId, 240),
                zip: text(artifact?.zip, 500),
                version: text(artifact?.version, 120),
                sha256: text(artifact?.sha256, 128),
                parentSha256: text(artifact?.parentSha256, 128),
                createdAt: text(artifact?.createdAt, 80),
                verified: artifactReceipt?.verified === true || Boolean(artifactReceipt?.receiptId),
                verificationReceiptId: text(artifactReceipt?.receiptId, 240)
            }),
            ai: Object.freeze({
                state: aiConnectionDashboardState(),
                gatewayInstalled: ai.gatewayInstalled === true,
                providers: number(ai.providers),
                activeProviders: number(ai.activeProviders),
                localProviders: number(ai.localProviders),
                models: number(ai.models),
                healthyModels: number(ai.healthyModels),
                localAvailable: connectionState('ai.local') ? connectionState('ai.local') === 'CONNECTED' : number(ai.localProviders) > 0
            }),
            infrastructure: Object.freeze({
                mcp: Object.freeze({
                    state: approvals.length ? 'ATTENTION' : connectionDashboardState('mcp', mcp.runtimeInstalled !== true ? 'MISSING' : (connections.length ? 'READY' : 'DEGRADED')),
                    connections: connections.length,
                    pendingApprovals: approvals.length,
                    latestVerifiedMutation: latestMcpReceipt?.verified === true,
                    latestReceiptId: text(latestMcpReceipt?.receiptId || latestMcpReceipt?.id, 240)
                }),
                repositoryHost: Object.freeze({
                    state: connectionDashboardState('repository.host', !repositoryHostDetected ? 'MISSING' : (repositoryHostSafe ? 'READY' : 'DEGRADED')),
                    detected: repositoryHostDetected,
                    verifiedBackupReady: safeHost.createBackup === true && safeHost.verifyBackup === true,
                    postWriteVerificationReady: safeHost.verifyMutation === true && safeHost.auditMutation === true
                }),
                artifactHost: Object.freeze({ state: connectionDashboardState('artifact.host', artifactHost.connected === true ? 'READY' : 'MISSING'), connected: connectionState('artifact.host') === 'CONNECTED' || artifactHost.connected === true, source: text(artifactHost.source, 80) }),
                browser: Object.freeze({ state: connectionDashboardState('browser.runtime', browser.executionEnabled === true ? 'READY' : (browser.registered === true ? 'CONTRACT_ONLY' : 'MISSING')), registered: browser.registered === true, implemented: number(browser.implemented), contractOnly: number(browser.contractOnly) })
            }),
            workforce: Object.freeze({
                state: workforce.registered !== true ? 'MISSING' : (workforce.settings?.enabled === false ? 'DISABLED' : 'READY'),
                registered: workforce.registered === true,
                enabled: workforce.settings?.enabled !== false,
                managers: number(workforce.counts?.managers),
                providerGateway: workforce.dependencies?.providerGateway === true
            }),
            connections: Object.freeze({ schema: text(connectionRegistry.schema, 80), summary: connectionRegistry.summary && typeof connectionRegistry.summary === 'object' ? Object.freeze({ ...connectionRegistry.summary }) : Object.freeze({}) }),
            diagnostics: Object.freeze({ warnings: number(diagnostics.warnings), failures: number(diagnostics.failures) }),
            attention: Object.freeze(attention.map(item => Object.freeze(item)))
        });
    }

    global.CodeeDashboardStatus = Object.freeze({ build });
})(typeof globalThis !== 'undefined' ? globalThis : this);
