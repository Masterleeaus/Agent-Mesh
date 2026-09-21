// Local capability runtime. Donor modules remain read-only; this worker retains all execution authority.
if (typeof importScripts === 'function') {
    try {
        importScripts(
            '../providers/provider-registry.js',
            'capability-registry.js',
            'capability-status.js',
            'plan-requirement-analyzer.js',
            'production-plan-preflight.js',
            'connection-registry.js',
            'connections-workspace.js',
            'navigation-registry.js',
            'navigation-readiness.js',
            'dashboard-status.js',
            '../ai/ai-sanitizer.js',
            '../ai/ai-audit-ledger.js',
            '../ai/ai-request-contract.js',
            '../ai/ai-response-contract.js',
            '../ai/provider-contract.js',
            '../ai/ai-provider-registry.js',
            '../ai/model-registry.js',
            '../ai/intelligence-catalogue.js',
            '../ai/provider-gateway.js',
            '../ai/ai-router.js',
            '../ai/subscription-transport-contract.js',
            '../intelligence/intelligence-contract.js',
            '../intelligence/webgpu-capability.js',
            '../intelligence/intelligence-host.js',
            '../intelligence/offscreen-runtime.js',
            '../intelligence/intelligence-rpc.js',
            'onboard-ai-host-integration.js',
            '../browser/browser-capability-contract.js',
            '../browser/browser-policy.js',
            '../browser/browser-policy-store.js',
            '../browser/browser-tab-registry.js',
            '../browser/browser-perception.js',
            '../browser/browser-navigation.js',
            '../browser/browser-interaction.js',
            '../browser/browser-observability.js',
            '../browser/browser-developer-inspection.js',
            'browser-host-integration.js',
            '../repository/repository-policy.js',
            '../repository/repository-inventory.js',
            '../repository/repository-search.js',
            '../repository/symbol-index.js',
            '../repository/dependency-graph.js',
            '../repository/laravel-tracer.js',
            '../repository/migration-guard.js',
            '../repository/diff-engine.js',
            '../repository/impact-engine.js',
            '../repository/change-set.js',
            '../repository/rollback-planner.js',
            '../repository/mutation-envelope.js',
            '../repository/command-policy.js',
            '../repository/test-selector.js',
            '../repository/verification-planner.js',
            '../repository/dependency-analyzer.js',
            '../repository/git-intelligence.js',
            '../repository/log-analyzer.js',
            '../repository/error-classifier.js',
            '../integration/host-capabilities.js',
            '../integration/repository-host-adapter.js',
            '../integration/mcp-adapter.js',
            '../integration/mcp-governance-gateway.js',
            'mcp-inspector.js',
            'approved-network-transport.js',
            '../integration/titan-bridge-client.js',
            '../integration/codex-chatgpt-bridge.js',
            '../ai/adapters/gemini-adapter.js',
            '../ai/adapters/ollama-bridge-adapter.js',
            '../ai/adapters/openai-compatible-local-adapter.js',
            '../ai/adapters/chrome-prompt-adapter.js',
            '../ai/adapters/browser-local-model-adapter.js',
            '../ai/adapters/chatgpt-subscription-adapter.js',
            '../integration/titan-mcp-runtime.js',
            '../integration/artifact-verification-adapter.js',
            '../integration/remote-context-broker.js',
            '../catalog/repository-prompts.js',
            '../catalog/repository-skills.js',
            '../catalog/repository-profiles.js',
            '../repository/repository-coding-pack.js',
            '../integration/receiver-adapter.js',
            'repository-host-integration.js',
            '../titan-zero/titan-zero-core-profile.js',
            '../titan-zero/titan-zero-snapshot-policy.js',
            '../titan-zero/titan-zero-project-detector.js',
            '../titan-zero/titan-zero-sql-analyzer.js',
            '../titan-zero/titan-zero-route-analyzer.js',
            '../titan-zero/titan-zero-theme-analyzer.js',
            '../titan-zero/titan-zero-context.js',
            '../titan-zero/titan-zero-diagnostics.js',
            '../titan-zero/titan-zero-prompts.js',
            '../titan-zero/titan-zero-skills.js',
            '../titan-zero/titan-zero-schema-graph.js',
            '../titan-zero/titan-zero-migration-analyzer.js',
            '../titan-zero/titan-zero-tenancy-analyzer.js',
            '../titan-zero/titan-zero-php-architecture.js',
            '../titan-zero/titan-zero-frontend-analyzer.js',
            '../titan-zero/titan-zero-navigation-analyzer.js',
            '../titan-zero/titan-zero-impact-engine.js',
            '../titan-zero/titan-zero-test-matrix.js',
            '../titan-zero/titan-zero-runtime-diagnostics.js',
            '../titan-zero/titan-zero-model-schema-analyzer.js',
            '../titan-zero/titan-zero-route-consumer-index.js',
            '../titan-zero/titan-zero-version-analyzer.js',
            '../titan-zero/titan-zero-config-analyzer.js',
            '../titan-zero/titan-zero-project-graph.js',
            '../titan-zero/titan-zero-context-selector.js',
            '../titan-zero/titan-zero-command-catalog.js',
            '../titan-zero/titan-zero-risk-rules.js',
            '../titan-zero/titan-zero-error-classifier.js',
            '../titan-zero/titan-zero-knowledge.js',
            '../titan-zero/titan-zero-development-prompts.js',
            '../titan-zero/titan-zero-development-skills.js',
            '../titan-zero/titan-zero-development-profiles.js',
            '../titan-zero/titan-zero-developer-pack.js',
            '../titan-zero/titan-zero-receiver-adapter.js',
            'titan-zero-host-integration.js',
            '../workforce/personal-workforce.js',
            '../workforce/task-classifier.js',
            '../workforce/risk-classifier.js',
            '../workforce/delegation-policy.js',
            '../workforce/evidence-bundle.js',
            '../workforce/recommendation-envelope.js',
            '../workforce/work-order.js',
            '../workforce/provider-assistance-request.js',
            '../workforce/handoff-builder.js',
            '../workforce/tool-request.js',
            '../workforce/mutation-request.js',
            '../workforce/verification-request.js',
            '../workforce/manager-session.js',
            '../workforce/context-strategy.js',
            '../workforce/capability-resolver.js',
            '../workforce/conflict-resolver.js',
            '../workforce/plan-starter.js',
            '../workforce/manager-health.js',
            '../managers/manager-catalog.js',
            '../managers/manager-registry.js',
            '../managers/manager-router.js',
            '../managers/manager-orchestrator.js',
            '../workforce/workforce-manifest.js',
            '../catalog/workforce-prompts.js',
            '../catalog/workforce-skills.js',
            '../catalog/workforce-profiles.js',
            '../integration/workforce-host-contract.js',
            '../integration/workforce-context-bridge.js',
            '../workforce/manager-workforce-pack.js',
            '../workforce/titan-workforce-gateway.js',
            '../workforce/deployment-console-store.js',
            '../workforce/deployment-workforce-console.js',
            '../integration/workforce-receiver-adapter.js',
            'workforce-host-integration.js',
  '../titan-zero/agent-mesh-role-topology.js',
  '../titan-zero/manager-control-plane.js',
  '../titan-zero/manager-workspace-ledger.js',
  '../titan-zero/manager-lifecycle.js',
  '../titan-zero/manager-self-claim.js',
  '../titan-zero/manager-auto-rollover.js',
  '../titan-zero/manager-idle-sweep.js',
  '../titan-zero/manager-verification-plan.js',
  '../titan-zero/manager-baseline-state.js',
  '../titan-zero/manager-packet-state.js',
  '../titan-zero/manager-eligibility.js',
  '../titan-zero/manager-live-state.js',
  '../titan-zero/manager-delta-convergence.js',
  '../titan-zero/manager-promotion-gate.js',
  '../titan-zero/manager-control-room.js',
  '../titan-zero/manager-dependency-engine.js',
  '../titan-zero/manager-queue-state.js',
  '../titan-zero/manager-state-derivation.js',
  '../titan-zero/manager-restart-reconstruction.js',
  '../titan-zero/manager-delta-intake.js',
  '../titan-zero/manager-convergence-plan.js',
  '../titan-zero/manager-baseline-advance.js',
  '../titan-zero/manager-ai-supervisor.js'
);
    } catch (error) {
        console.error('[Codee] local capability runtime failed to load:', error);
    }
}


if (chrome.storage?.local?.setAccessLevel) {
    chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }).catch((error) => console.error('[Codee] Could not restrict storage access:', error));
}

function getInstalledMcpAdapter() {
    if (!globalThis.CodeeMcpRuntime || !globalThis.CodeeMcpIntegrationAdapter) return null;
    try { return globalThis.CodeeMcpIntegrationAdapter.create(globalThis.CodeeMcpRuntime); } catch (_error) { return null; }
}

async function callGovernedMcpTool(connectionId, name, args) {
    const adapter = getInstalledMcpAdapter();
    if (!adapter || !globalThis.CodeeMcpGovernanceGateway) return { ok: false, unavailable: true, reason: 'mcp-runtime-not-installed', mayAdvancePlan: false };
    return globalThis.CodeeMcpGovernanceGateway.call(adapter, String(connectionId || '').slice(0, 240), String(name || '').slice(0, 240), args && typeof args === 'object' ? args : {});
}

async function getMcpInspectorPayload(options = {}) {
    if (!globalThis.CodeeMcpInspector) throw new Error('Codee MCP inspector runtime is unavailable');
    const runtime = globalThis.CodeeMcpRuntime;
    if (!runtime) return globalThis.CodeeMcpInspector.build({ generatedAt: new Date().toISOString(), connections: [], discoveries: {}, approvals: [], receipts: [] });
    const [connections, approvals, receipts] = await Promise.all([
        runtime.listConnections?.() || Promise.resolve([]),
        runtime.listPendingApprovals?.() || Promise.resolve([]),
        runtime.listMutationReceipts?.() || Promise.resolve([])
    ]);
    const rows = Array.isArray(connections) ? connections : [];
    const discovered = await Promise.all(rows.map(async connection => {
        if (connection?.enabled === false) return [String(connection?.id || ''), { ok:false, error:'mcp-connection-disabled' }];
        try {
            const value = await runtime.discover?.(String(connection?.id || ''), options.force === true);
            return [String(connection?.id || ''), { ok:true, value }];
        } catch (error) {
            return [String(connection?.id || ''), { ok:false, error:String(error?.message || error).slice(0,500) }];
        }
    }));
    return globalThis.CodeeMcpInspector.build({ generatedAt:new Date().toISOString(), connections:rows, discoveries:Object.fromEntries(discovered), approvals, receipts });
}

// Service Worker - Multi-Tab Orchestration and Polling

const MAX_VERSIONS = 5;
const MAX_KNOWN_VERSIONS = 50;
const PLAN_STATE_VERSION = 2;
const MAX_PLAN_STEPS = 500;
const MAX_PLAN_TEXT_CHARS = 1024 * 1024;
const MAX_STEP_TEXT_CHARS = 120000;
const MAX_DISPATCH_PROMPT_CHARS = 200000;
const MAX_ARTIFACT_HISTORY = MAX_PLAN_STEPS;
const MAX_CONSUMED_ARTIFACT_HASHES = MAX_PLAN_STEPS * 2;
const MAX_AUTOMATIC_LOGICAL_RETRIES = 2;
const MAX_TRANSIENT_DELIVERY_RETRIES = 5;
const RETRY_BACKOFF_BASE_MS = 60 * 1000;
const WATCHDOG_RELOAD_COOLDOWN_MS = 5 * 60 * 1000;
const COMPLETED_PLAN_FULL_RETENTION = 20;
const DIAGNOSTIC_STORAGE_KEY = 'codeeDiagnostics';
const MAX_DIAGNOSTIC_EVENTS = 120;
const PREFERENCES_STORAGE_KEY = 'codeePreferences';
const DEFAULT_RECOVERY_PREFERENCES = Object.freeze({
    autoRecoverySweep: true,
    nextNudgerFeatureEnabled: true,
    backgroundWatchdog: true,
    composerWatchdog: true,
    focusPulse: false,
    targetedReload: false,
    restorePreviousTab: true,
    preventAutoDiscard: true
});
const NEXT_NUDGE_INTERVAL_MS = 5 * 60 * 1000;
const NEXT_RUNNER_STORAGE_KEY = 'codeeNextRunnerState';
const NEXT_RUNNER_ALARM_PREFIX = 'CODEE_NEXT_RUNNER:';
const NEXT_RUNNER_DEFAULT_MINUTES = 5;
const NEXT_RUNNER_MIN_MINUTES = 1;
const NEXT_RUNNER_MAX_MINUTES = 1440;
const TITAN_ZERO_ANALYSIS_STORAGE_KEY = 'codeeTitanZeroAnalysis';
const MAX_TITAN_ZERO_ANALYSIS_TABS = 12;
const REPOSITORY_ANALYSIS_STORAGE_KEY = 'codeeRepositoryAnalysis';
const MAX_REPOSITORY_ANALYSIS_TABS = 12;
const dispatchLocks = new Set();
const artifactProcessingLocks = new Set();
const nextNudgeLocks = new Set();
const watchdogReloadTimes = new Map();
const watchdogReloadInFlight = new Set();
const cancelledPlanIds = new Set();
let stateMutationQueue = Promise.resolve();
let recoveryAlarmEnsurePromise = null;
let diagnosticMutationQueue = Promise.resolve();
let titanAnalysisMutationQueue = Promise.resolve();
let repositoryAnalysisMutationQueue = Promise.resolve();
let preferencesMutationQueue = Promise.resolve();

const CURRENT_NAVIGATION_VIEWS = Object.freeze(['dashboard','runner','plans','browser','connections','mcp','repository-host','prompts','skills','settings','diagnostics','about']);

function initializeNavigationRegistry() {
    if (!globalThis.CodeeNavigationRegistry || !globalThis.CodeeNavigationReadiness) {
        return { ok: false, errors: [{ code: 'NAVIGATION_RUNTIME_MISSING' }] };
    }
    globalThis.CodeeNavigationRegistry.installDefaults();
    return globalThis.CodeeNavigationRegistry.validate({ availableViews: CURRENT_NAVIGATION_VIEWS });
}

const navigationStartupValidation = initializeNavigationRegistry();
if (!navigationStartupValidation.ok) console.error('[Codee] Navigation registry validation failed:', navigationStartupValidation.errors);

function normalizeOptionalTabId(value) {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : null;
}

if (typeof chrome.sidePanel?.setPanelBehavior === 'function') {
    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error('[Codee] Could not enable side-panel action:', error));
} else {
    console.error('[Codee] Side Panel API unavailable. Check Chrome version and sidePanel permission.');
}


async function getHostOperationsPayload(){
    const repo=globalThis.CodeeRepositoryHost||null;
    const artifact=globalThis.CodeeArtifactVerificationHost||(repo&&typeof repo.verifyArtifact==='function'?repo:null);
    const plan=await getPlanState().catch(()=>({}));
    const methodMap=(host,names)=>Object.fromEntries(names.map(name=>[name,typeof host?.[name]==='function']));
    const repoCaps=methodMap(repo,['readFile','writeFile','deleteFile','runCommand','createBackup','verifyBackup','verifyMutation','auditMutation','requestApproval','rollback']);
    const artifactCaps=methodMap(artifact,['verifyArtifact','health']);
    const [repoProbe,artifactProbe]=await Promise.all([probeHostConnection(repo),probeHostConnection(artifact)]);
    const receipt=latestArtifactVerificationEvidence(plan);
    const held=[];
    const state=String(plan?.status||plan?.state||'').toLowerCase();
    if(['awaiting_artifact','awaiting_zip','blocked'].includes(state)) held.push({planId:String(plan?.planId||plan?.id||'').slice(0,160),stepId:String(plan?.stepId||plan?.currentStepId||'').slice(0,160),state});
    return {generatedAt:new Date().toISOString(),repositoryIntelligenceAvailable:Boolean(globalThis.CodeeRepositoryHostIntegration),repositoryHost:{detected:Boolean(repo),probe:repoProbe,capabilities:repoCaps,filesystem:Boolean(repoCaps.readFile||repoCaps.writeFile),commandExecution:repoCaps.runCommand===true,backupDomains:repoCaps.createBackup&&repoCaps.verifyBackup,backupDestination:String(repoProbe?.backupDestination||repoProbe?.details?.backupDestination||'').slice(0,500),writeVerification:repoCaps.verifyMutation===true,rollbackCapability:repoCaps.rollback===true,lastMutation:repoProbe?.lastMutation||repoProbe?.details?.lastMutation||null},artifactHost:{detected:Boolean(artifact),probe:artifactProbe,capabilities:artifactCaps,verifier:artifactCaps.verifyArtifact===true,checks:{bytes:true,hash:true,size:true,zipIntegrity:true,contentManifest:true},lastReceipt:receipt||null},heldPlans:held.slice(0,20)};
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== 'object') return;

    if (globalThis.CodeeIntelligenceRpc?.handleChromeMessage?.(message, sendResponse, chrome)) return true;


    if (message.action === 'GET_MCP_CONNECTIONS') {
        Promise.all([globalThis.CodeeMcpRuntime?.listConnections?.() || [], globalThis.CodeeMcpRuntime?.listPendingApprovals?.() || []])
            .then(([connections, approvals]) => sendResponse({ ok: true, connections, approvals, client: globalThis.CodeeMcpRuntime?.clientCompatibility || null }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'SAVE_MCP_CONNECTION') {
        (globalThis.CodeeMcpRuntime?.saveConnection?.(message.connection || {}) || Promise.reject(new Error('MCP runtime is unavailable')))
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'REMOVE_MCP_CONNECTION') {
        (globalThis.CodeeMcpRuntime?.removeConnection?.(String(message.connectionId || '')) || Promise.reject(new Error('MCP runtime is unavailable')))
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'TEST_MCP_CONNECTION') {
        (globalThis.CodeeMcpRuntime?.health?.(String(message.connectionId || '')) || Promise.reject(new Error('MCP runtime is unavailable')))
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'MCP_DISCOVER') {
        (globalThis.CodeeMcpRuntime?.discover?.(String(message.connectionId || ''), message.force === true) || Promise.reject(new Error('MCP runtime is unavailable')))
            .then(result => sendResponse({ ok: true, discovery: result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'MCP_TOOL_CALL') {
        callGovernedMcpTool(message.connectionId, message.tool || message.name, message.args || {})
            .then(result => sendResponse({ ok: result?.ok === true, result, error: result?.ok === true ? undefined : (result?.reason || result?.error || 'MCP tool call rejected') }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }


    if (message.action === 'GET_HOST_OPERATIONS') {
        getHostOperationsPayload().then(operations => sendResponse({ ok: true, operations })).catch(error => sendResponse({ ok:false, error:error?.message||String(error) }));
        return true;
    }

    if (message.action === 'GET_MCP_INSPECTOR') {
        getMcpInspectorPayload({ force: message.force === true })
            .then(inspector => sendResponse({ ok: true, inspector }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_MCP_APPROVALS') {
        (globalThis.CodeeMcpRuntime?.listPendingApprovals?.() || Promise.resolve([]))
            .then(approvals => sendResponse({ ok: true, approvals }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_MCP_RECEIPTS') {
        (globalThis.CodeeMcpRuntime?.listMutationReceipts?.() || Promise.resolve([]))
            .then(receipts => sendResponse({ ok: true, receipts }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'MCP_MUTATION_APPROVE') {
        (globalThis.CodeeMcpRuntime?.approveMutation?.(String(message.approvalId || '')) || Promise.reject(new Error('MCP runtime is unavailable')))
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'MCP_MUTATION_DENY') {
        (globalThis.CodeeMcpRuntime?.denyMutation?.(String(message.approvalId || '')) || Promise.reject(new Error('MCP runtime is unavailable')))
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_CAPABILITY_REGISTRY') {
        getCapabilityRegistryPayload()
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_CONNECTION_REGISTRY') {
        getConnectionRegistryPayload({ force: message.force === true })
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_CONNECTION_WORKSPACE') {
        getConnectionWorkspacePayload({ force: message.force === true })
            .then(result => sendResponse({ ok: true, workspace: result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_NAVIGATION_STATUS') {
        getNavigationStatus(message.availableViews)
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_DASHBOARD_STATUS') {
        getDashboardStatus()
            .then(result => sendResponse({ ok: true, dashboard: result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_AI_GATEWAY_STATUS') {
        getAIGatewayStatus()
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_SYSTEM_INTEGRATION_STATUS') {
        getSystemIntegrationStatus({ probe: message.probe !== false })
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'UPDATE_SYSTEM_INTEGRATION_SETTINGS') {
        updateSystemIntegrationSettings(message.settings || {})
            .then(result => sendResponse({ ok: true, settings: result.settings, status: result.status }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'CALL_TITAN_BRIDGE') {
        callTitanBridge(message.bridgeAction, message.payload || {})
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'RUN_WORKFORCE_ADVISORY') {
        runWorkforceAdvisory(message.input || {})
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_DEPLOYMENT_WORKFORCE_CONSOLE') {
        globalThis.CodeeDeploymentWorkforceConsole.getState(message.options || {})
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'UPDATE_DEPLOYMENT_WORKFORCE_GATEWAY_CONFIG') {
        globalThis.CodeeDeploymentWorkforceConsole.updateConfig(message.config || {})
            .then(config => sendResponse({ ok: true, config: globalThis.CodeeTitanWorkforceGateway.publicConfig(config) }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'REFRESH_DEPLOYMENT_WORKFORCE') {
        globalThis.CodeeDeploymentWorkforceConsole.refresh(message.options || {})
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'SELECT_DEPLOYMENT_WORKFORCE_MISSION') {
        globalThis.CodeeDeploymentWorkforceConsole.selectMission(message.deployment_mission_id)
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'SUBMIT_DEPLOYMENT_WORKFORCE_REQUEST') {
        globalThis.CodeeDeploymentWorkforceConsole.submit(message.input || {})
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_DEPLOYMENT_WORKFORCE_RECEIPTS') {
        globalThis.CodeeDeploymentWorkforceConsole.receipts()
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_ARTIFACT_DETAIL') {
        getArtifactDetail(message.tabId, message.index)
            .then(result => sendResponse({ ok: true, detail: result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_BROWSER_TABS') {
        getBrowserTabs().then(result => sendResponse({ ok: true, ...result })).catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_BROWSER_SNAPSHOT') {
        getBrowserSnapshot(message.tabId).then(result => sendResponse({ ok: true, snapshot: result })).catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'BROWSER_INTERACT') {
        executeBrowserInteraction(message.operation, message).then(result => sendResponse({ ok: true, result })).catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'BROWSER_NAVIGATE') {
        executeBrowserNavigation(message.operation, message.tabId, message.url, message.timeoutMs).then(result => sendResponse({ ok: true, result })).catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_BROWSER_DEVELOPER_INSPECTION') {
        executeBrowserDeveloperInspection(message.operation, message).then(result => sendResponse({ ok: true, ...result })).catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_BROWSER_OBSERVABILITY') {
        executeBrowserObservability(message.operation, message).then(result => sendResponse({ ok: true, ...result })).catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_BROWSER_STATUS') {
        getBrowserStatus()
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_BROWSER_TAB_POLICY') {
        getBrowserTabPolicy(message.tabId)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'BROWSER_POLICY_CONNECT') {
        connectBrowserPolicy(message.tabId, message.ttlMs)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'BROWSER_POLICY_GRANT') {
        grantBrowserPolicy(message.tabId, message.grant, message.ttlMs)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'BROWSER_POLICY_REVOKE') {
        revokeBrowserPolicy(message.tabId, message.grant)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'BROWSER_POLICY_DISCONNECT') {
        disconnectBrowserPolicy(message.tabId)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'CHECK_BROWSER_CAPABILITY_AUTH') {
        checkBrowserCapabilityAuthorization(message.capabilityId, message.tabId)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_MANAGER_AI_STATUS') {
        Promise.resolve(globalThis.TitanCodeManagerAISupervisor?.status?.() || { installed: false })
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'RUN_MANAGER_AI_SUPERVISION') {
        runStoredManagerAISupervision({useAI:message.useAI!==false,allowCloud:message.allowCloud===true,provider:message.provider||'auto'})
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'EXECUTE_MANAGER_AI_PLAN') {
        executeManagerAIPlan({allowCloud:message.allowCloud===true})
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_MANAGER_AI_STATE') {
        Promise.all([getManagerAISnapshot(),chrome.storage.local.get([MANAGER_AI_LAST_STORAGE_KEY]),Promise.resolve(globalThis.TitanCodeManagerAISupervisor?.status?.())])
            .then(([snapshot,last,status]) => sendResponse({ok:true,snapshot,last:last?.[MANAGER_AI_LAST_STORAGE_KEY]||null,status}))
            .catch(error=>sendResponse({ok:false,error:error?.message||String(error)}));
        return true;
    }
    if (message.action === 'SET_MANAGER_AI_SNAPSHOT') {
        setManagerAISnapshot(message.snapshot||{})
            .then(snapshot=>sendResponse({ok:true,snapshot}))
            .catch(error=>sendResponse({ok:false,error:error?.message||String(error)}));
        return true;
    }
    if (message.action === 'RUN_MANAGER_AI_SUPERVISION') {
        runStoredManagerAISupervision({useAI:message.useAI!==false,allowCloud:message.allowCloud===true,provider:message.provider||'auto'})
            .then(result=>sendResponse({ok:true,...result}))
            .catch(error=>sendResponse({ok:false,error:error?.message||String(error)}));
        return true;
    }

    if (message.action === 'GET_TITAN_ZERO_STATUS') {
        getTitanZeroStatus()
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'UPDATE_TITAN_ZERO_SETTINGS') {
        updateTitanZeroSettings(message.settings)
            .then(result => sendResponse({ ok: true, settings: result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'ANALYZE_TITAN_ZERO_SNAPSHOT') {
        analyzeTitanZeroSnapshot(message.snapshot, {
            task: message.task || '',
            changedPaths: Array.isArray(message.changedPaths) ? message.changedPaths : [],
            tabId: normalizeOptionalTabId(message.tabId)
        })
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_REPOSITORY_STATUS') {
        getRepositoryStatus()
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'UPDATE_REPOSITORY_SETTINGS') {
        updateRepositorySettings(message.settings)
            .then(result => sendResponse({ ok: true, settings: result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'ANALYZE_REPOSITORY_SNAPSHOT') {
        analyzeRepositorySnapshot(message.snapshot, {
            task: message.task || '',
            query: message.query || '',
            routeName: message.routeName || '',
            uri: message.uri || '',
            error: message.error || '',
            changedFiles: Array.isArray(message.changedFiles) ? message.changedFiles : (Array.isArray(message.changedPaths) ? message.changedPaths : []),
            tabId: normalizeOptionalTabId(message.tabId)
        })
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'CALL_REPOSITORY_CAPABILITY') {
        callRepositoryCapability(message.capability, message.payload)
            .then(result => sendResponse({ ok: true, result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }


    if (message.action === 'GET_WORKFORCE_STATUS') {
        getWorkforceStatus()
            .then(result => sendResponse({ ok: true, ...result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'UPDATE_WORKFORCE_SETTINGS') {
        updateWorkforceSettings(message.settings)
            .then(result => sendResponse({ ok: true, settings: result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'PREPARE_WORKFORCE_PREFLIGHT') {
        prepareWorkforcePreflight(message.input || message)
            .then(result => sendResponse({ ok: true, preflight: result.preflight, context: result.context }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'CREATE_WORKFORCE_PLAN_DRAFT') {
        createWorkforcePlanDraft(message.input || message)
            .then(result => sendResponse({ ok: true, draft: result }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'CALL_WORKFORCE_CAPABILITY') {
        callWorkforceCapability(message.capability, message.payload)
            .then(result => {
                const failed = Boolean(result && typeof result === 'object' && result.ok === false);
                sendResponse({ ok: !failed, result, error: failed ? (result.reason || result.error || 'Workforce capability rejected the request') : undefined });
            })
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'EXECUTE_WORKFORCE_TOOL_REQUEST') {
        executeWorkforceToolRequest(message.request)
            .then(result => {
                const failed = Boolean(result && typeof result === 'object' && result.ok === false);
                sendResponse({ ok: !failed, result, error: failed ? (result.reason || result.error || 'Workforce tool request was rejected') : undefined });
            })
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'REQUEST_WORKFORCE_GOVERNED_MUTATION') {
        requestWorkforceGovernedMutation(message.request)
            .then(result => {
                const failed = Boolean(result && typeof result === 'object' && result.ok === false);
                sendResponse({ ok: !failed, result, error: failed ? (result.reason || result.error || 'Governed mutation was rejected') : undefined });
            })
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_STORAGE_HEALTH') {
        getStorageHealth().then(result => sendResponse({ ok: true, storageHealth: result })).catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_DIAGNOSTICS') {
        const tabId = normalizeOptionalTabId(message.tabId);
        if (tabId === null) {
            sendResponse({ ok: false, error: 'Invalid diagnostic target tab' });
            return;
        }
        getDiagnosticSnapshot(tabId)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'RUN_DIAGNOSTIC_REPAIR') {
        const tabId = normalizeOptionalTabId(message.tabId);
        if (tabId === null) {
            sendResponse({ ok: false, error: 'Invalid diagnostic target tab' });
            return;
        }
        runDiagnosticRepair(tabId, message.repair || 'auto')
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'CLEAR_DIAGNOSTICS') {
        clearDiagnosticEvents()
            .then(() => sendResponse({ ok: true }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'ARTIFACT_DETECTED') {
        const tabId = sender.tab?.id;
        if (!Number.isInteger(tabId)) {
            console.warn('[Codee] Ignoring ARTIFACT_DETECTED without a source tab');
            sendResponse({ ok: false, ignored: true, reason: 'missing-source-tab' });
            return;
        }

        handleArtifactDetected(tabId, message.artifact)
            .then(result => sendResponse(result || { ok: true }))
            .catch((error) => {
                console.error('[Codee] Failed to process CODEE artifact signature:', error);
                sendResponse({ ok: false, error: error?.message || String(error) });
            });
        return true;
    }

    if (message.action === 'ZIP_DETECTED') {
        const tabId = sender.tab?.id;
        if (!Number.isInteger(tabId)) {
            console.warn('[Codee] Ignoring ZIP_DETECTED without a source tab');
            sendResponse({ ok: false, ignored: true, reason: 'missing-source-tab' });
            return;
        }

        handleZIPDetected(tabId, message.version)
            .then(result => sendResponse(result || { ok: true }))
            .catch((error) => {
                console.error('[Codee] Failed to process detected ZIP:', error);
                sendResponse({ ok: false, error: error?.message || String(error) });
            });
        return true;
    }

    if (message.action === 'CONTENT_READY') {
        const tabId = sender.tab?.id;
        if (!Number.isInteger(tabId)) return;

        handleContentReady(tabId, message.versions || [], message.artifacts || [], sender.tab?.url || '', message.provisionalConversationIdentity || '', message.conversationIdentity || '')
            .then(result => sendResponse(result || { ok: true }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_NEXT_RUNNER') {
        const tabId = normalizeOptionalTabId(message.tabId);
        if (tabId === null) { sendResponse({ ok:false, error:'Invalid target tab' }); return; }
        getNextRunnerStatus(tabId).then(sendResponse).catch(error => sendResponse({ ok:false, error:error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_NEXT_RUNNERS') {
        getAllNextRunnerStatuses().then(sendResponse).catch(error => sendResponse({ ok:false, error:error?.message || String(error), runners:[] }));
        return true;
    }

    if (message.action === 'START_NEXT_RUNNER') {
        const tabId = normalizeOptionalTabId(message.tabId);
        if (tabId === null) { sendResponse({ ok:false, error:'Invalid target tab' }); return; }
        startNextRunner(tabId, message.intervalMinutes).then(sendResponse).catch(error => sendResponse({ ok:false, error:error?.message || String(error) }));
        return true;
    }

    if (message.action === 'UPDATE_NEXT_RUNNER_INTERVAL') {
        const tabId = normalizeOptionalTabId(message.tabId);
        if (tabId === null) { sendResponse({ ok:false, error:'Invalid target tab' }); return; }
        updateNextRunnerInterval(tabId, message.intervalMinutes).then(sendResponse).catch(error => sendResponse({ ok:false, error:error?.message || String(error) }));
        return true;
    }

    if (message.action === 'STOP_NEXT_RUNNER') {
        const tabId = normalizeOptionalTabId(message.tabId);
        if (tabId === null) { sendResponse({ ok:false, error:'Invalid target tab' }); return; }
        stopNextRunner(tabId).then(sendResponse).catch(error => sendResponse({ ok:false, error:error?.message || String(error) }));
        return true;
    }

    if (message.action === 'SET_NEXT_NUDGER') {
        const tabId = normalizeOptionalTabId(message.tabId);
        if (tabId === null) { sendResponse({ ok:false, error:'Invalid target tab' }); return; }
        setNextNudgerEnabled(tabId, Boolean(message.enabled))
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok:false, error:error?.message || String(error) }));
        return true;
    }

    if (message.action === 'RECOVERY_PREFERENCES_CHANGED') {
        reconcileRecoveryAlarm().then(result => sendResponse({ ok:true, recoveryAlarm:result })).catch(error => sendResponse({ ok:false, error:error?.message || String(error) }));
        return true;
    }

    if (message.action === 'ANALYZE_PLAN_REQUIREMENTS') {
        try {
            if (!globalThis.CodeePlanRequirementAnalyzer) throw new Error('Plan Requirement Analyzer is unavailable');
            const requirements = globalThis.CodeePlanRequirementAnalyzer.analyze({
                plan: Array.isArray(message.plan) ? message.plan : [],
                protocolMode: message.protocolMode || 'signature_v2',
                artifactValidationMode: message.artifactValidationMode || 'strict_v216',
                debuggingPlanEnabled: Boolean(message.debuggingPlanEnabled)
            });
            sendResponse({ ok: true, requirements });
        } catch (error) {
            sendResponse({ ok: false, error: String(error?.message || error) });
        }
        return;
    }

    if (message.action === 'START_PLAN' || message.action === 'RETRY_PLAN') {
        const tabId = normalizeOptionalTabId(message.tabId);
        if (tabId === null) {
            sendResponse({ ok: false, error: 'Invalid target tab' });
            return;
        }

        handleStartOrRetry(tabId)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'RUN_PRODUCTION_PLAN_PREFLIGHT') {
        const tabId = normalizeOptionalTabId(message.tabId);
        if (tabId === null) { sendResponse({ ok:false, error:'Invalid target tab' }); return; }
        getPlanState().then(async state => {
            const planState = normalizePlanState(state?.[`plan_${tabId}`]);
            if (!planState) return { ok:false, error:'No saved plan for this conversation' };
            const productionPreflight = await evaluateProductionPlanPreflight(tabId, planState);
            await updatePlanState(tabId, planState);
            return { ok:true, productionPreflight };
        }).then(sendResponse).catch(error => sendResponse({ ok:false, error:error?.message || String(error) }));
        return true;
    }

    if (message.action === 'SAVE_PLAN') {
        const tabId = Number(message.tabId);
        if (!Number.isInteger(tabId) || !message.planState?.planId) {
            sendResponse({ ok: false, error: 'Invalid plan state' });
            return;
        }

        prepareAndSavePlanState(tabId, message.planState)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'STOP_PLAN') {
        const tabId = normalizeOptionalTabId(message.tabId);
        if (tabId === null) {
            sendResponse({ ok: false, error: 'Invalid target tab' });
            return;
        }

        stopPlan(tabId, message.planId)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }
});


function normalizeRecoveryPreferences(value) {
    const input = value && typeof value === 'object' ? value : {};
    const recoveryPolicyVersion = Number(input.recoveryPolicyVersion) >= 2 ? 2 : 1;
    return {
        recoveryPolicyVersion: 2,
        autoRecoverySweep: input.autoRecoverySweep !== false,
        nextNudgerFeatureEnabled: input.nextNudgerFeatureEnabled !== false,
        backgroundWatchdog: input.backgroundWatchdog !== false,
        composerWatchdog: input.composerWatchdog !== false,
        focusPulse: input.focusPulse !== false,
        targetedReload: recoveryPolicyVersion >= 2 ? input.targetedReload === true : false,
        restorePreviousTab: input.restorePreviousTab !== false,
        preventAutoDiscard: input.preventAutoDiscard !== false
    };
}

async function getRecoveryPreferences() {
    try {
        const result = await chrome.storage.local.get([PREFERENCES_STORAGE_KEY]);
        return normalizeRecoveryPreferences(result?.[PREFERENCES_STORAGE_KEY] || DEFAULT_RECOVERY_PREFERENCES);
    } catch (_error) {
        return { ...DEFAULT_RECOVERY_PREFERENCES };
    }
}

async function readCodeePreferences() {
    const result = await chrome.storage.local.get([PREFERENCES_STORAGE_KEY]);
    const raw = result?.[PREFERENCES_STORAGE_KEY];
    return raw && typeof raw === 'object' ? raw : {};
}

async function mutateCodeePreferences(mutator) {
    const operation = preferencesMutationQueue.then(async () => {
        const current = await readCodeePreferences();
        const next = await mutator({ ...current });
        const value = next && typeof next === 'object' ? next : current;
        await chrome.storage.local.set({ [PREFERENCES_STORAGE_KEY]: value });
        return value;
    });
    preferencesMutationQueue = operation.catch(() => {});
    return operation;
}

async function ensureOnboardAIRegistered() {
    if (!globalThis.CodeeOnboardAIHostIntegration || !globalThis.CodeeCapabilityRegistry || !globalThis.CodeeProviderGateway) {
        throw new Error('Onboard AI gateway runtime is unavailable');
    }
    const registration = globalThis.CodeeOnboardAIHostIntegration.register();
    return { registration };
}

async function getAIGatewayStatus() {
    const { registration } = await ensureOnboardAIRegistered();
    return { ...globalThis.CodeeOnboardAIHostIntegration.status(), registration };
}


const SYSTEM_INTEGRATION_STORAGE_KEY = 'codeeSystemIntegration';
const DEFAULT_SYSTEM_INTEGRATION = Object.freeze({
    bridgeEnabled: true,
    bridgeEndpoint: 'http://127.0.0.1:43127/v1/action',
    bridgeToken: '',
    bridgeWorkspace: '',
    geminiEnabled: true,
    geminiApiKey: '',
    geminiModel: '',
    freeFirst: true,
    localFirst: true
});

function normalizeSystemIntegrationSettings(value = {}) {
    const input = value && typeof value === 'object' ? value : {};
    return {
        bridgeEnabled: input.bridgeEnabled !== false,
        bridgeEndpoint: String(input.bridgeEndpoint || DEFAULT_SYSTEM_INTEGRATION.bridgeEndpoint).trim().slice(0, 500),
        bridgeToken: String(input.bridgeToken || '').trim().slice(0, 2000),
        bridgeWorkspace: String(input.bridgeWorkspace || '').trim().slice(0, 2000),
        geminiEnabled: input.geminiEnabled !== false,
        geminiApiKey: String(input.geminiApiKey || '').trim().slice(0, 4000),
        geminiModel: String(input.geminiModel || '').trim().slice(0, 240),
        freeFirst: input.freeFirst !== false,
        localFirst: input.localFirst !== false
    };
}

function publicSystemIntegrationSettings(settings = {}) {
    const value = normalizeSystemIntegrationSettings(settings);
    return {
        ...value,
        bridgeToken: value.bridgeToken ? 'configured' : '',
        geminiApiKey: value.geminiApiKey ? 'configured' : ''
    };
}

async function getSystemIntegrationSettings() {
    const data = await chrome.storage.local.get([SYSTEM_INTEGRATION_STORAGE_KEY]);
    return normalizeSystemIntegrationSettings(data?.[SYSTEM_INTEGRATION_STORAGE_KEY] || DEFAULT_SYSTEM_INTEGRATION);
}

async function registerSystemProviders(settings) {
    const registry = globalThis.CodeeAIProviderRegistry;
    if (!registry) return { registered: [] };
    registry.unregister?.('ollama');
    registry.unregister?.('gemini');
    registry.unregister?.('chrome-prompt-api');
    const registered = [];
    if (globalThis.CodeeChromePromptAdapter) {
        try {
            if (await globalThis.CodeeChromePromptAdapter.isAvailable()) {
                const adapter = globalThis.CodeeChromePromptAdapter.create();
                registry.register(adapter); registered.push('chrome-prompt-api');
                globalThis.CodeeAIModelRegistry?.upsert?.({ providerId: 'chrome-prompt-api', modelId: 'chrome-built-in', displayName: 'Chrome Built-in AI', lifecycle: 'LOCAL', freeStatus: 'LOCAL', health: 'READY', capabilities: { text: true, reasoning: true } });
            }
        } catch (_error) {}
    }
    if (settings.bridgeEnabled && settings.bridgeToken && globalThis.CodeeOllamaBridgeAdapter && globalThis.CodeeTitanBridgeClient) {
        try {
            const adapter = globalThis.CodeeOllamaBridgeAdapter.create({
                getBridgeConfig: async () => ({ enabled: settings.bridgeEnabled, endpoint: settings.bridgeEndpoint, token: settings.bridgeToken, workspace: settings.bridgeWorkspace })
            });
            registry.register(adapter); registered.push('ollama');
            try {
                const models = await adapter.listModels();
                for (const row of models || []) globalThis.CodeeAIModelRegistry?.upsert?.({ providerId: 'ollama', modelId: row.name, displayName: row.name, lifecycle: 'LOCAL', freeStatus: 'LOCAL', health: 'READY', capabilities: { text: true, reasoning: true, long_context: true } });
            } catch (_error) {}
        } catch (_error) {}
    }
    if (settings.geminiEnabled && settings.geminiApiKey && globalThis.CodeeGeminiAdapter) {
        try {
            const adapter = globalThis.CodeeGeminiAdapter.create({ apiKey: settings.geminiApiKey, model: settings.geminiModel });
            registry.register(adapter); registered.push('gemini');
            try {
                const models = await adapter.discoverModels();
                const freeCandidates = new Set(globalThis.CodeeGeminiAdapter.FREE_TIER_PREFERENCE || []);
                for (const row of models || []) globalThis.CodeeAIModelRegistry?.upsert?.({ providerId: 'gemini', modelId: row.id, displayName: row.displayName || row.id, lifecycle: freeCandidates.has(row.id) ? 'FREE_LIMITED' : 'ACTIVE', freeStatus: freeCandidates.has(row.id) ? 'FREE_LIMITED' : 'UNKNOWN', health: 'READY', contextWindow: row.inputTokenLimit || 0, maxOutput: row.outputTokenLimit || 0, capabilities: { text: true, structured_output: true, vision: true, reasoning: true, long_context: true, files: true } });
            } catch (_error) {}
        } catch (_error) {}
    }
    return { registered };
}

async function updateSystemIntegrationSettings(next = {}) {
    const current = await getSystemIntegrationSettings();
    const merged = normalizeSystemIntegrationSettings({ ...current, ...next });
    await chrome.storage.local.set({ [SYSTEM_INTEGRATION_STORAGE_KEY]: merged });
    await registerSystemProviders(merged);
    const status = await getSystemIntegrationStatus({ probe: true });
    return { settings: publicSystemIntegrationSettings(merged), status };
}

async function callTitanBridge(action, payload = {}) {
    const settings = await getSystemIntegrationSettings();
    if (!globalThis.CodeeTitanBridgeClient) return { ok: false, reason: 'bridge-client-unavailable' };
    const config = { enabled: settings.bridgeEnabled, endpoint: settings.bridgeEndpoint, token: settings.bridgeToken, workspace: settings.bridgeWorkspace };
    return globalThis.CodeeTitanBridgeClient.call(config, action, payload);
}

async function getSystemIntegrationStatus(options = {}) {
    const settings = await getSystemIntegrationSettings();
    await registerSystemProviders(settings);
    let bridge = { ok: false, connected: false, reason: settings.bridgeToken ? 'not-probed' : 'bridge-token-required', needsPairing: !settings.bridgeToken };
    if (options.probe !== false && globalThis.CodeeTitanBridgeClient) {
        bridge = await globalThis.CodeeTitanBridgeClient.status({ enabled: settings.bridgeEnabled, endpoint: settings.bridgeEndpoint, token: settings.bridgeToken, workspace: settings.bridgeWorkspace });
    }
    let gemini = { configured: Boolean(settings.geminiApiKey), enabled: settings.geminiEnabled, model: settings.geminiModel || '', models: [] };
    const adapter = globalThis.CodeeAIProviderRegistry?.get?.('gemini');
    if (adapter && options.probe !== false) {
        try { const models = await adapter.listModels(); gemini = { ...gemini, connected: true, models: models.slice(0, 50), selectedModel: adapter.getSelectedModel?.() || settings.geminiModel || '' }; }
        catch (error) { gemini = { ...gemini, connected: false, error: String(error?.message || error).slice(0, 500) }; }
    }
    const gateway = globalThis.CodeeProviderGateway?.status?.() || {};
    return { schema: 'codee.system.integration.status.v1', settings: publicSystemIntegrationSettings(settings), bridge, gemini, gateway, providerRows: globalThis.CodeeAIProviderRegistry?.list?.().map(row => ({ id: row.id, displayName: row.displayName, lifecycle: row.lifecycle, transport: row.transport })) || [] };
}

async function runWorkforceAdvisory(input = {}) {
    const task = String(input.task || input.text || '').trim();
    if (!task) throw new Error('workforce-task-required');
    const systemStatus = await getSystemIntegrationStatus({ probe: true });
    const capabilities = globalThis.CodeeCapabilityRegistry?.list?.().map(row => row.id).filter(Boolean) || [];
    const prepared = globalThis.CodeeManagerOrchestrator?.prepare?.({ text: task, task, planId: input.planId || '', runId: input.runId || '', stepId: input.stepId || '' }, capabilities);
    if (!prepared) throw new Error('workforce-orchestrator-unavailable');
    const results = [];
    for (const manager of prepared.selected || []) {
        const advisory = await globalThis.CodeeProviderGateway.requestAdvisory({ managerId: manager.id, task, reason: `${manager.name}: ${manager.role}`, contextRefs: [], preferredProvider: input.provider || 'auto' });
        results.push({ manager: { id: manager.id, name: manager.name, role: manager.role }, advisory });
    }
    return { task, prepared, results, providers: systemStatus.providerRows, authority: { advancePlan: false, directMutation: false } };
}

async function getArtifactDetail(tabId, index) {
    const state = await getPlanState();
    const key = `plan_${Number(tabId)}`;
    const plan = state[key];
    if (!plan || typeof plan !== 'object') throw new Error('plan-not-found');
    const artifacts = [];
    for (const row of Array.isArray(plan.artifactHistory) ? plan.artifactHistory : []) artifacts.push(row);
    for (const row of Array.isArray(plan.artifactReceipts) ? plan.artifactReceipts : []) artifacts.push(row);
    const item = artifacts[Number(index)];
    if (!item) throw new Error('artifact-not-found');
    return { tabId: Number(tabId), planId: plan.planId || '', runId: plan.runId || '', item };
}

async function ensureBrowserRegistered() {
    if (!globalThis.CodeeBrowserHostIntegration || !globalThis.CodeeCapabilityRegistry) {
        throw new Error('Browser capability contract runtime is unavailable');
    }
    const registration = globalThis.CodeeBrowserHostIntegration.register();
    return { registration };
}

async function getBrowserTabs() {
    await ensureBrowserRegistered();
    const tabs = await globalThis.CodeeBrowserTabRegistry.list();
    return { tabs, registry: globalThis.CodeeBrowserTabRegistry.status() };
}

async function getBrowserStatus() {
    await ensureBrowserRegistered();
    const base = globalThis.CodeeBrowserHostIntegration.statusPayload();
    const policy = await globalThis.CodeeBrowserHostIntegration.policyStatusPayload();
    return { ...base, policyImplemented: true, policy };
}

async function resolveBrowserPolicyTab(tabId) {
    const normalized = normalizeOptionalTabId(tabId);
    if (normalized === null) return { ok: false, reason: 'invalid-tab' };
    try {
        const tab = await chrome.tabs.get(normalized);
        if (!tab || normalizeOptionalTabId(tab.id) === null) return { ok: false, reason: 'tab-not-found' };
        return { ok: true, tab: { id: Number(tab.id), url: String(tab.url || ''), title: String(tab.title || '').slice(0, 500) } };
    } catch (_error) {
        return { ok: false, reason: 'tab-not-found' };
    }
}

async function getBrowserTabPolicy(tabId) {
    await ensureBrowserRegistered();
    const normalized = normalizeOptionalTabId(tabId);
    if (normalized === null) return { ok: false, reason: 'invalid-tab' };
    return globalThis.CodeeBrowserHostIntegration.getTabPolicy(normalized);
}

async function connectBrowserPolicy(tabId, ttlMs = null) {
    await ensureBrowserRegistered();
    const resolved = await resolveBrowserPolicyTab(tabId);
    if (!resolved.ok) return resolved;
    const result = await globalThis.CodeeBrowserHostIntegration.connectPolicy(resolved.tab, { ttlMs });
    await recordDiagnosticEvent('browser-policy-connect', result.ok ? 'success' : 'warning', resolved.tab.id, {
        reason: result.reason || 'connected',
        state: result.record?.state || 'disconnected',
        origin: result.record?.origin || ''
    }).catch(() => {});
    return result;
}

async function grantBrowserPolicy(tabId, grant, ttlMs = null) {
    await ensureBrowserRegistered();
    const resolved = await resolveBrowserPolicyTab(tabId);
    if (!resolved.ok) return resolved;
    const grantName = String(grant || '');
    const result = await globalThis.CodeeBrowserHostIntegration.grantPolicy(resolved.tab, grantName, { ttlMs });
    await recordDiagnosticEvent('browser-policy-grant', result.ok ? 'success' : 'warning', resolved.tab.id, {
        grant: grantName,
        reason: result.reason || 'granted',
        state: result.record?.state || 'disconnected'
    }).catch(() => {});
    return result;
}

async function revokeBrowserPolicy(tabId, grant) {
    await ensureBrowserRegistered();
    const normalized = normalizeOptionalTabId(tabId);
    if (normalized === null) return { ok: false, reason: 'invalid-tab' };
    const grantName = String(grant || '');
    const result = await globalThis.CodeeBrowserHostIntegration.revokePolicy(normalized, grantName, { reason: 'explicit-user-revoke' });
    await recordDiagnosticEvent('browser-policy-revoke', result.ok ? 'success' : 'warning', normalized, {
        grant: grantName,
        reason: result.reason || 'revoked',
        state: result.record?.state || result.state || 'disconnected'
    }).catch(() => {});
    return result;
}

async function disconnectBrowserPolicy(tabId) {
    await ensureBrowserRegistered();
    const normalized = normalizeOptionalTabId(tabId);
    if (normalized === null) return { ok: false, reason: 'invalid-tab' };
    const result = await globalThis.CodeeBrowserHostIntegration.disconnectPolicy(normalized, { reason: 'explicit-user-disconnect' });
    await recordDiagnosticEvent('browser-policy-disconnect', result.ok ? 'success' : 'warning', normalized, {
        reason: result.reason || 'disconnected'
    }).catch(() => {});
    return result;
}

async function checkBrowserCapabilityAuthorization(capabilityId, tabId) {
    await ensureBrowserRegistered();
    const id = String(capabilityId || '');
    if (!globalThis.CodeeBrowserCapabilityContract.has(id)) return { ok: false, reason: 'unknown-capability' };
    if (id === 'browser.tabs') return globalThis.CodeeBrowserHostIntegration.authorizePolicy(id, null);
    const resolved = await resolveBrowserPolicyTab(tabId);
    if (!resolved.ok) return resolved;
    return globalThis.CodeeBrowserHostIntegration.authorizePolicy(id, resolved.tab);
}

async function executeBrowserNavigation(operation, tabId, url = null, timeoutMs = null) {
    await ensureBrowserRegistered();
    const normalized = normalizeOptionalTabId(tabId);
    if (normalized === null) throw new Error('invalid-tab');
    const map = { navigate: 'browser.navigate', back: 'browser.back', forward: 'browser.forward', reload: 'browser.reload' };
    const capabilityId = map[String(operation || '')];
    if (!capabilityId) throw new Error('unsupported-browser-navigation-operation');
    const resolved = await resolveBrowserPolicyTab(normalized);
    if (!resolved.ok) throw new Error(resolved.reason || 'browser-tab-unavailable');
    const auth = await globalThis.CodeeBrowserHostIntegration.authorizePolicy(capabilityId, resolved.tab);
    if (!auth.ok) throw new Error(auth.reason || 'browser-navigation-not-authorized');
    const runtime = globalThis.CodeeBrowserNavigation;
    if (!runtime) throw new Error('browser-navigation-runtime-unavailable');
    if (operation === 'navigate') return runtime.navigate(normalized, url, timeoutMs);
    return runtime[operation](normalized, timeoutMs);
}

async function executeBrowserInteraction(operation, message = {}) {
    await ensureBrowserRegistered();
    const normalized = normalizeOptionalTabId(message.tabId);
    if (normalized === null) throw new Error('invalid-tab');
    const map = { click: 'browser.click', double_click: 'browser.double_click', hover: 'browser.hover', focus: 'browser.focus', type: 'browser.type', insert_text: 'browser.insert_text', clear: 'browser.clear', press_key: 'browser.press_key', select: 'browser.select', scroll: 'browser.scroll', drag: 'browser.drag', fill_form: 'browser.fill_form' };
    const capabilityId = map[operation];
    if (!capabilityId) throw new Error('unsupported-browser-interaction-operation');
    const resolved = await resolveBrowserPolicyTab(normalized);
    if (!resolved.ok) throw new Error(resolved.reason || 'browser-tab-unavailable');
    const auth = await globalThis.CodeeBrowserHostIntegration.authorizePolicy(capabilityId, resolved.tab);
    if (!auth.ok) throw new Error(auth.reason || 'browser-interaction-not-authorized');
    const runtime = globalThis.CodeeBrowserInteraction;
    if (!runtime) throw new Error('browser-interaction-runtime-unavailable');
    if (operation === 'type') return runtime.type(normalized, message.ref, message.text, message.clearFirst);
    if (operation === 'select') return runtime.select(normalized, message.ref, message.values);
    if (operation === 'scroll') return runtime.scroll(normalized, message.ref, message.deltaX, message.deltaY);
    if (operation === 'drag') return runtime.drag(normalized, message.sourceRef, message.targetRef);
    if (operation === 'fill_form') return runtime.fillForm(normalized, message.fields);
    if (operation === 'insert_text') return runtime.insertText(normalized, message.text);
    if (operation === 'press_key') return runtime.pressKey(normalized, message.key, message.modifiers);
    if (operation === 'double_click') return runtime.doubleClick(normalized, message.ref);
    if (operation === 'hover') return runtime.hover(normalized, message.ref);
    return runtime[operation](normalized, message.ref);
}

async function executeBrowserDeveloperInspection(operation, message = {}) {
    await ensureBrowserRegistered();
    const normalized = normalizeOptionalTabId(message.tabId);
    if (normalized === null) throw new Error('invalid-tab');
    const map = { styles: 'browser.styles', react_source: 'browser.react_source', evaluate: 'browser.evaluate' };
    const capabilityId = map[operation];
    if (!capabilityId) throw new Error('unsupported-browser-developer-operation');
    const resolved = await resolveBrowserPolicyTab(normalized);
    if (!resolved.ok) throw new Error(resolved.reason || 'browser-tab-unavailable');
    const auth = await globalThis.CodeeBrowserHostIntegration.authorizePolicy(capabilityId, resolved.tab);
    if (!auth.ok) throw new Error(auth.reason || 'browser-developer-operation-not-authorized');
    const runtime = globalThis.CodeeBrowserDeveloperInspection;
    if (!runtime) throw new Error('browser-developer-inspection-runtime-unavailable');
    if (operation === 'styles') return runtime.styles(normalized, message.ref);
    if (operation === 'react_source') return runtime.reactSource(normalized, message.ref);
    return runtime.evaluate(normalized, message.expression);
}

async function executeBrowserObservability(operation, message = {}) {
    await ensureBrowserRegistered();
    const normalized = normalizeOptionalTabId(message.tabId);
    if (normalized === null) throw new Error('invalid-tab');
    const map = { latest: 'browser.console.latest', errors: 'browser.console.errors', clear: 'browser.console.clear', network: 'browser.network.list', networkErrors: 'browser.network.errors', request: 'browser.network.request', responseBody: 'browser.network.response_body' };
    const capabilityId = map[operation];
    if (!capabilityId) throw new Error('unsupported-browser-observability-operation');
    const resolved = await resolveBrowserPolicyTab(normalized);
    if (!resolved.ok) throw new Error(resolved.reason || 'browser-tab-unavailable');
    const auth = await globalThis.CodeeBrowserHostIntegration.authorizePolicy(capabilityId, resolved.tab);
    if (!auth.ok) throw new Error(auth.reason || 'browser-observability-not-authorized');
    const runtime = globalThis.CodeeBrowserObservability;
    if (!runtime) throw new Error('browser-observability-runtime-unavailable');
    if (operation === 'latest') return runtime.latest(normalized, message.limit);
    if (operation === 'errors') return runtime.errors(normalized, message.limit);
    if (operation === 'network') return runtime.network(normalized, message.limit);
    if (operation === 'networkErrors') return runtime.networkErrors(normalized, message.limit);
    if (operation === 'request') return runtime.request(normalized, message.requestId);
    if (operation === 'responseBody') return runtime.responseBody(normalized, message.requestId, message.maxChars);
    return runtime.clear(normalized);
}

async function getBrowserSnapshot(tabId) {
    await ensureBrowserRegistered();
    const normalized = normalizeOptionalTabId(tabId);
    if (normalized === null) throw new Error('invalid-tab');
    const resolved = await resolveBrowserPolicyTab(normalized);
    if (!resolved.ok) throw new Error(resolved.reason || 'browser-tab-unavailable');
    const auth = await globalThis.CodeeBrowserHostIntegration.authorizePolicy('browser.snapshot', resolved.tab);
    if (!auth.ok) throw new Error(auth.reason || 'browser-snapshot-not-authorized');
    return globalThis.CodeeBrowserPerception.snapshot(normalized);
}

async function ensureTitanZeroRegistered(settingsOverride = null) {
    if (!globalThis.CodeeTitanZeroHostIntegration || !globalThis.CodeeCapabilityRegistry) {
        throw new Error('Titan Zero capability runtime is unavailable');
    }
    const prefs = settingsOverride ? null : await readCodeePreferences();
    const settings = globalThis.CodeeTitanZeroHostIntegration.normalizeSettings(settingsOverride || prefs?.titanZero || {});
    const registration = globalThis.CodeeTitanZeroHostIntegration.register(settings);
    return { settings, registration };
}

async function ensureRepositoryRegistered(settingsOverride = null) {
    if (!globalThis.CodeeRepositoryHostIntegration || !globalThis.CodeeCapabilityRegistry) {
        throw new Error('Repository capability runtime is unavailable');
    }
    const prefs = settingsOverride ? null : await readCodeePreferences();
    const settings = globalThis.CodeeRepositoryHostIntegration.normalizeSettings(settingsOverride || prefs?.repository || {});
    const registration = globalThis.CodeeRepositoryHostIntegration.register(settings);
    return { settings, registration };
}


async function ensureWorkforceRegistered(settingsOverride = null) {
    if (!globalThis.CodeeWorkforceHostIntegration || !globalThis.CodeeCapabilityRegistry) {
        throw new Error('Managers & AI Workforce capability runtime is unavailable');
    }
    const prefs = settingsOverride ? null : await readCodeePreferences();
    const settings = globalThis.CodeeWorkforceHostIntegration.normalizeSettings(settingsOverride || prefs?.workforce || {});
    if (settings.consumeRepositoryPack && globalThis.CodeeRepositoryHostIntegration) {
        await ensureRepositoryRegistered();
    }
    const registration = globalThis.CodeeWorkforceHostIntegration.register(settings);
    return { settings, registration };
}

function sanitizeWorkforcePreflight(preflight) {
    if (!preflight || typeof preflight !== 'object') return null;
    const manager = row => row ? {
        id: String(row.id || '').slice(0, 128),
        name: String(row.name || row.id || '').slice(0, 240),
        role: String(row.role || '').slice(0, 1000),
        score: Number(row.score || 0) || 0
    } : null;
    return {
        enabled: preflight.enabled !== false,
        classification: preflight.classification ? {
            tags: Array.isArray(preflight.classification.tags) ? preflight.classification.tags.slice(0, 30).map(v => String(v).slice(0, 80)) : [],
            confidence: Number(preflight.classification.confidence || 0) || 0
        } : null,
        primary: manager(preflight.primary),
        supporting: Array.isArray(preflight.supporting) ? preflight.supporting.slice(0, 4).map(manager).filter(Boolean) : [],
        requestedCapabilities: Array.isArray(preflight.requestedCapabilities) ? preflight.requestedCapabilities.slice(0, 30).map(v => String(v).slice(0, 200)) : [],
        evidenceRequests: Array.isArray(preflight.evidenceRequests) ? preflight.evidenceRequests.slice(0, 30).map(item => ({
            id: String(item?.id || '').slice(0, 128),
            capability: String(item?.capability || '').slice(0, 200),
            mode: String(item?.mode || '').slice(0, 80)
        })) : [],
        readiness: Array.isArray(preflight.readiness) ? preflight.readiness.slice(0, 5).map(item => ({
            managerId: String(item?.managerId || '').slice(0, 128),
            ready: Boolean(item?.ready),
            missing: Array.isArray(item?.missing) ? item.missing.slice(0, 30).map(v => String(v).slice(0, 200)) : []
        })) : [],
        risk: preflight.risk ? { level: String(preflight.risk.level || 'low').slice(0, 40), approval: Boolean(preflight.risk.approval) } : { level: 'low', approval: false },
        evidenceRequired: preflight.evidenceRequired !== false,
        handoffs: Array.isArray(preflight.handoffs) ? preflight.handoffs.slice(0, 12).map(item => ({
            from: String(item?.from || '').slice(0, 128), to: String(item?.to || '').slice(0, 128),
            task: String(item?.task || '').slice(0, 1000)
        })) : [],
        authority: { advancePlan: false, directMutation: false, createPlanDraftOnly: true }
    };
}

async function prepareWorkforcePreflight(input = {}, settingsOverride = null) {
    const ready = await ensureWorkforceRegistered(settingsOverride);
    const raw = globalThis.CodeeWorkforceHostIntegration.prepare(input || {}, ready.settings);
    const preflight = sanitizeWorkforcePreflight(raw);
    const context = globalThis.CodeeWorkforceHostIntegration.buildContext(preflight, ready.settings.maxContextChars);
    return { preflight, context, settings: ready.settings };
}

async function prepareWorkforceForPlanState(planState) {
    if (!planState || !Array.isArray(planState.plan) || !planState.plan.length) return planState;
    const ready = await ensureWorkforceRegistered();
    if (!ready.settings.enabled) {
        delete planState.workforcePreflight;
        delete planState.workforceContext;
        delete planState.workforcePreflightStepIndex;
        return planState;
    }
    const combinedPlanText = planState.plan
        .slice(0, 1000)
        .map((step, index) => `Step ${index + 1}: ${String(step?.text || '')}`)
        .join('\n')
        .slice(0, 12000);
    const prepared = await prepareWorkforcePreflight({
        text: combinedPlanText,
        task: combinedPlanText,
        runId: planState.runId || null,
        planId: planState.planId || null,
        stepId: 'plan-preflight'
    }, ready.settings);
    planState.workforcePreflight = prepared.preflight;
    planState.workforceContext = prepared.context;
    // Workforce preflight is plan-level advisory context. It must not mutate
    // Codee's critical per-step dispatch transaction or plan-advance authority.
    planState.workforcePreflightStepIndex = -1;
    return planState;
}

async function createWorkforcePlanDraft(input = {}) {
    const ready = await ensureWorkforceRegistered();
    return globalThis.CodeeWorkforceHostIntegration.makePlanDraft(input || {}, ready.settings);
}

async function callWorkforceCapability(capability, payload = {}) {
    const ready = await ensureWorkforceRegistered();
    return globalThis.CodeeWorkforceHostIntegration.callCapability(capability, payload || {}, ready.settings);
}

async function executeWorkforceToolRequest(request = {}) {
    const ready = await ensureWorkforceRegistered();
    return globalThis.CodeeWorkforceHostIntegration.executeToolRequest(request || {}, ready.settings);
}

async function requestWorkforceGovernedMutation(request = {}) {
    const ready = await ensureWorkforceRegistered();
    return globalThis.CodeeWorkforceHostIntegration.routeGovernedMutation(request || {}, ready.settings);
}

async function invalidateWorkforceDerivedState() {
    await mutatePlanState(state => {
        for (const [key, rawPlan] of Object.entries(state)) {
            if (!key.startsWith('plan_') || !rawPlan || typeof rawPlan !== 'object' || isFuturePlanState(rawPlan)) continue;
            const hasWorkforce = Object.prototype.hasOwnProperty.call(rawPlan, 'workforcePreflight')
                || Object.prototype.hasOwnProperty.call(rawPlan, 'workforceContext')
                || Object.prototype.hasOwnProperty.call(rawPlan, 'workforcePreflightStepIndex');
            if (!hasWorkforce) continue;
            delete rawPlan.workforcePreflight;
            delete rawPlan.workforceContext;
            delete rawPlan.workforcePreflightStepIndex;
            rawPlan.stateRevision = (Number(rawPlan.stateRevision) || 0) + 1;
            state[key] = rawPlan;
        }
    });
}

async function updateWorkforceSettings(nextSettings) {
    if (!globalThis.CodeeWorkforceHostIntegration) throw new Error('Managers & AI Workforce capability runtime is unavailable');
    const normalized = globalThis.CodeeWorkforceHostIntegration.normalizeSettings(nextSettings);
    let changed = false;
    await mutateCodeePreferences(prefs => {
        const previous = globalThis.CodeeWorkforceHostIntegration.normalizeSettings(prefs?.workforce || {});
        changed = JSON.stringify(previous) !== JSON.stringify(normalized);
        return { ...prefs, workforce: normalized };
    });
    await ensureWorkforceRegistered(normalized);
    if (changed) await invalidateWorkforceDerivedState();
    return normalized;
}

async function getWorkforceStatus() {
    const ready = await ensureWorkforceRegistered();
    const status = globalThis.CodeeWorkforceHostIntegration.statusPayload(ready.settings);
    const state = await getPlanState();
    const recent = Object.entries(state)
        .filter(([key, value]) => key.startsWith('plan_') && value && typeof value === 'object' && !isFuturePlanState(value) && value.workforcePreflight)
        .map(([key, value]) => ({
            tabId: Number(key.slice(5)),
            planId: value.planId || '',
            step: Number(value.stepIndex || 0) + 1,
            primary: value.workforcePreflight?.primary?.name || value.workforcePreflight?.primary?.id || '',
            supporting: (value.workforcePreflight?.supporting || []).map(row => row.name || row.id).filter(Boolean),
            tags: value.workforcePreflight?.classification?.tags || [],
            dispatchStatus: value.dispatchStatus || ''
        }))
        .slice(-12);
    return { ...status, recentRouting: recent };
}

function attachWorkforceContext(basePrompt, contextText) {
    const context = String(contextText || '').trim();
    if (!context) return basePrompt;
    return `${basePrompt}\n\n${context}`;
}

async function getNavigationStatus(availableViews) {
    if (!globalThis.CodeeNavigationRegistry || !globalThis.CodeeNavigationReadiness) throw new Error('Codee navigation runtime is unavailable');
    globalThis.CodeeNavigationRegistry.installDefaults();
    const views = Array.isArray(availableViews) && availableViews.length ? availableViews : CURRENT_NAVIGATION_VIEWS;
    const validation = globalThis.CodeeNavigationRegistry.validate({ availableViews: views });
    const capabilitySnapshot = globalThis.CodeeCapabilityRegistry?.snapshot?.() || {};
    const capabilities = [
        ...(capabilitySnapshot.capabilities || []),
        ...(capabilitySnapshot.repositoryCapabilities || [])
    ].map(item => String(item?.id || '')).filter(Boolean);
    let browserImplemented = false;
    try { browserImplemented = Number(globalThis.CodeeBrowserHostIntegration?.statusPayload?.()?.implemented || 0) > 0; } catch {}
    const entries = globalThis.CodeeNavigationReadiness.resolveAll(globalThis.CodeeNavigationRegistry.list(), {
        availableViews: views,
        capabilities,
        dependencies: { 'browser.execution': browserImplemented },
        featureFlags: {}
    });
    const safeEntries = validation.ok ? entries : entries.filter(item => item.id === 'group.workspace' || item.id === 'workspace.runner');
    return {
        ready: validation.ok,
        fallback: !validation.ok,
        validation,
        entries: safeEntries,
        browser: { state: entries.find(item => item.id === 'intelligence.browser')?.resolved?.state || 'CONTRACT_ONLY' }
    };
}

const CONNECTION_PROBE_TIMEOUT_MS = 5000;
const CONNECTION_REGISTRY_CACHE_TTL_MS = 30000;
let connectionRegistryCache = null;

function normalizeConnectionProbeCode(value) {
    const text = String(value || '').toUpperCase();
    if (/AUTH|UNAUTHORIZED|FORBIDDEN|\b401\b|\b403\b/.test(text)) return 'AUTH_FAILED';
    if (/RATE|TOO MANY|\b429\b/.test(text)) return 'RATE_LIMITED';
    if (/DISABLED|RETIRED/.test(text)) return 'DISABLED';
    if (/TIMEOUT|NETWORK|OFFLINE|UNAVAILABLE|ECONN|FETCH/.test(text)) return 'UNAVAILABLE';
    if (/MISSING|NOT FOUND|NOT_FOUND/.test(text)) return 'MISSING';
    return 'DEGRADED';
}

async function boundedConnectionProbe(run, timeoutMs = CONNECTION_PROBE_TIMEOUT_MS) {
    let timer = null;
    try {
        const value = await Promise.race([
            Promise.resolve().then(run),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('connection-probe-timeout')), timeoutMs); })
        ]);
        const state = String(value?.state || value?.status || '').toUpperCase();
        const ok = value === true || value?.ok === true || value?.healthy === true || ['CONNECTED','READY','HEALTHY','OK'].includes(state);
        return { ok, code: ok ? 'CONNECTED' : normalizeConnectionProbeCode(value?.code || value?.reason || value?.error || state || 'DEGRADED'), checkedAt: new Date().toISOString() };
    } catch (error) {
        return { ok: false, code: normalizeConnectionProbeCode(error?.code || error?.message || error), checkedAt: new Date().toISOString() };
    } finally {
        if (timer !== null) clearTimeout(timer);
    }
}

async function probeAIProviderConnection(adapter) {
    const lifecycle = String(adapter?.lifecycle || 'ACTIVE').toUpperCase();
    if (lifecycle === 'RETIRED' || lifecycle === 'DISABLED') return null;
    if (lifecycle === 'TEMPORARILY_UNAVAILABLE') return { ok: false, code: 'UNAVAILABLE', checkedAt: new Date().toISOString() };
    if (typeof adapter?.health !== 'function') return { ok: false, code: 'DEGRADED', checkedAt: new Date().toISOString() };
    return boundedConnectionProbe(() => adapter.health?.());
}

async function probeMcpConnection(connection) {
    if (connection?.enabled === false) return null;
    if (!globalThis.CodeeMcpRuntime || typeof globalThis.CodeeMcpRuntime.health !== 'function') return { ok: false, code: 'MISSING', checkedAt: new Date().toISOString() };
    return boundedConnectionProbe(() => globalThis.CodeeMcpRuntime.health(connection.id));
}

async function probeHostConnection(host) {
    if (!host || typeof host !== 'object') return null;
    if (typeof host.health === 'function') return boundedConnectionProbe(() => host.health?.());
    return null;
}

function latestArtifactVerificationEvidence(planState) {
    let newest = null;
    let score = 0;
    for (const [key, plan] of Object.entries(planState || {})) {
        if (!key.startsWith('plan_') || !plan || typeof plan !== 'object' || isFuturePlanState(plan)) continue;
        for (const artifact of Array.isArray(plan.artifactHistory) ? plan.artifactHistory : []) {
            const receipt = artifact?.verificationReceipt;
            if (!receipt || !(receipt.receiptId || receipt.id || receipt.verificationReceiptId) || String(receipt.zipIntegrity || '').toUpperCase() !== 'PASS') continue;
            const checkedAt = String(receipt.verifiedAt || artifact.createdAt || '');
            const parsed = Date.parse(checkedAt);
            if (!Number.isFinite(parsed) || parsed <= score) continue;
            score = parsed;
            newest = { verified: true, checkedAt };
        }
    }
    return newest;
}

async function getConnectionRegistryPayload(options = {}) {
    if (!globalThis.CodeeConnectionRegistry) throw new Error('Codee connection registry runtime is unavailable');
    const now = Date.now();
    if (!options.force && connectionRegistryCache && now - connectionRegistryCache.at < CONNECTION_REGISTRY_CACHE_TTL_MS) return connectionRegistryCache.value;

    await Promise.all([
        ensureOnboardAIRegistered().catch(() => null),
        ensureBrowserRegistered().catch(() => null)
    ]);
    const providers = globalThis.CodeeAIProviderRegistry?.list?.() || [];
    const providerRows = await Promise.all(providers.map(async adapter => ({
        id: String(adapter?.id || '').slice(0, 160),
        displayName: String(adapter?.displayName || adapter?.id || '').slice(0, 160),
        lifecycle: String(adapter?.lifecycle || 'ACTIVE').slice(0, 80),
        probe: await probeAIProviderConnection(adapter)
    })));

    const mcpConnections = await (globalThis.CodeeMcpRuntime?.listConnections?.() || Promise.resolve([])).catch(() => []);
    const mcpRows = await Promise.all((Array.isArray(mcpConnections) ? mcpConnections : []).map(async connection => ({
        id: String(connection?.id || '').slice(0, 160),
        name: String(connection?.name || '').slice(0, 160),
        enabled: connection?.enabled !== false,
        probe: await probeMcpConnection(connection)
    })));

    const planState = await getPlanState().catch(() => ({}));
    const repositoryHost = globalThis.CodeeRepositoryHost || null;
    const explicitArtifactHost = globalThis.CodeeArtifactVerificationHost || null;
    const artifactHost = explicitArtifactHost
        || (globalThis.CodeeRepositoryHost && typeof globalThis.CodeeRepositoryHost.verifyArtifact === 'function' ? globalThis.CodeeRepositoryHost : null);
    const browserStatus = await getBrowserStatus().catch(() => ({ registered: false, executionEnabled: false }));
    const [repositoryProbe, artifactProbe] = await Promise.all([
        probeHostConnection(repositoryHost),
        probeHostConnection(artifactHost)
    ]);
    const artifactEvidence = latestArtifactVerificationEvidence(planState);

    const registry = globalThis.CodeeConnectionRegistry.build({
        generatedAt: new Date().toISOString(),
        aiProviders: providerRows,
        mcp: { runtimeInstalled: Boolean(globalThis.CodeeMcpRuntime), connections: mcpRows },
        repositoryHost: { detected: Boolean(repositoryHost), probe: repositoryProbe },
        artifactHost: { detected: Boolean(artifactHost), probe: artifactProbe, evidence: artifactEvidence },
        browser: {
            registered: browserStatus.registered === true,
            executionEnabled: browserStatus.executionEnabled === true,
            reason: browserStatus.executionEnabled === true ? '' : 'browser-execution-not-enabled',
            probe: browserStatus.executionEnabled === true ? (browserStatus.probe || null) : null
        }
    });
    const safeProviders = Object.freeze(providerRows.map(row => Object.freeze({
        id: String(row.id || '').slice(0,160),
        displayName: String(row.displayName || row.id || '').slice(0,160),
        lifecycle: String(row.lifecycle || 'ACTIVE').slice(0,80),
        transport: String(providers.find(adapter => String(adapter?.id || '') === String(row.id || ''))?.transport || '').slice(0,80),
        state: row.probe?.ok === true ? 'CONNECTED' : String(row.probe?.code || 'DEGRADED').slice(0,80),
        lastCheckedAt: String(row.probe?.checkedAt || '').slice(0,80),
        reason: row.probe?.ok === true ? '' : String(row.probe?.code || '').slice(0,160)
    })));
    const value = { registry, providers: safeProviders };
    connectionRegistryCache = { at: now, value };
    return value;
}

async function getConnectionWorkspacePayload(options = {}) {
    if (!globalThis.CodeeConnectionsWorkspace) throw new Error('Codee connections workspace runtime is unavailable');
    const payload = await getConnectionRegistryPayload(options);
    return globalThis.CodeeConnectionsWorkspace.build({
        generatedAt: payload.registry?.generatedAt || new Date().toISOString(),
        registry: payload.registry,
        providers: payload.providers || []
    });
}

async function getDashboardStatus() {
    if (!globalThis.CodeeDashboardStatus) throw new Error('Codee dashboard status runtime is unavailable');
    const safe = async (fn, fallback = {}) => {
        try { return await fn(); }
        catch (error) { return { ...fallback, error: String(error?.message || error).slice(0, 1000) }; }
    };
    const [ai, browser, repository, titanZero, workforce, planState, events, mcpConnections, approvals, receipts, connectionPayload] = await Promise.all([
        safe(() => getAIGatewayStatus(), { gatewayInstalled: false, inferenceReady: false }),
        safe(() => getBrowserStatus(), { registered: false, executionEnabled: false }),
        safe(() => getRepositoryStatus(), { registered: false, hostBridge: 'not-installed' }),
        safe(() => getTitanZeroStatus(), { registered: false }),
        safe(() => getWorkforceStatus(), { registered: false }),
        safe(() => getPlanState(), {}),
        safe(() => readDiagnosticEvents(), []),
        safe(() => globalThis.CodeeMcpRuntime?.listConnections?.() || Promise.resolve([]), []),
        safe(() => globalThis.CodeeMcpRuntime?.listPendingApprovals?.() || Promise.resolve([]), []),
        safe(() => globalThis.CodeeMcpRuntime?.listMutationReceipts?.() || Promise.resolve([]), []),
        safe(() => getConnectionRegistryPayload(), { registry: { rows: [], summary: {} } })
    ]);
    const plans = Object.entries(planState || {})
        .filter(([key, value]) => key.startsWith('plan_') && value && typeof value === 'object' && !isFuturePlanState(value))
        .map(([key, value]) => ({ ...value, dashboardTabId: Number(key.slice(5)) }));
    const diagnosticRows = Array.isArray(events) ? events : [];
    const diagnostics = {
        warnings: diagnosticRows.filter(item => ['warning', 'warn'].includes(String(item?.level || item?.severity || '').toLowerCase())).length,
        failures: diagnosticRows.filter(item => ['error', 'fail', 'failed'].includes(String(item?.level || item?.severity || '').toLowerCase())).length
    };
    return globalThis.CodeeDashboardStatus.build({
        generatedAt: new Date().toISOString(), plans, ai, browser, repository, titanZero, workforce,
        mcp: { runtimeInstalled: Boolean(globalThis.CodeeMcpRuntime), connections: mcpConnections, pendingApprovals: approvals, receipts },
        connections: connectionPayload?.registry || { rows: [], summary: {} }, diagnostics
    });
}

async function getCapabilityRegistryPayload() {
    const ai = await ensureOnboardAIRegistered();
    const browser = await ensureBrowserRegistered();
    const titan = await ensureTitanZeroRegistered();
    const repository = await ensureRepositoryRegistered();
    const workforce = await ensureWorkforceRegistered();
    const registry = globalThis.CodeeCapabilityRegistry.snapshot();
    const [repositoryStatus, mcpConnections] = await Promise.all([
        getRepositoryStatus().catch(() => ({ registered: Boolean(repository.registration), settings: repository.settings, hostBridge: 'not-installed' })),
        (globalThis.CodeeMcpRuntime?.listConnections?.() || Promise.resolve([])).catch(() => [])
    ]);
    const aiStatus = globalThis.CodeeOnboardAIHostIntegration?.status?.() || { gatewayInstalled: false, inferenceReady: false };
    const browserStatus = globalThis.CodeeBrowserHostIntegration?.statusPayload?.() || { registered: false, executionEnabled: false };
    const workforceStatus = globalThis.CodeeWorkforceHostIntegration?.statusPayload?.(workforce.settings) || { registered: false, settings: workforce.settings };
    const capabilityView = globalThis.CodeeCapabilityStatus.build({
        registry,
        ai: aiStatus,
        browser: browserStatus,
        repository: repositoryStatus,
        workforce: workforceStatus,
        mcp: { runtimeInstalled: Boolean(globalThis.CodeeMcpRuntime), connections: Array.isArray(mcpConnections) ? mcpConnections.length : 0 }
    });
    return {
        registry,
        capabilityView,
        onboardAI: ai.registration,
        browser: browser.registration,
        titanZeroSettings: titan.settings,
        repositorySettings: repository.settings,
        workforceSettings: workforce.settings
    };
}

async function invalidateTitanZeroDerivedState() {
    await mutateTitanZeroAnalysisCache(current => {
        for (const key of Object.keys(current)) delete current[key];
    });
    await mutatePlanState(state => {
        for (const [key, rawPlan] of Object.entries(state)) {
            if (!key.startsWith('plan_') || !rawPlan || typeof rawPlan !== 'object' || isFuturePlanState(rawPlan)) continue;
            if (!Object.prototype.hasOwnProperty.call(rawPlan, 'titanZeroContext')
                && !Object.prototype.hasOwnProperty.call(rawPlan, 'titanZeroPreflight')) continue;
            delete rawPlan.titanZeroContext;
            delete rawPlan.titanZeroPreflight;
            rawPlan.stateRevision = (Number(rawPlan.stateRevision) || 0) + 1;
            state[key] = rawPlan;
        }
    });
}

async function updateTitanZeroSettings(nextSettings) {
    if (!globalThis.CodeeTitanZeroHostIntegration) throw new Error('Titan Zero capability runtime is unavailable');
    const normalized = globalThis.CodeeTitanZeroHostIntegration.normalizeSettings(nextSettings);
    let changed = false;
    await mutateCodeePreferences(prefs => {
        const previous = globalThis.CodeeTitanZeroHostIntegration.normalizeSettings(prefs?.titanZero || {});
        changed = JSON.stringify(previous) !== JSON.stringify(normalized);
        return { ...prefs, titanZero: normalized };
    });
    await ensureTitanZeroRegistered(normalized);
    if (changed) await invalidateTitanZeroDerivedState();
    return normalized;
}

async function mutateTitanZeroAnalysisCache(mutator) {
    const operation = titanAnalysisMutationQueue.then(async () => {
        const stored = await chrome.storage.local.get([TITAN_ZERO_ANALYSIS_STORAGE_KEY]);
        const current = stored?.[TITAN_ZERO_ANALYSIS_STORAGE_KEY] && typeof stored[TITAN_ZERO_ANALYSIS_STORAGE_KEY] === 'object'
            ? { ...stored[TITAN_ZERO_ANALYSIS_STORAGE_KEY] }
            : {};
        const result = await mutator(current);
        const bounded = pruneTitanZeroAnalysisCache(current);
        await chrome.storage.local.set({ [TITAN_ZERO_ANALYSIS_STORAGE_KEY]: bounded });
        return result === undefined ? bounded : result;
    });
    titanAnalysisMutationQueue = operation.catch(() => {});
    return operation;
}

function pruneTitanZeroAnalysisCache(value) {
    const input = value && typeof value === 'object' ? value : {};
    const output = {};
    if (input.latest && typeof input.latest === 'object') output.latest = input.latest;
    const tabEntries = Object.entries(input)
        .filter(([key, item]) => key.startsWith('tab_') && item && typeof item === 'object')
        .sort(([, a], [, b]) => {
            const aTime = Date.parse(String(a?.analyzedAt || '')) || 0;
            const bTime = Date.parse(String(b?.analyzedAt || '')) || 0;
            return bTime - aTime;
        })
        .slice(0, MAX_TITAN_ZERO_ANALYSIS_TABS);
    for (const [key, item] of tabEntries) output[key] = item;
    return output;
}

function sanitizeTitanAnalysisForStorage(analysis) {
    if (!analysis?.safeSummary) return null;
    const summary = JSON.parse(JSON.stringify(analysis.safeSummary));
    if (summary && typeof summary === 'object') {
        summary.context = String(summary.context || '').slice(0, 50000);
    }
    return summary;
}

async function analyzeTitanZeroSnapshot(snapshot, options = {}) {
    const ready = await ensureTitanZeroRegistered();
    const analysis = globalThis.CodeeTitanZeroHostIntegration.analyze(snapshot, ready.settings, options);
    const safeSummary = sanitizeTitanAnalysisForStorage(analysis);
    if (safeSummary) {
        const key = Number.isInteger(options.tabId) ? `tab_${options.tabId}` : 'latest';
        await mutateTitanZeroAnalysisCache(current => {
            current[key] = safeSummary;
            current.latest = safeSummary;
        });
        if (Number.isInteger(options.tabId) && safeSummary.context) {
            await attachTitanZeroContextToSavedPlan(options.tabId, safeSummary.context, safeSummary.impact, safeSummary.testMatrix).catch(() => {});
        }
    }
    return {
        enabled: analysis.enabled,
        context: analysis.context || '',
        selected: analysis.selected || { nodes: [], edges: [] },
        impact: analysis.impact || { domains: [], recommendations: [] },
        testMatrix: analysis.testMatrix || { commands: [], requiredCount: 0 },
        safeSummary,
        report: analysis.report || null
    };
}

const MANAGER_AI_WATCH_ALARM='MANAGER_AI_WATCH';
async function ensureManagerAIWatchAlarm(){if(typeof chrome.alarms?.get!=='function'){chrome.alarms?.create?.(MANAGER_AI_WATCH_ALARM,{periodInMinutes:1});return;}const existing=await chrome.alarms.get(MANAGER_AI_WATCH_ALARM);if(!existing)await chrome.alarms.create(MANAGER_AI_WATCH_ALARM,{periodInMinutes:1});}
const MANAGER_AI_SNAPSHOT_STORAGE_KEY='titanCodeManagerAISnapshot';
const MANAGER_AI_LAST_STORAGE_KEY='titanCodeManagerAILast';
const MANAGER_AI_LIVE_STORAGE_KEY='titanCodeManagerAILiveState';
async function getManagerAISnapshot(){const stored=await chrome.storage.local.get([MANAGER_AI_SNAPSHOT_STORAGE_KEY]);return stored?.[MANAGER_AI_SNAPSHOT_STORAGE_KEY]||{schema:'titan-code.manager-snapshot.v1',agents:{},packets:[],claims:[],deltas:[],findings:[]};}
async function setManagerAISnapshot(snapshot){const normalized=snapshot&&typeof snapshot==='object'?snapshot:{agents:{},packets:[],claims:[],deltas:[],findings:[]};await chrome.storage.local.set({[MANAGER_AI_SNAPSHOT_STORAGE_KEY]:normalized});return normalized;}
async function fetchLiveManagerAISnapshot(){
    const settings=await getSystemIntegrationSettings();
    if(!settings.bridgeEnabled||!settings.bridgeToken||!globalThis.CodeeTitanBridgeClient) return {ok:false,source:'local',reason:'live-mesh-bridge-not-configured',snapshot:await getManagerAISnapshot()};
    const config={enabled:settings.bridgeEnabled,endpoint:settings.bridgeEndpoint,token:settings.bridgeToken,workspace:settings.bridgeWorkspace};
    const [snapshot,health,capabilities]=await Promise.all([
        globalThis.CodeeTitanBridgeClient.call(config,'agent_mesh.snapshot',{}),
        globalThis.CodeeTitanBridgeClient.call(config,'agent_mesh.health',{}),
        globalThis.CodeeTitanBridgeClient.call(config,'agent_mesh.capabilities',{})
    ]);
    if(!snapshot.ok) return {ok:false,source:'local',reason:snapshot.reason||'live-mesh-snapshot-failed',health:health.ok?health.result:null,capabilities:capabilities.ok?capabilities.result:null,snapshot:await getManagerAISnapshot()};
    const value=snapshot.result&&typeof snapshot.result==='object'?snapshot.result:{};
    const normalized={schema:'titan-code.manager-snapshot.v2',...value,live:true,health:health.ok?health.result:null,capabilities:capabilities.ok?capabilities.result:null,fetchedAt:new Date().toISOString()};
    await chrome.storage.local.set({[MANAGER_AI_SNAPSHOT_STORAGE_KEY]:normalized,[MANAGER_AI_LIVE_STORAGE_KEY]:{ok:true,fetchedAt:normalized.fetchedAt,health:normalized.health,capabilities:normalized.capabilities}});
    return {ok:true,source:'live',snapshot:normalized,health:normalized.health,capabilities:normalized.capabilities};
}
async function managerAIWatchSweep(){try{const live=await fetchLiveManagerAISnapshot();const snapshot=live.snapshot||await getManagerAISnapshot();const inspection=globalThis.TitanCodeManagerAISupervisor.inspect(snapshot);const plan=globalThis.TitanCodeManagerAISupervisor.deterministicPlan(inspection);await chrome.storage.local.set({[MANAGER_AI_LAST_STORAGE_KEY]:{schema:'titan-code.manager-ai-watch.v2',generatedAt:new Date().toISOString(),inspection,deterministicPlan:plan,watchdog:true,source:live.source,bridgeReason:live.reason||null,health:live.health||null}});}catch(error){console.warn('[Codee] Manager AI watchdog failed:',error);}}
async function runStoredManagerAISupervision(options={}){const live=await fetchLiveManagerAISnapshot();const snapshot=live.snapshot||await getManagerAISnapshot();const result=await globalThis.TitanCodeManagerAISupervisor.advise(snapshot,options);await chrome.storage.local.set({[MANAGER_AI_LAST_STORAGE_KEY]:{...result,source:live.source,bridgeReason:live.reason||null,health:live.health||null}});return {...result,source:live.source,bridgeReason:live.reason||null,health:live.health||null};}
async function executeManagerAIPlan(options={}){
    const live=await fetchLiveManagerAISnapshot();
    const snapshot=live.snapshot||await getManagerAISnapshot();
    const inspection=globalThis.TitanCodeManagerAISupervisor.inspect(snapshot);
    const plan=globalThis.TitanCodeManagerAISupervisor.deterministicPlan(inspection);
    const executed=[]; const skipped=[];
    const settings=await getSystemIntegrationSettings();
    const config={enabled:settings.bridgeEnabled,endpoint:settings.bridgeEndpoint,token:settings.bridgeToken,workspace:settings.bridgeWorkspace};
    for(const step of plan.steps||[]){
        const target=String(step.target||'');
        let action=null,payload={};
        if(step.action==='CHECK_HEARTBEAT_AND_RECOVER') { action='agent_mesh.recover_agent'; payload={agent_id:target,mode:'manager_recovery_request'}; }
        else if(step.action==='RECHECK_DEPENDENCIES_OR_ROUTE_PACKET') { action='agent_mesh.route_packet'; payload={packet_id:target,mode:'manager_route_request'}; }
        else { skipped.push({step,reason:'advisory-only-step'}); continue; }
        if(!settings.bridgeEnabled||!settings.bridgeToken||!globalThis.CodeeTitanBridgeClient){ skipped.push({step,reason:'live-mesh-bridge-not-configured'}); continue; }
        const result=await globalThis.CodeeTitanBridgeClient.call(config,action,payload);
        if(result.ok) executed.push({step,action,result}); else skipped.push({step,action,reason:result.reason||'manager-action-failed'});
    }
    const out={schema:'titan-code.manager-ai-execution.v1',generatedAt:new Date().toISOString(),source:live.source,inspection,plan,executed,skipped,authority:{ai:false,managerRules:true,canonicalPromotion:false,delete:false}};
    await chrome.storage.local.set({[MANAGER_AI_LAST_STORAGE_KEY]:out});
    return out;
}

async function getTitanZeroStatus() {
    const ready = await ensureTitanZeroRegistered();
    await titanAnalysisMutationQueue;
    const stored = await chrome.storage.local.get([TITAN_ZERO_ANALYSIS_STORAGE_KEY]);
    const payload = globalThis.CodeeTitanZeroHostIntegration.registryPayload();
    return {
        registered: Boolean(payload.pack),
        pack: payload.pack,
        counts: {
            prompts: payload.prompts.length,
            skills: payload.skills.length,
            profiles: payload.profiles.length,
            contextProviders: payload.contextProviders.length
        },
        settings: ready.settings,
        latestAnalysis: stored?.[TITAN_ZERO_ANALYSIS_STORAGE_KEY]?.latest || null,
        repositoryBridge: globalThis.CodeeRepositoryHostIntegration ? 'integrated' : 'not-installed',
        authority: payload.pack?.authority || null
    };
}

async function attachTitanZeroContextToSavedPlan(tabId, context, impact = null, testMatrix = null) {
    const text = String(context || '').trim();
    if (!text) return { ok: true, attached: false };
    return mutatePlanState(state => {
        const key = `plan_${tabId}`;
        const current = state[key];
        if (!current || isFuturePlanState(current)) return { ok: true, attached: false };
        const nextContext = text.slice(0, 50000);
        const nextImpact = impact || null;
        const nextTestMatrix = testMatrix || null;
        const previousPreflight = current.titanZeroPreflight || {};
        const unchanged = current.titanZeroContext === nextContext
            && JSON.stringify(previousPreflight.impact ?? null) === JSON.stringify(nextImpact)
            && JSON.stringify(previousPreflight.testMatrix ?? null) === JSON.stringify(nextTestMatrix);
        if (unchanged) return { ok: true, attached: false, unchanged: true };
        current.titanZeroContext = nextContext;
        current.titanZeroPreflight = {
            impact: nextImpact,
            testMatrix: nextTestMatrix,
            attachedAt: new Date().toISOString()
        };
        current.stateRevision = (Number(current.stateRevision) || 0) + 1;
        state[key] = current;
        return { ok: true, attached: true };
    });
}

function attachTitanZeroContext(basePrompt, contextText) {
    const base = String(basePrompt || '');
    const context = String(contextText || '').trim();
    if (!context) return base;
    return `${base}\n\nTITAN ZERO HOST CONTEXT — READ-ONLY EVIDENCE\n${context}`;
}


async function invalidateRepositoryDerivedState() {
    await mutateRepositoryAnalysisCache(current => {
        for (const key of Object.keys(current)) delete current[key];
    });
    await mutatePlanState(state => {
        for (const [key, rawPlan] of Object.entries(state)) {
            if (!key.startsWith('plan_') || !rawPlan || typeof rawPlan !== 'object' || isFuturePlanState(rawPlan)) continue;
            if (!Object.prototype.hasOwnProperty.call(rawPlan, 'repositoryContext')
                && !Object.prototype.hasOwnProperty.call(rawPlan, 'repositoryPreflight')) continue;
            delete rawPlan.repositoryContext;
            delete rawPlan.repositoryPreflight;
            rawPlan.stateRevision = (Number(rawPlan.stateRevision) || 0) + 1;
            state[key] = rawPlan;
        }
    });
}

async function updateRepositorySettings(nextSettings) {
    if (!globalThis.CodeeRepositoryHostIntegration) throw new Error('Repository capability runtime is unavailable');
    const normalized = globalThis.CodeeRepositoryHostIntegration.normalizeSettings(nextSettings);
    let changed = false;
    await mutateCodeePreferences(prefs => {
        const previous = globalThis.CodeeRepositoryHostIntegration.normalizeSettings(prefs?.repository || {});
        changed = JSON.stringify(previous) !== JSON.stringify(normalized);
        return { ...prefs, repository: normalized };
    });
    await ensureRepositoryRegistered(normalized);
    if (changed) await invalidateRepositoryDerivedState();
    return normalized;
}

async function mutateRepositoryAnalysisCache(mutator) {
    const operation = repositoryAnalysisMutationQueue.then(async () => {
        const stored = await chrome.storage.local.get([REPOSITORY_ANALYSIS_STORAGE_KEY]);
        const current = stored?.[REPOSITORY_ANALYSIS_STORAGE_KEY] && typeof stored[REPOSITORY_ANALYSIS_STORAGE_KEY] === 'object'
            ? { ...stored[REPOSITORY_ANALYSIS_STORAGE_KEY] }
            : {};
        const result = await mutator(current);
        const output = {};
        if (current.latest && typeof current.latest === 'object') output.latest = current.latest;
        const tabs = Object.entries(current).filter(([key,item]) => key.startsWith('tab_') && item && typeof item === 'object')
            .sort(([,a],[,b]) => (Date.parse(String(b?.analyzedAt||''))||0) - (Date.parse(String(a?.analyzedAt||''))||0))
            .slice(0, MAX_REPOSITORY_ANALYSIS_TABS);
        for (const [key,item] of tabs) output[key] = item;
        await chrome.storage.local.set({ [REPOSITORY_ANALYSIS_STORAGE_KEY]: output });
        return result === undefined ? output : result;
    });
    repositoryAnalysisMutationQueue = operation.catch(() => {});
    return operation;
}

function sanitizeRepositoryAnalysisForStorage(analysis) {
    if (!analysis?.safeSummary) return null;
    const summary = JSON.parse(JSON.stringify(analysis.safeSummary));
    summary.context = String(summary.context || '').slice(0, 50000);
    return summary;
}

async function analyzeRepositorySnapshot(snapshot, options = {}) {
    const ready = await ensureRepositoryRegistered();
    const analysis = globalThis.CodeeRepositoryHostIntegration.analyze(snapshot, ready.settings, options);
    const safeSummary = sanitizeRepositoryAnalysisForStorage(analysis);
    if (safeSummary) {
        const key = Number.isInteger(options.tabId) ? `tab_${options.tabId}` : 'latest';
        await mutateRepositoryAnalysisCache(current => {
            current[key] = safeSummary;
            current.latest = safeSummary;
        });
        if (Number.isInteger(options.tabId) && safeSummary.context) {
            await attachRepositoryContextToSavedPlan(options.tabId, safeSummary.context, {
                impact: analysis.analysis?.impact || null,
                verification: analysis.analysis?.verification || null,
                targetedTests: analysis.analysis?.tests || null
            }).catch(() => {});
        }
    }
    return {
        enabled: analysis.enabled,
        context: analysis.context || '',
        safeSummary,
        analysis: analysis.analysis || null,
        authority: analysis.authority || { mayAdvancePlan: false }
    };
}

async function callRepositoryCapability(capability, payload) {
    const ready = await ensureRepositoryRegistered();
    return globalThis.CodeeRepositoryHostIntegration.callCapability(capability, payload || {}, ready.settings);
}

async function getRepositoryStatus() {
    const ready = await ensureRepositoryRegistered();
    await repositoryAnalysisMutationQueue;
    const stored = await chrome.storage.local.get([REPOSITORY_ANALYSIS_STORAGE_KEY]);
    const payload = globalThis.CodeeRepositoryHostIntegration.registryPayload();
    const host = globalThis.CodeeRepositoryHost || null;
    const mcpAdapter = globalThis.CodeeRepositoryHostIntegration.getMcpAdapter();
    return {
        registered: Boolean(payload.pack),
        pack: payload.pack,
        counts: {
            capabilities: payload.repositoryCapabilities.length,
            prompts: payload.prompts.filter(item => item.category === 'Repository & Coding Intelligence').length,
            skills: payload.skills.filter(item => item.category === 'Repository & Coding Intelligence').length,
            profiles: payload.profiles.filter(item => item.category === 'Repository & Coding Intelligence').length,
            contextProviders: payload.contextProviders.filter(item => String(item.id || '').startsWith('repository-')).length
        },
        settings: ready.settings,
        latestAnalysis: stored?.[REPOSITORY_ANALYSIS_STORAGE_KEY]?.latest || null,
        hostBridge: host ? 'detected' : 'not-installed',
        hostCapabilities: globalThis.CodeeHostCapabilities?.describe?.(host || {}) || null,
        backupPolicy: {
            required: true,
            createBackup: typeof host?.createBackup === 'function',
            verifyBackup: typeof host?.verifyBackup === 'function',
            verifyMutation: typeof host?.verifyMutation === 'function',
            auditMutation: typeof host?.auditMutation === 'function'
        },
        mcp: { runtimeDetected: Boolean(mcpAdapter), transportOwnedByRepositoryPack: false },
        extensionsIncluded: true,
        authority: payload.pack?.authority || null
    };
}

async function attachRepositoryContextToSavedPlan(tabId, context, preflight = null) {
    const text = String(context || '').trim();
    if (!text) return { ok: true, attached: false };
    return mutatePlanState(state => {
        const key = `plan_${tabId}`;
        const current = state[key];
        if (!current || isFuturePlanState(current)) return { ok: true, attached: false };
        const nextContext = text.slice(0, 50000);
        const nextPreflight = preflight || null;
        const previousPreflight = current.repositoryPreflight && typeof current.repositoryPreflight === 'object'
            ? { ...current.repositoryPreflight }
            : current.repositoryPreflight ?? null;
        if (previousPreflight && typeof previousPreflight === 'object') delete previousPreflight.attachedAt;
        const unchanged = current.repositoryContext === nextContext
            && JSON.stringify(previousPreflight) === JSON.stringify(nextPreflight);
        if (unchanged) return { ok: true, attached: false, unchanged: true };
        current.repositoryContext = nextContext;
        current.repositoryPreflight = nextPreflight ? { ...nextPreflight, attachedAt: new Date().toISOString() } : null;
        current.stateRevision = (Number(current.stateRevision) || 0) + 1;
        state[key] = current;
        return { ok: true, attached: true };
    });
}

function attachRepositoryContext(basePrompt, contextText) {
    const base = String(basePrompt || '');
    const context = String(contextText || '').trim();
    if (!context) return base;
    return `${base}\n\nCODEE REPOSITORY & CODING CONTEXT — GOVERNED EVIDENCE\n${context}`;
}

function normalizeVersions(values) {
    return Array.from(new Set((Array.isArray(values) ? values : [])
        .map(value => String(value || '').trim())
        .filter(Boolean)));
}

function normalizeHashes(values) {
    return Array.from(new Set((Array.isArray(values) ? values : [])
        .map(value => String(value || '').trim().toLowerCase())
        .filter(value => /^[a-f0-9]{64}$/.test(value))));
}

function normalizeArtifacts(values) {
    return (Array.isArray(values) ? values : []).filter(value => value && typeof value === 'object');
}

function createProtocolId(prefix) {
    try {
        if (typeof crypto?.randomUUID === 'function') return `${prefix}-${crypto.randomUUID()}`;
    } catch (_error) {}
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function sanitizeDiagnosticDetails(details) {
    if (!details || typeof details !== 'object') return {};
    const output = {};
    for (const [key, value] of Object.entries(details)) {
        if (value === undefined) continue;
        if (typeof value === 'string') {
            const redacted = globalThis.CodeeRepositoryPolicy?.redactText
                ? globalThis.CodeeRepositoryPolicy.redactText(value)
                : value;
            output[key] = String(redacted).slice(0, 600);
        }
        else if (typeof value === 'number' || typeof value === 'boolean' || value === null) output[key] = value;
    }
    return output;
}

async function recordDiagnosticEvent(type, severity = 'info', tabId = null, details = {}) {
    const event = {
        at: new Date().toISOString(),
        type: String(type || 'event').slice(0, 80),
        severity: ['info', 'warning', 'error', 'success'].includes(severity) ? severity : 'info',
        tabId: normalizeOptionalTabId(tabId),
        details: sanitizeDiagnosticDetails(details)
    };
    const operation = diagnosticMutationQueue.then(async () => {
        const result = await chrome.storage.local.get([DIAGNOSTIC_STORAGE_KEY]);
        const events = Array.isArray(result?.[DIAGNOSTIC_STORAGE_KEY]) ? result[DIAGNOSTIC_STORAGE_KEY] : [];
        const previous = events[events.length - 1];
        const previousAt = Date.parse(String(previous?.at || '')) || 0;
        const currentAt = Date.parse(event.at) || Date.now();
        const baseDetails = value => {
            const copy = { ...(value && typeof value === 'object' ? value : {}) };
            delete copy.repeatCount;
            return copy;
        };
        const sameRapidEvent = Boolean(previous
            && previous.type === event.type
            && previous.severity === event.severity
            && previous.tabId === event.tabId
            && currentAt - previousAt >= 0
            && currentAt - previousAt <= 30000
            && JSON.stringify(baseDetails(previous.details)) === JSON.stringify(baseDetails(event.details)));
        if (sameRapidEvent) {
            previous.at = event.at;
            previous.details = { ...baseDetails(previous.details), repeatCount: Math.max(1, Number(previous.details?.repeatCount) || 1) + 1 };
            await chrome.storage.local.set({ [DIAGNOSTIC_STORAGE_KEY]: events.slice(-MAX_DIAGNOSTIC_EVENTS) });
            return previous;
        }
        events.push(event);
        await chrome.storage.local.set({ [DIAGNOSTIC_STORAGE_KEY]: events.slice(-MAX_DIAGNOSTIC_EVENTS) });
        return event;
    });
    diagnosticMutationQueue = operation.catch(() => {});
    return operation;
}

async function readDiagnosticEvents(tabId = null) {
    await diagnosticMutationQueue;
    const result = await chrome.storage.local.get([DIAGNOSTIC_STORAGE_KEY]);
    const events = Array.isArray(result?.[DIAGNOSTIC_STORAGE_KEY]) ? result[DIAGNOSTIC_STORAGE_KEY] : [];
    const filtered = Number.isInteger(Number(tabId))
        ? events.filter(event => event?.tabId === Number(tabId) || event?.tabId === null)
        : events;
    return filtered.slice(-40);
}

async function clearDiagnosticEvents() {
    await diagnosticMutationQueue;
    await chrome.storage.local.set({ [DIAGNOSTIC_STORAGE_KEY]: [] });
}

function getProtocolMode(planState) {
    return planState?.protocolMode === 'signature_v2' ? 'signature_v2' : 'legacy_zip';
}

function getExpectedDispatchStatus(planState) {
    return getProtocolMode(planState) === 'signature_v2' ? 'awaiting_artifact' : 'awaiting_zip';
}

function isFuturePlanState(planState) {
    const version = Number(planState?.stateVersion);
    return Number.isInteger(version) && version > PLAN_STATE_VERSION;
}

function getFutureStateHoldResult() {
    return {
        ok: false,
        requiresRestart: true,
        readOnly: true,
        error: 'This plan state was created by a newer Codee version. Update Codee before resuming it.'
    };
}

function normalizePlanState(planState) {
    if (!planState || !Array.isArray(planState.plan)) return planState;

    const rawStateVersion = Number(planState.stateVersion);
    const hasKnownStateVersion = Number.isInteger(rawStateVersion);
    const isLegacy = !hasKnownStateVersion || rawStateVersion < PLAN_STATE_VERSION;
    const isFutureState = hasKnownStateVersion && rawStateVersion > PLAN_STATE_VERSION;
    planState.stateRevision = Number.isInteger(Number(planState.stateRevision)) && Number(planState.stateRevision) >= 0
        ? Number(planState.stateRevision)
        : 0;

    planState.versions = normalizeVersions(planState.versions).slice(-MAX_VERSIONS);
    planState.knownVersions = normalizeVersions(planState.knownVersions);
    planState.protocolMode = getProtocolMode(planState);
    planState.knownArtifactHashes = normalizeHashes(planState.knownArtifactHashes);
    planState.consumedArtifactHashes = normalizeHashes(planState.consumedArtifactHashes).slice(-MAX_CONSUMED_ARTIFACT_HASHES);
    planState.consumedArtifactKeys = Array.from(new Set((Array.isArray(planState.consumedArtifactKeys) ? planState.consumedArtifactKeys : [])
        .map(value => String(value || '').trim())
        .filter(Boolean))).slice(-500);
    planState.artifactHistory = normalizeArtifacts(planState.artifactHistory).slice(-MAX_ARTIFACT_HISTORY);
    planState.logicalRetryCount = Math.max(0, Math.min(100, Number(planState.logicalRetryCount) || 0));
    planState.deliveryRetryCount = Math.max(0, Math.min(100, Number(planState.deliveryRetryCount) || 0));
    planState.nextRetryAt = Math.max(0, Number(planState.nextRetryAt) || 0);
    planState.nextNudgerEnabled = Boolean(planState.nextNudgerEnabled);
    planState.debuggingPlanEnabled = Boolean(planState.debuggingPlanEnabled);
    planState.lastNextNudgeAttemptAt = Number(planState.lastNextNudgeAttemptAt) || null;
    planState.lastNextNudgeSentAt = Number(planState.lastNextNudgeSentAt) || null;
    planState.lastNextNudgeStepId = String(planState.lastNextNudgeStepId || '').slice(0, 240);
    planState.lastNextNudgeError = String(planState.lastNextNudgeError || '').slice(0, 600);
    if (planState.submissionReceipt && typeof planState.submissionReceipt === 'object') {
        planState.submissionReceipt = {
            stepId: String(planState.submissionReceipt.stepId || '').slice(0, 240),
            stepToken: String(planState.submissionReceipt.stepToken || '').slice(0, 240),
            submittedAt: Math.max(0, Number(planState.submissionReceipt.submittedAt) || 0),
            conversationIdentity: String(planState.submissionReceipt.conversationIdentity || '').slice(0, 500)
        };
    } else delete planState.submissionReceipt;

    // v2.0.3 never recorded whether the current prompt was actually delivered.
    // That uncertainty cannot be reconstructed safely, so legacy active plans are
    // held for a clean user restart instead of guessing and potentially skipping.
    if (isFutureState) {
        // Never downgrade or execute state written by a newer Codee schema. Holding it
        // intact is safer than guessing at fields/semantics this build does not know.
        planState.requiresRestart = true;
        planState.restartReason = 'future-state-version';
        planState.dispatchStatus = 'blocked';
    } else if (isLegacy) {
        planState.stateVersion = PLAN_STATE_VERSION;
        planState.requiresRestart = true;
        planState.restartReason = 'legacy-uncertain-delivery';
        planState.dispatchStatus = 'pending_send';
    } else {
        planState.requiresRestart = Boolean(planState.requiresRestart);
        if (!['pending_send', 'awaiting_zip', 'awaiting_artifact', 'blocked', 'complete'].includes(planState.dispatchStatus)) {
            planState.dispatchStatus = 'pending_send';
        }

        // Storage can be edited manually, truncated, or partially corrupted. Do not let a
        // malformed current-schema plan hit the one-minute retry loop indefinitely or reach
        // buildPrompt() with a missing step. Quarantine it for an explicit clean restart.
        const normalizedStepIndex = Number(planState.stepIndex);
        const hasInvalidStepIndex = !Number.isInteger(normalizedStepIndex)
            || normalizedStepIndex < 0
            || normalizedStepIndex >= planState.plan.length;
        const hasInvalidPlanShape = planState.plan.length === 0
            || planState.plan.length > MAX_PLAN_STEPS
            || planState.plan.some(step => !String(step?.text || '').trim());
        if (hasInvalidStepIndex || hasInvalidPlanShape) {
            planState.requiresRestart = true;
            planState.restartReason = 'corrupt-plan-state';
            planState.dispatchStatus = 'blocked';
        } else {
            planState.stepIndex = normalizedStepIndex;
        }
    }

    if (!planState.planId) {
        planState.planId = `legacy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    if (planState.protocolMode === 'signature_v2' && !planState.runId) {
        planState.runId = createProtocolId('run');
    }

    return planState;
}

function getRestartStatusMessage(planState) {
    if (planState?.restartReason === 'future-state-version') {
        return 'This plan state was created by a newer Codee version. Update Codee before resuming it.';
    }
    if (planState?.restartReason === 'corrupt-plan-state') {
        return 'This saved plan state is malformed or incomplete. Stop it and restart from the source plan.';
    }
    return 'Plan was started by an older Codee build with uncertain delivery state. Stop it and restart from the source plan.';
}

function mergeKnownVersions(planState, versions) {
    const merged = normalizeVersions([
        ...(planState.knownVersions || []),
        ...normalizeVersions(versions)
    ]);
    planState.knownVersions = merged.slice(-MAX_KNOWN_VERSIONS);
}

function getArtifactHash(artifact) {
    const hash = String(artifact?.sha256 || '').trim().toLowerCase();
    return /^[a-f0-9]{64}$/.test(hash) ? hash : '';
}

function getArtifactConsumptionKey(planState, artifact, hash = getArtifactHash(artifact)) {
    return JSON.stringify([
        planState?.runId || artifact?.runId || '',
        artifact?.stepId || '',
        artifact?.stepToken || '',
        Number(artifact?.stepCompleted) || '',
        hash || ''
    ]);
}

function getSupportedProviderKey(url) {
    if (globalThis.CodeeProviderRegistry?.forUrl) return globalThis.CodeeProviderRegistry.forUrl(url)?.id || '';
    try { const host = new URL(String(url || '')).hostname.toLowerCase(); if (host === 'chatgpt.com' || host.endsWith('.chatgpt.com')) return 'chatgpt'; if (host === 'claude.ai' || host.endsWith('.claude.ai')) return 'claude'; } catch (_error) {}
    return '';
}

function getStructuredConversationIdentity(url) {
    if (globalThis.CodeeProviderRegistry?.structuredIdentity) return globalThis.CodeeProviderRegistry.structuredIdentity(url);
    try { const parsed=new URL(String(url||'')); const provider=getSupportedProviderKey(parsed.href); if(provider==='chatgpt'){const m=parsed.pathname.match(/^\/c\/([^/?#]+)/i);return m?`chatgpt:${m[1]}`:'';} if(provider==='claude'){const m=parsed.pathname.match(/^\/chat\/([^/?#]+)/i);return m?`claude:${m[1]}`:'';} } catch (_error) {}
    return '';
}

function hasStableConversationIdentity(url) {
    return Boolean(getStructuredConversationIdentity(url));
}

function isProvisionalConversationIdentity(identity) {
    return /^[a-z0-9_-]+:page:new-chat:[a-z0-9._-]+$/i.test(String(identity || ''));
}

function getConversationIdentityProvider(identity) {
    const value = String(identity || '');
    const index = value.indexOf(':');
    return index > 0 ? value.slice(0, index).toLowerCase() : '';
}

function conversationIdentityCanRebind(savedIdentity, liveIdentity, liveProvisionalIdentity = '') {
    const saved = String(savedIdentity || '');
    const live = String(liveIdentity || '');
    const liveProvisional = String(liveProvisionalIdentity || '');
    if (!saved || !live) return false;
    if (saved === live) return true;
    if (!isProvisionalConversationIdentity(saved)) return false;
    if (liveProvisional !== saved) return false;
    return getConversationIdentityProvider(saved) === getConversationIdentityProvider(live);
}

async function getLiveConversationIdentityForTab(tabId, liveUrl = '') {
    const structuredIdentity = getStructuredConversationIdentity(liveUrl);
    let page = null;
    try {
        if (typeof chrome.tabs?.sendMessage === 'function') {
            page = await chrome.tabs.sendMessage(tabId, { action: 'GET_CONVERSATION_IDENTITY' });
        }
    } catch (_error) {}
    const provisionalIdentity = String(page?.provisionalConversationIdentity || '').trim();
    const pageIdentity = String(page?.conversationIdentity || '').trim();
    return {
        structuredIdentity,
        provisionalIdentity: isProvisionalConversationIdentity(provisionalIdentity) ? provisionalIdentity : '',
        conversationIdentity: structuredIdentity || pageIdentity || (isProvisionalConversationIdentity(provisionalIdentity) ? provisionalIdentity : '')
    };
}

async function reconcileConversationIdentity(planState, liveUrl = '', liveProvisionalIdentity = '', liveConversationIdentity = '') {
    if (!planState) return { ok: false, reason: 'no-plan' };
    const structuredIdentity = getStructuredConversationIdentity(liveUrl);
    const provisionalIdentity = isProvisionalConversationIdentity(liveProvisionalIdentity) ? String(liveProvisionalIdentity) : '';
    const liveIdentity = structuredIdentity || String(liveConversationIdentity || '') || provisionalIdentity;
    const savedUrl = String(planState?.target?.url || '');
    const savedIdentity = String(planState?.target?.conversationIdentity || '') || getStructuredConversationIdentity(savedUrl);
    const savedProvider = getSupportedProviderKey(savedUrl) || getConversationIdentityProvider(savedIdentity);
    const liveProvider = getSupportedProviderKey(liveUrl) || getConversationIdentityProvider(liveIdentity);
    if (savedProvider && liveProvider && savedProvider !== liveProvider) {
        return { ok: false, reason: 'provider-mismatch' };
    }
    if (!savedIdentity && liveIdentity) {
        planState.target = { ...(planState.target || {}), url: liveUrl || savedUrl, conversationIdentity: liveIdentity };
        return { ok: true, promoted: Boolean(structuredIdentity), adopted: true };
    }
    if (!savedIdentity) {
        return (savedProvider || liveProvider)
            ? { ok: false, reason: 'conversation-identity-unavailable' }
            : { ok: true, promoted: false };
    }
    if (isProvisionalConversationIdentity(savedIdentity)) {
        if (structuredIdentity
            && provisionalIdentity === savedIdentity
            && getConversationIdentityProvider(structuredIdentity) === getConversationIdentityProvider(savedIdentity)) {
            planState.target = { ...(planState.target || {}), url: liveUrl || savedUrl, conversationIdentity: structuredIdentity, provisionalConversationIdentity: savedIdentity };
            return { ok: true, promoted: true, previousIdentity: savedIdentity, conversationIdentity: structuredIdentity };
        }
        if (liveIdentity === savedIdentity || provisionalIdentity === savedIdentity) {
            planState.target = { ...(planState.target || {}), url: liveUrl || savedUrl, conversationIdentity: savedIdentity };
            return { ok: true, promoted: false };
        }
        return { ok: false, reason: 'conversation-mismatch' };
    }
    if (liveIdentity && liveIdentity !== savedIdentity) return { ok: false, reason: 'conversation-mismatch' };
    if (!liveIdentity && getSupportedProviderKey(liveUrl)) return { ok: false, reason: 'conversation-identity-unavailable' };
    planState.target = { ...(planState.target || {}), url: liveUrl || savedUrl, conversationIdentity: savedIdentity };
    return { ok: true, promoted: false };
}

async function rebindOrphanedPlanToTab(tabId, liveUrl = '', liveProvisionalIdentity = '', liveConversationIdentity = '') {
    const structuredIdentity = getStructuredConversationIdentity(liveUrl);
    const provisionalIdentity = isProvisionalConversationIdentity(liveProvisionalIdentity) ? String(liveProvisionalIdentity) : '';
    const liveIdentity = structuredIdentity || String(liveConversationIdentity || '') || provisionalIdentity;
    if (!Number.isInteger(tabId) || !liveIdentity) return { ok: true, rebound: false, reason: 'no-conversation-identity' };

    // Avoid a storage write on every CONTENT_READY handshake for ordinary tabs that
    // have no matching orphaned plan. Re-check under the serialized mutation before
    // moving anything so concurrent tabs cannot both claim the same plan.
    const snapshot = await getPlanState();
    const destinationKey = `plan_${tabId}`;
    if (snapshot[destinationKey]) return { ok: true, rebound: false, reason: 'destination-already-bound' };

    const candidateKeys = Object.entries(snapshot).filter(([key, rawPlanState]) => {
        if (!key.startsWith('plan_')) return false;
        const oldTabId = Number(key.slice(5));
        if (!Number.isInteger(oldTabId) || oldTabId === tabId) return false;
        if (isFuturePlanState(rawPlanState)) return false;
        const planState = normalizePlanState(rawPlanState);
        if (!planState || planState.dispatchStatus === 'complete') return false;
        const savedIdentity = String(planState?.target?.conversationIdentity || '')
            || getStructuredConversationIdentity(planState?.target?.url || '');
        return conversationIdentityCanRebind(savedIdentity, liveIdentity, provisionalIdentity);
    }).map(([key]) => key);
    if (candidateKeys.length === 0) return { ok: true, rebound: false, reason: 'no-matching-orphan' };
    if (candidateKeys.length > 1) return { ok: false, rebound: false, reason: 'ambiguous-matching-orphans' };

    return mutatePlanState(async state => {
        if (state[destinationKey]) {
            return { ok: true, rebound: false, reason: 'destination-already-bound' };
        }

        const matchingKeys = Object.entries(state).filter(([key, rawPlanState]) => {
            if (!key.startsWith('plan_')) return false;
            const oldTabId = Number(key.slice(5));
            if (!Number.isInteger(oldTabId) || oldTabId === tabId) return false;
            if (isFuturePlanState(rawPlanState)) return false;
            const candidate = normalizePlanState(rawPlanState);
            if (!candidate || candidate.dispatchStatus === 'complete') return false;
            const identity = String(candidate?.target?.conversationIdentity || '')
                || getStructuredConversationIdentity(candidate?.target?.url || '');
            return identity === liveIdentity;
        }).map(([key]) => key);
        if (matchingKeys.length > 1) {
            return { ok: false, rebound: false, reason: 'ambiguous-matching-orphans' };
        }

        for (const [key, rawPlanState] of Object.entries(state)) {
            if (!key.startsWith('plan_')) continue;
            const oldTabId = Number(key.slice(5));
            if (!Number.isInteger(oldTabId) || oldTabId === tabId) continue;

            if (isFuturePlanState(rawPlanState)) continue;
            const planState = normalizePlanState(rawPlanState);
            if (!planState || planState.dispatchStatus === 'complete') continue;
            const savedIdentity = String(planState?.target?.conversationIdentity || '')
                || getStructuredConversationIdentity(planState?.target?.url || '');
            if (!conversationIdentityCanRebind(savedIdentity, liveIdentity, provisionalIdentity)) continue;

            let originalTab = null;
            try {
                if (typeof chrome.tabs?.get === 'function') originalTab = await chrome.tabs.get(oldTabId);
            } catch (_error) {
                originalTab = null;
            }

            // Never steal an active plan from another live copy of the same conversation.
            if (originalTab) {
                const originalStructured = getStructuredConversationIdentity(originalTab.url || '');
                if ((isProvisionalConversationIdentity(liveIdentity) && getSupportedProviderKey(originalTab.url || '') === getConversationIdentityProvider(liveIdentity))
                    || originalStructured === liveIdentity) {
                    return { ok: true, rebound: false, reason: 'original-tab-still-active', oldTabId };
                }
            }

            const previousIdentity = String(planState?.target?.conversationIdentity || '');
            planState.target = {
                ...(planState.target || {}),
                url: liveUrl || planState?.target?.url || '',
                conversationIdentity: liveIdentity,
                ...((isProvisionalConversationIdentity(previousIdentity) && liveIdentity !== previousIdentity)
                    ? { provisionalConversationIdentity: previousIdentity }
                    : (structuredIdentity && provisionalIdentity ? { provisionalConversationIdentity: provisionalIdentity } : {}))
            };
            state[destinationKey] = planState;
            delete state[key];
            return { ok: true, rebound: true, oldTabId, tabId, planId: planState.planId };
        }

        return { ok: true, rebound: false, reason: 'no-matching-orphan' };
    });
}

async function validateTargetConversation(tabId, planState) {
    if (typeof chrome.tabs?.get !== 'function') return { ok: true, promoted: false };
    const tab = await chrome.tabs.get(tabId);
    const liveUrl = String(tab?.url || '');
    const identity = await getLiveConversationIdentityForTab(tabId, liveUrl);
    const result = await reconcileConversationIdentity(planState, liveUrl, identity.provisionalIdentity, identity.conversationIdentity);
    if (!result.ok) {
        if (result.reason === 'provider-mismatch') throw new Error('Target tab is no longer on the same AI provider/conversation this plan was started in');
        throw new Error('Target tab is no longer on the conversation this plan was started in');
    }
    return result;
}

function mergeKnownArtifactHashes(planState, artifacts) {
    const hashes = normalizeArtifacts(artifacts).map(getArtifactHash).filter(Boolean);
    planState.knownArtifactHashes = normalizeHashes([...(planState.knownArtifactHashes || []), ...hashes]).slice(-200);
}

function validateArtifactIdentityForCurrentStep(planState, artifact) {
    if (getProtocolMode(planState) !== 'signature_v2') return { ok: false, reason: 'not-signature-mode' };
    if (!artifact?.ready || Number(artifact.protocolVersion) !== 2) return { ok: false, reason: 'protocol' };
    if (artifact.planId !== planState.planId) return { ok: false, reason: 'plan-id' };
    if (artifact.runId !== planState.runId) return { ok: false, reason: 'run-id' };
    if (artifact.stepId !== planState.currentStepId) return { ok: false, reason: 'step-id' };
    if (artifact.stepToken !== planState.currentStepToken) return { ok: false, reason: 'step-token' };
    if (Number(artifact.stepCompleted) !== planState.stepIndex + 1) return { ok: false, reason: 'step-number' };
    if (Number(artifact.stepTotal) !== planState.plan.length) return { ok: false, reason: 'step-total' };
    return { ok: true };
}

const STRICT_ARTIFACT_TYPES = new Set(['full_extension','cumulative','delta','patch','module','app','other']);
function strictArtifactInteger(value,{positive=false,allowNA=false}={}) {
    const text=String(value??'').trim(); if(allowNA&&text.toUpperCase()==='N/A')return {ok:true,value:null};
    const m=text.match(/^(\d+)(?:\s*bytes?)?$/i); if(!m)return {ok:false}; const n=Number(m[1]);
    if(!Number.isSafeInteger(n)||(positive?n<=0:n<0))return {ok:false}; return {ok:true,value:n};
}
function validateStrictArtifactMetadata(planState,artifact){
    if(String(planState?.artifactValidationMode||'').toLowerCase()!=='strict_v216')return {ok:true};
    const artifactId=String(artifact?.artifactId||'').trim();if(!artifactId||artifactId.length>240)return {ok:false,reason:'artifact-id'};
    const zip=String(artifact?.zip||'').trim();if(!zip||zip.length>255||!zip.toLowerCase().endsWith('.zip')||/[\\/]/.test(zip)||zip==='.'||zip==='..')return {ok:false,reason:'zip'};
    const type=String(artifact?.type||'').trim().toLowerCase();if(!STRICT_ARTIFACT_TYPES.has(type))return {ok:false,reason:'type'};
    const version=String(artifact?.version||'').trim();if(!version||version.length>120||/[\r\n<>]/.test(version))return {ok:false,reason:'version'};
    if(!strictArtifactInteger(artifact?.zipSize,{positive:true}).ok)return {ok:false,reason:'zip-size'};
    if(!strictArtifactInteger(artifact?.deltaSize,{allowNA:true}).ok)return {ok:false,reason:'delta-size'};
    if(!strictArtifactInteger(artifact?.filesChanged,{allowNA:true}).ok)return {ok:false,reason:'files-changed'};
    const created=String(artifact?.createdAt||'').trim();if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(created)||Number.isNaN(Date.parse(created)))return {ok:false,reason:'created-at'};
    const expectedParent=String(planState?.lastArtifactSha256||'').trim().toLowerCase();const parent=String(artifact?.parentSha256||'').trim().toLowerCase();
    if(expectedParent){if(parent!==expectedParent)return {ok:false,reason:'parent-sha256'};}else if(parent!=='n/a')return {ok:false,reason:'parent-sha256'};
    return {ok:true};
}

function validateArtifactForCurrentStep(planState, artifact) {
    const identity = validateArtifactIdentityForCurrentStep(planState, artifact);
    if (!identity.ok) return identity;
    if (!['awaiting_artifact', 'blocked'].includes(planState.dispatchStatus)) return { ok: false, reason: 'not-awaiting-artifact' };
    if (!String(artifact.artifactId || '').trim()) return { ok: false, reason: 'artifact-id' };
    const strictMetadata = validateStrictArtifactMetadata(planState, artifact);
    if (!strictMetadata.ok) return strictMetadata;
    if (artifact.status !== 'completed') return { ok: false, reason: 'status' };
    if (artifact.nextAction !== 'advance') return { ok: false, reason: 'next-action' };
    if (!/^PASS\b/i.test(String(artifact.verification || '').trim())) return { ok: false, reason: 'verification' };
    if (!String(artifact.zip || '').trim().toLowerCase().endsWith('.zip')) return { ok: false, reason: 'zip' };

    const hash = getArtifactHash(artifact);
    if (!hash) return { ok: false, reason: 'sha256' };
    const consumptionKey = getArtifactConsumptionKey(planState, artifact, hash);
    if ((planState.consumedArtifactKeys || []).includes(consumptionKey)) return { ok: false, reason: 'duplicate' };

    const expectedParent = String(planState.lastArtifactSha256 || '').toLowerCase();
    if (expectedParent && String(artifact.parentSha256 || '').toLowerCase() !== expectedParent) {
        return { ok: false, reason: 'parent-sha256' };
    }

    return { ok: true, hash, consumptionKey };
}


function requiresArtifactVerificationReceipt(planState) {
    return String(planState?.artifactVerificationMode || '').toLowerCase() === 'receipt_required';
}

async function verifyArtifactReceiptForCurrentStep(tabId, planState, artifact) {
    const adapter = globalThis.CodeeArtifactVerificationAdapter;
    if (!adapter || typeof adapter.verifyWithHost !== 'function') {
        return { ok: false, reason: 'artifact-verification-adapter-unavailable' };
    }
    const host = globalThis.CodeeArtifactVerificationHost
        || (globalThis.CodeeMcpRuntime && typeof globalThis.CodeeMcpRuntime.verifyArtifact === 'function' ? globalThis.CodeeMcpRuntime : null)
        || (globalThis.CodeeRepositoryHost && typeof globalThis.CodeeRepositoryHost.verifyArtifact === 'function' ? globalThis.CodeeRepositoryHost : null);
    return adapter.verifyWithHost(host, artifact, {
        tabId,
        planId: planState?.planId || '',
        runId: planState?.runId || '',
        stepId: planState?.currentStepId || '',
        stepToken: planState?.currentStepToken || '',
        stepCompleted: (Number(planState?.stepIndex) || 0) + 1,
        requireContentManifest: String(planState?.artifactValidationMode || '').toLowerCase() === 'strict_v216'
    });
}

function validateNonCompletedArtifactReport(status, action) {
    const allowedStatuses = new Set(['partial', 'failed', 'blocked']);
    const allowedActions = new Set(['retry', 'hold', 'needs_user']);
    if (!allowedStatuses.has(String(status || '').toLowerCase())) return { ok: false, reason: 'status' };
    if (!allowedActions.has(String(action || '').toLowerCase())) return { ok: false, reason: 'next-action' };
    return { ok: true };
}

function validatePlanStateForSave(planState) {
    if (!planState?.planId || !Array.isArray(planState.plan) || planState.plan.length === 0) {
        return { ok: false, error: 'Invalid plan state' };
    }
    if (planState.plan.length > MAX_PLAN_STEPS) {
        return { ok: false, error: `Plan has too many steps (maximum ${MAX_PLAN_STEPS})` };
    }
    let totalChars = 0;
    for (const step of planState.plan) {
        const text = String(step?.text || '').trim();
        if (!text) return { ok: false, error: 'Plan contains an empty step' };
        if (text.length > MAX_STEP_TEXT_CHARS) return { ok: false, error: `Plan step is too large (maximum ${MAX_STEP_TEXT_CHARS} characters)` };
        totalChars += text.length;
        if (totalChars > MAX_PLAN_TEXT_CHARS) {
            return { ok: false, error: 'Plan content is too large' };
        }
    }
    return { ok: true };
}

function buildPrompt(planState) {
    const stepIndex = planState.stepIndex;
    const step = planState.plan[stepIndex];
    const stepNumber = stepIndex + 1;
    let basePrompt = stepIndex === 0
        ? `Please implement Step 1: ${step.text}`
        : `Perfect! Step ${stepIndex} is complete.

Now for Step ${stepNumber}: ${step.text}`;

    if (planState.debuggingPlanEnabled) {
        basePrompt += `

DEBUGGING PLAN MODE — REQUIRED FOR THIS PASS
Deep scan the current cumulative code for errors, bugs, regressions, architectural drift, dead or unwired code, unsafe behavior, and broken integration paths. Fix issues as you find them rather than only reporting them. Re-scan after repairs, run the relevant fresh verification/regression checks, and produce a freshly verified cumulative ZIP for this pass. Do not mark the pass completed unless the resulting ZIP exists and the verification evidence is real.`;
    }

    const workforceBasePrompt = attachWorkforceContext(basePrompt, planState.workforceContext);
    const repositoryBasePrompt = attachRepositoryContext(workforceBasePrompt, planState.repositoryContext);
    const contextualBasePrompt = attachTitanZeroContext(repositoryBasePrompt, planState.titanZeroContext);
    if (getProtocolMode(planState) !== 'signature_v2') return contextualBasePrompt;

    const parentSha = planState.lastArtifactSha256 || 'N/A';
    const protocolPrompt = `${contextualBasePrompt}

CODEE COMPLETION CONTRACT — REQUIRED FOR THIS CODE ZIP
` +
        `When this step is complete and the final code ZIP has been freshly verified, append the full machine-readable footer below to your reply. ` +
        `Codee will independently verify the actual ZIP bytes (existence, completed download, SHA-256, size, and ZIP integrity) before advancing; the footer alone is not completion evidence. ` +
        `Echo PLAN_ID, RUN_ID, STEP_ID and STEP_TOKEN exactly. Do not mark completed before the ZIP exists and verification has run. ` +
        `If this step cannot complete, keep those identifiers unchanged, set STATUS to partial, failed, or blocked, and set NEXT_ACTION to retry, hold, or needs_user as appropriate; do not fabricate PASS verification.

` +
        `CODEE_ARTIFACT
` +
        `PROTOCOL_VERSION: 2

` +
        `PLAN_ID: ${planState.planId}
` +
        `RUN_ID: ${planState.runId}
` +
        `STEP_ID: ${planState.currentStepId}
` +
        `STEP_TOKEN: ${planState.currentStepToken}
` +
        `STEP_COMPLETED: ${stepNumber}
` +
        `STEP_TOTAL: ${planState.plan.length}
` +
        `STATUS: completed

` +
        `ARTIFACT_ID: <unique artifact identifier>
` +
        `ZIP: <exact final code ZIP filename>
` +
        `TYPE: <full_extension|cumulative|delta|patch|module|app|other>
` +
        `VERSION: <artifact version>

` +
        `PARENT_SHA256: ${parentSha}
` +
        `SHA256: <SHA-256 of the exact final ZIP>
` +
        `ZIP_SIZE: <bytes>
` +
        `DELTA_SIZE: <bytes or N/A>
` +
        `FILES_CHANGED: <count>

` +
        `TESTS: <actual fresh test result or N/A>
` +
        `VERIFICATION: <PASS plus concise summary>
` +
        `CREATED_AT: <ISO-8601 timestamp with timezone>
` +
        `NEXT_ACTION: advance

` +
        `CODEE_ARTIFACT_READY`;
    return protocolPrompt;
}

async function notifyUI(tabId, planState, status) {
    try {
        await chrome.runtime.sendMessage({
            action: 'UPDATE_UI',
            tabId,
            planState,
            stepIndex: planState.stepIndex,
            dispatchStatus: planState.dispatchStatus,
            status,
            versions: planState.versions || []
        });
    } catch (_error) {
        // Sidebar may be closed; persisted state remains authoritative.
    }
}

async function waitForRunnableConversationTab(tabId, requireComplete = false) {
    const maxAttempts = requireComplete ? 60 : 20;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const tab = await getTabSafely(tabId);
        if (tab && tab.frozen !== true && tab.discarded !== true && (!requireComplete || tab.status === 'complete')) return tab;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return getTabSafely(tabId);
}

function isTransientTabEditError(error) {
    return /Tabs cannot be edited right now|user may be dragging a tab/i.test(error?.message || String(error || ''));
}

async function updateConversationTabWithRetry(tabId, updateProperties, options = {}) {
    if (typeof chrome.tabs?.update !== 'function') return null;
    const maxAttempts = Math.max(1, Math.min(8, Number(options.maxAttempts) || 5));
    const baseDelayMs = Math.max(25, Math.min(500, Number(options.baseDelayMs) || 100));
    let lastError = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try { return await chrome.tabs.update(tabId, updateProperties); }
        catch (error) {
            lastError = error;
            if (!isTransientTabEditError(error) || attempt === maxAttempts - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, baseDelayMs * (attempt + 1)));
        }
    }
    throw lastError || new Error('Tab update failed');
}

async function getLastFocusedWindowSafely() {
    try { if (typeof chrome.windows?.getLastFocused === 'function') return await chrome.windows.getLastFocused(); } catch (_error) {}
    return null;
}

async function isWindowFocused(windowId) {
    if (!Number.isInteger(windowId)) return false;
    try {
        if (typeof chrome.windows?.get === 'function') return Boolean((await chrome.windows.get(windowId))?.focused);
        const lastFocused = await getLastFocusedWindowSafely();
        return Number(lastFocused?.id) === windowId;
    } catch (_error) { return false; }
}

async function focusConversationWindow(windowId) {
    if (!Number.isInteger(windowId) || typeof chrome.windows?.update !== 'function') return null;
    try { return await chrome.windows.update(windowId, { focused: true }); } catch (_error) { return null; }
}

async function waitForContentScriptReady(tabId, options = {}) {
    const timeoutMs = Math.max(250, Math.min(8000, Number(options.timeoutMs) || 4000));
    const intervalMs = Math.max(50, Math.min(500, Number(options.intervalMs) || 150));
    const deadline = Date.now() + timeoutMs;
    let lastError = null;
    while (Date.now() < deadline) {
        try {
            const health = await chrome.tabs.sendMessage(tabId, { action:'GET_CODEE_DIAGNOSTICS' });
            if (health?.ok) return health;
        } catch (error) {
            lastError = error;
            if (!isRecoverableContentFailure(error)) throw error;
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    if (lastError) throw lastError;
    return null;
}

async function withRunnableConversationTab(tabId, operation, recoveryPreferences = DEFAULT_RECOVERY_PREFERENCES) {
    if (typeof operation !== 'function') throw new Error('Conversation operation is required');
    let tab = await getTabSafely(tabId);
    if (!tab) return operation(null);

    if (recoveryPreferences.preventAutoDiscard && tab.autoDiscardable !== false && typeof chrome.tabs?.update === 'function') {
        try { tab = await updateConversationTabWithRetry(tabId, { autoDiscardable: false }) || { ...tab, autoDiscardable: false }; } catch (_error) {}
    }

    const needsWake = tab?.frozen === true || tab?.discarded === true || tab?.active !== true;
    if (!needsWake) return operation(tab);

    let priorActiveTabId = null;
    let didWake = false;
    try {
        const activeTabs = await queryTabs({ windowId: tab.windowId, active: true });
        const priorActive = activeTabs.find(candidate => Number.isInteger(candidate?.id));
        if (priorActive && priorActive.id !== tabId) priorActiveTabId = priorActive.id;

        const wasDiscarded = tab.discarded === true;
        const wakeProps = { active: true };
        if (recoveryPreferences.preventAutoDiscard) wakeProps.autoDiscardable = false;
        const awakened = await updateConversationTabWithRetry(tabId, wakeProps);
        if (awakened) tab = awakened;
        didWake = true;

        if (wasDiscarded || tab?.frozen === true || tab?.discarded === true || tab?.status === 'loading') {
            tab = await waitForRunnableConversationTab(tabId, wasDiscarded);
        }
        if (!tab || tab.frozen === true || tab.discarded === true) {
            throw new Error('Target conversation tab could not be awakened for background execution');
        }
        return await operation(tab);
    } finally {
        if (recoveryPreferences.restorePreviousTab && didWake && Number.isInteger(priorActiveTabId) && priorActiveTabId !== tabId) {
            try { await updateConversationTabWithRetry(priorActiveTabId, { active: true }, { maxAttempts: 4, baseDelayMs: 75 }); } catch (_error) {}
        }
    }
}

function getRecoveryFailureText(value) {
    return [value?.reason, value?.error, value?.message, typeof value === 'string' ? value : ''].map(part => String(part || '')).join(' ');
}

function isComposerUnavailableFailure(value) {
    return /composer-not-found|could not find the ai chat composer/i.test(getRecoveryFailureText(value));
}

function isContentTransportFailure(value) {
    return /content-unreachable|content script is not ready|receiving end does not exist|could not establish connection|message port closed|extension context invalidated/i.test(getRecoveryFailureText(value));
}

function isRecoverableContentFailure(value) {
    return isComposerUnavailableFailure(value) || isContentTransportFailure(value);
}

function getWatchdogReloadCooldownRemaining(tabId, now = Date.now()) {
    const previous = Number(watchdogReloadTimes.get(Number(tabId))) || 0;
    return previous > 0 ? Math.max(0, WATCHDOG_RELOAD_COOLDOWN_MS - (Number(now) - previous)) : 0;
}

function canWatchdogReload(tabId, now = Date.now()) {
    return !watchdogReloadInFlight.has(Number(tabId)) && getWatchdogReloadCooldownRemaining(tabId, now) <= 0;
}

async function withFocusedConversationTab(tabId, operation, recoveryPreferences = DEFAULT_RECOVERY_PREFERENCES) {
    if (typeof operation !== 'function') throw new Error('Conversation operation is required');
    let tab = await getTabSafely(tabId);
    if (!tab) return operation(null);
    if (!recoveryPreferences.focusPulse) return operation(tab);

    let priorActiveTabId = null;
    let changedTab = false;
    let changedWindow = false;
    const priorWindow = await getLastFocusedWindowSafely();
    const priorFocusedWindowId = Number.isInteger(priorWindow?.id) ? priorWindow.id : null;
    try {
        if (tab.active !== true) {
            const activeTabs = await queryTabs({ windowId: tab.windowId, active: true });
            const priorActive = activeTabs.find(candidate => Number.isInteger(candidate?.id));
            if (priorActive && priorActive.id !== tabId) priorActiveTabId = priorActive.id;
            const focusProps = { active: true };
            if (recoveryPreferences.preventAutoDiscard) focusProps.autoDiscardable = false;
            tab = await updateConversationTabWithRetry(tabId, focusProps) || { ...tab, active: true };
            changedTab = true;
        } else if (recoveryPreferences.preventAutoDiscard && tab.autoDiscardable !== false) {
            try { tab = await updateConversationTabWithRetry(tabId, { autoDiscardable: false }) || { ...tab, autoDiscardable: false }; } catch (_error) {}
        }

        const targetWindowFocused = await isWindowFocused(tab.windowId);
        if (!targetWindowFocused && typeof chrome.windows?.update === 'function') {
            const focused = await focusConversationWindow(tab.windowId);
            changedWindow = Boolean(focused);
        }

        tab = await waitForRunnableConversationTab(tabId, false) || tab;
        await new Promise(resolve => setTimeout(resolve, changedWindow || changedTab ? 650 : 250));
        return await operation(tab);
    } finally {
        if (recoveryPreferences.restorePreviousTab && changedTab && Number.isInteger(priorActiveTabId) && priorActiveTabId !== tabId) {
            try { await updateConversationTabWithRetry(priorActiveTabId, { active: true }, { maxAttempts: 4, baseDelayMs: 75 }); } catch (_error) {}
        }
        if (recoveryPreferences.restorePreviousTab && changedWindow && Number.isInteger(priorFocusedWindowId) && priorFocusedWindowId !== tab.windowId) {
            try { await focusConversationWindow(priorFocusedWindowId); } catch (_error) {}
        }
    }
}

async function recoverMissingContentReceiver(tabId) {
    if (typeof chrome.tabs?.reload !== 'function') {
        return { ok:false, reason:'content-receiver-recovery-unavailable', error:'Tab reload API is unavailable' };
    }
    let tab;
    try { tab = await chrome.tabs.get(tabId); }
    catch (error) { return { ok:false, reason:'content-receiver-tab-unavailable', error:error?.message || String(error) }; }
    const url = String(tab?.url || '');
    if (!getSupportedProviderKey(url)) {
        return { ok:false, reason:'content-receiver-unsupported-target', error:'Content recovery is restricted to supported provider conversations' };
    }
    if (!hasStableConversationIdentity(url)) {
        return { ok:false, retryable:true, reason:'unstable-new-chat-target', error:'Automatic receiver reload is disabled until the provider has a stable conversation identity' };
    }
    const cooldownRemainingMs = getWatchdogReloadCooldownRemaining(tabId);
    if (!canWatchdogReload(tabId)) {
        return { ok:false, retryable:true, reason:'watchdog-reload-cooldown', cooldownRemainingMs, error:'Receiver reload suppressed by recovery cooldown' };
    }
    watchdogReloadInFlight.add(Number(tabId));
    watchdogReloadTimes.set(Number(tabId), Date.now());
    try {
        await chrome.tabs.reload(tabId);
        const reloaded = await waitForRunnableConversationTab(tabId, true);
        if (!reloaded || reloaded.status !== 'complete') throw new Error('Target conversation did not finish reloading for receiver recovery');
        await waitForContentScriptReady(tabId, { timeoutMs:8000, intervalMs:200 });
        await recordDiagnosticEvent('content-script-recovered', 'success', tabId, { reason:'content-script-recovered-by-reload' }).catch(() => {});
        return { ok:true, reason:'content-script-recovered-by-reload' };
    } catch (error) {
        await recordDiagnosticEvent('content-script-recovery-failed', 'warning', tabId, { error:error?.message || String(error) }).catch(() => {});
        return { ok:false, reason:'content-script-recovery-failed', error:error?.message || String(error) };
    } finally {
        watchdogReloadInFlight.delete(Number(tabId));
    }
}

async function ensureNextRunnerReceiverReady(tabId) {
    try {
        const health = await waitForContentScriptReady(tabId, { timeoutMs:1200, intervalMs:150 });
        if (health?.ok) return { ok:true, reason:'receiver-ready' };
    } catch (_error) {}

    const recovered = await recoverMissingContentReceiver(tabId);
    if (!recovered?.ok) {
        return {
            ok:false,
            retryable:true,
            reason:recovered?.reason || 'content-unreachable',
            error:recovered?.error || 'Titan Code could not attach its conversation receiver.'
        };
    }
    try {
        const health = await waitForContentScriptReady(tabId, { timeoutMs:8000, intervalMs:200 });
        return health?.ok
            ? { ok:true, reason:'receiver-recovered' }
            : { ok:false, retryable:true, reason:'content-unreachable', error:'Titan Code receiver did not acknowledge after recovery.' };
    } catch (error) {
        return { ok:false, retryable:true, reason:'content-unreachable', error:error?.message || String(error) };
    }
}

async function sendContentMessageWithWatchdog(tabId, message, options = {}) {
    const recoveryPreferences = options.recoveryPreferences || await getRecoveryPreferences();
    const allowReload = options.allowReload !== false && recoveryPreferences.targetedReload;
    const send = () => chrome.tabs.sendMessage(tabId, message);

    if (!recoveryPreferences.backgroundWatchdog) {
        let direct;
        try { direct = await send(); }
        catch (error) { direct = { ok:false, retryable:true, reason:'content-unreachable', error:error?.message || String(error) }; }
        if (direct?.ok || options.recoverMissingReceiver !== true || !isContentTransportFailure(direct)) return direct;
        const recovered = await recoverMissingContentReceiver(tabId);
        if (!recovered?.ok) return { ...direct, recoveryReason:recovered?.reason || '', recoveryError:recovered?.error || '' };
        try { return await send(); }
        catch (error) { return { ok:false, retryable:true, reason:'content-unreachable', error:error?.message || String(error) }; }
    }

    // Silent-first transport: try the bound background tab exactly as-is before any
    // tab activation or focus recovery. Provider-busy and other valid responses must
    // never cause a visual focus pulse.
    let first;
    try { first = await send(); }
    catch (error) { first = { ok:false, retryable:true, reason:'content-unreachable', error:error?.message || String(error) }; }
    if (first?.ok || !isRecoverableContentFailure(first)) return first;

    try { first = await withRunnableConversationTab(tabId, send, recoveryPreferences); }
    catch (error) { first = { ok:false, retryable:true, reason:'content-unreachable', error:error?.message || String(error) }; }
    if (first?.ok || !isRecoverableContentFailure(first)) return first;

    let focused = first;
    if (recoveryPreferences.focusPulse) {
        try { focused = await withFocusedConversationTab(tabId, send, recoveryPreferences); }
        catch (error) { focused = { ok:false, retryable:true, reason:'content-unreachable', error:error?.message || String(error) }; }
        if (focused?.ok || !isRecoverableContentFailure(focused)) return focused;
    }

    // Extension reload/update can leave an already-open provider tab without the newly
    // loaded content-script receiver. Only callers that explicitly opt in may perform
    // the bounded one-time tab reload needed to restore the static content script.
    if (options.recoverMissingReceiver === true && isContentTransportFailure(focused)) {
        const recovered = await recoverMissingContentReceiver(tabId);
        if (recovered?.ok) {
            try {
                const retried = await send();
                if (retried?.ok || !isRecoverableContentFailure(retried)) return retried;
                focused = retried;
            } catch (error) {
                focused = { ok:false, retryable:true, reason:'content-unreachable', error:error?.message || String(error) };
            }
        } else if (recovered?.error) {
            focused = { ...focused, recoveryReason:recovered.reason, recoveryError:recovered.error };
        }
    }

    // A missing composer is not evidence that the page is broken. ChatGPT/Claude can
    // temporarily remove or defer the composer while hydrating or generating. Reloading
    // on composer absence can destroy the in-flight response and create a self-sustaining
    // reload loop. Only a broken content-script transport may reach the reload fallback.
    if (!allowReload || typeof chrome.tabs?.reload !== 'function' || !isContentTransportFailure(focused)) return focused;

    const reloadTarget = await getTabSafely(tabId);
    if (!hasStableConversationIdentity(reloadTarget?.url || '')) {
        return { ok:false, retryable:true, reason:'unstable-new-chat-target', error:'Automatic recovery will not reload a provider new-chat surface without a stable conversation identity' };
    }

    const cooldownRemainingMs = getWatchdogReloadCooldownRemaining(tabId);
    if (!canWatchdogReload(tabId)) {
        return { ok:false, retryable:true, reason:'watchdog-reload-cooldown', cooldownRemainingMs, error:'Targeted reload suppressed to prevent a recovery reload loop' };
    }

    watchdogReloadInFlight.add(Number(tabId));
    watchdogReloadTimes.set(Number(tabId), Date.now());
    try {
        return await withFocusedConversationTab(tabId, async () => {
            // Probe immediately before reload so an actively generating provider is never interrupted.
            try {
                const health = await chrome.tabs.sendMessage(tabId, { action:'GET_CODEE_DIAGNOSTICS' });
                if (health?.providerBusy) return { ok:false, skipped:true, reason:'provider-busy', error:'AI response is still generating' };
            } catch (_error) {}
            await chrome.tabs.reload(tabId);
            const tab = await waitForRunnableConversationTab(tabId, true);
            if (!tab || tab.status !== 'complete') throw new Error('Target conversation did not finish reloading for watchdog recovery');
            await waitForContentScriptReady(tabId, { timeoutMs: 8000, intervalMs: 200 });
            return send();
        }, recoveryPreferences);
    } catch (error) {
        return { ok:false, retryable:true, reason:'watchdog-reload-failed', error:error?.message || String(error) };
    } finally {
        watchdogReloadInFlight.delete(Number(tabId));
    }
}

async function ensureComposerReady(tabId) {
    const recoveryPreferences = await getRecoveryPreferences();
    if (!recoveryPreferences.autoRecoverySweep || !recoveryPreferences.backgroundWatchdog || !recoveryPreferences.composerWatchdog) {
        return { ok:true, ignored:true, reason:'composer-watchdog-disabled' };
    }
    const state = await getPlanState();
    const rawPlanState = state?.[`plan_${tabId}`];
    if (!rawPlanState || isFuturePlanState(rawPlanState)) return { ok:true, ignored:true, reason:'no-compatible-plan' };
    const planState = normalizePlanState(rawPlanState);
    if (!planState || planState.requiresRestart || planState.dispatchStatus === 'complete') return { ok:true, ignored:true, reason:'inactive-plan' };

    let health;
    try { health = await sendContentMessageWithWatchdog(tabId, { action:'GET_CODEE_DIAGNOSTICS' }, { recoveryPreferences, allowReload:false }); }
    catch (error) { health = { ok:false, reason:'content-unreachable', error:error?.message || String(error) }; }
    if (health?.ok && health.providerBusy) return { ok:true, busy:true, reason:'provider-busy' };
    if (health?.ok && health.composerFound) return { ok:true, composerFound:true };

    const result = await sendContentMessageWithWatchdog(tabId, { action:'PROBE_COMPOSER' }, { recoveryPreferences, allowReload:false });
    await recordDiagnosticEvent(result?.ok ? 'composer-recovered' : 'composer-recovery-failed', result?.ok ? 'success' : 'warning', tabId, {
        result: result?.reason || result?.error || (result?.ok ? 'composer-found' : 'unknown')
    }).catch(() => {});
    return result;
}

async function getPageSnapshot(tabId, expectedStepToken = '', options = {}) {
    const response = await sendContentMessageWithWatchdog(tabId, { action: 'GET_PAGE_STATE', expectedStepToken }, { allowReload: options.allowReload !== false });
    if (!response?.ok) {
        throw new Error(response?.error || 'Conversation content script is not ready');
    }

    return {
        versions: normalizeVersions(response.versions),
        artifacts: normalizeArtifacts(response.artifacts),
        hasSubmittedStepToken: Boolean(response.hasSubmittedStepToken),
        conversationIdentity: String(response.conversationIdentity || ''),
        structuredConversationIdentity: String(response.structuredConversationIdentity || ''),
        provisionalConversationIdentity: String(response.provisionalConversationIdentity || '')
    };
}

async function dispatchCurrentStep(tabId, suppliedPlanState = null, baselineVersions = null) {
    const state = suppliedPlanState ? null : await getPlanState();
    const planState = normalizePlanState(suppliedPlanState || state?.[`plan_${tabId}`]);

    if (!planState || planState.dispatchStatus === 'complete') {
        return { ok: false, error: 'No pending plan for this conversation' };
    }

    if (planState.stepIndex < 0 || planState.stepIndex >= planState.plan.length) {
        return { ok: false, error: 'Plan step is out of range' };
    }

    const lockKey = `${tabId}:${planState.planId}:${planState.stepIndex}`;
    if (dispatchLocks.has(lockKey)) {
        return { ok: false, busy: true, error: 'Step dispatch is already in progress' };
    }

    dispatchLocks.add(lockKey);

    try {
        planState.dispatchStatus = 'pending_send';

        if (cancelledPlanIds.has(planState.planId)) {
            return { ok: false, cancelled: true, error: 'Plan was stopped' };
        }

        const targetCheck = await validateTargetConversation(tabId, planState);

        if (planState.protocolMode === 'signature_v2') {
            const stepNumber = planState.stepIndex + 1;
            const expectedStepId = `step-${String(stepNumber).padStart(2, '0')}`;
            if (planState.currentStepId !== expectedStepId) {
                planState.currentStepId = expectedStepId;
                planState.currentStepToken = null;
            }
            if (!planState.currentStepToken) {
                planState.currentStepToken = createProtocolId('token');
            }
        }

        if (targetCheck.promoted) await updatePlanState(tabId, planState);

        const pageSnapshot = baselineVersions === null
            ? await getPageSnapshot(tabId, planState.currentStepToken || '')
            : (Array.isArray(baselineVersions)
                ? { versions: normalizeVersions(baselineVersions), artifacts: [], hasSubmittedStepToken: false }
                : {
                    versions: normalizeVersions(baselineVersions?.versions),
                    artifacts: normalizeArtifacts(baselineVersions?.artifacts),
                    hasSubmittedStepToken: Boolean(baselineVersions?.hasSubmittedStepToken)
                });

        mergeKnownVersions(planState, pageSnapshot.versions);
        mergeKnownArtifactHashes(planState, pageSnapshot.artifacts);

        if (planState.protocolMode === 'signature_v2' && planState.currentStepToken) {
            // A previous submission may have succeeded even if its acknowledgement was
            // lost. Reconcile a matching already-visible artifact before resending the
            // same step so retries are idempotent.
            const matchingExistingArtifact = pageSnapshot.artifacts.find(artifact =>
                validateArtifactIdentityForCurrentStep(planState, artifact).ok
            );
            if (matchingExistingArtifact) {
                if (String(matchingExistingArtifact.status || '').toLowerCase() === 'completed') {
                    planState.dispatchStatus = 'awaiting_artifact';
                }
                await updatePlanState(tabId, planState);
                return handleArtifactDetected(tabId, matchingExistingArtifact);
            }

            const receipt = planState.submissionReceipt;
            if (receipt && !planState.explicitRetryRequested
                && receipt.stepId === planState.currentStepId
                && receipt.stepToken === planState.currentStepToken) {
                planState.dispatchStatus = 'awaiting_artifact';
                await updatePlanState(tabId, planState);
                await notifyUI(tabId, planState, `Step ${planState.stepIndex + 1} has a durable submission receipt; waiting for its signed artifact…`);
                return { ok: true, reconciledSubmission: true, durableReceipt: true, stepNumber: planState.stepIndex + 1, dispatchStatus: planState.dispatchStatus };
            }

            // DOM evidence is recovery-only. The extension-owned submission receipt above
            // is authoritative once a positive provider user-message acknowledgement exists.
            if (pageSnapshot.hasSubmittedStepToken && !planState.explicitRetryRequested) {
                planState.dispatchStatus = 'awaiting_artifact';
                await updatePlanState(tabId, planState);
                await notifyUI(tabId, planState, `Step ${planState.stepIndex + 1} was already submitted; waiting for its signed artifact…`);
                return { ok: true, reconciledSubmission: true, stepNumber: planState.stepIndex + 1, dispatchStatus: planState.dispatchStatus };
            }
        }

        await updatePlanState(tabId, planState);

        const stepNumber = planState.stepIndex + 1;
        const dispatchPrompt = buildPrompt(planState);
        if (dispatchPrompt.length > MAX_DISPATCH_PROMPT_CHARS) {
            planState.dispatchStatus = 'blocked';
            planState.lastDispatchError = `Prepared prompt is too large (${dispatchPrompt.length} characters; maximum ${MAX_DISPATCH_PROMPT_CHARS})`;
            await updatePlanState(tabId, planState);
            return { ok: false, blocked: true, reason: 'prompt-too-large', error: planState.lastDispatchError };
        }
        const composerReady = await ensureComposerReady(tabId);
        if (composerReady?.reason === 'provider-busy') {
            return { ok: false, pending: true, retryable: true, reason: 'provider-busy', stepNumber, dispatchStatus: planState.dispatchStatus };
        }
        if (composerReady && composerReady.ok === false && !composerReady.ignored) {
            throw new Error(composerReady.error || composerReady.reason || 'Could not recover the target conversation composer');
        }
        // Focus/reload recovery may have changed page state. Revalidate the exact bound
        // conversation immediately before submission so recovery can never send elsewhere.
        await validateTargetConversation(tabId, planState);
        const response = await sendContentMessageWithWatchdog(tabId, {
            action: 'SEND_PROMPT',
            prompt: dispatchPrompt,
            stepNumber,
            tabId,
            planId: planState.planId,
            stepToken: planState.currentStepToken || ''
        }, { allowReload: true });

        if (!response?.ok) {
            throw new Error(response?.error || `Step ${stepNumber} was not accepted by the conversation`);
        }

        if (cancelledPlanIds.has(planState.planId)) {
            return { ok: false, cancelled: true, error: 'Plan was stopped after submission' };
        }

        const submittedAt = Date.now();
        const committed = await commitSuccessfulSubmission(tabId, planState, submittedAt);
        if (!committed?.ok) {
            const commitError = new Error(`Stale or missing plan state (${committed?.reason || 'submission-commit-failed'})`);
            commitError.code = 'CODEE_STALE_PLAN_STATE';
            throw commitError;
        }
        const committedPlanState = normalizePlanState(committed.planState);
        await recordDiagnosticEvent('step-submitted', 'success', tabId, {
            planId: committedPlanState.planId,
            step: stepNumber,
            dispatchStatus: committedPlanState.dispatchStatus,
            stepToken: committedPlanState.currentStepToken || ''
        }).catch(() => {});
        await notifyUI(tabId, committedPlanState, `Waiting for Step ${stepNumber} signed artifact…`);

        return { ok: true, stepNumber, dispatchStatus: committedPlanState.dispatchStatus };
    } catch (error) {
        if (cancelledPlanIds.has(planState.planId)) {
            return { ok: false, cancelled: true, error: 'Plan was stopped' };
        }

        const errorText = error?.message || String(error);
        const stepNumber = planState.stepIndex + 1;
        if (error?.code === 'CODEE_STALE_PLAN_STATE') {
            const latestState = await getPlanState();
            const latestPlan = normalizePlanState(latestState?.[`plan_${tabId}`]);
            await recordDiagnosticEvent('state-race-recovered', 'warning', tabId, {
                planId: planState.planId, step: stepNumber, error: errorText,
                latestStatus: latestPlan?.dispatchStatus || 'missing'
            }).catch(() => {});
            if (latestPlan) {
                await notifyUI(tabId, latestPlan, `Step ${latestPlan.stepIndex + 1} state changed during dispatch; recovery will reconcile it safely.`);
            }
            return {
                ok: false, pending: true, retryable: true, reason: 'state-race',
                stepNumber: latestPlan ? latestPlan.stepIndex + 1 : stepNumber,
                dispatchStatus: latestPlan?.dispatchStatus || 'unknown', error: errorText
            };
        }

        planState.deliveryRetryCount = Math.max(0, Number(planState.deliveryRetryCount) || 0) + 1;
        planState.lastDispatchError = errorText;
        if (planState.deliveryRetryCount > MAX_TRANSIENT_DELIVERY_RETRIES) {
            planState.dispatchStatus = 'blocked';
            planState.lastArtifactAction = 'needs_user';
            planState.nextRetryAt = 0;
        } else {
            planState.dispatchStatus = 'pending_send';
            planState.nextRetryAt = Date.now() + Math.min(15 * 60 * 1000, RETRY_BACKOFF_BASE_MS * (2 ** Math.max(0, planState.deliveryRetryCount - 1)));
        }
        await updatePlanState(tabId, planState);
        await recordDiagnosticEvent('step-dispatch-failed', 'error', tabId, {
            planId: planState.planId, step: stepNumber, error: errorText, stepToken: planState.currentStepToken || ''
        }).catch(() => {});

        await notifyUI(
            tabId,
            planState,
            planState.dispatchStatus === 'blocked' ? `Step ${stepNumber} delivery retry budget exhausted — user action required.` : `Step ${stepNumber} pending — Codee will retry with backoff.`
        );

        return {
            ok: false,
            stepNumber,
            pending: true,
            error: planState.lastDispatchError
        };
    } finally {
        dispatchLocks.delete(lockKey);
    }
}

async function handleStartOrRetry(tabId) {
    const state = await getPlanState();
    const rawPlanState = state?.[`plan_${tabId}`];
    if (isFuturePlanState(rawPlanState)) return getFutureStateHoldResult();
    const planState = normalizePlanState(rawPlanState);
    if (!planState) return { ok: false, error: 'No saved plan for this conversation' };

    if (planState.requiresRestart) {
        await updatePlanState(tabId, planState);
        const message = getRestartStatusMessage(planState);
        await notifyUI(tabId, planState, message);
        return { ok: false, requiresRestart: true, error: message };
    }

    try {
        await evaluateProductionPlanPreflight(tabId, planState);
        await updatePlanState(tabId, planState);
    } catch (error) {
        return { ok:false, preflight:true, error:`Production plan preflight failed: ${String(error?.message || error)}` };
    }
    if (planState.productionPreflight?.status === 'BLOCKED') {
        const codes = (planState.productionPreflight.blockers || []).map(item => item.code).slice(0,8).join(', ');
        await notifyUI(tabId, planState, `Plan blocked by production preflight: ${codes || 'requirements not ready'}`);
        return { ok:false, preflight:true, blocked:true, productionPreflight:planState.productionPreflight, error:`Production preflight BLOCKED: ${codes || 'requirements not ready'}` };
    }
    return dispatchCurrentStep(tabId, planState);
}

async function handleContentReady(tabId, visibleVersions = [], visibleArtifacts = [], liveUrl = '', liveProvisionalIdentity = '', liveConversationIdentity = '') {
    const rebindResult = await rebindOrphanedPlanToTab(tabId, liveUrl, liveProvisionalIdentity, liveConversationIdentity);
    const state = await getPlanState();
    const planState = normalizePlanState(state?.[`plan_${tabId}`]);
    if (!planState) return { ok: true, resumed: false, rebind: rebindResult };
    if (rebindResult?.rebound) {
        await notifyUI(tabId, planState, 'Plan rebound to the reopened conversation.');
    }

    const normalizedVisible = normalizeVersions(visibleVersions);
    const artifacts = normalizeArtifacts(visibleArtifacts);
    const knownBeforeReload = new Set(planState.knownVersions || []);
    const unseenVisible = normalizedVisible.filter(version => !knownBeforeReload.has(version));

    if (planState.requiresRestart) {
        mergeKnownVersions(planState, normalizedVisible);
        mergeKnownArtifactHashes(planState, artifacts);
        await updatePlanState(tabId, planState);
        const status = getRestartStatusMessage(planState);
        await notifyUI(tabId, planState, status);
        return { ok: false, resumed: false, requiresRestart: true, error: status };
    }

    if (planState.protocolMode === 'signature_v2') {
        if (planState.dispatchStatus === 'pending_send') {
            mergeKnownVersions(planState, normalizedVisible);
            mergeKnownArtifactHashes(planState, artifacts);
            await updatePlanState(tabId, planState);
            if (watchdogReloadInFlight.has(Number(tabId))) {
                return { ok:true, resumed:false, reason:'watchdog-reload-in-flight' };
            }
            // Query the fresh content script for this step token instead of reusing the
            // CONTENT_READY snapshot, which does not carry submission-ack evidence.
            if (planState.nextRetryAt && Date.now() < planState.nextRetryAt) return { ok: true, resumed: false, reason: 'retry-backoff', nextRetryAt: planState.nextRetryAt };
            return dispatchCurrentStep(tabId, planState);
        }

        if (planState.dispatchStatus === 'awaiting_artifact' || planState.dispatchStatus === 'blocked') {
            const matchingArtifacts = artifacts.filter(artifact => validateArtifactIdentityForCurrentStep(planState, artifact).ok);
            const matching = [...matchingArtifacts].reverse().find(artifact => String(artifact?.status || '').toLowerCase() === 'completed')
                || matchingArtifacts[matchingArtifacts.length - 1];
            if (matching) {
                const result = await handleArtifactDetected(tabId, matching);
                return {
                    ok: Boolean(result?.ok),
                    resumed: Boolean(result?.ok),
                    reconciled: Boolean(result?.ok),
                    sha256: matching.sha256,
                    blocked: Boolean(result?.blocked),
                    retry: Boolean(result?.retry)
                };
            }
        }

        mergeKnownVersions(planState, normalizedVisible);
        mergeKnownArtifactHashes(planState, artifacts);
        await updatePlanState(tabId, planState);
        return { ok: true, resumed: false, dispatchStatus: planState.dispatchStatus };
    }

    // Legacy ZIP-mode recovery retained for plans created before signature-v2.
    if (planState.dispatchStatus === 'pending_send') {
        mergeKnownVersions(planState, normalizedVisible);
        await updatePlanState(tabId, planState);
        return dispatchCurrentStep(tabId, planState, normalizedVisible);
    }

    if (planState.dispatchStatus === 'awaiting_zip' && unseenVisible.length > 0) {
        const completionVersion = unseenVisible[unseenVisible.length - 1];
        await handleZIPDetected(tabId, completionVersion);
        return { ok: true, resumed: true, reconciled: true, version: completionVersion };
    }

    mergeKnownVersions(planState, normalizedVisible);
    await updatePlanState(tabId, planState);
    return { ok: true, resumed: false, dispatchStatus: planState.dispatchStatus };
}

async function handleArtifactDetected(tabId, artifact) {
    const lockKey = JSON.stringify([tabId, artifact?.planId || '', artifact?.runId || '', artifact?.stepId || '', artifact?.stepToken || '']);
    if (artifactProcessingLocks.has(lockKey)) {
        return { ok: false, busy: true, retryable: true, reason: 'artifact-processing' };
    }
    artifactProcessingLocks.add(lockKey);

    try {
        const state = await getPlanState();
        const rawPlanState = state?.[`plan_${tabId}`];
        if (isFuturePlanState(rawPlanState)) return { ...getFutureStateHoldResult(), ignored: true, terminal: true, reason: 'future-state-version' };
        const planState = normalizePlanState(rawPlanState);
        if (!planState) return { ok: false, ignored: true, terminal: true, reason: 'no-plan' };

        if (planState.protocolMode !== 'signature_v2') {
            mergeKnownArtifactHashes(planState, [artifact]);
            await updatePlanState(tabId, planState);
            return { ok: false, ignored: true, terminal: true, reason: 'legacy-plan' };
        }

        const identity = validateArtifactIdentityForCurrentStep(planState, artifact);
        const reportedStatus = String(artifact?.status || '').toLowerCase();
        const reportedAction = String(artifact?.nextAction || '').toLowerCase();
        if (identity.ok && reportedStatus && reportedStatus !== 'completed') {
            const reportValidation = validateNonCompletedArtifactReport(reportedStatus, reportedAction);
            if (!reportValidation.ok) {
                mergeKnownArtifactHashes(planState, [artifact]);
                await updatePlanState(tabId, planState);
                await notifyUI(tabId, planState, `Artifact held: invalid non-completion signature (${reportValidation.reason}).`);
                return { ok: false, ignored: true, terminal: true, reason: `noncompletion-${reportValidation.reason}` };
            }

            mergeKnownArtifactHashes(planState, [artifact]);
            planState.lastArtifactStatus = reportedStatus;
            planState.lastArtifactAction = reportedAction;
            planState.lastArtifactMessage = String(artifact?.verification || '').trim();

            if (reportedAction === 'retry') {
                planState.logicalRetryCount = Math.max(0, Number(planState.logicalRetryCount) || 0) + 1;
                if (planState.logicalRetryCount > MAX_AUTOMATIC_LOGICAL_RETRIES) {
                    planState.dispatchStatus = 'blocked';
                    planState.lastArtifactAction = 'needs_user';
                    planState.nextRetryAt = 0;
                    delete planState.submissionReceipt;
                    await updatePlanState(tabId, planState);
                    await notifyUI(tabId, planState, `Step ${planState.stepIndex + 1} retry budget exhausted; user action required.`);
                    return { ok: true, handled: true, blocked: true, retryBudgetExhausted: true, status: reportedStatus, nextAction: 'needs_user' };
                }
                planState.dispatchStatus = 'pending_send';
                planState.currentStepToken = null;
                planState.explicitRetryRequested = true;
                planState.nextRetryAt = Date.now() + RETRY_BACKOFF_BASE_MS * planState.logicalRetryCount;
                delete planState.submissionReceipt;
                await updatePlanState(tabId, planState);
                await notifyUI(tabId, planState, `Step ${planState.stepIndex + 1} reported ${reportedStatus}; retry ${planState.logicalRetryCount}/${MAX_AUTOMATIC_LOGICAL_RETRIES} queued with backoff.`);
                return { ok: true, handled: true, retry: true, status: reportedStatus, retryCount: planState.logicalRetryCount };
            }

            planState.dispatchStatus = 'blocked';
            await updatePlanState(tabId, planState);
            const actionText = reportedAction === 'needs_user' ? 'user action required' : (reportedAction || 'held');
            await notifyUI(tabId, planState, `Step ${planState.stepIndex + 1} blocked: ${reportedStatus} (${actionText}).`);
            return { ok: true, handled: true, blocked: true, status: reportedStatus, nextAction: reportedAction };
        }

        const validation = validateArtifactForCurrentStep(planState, artifact);
        mergeKnownArtifactHashes(planState, [artifact]);

        if (!validation.ok) {
            planState.lastArtifactValidationReason = validation.reason || 'unknown';
            planState.lastArtifactSeenAt = Date.now();
            await updatePlanState(tabId, planState);
            await recordDiagnosticEvent('artifact-rejected', identity.ok ? 'warning' : 'info', tabId, {
                planId: planState.planId, step: planState.stepIndex + 1, reason: validation.reason || 'unknown',
                artifactPlanId: artifact?.planId || '', artifactStepId: artifact?.stepId || '', artifactStepToken: artifact?.stepToken || ''
            }).catch(() => {});
            if (identity.ok) {
                const reasonText = validation.reason === 'parent-sha256'
                    ? 'PARENT_SHA256 does not match the previous Codee artifact'
                    : `signature validation failed (${validation.reason})`;
                await notifyUI(tabId, planState, `Artifact held: ${reasonText}.`);
            }
            const retryable = validation.reason === 'not-awaiting-artifact';
            return retryable
                ? { ok: false, retryable: true, reason: validation.reason }
                : { ok: false, ignored: true, terminal: true, reason: validation.reason };
        }

        const hash = validation.hash;
        let artifactReceipt = null;
        if (requiresArtifactVerificationReceipt(planState)) {
            const receiptCheck = await verifyArtifactReceiptForCurrentStep(tabId, planState, artifact);
            if (!receiptCheck.ok) {
                planState.lastArtifactValidationReason = receiptCheck.reason || 'artifact-byte-verification';
                planState.lastArtifactSeenAt = Date.now();
                planState.dispatchStatus = 'blocked';
                await updatePlanState(tabId, planState);
                await recordDiagnosticEvent('artifact-byte-verification-held', 'warning', tabId, {
                    planId: planState.planId,
                    step: planState.stepIndex + 1,
                    sha256: hash,
                    zip: artifact?.zip || '',
                    reason: receiptCheck.reason || 'artifact-byte-verification'
                }).catch(() => {});
                await notifyUI(tabId, planState, `Artifact footer accepted, but actual ZIP verification is required (${receiptCheck.reason || 'verification unavailable'}).`);
                return { ok: false, retryable: true, reason: receiptCheck.reason || 'artifact-byte-verification' };
            }
            artifactReceipt = receiptCheck.receipt;
        }
        delete planState.lastArtifactValidationReason;
        planState.lastArtifactSeenAt = Date.now();
        if (artifactReceipt) planState.lastArtifactVerificationReceipt = artifactReceipt;
        await recordDiagnosticEvent('artifact-accepted', 'success', tabId, {
            planId: planState.planId, step: planState.stepIndex + 1, sha256: hash, zip: artifact?.zip || '', receiptId: artifactReceipt?.receiptId || ''
        }).catch(() => {});
        planState.consumedArtifactKeys = Array.from(new Set([
            ...(planState.consumedArtifactKeys || []),
            validation.consumptionKey
        ])).slice(-500);
        planState.consumedArtifactHashes = normalizeHashes([...(planState.consumedArtifactHashes || []), hash]).slice(-MAX_CONSUMED_ARTIFACT_HASHES);
        planState.lastArtifactSha256 = hash;
        planState.artifactHistory = [
            ...(planState.artifactHistory || []),
            {
                step: planState.stepIndex + 1,
                stepId: artifact.stepId || '',
                stepToken: artifact.stepToken || '',
                artifactId: artifact.artifactId || '',
                zip: artifact.zip,
                version: artifact.version || '',
                sha256: hash,
                parentSha256: artifact.parentSha256 || 'N/A',
                tests: artifact.tests || '',
                verification: artifact.verification || '',
                verificationReceipt: artifactReceipt || null,
                createdAt: artifact.createdAt || ''
            }
        ].slice(-MAX_ARTIFACT_HISTORY);

        if (artifact.version) {
            planState.versions = normalizeVersions([...(planState.versions || []), artifact.version]).slice(-MAX_VERSIONS);
        }

        const completedStepIndex = planState.stepIndex;
        const completedStepNumber = completedStepIndex + 1;

        if (completedStepIndex >= planState.plan.length - 1) {
            planState.dispatchStatus = 'complete';
            planState.completedAt = Date.now();
            delete planState.submissionReceipt;
            await updatePlanState(tabId, planState);
            await notifyUI(tabId, planState, 'Complete! Signed artifact verified.');
            try {
                await chrome.runtime.sendMessage({ action: 'PLAN_COMPLETE', tabId, planState });
            } catch (_error) {}
            const promoted = await promoteNextQueuedPlan(tabId, { dispatch:true });
            return { ok: true, complete: true, sha256: hash, queuePromotion: promoted };
        }

        planState.stepIndex = completedStepIndex + 1;
        planState.dispatchStatus = 'pending_send';
        planState.currentStepId = null;
        planState.currentStepToken = null;
        planState.logicalRetryCount = 0;
        planState.deliveryRetryCount = 0;
        planState.nextRetryAt = 0;
        delete planState.submissionReceipt;
        await updatePlanState(tabId, planState);
        await notifyUI(tabId, planState, `Step ${completedStepNumber} signed artifact verified. Sending Step ${planState.stepIndex + 1}…`);

        const dispatchResult = await dispatchCurrentStep(tabId, planState);
        return {
            ok: true,
            advanced: true,
            sha256: hash,
            nextStepDispatched: Boolean(dispatchResult?.ok),
            pending: Boolean(dispatchResult?.pending)
        };
    } finally {
        artifactProcessingLocks.delete(lockKey);
    }
}

async function handleZIPDetected(tabId, version) {
    const normalizedVersion = String(version || '').trim();
    if (!normalizedVersion) return;

    const state = await getPlanState();
    const rawPlanState = state?.[`plan_${tabId}`];
    if (isFuturePlanState(rawPlanState)) return getFutureStateHoldResult();
    const planState = normalizePlanState(rawPlanState);

    if (!planState) {
        console.log('[Codee] No active plan for tab', tabId, '- ignoring ZIP', normalizedVersion);
        return;
    }

    if (planState.protocolMode === 'signature_v2') {
        // Signature-v2 plans derive version/history from the canonical artifact footer.
        // Do not mutate plan state for the legacy ZIP signal: content scans deliver ZIP
        // and artifact events concurrently, and this redundant write can race the real
        // artifact advancement and strand the next step on a stale state revision.
        console.log('[Codee] Legacy ZIP/version ignored in signature-v2 mode:', normalizedVersion);
        return { ok: true, ignored: true, terminal: true, reason: 'signature-mode' };
    }

    if (planState.requiresRestart) {
        mergeKnownVersions(planState, [normalizedVersion]);
        await updatePlanState(tabId, planState);
        console.log('[Codee] Legacy plan is held for restart; ZIP cannot advance it:', normalizedVersion);
        return;
    }

    if ((planState.knownVersions || []).includes(normalizedVersion)) {
        console.log('[Codee] Previously observed ZIP ignored on tab', tabId, ':', normalizedVersion);
        return;
    }

    // A ZIP can complete a step only after that step has been positively delivered.
    // While delivery is pending, record the ZIP only as page baseline so a reload or
    // unrelated old artifact can never skip the current step.
    if (planState.dispatchStatus !== 'awaiting_zip') {
        mergeKnownVersions(planState, [normalizedVersion]);
        await updatePlanState(tabId, planState);
        console.log('[Codee] ZIP observed while step delivery is pending; not advancing:', normalizedVersion);
        return;
    }

    mergeKnownVersions(planState, [normalizedVersion]);
    const versions = normalizeVersions([...(planState.versions || []), normalizedVersion]).slice(-MAX_VERSIONS);
    planState.versions = versions;

    const completedStepIndex = planState.stepIndex;
    const completedStepNumber = completedStepIndex + 1;

    if (completedStepIndex >= planState.plan.length - 1) {
        planState.dispatchStatus = 'complete';
        await updatePlanState(tabId, planState);
        await notifyUI(tabId, planState, 'Complete!');

        try {
            await chrome.runtime.sendMessage({
                action: 'PLAN_COMPLETE',
                tabId,
                planState
            });
        } catch (_error) {}
        await promoteNextQueuedPlan(tabId, { dispatch:true });
        return;
    }

    planState.stepIndex = completedStepIndex + 1;
    planState.dispatchStatus = 'pending_send';
    await updatePlanState(tabId, planState);
    await notifyUI(tabId, planState, `Step ${completedStepNumber} complete. Sending Step ${planState.stepIndex + 1}…`);

    await dispatchCurrentStep(tabId, planState);
}

async function retryPendingPlanOnTab(tabId) {
    const state = await getPlanState();
    const rawPlanState = state?.[`plan_${tabId}`];
    if (isFuturePlanState(rawPlanState)) return { ...getFutureStateHoldResult(), ignored: true, reason: 'future-state-version' };
    const planState = normalizePlanState(rawPlanState);
    if (!planState) return { ok: false, ignored: true, reason: 'no-plan' };
    if (planState.requiresRestart) return { ok: false, ignored: true, reason: 'requires-restart' };
    if (planState.dispatchStatus !== 'pending_send') {
        return { ok: false, ignored: true, reason: 'not-pending-send' };
    }
    if (planState.nextRetryAt && Date.now() < planState.nextRetryAt) {
        return { ok: false, ignored: true, reason: 'retry-backoff', nextRetryAt: planState.nextRetryAt };
    }
    return dispatchCurrentStep(tabId, planState);
}

function normalizeNextRunnerInterval(value) {
    const minutes = Number(value);
    if (!Number.isFinite(minutes)) return NEXT_RUNNER_DEFAULT_MINUTES;
    return Math.max(NEXT_RUNNER_MIN_MINUTES, Math.min(NEXT_RUNNER_MAX_MINUTES, Math.round(minutes * 10) / 10));
}

function nextRunnerAlarmName(tabId) { return `${NEXT_RUNNER_ALARM_PREFIX}${tabId}`; }

async function readNextRunnerState() {
    const stored = await chrome.storage.local.get([NEXT_RUNNER_STORAGE_KEY]);
    return stored?.[NEXT_RUNNER_STORAGE_KEY] && typeof stored[NEXT_RUNNER_STORAGE_KEY] === 'object'
        ? stored[NEXT_RUNNER_STORAGE_KEY]
        : {};
}

async function writeNextRunnerState(state) {
    await chrome.storage.local.set({ [NEXT_RUNNER_STORAGE_KEY]: state || {} });
}

async function getNextRunnerStatus(tabId) {
    const state = await readNextRunnerState();
    const item = state[String(tabId)] || {};
    let alarm = null;
    try { alarm = typeof chrome.alarms?.get === 'function' ? await chrome.alarms.get(nextRunnerAlarmName(tabId)) : null; } catch {}
    const enabled = Boolean(item.enabled);
    const lastResult = String(item.lastResult || '');
    const degraded = enabled && /content-unreachable|receiving end does not exist|could not establish connection|content-script-recovery-failed|target-tab-unavailable/i.test(lastResult);
    return {
        ok: true,
        tabId,
        enabled,
        healthState: enabled ? (degraded ? 'degraded' : 'running') : 'stopped',
        intervalMinutes: normalizeNextRunnerInterval(item.intervalMinutes),
        lastAttemptAt: Number(item.lastAttemptAt) || null,
        lastSentAt: Number(item.lastSentAt) || null,
        lastResult,
        sentCount: Number(item.sentCount) || 0,
        failedCount: Number(item.failedCount) || 0,
        deferredCount: Number(item.deferredCount) || 0,
        attemptCount: Number(item.attemptCount) || 0,
        lastOutcome: String(item.lastOutcome || ''),
        lastDiagnostic: item.lastDiagnostic && typeof item.lastDiagnostic === 'object' ? { ...item.lastDiagnostic } : null,
        nextDueAt: Number(alarm?.scheduledTime) || Number(item.nextDueAt) || null,
        target: item.target && typeof item.target === 'object' ? { ...item.target } : null
    };
}

async function getAllNextRunnerStatuses() {
    const state = await readNextRunnerState();
    const runners = [];
    for (const key of Object.keys(state || {})) {
        const tabId = Number(key);
        if (!Number.isInteger(tabId)) continue;
        const status = await getNextRunnerStatus(tabId);
        if (status?.enabled) runners.push(status);
    }
    runners.sort((a,b) => (Number(a.nextDueAt)||0) - (Number(b.nextDueAt)||0));
    return { ok:true, runners };
}

async function notifyNextRunnerUpdated(tabId) {
    let status = null;
    try { status = await getNextRunnerStatus(tabId); } catch {}
    try { await chrome.runtime.sendMessage({ action:'NEXT_RUNNER_UPDATED', tabId, status }); } catch {}
    return status;
}

async function captureNextRunnerTarget(tabId) {
    const tab = await chrome.tabs.get(tabId);
    const url = String(tab?.url || '');
    const provider = getSupportedProviderKey(url);
    if (!provider) return { ok:false, reason:'unsupported-target', error:'Select a ChatGPT or Claude conversation.' };
    const live = await getLiveConversationIdentityForTab(tabId, url);
    const conversationIdentity = String(live?.conversationIdentity || live?.structuredIdentity || live?.provisionalIdentity || '').trim();
    if (!conversationIdentity) return { ok:false, reason:'conversation-identity-unavailable', error:'Could not bind the Next Runner to this exact conversation.' };
    return {
        ok:true,
        target:{
            tabId,
            url,
            provider,
            conversationIdentity,
            title:String(tab?.title || '').slice(0,300)
        }
    };
}

async function verifyNextRunnerTarget(tabId, savedTarget) {
    if (!savedTarget || typeof savedTarget !== 'object') return { ok:false, reason:'target-not-bound', error:'Next Runner target is not bound. Start it again from the intended conversation.' };
    let tab;
    try { tab = await chrome.tabs.get(tabId); }
    catch (error) { return { ok:false, reason:'target-tab-unavailable', error:error?.message || 'Target tab is unavailable.' }; }
    const liveUrl = String(tab?.url || '');
    const liveProvider = getSupportedProviderKey(liveUrl);
    const expectedProvider = String(savedTarget.provider || getSupportedProviderKey(savedTarget.url || '') || '');
    if (!liveProvider || (expectedProvider && liveProvider !== expectedProvider)) {
        return { ok:false, reason:'target-provider-mismatch', error:'The bound tab is no longer showing the intended AI provider conversation.' };
    }
    const live = await getLiveConversationIdentityForTab(tabId, liveUrl);
    const liveIdentity = String(live?.conversationIdentity || live?.structuredIdentity || live?.provisionalIdentity || '').trim();
    const expectedIdentity = String(savedTarget.conversationIdentity || '').trim();
    if (!expectedIdentity || !liveIdentity || liveIdentity !== expectedIdentity) {
        return { ok:false, reason:'target-conversation-mismatch', error:'The bound tab is now showing a different conversation. No “next” was sent.' };
    }
    return { ok:true, tabId, tab, liveUrl, liveIdentity, source:'bound-tab' };
}

function isNextRunnerSafeDeferral(response) {
    const reason = String(response?.reason || '');
    return Boolean(response?.skipped) && /^(composer-not-empty|provider-busy|composer-not-found|not-accepted|content-unreachable|target-tab-unavailable|target-conversation-mismatch|target-provider-mismatch|target-not-open|target-recovery-pending)$/i.test(reason);
}

function buildNextRunnerDiagnostic(response, context = {}) {
    const ok = Boolean(response?.ok);
    const deferred = !ok && isNextRunnerSafeDeferral(response);
    return {
        outcome: ok ? 'sent' : (deferred ? 'deferred' : 'failed'),
        reason: ok ? 'sent' : String(response?.reason || response?.error || 'unknown'),
        retryable: Boolean(response?.retryable || deferred),
        source: String(context.source || response?.source || ''),
        requestedTabId: Number.isInteger(context.requestedTabId) ? context.requestedTabId : null,
        resolvedTabId: Number.isInteger(context.resolvedTabId) ? context.resolvedTabId : null,
        expectedConversationIdentity: String(context.expectedConversationIdentity || ''),
        observedConversationIdentity: String(context.observedConversationIdentity || ''),
        expectedProvider: String(context.expectedProvider || ''),
        observedProvider: String(context.observedProvider || ''),
        error: String(response?.error || '').slice(0,600),
        at: Date.now()
    };
}

async function resolveNextRunnerTarget(requestedTabId, savedTarget) {
    if (!savedTarget || typeof savedTarget !== 'object') {
        return { ok:false, reason:'target-not-bound', error:'Next Runner target is not bound. Start it again from the intended conversation.' };
    }
    const expectedIdentity = String(savedTarget.conversationIdentity || getStructuredConversationIdentity(savedTarget.url || '') || '').trim();
    const expectedProvider = String(savedTarget.provider || getSupportedProviderKey(savedTarget.url || '') || getConversationIdentityProvider(expectedIdentity) || '').trim();
    if (!expectedIdentity || !expectedProvider) {
        return { ok:false, reason:'target-identity-incomplete', error:'The saved Next Runner binding is missing an exact provider/conversation identity.' };
    }

    const direct = await verifyNextRunnerTarget(requestedTabId, savedTarget).catch(error => ({ ok:false, reason:'target-tab-unavailable', error:error?.message || String(error) }));
    if (direct?.ok) return direct;

    let candidates = [];
    try { candidates = await queryTabs({ url:['*://chatgpt.com/*', '*://claude.ai/*'] }); } catch {}
    for (const candidate of candidates) {
        if (!Number.isInteger(candidate?.id) || candidate.id === requestedTabId) continue;
        const provider = getSupportedProviderKey(candidate.url || '');
        if (provider !== expectedProvider) continue;
        const structuredIdentity = getStructuredConversationIdentity(candidate.url || '');
        if (structuredIdentity && structuredIdentity !== expectedIdentity) continue;
        const live = await getLiveConversationIdentityForTab(candidate.id, candidate.url || '').catch(() => null);
        const liveIdentity = String(live?.conversationIdentity || live?.structuredIdentity || live?.provisionalIdentity || '').trim();
        if (liveIdentity === expectedIdentity) {
            return { ok:true, tabId:candidate.id, tab:candidate, liveUrl:String(candidate.url || ''), liveIdentity, source:'existing-target-tab', recoveredFrom:direct?.reason || '' };
        }
    }

    const canonicalUrl = String(savedTarget.url || '').trim();
    if (canonicalUrl && getStructuredConversationIdentity(canonicalUrl) === expectedIdentity && typeof chrome.tabs?.create === 'function') {
        try {
            const created = await chrome.tabs.create({ url:canonicalUrl, active:false });
            if (Number.isInteger(created?.id)) {
                await waitForRunnableConversationTab(created.id, true).catch(() => created);
                const verified = await verifyNextRunnerTarget(created.id, savedTarget).catch(() => null);
                if (verified?.ok) return { ...verified, source:'opened-target-tab', recoveredFrom:direct?.reason || '' };
            }
        } catch (_error) {}
    }

    return {
        ok:false,
        skipped:true,
        retryable:true,
        reason: direct?.reason === 'target-conversation-mismatch' ? 'target-not-open' : (direct?.reason || 'target-not-open'),
        error: direct?.reason === 'target-conversation-mismatch'
            ? 'The bound tab is showing another conversation and the exact saved target is not currently available. No “next” was sent.'
            : (direct?.error || 'The exact saved target conversation is not currently available.'),
        expectedIdentity,
        expectedProvider
    };
}

async function sendStandaloneNext(tabId) {
    const stateBefore = await readNextRunnerState();
    const bound = stateBefore[String(tabId)] || {};
    const targetCheck = await resolveNextRunnerTarget(tabId, bound.target);
    let response;
    const resolvedTabId = Number.isInteger(targetCheck?.tabId) ? targetCheck.tabId : tabId;
    if (!targetCheck.ok) {
        // A failed/deferred tick must never silently stop/delete an already-running timed plan.
        // Keep the exact target binding and retry on the next alarm; resolution never authorizes
        // a different conversation merely because it is the active tab.
        response = { ok:false, skipped:true, retryable:true, reason:targetCheck.reason, error:targetCheck.error, source:targetCheck.source || '' };
    } else {
        const receiver = await ensureNextRunnerReceiverReady(resolvedTabId);
        if (!receiver?.ok) {
            response = { ok:false, skipped:true, retryable:true, reason:receiver?.reason || 'content-unreachable', error:receiver?.error || 'Conversation receiver is unavailable.', source:targetCheck.source || '' };
        } else try {
            response = await withRunnableConversationTab(resolvedTabId, () =>
                sendContentMessageWithWatchdog(resolvedTabId, { action:'SEND_NEXT_NUDGE', text:'next' }, { allowReload:false, recoverMissingReceiver:true })
            );
            if (response && typeof response === 'object' && !response.source) response.source = targetCheck.source || '';
        } catch (error) {
            response = { ok:false, skipped:true, retryable:true, reason:'content-unreachable', error:error?.message || String(error), source:targetCheck.source || '' };
        }
    }
    const now = Date.now();
    const state = await readNextRunnerState();
    const key = String(tabId);
    const previous = state[key] || {};
    const deferred = !response?.ok && isNextRunnerSafeDeferral(response);
    const diagnostic = buildNextRunnerDiagnostic(response, {
        requestedTabId: tabId,
        resolvedTabId,
        source: targetCheck?.source || response?.source || '',
        expectedConversationIdentity: bound?.target?.conversationIdentity || '',
        observedConversationIdentity: targetCheck?.liveIdentity || '',
        expectedProvider: bound?.target?.provider || '',
        observedProvider: targetCheck?.liveUrl ? getSupportedProviderKey(targetCheck.liveUrl) : ''
    });
    state[key] = {
        ...previous,
        enabled: Boolean(previous.enabled),
        nextDueAt: previous.nextDueAt,
        lastAttemptAt: now,
        lastSentAt: response?.ok ? now : (Number(previous.lastSentAt) || null),
        attemptCount: (Number(previous.attemptCount) || 0) + 1,
        sentCount: (Number(previous.sentCount) || 0) + (response?.ok ? 1 : 0),
        deferredCount: (Number(previous.deferredCount) || 0) + (deferred ? 1 : 0),
        failedCount: (Number(previous.failedCount) || 0) + ((!response?.ok && !deferred) ? 1 : 0),
        lastResult: response?.ok ? 'sent' : String(response?.reason || response?.error || 'skipped').slice(0,300),
        lastOutcome: diagnostic.outcome,
        lastDiagnostic: diagnostic
    };
    await writeNextRunnerState(state);
    const eventType = response?.ok ? 'next-runner-sent' : (deferred ? 'next-runner-deferred' : 'next-runner-failed');
    const severity = response?.ok ? 'success' : (deferred ? 'info' : 'warning');
    await recordDiagnosticEvent(eventType, severity, tabId, diagnostic).catch(() => {});
    return { ok:Boolean(response?.ok), sent:Boolean(response?.ok), deferred, skipped:Boolean(response?.skipped), reason:response?.reason || '', error:response?.error || '', diagnostic };
}

async function scheduleNextRunnerAlarm(tabId, intervalMinutes) {
    const minutes = normalizeNextRunnerInterval(intervalMinutes);
    const name = nextRunnerAlarmName(tabId);
    try { await chrome.alarms.clear(name); } catch {}
    await chrome.alarms.create(name, { delayInMinutes:minutes, periodInMinutes:minutes });
    return Date.now() + minutes * 60 * 1000;
}

async function startNextRunner(tabId, intervalMinutes) {
    const minutes = normalizeNextRunnerInterval(intervalMinutes);
    const captured = await captureNextRunnerTarget(tabId);
    if (!captured.ok) {
        // A failed re-bind must not imply that an already-running timer was stopped.
        const existing = await getNextRunnerStatus(tabId).catch(() => null);
        return {
            ...(existing || {}),
            ok:false,
            intervalMinutes:minutes,
            error:captured.error || 'Could not bind target conversation.',
            reason:captured.reason || 'target-bind-failed'
        };
    }
    const state = await readNextRunnerState();
    const key = String(tabId);
    state[key] = { ...(state[key] || {}), enabled:true, intervalMinutes:minutes, startedAt:Date.now(), stoppedAt:null, lastResult:'', lastOutcome:'', lastDiagnostic:null, sentCount:0, deferredCount:0, failedCount:0, attemptCount:0, lastAttemptAt:null, lastSentAt:null, nextDueAt:null, target:captured.target };
    await writeNextRunnerState(state);

    // Starting arms the timed runner. The immediate send is best-effort: temporary
    // provider/content failures are recorded and retried by the timer, not treated as Stop.
    const immediate = await sendStandaloneNext(tabId);
    const nextDueAt = await scheduleNextRunnerAlarm(tabId, minutes);
    const after = await readNextRunnerState();
    after[key] = { ...(after[key] || {}), enabled:true, intervalMinutes:minutes, nextDueAt };
    await writeNextRunnerState(after);
    const status = await notifyNextRunnerUpdated(tabId) || await getNextRunnerStatus(tabId);
    return {
        ...status,
        ok:true,
        enabled:true,
        healthState: immediate?.sent ? (status?.healthState || 'running') : (immediate?.deferred ? 'running' : 'degraded'),
        immediate,
        initialDeliveryVerified:Boolean(immediate?.sent),
        initialPending:!immediate?.sent,
        reason:immediate?.sent ? '' : (immediate?.reason || 'initial-next-deferred')
    };
}

async function updateNextRunnerInterval(tabId, intervalMinutes) {
    const minutes = normalizeNextRunnerInterval(intervalMinutes);
    const state = await readNextRunnerState();
    const key = String(tabId);
    const current = state[key] || {};
    const enabled = Boolean(current.enabled);
    let nextDueAt = null;
    if (enabled) nextDueAt = await scheduleNextRunnerAlarm(tabId, minutes);
    state[key] = { ...current, intervalMinutes:minutes, nextDueAt:enabled ? nextDueAt : null };
    await writeNextRunnerState(state);
    await notifyNextRunnerUpdated(tabId);
    return getNextRunnerStatus(tabId);
}

async function stopNextRunner(tabId) {
    try { await chrome.alarms.clear(nextRunnerAlarmName(tabId)); } catch {}
    const state = await readNextRunnerState();
    const key = String(tabId);
    const current = state[key] || {};
    state[key] = { ...current, enabled:false, nextDueAt:null, stoppedAt:Date.now() };
    await writeNextRunnerState(state);
    await notifyNextRunnerUpdated(tabId);
    return getNextRunnerStatus(tabId);
}

async function handleNextRunnerAlarm(alarm) {
    if (!alarm?.name?.startsWith(NEXT_RUNNER_ALARM_PREFIX)) return false;
    const tabId = Number(alarm.name.slice(NEXT_RUNNER_ALARM_PREFIX.length));
    if (!Number.isInteger(tabId)) return true;
    const status = await getNextRunnerStatus(tabId);
    if (!status.enabled) { try { await chrome.alarms.clear(alarm.name); } catch {} return true; }
    const result = await sendStandaloneNext(tabId);
    const state = await readNextRunnerState();
    const key = String(tabId);
    if (state[key]?.enabled) {
        state[key] = { ...state[key], nextDueAt:Date.now() + normalizeNextRunnerInterval(state[key].intervalMinutes) * 60 * 1000 };
        await writeNextRunnerState(state);
    }
    await notifyNextRunnerUpdated(tabId);
    return { handled:true, result };
}

async function restoreNextRunnerAlarms() {
    const state = await readNextRunnerState();
    for (const [key, item] of Object.entries(state)) {
        const tabId = Number(key);
        if (!Number.isInteger(tabId) || !item?.enabled) continue;
        try {
            await chrome.tabs.get(tabId);
            const nextDueAt = await scheduleNextRunnerAlarm(tabId, item.intervalMinutes);
            state[key] = { ...item, enabled:true, nextDueAt };
        } catch {
            // Preserve the user's active timed plan even if its tab is temporarily
            // unavailable during extension/browser startup. Explicit Stop owns shutdown.
            const nextDueAt = await scheduleNextRunnerAlarm(tabId, item.intervalMinutes).catch(() => Number(item.nextDueAt) || null);
            state[key] = { ...item, enabled:true, nextDueAt, lastResult:'target-tab-unavailable' };
        }
    }
    await writeNextRunnerState(state);
}

function getNextNudgeDueAt(planState) {
    if (!planState?.nextNudgerEnabled || planState.dispatchStatus !== 'awaiting_artifact') return null;
    const submittedAt = Number(planState.lastDispatchedAt) || 0;
    if (submittedAt <= 0) return null;
    const sameStep = String(planState.lastNextNudgeStepId || '') === String(planState.currentStepId || '');
    const lastAttemptAt = sameStep ? (Number(planState.lastNextNudgeAttemptAt) || 0) : 0;
    return Math.max(submittedAt, lastAttemptAt) + NEXT_NUDGE_INTERVAL_MS;
}

async function setNextNudgerEnabled(tabId, enabled) {
    const recoveryPreferences = await getRecoveryPreferences();
    if (enabled && !recoveryPreferences.nextNudgerFeatureEnabled) return { ok:false, error:'5-minute Next nudger is disabled in Settings' };
    return mutatePlanState(state => {
        const key = `plan_${tabId}`;
        const raw = state[key];
        if (!raw) return { ok:false, error:'No saved plan for this tab' };
        if (isFuturePlanState(raw)) return getFutureStateHoldResult();
        const planState = normalizePlanState(raw);
        if (planState.dispatchStatus === 'complete') return { ok:false, error:'Plan is already complete' };
        planState.nextNudgerEnabled = Boolean(enabled);
        if (!planState.nextNudgerEnabled) planState.lastNextNudgeError = '';
        planState.stateRevision = (Number(planState.stateRevision) || 0) + 1;
        state[key] = planState;
        return { ok:true, enabled:planState.nextNudgerEnabled, dueAt:getNextNudgeDueAt(planState) };
    });
}

async function attemptNextNudge(tabId, now = Date.now()) {
    const recoveryPreferences = await getRecoveryPreferences();
    if (!recoveryPreferences.nextNudgerFeatureEnabled) return { ok:true, enabled:false, due:false, reason:'next-nudger-disabled-in-settings' };
    const lockKey = String(tabId);
    if (nextNudgeLocks.has(lockKey)) return { ok:false, busy:true, reason:'nudge-in-flight' };
    nextNudgeLocks.add(lockKey);
    try {
        const state = await getPlanState();
        const raw = state?.[`plan_${tabId}`];
        if (!raw || isFuturePlanState(raw)) return { ok:false, ignored:true, reason:'no-compatible-plan' };
        const planState = normalizePlanState(raw);
        const dueAt = getNextNudgeDueAt(planState);
        if (!planState.nextNudgerEnabled) return { ok:true, enabled:false, due:false };
        if (planState.dispatchStatus !== 'awaiting_artifact') return { ok:true, enabled:true, due:false, reason:'not-awaiting-artifact' };
        if (!dueAt || Number(now) < dueAt) return { ok:true, enabled:true, due:false, dueAt };

        const identity = { planId:planState.planId, runId:planState.runId, stepId:planState.currentStepId, stepToken:planState.currentStepToken };
        let response;
        try { response = await sendContentMessageWithWatchdog(tabId, { action:'SEND_NEXT_NUDGE', text:'next' }, { allowReload:false, recoverMissingReceiver:true }); }
        catch (error) { response = { ok:false, retryable:true, reason:'content-unreachable', error:error?.message || String(error) }; }

        const attemptedAt = Number(now) || Date.now();
        const mutation = await mutatePlanState(stateNow => {
            const key = `plan_${tabId}`;
            const currentRaw = stateNow[key];
            if (!currentRaw || isFuturePlanState(currentRaw)) return { ok:false, stale:true, reason:'plan-changed' };
            const current = normalizePlanState(currentRaw);
            const sameIdentity = current.planId === identity.planId && current.runId === identity.runId && current.currentStepId === identity.stepId && current.currentStepToken === identity.stepToken && current.dispatchStatus === 'awaiting_artifact';
            if (!sameIdentity) return { ok:false, stale:true, reason:'step-changed' };
            current.lastNextNudgeAttemptAt = attemptedAt;
            current.lastNextNudgeStepId = current.currentStepId || '';
            current.lastNextNudgeError = response?.ok ? '' : String(response?.error || response?.reason || 'nudge failed').slice(0,600);
            if (response?.ok) current.lastNextNudgeSentAt = attemptedAt;
            current.stateRevision = (Number(current.stateRevision) || 0) + 1;
            stateNow[key] = current;
            return { ok:true, planState:current };
        });
        if (!mutation?.ok) return { ok:false, stale:true, reason:mutation?.reason || 'step-changed' };
        await recordDiagnosticEvent(response?.ok ? 'next-nudge-sent' : 'next-nudge-skipped', response?.ok ? 'success' : 'warning', tabId, { planId:identity.planId, stepId:identity.stepId || '', stepToken:identity.stepToken || '', result:response?.reason || response?.error || 'sent' }).catch(() => {});
        return { ok:Boolean(response?.ok), enabled:true, due:true, sent:Boolean(response?.ok), skipped:Boolean(response?.skipped), reason:response?.reason || '', error:response?.error || '', nextDueAt:attemptedAt + NEXT_NUDGE_INTERVAL_MS };
    } finally { nextNudgeLocks.delete(lockKey); }
}

// Poll all supported conversation tabs once per minute. Do not recreate an existing
// alarm on every service-worker wake: chrome.alarms.create() replaces same-name alarms,
// which would otherwise keep postponing the recovery sweep.
async function ensureRecoveryAlarm() {
    if (recoveryAlarmEnsurePromise) return recoveryAlarmEnsurePromise;

    // Older/test alarm shims expose create() but not get(). Register synchronously in
    // that reduced API shape so the one-minute recovery contract is not lost simply
    // because alarm introspection is unavailable. Real Chrome exposes alarms.get(),
    // where we preserve the no-reset-on-worker-wake behavior below.
    if (typeof chrome.alarms?.get !== 'function') {
        chrome.alarms?.create?.('ZIP_POLL', { periodInMinutes:1 });
        return { enabled:true, introspectionUnavailable:true };
    }

    recoveryAlarmEnsurePromise = (async () => {
        const recoveryPreferences = await getRecoveryPreferences();
        if (!recoveryPreferences.autoRecoverySweep) {
            if (typeof chrome.alarms?.clear === 'function') await chrome.alarms.clear('ZIP_POLL');
            return { enabled:false };
        }
        const existing = await chrome.alarms.get('ZIP_POLL');
        if (existing && Number(existing.periodInMinutes) === 1) return existing;
        await chrome.alarms.create('ZIP_POLL', { periodInMinutes:1 });
        return { enabled:true };
    })().finally(() => { recoveryAlarmEnsurePromise = null; });
    return recoveryAlarmEnsurePromise;
}

async function reconcileRecoveryAlarm() { return ensureRecoveryAlarm(); }

const ensureRecoveryAlarmSafely = () => ensureRecoveryAlarm()
    .catch(error => console.warn('[Codee] Could not ensure recovery alarm:', error));

ensureRecoveryAlarmSafely();
if (typeof chrome.runtime?.onStartup?.addListener === 'function') {
    chrome.runtime.onStartup.addListener(ensureRecoveryAlarmSafely);
    chrome.runtime.onStartup.addListener(() => restoreNextRunnerAlarms().catch(error => console.warn('[Codee] Could not restore Next Runner alarms:', error)));
}
if (typeof chrome.runtime?.onInstalled?.addListener === 'function') {
    chrome.runtime.onInstalled.addListener(ensureRecoveryAlarmSafely);
    chrome.runtime.onInstalled.addListener(() => restoreNextRunnerAlarms().catch(error => console.warn('[Codee] Could not restore Next Runner alarms:', error)));
}

ensureManagerAIWatchAlarm().catch(error=>console.warn('[Codee] Could not ensure Manager AI watch alarm:',error));

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm?.name?.startsWith(NEXT_RUNNER_ALARM_PREFIX)) {
        handleNextRunnerAlarm(alarm).catch(error => console.warn('[Codee] Next Runner alarm failed:', error));
        return;
    }
    if (alarm.name === MANAGER_AI_WATCH_ALARM) {
        managerAIWatchSweep();
        return;
    }
    if (alarm.name === 'ZIP_POLL') {
        checkForZIPsOnAllTabs().catch(error => console.warn('[Codee] Recovery sweep failed:', error));
    }
});

function queryTabs(query) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = tabs => {
            if (settled) return;
            settled = true;
            resolve(Array.isArray(tabs) ? tabs : []);
        };
        try {
            const maybePromise = chrome.tabs.query(query, finish);
            if (maybePromise && typeof maybePromise.then === 'function') {
                maybePromise.then(finish).catch(reject);
            }
        } catch (error) {
            reject(error);
        }
    });
}

async function checkForZIPsOnAllTabs() {
    const tabsPromise = queryTabs({ url: ['*://chatgpt.com/*', '*://claude.ai/*'] });
    const recoveryPreferences = await getRecoveryPreferences();
    const tabs = await tabsPromise;
    if (!recoveryPreferences.autoRecoverySweep) return { ok:true, skipped:true, reason:'recovery-sweep-disabled' };
    const planState = await getPlanState();
    const activeTabIds = new Set(Object.entries(planState || {})
        .filter(([key, raw]) => key.startsWith('plan_') && raw && raw.dispatchStatus !== 'complete')
        .map(([key]) => Number(key.slice(5))).filter(Number.isInteger));
    await Promise.allSettled(tabs.filter(tab => Number.isInteger(tab.id) && activeTabIds.has(tab.id)).map(async tab => {
        const rawPlan = planState?.[`plan_${tab.id}`];
        if (!rawPlan || isFuturePlanState(rawPlan)) return;
        const activePlan = normalizePlanState(rawPlan);
        if (!activePlan || activePlan.requiresRestart || activePlan.dispatchStatus === 'complete') return;

        // pending_send owns its own page snapshot + composer recovery path. Running a
        // separate scan/composer watchdog first duplicates recovery and can create reload
        // races. Respect delivery backoff and let dispatchCurrentStep reconcile artifacts.
        if (activePlan.dispatchStatus === 'pending_send') {
            await retryPendingPlanOnTab(tab.id).catch(() => {});
            return;
        }

        // While waiting for an artifact/ZIP, never reload merely to make a scan work: the
        // provider may still be generating the response we are waiting for. A disconnected
        // content script is retried on the next sweep or by explicit user repair.
        if (['awaiting_artifact','awaiting_zip','blocked'].includes(activePlan.dispatchStatus)) {
            try {
                await sendContentMessageWithWatchdog(tab.id, { action:'CHECK_FOR_ZIP', tabId:tab.id }, { recoveryPreferences, allowReload:false });
            } catch (_error) {}
            if (activePlan.dispatchStatus === 'awaiting_artifact') await attemptNextNudge(tab.id).catch(() => {});
        }
    }));
}

async function readPlanStateRaw() {
    const result = await chrome.storage.local.get(['codeeState']);
    return result.codeeState || {};
}

async function getPlanState() {
    await stateMutationQueue;
    return readPlanStateRaw();
}

function compactCompletedPlan(plan) {
    if (!plan || plan.dispatchStatus !== 'complete' || plan.compacted === true) return plan;
    const compacted={...plan,compacted:true,compactedAt:Date.now()};
    compacted.plan=(Array.isArray(plan.plan)?plan.plan:[]).slice(0,MAX_PLAN_STEPS).map((step,index)=>({number:Number(step?.number)||index+1,text:String(step?.text||'').slice(0,160),compacted:true}));
    for(const key of ['repositoryContext','repositoryPreflight','titanZeroContext','titanZeroPreflight','workforceContext','workforcePreflight','knownArtifactHashes','knownVersions']) delete compacted[key];
    compacted.artifactHistory=normalizeArtifacts(plan.artifactHistory).slice(-MAX_ARTIFACT_HISTORY);
    compacted.consumedArtifactHashes=normalizeHashes(plan.consumedArtifactHashes).slice(-MAX_CONSUMED_ARTIFACT_HASHES);
    return compacted;
}
function applyPlanRetentionPolicy(state) {
    const completed=Object.entries(state||{}).filter(([key,raw])=>key.startsWith('plan_')&&raw&&raw.dispatchStatus==='complete')
        .sort((a,b)=>(Number(b[1].completedAt)||Number(b[1].lastDispatchedAt)||0)-(Number(a[1].completedAt)||Number(a[1].lastDispatchedAt)||0));
    for(let i=COMPLETED_PLAN_FULL_RETENTION;i<completed.length;i++){const [key,plan]=completed[i];state[key]=compactCompletedPlan(plan);}
    return state;
}
async function getStorageHealth() {
    await stateMutationQueue; const state=await readPlanStateRaw(); const plans=Object.entries(state).filter(([k])=>k.startsWith('plan_')).map(([,v])=>v).filter(Boolean);
    let bytesInUse=null; try{if(typeof chrome.storage?.local?.getBytesInUse==='function')bytesInUse=await chrome.storage.local.getBytesInUse(null);}catch(_error){}
    return {bytesInUse:Number.isFinite(Number(bytesInUse))?Number(bytesInUse):null,planCount:plans.length,activePlans:plans.filter(p=>p.dispatchStatus!=='complete').length,completedPlans:plans.filter(p=>p.dispatchStatus==='complete').length,compactedPlans:plans.filter(p=>p.compacted===true).length,artifactReceipts:plans.reduce((n,p)=>n+(Array.isArray(p.artifactHistory)?p.artifactHistory.length:0),0),retention:{fullCompletedPlans:COMPLETED_PLAN_FULL_RETENTION,artifactHistoryPerPlan:MAX_ARTIFACT_HISTORY,consumedHashesPerPlan:MAX_CONSUMED_ARTIFACT_HASHES}};
}

async function mutatePlanState(mutator) {
    const operation = stateMutationQueue.then(async () => {
        const state = await readPlanStateRaw();
        const result = await mutator(state);
        applyPlanRetentionPolicy(state);
        await chrome.storage.local.set({ codeeState: state });
        return result;
    });
    stateMutationQueue = operation.catch(() => {});
    return operation;
}

async function updatePlanState(tabId, planState) {
    const result = await mutatePlanState(state => {
        const key = `plan_${tabId}`;
        const current = state[key];
        if (!current) {
            return { ok: false, stale: true, reason: 'missing-plan' };
        }
        if (current.planId && planState?.planId && current.planId !== planState.planId) {
            return { ok: false, stale: true, reason: 'plan-changed' };
        }

        const currentRevision = Number.isInteger(Number(current.stateRevision)) ? Number(current.stateRevision) : 0;
        const incomingRevision = Number.isInteger(Number(planState?.stateRevision)) ? Number(planState.stateRevision) : 0;
        if (incomingRevision !== currentRevision) {
            return { ok: false, stale: true, reason: 'revision-changed', currentRevision, incomingRevision };
        }
        planState.stateRevision = currentRevision + 1;
        state[key] = planState;
        return { ok: true, planState };
    });

    if (!result?.ok) {
        const error = new Error(`Stale or missing plan state (${result?.reason || 'unknown'})`);
        error.code = 'CODEE_STALE_PLAN_STATE';
        throw error;
    }
    return planState;
}

async function commitSuccessfulSubmission(tabId, sourcePlanState, submittedAt = Date.now()) {
    return mutatePlanState(state => {
        const key = `plan_${tabId}`;
        const current = state[key];
        if (!current) return { ok:false, stale:true, reason:'missing-plan' };
        if (String(current.planId || '') !== String(sourcePlanState?.planId || '')) return { ok:false, stale:true, reason:'plan-changed' };
        if (Number(current.stepIndex) !== Number(sourcePlanState?.stepIndex)) return { ok:false, stale:true, reason:'step-changed' };
        if (String(current.currentStepId || '') !== String(sourcePlanState?.currentStepId || '')) return { ok:false, stale:true, reason:'step-id-changed' };
        if (String(current.currentStepToken || '') !== String(sourcePlanState?.currentStepToken || '')) return { ok:false, stale:true, reason:'step-token-changed' };

        const currentRevision = Number.isInteger(Number(current.stateRevision)) ? Number(current.stateRevision) : 0;
        current.submissionReceipt = {
            stepId: current.currentStepId || '',
            stepToken: current.currentStepToken || '',
            submittedAt: Number(submittedAt) || Date.now(),
            conversationIdentity: getPlanConversationIdentity(current)
        };
        current.deliveryRetryCount = 0;
        current.nextRetryAt = 0;
        current.dispatchStatus = getExpectedDispatchStatus(current);
        current.lastDispatchedStep = current.stepIndex;
        current.lastDispatchedAt = Number(submittedAt) || Date.now();
        delete current.lastDispatchError;
        delete current.explicitRetryRequested;
        current.stateRevision = currentRevision + 1;
        state[key] = current;
        return { ok:true, planState:current };
    });
}

function attachPlanRequirements(planState) {
    if (!globalThis.CodeePlanRequirementAnalyzer) {
        // Reduced/unit-test harnesses load the worker without importScripts. Real MV3
        // execution must have the analyzer loaded before a plan can start.
        if (typeof importScripts !== 'function') return null;
        throw new Error('Plan Requirement Analyzer is unavailable');
    }
    planState.planRequirements = globalThis.CodeePlanRequirementAnalyzer.analyze({
        plan: planState.plan,
        protocolMode: planState.protocolMode || 'signature_v2',
        artifactValidationMode: planState.artifactValidationMode || 'strict_v216',
        debuggingPlanEnabled: Boolean(planState.debuggingPlanEnabled)
    });
    return planState.planRequirements;
}


async function collectProductionPlanEvidence(tabId, planState) {
    const requirements = planState?.planRequirements;
    const [repositoryStatus, connections, aiStatus, browserStatus, tabPolicy, diagnostics] = await Promise.all([
        getRepositoryStatus().catch(() => null),
        getConnectionRegistryPayload({ force: true }).catch(() => null),
        getAIGatewayStatus().catch(() => null),
        getBrowserStatus().catch(() => null),
        getBrowserTabPolicy(tabId).catch(() => null),
        sendContentMessageWithWatchdog(tabId, { action:'GET_CODEE_DIAGNOSTICS' }, { allowReload:false }).catch(() => null)
    ]);
    const rows = Array.isArray(connections?.registry?.rows) ? connections.registry.rows : [];
    const row = id => rows.find(item => item?.id === id) || null;
    const host = globalThis.CodeeRepositoryHost || null;
    const repositoryEnabled = repositoryStatus?.registered === true && repositoryStatus?.settings?.enabled !== false;
    const backupReady = repositoryStatus?.backupPolicy?.createBackup === true && repositoryStatus?.backupPolicy?.verifyBackup === true;
    const verifiedDomains = backupReady ? (requirements?.backup?.domains || []).filter(domain => {
        if (domain === 'filesystem') return true;
        if (domain === 'database') return typeof host?.createDatabaseBackup === 'function' || typeof host?.createBackup === 'function';
        if (domain === 'server') return typeof host?.createServerBackup === 'function' || typeof host?.createBackup === 'function';
        return false;
    }) : [];
    const browserCaps = browserStatus?.executionEnabled === true
        ? (requirements?.browser?.capabilities || []).filter(cap => tabPolicy?.ok === true && (tabPolicy?.record?.grants || []).includes(cap))
        : [];
    const workforceRows = Array.isArray(planState?.workforcePreflight?.readiness) ? planState.workforcePreflight.readiness : [];
    const providerLocal = row('ai.local');
    const providerCloud = row('ai.providers');
    const providerAvailable = aiStatus?.inferenceReady === true || providerLocal?.state === 'CONNECTED' || providerCloud?.state === 'CONNECTED';
    const policyCompatible = requirements?.provider?.localOnly ? providerLocal?.state === 'CONNECTED' : providerAvailable;
    const artifactRow = row('artifact.host');
    const mcpRow = row('mcp');
    return {
        conversation: { bound: Boolean(getPlanConversationIdentity(planState)), composerReady: diagnostics?.ok === true && diagnostics?.composerFound === true },
        provider: { available: providerAvailable, policyCompatible, costApproved: requirements?.cost?.mode !== 'PAID_ALLOWED' },
        repository: {
            readReady: repositoryEnabled,
            writeReady: repositoryEnabled && typeof host?.writeFile === 'function' && typeof host?.verifyMutation === 'function' && backupReady,
            commandReady: repositoryEnabled && typeof host?.runCommand === 'function',
            destructiveReady: repositoryEnabled && typeof host?.deleteFile === 'function' && typeof host?.requestApproval === 'function' && backupReady
        },
        backup: { verifiedDomains },
        artifactHost: {
            connected: artifactRow?.state === 'CONNECTED',
            receiptCapable: artifactRow?.state === 'CONNECTED' && Boolean(globalThis.CodeeArtifactVerificationAdapter),
            contentManifestCapable: artifactRow?.state === 'CONNECTED' && Boolean(globalThis.CodeeArtifactVerificationAdapter)
        },
        mcp: { ready: mcpRow?.state === 'CONNECTED' },
        browser: { ready: browserStatus?.executionEnabled === true, capabilities: browserCaps },
        workforce: { ready: workforceRows.length === 0 || workforceRows.every(item => item?.ready === true) },
        project: { identified: Boolean(repositoryStatus?.latestAnalysis) || requirements?.repository?.read !== true }
    };
}

async function evaluateProductionPlanPreflight(tabId, planState) {
    if (!globalThis.CodeeProductionPlanPreflight) throw new Error('Production Plan Preflight runtime is unavailable');
    if (!planState?.planRequirements) attachPlanRequirements(planState);
    const evidence = await collectProductionPlanEvidence(tabId, planState);
    const result = globalThis.CodeeProductionPlanPreflight.evaluate({ requirements: planState.planRequirements, evidence });
    planState.productionPreflight = result;
    return result;
}

async function prepareAndSavePlanState(tabId, planState) {
    const validation = validatePlanStateForSave(planState);
    if (!validation.ok) return validation;
    if (!planState.artifactVerificationMode) planState.artifactVerificationMode = 'receipt_required';
    if (!planState.artifactValidationMode) planState.artifactValidationMode = 'strict_v216';
    try {
        attachPlanRequirements(planState);
    } catch (error) {
        return { ok: false, error: `Could not derive plan requirements: ${String(error?.message || error)}` };
    }
    try {
        const tab = await getTabSafely(tabId);
        if (tab) {
            const liveUrl = String(tab.url || planState?.target?.url || '');
            const identity = await getLiveConversationIdentityForTab(tabId, liveUrl);
            const reconciled = await reconcileConversationIdentity(planState, liveUrl, identity.provisionalIdentity, identity.conversationIdentity);
            if (!reconciled.ok) return { ok: false, error: 'Target conversation identity could not be established safely' };
        }
    } catch (error) {
        return { ok: false, error: `Could not bind plan to the current conversation: ${String(error?.message || error)}` };
    }
    let workforceWarning = '';
    try {
        await prepareWorkforceForPlanState(planState);
    } catch (error) {
        // Workforce intelligence is advisory. A manager/preflight failure must never
        // take down Codee's deterministic plan save/start path.
        workforceWarning = String(error?.message || error || 'Workforce preflight failed').slice(0, 1000);
        delete planState.workforcePreflight;
        delete planState.workforceContext;
        delete planState.workforcePreflightStepIndex;
    }
    try {
        await evaluateProductionPlanPreflight(tabId, planState);
    } catch (error) {
        planState.productionPreflight = globalThis.CodeeProductionPlanPreflight?.evaluate?.({ requirements: planState.planRequirements, evidence: {} }) || null;
        recordDiagnosticEvent('production-preflight-failed', 'warning', tabId, { planId: planState.planId || '', error: String(error?.message || error).slice(0,1000) }).catch(() => {});
    }
    const result = await savePlanState(tabId, planState);
    if (result?.ok && workforceWarning) {
        recordDiagnosticEvent('workforce-preflight-failed', 'warning', tabId, {
            planId: planState.planId || '', error: workforceWarning
        }).catch(() => {});
    }
    return result?.ok ? { ...result, planState, workforceWarning: workforceWarning || undefined } : result;
}

function getPlanConversationIdentity(planState) {
    return String(planState?.target?.conversationIdentity || '') || getStructuredConversationIdentity(planState?.target?.url || '');
}
function isActivePlanState(planState) { return Boolean(planState && planState.dispatchStatus !== 'complete' && !planState.requiresRestart); }
function planQueueKey(tabId) { return `planQueue_${tabId}`; }
function normalizePlanQueue(value) {
    return Array.isArray(value) ? value.filter(item => item && typeof item === 'object' && item.planId) : [];
}
function queuePlanInState(state, tabId, planState) {
    const key = planQueueKey(tabId);
    const queue = normalizePlanQueue(state[key]);
    if (queue.some(item => item.planId === planState.planId)) {
        return { ok:false, error:'This plan is already queued for this conversation' };
    }
    const queued = {
        ...planState,
        dispatchStatus:'queued',
        queuedAt:Date.now(),
        queuePosition:queue.length + 1,
        stateRevision:Math.max(1, Number(planState.stateRevision)||0)
    };
    queue.push(queued);
    state[key] = queue.map((item,index) => ({ ...item, queuePosition:index + 1 }));
    return { ok:true, queued:true, queueLength:queue.length, queuePosition:queue.length, planState:queued };
}
function promoteNextQueuedPlanInState(state, tabId) {
    const activeKey = `plan_${tabId}`;
    const queueKey = planQueueKey(tabId);
    const queue = normalizePlanQueue(state[queueKey]);
    if (!queue.length) {
        if (state[queueKey]) state[queueKey] = [];
        return { promoted:false, queueLength:0 };
    }
    const current = normalizePlanState(state[activeKey]);
    if (current && current.dispatchStatus !== 'complete') return { promoted:false, queueLength:queue.length, reason:'active-plan-still-running' };
    if (current) state[makeOrphanPlanKey(state,current)] = current;
    const next = { ...queue.shift(), dispatchStatus:'pending_send', promotedAt:Date.now(), queuePosition:0 };
    next.stateRevision = Math.max(1, Number(next.stateRevision)||0);
    state[activeKey] = next;
    state[queueKey] = queue.map((item,index) => ({ ...item, queuePosition:index + 1 }));
    cancelledPlanIds.delete(next.planId);
    return { promoted:true, promotedPlan:next, queueLength:queue.length };
}
async function promoteNextQueuedPlan(tabId, { dispatch=true } = {}) {
    const result = await mutatePlanState(state => promoteNextQueuedPlanInState(state, tabId));
    if (result?.promoted && dispatch && result.promotedPlan) {
        try {
            await notifyUI(tabId, result.promotedPlan, `Queued plan promoted. Starting ${result.promotedPlan.planId}.`);
            result.dispatchResult = await dispatchCurrentStep(tabId, result.promotedPlan);
        } catch (error) {
            result.dispatchResult = { ok:false, error:error?.message || String(error) };
        }
    }
    return result;
}
function makeOrphanPlanKey(state, planState) {
    const seed=String(planState?.planId || planState?.runId || Date.now()); let hash=0;
    for(let i=0;i<seed.length;i++) hash=((hash<<5)-hash+seed.charCodeAt(i))|0;
    let n=-Math.max(1,Math.abs(hash||1)); let key=`plan_${n}`;
    while(Object.prototype.hasOwnProperty.call(state,key)){n--;key=`plan_${n}`;}
    return key;
}

async function savePlanState(tabId, planState) {
    const validation = validatePlanStateForSave(planState);
    if (!validation.ok) return validation;
    return mutatePlanState(state => {
        const key = `plan_${tabId}`;
        const rawExisting = state[key];
        if (isFuturePlanState(rawExisting)) {
            return { ok: false, error: 'A newer Codee plan state already targets this conversation; update Codee before replacing it' };
        }
        const existing = normalizePlanState(rawExisting);
        if (existing && existing.dispatchStatus !== 'complete' && existing.planId !== planState.planId) {
            const oldIdentity=getPlanConversationIdentity(existing); const newIdentity=getPlanConversationIdentity(planState);
            if(oldIdentity && newIdentity && oldIdentity!==newIdentity){
                state[makeOrphanPlanKey(state,existing)]=existing;
                delete state[key];
            } else {
                return queuePlanInState(state, tabId, planState);
            }
        }
        if (existing && existing.dispatchStatus === 'complete' && existing.planId !== planState.planId) {
            state[makeOrphanPlanKey(state,existing)] = existing;
        }
        cancelledPlanIds.delete(planState.planId);
        planState.stateRevision = Math.max(1, Number(planState.stateRevision)||0);
        state[key] = planState;
        return { ok: true, queued:false, stateRevision: planState.stateRevision, planState };
    });
}

async function stopPlan(tabId, requestedPlanId = '') {
    const result = await mutatePlanState(state => {
        const key = `plan_${tabId}`;
        const existing = state[key];
        if (!existing) return { ok: true, stopped: false };
        if (requestedPlanId && existing.planId !== requestedPlanId) {
            return { ok: false, error: 'Saved plan changed before it could be stopped' };
        }
        if (existing.planId) cancelledPlanIds.add(existing.planId);
        state[makeOrphanPlanKey(state,existing)] = { ...existing, dispatchStatus:'stopped', stoppedAt:Date.now() };
        delete state[key];
        const promoted = promoteNextQueuedPlanInState(state, tabId);
        return { ok: true, stopped: true, ...promoted };
    });
    if (result?.promoted && result.promotedPlan) {
        try { result.dispatchResult = await dispatchCurrentStep(tabId, result.promotedPlan); }
        catch (error) { result.dispatchResult = { ok:false, error:error?.message || String(error) }; }
    }
    return result;
}

async function getTabSafely(tabId) {
    try {
        if (typeof chrome.tabs?.get === 'function') return await chrome.tabs.get(tabId);
        const tabs = await queryTabs({});
        return tabs.find(tab => tab?.id === tabId) || null;
    } catch (_error) {
        return null;
    }
}

function evaluateArtifactForDiagnostics(planState, artifact) {
    const identity = validateArtifactIdentityForCurrentStep(planState, artifact);
    if (!identity.ok) return { matchesCurrentStep: false, valid: false, reason: identity.reason, artifact };
    const status = String(artifact?.status || '').toLowerCase();
    if (status && status !== 'completed') {
        const nonCompletion = validateNonCompletedArtifactReport(status, artifact?.nextAction);
        return { matchesCurrentStep: true, valid: nonCompletion.ok, reason: nonCompletion.ok ? `reported-${status}` : `noncompletion-${nonCompletion.reason}`, artifact };
    }
    const validation = validateArtifactForCurrentStep(planState, artifact);
    return { matchesCurrentStep: true, valid: validation.ok, reason: validation.ok ? 'valid' : validation.reason, artifact };
}

function deriveDiagnosticRecommendation(planState, pageState, evaluations) {
    if (!planState) return 'No plan is bound to this tab. Open the target conversation or reselect the active plan.';
    if (planState.requiresRestart) return 'This saved plan is held for a clean restart. Stop it and start again from the source plan.';
    if (!pageState?.reachable && planState.dispatchStatus === 'awaiting_artifact') return 'The content script is not reachable while Codee is waiting for an artifact. Codee will not auto-reload this conversation because the provider may still be generating; wait for completion, then re-scan or reload manually if needed.';
    if (!pageState?.reachable) return 'The conversation content script is not reachable. For pending delivery, Codee may use one rate-limited targeted reload only after safer wake/focus recovery fails.';
    if (planState.dispatchStatus === 'pending_send') return 'Run Auto Repair & Resume. Codee will reconcile prior submission evidence before retrying this step.';
    if (planState.dispatchStatus === 'blocked' && String(planState.lastArtifactValidationReason || '').startsWith('artifact-')) {
        return 'The CODEE footer was seen, but actual ZIP verification is not complete. Connect/repair the Codee Artifact Verification Host, then re-scan the conversation.';
    }
    if (planState.dispatchStatus === 'blocked') return 'Review the artifact rejection below. If the step is intentionally ready to rerun, use Retry Current Step.';
    const matching = evaluations.find(item => item.matchesCurrentStep);
    if (planState.dispatchStatus === 'awaiting_artifact' && matching?.valid) return 'A valid current-step artifact is visible. Re-scan Conversation should consume it immediately.';
    if (planState.dispatchStatus === 'awaiting_artifact' && matching && !matching.valid) return `Current-step artifact is visible but rejected: ${matching.reason}.`;
    if (planState.dispatchStatus === 'awaiting_artifact') return 'Step is submitted and Codee is waiting for its matching CODEE_ARTIFACT footer.';
    if (planState.dispatchStatus === 'complete') return 'Plan is complete. No repair is required.';
    return 'Run diagnostics again after the conversation finishes rendering.';
}

function summarizeDiagnosticFailures(events) {
    const rows = Array.isArray(events) ? events : [];
    const byType = {};
    const byResult = {};
    let lastFailure = null;
    let lastSuccess = null;
    for (const event of rows) {
        const severity = String(event?.severity || '').toLowerCase();
        const type = String(event?.type || 'unknown');
        const result = String(event?.details?.result || event?.details?.reason || event?.details?.error || '').slice(0,300);
        if (['error','warning','warn','fail','failed'].includes(severity)) {
            byType[type] = (byType[type] || 0) + 1;
            if (result) byResult[result] = (byResult[result] || 0) + 1;
            if (!lastFailure) lastFailure = { at:event?.at || '', type, severity, result };
        } else if (severity === 'success' && !lastSuccess) {
            lastSuccess = { at:event?.at || '', type, result };
        }
    }
    return { total:rows.length, byType, byResult, lastFailure, lastSuccess };
}

function buildPlanInventory(state, tabId, liveIdentity='') {
    const rows=[];
    for (const [key, raw] of Object.entries(state || {})) {
        if (!String(key).startsWith('plan_') || !raw || isFuturePlanState(raw)) continue;
        const plan = normalizePlanState(raw);
        const keyTabId = Number(String(key).slice(5));
        rows.push({
            key,
            tabId:Number.isInteger(keyTabId) ? keyTabId : null,
            planId:String(plan?.planId || ''),
            runId:String(plan?.runId || ''),
            dispatchStatus:String(plan?.dispatchStatus || ''),
            active:isActivePlanState(plan),
            targetIdentity:getPlanConversationIdentity(plan),
            targetUrl:String(plan?.target?.url || ''),
            stepNumber:(Number(plan?.stepIndex)||0)+1,
            stepTotal:Array.isArray(plan?.plan) ? plan.plan.length : 0
        });
    }
    const activeRows=rows.filter(row=>row.active);
    const current=rows.find(row=>row.tabId===tabId) || null;
    const identityMatches=liveIdentity ? activeRows.filter(row=>row.targetIdentity===liveIdentity) : [];
    return {
        totalCount:rows.length,
        activeCount:activeRows.length,
        boundToCurrentTab:Boolean(current),
        current,
        identityMatches,
        activePlans:activeRows.slice(0,12),
        orphanCount:activeRows.filter(row=>!Number.isInteger(row.tabId) || row.tabId < 0).length
    };
}

async function getDiagnosticSnapshot(tabId) {
    const state = await getPlanState();
    const rawPlanState = state?.[`plan_${tabId}`];
    const planState = rawPlanState && !isFuturePlanState(rawPlanState) ? normalizePlanState(rawPlanState) : rawPlanState || null;
    const tab = await getTabSafely(tabId);

    let alarm = null;
    try { alarm = typeof chrome.alarms?.get === 'function' ? await chrome.alarms.get('ZIP_POLL') : null; } catch (_error) {}

    const recoveryPreferences = await getRecoveryPreferences();

    let pageHealth = null;
    let pageSnapshot = null;
    let pageError = '';
    if (tab) {
        try {
            pageHealth = await sendContentMessageWithWatchdog(tabId, { action:'GET_CODEE_DIAGNOSTICS' }, { allowReload:false });
            pageSnapshot = await getPageSnapshot(tabId, planState?.currentStepToken || '', { allowReload:false });
        } catch (error) {
            pageError = error?.message || String(error);
        }
    }

    const evaluations = planState && pageSnapshot
        ? pageSnapshot.artifacts.map(artifact => evaluateArtifactForDiagnostics(planState, artifact))
        : [];
    const matching = evaluations.filter(item => item.matchesCurrentStep);
    const events = await readDiagnosticEvents(tabId);
    let workforce = null;
    try { workforce = await getWorkforceStatus(); }
    catch (error) { workforce = { registered: false, error: error?.message || String(error) }; }
    const savedIdentity = String(planState?.target?.conversationIdentity || '') || getStructuredConversationIdentity(planState?.target?.url || '');
    const structuredLiveIdentity = getStructuredConversationIdentity(tab?.url || '');
    const liveIdentity = structuredLiveIdentity || String(pageHealth?.conversationIdentity || pageSnapshot?.conversationIdentity || '');
    const provider = getSupportedProviderKey(tab?.url || '');
    const identityMatches = !savedIdentity || savedIdentity === liveIdentity
        || (isProvisionalConversationIdentity(savedIdentity) && structuredLiveIdentity && getConversationIdentityProvider(savedIdentity) === getConversationIdentityProvider(structuredLiveIdentity));
    const contentReachable = Boolean(pageHealth?.ok && pageSnapshot);
    const planInventory = buildPlanInventory(state, tabId, liveIdentity);
    const runner = await getNextRunnerStatus(tabId).catch(error => ({ ok:false, tabId, enabled:false, healthState:'error', error:error?.message || String(error) }));
    const runnerAlarmPresent = Boolean(runner?.enabled && runner?.nextDueAt);
    const failureSummary = summarizeDiagnosticFailures(events.slice().reverse());
    const reloadCooldownMs = getWatchdogReloadCooldownRemaining(tabId);
    const recovery = {
        focusPulseEnabled:Boolean(recoveryPreferences.focusPulse),
        silentByDefault:recoveryPreferences.focusPulse !== true,
        backgroundWatchdog:Boolean(recoveryPreferences.backgroundWatchdog),
        composerWatchdog:Boolean(recoveryPreferences.composerWatchdog),
        targetedReload:Boolean(recoveryPreferences.targetedReload),
        restorePreviousTab:Boolean(recoveryPreferences.restorePreviousTab),
        preventAutoDiscard:Boolean(recoveryPreferences.preventAutoDiscard),
        watchdogReloadCooldownMs:reloadCooldownMs,
        watchdogReloadAvailable:canWatchdogReload(tabId),
        receiverReachable:contentReachable,
        pageProbeError:pageError || ''
    };
    const artifactVerifier = globalThis.CodeeArtifactVerificationHost
        || (globalThis.CodeeMcpRuntime && typeof globalThis.CodeeMcpRuntime.verifyArtifact === 'function' ? globalThis.CodeeMcpRuntime : null)
        || (globalThis.CodeeRepositoryHost && typeof globalThis.CodeeRepositoryHost.verifyArtifact === 'function' ? globalThis.CodeeRepositoryHost : null);
    const artifactVerificationRequired = requiresArtifactVerificationReceipt(planState);

    const composerNeeded = Boolean(planState && (
        planState.dispatchStatus === 'pending_send'
        || (planState.dispatchStatus === 'awaiting_artifact' && planState.nextNudgerEnabled && getNextNudgeDueAt(planState) && Date.now() >= getNextNudgeDueAt(planState))
    ));
    const composerFound = Boolean(pageHealth?.composerFound);
    const composerCheck = composerNeeded
        ? { id:'composer', ok:composerFound, level:composerFound ? 'pass' : 'warning', text:composerFound ? 'Chat composer detected' : 'Chat composer not currently detected for pending delivery' }
        : { id:'composer', ok:true, level:'pass', text:composerFound ? 'Chat composer detected' : 'Composer not required for the current plan state' };

    const checks = [
        { id: 'plan', ok: Boolean(planState), level: planState ? 'pass' : 'fail', text: planState ? 'Plan state found' : 'No plan state for this tab' },
        { id: 'tab', ok: Boolean(tab), level: tab ? 'pass' : 'fail', text: tab ? 'Target tab exists' : 'Target tab is closed or unavailable' },
        { id: 'identity', ok: Boolean(tab && identityMatches), level: tab && identityMatches ? 'pass' : 'fail', text: identityMatches ? 'Conversation identity matches' : 'Conversation identity mismatch' },
        { id: 'content', ok: contentReachable, level: contentReachable ? 'pass' : 'fail', text: contentReachable ? 'Content script reachable' : `Content script unavailable${pageError ? `: ${pageError}` : ''}` },
        composerCheck,
        { id: 'alarm', ok: Boolean(alarm && Number(alarm.periodInMinutes) === 1), level: alarm && Number(alarm.periodInMinutes) === 1 ? 'pass' : 'warning', text: alarm ? `Recovery alarm: ${alarm.periodInMinutes} minute` : 'Recovery alarm missing' },
        { id: 'artifact-verifier', ok: !artifactVerificationRequired || Boolean(artifactVerifier), level: !artifactVerificationRequired || artifactVerifier ? 'pass' : 'warning', text: artifactVerificationRequired ? (artifactVerifier ? 'Artifact byte verifier connected' : 'Artifact byte verifier not connected') : 'Legacy footer-only artifact verification mode' }
   ,
        { id:'plan-inventory', ok:Boolean(planState) || planInventory.activeCount === 0, level:Boolean(planState) || planInventory.activeCount === 0 ? 'pass' : 'fail', text: planState ? 'Current tab plan binding present' : (planInventory.activeCount ? `${planInventory.activeCount} active plan(s) exist but none is bound to this tab` : 'No active plan exists') },
        { id:'next-runner', ok:!runner?.enabled || runner?.healthState === 'running', level:!runner?.enabled ? 'pass' : (runner?.healthState === 'running' ? 'pass' : 'fail'), text:!runner?.enabled ? 'Standalone Next Runner stopped' : `Standalone Next Runner ${runner.healthState || 'unknown'}; attempts=${runner.attemptCount||0}, sent=${runner.sentCount||0}, failed=${runner.failedCount||0}, last=${runner.lastResult||'none'}` }
    ];

    const storageHealth = await getStorageHealth().catch(() => null);
    if (storageHealth) { const storageWarning = storageHealth.bytesInUse !== null && storageHealth.bytesInUse > 8 * 1024 * 1024; checks.push({ id: 'storage-health', ok: !storageWarning, level: storageWarning ? 'warning' : 'pass', text: `Storage: ${storageHealth.bytesInUse ?? 'unknown'} bytes; completed=${storageHealth.completedPlans}; compacted=${storageHealth.compactedPlans}` }); }

    const overall = checks.some(check => check.level === 'fail') ? 'error'
        : checks.some(check => check.level === 'warning') || planState?.lastDispatchError || planState?.lastArtifactValidationReason ? 'warning'
        : 'healthy';

    return {
        ok: true,
        generatedAt: new Date().toISOString(),
        overall,
        tab: tab ? { id:tab.id, title:tab.title || '', url:tab.url || '', provider, liveIdentity, active:Boolean(tab.active), frozen:Boolean(tab.frozen), discarded:Boolean(tab.discarded), autoDiscardable:tab.autoDiscardable !== false } : null,
        plan: planState ? {
            planId: planState.planId || '', runId: planState.runId || '', stepId: planState.currentStepId || '',
            stepToken: planState.currentStepToken || '', stepNumber: Number(planState.stepIndex) + 1, stepTotal: planState.plan?.length || 0,
            dispatchStatus: planState.dispatchStatus || '', stateRevision: planState.stateRevision || 0,
            lastArtifactSha256: planState.lastArtifactSha256 || '', lastArtifactValidationReason: planState.lastArtifactValidationReason || '',
            lastDispatchError: planState.lastDispatchError || '', targetIdentity: savedIdentity, requiresRestart: Boolean(planState.requiresRestart),
            artifactVerificationMode: planState.artifactVerificationMode || 'legacy_footer_only',
            artifactValidationMode: planState.artifactValidationMode || 'legacy_v2',
            artifactVerificationReceipt: planState.lastArtifactVerificationReceipt || null,
            logicalRetryCount: Number(planState.logicalRetryCount) || 0,
            deliveryRetryCount: Number(planState.deliveryRetryCount) || 0,
            nextRetryAt: Number(planState.nextRetryAt) || 0,
            debuggingPlanEnabled: Boolean(planState.debuggingPlanEnabled),
            nextNudgerEnabled: Boolean(planState.nextNudgerEnabled),
            nextNudgeDueAt: getNextNudgeDueAt(planState),
            lastNextNudgeAttemptAt: planState.lastNextNudgeAttemptAt || null,
            lastNextNudgeError: planState.lastNextNudgeError || '',
            compacted: Boolean(planState.compacted)
        } : null,
        connection: {
            worker: true, contentScript: contentReachable, composer: Boolean(pageHealth?.composerFound), contextValid: Boolean(pageHealth?.contextValid),
            pageError, lastContentError: pageHealth?.lastError || '', lastPromptError: pageHealth?.lastPromptError || '',
            lastPromptAcceptedAt: pageHealth?.lastPromptAcceptedAt || null, scanCount: pageHealth?.scanCount || 0
        },
        recoveryAlarm: { ok: recoveryPreferences.autoRecoverySweep ? Boolean(alarm && Number(alarm.periodInMinutes) === 1) : true, enabled:recoveryPreferences.autoRecoverySweep, periodInMinutes:alarm?.periodInMinutes || null },
        recoverySettings: recoveryPreferences,
        artifact: {
            verificationRequired: artifactVerificationRequired, verifierConnected: Boolean(artifactVerifier), lastReceipt: planState?.lastArtifactVerificationReceipt || null,
            visibleCount: pageSnapshot?.artifacts?.length || 0, matchingCount: matching.length,
            evaluations: evaluations.slice(-12).map(item => ({
                matchesCurrentStep: item.matchesCurrentStep, valid: item.valid, reason: item.reason,
                stepId: item.artifact?.stepId || '', stepToken: item.artifact?.stepToken || '', status: item.artifact?.status || '',
                sha256: item.artifact?.sha256 || '', zip: item.artifact?.zip || ''
            }))
        },
        runner: { ...runner, alarmPresent: runnerAlarmPresent },
        planInventory,
        recovery,
        failureSummary,
        workforce,
        storageHealth,
        checks, events, recommendation: deriveDiagnosticRecommendation(planState, { reachable: contentReachable }, evaluations)
    };
}

async function prepareManualRetry(tabId) {
    return mutatePlanState(state => {
        const key = `plan_${tabId}`;
        const raw = state[key];
        if (!raw) return { ok: false, error: 'No saved plan for this tab' };
        if (isFuturePlanState(raw)) return getFutureStateHoldResult();
        const planState = normalizePlanState(raw);
        if (planState.dispatchStatus === 'complete') return { ok: false, error: 'Plan is already complete' };
        if (!['pending_send', 'blocked'].includes(planState.dispatchStatus)) {
            return { ok: false, error: `Current step is ${planState.dispatchStatus}; rescan before forcing a retry` };
        }
        if (planState.dispatchStatus === 'blocked') {
            planState.currentStepToken = null;
            planState.explicitRetryRequested = true;
        }
        planState.logicalRetryCount = 0;
        planState.deliveryRetryCount = 0;
        planState.nextRetryAt = 0;
        delete planState.submissionReceipt;
        planState.dispatchStatus = 'pending_send';
        delete planState.lastDispatchError;
        const revision = Number.isInteger(Number(planState.stateRevision)) ? Number(planState.stateRevision) : 0;
        planState.stateRevision = revision + 1;
        state[key] = planState;
        return { ok: true, planState };
    });
}

async function runDiagnosticRepair(tabId, repair = 'auto') {
    const action = String(repair || 'auto').toLowerCase();
    await recordDiagnosticEvent('diagnostic-repair-start', 'info', tabId, { action }).catch(() => {});

    if (action === 'alarm') {
        await ensureRecoveryAlarm();
        await recordDiagnosticEvent('recovery-alarm-repaired', 'success', tabId, {}).catch(() => {});
        return { ok: true, action, report: await getDiagnosticSnapshot(tabId) };
    }

    const tab = await getTabSafely(tabId);
    if (!tab) return { ok: false, error: 'Target conversation tab is not open', report: await getDiagnosticSnapshot(tabId) };

    await ensureRecoveryAlarm();
    const liveIdentity = await getLiveConversationIdentityForTab(tabId, tab.url || '').catch(() => ({ conversationIdentity: '', provisionalIdentity: '' }));
    await rebindOrphanedPlanToTab(tabId, tab.url || '', liveIdentity.provisionalIdentity || '', liveIdentity.conversationIdentity || '').catch(() => false);

    if (action === 'retry') {
        const prepared = await prepareManualRetry(tabId);
        if (!prepared?.ok) return { ...prepared, report: await getDiagnosticSnapshot(tabId) };
        const result = await dispatchCurrentStep(tabId);
        await recordDiagnosticEvent('manual-step-retry', result?.ok ? 'success' : 'warning', tabId, { result: result?.reason || result?.error || 'submitted' }).catch(() => {});
        return { ok: Boolean(result?.ok), action, result, report: await getDiagnosticSnapshot(tabId) };
    }

    try { await chrome.tabs.sendMessage(tabId, { action: 'CHECK_FOR_ZIP', tabId }); } catch (_error) {}

    if (action === 'rescan') {
        await recordDiagnosticEvent('manual-rescan', 'info', tabId, {}).catch(() => {});
        return { ok: true, action, report: await getDiagnosticSnapshot(tabId) };
    }

    const state = await getPlanState();
    const raw = state?.[`plan_${tabId}`];
    if (!raw) return { ok: false, error: 'No active plan is bound to this conversation', report: await getDiagnosticSnapshot(tabId) };
    if (isFuturePlanState(raw)) return { ...getFutureStateHoldResult(), report: await getDiagnosticSnapshot(tabId) };
    const planState = normalizePlanState(raw);

    let result = { ok: true, action: 'auto', noOp: true };
    if (planState.dispatchStatus === 'pending_send') {
        result = await dispatchCurrentStep(tabId, planState);
    } else if (['awaiting_artifact', 'blocked'].includes(planState.dispatchStatus)) {
        try {
            const snapshot = await getPageSnapshot(tabId, planState.currentStepToken || '', { allowReload:false });
            const matches = snapshot.artifacts.filter(artifact => validateArtifactIdentityForCurrentStep(planState, artifact).ok);
            const completion = [...matches].reverse().find(artifact => String(artifact.status || '').toLowerCase() === 'completed');
            if (completion) result = await handleArtifactDetected(tabId, completion);
        } catch (error) {
            result = { ok: false, error: error?.message || String(error) };
        }
    }

    await recordDiagnosticEvent('diagnostic-auto-repair', result?.ok ? 'success' : 'warning', tabId, {
        result: result?.reason || result?.error || (result?.advanced ? 'advanced' : 'checked')
    }).catch(() => {});
    return { ok: Boolean(result?.ok), action: 'auto', result, report: await getDiagnosticSnapshot(tabId) };
}

console.log('[Codee] Service worker loaded - signature-v2 artifact orchestration active');
