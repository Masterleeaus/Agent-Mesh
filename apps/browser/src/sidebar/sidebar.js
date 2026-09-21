// Codee Sidebar Controller - conversation-aware multi-plan orchestration

const SUPPORTED_URL_PATTERNS = ['*://chatgpt.com/*', '*://claude.ai/*'];
const MAX_PLAN_FILE_BYTES = 1024 * 1024;
const MAX_PLAN_TEXT_CHARS = 1024 * 1024;
const MAX_PLAN_STEPS = 500;

let activePlans = new Map(); // tabId -> active plan state
let queuedPlans = new Map(); // tabId -> ordered queued plan states
let activeNextRunners = new Map(); // tabId -> standalone timed Next runner status
let tabMetadata = new Map(); // tabId -> { title, provider, url }
let currentTabId = null; // active plan whose detail panel is visible
let activeConversationTabId = null; // currently active browser conversation tab
let planStartInProgress = false;
let latestWorkforceDraft = null;
let navigationRegistryCache = null;
let dashboardStatusCache = null;
let dashboardStatusLoading = null;
let connectionsWorkspaceCache = null;
let connectionsWorkspaceLoading = null;
let mcpInspectorCache = null;
let mcpInspectorLoading = null;

const APP_PAGE_CONTEXT = Object.freeze({
    dashboard: 'Titan Code project and runtime overview',
    runner: 'Conversation-aware plan orchestration',
    plans: 'Active plan monitoring',
    history: 'Plan execution history',
    artifacts: 'Verified artifact lineage and receipts',
    intelligence: 'Titan Code project understanding and reasoning',
    workforce: 'AI Workforce managers and evidence',
    repository: 'Repository intelligence workspace',
    'titan-zero': 'Titan Zero architecture intelligence',
    browser: 'Browser Control Engine readiness',
    connections: 'Infrastructure and provider connections',
    mcp: 'Governed MCP tools and calls',
    'repository-host': 'Repository Host health and governed mutation support',
    prompts: 'Prompt library',
    skills: 'Skills library',
    knowledge: 'Governed Titan Code knowledge',
    diagnostics: 'Runtime diagnostics',
    settings: 'Titan Code preferences',
    about: 'Titan Code information'
});
let activePage = 'dashboard';

const PREFERENCES_STORAGE_KEY = 'codeePreferences';
const LAST_PAGE_STORAGE_KEY = 'codeeLastPage';
const DEFAULT_TITAN_ZERO_SETTINGS = Object.freeze({
    enabled: true,
    autoDetect: true,
    analyzeSqlSchema: true,
    analyzeMigrations: true,
    analyzeTenancy: true,
    analyzeNavigationMetadata: true,
    analyzeFrontend: true,
    maxContextChars: 18000,
    includeExtensions: true,
    ignoreExtensions: false,
    parseSqlRows: false
});
const DEFAULT_WORKFORCE_SETTINGS = Object.freeze({
    enabled: true,
    maxManagersPerTask: 3,
    allowAdvisoryAI: true,
    requireEvidence: true,
    planAdvanceAuthority: false,
    directMutation: false,
    consumeRepositoryPack: true,
    consumeMcpRuntime: true,
    maxContextChars: 12000
});
const DEFAULT_REPOSITORY_SETTINGS = Object.freeze({
    enabled: true,
    includeExtensions: true,
    maxSearchResults: 200,
    maxRemoteContextChars: 16000,
    requireVerifiedBackupBeforeMutation: true,
    allowUnknownCommands: false,
    autoSelectTargetedTests: true,
    consumeMcpRuntime: true,
    maxContextChars: 18000
});
let capabilityRegistryCache = null;
let capabilityLibrariesLoading = null;
let capabilityStatusCache = null;
let capabilityStatusLoading = null;
const DEFAULT_PREFERENCES = Object.freeze({
    compactMode: false,
    reducedGlow: false,
    autoOpenPlans: true,
    confirmBeforeStop: true,
    rememberLastPage: true,
    debuggingPlanDefault: false,
    autoRecoverySweep: true,
    nextNudgerFeatureEnabled: true,
    nextNudgerDefault: false,
    backgroundWatchdog: true,
    composerWatchdog: true,
    focusPulse: true,
    targetedReload: false,
    restorePreviousTab: true,
    preventAutoDiscard: true,
    lastPage: 'dashboard',
    titanZero: DEFAULT_TITAN_ZERO_SETTINGS,
    repository: DEFAULT_REPOSITORY_SETTINGS,
    workforce: DEFAULT_WORKFORCE_SETTINGS
});
let preferences = { ...DEFAULT_PREFERENCES };
let preferencesLoaded = false;

function normalizeTitanZeroSettings(value) {
    const input = value && typeof value === 'object' ? value : {};
    const requestedLimit = Number(input.maxContextChars);
    return {
        enabled: input.enabled !== false,
        autoDetect: input.autoDetect !== false,
        analyzeSqlSchema: input.analyzeSqlSchema !== false,
        analyzeMigrations: input.analyzeMigrations !== false,
        analyzeTenancy: input.analyzeTenancy !== false,
        analyzeNavigationMetadata: input.analyzeNavigationMetadata !== false,
        analyzeFrontend: input.analyzeFrontend !== false,
        maxContextChars: Number.isFinite(requestedLimit)
            ? Math.min(50000, Math.max(4000, Math.round(requestedLimit)))
            : DEFAULT_TITAN_ZERO_SETTINGS.maxContextChars,
        includeExtensions: true,
        ignoreExtensions: false,
        parseSqlRows: false
    };
}

function normalizeRepositorySettings(value) {
    const input = value && typeof value === 'object' ? value : {};
    const clamp = (value, min, max, fallback) => { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback; };
    return {
        enabled: input.enabled !== false,
        includeExtensions: true,
        maxSearchResults: clamp(input.maxSearchResults, 20, 1000, DEFAULT_REPOSITORY_SETTINGS.maxSearchResults),
        maxRemoteContextChars: clamp(input.maxRemoteContextChars, 1000, 100000, DEFAULT_REPOSITORY_SETTINGS.maxRemoteContextChars),
        requireVerifiedBackupBeforeMutation: true,
        allowUnknownCommands: false,
        autoSelectTargetedTests: input.autoSelectTargetedTests !== false,
        consumeMcpRuntime: input.consumeMcpRuntime !== false,
        maxContextChars: clamp(input.maxContextChars, 4000, 50000, DEFAULT_REPOSITORY_SETTINGS.maxContextChars)
    };
}

function normalizeWorkforceSettings(value) {
    const input = value && typeof value === 'object' ? value : {};
    const clamp = (value, min, max, fallback) => { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback; };
    return {
        enabled: input.enabled !== false,
        maxManagersPerTask: clamp(input.maxManagersPerTask, 1, 5, DEFAULT_WORKFORCE_SETTINGS.maxManagersPerTask),
        allowAdvisoryAI: input.allowAdvisoryAI !== false,
        requireEvidence: input.requireEvidence !== false,
        planAdvanceAuthority: false,
        directMutation: false,
        consumeRepositoryPack: input.consumeRepositoryPack !== false,
        consumeMcpRuntime: input.consumeMcpRuntime !== false,
        maxContextChars: clamp(input.maxContextChars, 2000, 20000, DEFAULT_WORKFORCE_SETTINGS.maxContextChars)
    };
}

function normalizePreferences(value) {
    const input = value && typeof value === 'object' ? value : {};
    const lastPageCandidate = String(input.lastPage || DEFAULT_PREFERENCES.lastPage).trim().toLowerCase();
    const recoveryPolicyVersion = Number(input.recoveryPolicyVersion) >= 2 ? 2 : 1;
    return {
        recoveryPolicyVersion: 2,
        compactMode: input.compactMode === true,
        reducedGlow: input.reducedGlow === true,
        autoOpenPlans: input.autoOpenPlans !== false,
        confirmBeforeStop: input.confirmBeforeStop !== false,
        rememberLastPage: input.rememberLastPage !== false,
        debuggingPlanDefault: input.debuggingPlanDefault === true,
        autoRecoverySweep: input.autoRecoverySweep !== false,
        nextNudgerFeatureEnabled: input.nextNudgerFeatureEnabled !== false,
        nextNudgerDefault: input.nextNudgerDefault === true,
        backgroundWatchdog: input.backgroundWatchdog !== false,
        composerWatchdog: input.composerWatchdog !== false,
        focusPulse: input.focusPulse !== false,
        targetedReload: recoveryPolicyVersion >= 2 ? input.targetedReload === true : false,
        restorePreviousTab: input.restorePreviousTab !== false,
        preventAutoDiscard: input.preventAutoDiscard !== false,
        lastPage: Object.prototype.hasOwnProperty.call(APP_PAGE_CONTEXT, lastPageCandidate)
            ? lastPageCandidate
            : DEFAULT_PREFERENCES.lastPage,
        titanZero: normalizeTitanZeroSettings(input.titanZero),
        repository: normalizeRepositorySettings(input.repository),
        workforce: normalizeWorkforceSettings(input.workforce)
    };
}

function syncSettingsForm() {
    const mapping = {
        'setting-compact-mode': preferences.compactMode,
        'setting-reduced-glow': preferences.reducedGlow,
        'setting-auto-open-plans': preferences.autoOpenPlans,
        'setting-confirm-stop': preferences.confirmBeforeStop,
        'setting-remember-page': preferences.rememberLastPage,
        'setting-debugging-plan-default': preferences.debuggingPlanDefault,
        'setting-auto-recovery-sweep': preferences.autoRecoverySweep,
        'setting-next-nudger-feature': preferences.nextNudgerFeatureEnabled,
        'setting-next-nudger-default': preferences.nextNudgerDefault,
        'setting-background-watchdog': preferences.backgroundWatchdog,
        'setting-composer-watchdog': preferences.composerWatchdog,
        'setting-focus-pulse': preferences.focusPulse,
        'setting-targeted-reload': preferences.targetedReload,
        'setting-restore-previous-tab': preferences.restorePreviousTab,
        'setting-prevent-auto-discard': preferences.preventAutoDiscard
    };
    Object.entries(mapping).forEach(([id, checked]) => {
        const control = document.getElementById?.(id);
        if (control) control.checked = checked;
    });
    const titan = normalizeTitanZeroSettings(preferences.titanZero);
    const titanChecks = {
        'setting-tz-enabled': titan.enabled,
        'setting-tz-auto-detect': titan.autoDetect,
        'setting-tz-sql': titan.analyzeSqlSchema,
        'setting-tz-migrations': titan.analyzeMigrations,
        'setting-tz-tenancy': titan.analyzeTenancy,
        'setting-tz-navigation': titan.analyzeNavigationMetadata,
        'setting-tz-frontend': titan.analyzeFrontend,
        'setting-tz-ignore-extensions': false,
        'setting-tz-parse-sql-rows': false
    };
    Object.entries(titanChecks).forEach(([id, checked]) => {
        const control = document.getElementById?.(id);
        if (control) control.checked = checked;
    });
    const limit = document.getElementById?.('setting-tz-max-context');
    if (limit) limit.value = String(titan.maxContextChars);
    const repository = normalizeRepositorySettings(preferences.repository);
    const repoChecks = {
        'setting-repo-enabled': repository.enabled,
        'setting-repo-targeted-tests': repository.autoSelectTargetedTests,
        'setting-repo-consume-mcp': repository.consumeMcpRuntime,
        'setting-repo-include-extensions': true,
        'setting-repo-backup-required': true
    };
    Object.entries(repoChecks).forEach(([id, checked]) => {
        const control = document.getElementById?.(id);
        if (control) control.checked = checked;
    });
    const maxSearch = document.getElementById?.('setting-repo-max-search');
    if (maxSearch) maxSearch.value = String(repository.maxSearchResults);
    const maxRemote = document.getElementById?.('setting-repo-max-remote-context');
    if (maxRemote) maxRemote.value = String(repository.maxRemoteContextChars);
    const workforce = normalizeWorkforceSettings(preferences.workforce);
    const workforceChecks = {
        'setting-workforce-enabled': workforce.enabled,
        'setting-workforce-advisory-ai': workforce.allowAdvisoryAI,
        'setting-workforce-require-evidence': workforce.requireEvidence,
        'setting-workforce-use-repository': workforce.consumeRepositoryPack,
        'setting-workforce-use-mcp': workforce.consumeMcpRuntime,
        'setting-workforce-plan-advance': false,
        'setting-workforce-direct-mutation': false
    };
    Object.entries(workforceChecks).forEach(([id, checked]) => {
        const control = document.getElementById?.(id);
        if (control) control.checked = checked;
    });
    const maxManagers = document.getElementById?.('setting-workforce-max-managers');
    if (maxManagers) maxManagers.value = String(workforce.maxManagersPerTask);
    const maxContext = document.getElementById?.('setting-workforce-max-context');
    if (maxContext) maxContext.value = String(workforce.maxContextChars);
}

function applyPreferences(value = preferences) {
    preferences = normalizePreferences(value);
    document.body?.classList?.toggle?.('compact-mode', preferences.compactMode);
    document.body?.classList?.toggle?.('reduced-glow', preferences.reducedGlow);
    syncSettingsForm();
    const debuggingPlanMode = document.getElementById?.('debugging-plan-mode');
    if (debuggingPlanMode && !debuggingPlanMode.dataset?.userChanged) debuggingPlanMode.checked = preferences.debuggingPlanDefault;
    return preferences;
}

async function loadPreferences() {
    try {
        if (!chrome?.storage?.local?.get) {
            preferencesLoaded = true;
            return applyPreferences(DEFAULT_PREFERENCES);
        }
        const result = await chrome.storage.local.get([PREFERENCES_STORAGE_KEY, LAST_PAGE_STORAGE_KEY]);
        const stored = normalizePreferences(result?.[PREFERENCES_STORAGE_KEY] || DEFAULT_PREFERENCES);
        const remembered = String(result?.[LAST_PAGE_STORAGE_KEY] || '').trim().toLowerCase();
        const withPage = stored.rememberLastPage && Object.prototype.hasOwnProperty.call(APP_PAGE_CONTEXT, remembered)
            ? { ...stored, lastPage: remembered }
            : stored;
        preferencesLoaded = true;
        return applyPreferences(withPage);
    } catch (error) {
        console.error('[Titan Code] Could not load preferences:', error);
        preferencesLoaded = true;
        return applyPreferences(DEFAULT_PREFERENCES);
    }
}

function readSettingsForm() {
    const checked = (id, fallback) => {
        const control = document.getElementById?.(id);
        return control ? control.checked === true : fallback;
    };
    const numberValue = (id, fallback) => {
        const control = document.getElementById?.(id);
        const parsed = Number(control?.value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };
    const currentTitan = normalizeTitanZeroSettings(preferences.titanZero);
    const currentRepository = normalizeRepositorySettings(preferences.repository);
    const currentWorkforce = normalizeWorkforceSettings(preferences.workforce);
    return normalizePreferences({
        recoveryPolicyVersion: 2,
        compactMode: checked('setting-compact-mode', preferences.compactMode),
        reducedGlow: checked('setting-reduced-glow', preferences.reducedGlow),
        autoOpenPlans: checked('setting-auto-open-plans', preferences.autoOpenPlans),
        confirmBeforeStop: checked('setting-confirm-stop', preferences.confirmBeforeStop),
        rememberLastPage: checked('setting-remember-page', preferences.rememberLastPage),
        debuggingPlanDefault: checked('setting-debugging-plan-default', preferences.debuggingPlanDefault),
        autoRecoverySweep: checked('setting-auto-recovery-sweep', preferences.autoRecoverySweep),
        nextNudgerFeatureEnabled: checked('setting-next-nudger-feature', preferences.nextNudgerFeatureEnabled),
        nextNudgerDefault: checked('setting-next-nudger-default', preferences.nextNudgerDefault),
        backgroundWatchdog: checked('setting-background-watchdog', preferences.backgroundWatchdog),
        composerWatchdog: checked('setting-composer-watchdog', preferences.composerWatchdog),
        focusPulse: checked('setting-focus-pulse', preferences.focusPulse),
        targetedReload: checked('setting-targeted-reload', preferences.targetedReload),
        restorePreviousTab: checked('setting-restore-previous-tab', preferences.restorePreviousTab),
        preventAutoDiscard: checked('setting-prevent-auto-discard', preferences.preventAutoDiscard),
        lastPage: preferences.lastPage || activePage,
        titanZero: {
            enabled: checked('setting-tz-enabled', currentTitan.enabled),
            autoDetect: checked('setting-tz-auto-detect', currentTitan.autoDetect),
            analyzeSqlSchema: checked('setting-tz-sql', currentTitan.analyzeSqlSchema),
            analyzeMigrations: checked('setting-tz-migrations', currentTitan.analyzeMigrations),
            analyzeTenancy: checked('setting-tz-tenancy', currentTitan.analyzeTenancy),
            analyzeNavigationMetadata: checked('setting-tz-navigation', currentTitan.analyzeNavigationMetadata),
            analyzeFrontend: checked('setting-tz-frontend', currentTitan.analyzeFrontend),
            maxContextChars: numberValue('setting-tz-max-context', currentTitan.maxContextChars),
            includeExtensions: true,
            ignoreExtensions: false,
            parseSqlRows: false
        },
        repository: {
            enabled: checked('setting-repo-enabled', currentRepository.enabled),
            includeExtensions: true,
            maxSearchResults: numberValue('setting-repo-max-search', currentRepository.maxSearchResults),
            maxRemoteContextChars: numberValue('setting-repo-max-remote-context', currentRepository.maxRemoteContextChars),
            requireVerifiedBackupBeforeMutation: true,
            allowUnknownCommands: false,
            autoSelectTargetedTests: checked('setting-repo-targeted-tests', currentRepository.autoSelectTargetedTests),
            consumeMcpRuntime: checked('setting-repo-consume-mcp', currentRepository.consumeMcpRuntime),
            maxContextChars: currentRepository.maxContextChars
        },
        workforce: {
            enabled: checked('setting-workforce-enabled', currentWorkforce.enabled),
            maxManagersPerTask: numberValue('setting-workforce-max-managers', currentWorkforce.maxManagersPerTask),
            allowAdvisoryAI: checked('setting-workforce-advisory-ai', currentWorkforce.allowAdvisoryAI),
            requireEvidence: checked('setting-workforce-require-evidence', currentWorkforce.requireEvidence),
            consumeRepositoryPack: checked('setting-workforce-use-repository', currentWorkforce.consumeRepositoryPack),
            consumeMcpRuntime: checked('setting-workforce-use-mcp', currentWorkforce.consumeMcpRuntime),
            maxContextChars: numberValue('setting-workforce-max-context', currentWorkforce.maxContextChars),
            planAdvanceAuthority: false,
            directMutation: false
        }
    });
}

async function persistPreferences(nextPreferences) {
    const normalized = applyPreferences(nextPreferences);
    if (chrome?.storage?.local?.set) {
        await chrome.storage.local.set({ [PREFERENCES_STORAGE_KEY]: normalized, [LAST_PAGE_STORAGE_KEY]: normalized.lastPage });
    }
    try { await chrome.runtime?.sendMessage?.({ action: 'RECOVERY_PREFERENCES_CHANGED', preferences: normalized }); } catch (_error) {}
    return normalized;
}

async function syncTitanZeroRuntimeSettings(settings) {
    if (!chrome?.runtime?.sendMessage) return { ok: true, skipped: true };
    try {
        const response = await chrome.runtime.sendMessage({ action: 'UPDATE_TITAN_ZERO_SETTINGS', settings });
        if (!response || response.ok !== true) {
            return { ok: false, error: response?.error || 'Titan Zero runtime did not acknowledge settings sync' };
        }
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error?.message || String(error) };
    }
}

async function syncRepositoryRuntimeSettings(settings) {
    if (!chrome?.runtime?.sendMessage) return { ok: true, skipped: true };
    try {
        const response = await chrome.runtime.sendMessage({ action: 'UPDATE_REPOSITORY_SETTINGS', settings });
        if (!response || response.ok !== true) return { ok: false, error: response?.error || 'Repository runtime did not acknowledge settings sync' };
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error?.message || String(error) };
    }
}

async function syncWorkforceRuntimeSettings(settings) {
    if (!chrome?.runtime?.sendMessage) return { ok: true, skipped: true };
    try {
        const response = await chrome.runtime.sendMessage({ action: 'UPDATE_WORKFORCE_SETTINGS', settings });
        if (!response || response.ok !== true) return { ok: false, error: response?.error || 'Managers & AI Workforce runtime did not acknowledge settings sync' };
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error?.message || String(error) };
    }
}

async function savePreferences() {
    const status = document.getElementById?.('settings-status');
    try {
        const saved = await persistPreferences(readSettingsForm());
        const [titanSync, repositorySync, workforceSync] = await Promise.all([
            syncTitanZeroRuntimeSettings(saved.titanZero),
            syncRepositoryRuntimeSettings(saved.repository),
            syncWorkforceRuntimeSettings(saved.workforce)
        ]);
        capabilityRegistryCache = null;
        if (!titanSync.ok || !repositorySync.ok || !workforceSync.ok) {
            if (status) status.textContent = 'Settings saved locally; one or more capability runtime syncs failed.';
            setMessage('Settings saved locally; capability runtime sync will retry when Codee wakes.');
            if (!titanSync.ok) console.warn('[Titan Code] Titan Zero settings runtime sync failed:', titanSync.error);
            if (!repositorySync.ok) console.warn('[Titan Code] Repository settings runtime sync failed:', repositorySync.error);
            if (!workforceSync.ok) console.warn('[Titan Code] Managers & AI Workforce settings runtime sync failed:', workforceSync.error);
            return false;
        }
        if (status) status.textContent = 'Settings saved.';
        setMessage('Settings saved locally.');
        return true;
    } catch (error) {
        console.error('[Titan Code] Could not save preferences:', error);
        if (status) status.textContent = 'Could not save settings.';
        setMessage('Could not save settings.');
        return false;
    }
}

async function resetPreferences() {
    const status = document.getElementById?.('settings-status');
    try {
        const saved = await persistPreferences(DEFAULT_PREFERENCES);
        const [titanSync, repositorySync, workforceSync] = await Promise.all([
            syncTitanZeroRuntimeSettings(saved.titanZero),
            syncRepositoryRuntimeSettings(saved.repository),
            syncWorkforceRuntimeSettings(saved.workforce)
        ]);
        capabilityRegistryCache = null;
        if (!titanSync.ok || !repositorySync.ok || !workforceSync.ok) {
            if (status) status.textContent = 'Defaults restored locally; one or more capability runtimes did not sync.';
            setMessage('Defaults restored locally; capability runtime sync will retry when Codee wakes.');
            if (!titanSync.ok) console.warn('[Titan Code] Titan Zero defaults runtime sync failed:', titanSync.error);
            if (!repositorySync.ok) console.warn('[Titan Code] Repository defaults runtime sync failed:', repositorySync.error);
            if (!workforceSync.ok) console.warn('[Titan Code] Managers & AI Workforce defaults runtime sync failed:', workforceSync.error);
            return false;
        }
        if (status) status.textContent = 'Defaults restored.';
        setMessage('Settings reset to defaults.');
        return true;
    } catch (error) {
        console.error('[Titan Code] Could not reset preferences:', error);
        if (status) status.textContent = 'Could not reset settings.';
        setMessage('Could not reset settings.');
        return false;
    }
}

function registerSettingsHandlers() {
    document.getElementById?.('settings-save-btn')?.addEventListener?.('click', savePreferences);
    document.getElementById?.('settings-reset-btn')?.addEventListener?.('click', resetPreferences);
}

function navigationPageEntries() {
    return Array.isArray(navigationRegistryCache?.entries)
        ? navigationRegistryCache.entries.filter(entry => entry?.kind === 'page')
        : [];
}

function navigationEntryForPage(pageName) {
    const requested = String(pageName || '').trim().toLowerCase();
    return navigationPageEntries().find(entry => entry.page === requested) || null;
}

function isKnownNavigationPage(pageName) {
    const requested = String(pageName || '').trim().toLowerCase();
    if (navigationRegistryCache) return Boolean(navigationEntryForPage(requested));
    return Object.prototype.hasOwnProperty.call(APP_PAGE_CONTEXT, requested);
}

function navigationPageContext(pageName) {
    return navigationEntryForPage(pageName)?.context || APP_PAGE_CONTEXT[pageName] || APP_PAGE_CONTEXT.runner;
}

function renderNavigationFallback(reason = '') {
    navigationRegistryCache = { ready: false, fallback: true, entries: [] };
    const container = document.getElementById?.('codee-nav-links');
    if (!container) return false;
    container.replaceChildren();
    const group = document.createElement('div');
    group.className = 'nav-group-label';
    group.textContent = 'Workspace';
    const button = document.createElement('button');
    button.className = 'nav-link active';
    button.type = 'button';
    button.setAttribute('data-nav-page', 'runner');
    button.setAttribute('aria-current', 'page');
    const icon = document.createElement('span'); icon.textContent = '▶';
    const label = document.createElement('span'); label.textContent = 'Runner';
    button.append(icon, label);
    container.append(group, button);
    if (reason) container.setAttribute('data-navigation-warning', String(reason).slice(0, 240));
    return true;
}

function renderNavigationRegistry(payload) {
    const container = document.getElementById?.('codee-nav-links');
    if (!container) return false;
    const entries = Array.isArray(payload?.entries) ? payload.entries : [];
    if (!payload?.ready || !entries.some(entry => entry.id === 'workspace.runner')) return renderNavigationFallback(payload?.validation?.errors?.[0]?.code || 'registry-unavailable');
    const groups = entries.filter(entry => entry.kind === 'group').sort((a,b) => Number(a.order||0)-Number(b.order||0));
    const pages = entries.filter(entry => entry.kind === 'page');
    container.replaceChildren();
    for (const groupEntry of groups) {
        const children = pages.filter(entry => entry.parent === groupEntry.id).sort((a,b) => Number(a.order||0)-Number(b.order||0));
        if (!children.length) continue;
        const group = document.createElement('div');
        group.className = 'nav-group-label';
        group.textContent = groupEntry.label;
        container.appendChild(group);
        for (const entry of children) {
            const state = String(entry.resolved?.state || entry.readiness || 'DEPENDENCY_MISSING');
            const interactive = entry.resolved?.interactive === true;
            const button = document.createElement('button');
            button.className = `nav-link nav-state-${state.toLowerCase().replaceAll('_', '-')}`;
            button.type = 'button';
            button.setAttribute('data-nav-page', entry.page);
            button.setAttribute('data-readiness', state);
            button.setAttribute('aria-label', state === 'AVAILABLE' ? entry.label : `${entry.label} — ${state.replaceAll('_', ' ')}`);
            if (!interactive) {
                button.disabled = true;
                button.setAttribute('aria-disabled', 'true');
                button.title = `${entry.label}: ${state}`;
            }
            const icon = document.createElement('span'); icon.textContent = entry.icon || '•';
            const label = document.createElement('span'); label.textContent = entry.label;
            button.append(icon, label);
            if (state !== 'AVAILABLE') {
                const badge = document.createElement('span');
                badge.className = 'nav-readiness-badge';
                badge.textContent = state.replaceAll('_', ' ');
                button.appendChild(badge);
            }
            container.appendChild(button);
        }
    }
    return true;
}

async function loadNavigationRegistry() {
    try {
        if (!chrome?.runtime?.sendMessage) return renderNavigationFallback('worker-unavailable');
        const availableViews = Array.from(document.querySelectorAll?.('[data-page]') || []).map(page => page.getAttribute('data-page')).filter(Boolean);
        const response = await chrome.runtime.sendMessage({ action: 'GET_NAVIGATION_STATUS', availableViews });
        if (!response?.ok) return renderNavigationFallback(response?.error || 'navigation-status-failed');
        navigationRegistryCache = response;
        renderNavigationRegistry(response);
        return response;
    } catch (error) {
        console.warn('[Titan Code] Navigation registry unavailable:', error);
        navigationRegistryCache = null;
        renderNavigationFallback(error?.message || 'navigation-registry-error');
        return null;
    }
}

function rememberActivePage(pageName) {
    if (!preferencesLoaded || !preferences.rememberLastPage) return;
    if (!isKnownNavigationPage(pageName)) return;
    if (preferences.lastPage === pageName) return;
    preferences = { ...preferences, lastPage: pageName };
    if (chrome?.storage?.local?.set) {
        chrome.storage.local.set({ [LAST_PAGE_STORAGE_KEY]: pageName }).catch?.(() => {});
    }
}

function setActivePage(pageName) {
    const requested = String(pageName || '').trim().toLowerCase();
    const requestedEntry = navigationEntryForPage(requested);
    const canUseRequestedPage = navigationRegistryCache
        ? requestedEntry?.resolved?.interactive === true
        : Object.prototype.hasOwnProperty.call(APP_PAGE_CONTEXT, requested);
    const nextPage = canUseRequestedPage ? requested : 'runner';
    activePage = nextPage;

    document.querySelectorAll?.('[data-page]').forEach(page => {
        const isActive = page.getAttribute('data-page') === nextPage;
        page.classList.toggle('active', isActive);
        page.hidden = !isActive;
    });

    document.querySelectorAll?.('[data-nav-page]').forEach(link => {
        const isActive = link.getAttribute('data-nav-page') === nextPage;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });

    const pageContext = document.getElementById?.('page-context');
    if (pageContext) pageContext.textContent = navigationPageContext(nextPage);

    if (nextPage === 'dashboard') loadDashboardStatus({ force: true }).catch(() => {});
    if (nextPage === 'connections') loadConnectionsWorkspace({ force: true }).catch(() => {});
    if (nextPage === 'mcp') loadMcpInspector({ force: true }).catch(() => {});
    if (nextPage === 'browser') loadBrowserWorkspace({ force: true }).catch(() => {});
    if (nextPage === 'repository-host') loadHostOperations().catch(() => {});
    if (nextPage === 'plans') updateTabsList();
    if (['history','artifacts','intelligence','workforce','repository','titan-zero','knowledge'].includes(nextPage)) loadWorkspacePage(nextPage).catch(() => {});
    if (nextPage === 'prompts' || nextPage === 'skills') loadCapabilityLibraries().catch(() => {});
    if (nextPage === 'diagnostics') { loadTitanZeroStatus().catch(() => {}); loadRepositoryStatus().catch(() => {}); loadCapabilityRegistryUi({ force: true }).catch(() => {}); }
    rememberActivePage(nextPage);
    closeNavigation({ restoreFocus: false });
    return nextPage;
}


async function loadBrowserWorkspace({ force = false } = {}) {
    const statusEl=workspaceElement('browser-runtime-status'), host=workspaceElement('browser-tab-list');
    if(statusEl) statusEl.textContent=force?'Refreshing browser runtime…':'Loading browser runtime…';
    const [status,tabs]=await Promise.all([chrome.runtime.sendMessage({action:'GET_BROWSER_STATUS'}),chrome.runtime.sendMessage({action:'GET_BROWSER_TABS'})]);
    if(!status?.ok) throw new Error(status?.error||'Browser status unavailable');
    if(!tabs?.ok) throw new Error(tabs?.error||'Browser tabs unavailable');
    if(statusEl) statusEl.textContent=`Runtime ready · ${status.implemented||0}/${status.total||0} capabilities implemented · ${tabs.tabs?.length||0} tabs visible`;
    if(host){host.replaceChildren();for(const tab of tabs.tabs||[]){const row=document.createElement('div');row.className='library-card';const h=document.createElement('strong');h.textContent=tab.title||`Tab ${tab.id}`;const meta=document.createElement('p');meta.textContent=`#${tab.id} · ${tab.active?'active':'background'} · ${tab.status}`;const url=document.createElement('small');url.textContent=tab.url||'URL unavailable';const inspect=document.createElement('button');inspect.type='button';inspect.className='btn btn-secondary';inspect.textContent='Inspect';inspect.addEventListener('click',async()=>{workspaceSetText('browser-perception-status',`Inspecting tab #${tab.id}…`);const r=await chrome.runtime.sendMessage({action:'GET_BROWSER_SNAPSHOT',tabId:tab.id});if(!r?.ok){workspaceSetText('browser-perception-status',r?.error||'Snapshot unavailable');return;}const snap=r.snapshot||{};workspaceSetText('browser-perception-status',`Snapshot r${snap.revision||0} · ${(snap.elements||[]).length} semantic elements · ${snap.title||'Untitled page'}`);workspaceSetText('browser-snapshot-preview',JSON.stringify({title:snap.title,url:snap.url,elements:(snap.elements||[]).slice(0,20)},null,2));});const interact=document.createElement('div');interact.className='browser-nav-controls';const ref=document.createElement('input');ref.placeholder='ref e.g. r1';ref.setAttribute('aria-label',`Element reference for tab ${tab.id}`);const text=document.createElement('input');text.placeholder='Text to type';text.setAttribute('aria-label',`Text to type in tab ${tab.id}`);const run=async(operation,extra={})=>{let r=await chrome.runtime.sendMessage({action:'BROWSER_INTERACT',operation,tabId:tab.id,ref:ref.value,...extra});if(!r?.ok&&['not-connected','interactive-grant-required','read-grant-required'].includes(r?.error)){await chrome.runtime.sendMessage({action:'BROWSER_POLICY_CONNECT',tabId:tab.id});await chrome.runtime.sendMessage({action:'BROWSER_POLICY_GRANT',tabId:tab.id,grant:'read'});await chrome.runtime.sendMessage({action:'BROWSER_POLICY_GRANT',tabId:tab.id,grant:'interactive'});r=await chrome.runtime.sendMessage({action:'BROWSER_INTERACT',operation,tabId:tab.id,ref:ref.value,...extra});}workspaceSetText('browser-perception-status',r?.ok?`${operation} complete · tab #${tab.id}`:(r?.error||'Interaction failed'));};interact.append(ref,text);for(const [label,op,extra] of [['Click','click',{}],['Focus','focus',{}],['Clear','clear',{}],['Type','type',{get text(){return text.value},clearFirst:false}],['Enter','press_key',{key:'Enter'}]]){const b=document.createElement('button');b.type='button';b.className='btn btn-secondary';b.textContent=label;b.addEventListener('click',()=>run(op,op==='type'?{text:text.value,clearFirst:false}:extra));interact.appendChild(b);}const controls=document.createElement('div');controls.className='browser-nav-controls';
const address=document.createElement('input');address.type='url';address.value=tab.url||'';address.placeholder='https://example.com';address.setAttribute('aria-label',`Navigate tab ${tab.id}`);
const navAction=async(operation)=>{workspaceSetText('browser-runtime-status',`${operation} tab #${tab.id}…`);const payload={action:'BROWSER_NAVIGATE',operation,tabId:tab.id};if(operation==='navigate')payload.url=address.value;let r=await chrome.runtime.sendMessage(payload);if(!r?.ok&&['not-connected','interactive-grant-required','read-grant-required'].includes(r?.error)){await chrome.runtime.sendMessage({action:'BROWSER_POLICY_CONNECT',tabId:tab.id});await chrome.runtime.sendMessage({action:'BROWSER_POLICY_GRANT',tabId:tab.id,grant:'read'});await chrome.runtime.sendMessage({action:'BROWSER_POLICY_GRANT',tabId:tab.id,grant:'interactive'});r=await chrome.runtime.sendMessage(payload);}if(!r?.ok){workspaceSetText('browser-runtime-status',r?.error||'Navigation failed');return;}workspaceSetText('browser-runtime-status',`${operation} complete · tab #${tab.id}`);await loadBrowserWorkspace({force:true});};
for(const [label,op] of [['←','back'],['→','forward'],['↻','reload'],['Go','navigate']]){const b=document.createElement('button');b.type='button';b.className='btn btn-secondary';b.textContent=label;b.addEventListener('click',()=>navAction(op));controls.appendChild(b);}
controls.insertBefore(address,controls.lastChild);
const observability=document.createElement('div');observability.className='browser-nav-controls';
const obsStatus=document.createElement('small');obsStatus.textContent='Diagnostics: ready';
const obsPre=document.createElement('pre');obsPre.className='browser-observability-preview';obsPre.style.maxHeight='180px';obsPre.style.overflow='auto';
const showObs=async(operation)=>{obsStatus.textContent=`Loading ${operation}…`;const r=await chrome.runtime.sendMessage({action:'GET_BROWSER_OBSERVABILITY',operation,tabId:tab.id,limit:100});if(!r?.ok){obsStatus.textContent=r?.error||'Diagnostics unavailable';return;}const data=operation==='network'||operation==='networkErrors'?r.requests:r.events;obsStatus.textContent=`${operation}: ${data?.length||0} item(s)`;obsPre.textContent=JSON.stringify(data?.slice?.(-50)||data||[],null,2);};
for(const [label,op] of [['Console','latest'],['Console errors','errors'],['Network','network'],['Network errors','networkErrors'],['Clear diagnostics','clear']]){const b=document.createElement('button');b.type='button';b.className='btn btn-secondary';b.textContent=label;b.addEventListener('click',()=>showObs(op));observability.appendChild(b);}
observability.append(obsStatus,obsPre);
const dev=document.createElement('div');dev.className='browser-nav-controls';
const devStatus=document.createElement('small');devStatus.textContent='Developer inspection: ready';
const devRef=document.createElement('input');devRef.placeholder='ref e.g. r1';devRef.setAttribute('aria-label',`Developer inspection reference for tab ${tab.id}`);
const devRun=async(operation)=>{devStatus.textContent=`Loading ${operation}…`;const r=await chrome.runtime.sendMessage({action:'GET_BROWSER_DEVELOPER_INSPECTION',operation,tabId:tab.id,ref:devRef.value});if(!r?.ok){devStatus.textContent=r?.error||'Developer inspection unavailable';return;}devStatus.textContent=`${operation} complete · tab #${tab.id}`;obsPre.textContent=JSON.stringify(r.result||r,null,2);};
for(const [label,op] of [['Styles','styles'],['React source','react_source']]){const b=document.createElement('button');b.type='button';b.className='btn btn-secondary';b.textContent=label;b.addEventListener('click',()=>devRun(op));dev.appendChild(b);}
dev.append(devRef,devStatus);
row.append(h,meta,url,controls,inspect,interact,observability,dev);host.appendChild(row);}if(!(tabs.tabs||[]).length)host.textContent='No browser tabs are currently visible.';}
    return {status,tabs};
}

function workspaceElement(id) { return document.getElementById?.(id) || null; }
function workspaceSetText(id, value) { const el = workspaceElement(id); if (el) el.textContent = String(value ?? ''); }
function workspaceClear(id) { const el = workspaceElement(id); if (el) while (el.firstChild) el.removeChild(el.firstChild); return el; }
function workspaceCard(title, lines = [], meta = '') {
    const card = document.createElement('article'); card.className = 'workspace-card';
    const heading = document.createElement('div'); heading.className = 'workspace-card-heading';
    const h3 = document.createElement('h3'); h3.textContent = String(title || 'Item'); heading.appendChild(h3);
    if (meta) { const badge = document.createElement('span'); badge.className = 'workspace-card-meta'; badge.textContent = String(meta); heading.appendChild(badge); }
    card.appendChild(heading);
    for (const line of lines.filter(Boolean)) { const row = document.createElement('div'); row.className = 'workspace-card-row'; row.textContent = String(line); card.appendChild(row); }
    return card;
}
function workspaceMatches(value, query) { return !query || String(value || '').toLowerCase().includes(query.toLowerCase()); }
function workspacePlanRecords(state) {
    return Object.entries(state || {}).filter(([key, value]) => key.startsWith('plan_') && value && typeof value === 'object')
        .map(([key, plan]) => ({ key, tabId: Number(key.slice(5)), plan })).filter(row => Number.isInteger(row.tabId));
}
function workspaceArtifactRecords(state) {
    const rows = [];
    for (const { tabId, plan } of workspacePlanRecords(state)) {
        const sources = [plan.artifactHistory, plan.artifactReceipts, plan.verificationReceipts].filter(Array.isArray);
        for (const list of sources) for (let sourceIndex = 0; sourceIndex < list.length; sourceIndex += 1) {
            const item = list[sourceIndex]; if (!item || typeof item !== 'object') continue;
            rows.push({ tabId, plan, item, sourceIndex });
        }
        if (plan.lastArtifactSha256 || plan.lastArtifactZip || plan.lastArtifactName) {
            rows.push({ tabId, plan, item: { sha256: plan.lastArtifactSha256, zip: plan.lastArtifactZip || plan.lastArtifactName, status: plan.lastArtifactValidationReason ? 'failed' : 'latest', at: plan.lastArtifactSeenAt } });
        }
    }
    return rows;
}
async function loadHistoryWorkspace() {
    const data = await chrome.storage.local.get(['codeeState']); const records = workspacePlanRecords(data.codeeState || {});
    const query = String(workspaceElement('history-search')?.value || '').trim().toLowerCase();
    const terminal = records.filter(({ plan }) => Boolean(plan.completedAt) || ['completed','failed','blocked','stopped','cancelled'].includes(String(plan.dispatchStatus || '').toLowerCase()));
    const visible = terminal.filter(({ plan, tabId }) => workspaceMatches(`${plan.planId || ''} ${plan.runId || ''} ${plan.dispatchStatus || ''} ${plan.target?.title || ''} ${tabId}`, query));
    workspaceSetText('history-summary', `${visible.length} shown · ${terminal.length} retained terminal plans`); const list = workspaceClear('history-list');
    if (!visible.length) list?.appendChild(workspaceCard('No matching history', ['Completed, failed, blocked and stopped plans will appear here.']));
    for (const { tabId, plan } of visible.sort((a,b) => Number(b.plan.completedAt || b.plan.lastDispatchedAt || 0)-Number(a.plan.completedAt || a.plan.lastDispatchedAt || 0))) {
        list?.appendChild(workspaceCard(plan.target?.title || plan.planId || `Tab ${tabId}`, [`Status: ${plan.dispatchStatus || (plan.completedAt ? 'completed' : 'stopped')}`, `Progress: ${Math.min(Number(plan.stepIndex || 0)+1, Array.isArray(plan.plan)?plan.plan.length:0)} / ${Array.isArray(plan.plan)?plan.plan.length:0}`, `Plan: ${plan.planId || '—'}`, `Run: ${plan.runId || '—'}`], plan.completedAt ? new Date(Number(plan.completedAt)).toLocaleString() : 'retained'));
    }
    workspaceSetText('history-status', 'History loaded from Titan Code local plan state.'); return visible;
}
async function showArtifactDetail(tabId, index, fallback = null) {
    const panel = workspaceElement('artifact-detail');
    if (!panel) return null;
    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_ARTIFACT_DETAIL', tabId, index });
        const detail = response?.ok ? response.detail : fallback;
        panel.hidden = false;
        panel.textContent = JSON.stringify(detail || { error: response?.error || 'Artifact detail unavailable' }, null, 2);
        return detail;
    } catch (error) { panel.hidden = false; panel.textContent = `Artifact detail unavailable: ${error?.message || String(error)}`; return null; }
}
async function loadArtifactsWorkspace() {
    const data = await chrome.storage.local.get(['codeeState']); const rows = workspaceArtifactRecords(data.codeeState || {});
    const query = String(workspaceElement('artifact-search')?.value || '').trim().toLowerCase();
    const visible = rows.filter(({ plan, item }) => workspaceMatches(`${plan.planId || ''} ${item.zip || item.name || item.filename || ''} ${item.sha256 || item.hash || ''} ${item.status || ''}`, query));
    workspaceSetText('artifact-summary', `${visible.length} shown · ${rows.length} retained artifact records`); const list = workspaceClear('artifact-list');
    if (!visible.length) list?.appendChild(workspaceCard('No matching artifacts', ['Verified build receipts and artifact lineage will appear here.']));
    for (const row of visible.slice().reverse()) {
        const { tabId, plan, item } = row; const card = workspaceCard(item.zip || item.name || item.filename || 'Artifact receipt', [`Plan: ${plan.planId || '—'}`, `Status: ${item.status || item.verificationStatus || 'recorded'}`, `SHA256: ${item.sha256 || item.hash || '—'}`], item.at || item.createdAt || item.verifiedAt || 'retained');
        const button = document.createElement('button'); button.type='button'; button.className='btn btn-secondary workspace-card-action'; button.textContent='Open artifact details'; button.addEventListener('click',()=>showArtifactDetail(tabId, Number(row.sourceIndex ?? 0), {tabId,planId:plan.planId||'',runId:plan.runId||'',item})); card.appendChild(button); list?.appendChild(card);
    }
    workspaceSetText('artifact-status', 'Click an artifact to inspect its retained receipt and verification metadata.'); return visible;
}
async function loadStatusWorkspace(page, action, formatter) {
    const response = await chrome.runtime.sendMessage({ action });
    const list = workspaceClear(`${page}-list`); const formatted = formatter(response);
    workspaceSetText(`${page}-summary`, response?.registered === false ? 'Subsystem unavailable' : 'Live runtime status');
    list?.appendChild(workspaceCard(page === 'titan-zero' ? 'Titan Zero runtime' : page[0].toUpperCase()+page.slice(1), String(formatted || '').split('\n')));
    workspaceSetText(`${page}-status`, response?.ok === false ? (response.error || 'Status unavailable') : 'Live status refreshed.'); return response;
}
function renderSystemIntegrationStatus(status) {
    const panel=workspaceElement('system-integration-status'); if(!panel)return status;
    const ollama=status?.bridge?.ollama||{}; const models=ollama.models||[]; const gemini=status?.gemini||{};
    panel.textContent=[`Titan Bridge: ${status?.bridge?.connected?'CONNECTED':(status?.bridge?.reason||'disconnected')}`,`Ollama: ${ollama.health?.ok?'READY':(ollama.health?.error||'not detected')}`,`Ollama models: ${models.map(m=>m.name).join(', ')||'none'}`,`Gemini: ${gemini.connected?'CONNECTED':(gemini.configured?'configured / not connected':'API key not configured')}`,`Gemini model: ${gemini.selectedModel||gemini.model||'auto'}`,`Gateway providers: ${(status?.providerRows||[]).map(p=>`${p.id} (${p.lifecycle})`).join(', ')||'none'}`].join('\n');
    const select=workspaceElement('system-gemini-model'); if(select&&Array.isArray(gemini.models)){const current=select.value; while(select.options.length>1)select.remove(1); for(const m of gemini.models){const o=document.createElement('option');o.value=m.id;o.textContent=m.displayName||m.id;select.appendChild(o);}if(current)select.value=current;else if(gemini.selectedModel)select.value=gemini.selectedModel;}
    return status;
}
async function probeSystemIntegration(){const status=await chrome.runtime.sendMessage({action:'GET_SYSTEM_INTEGRATION_STATUS',probe:true});if(!status?.ok)throw new Error(status?.error||'System integration probe failed');return renderSystemIntegrationStatus(status);}
async function saveSystemIntegrationSettings(){const settings={bridgeEnabled:true,bridgeEndpoint:workspaceElement('system-bridge-endpoint')?.value||'',bridgeToken:workspaceElement('system-bridge-token')?.value||undefined,bridgeWorkspace:workspaceElement('system-bridge-workspace')?.value||'',geminiEnabled:true,geminiApiKey:workspaceElement('system-gemini-key')?.value||undefined,geminiModel:workspaceElement('system-gemini-model')?.value||'',localFirst:true,freeFirst:true};const response=await chrome.runtime.sendMessage({action:'UPDATE_SYSTEM_INTEGRATION_SETTINGS',settings});if(!response?.ok)throw new Error(response?.error||'Could not save integration settings');return renderSystemIntegrationStatus(response.status);}
async function loadIntelligenceWorkspace() {
    const [gateway, registry, dashboard, system] = await Promise.all([chrome.runtime.sendMessage({ action: 'GET_AI_GATEWAY_STATUS' }),chrome.runtime.sendMessage({ action: 'GET_CAPABILITY_REGISTRY' }),chrome.runtime.sendMessage({ action: 'GET_DASHBOARD_STATUS' }),chrome.runtime.sendMessage({action:'GET_SYSTEM_INTEGRATION_STATUS',probe:true})]);
    if(system?.ok){renderSystemIntegrationStatus(system);const settings=system.settings||{};if(workspaceElement('system-bridge-endpoint'))workspaceElement('system-bridge-endpoint').value=settings.bridgeEndpoint||'http://127.0.0.1:43127/v1/action';if(workspaceElement('system-bridge-workspace'))workspaceElement('system-bridge-workspace').value=settings.bridgeWorkspace||'';}
    const list = workspaceClear('intelligence-list'); const capabilities = Array.isArray(registry?.capabilities) ? registry.capabilities : Array.isArray(registry?.entries) ? registry.entries : []; const ready = capabilities.filter(row => String(row.readiness || row.resolved?.state || '').toUpperCase() === 'READY').length;
    workspaceSetText('intelligence-summary', `${ready} ready capabilities · ${(system?.providerRows||[]).length} configured AI providers`); for(const provider of system?.providerRows||[])list?.appendChild(workspaceCard(provider.displayName||provider.id,[`Lifecycle: ${provider.lifecycle}`,`Transport: ${provider.transport}`],provider.id)); list?.appendChild(workspaceCard('Capability Registry', [`Registered: ${capabilities.length || registry?.summary?.registered || 0}`, `Ready now: ${ready || registry?.summary?.ready || 0}`, 'Authority: providers advise; Titan Code remains plan authority.'])); if (dashboard?.dashboard) list?.appendChild(workspaceCard('Runtime overview', [`Active plans: ${dashboard.dashboard?.plans?.active ?? dashboard.dashboard?.activePlans ?? '—'}`, `Diagnostics: ${dashboard.dashboard?.diagnostics?.status || 'available'}`])); workspaceSetText('intelligence-status','Provider and capability runtime refreshed.'); return { gateway, registry, dashboard, system };
}
async function loadKnowledgeWorkspace() {
    const [titan, repository, workforce] = await Promise.all([
        chrome.runtime.sendMessage({ action: 'GET_TITAN_ZERO_STATUS' }), chrome.runtime.sendMessage({ action: 'GET_REPOSITORY_STATUS' }), chrome.runtime.sendMessage({ action: 'GET_WORKFORCE_STATUS' })
    ]);
    const query = String(workspaceElement('knowledge-search')?.value || '').trim().toLowerCase(); const packs = [
        { name: titan?.pack?.title || 'Titan Zero Developer Intelligence', version: titan?.pack?.version, counts: titan?.counts },
        { name: repository?.pack?.title || 'Repository & Coding Intelligence', version: repository?.pack?.version, counts: repository?.counts },
        { name: workforce?.pack?.title || 'Managers & AI Workforce', version: workforce?.pack?.version, counts: workforce?.counts }
    ].filter(row => workspaceMatches(`${row.name} ${row.version || ''}`, query));
    const list = workspaceClear('knowledge-list'); workspaceSetText('knowledge-summary', `${packs.length} intelligence packs shown`);
    for (const pack of packs) list?.appendChild(workspaceCard(pack.name, [`Version: ${pack.version || '—'}`, `Prompts: ${pack.counts?.prompts || 0}`, `Skills: ${pack.counts?.skills || 0}`, `Profiles: ${pack.counts?.profiles || 0}`, `Context providers: ${pack.counts?.contextProviders || 0}`]));
    workspaceSetText('knowledge-status', 'Knowledge inventory reflects registered runtime packs and preserves their authority boundaries.'); return packs;
}
async function runWorkforceWorkspaceAdvisory(){const task=String(workspaceElement('workforce-workspace-task')?.value||'').trim();if(!task){workspaceSetText('workforce-status','Enter a task for the AI Workforce.');return null;}const provider=workspaceElement('workforce-provider-select')?.value||'auto';const out=workspaceElement('workforce-advisory-output');if(out){out.hidden=false;out.textContent='Running manager routing and provider advisory…';}try{const response=await chrome.runtime.sendMessage({action:'RUN_WORKFORCE_ADVISORY',input:{task,provider}});if(!response?.ok)throw new Error(response?.error||'AI Workforce failed');const lines=[`Task: ${response.task}`,`Managers: ${(response.prepared?.selected||[]).map(m=>m.name).join(', ')||'none'}`,`Providers: ${(response.providers||[]).map(p=>p.id).join(', ')||'none'}`];for(const row of response.results||[]){const a=row.advisory||{};lines.push('',`[${row.manager?.name||row.manager?.id}]`,a.response?.response||a.reason||(a.queued?'Queued: no configured provider':'No response'));}if(out)out.textContent=lines.join('\n');workspaceSetText('workforce-status','AI Workforce advisory completed. Results are evidence only and do not advance plans.');return response;}catch(error){if(out)out.textContent=`AI Workforce failed: ${error?.message||String(error)}`;workspaceSetText('workforce-status','AI Workforce request failed.');return null;}}
async function callRepositoryBridgeAction(action,payload={}){const out=workspaceElement('repository-bridge-output');if(out){out.hidden=false;out.textContent=`Calling ${action}…`;}try{const response=await chrome.runtime.sendMessage({action:'CALL_TITAN_BRIDGE',bridgeAction:action,payload});if(!response?.ok)throw new Error(response?.reason||response?.error||'Bridge action failed');if(out)out.textContent=JSON.stringify(response.result,null,2);workspaceSetText('repository-status',`${action} completed through Titan Bridge.`);return response.result;}catch(error){if(out)out.textContent=`${action} failed: ${error?.message||String(error)}`;workspaceSetText('repository-status','Titan Bridge action failed.');return null;}}
function deploymentConsoleRows(value) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'object') return value == null ? [] : [value];
    for (const key of ['items','rows','participants','assignments','evidence','requests','gaps','approvals','handoffs','change_requests','receipts','plans']) if (Array.isArray(value[key])) return value[key];
    return [value];
}
function deploymentItemTitle(row, fallback = 'Item') {
    if (!row || typeof row !== 'object') return String(row ?? fallback);
    return String(row.name || row.title || row.label || row.role_name || row.actor_name || row.finding || row.reason || row.operation || row.state || row.status || row.deployment_mission_id || row.id || fallback);
}
function renderDeploymentList(id, value, emptyText) {
    const box = workspaceClear(id); if (!box) return;
    const rows = deploymentConsoleRows(value);
    if (!rows.length) { const empty=document.createElement('div'); empty.className='workspace-empty'; empty.textContent=emptyText; box.appendChild(empty); return; }
    for (const raw of rows.slice(0,80)) {
        const row = raw && typeof raw === 'object' ? raw : {value:raw};
        const item=document.createElement('article'); item.className='deployment-workforce-item';
        const strong=document.createElement('strong'); strong.textContent=deploymentItemTitle(row); item.appendChild(strong);
        const details=[];
        for (const key of ['role','role_definition_id','actor_id','worker_id','state','status','stage','phase','decision_state','severity','readiness','confidence','updated_at','created_at','recorded_at']) if (row[key] != null && String(row[key]) !== String(strong.textContent)) details.push(`${key.replaceAll('_',' ')}: ${String(row[key])}`);
        if (Array.isArray(row.evidence_refs) && row.evidence_refs.length) details.push(`evidence: ${row.evidence_refs.slice(0,5).join(', ')}`);
        if (row.deployment_mission_id) details.push(`mission: ${row.deployment_mission_id}`);
        const span=document.createElement('span'); span.textContent=details.slice(0,6).join(' · ') || JSON.stringify(row).slice(0,600); item.appendChild(span); box.appendChild(item);
    }
}
function deploymentProjection(state,key){return state?.projections?.[key]?.data ?? null;}
function renderDeploymentWorkforceConsole(response={}) {
    const config=response.config||{}, state=response.state||{}, summary=response.summary||{};
    const endpoint=workspaceElement('workforce-gateway-endpoint'), company=workspaceElement('workforce-gateway-company'), actor=workspaceElement('workforce-gateway-actor');
    if(endpoint && !endpoint.matches(':focus')) endpoint.value=config.endpoint||'';
    if(company && !company.matches(':focus')) company.value=config.company_id||'';
    if(actor && !actor.matches(':focus')) actor.value=config.actor_id||'';
    const badge=workspaceElement('workforce-gateway-badge'); if(badge){const connected=response.connected===true; badge.textContent=connected?'Connected':(config.endpoint?'Configured':'Not configured'); badge.className=`health-badge ${connected?'ready':(config.endpoint?'neutral':'neutral')}`;}
    const status=workspaceElement('workforce-gateway-status'); if(status) status.textContent=[`Endpoint: ${config.endpoint||'not configured'}`,`Company: ${config.company_id||'not selected'}`,`Actor: ${config.actor_id||'not selected'}`,`Connection: ${response.connected?'CONNECTED':(response.reason||'not probed')}`,`Pending requests: ${summary.pending_count||0}`,`Authority: Chrome requests are non-authoritative; Laravel applies policy/permission/autonomy/risk gates.`].join('\n');
    const select=workspaceElement('workforce-deployment-mission-select'); if(select){const selected=state.selected_mission_id||''; while(select.options.length>1)select.remove(1); for(const m of state.missions||[]){const o=document.createElement('option');o.value=String(m.deployment_mission_id||m.id||'');o.textContent=String(m.name||m.title||m.client_name||o.value);select.appendChild(o);}select.value=selected;}
    const mission=(state.missions||[]).find(m=>String(m.deployment_mission_id||m.id||'')===String(state.selected_mission_id||''))||deploymentProjection(state,'mission');
    workspaceSetText('workforce-deployment-summary', mission ? String(mission.name||mission.title||mission.deployment_mission_id||state.selected_mission_id||'Mission loaded') : (state.selected_mission_id||'No mission loaded'));
    workspaceSetText('workforce-deployment-phase', mission?.phase||mission?.stage||mission?.state||'—');
    const readiness=deploymentProjection(state,'readiness'); workspaceSetText('workforce-deployment-readiness-score', readiness?.score ?? readiness?.readiness ?? readiness?.state ?? '—');
    workspaceSetText('workforce-deployment-receipt-count', String((state.receipts||[]).length));
    const detail=workspaceElement('workforce-deployment-mission-detail'); if(detail) detail.textContent=mission?JSON.stringify(mission,null,2):'No deployment mission selected.';
    renderDeploymentList('workforce-deployment-team',deploymentProjection(state,'participation'),'No team projection loaded.');
    renderDeploymentList('workforce-deployment-evidence',deploymentProjection(state,'evidence'),'No evidence projection loaded.');
    renderDeploymentList('workforce-deployment-readiness',readiness,'No readiness projection loaded.');
    const delivery=[]; for(const key of ['engineering','installation','commissioning']){const value=deploymentProjection(state,key);if(value!=null)delivery.push({name:key,...(value&&typeof value==='object'&&!Array.isArray(value)?value:{value})});} renderDeploymentList('workforce-deployment-delivery',delivery,'No delivery projection loaded.');
    const handover=[]; const h=deploymentProjection(state,'handover'), cr=deploymentProjection(state,'change_request'); if(h!=null)handover.push({name:'Handover',...(h&&typeof h==='object'&&!Array.isArray(h)?h:{value:h})}); for(const row of deploymentConsoleRows(cr))handover.push({name:`Change request · ${deploymentItemTitle(row)}`,...(row&&typeof row==='object'?row:{value:row})}); renderDeploymentList('workforce-deployment-handover',handover,'No handover or change-request projection loaded.');
    renderDeploymentList('workforce-deployment-receipts',(state.receipts||[]).slice().reverse(),'No gateway receipts yet.');
    if(Array.isArray(response.errors)&&response.errors.length)workspaceSetText('workforce-status',`Deployment refresh completed with ${response.errors.length} unavailable projection(s). Existing local state was preserved.`);
    return response;
}
async function loadDeploymentWorkforceConsole(options={}){const response=await chrome.runtime.sendMessage({action:'GET_DEPLOYMENT_WORKFORCE_CONSOLE',options});if(!response?.ok)throw new Error(response?.error||'Deployment workforce console unavailable');return renderDeploymentWorkforceConsole(response);}
async function saveDeploymentWorkforceGateway(){const config={enabled:true,endpoint:workspaceElement('workforce-gateway-endpoint')?.value||'',token:workspaceElement('workforce-gateway-token')?.value||undefined,company_id:workspaceElement('workforce-gateway-company')?.value||'',actor_id:workspaceElement('workforce-gateway-actor')?.value||''};const saved=await chrome.runtime.sendMessage({action:'UPDATE_DEPLOYMENT_WORKFORCE_GATEWAY_CONFIG',config});if(!saved?.ok)throw new Error(saved?.error||'Could not save Workforce Gateway config');const token=workspaceElement('workforce-gateway-token');if(token)token.value='';const refreshed=await chrome.runtime.sendMessage({action:'REFRESH_DEPLOYMENT_WORKFORCE',options:{}});if(!refreshed?.ok)throw new Error(refreshed?.error||'Workforce Gateway probe failed');return renderDeploymentWorkforceConsole(refreshed);}
async function refreshDeploymentWorkforce(){workspaceSetText('workforce-status','Refreshing Deployment Workforce from Laravel…');const response=await chrome.runtime.sendMessage({action:'REFRESH_DEPLOYMENT_WORKFORCE',options:{deployment_mission_id:workspaceElement('workforce-deployment-mission-select')?.value||undefined}});if(!response?.ok)throw new Error(response?.error||'Deployment Workforce refresh failed');workspaceSetText('workforce-status','Deployment Workforce refreshed from Laravel.');return renderDeploymentWorkforceConsole(response);}
async function selectDeploymentMission(){const id=workspaceElement('workforce-deployment-mission-select')?.value||'';const response=await chrome.runtime.sendMessage({action:'SELECT_DEPLOYMENT_WORKFORCE_MISSION',deployment_mission_id:id});if(!response?.ok)throw new Error(response?.error||'Mission selection failed');renderDeploymentWorkforceConsole(response);if(id)return refreshDeploymentWorkforce();return response;}
async function submitDeploymentWorkforceOperation(operation,payload={}){const missionId=workspaceElement('workforce-deployment-mission-select')?.value||undefined;workspaceSetText('workforce-status',`Submitting ${operation} to Laravel governance…`);const response=await chrome.runtime.sendMessage({action:'SUBMIT_DEPLOYMENT_WORKFORCE_REQUEST',input:{operation,deployment_mission_id:missionId,payload}});if(!response?.ok)throw new Error(response?.error||`${operation} failed`);renderDeploymentWorkforceConsole(response);workspaceSetText('workforce-status',`${operation} submitted. Receipt recorded; execution remains subject to Laravel authority gates.`);return response;}
async function createDeploymentMissionRequest(){const objective=String(workspaceElement('workforce-workspace-task')?.value||'').trim();if(!objective)throw new Error('Enter the client/deployment objective in Task for AI Workforce first.');return submitDeploymentWorkforceOperation('deployment.mission.create',{objective});}
async function requestDeploymentTransition(){const transition=workspaceElement('workforce-deployment-transition')?.value||'';if(!transition)throw new Error('Choose a governed transition first.');return submitDeploymentWorkforceOperation('deployment.mission.advance',{requested_stage:transition});}
async function requestDeploymentEvidence(){const request=String(workspaceElement('workforce-workspace-task')?.value||'').trim()||'Collect the next evidence required by deployment readiness.';return submitDeploymentWorkforceOperation('deployment.evidence.request',{request});}
async function proposeDeploymentTeam(){const request=String(workspaceElement('workforce-team-request')?.value||'').trim();if(!request)throw new Error('Describe the team change first.');return submitDeploymentWorkforceOperation('deployment.participation.propose',{request});}
async function proposeDeploymentDelivery(kind){const task=String(workspaceElement('workforce-workspace-task')?.value||'').trim();const map={engineering:'deployment.engineering.propose',installation:'deployment.installation.propose',commissioning:'deployment.commissioning.propose'};const operation=map[kind];if(!operation)throw new Error('Unsupported delivery proposal');return submitDeploymentWorkforceOperation(operation,{objective:task||`Prepare governed ${kind} proposal from current verified deployment evidence.`});}
async function prepareDeploymentHandover(){return submitDeploymentWorkforceOperation('deployment.handover.prepare',{requested_by:'titan_code'});}

async function callRepositoryBridgeAction(action,payload={}){const out=workspaceElement('repository-bridge-output');if(out){out.hidden=false;out.textContent=`Calling ${action}…`;}try{const response=await chrome.runtime.sendMessage({action:'CALL_TITAN_BRIDGE',bridgeAction:action,payload});if(!response?.ok)throw new Error(response?.reason||response?.error||'Bridge action failed');if(out)out.textContent=JSON.stringify(response.result,null,2);workspaceSetText('repository-status',`${action} completed through Titan Bridge.`);return response.result;}catch(error){if(out)out.textContent=`${action} failed: ${error?.message||String(error)}`;workspaceSetText('repository-status','Titan Bridge action failed.');return null;}}

async function loadWorkspacePage(page) {
    try {
        switch (page) {
            case 'history': return await loadHistoryWorkspace();
            case 'artifacts': return await loadArtifactsWorkspace();
            case 'intelligence': return await loadIntelligenceWorkspace();
            case 'workforce': return await loadStatusWorkspace('workforce', 'GET_WORKFORCE_STATUS', formatWorkforceStatus);
            case 'repository': return await loadStatusWorkspace('repository', 'GET_REPOSITORY_STATUS', formatRepositoryStatus);
            case 'titan-zero': return await loadStatusWorkspace('titan-zero', 'GET_TITAN_ZERO_STATUS', formatTitanZeroStatus);
            case 'knowledge': return await loadKnowledgeWorkspace();
            default: return null;
        }
    } catch (error) {
        workspaceSetText(`${page}-status`, `Unable to load ${page}: ${error?.message || String(error)}`); return null;
    }
}
function registerWorkspacePageHandlers() {
    document.querySelectorAll?.('[data-workspace-refresh]').forEach(button => button.addEventListener('click', () => loadWorkspacePage(button.getAttribute('data-workspace-refresh'))));
    [['history-search','history'],['artifact-search','artifacts'],['knowledge-search','knowledge']].forEach(([id,page]) => workspaceElement(id)?.addEventListener?.('input', () => loadWorkspacePage(page)));
    workspaceElement('system-save-connect')?.addEventListener?.('click',()=>saveSystemIntegrationSettings().catch(error=>workspaceSetText('intelligence-status',error?.message||String(error))));
    workspaceElement('system-probe')?.addEventListener?.('click',()=>probeSystemIntegration().catch(error=>workspaceSetText('intelligence-status',error?.message||String(error))));
    workspaceElement('workforce-run-advisory')?.addEventListener?.('click',()=>runWorkforceWorkspaceAdvisory());
    document.getElementById('manager-ai-supervise')?.addEventListener?.('click',()=>runManagerAISupervision());
    document.getElementById('manager-ai-refresh')?.addEventListener?.('click',()=>runManagerAISupervision());
    workspaceElement('workforce-gateway-save')?.addEventListener?.('click',()=>saveDeploymentWorkforceGateway().catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-deployment-refresh')?.addEventListener?.('click',()=>refreshDeploymentWorkforce().catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-deployment-mission-select')?.addEventListener?.('change',()=>selectDeploymentMission().catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-deployment-create')?.addEventListener?.('click',()=>createDeploymentMissionRequest().catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-deployment-advance')?.addEventListener?.('click',()=>requestDeploymentTransition().catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-team-refresh')?.addEventListener?.('click',()=>refreshDeploymentWorkforce().catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-team-propose')?.addEventListener?.('click',()=>proposeDeploymentTeam().catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-engineering-propose')?.addEventListener?.('click',()=>proposeDeploymentDelivery('engineering').catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-installation-propose')?.addEventListener?.('click',()=>proposeDeploymentDelivery('installation').catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-commissioning-propose')?.addEventListener?.('click',()=>proposeDeploymentDelivery('commissioning').catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-evidence-request')?.addEventListener?.('click',()=>requestDeploymentEvidence().catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('workforce-handover-prepare')?.addEventListener?.('click',()=>prepareDeploymentHandover().catch(error=>workspaceSetText('workforce-status',error?.message||String(error))));
    workspaceElement('repository-search-btn')?.addEventListener?.('click',()=>callRepositoryBridgeAction('repo.search',{query:workspaceElement('repository-bridge-query')?.value||''}));
    workspaceElement('repository-read-btn')?.addEventListener?.('click',()=>callRepositoryBridgeAction('file.read',{path:workspaceElement('repository-bridge-path')?.value||''}));
    workspaceElement('repository-status-btn')?.addEventListener?.('click',()=>callRepositoryBridgeAction('repo.status',{}));
}

function openNavigation() {
    const drawer = document.getElementById?.('nav-drawer');
    const backdrop = document.getElementById?.('nav-backdrop');
    const button = document.getElementById?.('menu-btn');
    if (!drawer || !backdrop || !button) return false;

    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    document.body?.classList?.add('nav-open');
    document.getElementById?.('nav-close-btn')?.focus?.();
    return true;
}

function closeNavigation({ restoreFocus = true } = {}) {
    const drawer = document.getElementById?.('nav-drawer');
    const backdrop = document.getElementById?.('nav-backdrop');
    const button = document.getElementById?.('menu-btn');
    if (!drawer || !backdrop || !button) return false;

    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.body?.classList?.remove('nav-open');
    if (restoreFocus) button.focus?.();
    return true;
}

function registerNavigationHandlers() {
    const menuButton = document.getElementById?.('menu-btn');
    const closeButton = document.getElementById?.('nav-close-btn');
    const backdrop = document.getElementById?.('nav-backdrop');

    menuButton?.addEventListener('click', openNavigation);
    closeButton?.addEventListener('click', () => closeNavigation());
    backdrop?.addEventListener('click', () => closeNavigation());

    document.getElementById?.('codee-nav-links')?.addEventListener?.('click', event => {
        const link = event.target?.closest?.('[data-nav-page]');
        if (!link || link.disabled) return;
        setActivePage(link.getAttribute('data-nav-page'));
    });
    document.querySelector?.('[data-fallback-runner]')?.addEventListener?.('click', () => setActivePage('runner'));

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeNavigation();
    });
}


function dashboardSetText(id, value, fallback = '—') {
    const element = document.getElementById?.(id);
    if (element) element.textContent = String(value ?? '').trim() || fallback;
}

function dashboardBadge(id, state, label = '') {
    const element = document.getElementById?.(id);
    if (!element) return;
    const normalized = String(state || 'UNKNOWN').toUpperCase();
    const className = normalized === 'READY' || normalized === 'VERIFIED' || normalized === 'AVAILABLE'
        ? 'healthy'
        : normalized === 'ATTENTION' || normalized === 'DEGRADED' || normalized === 'CONTRACT_ONLY'
            ? 'warning'
            : normalized === 'MISSING' || normalized === 'ERROR' || normalized === 'BLOCKED'
                ? 'error'
                : 'neutral';
    element.className = `health-badge ${className}`;
    element.textContent = label || normalized.replaceAll('_', ' ');
}

function dashboardHealthRow(label, state, detail = '') {
    const row = document.createElement('div');
    row.className = 'dashboard-health-row';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = label;
    copy.appendChild(title);
    if (detail) {
        const small = document.createElement('small');
        small.textContent = detail;
        copy.appendChild(small);
    }
    const badge = document.createElement('span');
    badge.className = 'health-badge neutral';
    row.append(copy, badge);
    const normalized = String(state || 'UNKNOWN').toUpperCase();
    badge.className = `health-badge ${normalized === 'READY' ? 'healthy' : (['ATTENTION','DEGRADED','CONTRACT_ONLY'].includes(normalized) ? 'warning' : (normalized === 'MISSING' ? 'error' : 'neutral'))}`;
    badge.textContent = normalized.replaceAll('_', ' ');
    return row;
}

function renderDashboardStatus(status) {
    dashboardStatusCache = status && typeof status === 'object' ? status : null;
    if (!dashboardStatusCache) return false;
    const project = dashboardStatusCache.project || {};
    const plan = dashboardStatusCache.plan || {};
    const artifact = dashboardStatusCache.artifact || {};
    const ai = dashboardStatusCache.ai || {};
    const infra = dashboardStatusCache.infrastructure || {};
    const workforce = dashboardStatusCache.workforce || {};

    dashboardSetText('dashboard-generated-at', dashboardStatusCache.generatedAt ? `Updated ${dashboardStatusCache.generatedAt}` : 'Current status loaded.');
    dashboardSetText('dashboard-project-name', project.name, 'Titan Code Project');
    dashboardSetText('dashboard-project-branch', project.branch);
    dashboardSetText('dashboard-project-framework', project.framework);
    dashboardSetText('dashboard-project-runtime', project.runtime);
    dashboardSetText('dashboard-project-files', `${Number(project.files || 0)}${project.extensionFiles ? ` · ${Number(project.extensionFiles)} extension` : ''}`, '0');
    dashboardBadge('dashboard-project-state', project.lastAnalyzedAt ? 'READY' : 'DEGRADED', project.lastAnalyzedAt ? 'Analyzed' : 'No snapshot');

    const current = plan.current;
    dashboardSetText('dashboard-plan-id', current?.planId, 'No active plan');
    dashboardSetText('dashboard-plan-step', current ? `Step ${current.stepNumber}/${current.stepTotal} · ${current.status || 'unknown'}` : 'No step is currently running.');
    dashboardSetText('dashboard-plan-count', `${Number(plan.activeCount || 0) + activeNextRunners.size} active · ${Number(plan.totalCount || 0) + activeNextRunners.size} total`, '0 active plans');
    dashboardBadge('dashboard-plan-state', current ? (current.status === 'blocked' ? 'ATTENTION' : 'READY') : 'NEUTRAL', current ? String(current.status || 'Active').replaceAll('_',' ') : 'None');

    dashboardSetText('dashboard-artifact-name', artifact.zip, 'No verified artifact yet');
    dashboardSetText('dashboard-artifact-hash', artifact.sha256);
    dashboardSetText('dashboard-artifact-time', artifact.createdAt);
    dashboardBadge('dashboard-artifact-state', artifact.zip ? (artifact.verified ? 'VERIFIED' : 'ATTENTION') : 'NEUTRAL', artifact.zip ? (artifact.verified ? 'Verified' : 'Unverified') : 'None');

    dashboardBadge('dashboard-ai-state', ai.state);
    dashboardSetText('dashboard-ai-summary', ai.gatewayInstalled ? 'CodeeProviderGateway' : 'Provider Gateway unavailable');
    dashboardSetText('dashboard-ai-detail', `${Number(ai.activeProviders || 0)}/${Number(ai.providers || 0)} active providers · ${Number(ai.healthyModels || 0)}/${Number(ai.models || 0)} healthy models · local ${ai.localAvailable ? 'available' : 'unavailable'}`);

    const health = document.getElementById?.('dashboard-infrastructure-list');
    if (health) {
        health.replaceChildren(
            dashboardHealthRow('Titan MCP', infra.mcp?.state, `${Number(infra.mcp?.connections || 0)} connection(s) · ${Number(infra.mcp?.pendingApprovals || 0)} approval(s)`),
            dashboardHealthRow('Repository Host', infra.repositoryHost?.state, infra.repositoryHost?.verifiedBackupReady ? 'verified backup path ready' : 'privileged mutation unavailable'),
            dashboardHealthRow('Artifact Host', infra.artifactHost?.state, infra.artifactHost?.connected ? `source: ${infra.artifactHost?.source || 'connected'}` : 'independent verifier unavailable'),
            dashboardHealthRow('Browser Engine', infra.browser?.state, `${Number(infra.browser?.implemented || 0)} implemented · ${Number(infra.browser?.contractOnly || 0)} contract-only`)
        );
    }

    dashboardBadge('dashboard-workforce-state', workforce.state);
    dashboardSetText('dashboard-workforce-summary', `${Number(workforce.managers || 0)} manager${Number(workforce.managers || 0) === 1 ? '' : 's'} registered`);
    dashboardSetText('dashboard-workforce-detail', `${workforce.enabled ? 'enabled' : 'disabled'} · provider gateway ${workforce.providerGateway ? 'detected' : 'not detected'} · advisory authority only`);

    const attention = Array.isArray(dashboardStatusCache.attention) ? dashboardStatusCache.attention : [];
    dashboardBadge('dashboard-attention-count', attention.some(item => item?.severity === 'error') ? 'ERROR' : (attention.length ? 'ATTENTION' : 'READY'), String(attention.length));
    const attentionList = document.getElementById?.('dashboard-attention-list');
    if (attentionList) {
        attentionList.replaceChildren();
        if (!attention.length) {
            const empty = document.createElement('p');
            empty.className = 'dashboard-empty';
            empty.textContent = 'No current attention items.';
            attentionList.appendChild(empty);
        } else {
            attention.forEach(item => {
                const row = document.createElement('div');
                row.className = `dashboard-attention-item ${['warning','error','info'].includes(item?.severity) ? item.severity : 'info'}`;
                row.textContent = String(item?.text || item?.code || 'Attention required');
                attentionList.appendChild(row);
            });
        }
    }
    return true;
}

async function loadDashboardStatus({ force = false } = {}) {
    if (dashboardStatusCache && !force) {
        renderDashboardStatus(dashboardStatusCache);
        return dashboardStatusCache;
    }
    if (dashboardStatusLoading && !force) return dashboardStatusLoading;
    dashboardStatusLoading = (async () => {
        const response = await chrome.runtime.sendMessage({ action: 'GET_DASHBOARD_STATUS' });
        if (!response?.ok || !response.dashboard) throw new Error(response?.error || 'Dashboard status unavailable');
        renderDashboardStatus(response.dashboard);
        return response.dashboard;
    })();
    try { return await dashboardStatusLoading; }
    catch (error) {
        dashboardSetText('dashboard-generated-at', `Dashboard unavailable: ${error?.message || String(error)}`);
        throw error;
    } finally { dashboardStatusLoading = null; }
}

function dashboardActionMessage(message, isError = false) {
    const element = document.getElementById?.('dashboard-action-status');
    if (element) {
        element.textContent = String(message || '');
        element.classList.toggle('error', isError === true);
    }
}

function prepareRunnerRequest(text) {
    const input = document.getElementById?.('plan-input');
    setActivePage('runner');
    if (!input) return false;
    if (!String(input.value || '').trim()) input.value = String(text || '');
    input.focus?.();
    return true;
}

async function handleDashboardAction(action) {
    const key = String(action || '');
    if (key === 'dashboard-new-plan') {
        const input = document.getElementById?.('plan-input');
        if (input && String(input.value || '').trim()) {
            const allowed = typeof globalThis.confirm !== 'function' || globalThis.confirm('Clear the current unsaved Runner text and start a new plan?');
            if (!allowed) return false;
            input.value = '';
        }
        setActivePage('runner');
        input?.focus?.();
        setMessage('Runner ready for a new governed plan.');
        return true;
    }
    if (key === 'dashboard-continue-plan') {
        setActivePage('plans');
        const tabId = Number(dashboardStatusCache?.plan?.current?.tabId);
        if (Number.isInteger(tabId) && activePlans.has(tabId)) viewPlan(tabId);
        return true;
    }
    if (key === 'dashboard-analyze-repository') {
        prepareRunnerRequest('Analyze the current repository using Codee repository intelligence. Identify architecture, changed-file impact, risks, targeted tests and verification requirements. Treat repository evidence as read-only unless a later approved plan explicitly requests governed mutation.');
        setMessage('Repository analysis request prepared in Runner. Review it before starting.');
        return true;
    }
    if (key === 'dashboard-ask-codee') {
        prepareRunnerRequest('');
        setMessage('Ask Titan Code in the Runner. Add your objective, then choose a conversation and start only when ready.');
        return true;
    }
    if (key === 'dashboard-run-diagnostics') {
        setActivePage('diagnostics');
        await loadDiagnostics();
        return true;
    }
    if (key === 'dashboard-open-artifact') {
        const artifact = dashboardStatusCache?.artifact;
        if (!artifact?.zip) {
            dashboardActionMessage('No artifact is available yet.', true);
            return false;
        }
        setActivePage('plans');
        const tabId = Number(dashboardStatusCache?.plan?.current?.tabId);
        if (Number.isInteger(tabId) && activePlans.has(tabId)) viewPlan(tabId);
        setMessage(`Last artifact: ${artifact.zip}${artifact.verified ? ' · verified' : ' · verification pending'}`);
        return true;
    }
    return false;
}

function connectionStateClass(value) {
    return String(value || 'DEGRADED').toLowerCase().replaceAll('_','-');
}
function connectionSectionElement(id) { return document.getElementById?.(`connections-${id}`); }
function connectionsStatus(message, isError = false) {
    const el = document.getElementById?.('connections-status');
    if (el) { el.textContent = String(message || ''); el.classList.toggle('error', isError === true); }
}
function renderConnectionSection(section) {
    const host = connectionSectionElement(section?.id);
    if (!host) return;
    host.replaceChildren();
    const heading = document.createElement('div'); heading.className = 'connection-card-heading';
    const copy = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = String(section?.title || section?.id || 'Connection');
    const description = document.createElement('p'); description.className = 'section-subtitle'; description.textContent = String(section?.description || '');
    copy.append(title, description);
    const badge = document.createElement('span'); badge.className = `connection-state state-${connectionStateClass(section?.state)}`; badge.textContent = String(section?.state || 'DEGRADED').replaceAll('_',' ');
    heading.append(copy, badge); host.appendChild(heading);
    const meta = document.createElement('div'); meta.className = 'connection-meta';
    const checked = section?.lastCheckedAt ? `Last check: ${section.lastCheckedAt}` : 'Last check: never';
    const error = section?.lastError ? ` · Last error: ${section.lastError}` : '';
    meta.textContent = `${checked}${error}`; host.appendChild(meta);
    const rows = Array.isArray(section?.connections) ? section.connections : [];
    if (rows.length) {
        const list = document.createElement('div'); list.className = 'connection-provider-list';
        for (const row of rows) {
            const item = document.createElement('div'); item.className = 'connection-provider-row';
            const strong = document.createElement('strong'); strong.textContent = String(row?.name || row?.id || 'Provider');
            const small = document.createElement('small'); small.textContent = `${String(row?.state || 'DEGRADED').replaceAll('_',' ')}${row?.transport ? ` · ${row.transport}` : ''}${row?.lastCheckedAt ? ` · ${row.lastCheckedAt}` : ''}`;
            item.append(strong, small); list.appendChild(item);
        }
        host.appendChild(list);
    }
    const actions = document.createElement('div'); actions.className = 'connection-actions';
    for (const [name,label] of [['test','Test'],['reconnect','Reconnect'],['configure','Configure'],['disable','Disable']]) {
        const spec = section?.actions?.[name] || {};
        const button = document.createElement('button'); button.type = 'button'; button.className = name === 'test' ? 'btn btn-primary' : 'btn btn-secondary'; button.textContent = label;
        button.dataset.connectionAction = name; button.dataset.connectionSection = String(section?.id || '');
        button.disabled = spec.available !== true;
        if (button.disabled) button.title = String(spec.reason || 'This action is owned by the subsystem and is not available here.');
        button.addEventListener('click', async () => {
            if (name === 'test' || name === 'reconnect') await loadConnectionsWorkspace({ force: true, announce: `${label} completed.` });
            else if (name === 'configure' && spec.route === 'settings') setActivePage('settings');
        });
        actions.appendChild(button);
    }
    host.appendChild(actions);
}
function renderConnectionsWorkspace(workspace) {
    connectionsWorkspaceCache = workspace || null;
    const sections = Array.isArray(workspace?.sections) ? workspace.sections : [];
    const connected = sections.filter(row => row?.state === 'CONNECTED').length;
    const attention = sections.filter(row => !['CONNECTED','DISABLED'].includes(String(row?.state || ''))).length;
    const summary = document.getElementById?.('connections-summary');
    if (summary) summary.textContent = `${connected}/${sections.length} connection groups healthy · ${attention} need attention · checked ${workspace?.generatedAt || 'now'}`;
    for (const section of sections) renderConnectionSection(section);
    return workspace;
}
async function loadConnectionsWorkspace({ force = false, announce = '' } = {}) {
    if (!force && connectionsWorkspaceCache) return renderConnectionsWorkspace(connectionsWorkspaceCache);
    if (connectionsWorkspaceLoading) return connectionsWorkspaceLoading;
    connectionsStatus(force ? 'Testing canonical connection health…' : 'Loading connection health…');
    connectionsWorkspaceLoading = (async () => {
        const response = await chrome.runtime.sendMessage({ action: 'GET_CONNECTION_WORKSPACE', force: force === true });
        if (!response?.ok) throw new Error(response?.error || 'Connections workspace unavailable');
        renderConnectionsWorkspace(response.workspace);
        connectionsStatus(announce || 'Connection health is current.');
        return response.workspace;
    })();
    try { return await connectionsWorkspaceLoading; }
    catch (error) { connectionsStatus(error?.message || String(error), true); throw error; }
    finally { connectionsWorkspaceLoading = null; }
}
function registerConnectionsHandlers() {
    document.getElementById?.('connections-refresh-btn')?.addEventListener?.('click', () => loadConnectionsWorkspace({ force: true, announce: 'All supported connections tested.' }).catch(() => {}));
}

function mcpInspectorStatus(message, isError = false) {
    const el = document.getElementById?.('mcp-inspector-status');
    if (el) { el.textContent = String(message || ''); el.classList.toggle('error', isError === true); }
}
function clearMcpInspectorHost(id, emptyText) {
    const host = document.getElementById?.(id);
    if (!host) return null;
    host.replaceChildren();
    if (emptyText) host.dataset.emptyText = emptyText;
    return host;
}
function mcpInspectorChip(label, kind = '') {
    const chip = document.createElement('span');
    chip.className = `mcp-inspector-chip ${String(kind || '').toLowerCase()}`.trim();
    chip.textContent = String(label || '');
    return chip;
}
function appendMcpInspectorRow(host, title, detail = '', chips = [], schema = null) {
    if (!host) return null;
    const row = document.createElement('div'); row.className = 'mcp-inspector-row';
    const strong = document.createElement('strong'); strong.textContent = String(title || 'MCP item'); row.appendChild(strong);
    if (detail) { const copy = document.createElement('div'); copy.className = 'capability-detail'; copy.textContent = String(detail); row.appendChild(copy); }
    if (Array.isArray(chips) && chips.length) {
        const meta = document.createElement('div'); meta.className = 'mcp-inspector-meta';
        for (const chip of chips) meta.appendChild(mcpInspectorChip(chip.label, chip.kind));
        row.appendChild(meta);
    }
    if (schema && typeof schema === 'object' && Object.keys(schema).length) {
        const pre = document.createElement('pre'); pre.className = 'mcp-inspector-schema'; pre.textContent = JSON.stringify(schema, null, 2); row.appendChild(pre);
    }
    host.appendChild(row);
    return row;
}
function renderMcpInspector(inspector) {
    mcpInspectorCache = inspector || null;
    const summary = inspector?.summary || {};
    const summaryEl = document.getElementById?.('mcp-inspector-summary');
    if (summaryEl) summaryEl.textContent = `${Number(summary.readyServers || 0)}/${Number(summary.servers || 0)} servers ready · ${Number(summary.tools || 0)} tools · ${Number(summary.prompts || 0)} prompts · ${Number(summary.pendingApprovals || 0)} pending approvals · ${Number(summary.blockedTools || 0)} blocked unknown tools`;
    const serversHost = clearMcpInspectorHost('mcp-inspector-servers');
    const toolsHost = clearMcpInspectorHost('mcp-inspector-tools');
    const promptsHost = clearMcpInspectorHost('mcp-inspector-prompts');
    const resourcesHost = clearMcpInspectorHost('mcp-inspector-resources');
    const approvalsHost = clearMcpInspectorHost('mcp-inspector-approvals');
    const receiptsHost = clearMcpInspectorHost('mcp-inspector-receipts');
    const servers = Array.isArray(inspector?.servers) ? inspector.servers : [];
    if (!servers.length && serversHost) serversHost.textContent = 'No Titan MCP connections are configured. Use Configure to add one.';
    for (const server of servers) {
        const c = server?.connection || {}; const info = server?.server || {};
        appendMcpInspectorRow(serversHost, c.name || c.id || 'Titan MCP', `${c.origin || 'origin unavailable'}${c.endpoint ? c.endpoint : ''} · ${info.name || 'server undiscovered'} ${info.version || ''}`.trim(), [
            {label:server.discoveryState || 'UNAVAILABLE',kind:server.discoveryState === 'READY' ? 'read' : 'unknown'},
            {label:info.protocolVersion || 'protocol unknown',kind:'verify'},
            {label:info.twoPhaseMutationTickets ? 'TWO-PHASE TICKETS' : 'NO SEALED TICKET EVIDENCE',kind:info.twoPhaseMutationTickets ? 'verify' : 'unknown'}
        ]);
        if (server.discoveryError && server.discoveryState !== 'READY') appendMcpInspectorRow(serversHost, 'Blocked reason', server.discoveryError, [{label:'UNAVAILABLE',kind:'unknown'}]);
        const tools = Array.isArray(server.tools) ? server.tools : [];
        for (const tool of tools) {
            const chips = [
                {label:tool.operationClass || tool.classification || 'UNKNOWN',kind:tool.operationClass || tool.classification},
                {label:`RISK ${tool.riskFloor || 'BLOCKED'}`,kind:tool.riskFloor === 'CRITICAL' ? 'destructive' : (tool.riskFloor === 'HIGH' ? 'write' : 'verify')},
                {label:tool.executionMode || 'BLOCKED',kind:tool.executionAvailable ? 'read' : 'unknown'}
            ];
            if (tool.requiresApproval) chips.push({label:'APPROVAL REQUIRED',kind:'write'});
            if (Array.isArray(tool.backupDomains) && tool.backupDomains.length) chips.push({label:`BACKUP ${tool.backupDomains.join('+')}`,kind:'verify'});
            const detail = [tool.description, `class=${tool.classification || 'UNKNOWN'}`, `source=${tool.classificationSource || 'blocked'}`, tool.blockedReason ? `blocked=${tool.blockedReason}` : '', tool.lastCall ? `last receipt=${tool.lastCall.receiptId || 'unknown'} · ${tool.lastCall.verificationLevel || 'unclassified'}` : 'last call=none'].filter(Boolean).join(' · ');
            appendMcpInspectorRow(toolsHost, `${c.name || c.id || 'Titan MCP'} · ${tool.name || 'unnamed tool'}`, detail, chips, tool.inputSchema || null);
        }
        const prompts = Array.isArray(server.prompts) ? server.prompts : [];
        for (const prompt of prompts) appendMcpInspectorRow(promptsHost, `${c.name || c.id || 'Titan MCP'} · ${prompt.name || 'unnamed prompt'}`, prompt.description || 'No description', [{label:`${(prompt.arguments || []).length} args`,kind:'read'}]);
        const resources = server.resources || {};
        appendMcpInspectorRow(resourcesHost, c.name || c.id || 'Titan MCP', resources.reason || 'Resource state unavailable', [{label:resources.state || 'UNAVAILABLE',kind:'unknown'},{label:resources.declared ? 'SERVER DECLARES RESOURCES' : 'NOT DECLARED',kind:resources.declared ? 'verify' : 'unknown'}]);
        const approvals = Array.isArray(server.approvals) ? server.approvals : [];
        for (const approval of approvals) {
            const row = appendMcpInspectorRow(approvalsHost, `${c.name || c.id || 'Titan MCP'} · ${approval.tool || 'mutation'}`, `${approval.classification || 'WRITE'} · ticket=${approval.ticketId || 'none'} · arguments=${approval.argumentsSha256 || 'unknown'} · backups=${(approval.backupDomains || []).join('+') || 'none'}`, [{label:'PENDING APPROVAL',kind:'write'},{label:approval.exactArgumentsBound ? 'EXACT ARGS BOUND' : 'ARG BINDING UNKNOWN',kind:approval.exactArgumentsBound ? 'verify' : 'unknown'}]);
            if (row) {
                const actions = document.createElement('div'); actions.className = 'mcp-inspector-actions';
                const approve = document.createElement('button'); approve.type='button'; approve.className='btn btn-primary'; approve.textContent='Approve once';
                const deny = document.createElement('button'); deny.type='button'; deny.className='btn btn-secondary'; deny.textContent='Deny';
                approve.addEventListener('click', async () => { const r=await chrome.runtime.sendMessage({action:'MCP_MUTATION_APPROVE',approvalId:approval.approvalId}); if(!r?.ok) throw new Error(r?.error || 'Approval failed'); await loadMcpInspector({force:true}); });
                deny.addEventListener('click', async () => { const r=await chrome.runtime.sendMessage({action:'MCP_MUTATION_DENY',approvalId:approval.approvalId}); if(!r?.ok) throw new Error(r?.error || 'Deny failed'); await loadMcpInspector({force:true}); });
                actions.append(approve, deny); row.appendChild(actions);
            }
        }
        const receipts = Array.isArray(server.receipts) ? server.receipts : [];
        for (const receipt of receipts) appendMcpInspectorRow(receiptsHost, `${c.name || c.id || 'Titan MCP'} · ${receipt.tool || 'mutation receipt'}`, `receipt=${receipt.id || 'unknown'} · ticket=${receipt.ticketId || 'none'} · verification=${receipt.verificationLevel || 'unclassified'} · backups=${(receipt.backupIds || []).join(', ') || 'none'}`, [{label:receipt.verified ? 'VERIFIED' : 'NOT VERIFIED',kind:receipt.verified ? 'verify' : 'unknown'},{label:receipt.classification || 'UNKNOWN',kind:receipt.classification}]);
    }
    if (toolsHost && !toolsHost.childNodes.length) toolsHost.textContent = 'No governed tools discovered.';
    if (promptsHost && !promptsHost.childNodes.length) promptsHost.textContent = 'No prompts discovered.';
    if (resourcesHost && !resourcesHost.childNodes.length) resourcesHost.textContent = 'Titan MCP resources are not exposed.';
    if (approvalsHost && !approvalsHost.childNodes.length) approvalsHost.textContent = 'No pending approvals.';
    if (receiptsHost && !receiptsHost.childNodes.length) receiptsHost.textContent = 'No mutation receipts.';
    return inspector;
}
async function loadMcpInspector({ force = false } = {}) {
    if (!force && mcpInspectorCache) return renderMcpInspector(mcpInspectorCache);
    if (mcpInspectorLoading) return mcpInspectorLoading;
    mcpInspectorStatus(force ? 'Refreshing Titan MCP discovery and governance evidence…' : 'Loading Titan MCP inspector…');
    mcpInspectorLoading = (async () => {
        const response = await chrome.runtime.sendMessage({ action: 'GET_MCP_INSPECTOR', force: force === true });
        if (!response?.ok) throw new Error(response?.error || 'MCP inspector unavailable');
        renderMcpInspector(response.inspector);
        mcpInspectorStatus('MCP inspector is current. Tool execution remains governed outside this read-only surface.');
        return response.inspector;
    })();
    try { return await mcpInspectorLoading; }
    catch (error) { mcpInspectorStatus(error?.message || String(error), true); throw error; }
    finally { mcpInspectorLoading = null; }
}
function registerMcpInspectorHandlers() {
    document.getElementById?.('mcp-inspector-refresh-btn')?.addEventListener?.('click', () => loadMcpInspector({force:true}).catch(() => {}));
    document.getElementById?.('mcp-inspector-configure-btn')?.addEventListener?.('click', () => { setActivePage('settings'); setTimeout(() => document.getElementById?.('mcp-connection-name')?.focus?.(), 0); });
}

function registerDashboardHandlers() {
    document.getElementById?.('dashboard-refresh-btn')?.addEventListener?.('click', () => loadDashboardStatus({ force: true }).catch(error => dashboardActionMessage(error?.message || String(error), true)));
    document.querySelectorAll?.('[data-dashboard-action]')?.forEach(button => {
        button.addEventListener('click', () => handleDashboardAction(button.getAttribute('data-dashboard-action')).catch(error => dashboardActionMessage(error?.message || String(error), true)));
    });
}

function searchableText(record) {
    if (!record || typeof record !== 'object') return '';
    const values = [];
    for (const value of Object.values(record)) {
        if (typeof value === 'string' || typeof value === 'number') values.push(String(value));
        else if (Array.isArray(value)) values.push(value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(' '));
    }
    return values.join(' ').toLowerCase();
}

function appendTextElement(parent, tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = String(text || '');
    parent.appendChild(element);
    return element;
}

function renderPromptLibrary() {
    const container = document.getElementById?.('prompt-library');
    const status = document.getElementById?.('prompt-library-status');
    const count = document.getElementById?.('prompt-count');
    if (!container) return 0;
    const prompts = Array.isArray(capabilityRegistryCache?.prompts) ? capabilityRegistryCache.prompts : [];
    const query = String(document.getElementById?.('prompt-search')?.value || '').trim().toLowerCase();
    const filtered = query ? prompts.filter(item => searchableText(item).includes(query)) : prompts;
    container.textContent = '';
    filtered.forEach(prompt => {
        const card = document.createElement('article');
        card.className = 'library-card';
        const meta = document.createElement('div');
        meta.className = 'library-card-meta';
        appendTextElement(meta, 'span', 'library-chip', prompt.category || 'Prompt');
        if (prompt.domain) appendTextElement(meta, 'span', 'library-chip secondary', prompt.domain);
        card.appendChild(meta);
        appendTextElement(card, 'h3', '', prompt.title || prompt.id);
        appendTextElement(card, 'p', 'library-description', prompt.description || '');
        const text = appendTextElement(card, 'p', 'library-preview', prompt.text || '');
        text.title = prompt.text || '';
        const actions = document.createElement('div');
        actions.className = 'library-actions';
        const use = document.createElement('button');
        use.type = 'button';
        use.className = 'btn btn-primary btn-compact';
        use.textContent = 'Use in Runner';
        use.addEventListener('click', () => {
            const input = document.getElementById?.('plan-input');
            if (input) input.value = prompt.text || '';
            setActivePage('runner');
            setMessage(`Loaded prompt: ${prompt.title || prompt.id}`);
        });
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'btn btn-secondary btn-compact';
        copy.textContent = 'Copy';
        copy.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(prompt.text || ''); setMessage('Prompt copied.'); }
            catch (_error) { setMessage('Could not copy prompt.'); }
        });
        actions.append(use, copy);
        card.appendChild(actions);
        container.appendChild(card);
    });
    if (count) count.textContent = String(filtered.length);
    if (status) status.textContent = `${filtered.length} of ${prompts.length} prompts shown.`;
    return filtered.length;
}

function renderSkillLibrary() {
    const container = document.getElementById?.('skill-library');
    const status = document.getElementById?.('skill-library-status');
    const count = document.getElementById?.('skill-count');
    if (!container) return 0;
    const skills = Array.isArray(capabilityRegistryCache?.skills) ? capabilityRegistryCache.skills : [];
    const query = String(document.getElementById?.('skill-search')?.value || '').trim().toLowerCase();
    const filtered = query ? skills.filter(item => searchableText(item).includes(query)) : skills;
    container.textContent = '';
    filtered.forEach(skill => {
        const card = document.createElement('article');
        card.className = 'library-card';
        const meta = document.createElement('div');
        meta.className = 'library-card-meta';
        appendTextElement(meta, 'span', 'library-chip', skill.category || skill.family || 'Skill');
        if (skill.domain) appendTextElement(meta, 'span', 'library-chip secondary', skill.domain);
        if (skill.mode || skill.authority) appendTextElement(meta, 'span', 'library-chip muted', skill.mode || skill.authority);
        card.appendChild(meta);
        appendTextElement(card, 'h3', '', skill.name || skill.title || skill.id);
        appendTextElement(card, 'p', 'library-description', skill.description || skill.mission || '');
        const rules = Array.isArray(skill.rules) ? skill.rules : [];
        if (rules.length) {
            const list = document.createElement('ul');
            list.className = 'library-rules';
            rules.forEach(rule => appendTextElement(list, 'li', '', rule));
            card.appendChild(list);
        }
        container.appendChild(card);
    });
    if (count) count.textContent = String(filtered.length);
    if (status) status.textContent = `${filtered.length} of ${skills.length} skills shown.`;
    return filtered.length;
}

async function loadCapabilityLibraries({ force = false } = {}) {
    if (capabilityRegistryCache && !force) {
        renderPromptLibrary();
        renderSkillLibrary();
        return capabilityRegistryCache;
    }
    if (capabilityLibrariesLoading && !force) return capabilityLibrariesLoading;
    capabilityLibrariesLoading = (async () => {
        const response = await chrome.runtime.sendMessage({ action: 'GET_CAPABILITY_REGISTRY' });
        if (!response?.ok) throw new Error(response?.error || 'Capability registry unavailable');
        capabilityRegistryCache = response.registry || { prompts: [], skills: [], profiles: [] };
        renderPromptLibrary();
        renderSkillLibrary();
        return capabilityRegistryCache;
    })();
    try { return await capabilityLibrariesLoading; }
    finally { capabilityLibrariesLoading = null; }
}

function registerLibraryHandlers() {
    document.getElementById?.('prompt-search')?.addEventListener?.('input', renderPromptLibrary);
    document.getElementById?.('skill-search')?.addEventListener?.('input', renderSkillLibrary);
}

function capabilityOption(select, value, label) {
    const option = document.createElement('option');
    option.value = String(value || '');
    option.textContent = String(label || value || '');
    select.appendChild(option);
}

function syncCapabilityFilters(view) {
    const readiness = document.getElementById?.('capability-readiness-filter');
    const subsystem = document.getElementById?.('capability-subsystem-filter');
    if (readiness && readiness.options.length <= 1) {
        Object.keys(view?.summary?.byReadiness || {}).filter(state => Number(view.summary.byReadiness[state] || 0) > 0)
            .forEach(state => capabilityOption(readiness, state, `${state} (${view.summary.byReadiness[state]})`));
    }
    if (subsystem && subsystem.options.length <= 1) {
        Object.keys(view?.summary?.bySubsystem || {}).sort()
            .forEach(name => capabilityOption(subsystem, name, `${name} (${view.summary.bySubsystem[name]})`));
    }
}

function renderCapabilityRegistry(view = capabilityStatusCache) {
    capabilityStatusCache = view && typeof view === 'object' ? view : null;
    const body = document.getElementById?.('capability-table-body');
    const summary = document.getElementById?.('capability-summary');
    if (!capabilityStatusCache || !body) return 0;
    syncCapabilityFilters(capabilityStatusCache);

    const query = String(document.getElementById?.('capability-search')?.value || '').trim().toLowerCase();
    const readiness = String(document.getElementById?.('capability-readiness-filter')?.value || '');
    const subsystem = String(document.getElementById?.('capability-subsystem-filter')?.value || '');
    const rows = (Array.isArray(capabilityStatusCache.rows) ? capabilityStatusCache.rows : []).filter(row => {
        if (readiness && row?.readiness !== readiness) return false;
        if (subsystem && row?.subsystem !== subsystem) return false;
        if (!query) return true;
        return [row?.id, row?.title, row?.subsystem, row?.owner, row?.readiness, row?.operationClass, row?.risk, ...(row?.dependencies || [])]
            .map(value => String(value || '').toLowerCase()).some(value => value.includes(query));
    });

    if (summary) {
        const totals = capabilityStatusCache.summary || {};
        summary.textContent = `${rows.length} shown · ${Number(capabilityStatusCache.total || 0)} registered · ${Number(totals.available || 0)} executable now · ${Number(totals.blocked || 0)} gated · ${Number(totals.contractOnly || 0)} contract-only`;
    }

    body.textContent = '';
    if (!rows.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.textContent = 'No capabilities match the current filters.';
        tr.appendChild(td);
        body.appendChild(tr);
        return 0;
    }

    for (const row of rows) {
        const tr = document.createElement('tr');

        const identity = document.createElement('td');
        const id = document.createElement('span'); id.className = 'capability-id'; id.textContent = row.id || 'unknown'; identity.appendChild(id);
        const title = document.createElement('span'); title.className = 'capability-detail'; title.textContent = row.title || ''; identity.appendChild(title);
        const sub = document.createElement('span'); sub.className = 'capability-subsystem'; sub.textContent = row.subsystem || 'Codee'; identity.appendChild(sub);
        tr.appendChild(identity);

        const ready = document.createElement('td');
        const badge = document.createElement('span'); badge.className = 'capability-readiness'; badge.dataset.state = row.readiness || 'UNAVAILABLE'; badge.textContent = row.readiness || 'UNAVAILABLE'; ready.appendChild(badge);
        if (row.reason) { const reason = document.createElement('span'); reason.className = 'capability-detail'; reason.textContent = row.reason; ready.appendChild(reason); }
        tr.appendChild(ready);

        const operation = document.createElement('td');
        const op = document.createElement('span'); op.textContent = row.operationClass || 'UNKNOWN'; operation.appendChild(op);
        const risk = document.createElement('span'); risk.className = `capability-detail capability-risk ${String(row.risk || '').toLowerCase()}`; risk.textContent = `risk ${row.risk || 'unknown'}`; operation.appendChild(risk);
        tr.appendChild(operation);

        const ownership = document.createElement('td');
        const owner = document.createElement('span'); owner.textContent = row.owner || 'Codee'; ownership.appendChild(owner);
        const dependencies = document.createElement('span'); dependencies.className = 'capability-detail'; dependencies.textContent = (row.dependencies || []).length ? `depends: ${row.dependencies.join(', ')}` : 'no external dependency'; ownership.appendChild(dependencies);
        tr.appendChild(ownership);

        const execution = document.createElement('td');
        const executionLabel = document.createElement('span'); executionLabel.className = `capability-execution ${row.executionAvailable ? 'yes' : 'no'}`; executionLabel.textContent = row.executionAvailable ? 'AVAILABLE' : 'GATED'; execution.appendChild(executionLabel);
        tr.appendChild(execution);

        body.appendChild(tr);
    }
    return rows.length;
}

async function loadCapabilityRegistryUi({ force = false } = {}) {
    if (capabilityStatusCache && !force) return renderCapabilityRegistry(capabilityStatusCache);
    if (capabilityStatusLoading && !force) return capabilityStatusLoading;
    capabilityStatusLoading = (async () => {
        const response = await chrome.runtime.sendMessage({ action: 'GET_CAPABILITY_REGISTRY' });
        if (!response?.ok || !response.capabilityView) throw new Error(response?.error || 'Capability status unavailable');
        capabilityStatusCache = response.capabilityView;
        renderCapabilityRegistry(capabilityStatusCache);
        return capabilityStatusCache;
    })();
    try { return await capabilityStatusLoading; }
    catch (error) {
        const summary = document.getElementById?.('capability-summary');
        if (summary) summary.textContent = `Capability registry unavailable: ${error?.message || String(error)}`;
        return null;
    } finally { capabilityStatusLoading = null; }
}

function registerCapabilityRegistryHandlers() {
    document.getElementById?.('capability-search')?.addEventListener?.('input', () => renderCapabilityRegistry());
    document.getElementById?.('capability-readiness-filter')?.addEventListener?.('change', () => renderCapabilityRegistry());
    document.getElementById?.('capability-subsystem-filter')?.addEventListener?.('change', () => renderCapabilityRegistry());
    document.getElementById?.('capability-refresh-btn')?.addEventListener?.('click', () => {
        capabilityStatusCache = null;
        loadCapabilityRegistryUi({ force: true }).catch(() => {});
    });
}

function formatTitanZeroStatus(status) {
    if (!status?.registered) return status?.error || 'Titan Zero pack is not registered.';
    const latest = status.latestAnalysis;
    const lines = [
        `Pack: ${status.pack?.title || 'Titan Zero Developer Intelligence'} v${status.pack?.version || '—'}`,
        `Prompts: ${status.counts?.prompts || 0}`,
        `Skills: ${status.counts?.skills || 0}`,
        `Profiles: ${status.counts?.profiles || 0}`,
        `Context providers: ${status.counts?.contextProviders || 0}`,
        `Enabled: ${status.settings?.enabled ? 'yes' : 'no'}`,
        `Extensions included: ${status.settings?.includeExtensions !== false && status.settings?.ignoreExtensions !== true ? 'LOCKED / yes' : 'ERROR'}`,
        `SQL row parsing: ${status.settings?.parseSqlRows ? 'ERROR / enabled' : 'LOCKED / no'}`,
        `Repository bridge: ${status.repositoryBridge || 'not-installed'}`,
        `Last host analysis: ${latest?.analyzedAt || 'none yet'}`
    ];
    if (latest) {
        lines.push(`Recognized host: ${latest.project?.recognized ? 'yes' : 'no'}`);
        lines.push(`Schema tables: ${latest.schema?.tables || 0}`);
        lines.push(`Migration findings: ${latest.migrations?.findings || 0}`);
        lines.push(`Mixed tenancy boundary: ${latest.tenancy?.mixedBoundary ? 'yes' : 'no'}`);
        lines.push(`Risk codes: ${(latest.riskCodes || []).join(', ') || 'none'}`);
    }
    return lines.join('\n');
}

async function runManagerAISupervision() {
    const out=document.getElementById('manager-ai-output'); const badge=document.getElementById('manager-ai-badge');
    if(out)out.textContent='Analyzing stored Agent Mesh evidence…';
    try{const provider=document.getElementById('manager-ai-provider')?.value||'auto';const allowCloud=document.getElementById('manager-ai-cloud')?.checked===true;const response=await chrome.runtime.sendMessage({action:'RUN_MANAGER_AI_SUPERVISION',provider,allowCloud,useAI:true});if(!response?.ok)throw new Error(response?.error||'Manager AI unavailable');const i=response.inspection?.summary||{};const lines=[`Agents: ${i.agents||0} · Active: ${i.active||0} · Available: ${i.available||0}`,`Stale: ${i.stale||0} · Erroring: ${i.erroring||0} · Blocked packets: ${i.blockedPackets||0}`,`Pending deltas: ${i.pendingDeltas||0} · Open findings: ${i.openFindings||0}`,'',`Risk signals: ${(response.inspection?.risks||[]).join(', ')||'none'}`,'','Deterministic Manager plan:',...((response.deterministicPlan?.steps||[]).map((x,n)=>`${n+1}. ${x.action} → ${x.target}`))];if(response.aiAdvisory?.response)lines.push('',`AI advisory (${response.aiAdvisory.provider||'provider'}):`,String(response.aiAdvisory.response).slice(0,12000));if(response.aiAdvisory?.reason)lines.push('',`AI advisory status: ${response.aiAdvisory.reason}`);if(out)out.textContent=lines.join('\n');if(badge){const risk=Boolean(response.inspection?.risks?.length);badge.textContent=risk?'Attention':'Healthy';badge.className=`health-badge ${risk?'warning':'healthy'}`;}return response;}catch(error){if(out)out.textContent=`Manager AI failed: ${error?.message||String(error)}`;if(badge){badge.textContent='Unavailable';badge.className='health-badge error';}return null;}}

async function loadTitanZeroStatus() {
    const panel = document.getElementById?.('diagnostics-titan-zero');
    const badge = document.getElementById?.('diagnostics-titan-zero-badge');
    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_TITAN_ZERO_STATUS' });
        if (panel) panel.textContent = formatTitanZeroStatus(response);
        if (badge) {
            badge.textContent = response?.registered ? (response?.settings?.enabled ? 'Ready' : 'Disabled') : 'Unavailable';
            badge.className = `health-badge ${response?.registered ? (response?.settings?.enabled ? 'healthy' : 'neutral') : 'error'}`;
        }
        return response;
    } catch (error) {
        if (panel) panel.textContent = `Titan Zero status unavailable: ${error?.message || String(error)}`;
        if (badge) { badge.textContent = 'Unavailable'; badge.className = 'health-badge error'; }
        return { ok: false, registered: false, error: error?.message || String(error) };
    }
}


function formatRepositoryStatus(status) {
    if (!status?.registered) return status?.error || 'Repository intelligence pack is not registered.';
    const latest = status.latestAnalysis;
    const backup = status.backupPolicy || {};
    const lines = [
        `Pack: ${status.pack?.title || 'Repository & Coding Intelligence'} v${status.pack?.version || '—'}`,
        `Capabilities: ${status.counts?.capabilities || 0}`,
        `Prompts: ${status.counts?.prompts || 0}`,
        `Skills: ${status.counts?.skills || 0}`,
        `Profiles: ${status.counts?.profiles || 0}`,
        `Enabled: ${status.settings?.enabled ? 'yes' : 'no'}`,
        `Extensions included: ${status.extensionsIncluded ? 'LOCKED / yes' : 'ERROR'}`,
        `Repository host bridge: ${status.hostBridge || 'not-installed'}`,
        `MCP runtime: ${status.mcp?.runtimeDetected ? 'detected' : 'not-installed'}`,
        `MCP transport owned here: ${status.mcp?.transportOwnedByRepositoryPack ? 'ERROR' : 'no'}`,
        `Backup provider: ${backup.createBackup && backup.verifyBackup ? 'ready' : 'not-installed'}`,
        `Post-write verify/audit: ${backup.verifyMutation && backup.auditMutation ? 'ready' : 'not-installed'}`,
        `Last repository analysis: ${latest?.analyzedAt || 'none yet'}`
    ];
    if (latest) {
        lines.push(`Files: ${latest.inventory?.files || 0} (${latest.inventory?.extensionFiles || 0} extension)`);
        lines.push(`Symbols: ${latest.symbols || 0}`);
        lines.push(`Dependency edges: ${latest.dependencyEdges || 0}`);
        lines.push(`Migration findings: ${latest.migrationFindings || 0}`);
        lines.push(`Change risk: ${latest.changeRisk || 'none'}`);
        lines.push(`Targeted commands: ${(latest.targetedCommands || []).join(' | ') || 'none'}`);
    }
    return lines.join('\n');
}

async function loadRepositoryStatus() {
    const panel = document.getElementById?.('diagnostics-repository');
    const badge = document.getElementById?.('diagnostics-repository-badge');
    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_REPOSITORY_STATUS' });
        if (panel) panel.textContent = formatRepositoryStatus(response);
        if (badge) {
            badge.textContent = response?.registered ? (response?.settings?.enabled ? 'Ready' : 'Disabled') : 'Unavailable';
            badge.className = `health-badge ${response?.registered ? (response?.settings?.enabled ? 'healthy' : 'neutral') : 'error'}`;
        }
        return response;
    } catch (error) {
        if (panel) panel.textContent = `Repository status unavailable: ${error?.message || String(error)}`;
        if (badge) { badge.textContent = 'Unavailable'; badge.className = 'health-badge error'; }
        return { ok: false, registered: false, error: error?.message || String(error) };
    }
}


function formatPlanRequirements(requirements) {
    if (!requirements || requirements.schema !== 'codee.plan.requirements.v1') return 'No plan requirement analysis yet.';
    const caps = Array.isArray(requirements.requiredCapabilities) ? requirements.requiredCapabilities.join(', ') : '';
    const backups = Array.isArray(requirements.backup?.domains) ? requirements.backup.domains.join(', ') : '';
    const browserCaps = Array.isArray(requirements.browser?.capabilities) ? requirements.browser.capabilities.join(', ') : '';
    return [
        `Risk: ${requirements.risk?.level || 'low'}${requirements.risk?.approvalRecommended ? ' / approval recommended' : ''}`,
        `Conversation: ${requirements.conversation?.required ? 'required / exact binding' : 'not required'}`,
        `AI provider: ${requirements.provider?.required ? 'required' : 'not required'}${requirements.provider?.localOnly ? ' / local only' : ''}`,
        `Repository: read=${requirements.repository?.read ? 'yes' : 'no'} write=${requirements.repository?.write ? 'yes' : 'no'} commands=${requirements.repository?.commands ? 'yes' : 'no'} destructive=${requirements.repository?.destructive ? 'yes' : 'no'}`,
        `Backup: ${requirements.backup?.required ? `required (${backups || 'unspecified'})` : 'not required'}`,
        `Artifact Host: ${requirements.artifactHost?.required ? 'required' : 'not required'}${requirements.artifactHost?.receiptRequired ? ' / receipt required' : ''}`,
        `MCP: ${requirements.mcp?.required ? 'required' : 'not required'}`,
        `Browser: ${requirements.browser?.required ? `required (${browserCaps || 'observation'})` : 'not required'}`,
        `Privacy: ${requirements.privacy?.mode || 'STANDARD'}`,
        `Cost policy: ${requirements.cost?.mode || 'UNSPECIFIED'}`,
        `Verification: tests=${requirements.verification?.testsRequired ? 'yes' : 'no'} post-write=${requirements.verification?.postWriteVerificationRequired ? 'yes' : 'no'} fresh artifact=${requirements.verification?.freshArtifactRequired ? 'yes' : 'no'}`,
        `Required capabilities: ${caps || 'none'}`,
        'Authority: analysis only; cannot mark ready, grant capability, mutate, or advance the plan.'
    ].join('\n');
}

function renderPlanRequirements(requirements) {
    const panel = document.getElementById?.('plan-requirements-details');
    const badge = document.getElementById?.('plan-requirements-badge');
    if (panel) panel.textContent = formatPlanRequirements(requirements);
    if (badge) {
        const analyzed = Boolean(requirements?.schema === 'codee.plan.requirements.v1');
        badge.textContent = analyzed ? 'Derived' : 'Not analyzed';
        badge.className = `health-badge ${analyzed ? 'healthy' : 'neutral'}`;
    }
}

async function analyzePlanRequirements() {
    const input = document.getElementById?.('plan-input');
    const raw = String(input?.value || '').trim();
    if (!raw) { setMessage('Enter a plan before analyzing requirements.'); return null; }
    const plan = parsePlanText(raw);
    const validation = validatePlanInput(raw, plan);
    if (!validation.ok) { setMessage(validation.error); return null; }
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'ANALYZE_PLAN_REQUIREMENTS',
            plan,
            protocolMode: 'signature_v2',
            artifactValidationMode: 'strict_v216',
            debuggingPlanEnabled: Boolean(document.getElementById?.('debugging-plan-mode')?.checked)
        });
        if (!response?.ok) throw new Error(response?.error || 'Requirement analysis failed');
        renderPlanRequirements(response.requirements);
        return response.requirements;
    } catch (error) {
        const panel = document.getElementById?.('plan-requirements-details');
        const badge = document.getElementById?.('plan-requirements-badge');
        if (panel) panel.textContent = `Plan requirement analysis unavailable: ${error?.message || String(error)}`;
        if (badge) { badge.textContent = 'Unavailable'; badge.className = 'health-badge error'; }
        return null;
    }
}

function formatWorkforcePreflight(preflight) {
    if (!preflight?.enabled) return 'Managers & AI Workforce is disabled.';
    const primary = preflight.primary?.name || preflight.primary?.id || '—';
    const supporting = (preflight.supporting || []).map(row => row.name || row.id).filter(Boolean).join(', ') || 'none';
    const tags = preflight.classification?.tags?.join(', ') || 'general';
    const evidence = (preflight.evidenceRequests || []).map(item => item.capability).filter(Boolean).join('\n- ');
    const readiness = (preflight.readiness || []).map(item => `${item.managerId}: ${item.ready ? 'ready' : `missing ${item.missing?.join(', ') || 'capabilities'}`}`).join('\n');
    const handoffs = (preflight.handoffs || []).map(item => `${item.from || 'manager'} → ${item.to || 'manager'}${item.task ? `: ${item.task}` : ''}`).join('\n') || 'none';
    return [
        `Primary: ${primary}`,
        `Supporting: ${supporting}`,
        `Tags: ${tags}`,
        `Risk: ${preflight.risk?.level || 'low'}${preflight.risk?.approval ? ' / approval recommended' : ''}`,
        `Evidence required: ${preflight.evidenceRequired === false ? 'no' : 'yes'}`,
        `Evidence requests:\n- ${evidence || 'none'}`,
        `Handoffs: ${handoffs}`,
        `Readiness:\n${readiness || 'not checked'}`,
        'Authority: advisory only; no plan advancement or direct mutation.'
    ].join('\n');
}

function renderWorkforceRunnerPreflight(preflight) {
    const panel = document.getElementById?.('workforce-runner-details');
    const badge = document.getElementById?.('workforce-runner-badge');
    if (panel) panel.textContent = formatWorkforcePreflight(preflight);
    if (badge) {
        const ready = Boolean(preflight?.enabled && preflight?.primary);
        badge.textContent = !preflight?.enabled ? 'Disabled' : (ready ? 'Ready' : 'Unavailable');
        badge.className = `health-badge ${!preflight?.enabled ? 'neutral' : (ready ? 'healthy' : 'error')}`;
    }
}

async function runWorkforcePreflight() {
    const input = document.getElementById?.('plan-input');
    const text = String(input?.value || '').trim();
    if (!text) {
        setMessage('Enter a task or plan before running manager preflight.');
        return null;
    }
    try {
        const response = await chrome.runtime.sendMessage({ action: 'PREPARE_WORKFORCE_PREFLIGHT', input: { text, task: text } });
        if (!response?.ok) throw new Error(response?.error || 'Manager preflight failed');
        renderWorkforceRunnerPreflight(response.preflight);
        return response.preflight;
    } catch (error) {
        const panel = document.getElementById?.('workforce-runner-details');
        const badge = document.getElementById?.('workforce-runner-badge');
        if (panel) panel.textContent = `Manager preflight unavailable: ${error?.message || String(error)}`;
        if (badge) { badge.textContent = 'Unavailable'; badge.className = 'health-badge error'; }
        return null;
    }
}

async function createWorkforceDraft() {
    const input = document.getElementById?.('plan-input');
    const text = String(input?.value || '').trim();
    if (!text) {
        setMessage('Enter a goal or task before creating a manager plan draft.');
        return null;
    }
    const output = document.getElementById?.('workforce-draft-output');
    const useButton = document.getElementById?.('workforce-use-draft-btn');
    try {
        const response = await chrome.runtime.sendMessage({ action: 'CREATE_WORKFORCE_PLAN_DRAFT', input: { goal: text, text } });
        if (!response?.ok || !response.draft) throw new Error(response?.error || 'Plan draft could not be created');
        latestWorkforceDraft = response.draft;
        renderWorkforceRunnerPreflight(response.draft.preflight);
        const steps = Array.isArray(response.draft.suggestedSteps) ? response.draft.suggestedSteps : [];
        if (output) {
            output.hidden = false;
            output.textContent = [
                `Draft goal: ${response.draft.goal || text}`,
                `Managers: ${(response.draft.managerIds || []).join(', ') || 'none'}`,
                '',
                ...steps.map((step, index) => `${index + 1}. ${step}`),
                '',
                'Draft authority: create-only. It cannot advance an active Codee plan.'
            ].join('\n');
        }
        if (useButton) useButton.hidden = steps.length === 0;
        return response.draft;
    } catch (error) {
        if (output) { output.hidden = false; output.textContent = `Plan draft unavailable: ${error?.message || String(error)}`; }
        if (useButton) useButton.hidden = true;
        latestWorkforceDraft = null;
        return null;
    }
}

function useWorkforceDraft() {
    const steps = latestWorkforceDraft?.suggestedSteps;
    if (!Array.isArray(steps) || !steps.length) return false;
    const input = document.getElementById?.('plan-input');
    if (!input) return false;
    input.value = steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
    setMessage('Manager plan draft loaded into the Runner. Review/edit it before starting.');
    return true;
}


function formatProductionPreflight(value) {
    if (!value || value.schema !== 'codee.plan.preflight.v1') return 'No production preflight yet.';
    const blockers=(value.blockers||[]).map(item=>`${item.code}: ${item.message}`).join('\n- ') || 'none';
    const warnings=(value.warnings||[]).map(item=>`${item.code}: ${item.message}`).join('\n- ') || 'none';
    return [`Status: ${value.status}`,`Blockers (${value.summary?.blockers||0}):\n- ${blockers}`,`Warnings (${value.summary?.warnings||0}):\n- ${warnings}`,'Authority: readiness evidence only; cannot mutate, grant authority, or advance a plan.'].join('\n');
}
function renderProductionPreflight(value) {
    const panel=document.getElementById?.('production-preflight-details');
    const badge=document.getElementById?.('production-preflight-badge');
    if(panel) panel.textContent=formatProductionPreflight(value);
    if(badge){badge.textContent=value?.status||'Not checked';badge.className=`health-badge ${value?.status==='BLOCKED'?'error':value?.status==='READY'?'healthy':'neutral'}`;}
}
async function runProductionPlanPreflight() {
    const tabId=currentTabId || Number(document.getElementById?.('tab-select')?.value);
    if(!Number.isInteger(Number(tabId))){setMessage('Select a conversation with a saved plan first.');return null;}
    try{
        const response=await chrome.runtime.sendMessage({action:'RUN_PRODUCTION_PLAN_PREFLIGHT',tabId:Number(tabId)});
        if(!response?.ok)throw new Error(response?.error||'Production preflight failed');
        renderProductionPreflight(response.productionPreflight);
        const plan=activePlans.get(Number(tabId)); if(plan){plan.productionPreflight=response.productionPreflight;activePlans.set(Number(tabId),plan);}
        return response.productionPreflight;
    }catch(error){setMessage(`Production preflight unavailable: ${error?.message||String(error)}`);return null;}
}
function registerProductionPreflightHandlers(){document.getElementById?.('production-preflight-btn')?.addEventListener?.('click',runProductionPlanPreflight);}

function registerPlanRequirementHandlers() {
    document.getElementById?.('plan-requirements-btn')?.addEventListener?.('click', analyzePlanRequirements);
}

function registerWorkforceHandlers() {
    document.getElementById?.('workforce-preflight-btn')?.addEventListener?.('click', runWorkforcePreflight);
    document.getElementById?.('workforce-draft-btn')?.addEventListener?.('click', createWorkforceDraft);
    document.getElementById?.('workforce-use-draft-btn')?.addEventListener?.('click', useWorkforceDraft);
}

function formatWorkforceStatus(status) {
    if (!status?.registered) return status?.error || 'Managers & AI Workforce is not registered.';
    const recent = Array.isArray(status.recentRouting) ? status.recentRouting : [];
    const lines = [
        `Pack: ${status.pack?.title || 'Managers & AI Workforce'} v${status.pack?.version || '—'}`,
        `Managers: ${status.counts?.managers || 0}`,
        `Capabilities: ${status.counts?.capabilities || 0}`,
        `Prompts: ${status.counts?.prompts || 0}`,
        `Skills: ${status.counts?.skills || 0}`,
        `Profiles: ${status.counts?.profiles || 0}`,
        `Enabled: ${status.settings?.enabled ? 'yes' : 'no'}`,
        `Max managers/task: ${status.settings?.maxManagersPerTask ?? '—'}`,
        `Plan advancement: ${status.authority?.planAdvance ? 'ERROR' : 'LOCKED / no'}`,
        `Direct mutation: ${status.authority?.directMutation ? 'ERROR' : 'LOCKED / no'}`,
        `Repository intelligence: ${status.dependencies?.repositoryPack ? 'detected' : 'not-installed'}`,
        `MCP runtime: ${status.dependencies?.mcpRuntime ? 'detected' : 'not-installed'}`,
        `Provider gateway: ${status.dependencies?.providerGateway ? 'detected' : 'not-installed / advisory requests queued'}`
    ];
    if (recent.length) {
        const last = recent[recent.length - 1];
        lines.push(`Latest route: ${last.primary || '—'}${last.supporting?.length ? ` + ${last.supporting.join(', ')}` : ''}`);
        lines.push(`Latest tags: ${(last.tags || []).join(', ') || 'general'}`);
    }
    return lines.join('\n');
}

async function loadWorkforceStatus() {
    const panel = document.getElementById?.('diagnostics-workforce');
    const badge = document.getElementById?.('diagnostics-workforce-badge');
    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_WORKFORCE_STATUS' });
        if (panel) panel.textContent = formatWorkforceStatus(response);
        if (badge) {
            badge.textContent = response?.registered ? (response?.settings?.enabled ? 'Ready' : 'Disabled') : 'Unavailable';
            badge.className = `health-badge ${response?.registered ? (response?.settings?.enabled ? 'healthy' : 'neutral') : 'error'}`;
        }
        return response;
    } catch (error) {
        if (panel) panel.textContent = `Workforce status unavailable: ${error?.message || String(error)}`;
        if (badge) { badge.textContent = 'Unavailable'; badge.className = 'health-badge error'; }
        return { ok: false, registered: false, error: error?.message || String(error) };
    }
}

function getProviderName(tab) {
    try {
        const hostname = new URL(tab?.url || '').hostname.toLowerCase();
        if (hostname === 'chatgpt.com' || hostname.endsWith('.chatgpt.com')) return 'ChatGPT';
        if (hostname === 'claude.ai' || hostname.endsWith('.claude.ai')) return 'Claude';
    } catch (_error) {
        // Fall through to unknown provider.
    }

    return 'AI';
}

function isSupportedConversationTab(tab) {
    return getProviderName(tab) !== 'AI';
}

function getStructuredConversationIdentity(url) {
    try {
        const parsed = new URL(String(url || ''));
        const host = parsed.hostname.toLowerCase();
        if (host === 'chatgpt.com' || host.endsWith('.chatgpt.com')) {
            const match = parsed.pathname.match(/^\/c\/([^/?#]+)/i);
            return match ? `chatgpt:${match[1]}` : '';
        }
        if (host === 'claude.ai' || host.endsWith('.claude.ai')) {
            const match = parsed.pathname.match(/^\/chat\/([^/?#]+)/i);
            return match ? `claude:${match[1]}` : '';
        }
    } catch (_error) {}
    return '';
}

function getConversationTitle(tab) {
    const provider = getProviderName(tab);
    let title = String(tab?.title || '').trim();

    if (!title || /^(chatgpt|claude|new chat)$/i.test(title)) {
        return `${provider} conversation`;
    }

    const providerPattern = provider === 'AI' ? '(?:ChatGPT|Claude)' : provider;
    title = title
        .replace(new RegExp(`\\s*[|\\-–—]\\s*${providerPattern}\\s*$`, 'i'), '')
        .replace(new RegExp(`^${providerPattern}\\s*[|:\\-–—]\\s*`, 'i'), '')
        .trim();

    if (!title || /^(chatgpt|claude|new chat)$/i.test(title)) {
        return `${provider} conversation`;
    }

    return title;
}

function getDefaultTargetTabId(tabs, activeTab) {
    if (activeTab && isSupportedConversationTab(activeTab)) {
        const matchingActive = tabs.find(tab => tab.id === activeTab.id);
        if (matchingActive) return matchingActive.id;
    }

    return tabs[0]?.id ?? null;
}

function createPlanSteps(items) {
    return items
        .map(text => String(text || '').trim())
        .filter(Boolean)
        .map((text, index) => ({ number: index + 1, text }));
}

function validatePlanInput(planText, plan) {
    if (String(planText || '').length > MAX_PLAN_TEXT_CHARS) {
        return { ok: false, error: 'Plan is too large. Maximum pasted plan size is 1 MiB.' };
    }
    if (!Array.isArray(plan) || plan.length === 0) {
        return { ok: false, error: 'Titan Code could not find any plan steps in that text.' };
    }
    if (plan.length > MAX_PLAN_STEPS) {
        return { ok: false, error: `Plan has too many steps. Maximum is ${MAX_PLAN_STEPS}.` };
    }
    return { ok: true };
}

function isRenderablePlanState(planState) {
    if (!planState || !Array.isArray(planState.plan) || planState.plan.length === 0) return false;
    const stepIndex = Number(planState.stepIndex);
    if (!Number.isInteger(stepIndex) || stepIndex < 0) return false;
    if (planState.dispatchStatus === 'complete') return stepIndex < planState.plan.length;
    return stepIndex < planState.plan.length;
}

function createPlanId(tabId) {
    try {
        if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
    } catch (_error) {}

    return `plan-${tabId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createRunId(tabId) {
    try {
        if (typeof crypto?.randomUUID === 'function') return `run-${crypto.randomUUID()}`;
    } catch (_error) {}
    return `run-${tabId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parsePlanText(text) {
    const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    const fencedLines = new Array(lines.length).fill(false);
    let activeFence = null;

    lines.forEach((line, index) => {
        const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
        if (fenceMatch) {
            fencedLines[index] = true;
            const marker = fenceMatch[1][0];
            if (!activeFence) activeFence = marker;
            else if (activeFence === marker) activeFence = null;
            return;
        }
        if (activeFence) fencedLines[index] = true;
    });

    // Official v2.0.20 contract: one top-level numbered bullet equals one pass.
    // Parse that form before any legacy heading/bullet fallbacks. Continuation
    // lines nested under a numbered item stay with that pass, but a later
    // top-level Markdown heading closes the numbered-list region so trailing
    // plan metadata (for example "### Target state") is not appended to the
    // final pass.
    const sectionPattern = /^ {0,3}#{1,6}\s+(Step|Task|Pass)\s+(\d+)(?:\s*(?:of|\/)\s*\d+)?\s*[:.)\-–—]?\s*(.*)$/i;
    const bareSectionPattern = /^ {0,3}(Step|Task|Pass)\s+(\d+)(?:\s*(?:of|\/)\s*\d+)?\s*[:.)\-–—]?\s*(.*)$/i;
    const sections = [];
    let currentSection = null;

    const flushSection = () => {
        if (!currentSection) return;
        while (currentSection.body.length && !currentSection.body[0].trim()) currentSection.body.shift();
        while (currentSection.body.length && !currentSection.body[currentSection.body.length - 1].trim()) currentSection.body.pop();

        const heading = currentSection.title || `${currentSection.kind} ${currentSection.number}`;
        const body = currentSection.body.join('\n').trimEnd();
        sections.push(body ? `${heading}\n${body}` : heading);
        currentSection = null;
    };

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex];
        const match = fencedLines[lineIndex]
            ? null
            : (line.match(sectionPattern) || line.match(bareSectionPattern));
        if (match) {
            flushSection();
            currentSection = {
                kind: match[1],
                number: match[2],
                title: match[3].trim(),
                body: []
            };
            continue;
        }

        if (currentSection) currentSection.body.push(line);
    }
    flushSection();

    function parseTopLevelList(itemPattern, options = {}) {
        const candidates = lines.map((line, index) => {
            if (fencedLines[index]) return null;
            const match = line.match(itemPattern);
            return match ? { index, indent: match[1].length, text: match[2] } : null;
        }).filter(Boolean);
        if (candidates.length === 0) return [];

        const minIndent = Math.min(...candidates.map(item => item.indent));
        const topLevel = candidates.filter(item => item.indent === minIndent);
        return topLevel.map((item, itemIndex) => {
            let nextIndex = topLevel[itemIndex + 1]?.index ?? lines.length;
            if (options.stopAtTopLevelHeading && itemIndex === topLevel.length - 1) {
                for (let scanIndex = item.index + 1; scanIndex < nextIndex; scanIndex += 1) {
                    if (fencedLines[scanIndex]) continue;
                    if (/^ {0,3}#{1,6}\s+/.test(lines[scanIndex])) {
                        nextIndex = scanIndex;
                        break;
                    }
                }
            }
            const body = lines.slice(item.index + 1, nextIndex)
                .map(line => line.trimEnd())
                .filter((line, index, all) => line.trim() || (index > 0 && index < all.length - 1));
            return body.length ? `${item.text}\n${body.join('\n').trim()}` : item.text;
        });
    }

    // Highest confidence: exactly one top-level numbered bullet per pass.
    // Nested numbered/bullet details stay in the parent item because only the
    // minimum indentation level is treated as a pass boundary.
    const numbered = parseTopLevelList(/^(\s*)\d+[.)]\s+(.+)$/, { stopAtTopLevelHeading: true });
    if (numbered.length > 0) return createPlanSteps(numbered);

    // Legacy compatibility: explicit Step/Task/Pass headings remain readable when
    // no canonical top-level numbered pass list is present.
    if (sections.length > 0) return createPlanSteps(sections);

    // Then Markdown task-list/bullet steps, treating checked/unchecked items and
    // ordinary bullets as peers at the same indentation level.
    const bullets = parseTopLevelList(/^(\s*)[-*+]\s+(?:\[[ xX]\]\s+)?(.+)$/);
    if (bullets.length > 0) return createPlanSteps(bullets);

    // Backward-compatible fallback for simple one-step-per-line pasted plans.
    const plain = lines
        .map((line, index) => ({ line: line.trim(), fenced: fencedLines[index] }))
        .filter(item => !item.fenced && item.line && !/^#{1,6}\s+/.test(item.line))
        .map(item => item.line);

    return createPlanSteps(plain);
}

function isSupportedPlanFile(file) {
    if (!file || typeof file.name !== 'string') return false;
    if (Number(file.size || 0) > MAX_PLAN_FILE_BYTES) return false;
    return /\.(md|txt)$/i.test(file.name.trim());
}

function getTargetMetadata(tab) {
    if (!tab) return null;
    return {
        title: getConversationTitle(tab),
        provider: getProviderName(tab),
        url: tab.url || '',
        conversationIdentity: getStructuredConversationIdentity(tab.url || '')
    };
}

function getPlanTarget(planState, tabId) {
    const live = tabMetadata.get(tabId);
    if (live) {
        const saved = planState?.target || {};
        const savedIdentity = String(saved.conversationIdentity || '') || getStructuredConversationIdentity(saved.url || '');
        const liveIdentity = String(live.conversationIdentity || '') || getStructuredConversationIdentity(live.url || '');
        const providerMatches = !saved.provider || !live.provider || saved.provider === live.provider;
        const identityMatches = !savedIdentity || liveIdentity === savedIdentity;
        if (providerMatches && identityMatches) return live;
    }

    if (planState?.target?.title) {
        return {
            title: planState.target.title,
            provider: planState.target.provider || 'AI',
            url: planState.target.url || ''
        };
    }

    return { title: 'Saved conversation', provider: 'AI', url: '' };
}

function setMessage(text) {
    const message = document.getElementById('message');
    if (message) message.textContent = text || '';
}

function setImportedFileStatus(text, state = '') {
    const label = document.getElementById('plan-file-name');
    if (!label) return;
    label.textContent = text;
    label.className = `file-name${state ? ` ${state}` : ''}`;
}

function clearImportedFileStatus() {
    const input = document.getElementById('plan-file-input');
    if (input) input.value = '';
    setImportedFileStatus('No file selected');
}

async function loadPlanFile(file) {
    if (!isSupportedPlanFile(file)) {
        const tooLarge = file && Number(file.size || 0) > MAX_PLAN_FILE_BYTES;
        const message = tooLarge
            ? 'Plan file is too large. Maximum size is 1 MiB.'
            : 'Unsupported plan file. Choose a .md or .txt file.';
        setImportedFileStatus(message, 'error');
        setMessage(message);
        return false;
    }

    try {
        const text = await file.text();
        document.getElementById('plan-input').value = text;
        setImportedFileStatus(`Loaded locally: ${file.name}`, 'loaded');
        setMessage('Plan loaded locally. Review or edit it, then press Start Plan.');
        return true;
    } catch (error) {
        console.error('[Titan Code] Could not read plan file:', error);
        setImportedFileStatus('Could not read that plan file.', 'error');
        setMessage('Could not read that plan file.');
        return false;
    }
}

function updateTargetSummary() {
    const select = document.getElementById('tab-select');
    const summary = document.getElementById('current-target-summary');
    if (!select || !summary) return;

    const tabId = Number(select.value);
    const metadata = tabMetadata.get(tabId);

    if (!tabId || !metadata) {
        summary.textContent = 'No supported conversation selected. Open or choose a ChatGPT/Claude conversation.';
        summary.classList.add('no-target');
        return;
    }

    const prefix = tabId === activeConversationTabId ? 'Current conversation' : 'Selected conversation';
    summary.textContent = `${prefix} — ${metadata.title} · ${metadata.provider}`;
    summary.classList.remove('no-target');
}

function renderTargetOptions(tabs, activeTab, preferActive = false) {
    const select = document.getElementById('tab-select');
    if (!select) return;

    const previousId = Number(select.value) || null;
    tabMetadata = new Map(tabs.map(tab => [tab.id, getTargetMetadata(tab)]));
    activeConversationTabId = isSupportedConversationTab(activeTab) ? activeTab.id : null;

    select.replaceChildren();

    if (tabs.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No ChatGPT or Claude conversations open';
        select.appendChild(option);
        select.disabled = true;
        updateTargetSummary();
        updateTabsList();
        return;
    }

    select.disabled = false;

    const defaultId = getDefaultTargetTabId(tabs, activeTab);
    const previousStillExists = previousId && tabs.some(tab => tab.id === previousId);
    const selectedId = preferActive
        ? defaultId
        : (previousStillExists ? previousId : defaultId);

    const orderedTabs = [...tabs].sort((a, b) => {
        if (a.id === activeConversationTabId) return -1;
        if (b.id === activeConversationTabId) return 1;
        return getConversationTitle(a).localeCompare(getConversationTitle(b));
    });

    orderedTabs.forEach(tab => {
        const metadata = tabMetadata.get(tab.id);
        const option = document.createElement('option');
        option.value = String(tab.id);
        const prefix = tab.id === activeConversationTabId ? 'Current — ' : '';
        option.textContent = `${prefix}${metadata.title} · ${metadata.provider}`;
        select.appendChild(option);
    });

    if (selectedId !== null) select.value = String(selectedId);
    updateTargetSummary();
    updateTabsList();
}

async function refreshTargetList({ preferActive = false } = {}) {
    try {
        const [tabs, activeTabs] = await Promise.all([
            chrome.tabs.query({ url: SUPPORTED_URL_PATTERNS, currentWindow: true }),
            chrome.tabs.query({ active: true, currentWindow: true })
        ]);
        renderTargetOptions(tabs, activeTabs[0], preferActive);
    } catch (error) {
        console.error('[Titan Code] Could not refresh conversation tabs:', error);
        setMessage('Could not refresh open ChatGPT/Claude conversations.');
    }
}

function formatActiveNextRunnerLabel(status) {
    const minutes = Number(status?.intervalMinutes) || 5;
    const target = status?.target || {};
    const title = target.title || target.conversationIdentity || `Conversation ${status?.tabId ?? ''}`;
    return {
        title,
        provider: String(target.provider || 'AI').toUpperCase(),
        summary: `Next ${Number(status?.sentCount) || 0} · every ${minutes} minute${minutes === 1 ? '' : 's'}`,
        due: status?.nextDueAt ? `Next ${formatNextRunnerDue(status.nextDueAt)}` : 'Timer active'
    };
}

function adoptNextRunnerStatus(status) {
    const tabId = Number(status?.tabId);
    if (!Number.isInteger(tabId)) return;
    if (status?.enabled) activeNextRunners.set(tabId, status);
    else activeNextRunners.delete(tabId);
}

async function loadActiveNextRunners() {
    try {
        const response = await chrome.runtime.sendMessage({ action:'GET_NEXT_RUNNERS' });
        activeNextRunners = new Map();
        for (const status of response?.runners || []) adoptNextRunnerStatus(status);
    } catch (error) {
        console.warn('[Titan Code] Could not load active Next runners:', error);
    }
    updateTabsList();
}

function openActiveNextRunner(tabId) {
    const select = document.getElementById?.('tab-select');
    if (select && Array.from(select.options || []).some(option => Number(option.value) === Number(tabId))) {
        select.value = String(tabId);
        updateTargetSummary();
    }
    setActivePage('runner');
    refreshNextRunnerStatus().catch(() => {});
}

async function stopAndClearPlan(tabId, event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!Number.isInteger(Number(tabId))) return;

    const numericTabId = Number(tabId);
    const planState = activePlans.get(numericTabId);
    if (!planState) {
        updateTabsList();
        return;
    }

    if (preferences.confirmBeforeStop && typeof window !== 'undefined' && typeof window.confirm === 'function') {
        const target = getPlanTarget(planState, numericTabId);
        if (!window.confirm(`Stop the active plan for ${target.title} and clear it from this screen?`)) return;
    }

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'STOP_PLAN',
            tabId: numericTabId,
            planId: planState?.planId || ''
        });
        if (!response?.ok) {
            setMessage(response?.error || 'Could not stop this plan.');
            return;
        }
    } catch (error) {
        console.error('[Titan Code] Could not stop plan from Active Plans:', error);
        setMessage('Could not stop this plan.');
        return;
    }

    activePlans.delete(numericTabId);
    if (currentTabId === numericTabId) {
        currentTabId = null;
        const running = document.getElementById('running-section');
        if (running) running.style.display = 'none';
    }
    updateTabsList();
    setMessage('Plan stopped and cleared from Active Plans.');
}

async function stopAndClearNextRunner(tabId, event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!Number.isInteger(Number(tabId))) return;

    const numericTabId = Number(tabId);
    const status = activeNextRunners.get(numericTabId);
    if (!status) {
        updateTabsList();
        return;
    }

    if (preferences.confirmBeforeStop && typeof window !== 'undefined' && typeof window.confirm === 'function') {
        const label = formatActiveNextRunnerLabel(status);
        if (!window.confirm(`Stop the timed Next plan for ${label.title} and clear it from this screen?`)) return;
    }

    try {
        const response = await chrome.runtime.sendMessage({ action:'STOP_NEXT_RUNNER', tabId: numericTabId });
        if (!response?.ok) {
            setMessage(response?.error || 'Could not stop this timed Next plan.');
            return;
        }
    } catch (error) {
        console.error('[Titan Code] Could not stop timed Next plan from Active Plans:', error);
        setMessage('Could not stop this timed Next plan.');
        return;
    }

    activeNextRunners.delete(numericTabId);
    updateTabsList();
    setMessage('Timed Next plan stopped and cleared from Active Plans.');
}

function updateTabsList() {
    const section = document.getElementById('tab-selector');
    const list = document.getElementById('tabs-list');
    if (!section || !list) return;

    list.replaceChildren();

    if (activePlans.size === 0 && activeNextRunners.size === 0 && queuedPlans.size === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    activePlans.forEach((planState, tabId) => {
        if (!isRenderablePlanState(planState)) return;
        const target = getPlanTarget(planState, tabId);
        const item = document.createElement('div');
        item.className = `tab-item${tabId === currentTabId ? ' active' : ''}`;
        item.tabIndex = 0;
        item.setAttribute('role', 'button');

        const header = document.createElement('div');
        header.className = 'tab-item-header';

        const title = document.createElement('strong');
        title.textContent = target.title;

        const count = document.createElement('span');
        count.textContent = `${Math.min(planState.stepIndex + 1, planState.plan.length)}/${planState.plan.length} steps`;

        header.append(title, count);

        const provider = document.createElement('div');
        provider.className = 'tab-item-provider';
        provider.textContent = target.provider;

        const step = document.createElement('div');
        step.className = 'tab-item-step';
        step.textContent = planState.plan[planState.stepIndex]?.text || 'Complete';

        const actions = document.createElement('div');
        actions.className = 'tab-item-actions';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-danger tab-item-stop';
        button.textContent = 'Stop & Clear';
        button.setAttribute('aria-label', `Stop and clear plan for ${target.title}`);
        button.addEventListener('click', event => stopAndClearPlan(tabId, event));
        actions.appendChild(button);

        item.append(header, provider, step, actions);
        item.addEventListener('click', () => viewPlan(tabId));
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                viewPlan(tabId);
            }
        });
        list.appendChild(item);
    });

    queuedPlans.forEach((queue, tabId) => {
        const targetMeta = tabMetadata.get(tabId) || {};
        queue.forEach((planState, index) => {
            if (!isRenderablePlanState(planState)) return;
            const target = getPlanTarget(planState, tabId);
            const item = document.createElement('div');
            item.className = 'tab-item queued-plan';
            const header = document.createElement('div');
            header.className = 'tab-item-header';
            const title = document.createElement('strong');
            title.textContent = target.title || targetMeta.title || `Conversation ${tabId}`;
            const count = document.createElement('span');
            count.textContent = `Queued #${index + 1}`;
            header.append(title, count);
            const provider = document.createElement('div');
            provider.className = 'tab-item-provider';
            provider.textContent = `${target.provider || targetMeta.provider || 'AI'} · QUEUED PLAN`;
            const step = document.createElement('div');
            step.className = 'tab-item-step';
            step.textContent = planState.plan?.[0]?.text || 'Waiting for current plan to finish';
            item.append(header, provider, step);
            list.appendChild(item);
        });
    });

    activeNextRunners.forEach((status, tabId) => {
        if (!status?.enabled) return;
        const label = formatActiveNextRunnerLabel(status);
        const item = document.createElement('div');
        item.className = 'tab-item next-runner-plan';
        item.tabIndex = 0;
        item.setAttribute('role', 'button');

        const header = document.createElement('div');
        header.className = 'tab-item-header';
        const title = document.createElement('strong');
        title.textContent = label.title;
        const count = document.createElement('span');
        count.textContent = label.summary;
        header.append(title, count);

        const provider = document.createElement('div');
        provider.className = 'tab-item-provider';
        provider.textContent = `${label.provider} · TIMED NEXT PLAN`;
        const step = document.createElement('div');
        step.className = 'tab-item-step';
        step.textContent = label.due;
        const actions = document.createElement('div');
        actions.className = 'tab-item-actions';
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'btn btn-danger tab-item-stop';
        nextButton.textContent = 'Stop & Clear';
        nextButton.setAttribute('aria-label', `Stop and clear timed Next plan for ${label.title}`);
        nextButton.addEventListener('click', event => stopAndClearNextRunner(tabId, event));
        actions.appendChild(nextButton);

        item.append(header, provider, step, actions);
        item.addEventListener('click', () => openActiveNextRunner(tabId));
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openActiveNextRunner(tabId);
            }
        });
        list.appendChild(item);
    });
}

function viewPlan(tabId) {
    currentTabId = tabId;
    showRunningUI();
    updateTabsList();
}

function hidePlanDetails() {
    currentTabId = null;
    document.getElementById('running-section').style.display = 'none';
    updateTabsList();
}

function generateDebuggingPlanText() {
    const passes = [
        'Baseline & Reproduction — Deep scan the current cumulative build, reproduce reported failures, capture exact symptoms, and fix any immediately confirmed baseline defects.',
        'Plan Parser & State Machine — Deep scan plan parsing, step boundaries, state revisions, exactly-once dispatch, retries, stop/resume, and fix parser/state regressions.',
        'Conversation Binding & Composer — Deep scan provider identity, exact conversation targeting, composer discovery/submission acknowledgement, and fix any misbinding or composer failures.',
        'Background Tabs & Recovery — Deep scan inactive, frozen, discarded and reloaded conversation behavior, recovery alarms, focus restoration and pending-send recovery; fix every reproducible stall.',
        'Artifacts & Verification — Deep scan CODEE_ARTIFACT detection, identity binding, receipt requirements, lineage, download/hash/ZIP verification and fix false completion or missed completion paths.',
        'Storage, Restart & Retry Durability — Deep scan MV3 worker restarts, storage migrations, retry backoff, token stability, orphan/rebind recovery and fix persistence or race defects.',
        'UI, Navigation & Settings Wiring — Deep scan Runner, Active Plans, Diagnostics, recovery controls, sidebar navigation and settings synchronization; fix dead/unwired controls.',
        'Security & Authority Boundaries — Deep scan permissions, secrets, provider/MCP/host authority, mutation gates, cross-conversation attacks and unsafe fallback paths; fix violations without weakening governance.',
        'Concurrency & Adversarial Regression Hunt — Deep scan simultaneous tabs, duplicate signals, stale responses, reload races, provider busy states and hostile malformed inputs; fix discovered regressions.',
        'Final Certification — Re-scan the whole extension after repairs, run focused and complete verification, confirm no regressions, build a fresh cumulative ZIP, re-extract it and verify the exact release bytes.'
    ];
    return ['# Titan Code 10-Pass Debugging Plan', '', ...passes.map((text, index) => `### Pass ${index + 1} — ${text}`)].join('\n');
}

function generateDebuggingPlan() {
    const input = document.getElementById?.('plan-input');
    const mode = document.getElementById?.('debugging-plan-mode');
    if (input) input.value = generateDebuggingPlanText();
    if (mode) { mode.checked = true; if (mode.dataset) mode.dataset.userChanged = 'true'; }
    clearImportedFileStatus();
    setMessage('Generated a 10-pass debugging plan. Choose the target conversation and start when ready.');
    return input?.value || '';
}

async function confirmPlan() {
    if (planStartInProgress) return;

    const tabId = Number(document.getElementById('tab-select').value);
    const planText = document.getElementById('plan-input').value.trim();

    if (!tabId || !tabMetadata.has(tabId)) {
        setMessage('Choose an open ChatGPT or Claude conversation first.');
        return;
    }

    if (!planText) {
        setMessage('Paste a plan or load a .md/.txt plan file first.');
        return;
    }

    const plan = parsePlanText(planText);
    const planValidation = validatePlanInput(planText, plan);
    if (!planValidation.ok) {
        setMessage(planValidation.error);
        return;
    }

    const target = tabMetadata.get(tabId);
    const planState = {
        stateVersion: 2,
        protocolMode: 'signature_v2',
        planId: createPlanId(tabId),
        runId: createRunId(tabId),
        plan,
        stepIndex: 0,
        versions: [],
        knownVersions: [],
        knownArtifactHashes: [],
        consumedArtifactHashes: [],
        consumedArtifactKeys: [],
        artifactHistory: [],
        debuggingPlanEnabled: Boolean(document.getElementById('debugging-plan-mode')?.checked),
        nextNudgerEnabled: Boolean(preferences.nextNudgerDefault && preferences.nextNudgerFeatureEnabled),
        lastNextNudgeAttemptAt: null,
        lastNextNudgeSentAt: null,
        lastNextNudgeStepId: '',
        lastNextNudgeError: '',
        lastArtifactSha256: null,
        currentStepId: null,
        currentStepToken: null,
        dispatchStatus: 'pending_send',
        requiresRestart: false,
        target: { ...target }
    };

    const button = document.getElementById('confirm-btn');
    planStartInProgress = true;
    if (button) button.disabled = true;

    try {
        const saveResponse = await chrome.runtime.sendMessage({ action: 'SAVE_PLAN', tabId, planState });
        if (!saveResponse?.ok) {
            setMessage(saveResponse?.error || 'Could not save the plan.');
            return;
        }

        const savedPlanState = saveResponse.planState && isRenderablePlanState(saveResponse.planState) ? saveResponse.planState : planState;
        if (saveResponse.queued) {
            const queue = queuedPlans.get(tabId) || [];
            queue.push({ ...savedPlanState, dispatchStatus:'queued', queuePosition:Number(saveResponse.queuePosition)||queue.length+1 });
            queuedPlans.set(tabId, queue);
            updateTabsList();
            if (preferences.autoOpenPlans) setActivePage('plans');
            setMessage(`Plan queued as #${Number(saveResponse.queuePosition)||queue.length}. The current plan will finish first.`);
        } else {
            activePlans.set(tabId, savedPlanState);
            renderPlanRequirements(savedPlanState.planRequirements);
            renderProductionPreflight(savedPlanState.productionPreflight);
            renderWorkforceRunnerPreflight(savedPlanState.workforcePreflight);
            currentTabId = tabId;
            showRunningUI();
            updateTabsList();
            if (preferences.autoOpenPlans) setActivePage('plans');
            await startPlan(tabId);
        }

        document.getElementById('plan-input').value = '';
        clearImportedFileStatus();
    } catch (error) {
        console.error('[Titan Code] Could not create plan:', error);
        setMessage('Could not create the plan. Reload Titan Code and try again.');
    } finally {
        planStartInProgress = false;
        if (button) button.disabled = false;
    }
}

function showRunningUI() {
    const running = document.getElementById('running-section');
    running.style.display = 'block';
    updateUI();
}

function updateUI() {
    if (!currentTabId || !activePlans.has(currentTabId)) return;

    const planState = activePlans.get(currentTabId);
    if (!isRenderablePlanState(planState)) {
        setMessage('Saved plan state is invalid. Stop/remove this plan and restart from the source plan.');
        return;
    }
    const target = getPlanTarget(planState, currentTabId);
    const total = planState.plan.length;
    const stepIdx = planState.stepIndex;

    document.getElementById('tab-info').textContent = `${target.title} · ${target.provider}`;
    document.getElementById('step-text').textContent = `${Math.min(stepIdx + 1, total)}/${total}`;

    const percent = planState.dispatchStatus === 'complete'
        ? 100
        : (total > 0 ? Math.round((stepIdx / total) * 100) : 0);
    document.getElementById('progress-fill').style.width = `${percent}%`;
    document.getElementById('progress-percent').textContent = `${percent}%`;

    if (planState.dispatchStatus === 'complete') {
        document.getElementById('current-step-text').textContent = 'All steps complete';
        document.getElementById('next-step-text').textContent = '—';
    } else if (stepIdx < total) {
        document.getElementById('current-step-text').textContent =
            `Step ${planState.plan[stepIdx].number}: ${planState.plan[stepIdx].text}`;

        document.getElementById('next-step-text').textContent = stepIdx + 1 < total
            ? `Step ${planState.plan[stepIdx + 1].number}: ${planState.plan[stepIdx + 1].text}`
            : 'Final step';
    }

    const workforceSummary = document.getElementById?.('workforce-plan-summary');
    if (workforceSummary) {
        const preflight = planState.workforcePreflight;
        if (preflight?.enabled && preflight?.primary) {
            const supporting = (preflight.supporting || []).map(row => row.name || row.id).filter(Boolean);
            workforceSummary.textContent = `${preflight.primary.name || preflight.primary.id}${supporting.length ? ` + ${supporting.join(', ')}` : ''} · ${(preflight.classification?.tags || []).join(', ') || 'general'}`;
        } else {
            workforceSummary.textContent = preflight?.enabled === false ? 'Managers disabled' : 'No manager preflight yet';
        }
    }

    const status = document.getElementById('status-text');
    if (planState.dispatchStatus === 'pending_send') {
        status.textContent = `Step ${stepIdx + 1} pending send`;
    } else if (planState.dispatchStatus === 'awaiting_zip') {
        status.textContent = `Waiting for Step ${stepIdx + 1} output…`;
    } else if (planState.dispatchStatus === 'awaiting_artifact') {
        status.textContent = `Waiting for Step ${stepIdx + 1} signed artifact…`;
    } else if (planState.dispatchStatus === 'blocked') {
        status.textContent = `Step ${stepIdx + 1} blocked — review the conversation`;
    } else if (planState.dispatchStatus === 'complete') {
        status.textContent = 'Complete!';
    }

    const versions = Array.isArray(planState.versions) ? planState.versions : [];
    document.getElementById('version-text').textContent = `${versions.length}/5`;

    const versionsList = document.getElementById('versions');
    versionsList.replaceChildren();
    if (versions.length === 0) {
        versionsList.textContent = 'No versions detected yet.';
    } else {
        versions.forEach(version => {
            const row = document.createElement('div');
            row.textContent = `v${version}`;
            versionsList.appendChild(row);
        });
    }
}

async function startPlan(tabId) {
    const planState = activePlans.get(tabId);
    if (!planState || planState.dispatchStatus === 'complete') return;

    updateUI();

    const target = getPlanTarget(planState, tabId);
    document.getElementById('status-text').textContent = `Sending Step ${planState.stepIndex + 1}…`;
    setMessage(`Connecting to ${target.title}…`);

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'START_PLAN',
            tabId
        });

        if (response?.ok) {
            planState.dispatchStatus = response.dispatchStatus || 'awaiting_artifact';
            document.getElementById('status-text').textContent = `Waiting for Step ${planState.stepIndex + 1} signed artifact…`;
            setMessage(`Step ${planState.stepIndex + 1} sent to ${target.title}.`);
            return;
        }

        planState.dispatchStatus = 'pending_send';
        document.getElementById('status-text').textContent = `Step ${planState.stepIndex + 1} pending send`;
        setMessage(`Could not connect to ${target.title}. Reload that conversation tab; Titan Code will retry the same step automatically.`);
    } catch (error) {
        console.error('[Titan Code] Could not start plan:', error);
        planState.dispatchStatus = 'pending_send';
        document.getElementById('status-text').textContent = `Step ${planState.stepIndex + 1} pending send`;
        setMessage(`Could not connect to ${target.title}. Reload that conversation tab; Titan Code will retry the same step automatically.`);
    }
}

async function stopCurrentPlan() {
    if (!currentTabId) return;

    const tabId = currentTabId;
    const planState = activePlans.get(tabId);
    if (preferences.confirmBeforeStop && typeof window !== 'undefined' && typeof window.confirm === 'function') {
        const target = getPlanTarget(planState, tabId);
        if (!window.confirm(`Stop the active plan for ${target.title}?`)) return;
    }
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'STOP_PLAN',
            tabId,
            planId: planState?.planId || ''
        });
        if (!response?.ok) {
            setMessage(response?.error || 'Could not stop this plan.');
            return;
        }
    } catch (error) {
        console.error('[Titan Code] Could not stop plan:', error);
        setMessage('Could not stop this plan.');
        return;
    }

    activePlans.delete(tabId);
    currentTabId = null;
    document.getElementById('running-section').style.display = 'none';
    updateTabsList();
    setMessage('Plan stopped.');
}

async function loadState() {
    try {
        const result = await chrome.storage.local.get(['codeeState']);
        activePlans = new Map();
        queuedPlans = new Map();

        if (result.codeeState) {
            Object.entries(result.codeeState).forEach(([key, value]) => {
                if (key.startsWith('planQueue_')) {
                    const tabId = Number(key.replace('planQueue_', ''));
                    const queue = Array.isArray(value) ? value.filter(isRenderablePlanState) : [];
                    if (Number.isInteger(tabId) && queue.length) queuedPlans.set(tabId, queue);
                    return;
                }
                if (!key.startsWith('plan_')) return;
                const tabId = Number(key.replace('plan_', ''));
                if (Number.isInteger(tabId) && isRenderablePlanState(value)) {
                    activePlans.set(tabId, value);
                }
            });
        }

        await loadActiveNextRunners();
        updateTabsList();
    } catch (error) {
        console.error('[Titan Code] Could not load plan state:', error);
        setMessage('Could not load saved plan state.');
    }
}

function getDiagnosticTargetTabId() {
    if (Number.isInteger(currentTabId) && activePlans.has(currentTabId)) return currentTabId;
    if (Number.isInteger(activeConversationTabId)) return activeConversationTabId;
    const selected = Number(document.getElementById?.('tab-select')?.value);
    return Number.isInteger(selected) ? selected : null;
}

function formatDiagnosticPlan(report) {
    const plan = report?.plan;
    if (!plan) return 'No plan state bound to this tab.';
    return [
        `Plan: ${plan.planId || '—'}`,
        `Run: ${plan.runId || '—'}`,
        `Step: ${plan.stepNumber}/${plan.stepTotal}`,
        `State: ${plan.dispatchStatus || '—'}`,
        `Step ID: ${plan.stepId || '—'}`,
        `Token: ${plan.stepToken || '—'}`,
        `Revision: ${plan.stateRevision}`,
        `Last artifact: ${plan.lastArtifactSha256 || '—'}`,
        `Artifact rejection: ${plan.lastArtifactValidationReason || 'none'}`,
        `Dispatch error: ${plan.lastDispatchError || 'none'}`,
        `Artifact verification: ${plan.artifactVerificationMode || 'legacy_footer_only'}`,
        `Artifact validation: ${plan.artifactValidationMode || 'legacy_v2'}`,
        `Artifact receipt: ${plan.artifactVerificationReceipt?.receiptId || '—'}`,
        `Logical retries: ${plan.logicalRetryCount ?? 0}`,
        `Delivery retries: ${plan.deliveryRetryCount ?? 0}`,
        `Next retry: ${plan.nextRetryAt ? new Date(plan.nextRetryAt).toISOString() : '—'}`,
        `Debugging plan: ${plan.debuggingPlanEnabled ? 'ON / deep-scan + fix every pass' : 'OFF'}`,
        `Next nudger: ${plan.nextNudgerEnabled ? 'ON / every 5 minutes' : 'OFF'}`,
        `Next due: ${plan.nextNudgerEnabled && plan.nextNudgeDueAt ? new Date(plan.nextNudgeDueAt).toISOString() : '—'}`
    ].join('\n');
}

function formatDiagnosticConnection(report) {
    const connection = report?.connection || {};
    const tab = report?.tab;
    const storage = report?.storageHealth || {};
    return [
        `Worker: ${connection.worker ? 'OK' : 'FAIL'}`,
        `Content script: ${connection.contentScript ? 'OK' : 'FAIL'}`,
        `Extension context: ${connection.contextValid ? 'OK' : 'FAIL'}`,
        `Composer: ${connection.composer ? 'FOUND' : 'NOT FOUND'}`,
        `Recovery timer: ${report?.recoveryAlarm?.enabled === false ? 'DISABLED' : (report?.recoveryAlarm?.ok ? '1 minute / OK' : 'MISSING OR WRONG')}`,
        `Tab state: ${tab?.discarded ? 'DISCARDED / WAKE-RECOVERABLE' : (tab?.frozen ? 'FROZEN / WAKE-RECOVERABLE' : (tab ? (tab.active ? 'ACTIVE / RUNNABLE' : 'BACKGROUND / RUNNABLE') : '—'))}`,
        `Auto-discard: ${tab ? (tab.autoDiscardable ? 'ON' : 'OFF while Titan Code runs') : '—'}`,
        `Background watchdog: ${report?.recoverySettings?.backgroundWatchdog ? 'ON' : 'OFF'}`,
        `Composer watchdog: ${report?.recoverySettings?.composerWatchdog ? 'ON' : 'OFF'}`,
        `Targeted reload: ${report?.recoverySettings?.targetedReload ? 'ON' : 'OFF'}`,
        `Provider: ${tab?.provider || '—'}`,
        `Conversation: ${tab?.title || '—'}`,
        `Identity: ${tab?.liveIdentity || 'provisional'}`,
        `Content error: ${connection.lastContentError || connection.pageError || 'none'}`,
        `Prompt error: ${connection.lastPromptError || 'none'}`,
        `Storage used: ${storage.bytesInUse ?? 'unknown'} bytes`,
        `Completed plans: ${storage.completedPlans ?? 0}`,
        `Compacted plans: ${storage.compactedPlans ?? 0}`
    ].join('\n');
}

// Plan inventory: and Failure summary: are intentionally included in formatDiagnosticRunner for support exports.
function formatDiagnosticRunner(report) {
    const runner = report?.runner || {};
    const inventory = report?.planInventory || {};
    const recovery = report?.recovery || {};
    const failures = report?.failureSummary || {};
    const lastFailure = failures.lastFailure || null;
    const lastSuccess = failures.lastSuccess || null;
    const active = Array.isArray(inventory.activePlans) ? inventory.activePlans : [];
    const resultCounts = failures.byResult && typeof failures.byResult === 'object'
        ? Object.entries(failures.byResult).map(([key,value]) => `${key}=${value}`).join(', ')
        : '';
    return [
        `Standalone Next Runner: ${runner.enabled ? String(runner.healthState || 'unknown').toUpperCase() : 'STOPPED'}`,
        `Runner alarm: ${runner.alarmPresent ? 'PRESENT' : (runner.enabled ? 'MISSING' : 'not required')}`,
        `Runner interval: ${runner.intervalMinutes ?? '—'} minutes`,
        `Runner attempts: ${runner.attemptCount ?? 0}`,
        `Runner verified sends: ${runner.sentCount ?? 0}`,
        `Runner failed/skipped: ${runner.failedCount ?? 0}`,
        `Runner last result: ${runner.lastResult || 'none'}`,
        `Runner next due: ${runner.nextDueAt ? new Date(runner.nextDueAt).toISOString() : '—'}`,
        '',
        `Plan inventory: ${inventory.totalCount ?? 0} saved / ${inventory.activeCount ?? 0} active`,
        `Bound to this tab: ${inventory.boundToCurrentTab ? 'YES' : 'NO'}`,
        `Identity matches elsewhere: ${Array.isArray(inventory.identityMatches) ? inventory.identityMatches.length : 0}`,
        `Orphan active plans: ${inventory.orphanCount ?? 0}`,
        ...active.slice(0,6).map(row => `Active ${row.planId || '—'}: tab=${row.tabId ?? 'orphan'} step=${row.stepNumber || 0}/${row.stepTotal || 0} state=${row.dispatchStatus || '—'} identity=${row.targetIdentity || '—'}`),
        '',
        `Recovery mode: ${recovery.silentByDefault ? 'SILENT BACKGROUND DEFAULT' : 'FOCUS PULSE ENABLED'}`,
        `Focus pulse: ${recovery.focusPulseEnabled ? 'ON' : 'OFF'}`,
        `Receiver reachable: ${recovery.receiverReachable ? 'YES' : 'NO'}`,
        `Background watchdog: ${recovery.backgroundWatchdog ? 'ON' : 'OFF'}`,
        `Composer watchdog: ${recovery.composerWatchdog ? 'ON' : 'OFF'}`,
        `Targeted reload: ${recovery.targetedReload ? 'ON' : 'OFF'}`,
        `Reload cooldown: ${Math.ceil((Number(recovery.watchdogReloadCooldownMs)||0)/1000)}s`,
        `Receiver probe error: ${recovery.pageProbeError || 'none'}`,
        '',
        `Failure summary: ${failures.total ?? 0} recent events`,
        `Failure results: ${resultCounts || 'none'}`,
        `Last failure: ${lastFailure ? `${lastFailure.at} ${lastFailure.type} ${lastFailure.result || ''}`.trim() : 'none'}`,
        `Last success: ${lastSuccess ? `${lastSuccess.at} ${lastSuccess.type} ${lastSuccess.result || ''}`.trim() : 'none'}`
    ].join('\n');
}

function formatDiagnosticArtifact(report) {
    const artifact = report?.artifact || {};
    const evaluations = Array.isArray(artifact.evaluations) ? artifact.evaluations : [];
    const current = [...evaluations].reverse().find(item => item.matchesCurrentStep) || evaluations[evaluations.length - 1];
    return [
        `Verification required: ${artifact.verificationRequired ? 'YES' : 'NO (legacy plan)'}`,
        `Artifact verifier: ${artifact.verifierConnected ? 'CONNECTED' : 'NOT CONNECTED'}`,
        `Verification receipt: ${artifact.lastReceipt?.receiptId || '—'}`,
        `Visible signatures: ${artifact.visibleCount || 0}`,
        `Current-step matches: ${artifact.matchingCount || 0}`,
        `Latest match: ${current ? (current.valid ? 'VALID' : `REJECTED (${current.reason})`) : 'none'}`,
        `Status: ${current?.status || '—'}`,
        `Step ID: ${current?.stepId || '—'}`,
        `Token: ${current?.stepToken || '—'}`,
        `SHA256: ${current?.sha256 || '—'}`,
        `ZIP: ${current?.zip || '—'}`
    ].join('\n');
}

function buildDiagnosticsClipboardText(report, metadata = {}) {
    const safeReport = report && typeof report === 'object' ? report : {};
    const plan = safeReport.plan || null;
    const connection = safeReport.connection || {};
    const tab = safeReport.tab || null;
    const alarm = safeReport.recoveryAlarm || {};
    const artifact = safeReport.artifact || {};
    const evaluations = Array.isArray(artifact.evaluations) ? artifact.evaluations : [];
    const currentArtifact = [...evaluations].reverse().find(item => item?.matchesCurrentStep) || evaluations[evaluations.length - 1] || null;
    const checks = Array.isArray(safeReport.checks) ? safeReport.checks : [];
    const deepRunner = safeReport.runner || {};
    const deepInventory = safeReport.planInventory || {};
    const deepRecovery = safeReport.recovery || {};
    const deepFailures = safeReport.failureSummary || {};
    const deepResults = deepFailures.byResult && typeof deepFailures.byResult === 'object'
        ? Object.entries(deepFailures.byResult).map(([key,value]) => `${key}=${value}`).join(', ')
        : '';
    const runnerLines = [
        `Standalone Next Runner: ${deepRunner.enabled ? String(deepRunner.healthState || 'unknown').toUpperCase() : 'STOPPED'}`,
        `Runner alarm: ${deepRunner.alarmPresent ? 'PRESENT' : (deepRunner.enabled ? 'MISSING' : 'not required')}`,
        `Runner attempts: ${deepRunner.attemptCount ?? 0}`,
        `Runner verified sends: ${deepRunner.sentCount ?? 0}`,
        `Runner failed/skipped: ${deepRunner.failedCount ?? 0}`,
        `Runner last result: ${deepRunner.lastResult || 'none'}`,
        `Plan inventory: ${deepInventory.totalCount ?? 0} saved / ${deepInventory.activeCount ?? 0} active`,
        `Bound to this tab: ${deepInventory.boundToCurrentTab ? 'YES' : 'NO'}`,
        `Recovery mode: ${deepRecovery.silentByDefault ? 'SILENT BACKGROUND DEFAULT' : 'FOCUS PULSE ENABLED'}`,
        `Focus pulse: ${deepRecovery.focusPulseEnabled ? 'ON' : 'OFF'}`,
        `Receiver reachable: ${deepRecovery.receiverReachable ? 'YES' : 'NO'}`,
        `Failure summary: ${deepFailures.total ?? 0} recent events`,
        `Failure results: ${deepResults || 'none'}`
    ];
    const events = Array.isArray(safeReport.events) ? safeReport.events : [];
    const version = String(metadata.version || 'unknown');
    const generatedAt = String(metadata.generatedAt || new Date().toISOString());

    const planLines = plan ? [
        `Plan: ${plan.planId || '—'}`,
        `Run: ${plan.runId || '—'}`,
        `Step: ${plan.stepNumber || 0}/${plan.stepTotal || 0}`,
        `State: ${plan.dispatchStatus || '—'}`,
        `Step ID: ${plan.stepId || '—'}`,
        `Token: ${plan.stepToken || '—'}`,
        `Revision: ${plan.stateRevision ?? '—'}`,
        `Last artifact: ${plan.lastArtifactSha256 || '—'}`,
        `Artifact rejection: ${plan.lastArtifactValidationReason || 'none'}`,
        `Dispatch error: ${plan.lastDispatchError || 'none'}`,
        `Target identity: ${plan.targetIdentity || '—'}`,
        `Requires restart: ${plan.requiresRestart ? 'YES' : 'NO'}`,
        `Artifact verification: ${plan.artifactVerificationMode || 'legacy_footer_only'}`,
        `Artifact validation: ${plan.artifactValidationMode || 'legacy_v2'}`,
        `Artifact receipt: ${plan.artifactVerificationReceipt?.receiptId || '—'}`,
        `Logical retries: ${plan.logicalRetryCount ?? 0}`,
        `Delivery retries: ${plan.deliveryRetryCount ?? 0}`,
        `Next retry: ${plan.nextRetryAt ? new Date(plan.nextRetryAt).toISOString() : '—'}`
    ] : ['No plan state bound to this tab.'];

    const connectionLines = [
        `Worker: ${connection.worker ? 'OK' : 'FAIL'}`,
        `Content script: ${connection.contentScript ? 'OK' : 'FAIL'}`,
        `Extension context: ${connection.contextValid ? 'OK' : 'FAIL'}`,
        `Composer: ${connection.composer ? 'FOUND' : 'NOT FOUND'}`,
        `Recovery timer: ${alarm.ok ? `${alarm.periodInMinutes || 1} minute / OK` : `MISSING OR WRONG (${alarm.periodInMinutes ?? 'none'})`}`,
        `Provider: ${tab?.provider || '—'}`,
        `Conversation: ${tab?.title || '—'}`,
        `Tab ID: ${tab?.id ?? '—'}`,
        `Identity: ${tab?.liveIdentity || 'provisional'}`,
        `Content error: ${connection.lastContentError || connection.pageError || 'none'}`,
        `Prompt error: ${connection.lastPromptError || 'none'}`,
        `Last prompt accepted: ${connection.lastPromptAcceptedAt || '—'}`,
        `Content scan count: ${connection.scanCount ?? 0}`
    ];

    const artifactLines = [
        `Verification required: ${artifact.verificationRequired ? 'YES' : 'NO (legacy plan)'}`,
        `Artifact verifier: ${artifact.verifierConnected ? 'CONNECTED' : 'NOT CONNECTED'}`,
        `Verification receipt: ${artifact.lastReceipt?.receiptId || '—'}`,
        `Visible signatures: ${artifact.visibleCount || 0}`,
        `Current-step matches: ${artifact.matchingCount || 0}`,
        `Latest match: ${currentArtifact ? (currentArtifact.valid ? 'VALID' : `REJECTED (${currentArtifact.reason || 'unknown'})`) : 'none'}`,
        `Status: ${currentArtifact?.status || '—'}`,
        `Step ID: ${currentArtifact?.stepId || '—'}`,
        `Token: ${currentArtifact?.stepToken || '—'}`,
        `SHA256: ${currentArtifact?.sha256 || '—'}`,
        `ZIP: ${currentArtifact?.zip || '—'}`
    ];


    const storage = safeReport.storageHealth || {};
    const storageLines = [
        `Bytes used: ${storage.bytesInUse ?? 'unknown'}`,
        `Plans: ${storage.planCount ?? 0}`,
        `Active plans: ${storage.activePlans ?? 0}`,
        `Completed plans: ${storage.completedPlans ?? 0}`,
        `Compacted plans: ${storage.compactedPlans ?? 0}`,
        `Artifact receipts: ${storage.artifactReceipts ?? 0}`,
        `Full completed-plan retention: ${storage.retention?.fullCompletedPlans ?? '—'}`
    ];

    const checkLines = checks.length ? checks.map((check, index) => {
        const name = check?.name || check?.id || `check-${index + 1}`;
        const status = check?.ok === true ? 'PASS' : (check?.ok === false ? 'FAIL' : 'INFO');
        const detail = check?.detail || check?.message || check?.reason || '';
        return `${status} ${name}${detail ? ` — ${detail}` : ''}`;
    }) : ['No diagnostic checks returned.'];

    const eventLines = events.length ? [...events].reverse().map(event => {
        const detail = event?.details && typeof event.details === 'object'
            ? Object.entries(event.details).map(([key, value]) => `${key}=${value}`).join(' ')
            : '';
        return `${event?.at || ''} [${String(event?.severity || 'info').toUpperCase()}] ${event?.type || 'event'}${detail ? ` — ${detail}` : ''}`;
    }) : ['No recovery events recorded yet.'];

    const titan = safeReport.titanZero || {};
    const titanLines = titan?.registered ? [
        `Pack: ${titan.pack?.title || 'Titan Zero Developer Intelligence'} v${titan.pack?.version || '—'}`,
        `Prompts: ${titan.counts?.prompts || 0}`,
        `Skills: ${titan.counts?.skills || 0}`,
        `Profiles: ${titan.counts?.profiles || 0}`,
        `Context providers: ${titan.counts?.contextProviders || 0}`,
        `Enabled: ${titan.settings?.enabled ? 'yes' : 'no'}`,
        `Extensions included: ${titan.settings?.includeExtensions !== false && titan.settings?.ignoreExtensions !== true ? 'LOCKED / yes' : 'ERROR'}`,
        `SQL row parsing: ${titan.settings?.parseSqlRows ? 'ERROR / enabled' : 'LOCKED / no'}`,
        `Repository bridge: ${titan.repositoryBridge || 'not-installed'}`,
        `Last host analysis: ${titan.latestAnalysis?.analyzedAt || 'none yet'}`
    ] : [titan?.error || 'Titan Zero status unavailable.'];

    const repository = safeReport.repository || {};
    const repositoryLines = repository?.registered ? [
        `Pack: ${repository.pack?.title || 'Repository & Coding Intelligence'} v${repository.pack?.version || '—'}`,
        `Capabilities: ${repository.counts?.capabilities || 0}`,
        `Prompts: ${repository.counts?.prompts || 0}`,
        `Skills: ${repository.counts?.skills || 0}`,
        `Profiles: ${repository.counts?.profiles || 0}`,
        `Enabled: ${repository.settings?.enabled ? 'yes' : 'no'}`,
        `Extensions included: ${repository.extensionsIncluded ? 'LOCKED / yes' : 'ERROR'}`,
        `Repository host bridge: ${repository.hostBridge || 'not-installed'}`,
        `MCP runtime: ${repository.mcp?.runtimeDetected ? 'detected' : 'not-installed'}`,
        `Backup provider: ${repository.backupPolicy?.createBackup && repository.backupPolicy?.verifyBackup ? 'ready' : 'not-installed'}`,
        `Last analysis: ${repository.latestAnalysis?.analyzedAt || 'none yet'}`
    ] : [repository?.error || 'Repository intelligence status unavailable.'];

    const workforce = safeReport.workforce || {};
    const workforceLines = workforce?.registered ? [
        `Pack: ${workforce.pack?.title || 'Managers & AI Workforce'} v${workforce.pack?.version || '—'}`,
        `Managers: ${workforce.counts?.managers || 0}`,
        `Capabilities: ${workforce.counts?.capabilities || 0}`,
        `Prompts: ${workforce.counts?.prompts || 0}`,
        `Skills: ${workforce.counts?.skills || 0}`,
        `Profiles: ${workforce.counts?.profiles || 0}`,
        `Enabled: ${workforce.settings?.enabled ? 'yes' : 'no'}`,
        `Plan advancement: ${workforce.authority?.planAdvance ? 'ERROR' : 'LOCKED / no'}`,
        `Direct mutation: ${workforce.authority?.directMutation ? 'ERROR' : 'LOCKED / no'}`,
        `Repository intelligence: ${workforce.dependencies?.repositoryPack ? 'detected' : 'not-installed'}`,
        `MCP runtime: ${workforce.dependencies?.mcpRuntime ? 'detected' : 'not-installed'}`,
        `Provider gateway: ${workforce.dependencies?.providerGateway ? 'detected' : 'not-installed'}`
    ] : [workforce?.error || 'Managers & AI Workforce status unavailable.'];

    let rawSnapshot = '';
    try {
        rawSnapshot = JSON.stringify(safeReport, null, 2);
    } catch (_error) {
        rawSnapshot = '[Could not serialize raw diagnostic snapshot]';
    }

    return [
        '# TITAN CODE Diagnostics Report',
        '',
        `Version: ${version}`,
        `Generated: ${generatedAt}`,
        `Overall: ${safeReport.overall || (safeReport.ok ? 'unknown' : 'error')}`,
        `Recommendation: ${safeReport.recommendation || safeReport.error || '—'}`,
        '',
        '## Plan State',
        '```', ...planLines, '```',
        '',
        '## Connection',
        '```', ...connectionLines, '```',
        '',
        '## Artifact Handshake',
        '```', ...artifactLines, '```',
        '',
        '## Titan Zero Developer Intelligence',
        '```', ...titanLines, '```',
        '',
        '## Repository & Coding Intelligence',
        '```', ...repositoryLines, '```',
        '',
        '## Managers & AI Workforce',
        '```', ...workforceLines, '```',
        '',
        '## Storage Health',
        '```', ...storageLines, '```',
        '',
        '## Checks',
        '```', ...checkLines, '```',
        '',
        '## Recovery Log',
        '```', ...eventLines, '```',
        '',
        '## Raw Snapshot',
        '```json', rawSnapshot, '```'
    ].join('\n');
}

async function copyAllDiagnostics() {
    const status = document.getElementById?.('diagnostics-status');
    try {
        const report = await loadDiagnostics();
        if (!report?.ok) {
            if (status) status.textContent = report?.error || 'Diagnostics are unavailable to copy.';
            return false;
        }
        const version = chrome?.runtime?.getManifest?.()?.version || 'unknown';
        const text = buildDiagnosticsClipboardText(report, { version, generatedAt: new Date().toISOString() });
        if (!navigator?.clipboard?.writeText) throw new Error('Clipboard API is unavailable');
        await navigator.clipboard.writeText(text);
        if (status) status.textContent = `Copied all diagnostics (${text.length.toLocaleString()} characters).`;
        return true;
    } catch (error) {
        console.error('[Titan Code] Could not copy diagnostics:', error);
        if (status) status.textContent = `Could not copy diagnostics: ${error?.message || String(error)}`;
        return false;
    }
}

function renderDiagnostics(report) {
    const health = document.getElementById?.('diagnostics-health');
    const summary = document.getElementById?.('diagnostics-summary');
    const plan = document.getElementById?.('diagnostics-plan');
    const connection = document.getElementById?.('diagnostics-connection');
    const artifact = document.getElementById?.('diagnostics-artifact');
    const runner = document.getElementById?.('diagnostics-runner');
    const log = document.getElementById?.('diagnostics-log');
    const retry = document.getElementById?.('diagnostics-retry-btn');
    const nudger = document.getElementById?.('diagnostics-nudger-btn');
    if (!report?.ok) {
        if (health) { health.textContent = 'Error'; health.className = 'health-badge error'; }
        if (summary) summary.textContent = report?.error || 'Diagnostics could not run.';
        return false;
    }
    const state = ['healthy', 'warning', 'error'].includes(report.overall) ? report.overall : 'warning';
    if (health) {
        health.textContent = state === 'healthy' ? 'Healthy' : (state === 'warning' ? 'Needs attention' : 'Error');
        health.className = `health-badge ${state}`;
    }
    if (summary) summary.textContent = report.recommendation || 'Diagnostics complete.';
    if (plan) plan.textContent = formatDiagnosticPlan(report);
    if (connection) connection.textContent = formatDiagnosticConnection(report);
    if (artifact) artifact.textContent = formatDiagnosticArtifact(report);
    if (runner) runner.textContent = formatDiagnosticRunner(report);
    if (log) {
        const events = Array.isArray(report.events) ? report.events : [];
        log.textContent = events.length ? events.slice().reverse().map(event => {
            const detail = event?.details && typeof event.details === 'object'
                ? Object.entries(event.details).map(([key, value]) => `${key}=${value}`).join(' ')
                : '';
            return `${event.at || ''} [${String(event.severity || 'info').toUpperCase()}] ${event.type || 'event'}${detail ? ` — ${detail}` : ''}`;
        }).join('\n') : 'No recovery events recorded yet.';
    }
    if (retry) retry.disabled = !['pending_send', 'blocked'].includes(report?.plan?.dispatchStatus || '');
    if (nudger) {
        const enabled = Boolean(report?.plan?.nextNudgerEnabled);
        nudger.textContent = enabled ? 'Disable 5-Minute Next' : 'Enable 5-Minute Next';
        nudger.disabled = !report?.plan || report?.plan?.dispatchStatus === 'complete' || preferences.nextNudgerFeatureEnabled === false;
    }
    return true;
}

async function loadDiagnostics() {
    const tabId = getDiagnosticTargetTabId();
    const status = document.getElementById?.('diagnostics-status');
    if (!Number.isInteger(tabId)) {
        renderDiagnostics({ ok: false, error: 'No ChatGPT/Claude conversation is selected.' });
        if (status) status.textContent = 'Select or open a conversation first.';
        return null;
    }
    if (status) status.textContent = 'Running diagnostics…';
    try {
        const report = await chrome.runtime.sendMessage({ action: 'GET_DIAGNOSTICS', tabId });
        renderDiagnostics(report);
        const [titanZero, repository, workforce] = await Promise.all([loadTitanZeroStatus(), loadRepositoryStatus(), loadWorkforceStatus()]);
        report.titanZero = titanZero;
        report.repository = repository;
        report.workforce = workforce;
        if (status) status.textContent = report?.ok ? `Checked tab ${tabId}.` : (report?.error || 'Diagnostics failed.');
        return report;
    } catch (error) {
        const report = { ok: false, error: error?.message || String(error) };
        renderDiagnostics(report);
        if (status) status.textContent = 'Could not reach the Titan Code worker.';
        return report;
    }
}

async function runDiagnosticRepair(repair = 'auto') {
    const tabId = getDiagnosticTargetTabId();
    const status = document.getElementById?.('diagnostics-status');
    if (!Number.isInteger(tabId)) {
        if (status) status.textContent = 'No conversation selected.';
        return null;
    }
    if (status) status.textContent = repair === 'auto' ? 'Repairing and reconciling…' : 'Running recovery action…';
    try {
        const response = await chrome.runtime.sendMessage({ action: 'RUN_DIAGNOSTIC_REPAIR', tabId, repair });
        if (response?.report) renderDiagnostics(response.report);
        if (status) status.textContent = response?.ok
            ? (repair === 'auto' ? 'Auto repair completed. Check the plan state above.' : 'Recovery action completed.')
            : (response?.error || response?.result?.error || 'Recovery action could not complete.');
        await loadState();
        if (currentTabId && activePlans.has(currentTabId)) updateUI();
        return response;
    } catch (error) {
        if (status) status.textContent = error?.message || 'Recovery action failed.';
        return null;
    }
}

async function toggleNextNudger() {
    const tabId = getDiagnosticTargetTabId();
    const status = document.getElementById?.('diagnostics-status');
    if (!Number.isInteger(tabId)) { if (status) status.textContent = 'No conversation selected.'; return null; }
    const current = await loadDiagnostics();
    if (!current?.ok || !current?.plan) return null;
    const enabled = !Boolean(current.plan.nextNudgerEnabled);
    try {
        const response = await chrome.runtime.sendMessage({ action:'SET_NEXT_NUDGER', tabId, enabled });
        if (status) status.textContent = response?.ok ? (enabled ? 'Five-minute next nudger enabled.' : 'Five-minute next nudger disabled.') : (response?.error || 'Could not change next nudger state.');
        await loadDiagnostics();
        await loadState();
        if (currentTabId && activePlans.has(currentTabId)) updateUI();
        return response;
    } catch (error) { if (status) status.textContent = error?.message || 'Could not change next nudger state.'; return null; }
}

function registerDiagnosticsHandlers() {
    document.getElementById?.('diagnostics-run-btn')?.addEventListener?.('click', loadDiagnostics);
    document.getElementById?.('diagnostics-copy-btn')?.addEventListener?.('click', copyAllDiagnostics);
    document.getElementById?.('diagnostics-repair-btn')?.addEventListener?.('click', () => runDiagnosticRepair('auto'));
    document.getElementById?.('diagnostics-rescan-btn')?.addEventListener?.('click', () => runDiagnosticRepair('rescan'));
    document.getElementById?.('diagnostics-retry-btn')?.addEventListener?.('click', () => runDiagnosticRepair('retry'));
    document.getElementById?.('diagnostics-alarm-btn')?.addEventListener?.('click', () => runDiagnosticRepair('alarm'));
    document.getElementById?.('diagnostics-nudger-btn')?.addEventListener?.('click', toggleNextNudger);
    document.getElementById?.('diagnostics-clear-btn')?.addEventListener?.('click', async () => {
        try {
            await chrome.runtime.sendMessage({ action: 'CLEAR_DIAGNOSTICS' });
            await loadDiagnostics();
        } catch (_error) {}
    });
}

function getNextRunnerTargetTabId() {
    const raw = document.getElementById?.('tab-select')?.value;
    if (raw === '' || raw === null || raw === undefined) return null;
    const selected = Number(raw);
    return Number.isInteger(selected) && selected >= 0 ? selected : null;
}

function readNextRunnerMinutes() {
    const input = document.getElementById?.('next-runner-minutes');
    const value = Number(input?.value);
    const minutes = Number.isFinite(value) ? Math.max(1, Math.min(1440, Math.round(value * 10) / 10)) : 5;
    if (input) input.value = String(minutes);
    return minutes;
}

function formatNextRunnerDue(timestamp) {
    if (!timestamp) return '';
    try { return new Date(timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' }); }
    catch { return ''; }
}

function renderNextRunnerStatus(response) {
    const badge = document.getElementById?.('next-runner-badge');
    const status = document.getElementById?.('next-runner-status');
    const input = document.getElementById?.('next-runner-minutes');
    const stop = document.getElementById?.('next-runner-stop-btn');
    if (!response?.ok) {
        if (badge) { badge.textContent = 'Unavailable'; badge.className = 'health-badge warning'; }
        if (status) status.textContent = response?.error || 'Next Runner is unavailable.';
        return;
    }
    if (input && Number(response.intervalMinutes) > 0) input.value = String(response.intervalMinutes);
    if (badge) {
        const degraded = response.enabled && response.healthState === 'degraded';
        badge.textContent = degraded ? 'Degraded' : (response.enabled ? 'Running' : 'Stopped');
        badge.className = `health-badge ${degraded ? 'warning' : (response.enabled ? 'healthy' : 'neutral')}`;
    }
    if (stop) stop.disabled = !response.enabled;
    if (status) {
        const due = response.enabled && response.nextDueAt ? ` Next: ${formatNextRunnerDue(response.nextDueAt)}.` : '';
        const sent = Number(response.sentCount) || 0;
        const deferred = Number(response.deferredCount) || 0;
        const failed = Number(response.failedCount) || 0;
        const attempts = Number(response.attemptCount) || 0;
        const segments = [];
        if (deferred) segments.push(`${deferred} safely deferred`);
        if (failed) segments.push(`${failed} failed`);
        const progress = ` Next count: ${sent}${attempts ? ` verified / ${attempts} attempts` : ''}${segments.length ? ` · ${segments.join(' · ')}` : ''}.`;
        const lastReason = response.lastDiagnostic?.reason || response.lastResult || '';
        const lastOutcome = response.lastDiagnostic?.outcome || response.lastOutcome || '';
        const last = lastReason ? ` Last: ${lastOutcome ? `${lastOutcome} — ` : ''}${lastReason}.` : '';
        const target = response.target?.title || response.target?.conversationIdentity || '';
        const bound = target ? ` Bound to: ${target}.` : '';
        status.textContent = response.enabled ? `Repeating every ${response.intervalMinutes} minute${Number(response.intervalMinutes) === 1 ? '' : 's'}.${progress}${due}${bound}${last}` : `Timer is stopped.${progress}${bound}${last}`;
    }
}

async function refreshNextRunnerStatus() {
    const tabId = getNextRunnerTargetTabId();
    if (!Number.isInteger(tabId)) { renderNextRunnerStatus({ ok:false, error:'Select a ChatGPT or Claude conversation first.' }); return null; }
    try {
        const response = await chrome.runtime.sendMessage({ action:'GET_NEXT_RUNNER', tabId });
        renderNextRunnerStatus(response);
        return response;
    } catch (error) { renderNextRunnerStatus({ ok:false, error:error?.message || String(error) }); return null; }
}

async function startNextRunnerFromUI() {
    const tabId = getNextRunnerTargetTabId();
    if (!Number.isInteger(tabId)) { renderNextRunnerStatus({ ok:false, error:'Select a ChatGPT or Claude conversation first.' }); return; }
    const minutes = readNextRunnerMinutes();
    const status = document.getElementById?.('next-runner-status');
    if (status) status.textContent = 'Sending next now…';
    try {
        const response = await chrome.runtime.sendMessage({ action:'START_NEXT_RUNNER', tabId, intervalMinutes:minutes });
        renderNextRunnerStatus(response);
        if (response?.enabled) { adoptNextRunnerStatus({ ...response, tabId }); updateTabsList(); }
        if (status && response?.ok && response?.enabled) {
            const immediate = response.immediate || {};
            const first = immediate.sent
                ? 'Sent “next” now.'
                : `Immediate send deferred${immediate.reason ? ` (${immediate.reason})` : ''}; timer is running and retrying.`;
            const sent = Number(response.sentCount) || 0;
            const attempts = Number(response.attemptCount) || 0;
            const deferred = Number(response.deferredCount) || 0;
            const failed = Number(response.failedCount) || 0;
            status.textContent = `${first} Next count: ${sent} verified / ${attempts} attempts${deferred ? ` · ${deferred} safely deferred` : ''}${failed ? ` · ${failed} failed` : ''}. Repeating every ${response.intervalMinutes} minutes. Next: ${formatNextRunnerDue(response.nextDueAt)}.`;
        }
    } catch (error) { renderNextRunnerStatus({ ok:false, error:error?.message || String(error) }); }
}

async function applyNextRunnerIntervalFromUI() {
    const tabId = getNextRunnerTargetTabId();
    if (!Number.isInteger(tabId)) { renderNextRunnerStatus({ ok:false, error:'Select a ChatGPT or Claude conversation first.' }); return; }
    try {
        const response = await chrome.runtime.sendMessage({ action:'UPDATE_NEXT_RUNNER_INTERVAL', tabId, intervalMinutes:readNextRunnerMinutes() });
        renderNextRunnerStatus(response);
        if (response?.ok) { adoptNextRunnerStatus({ ...response, tabId, target:activeNextRunners.get(tabId)?.target }); updateTabsList(); }
        const status = document.getElementById?.('next-runner-status');
        if (status && response?.ok) status.textContent = response.enabled
            ? `Timer changed to every ${response.intervalMinutes} minutes. Next: ${formatNextRunnerDue(response.nextDueAt)}.`
            : `Timer saved as ${response.intervalMinutes} minutes. Press Start + Send Next when ready.`;
    } catch (error) { renderNextRunnerStatus({ ok:false, error:error?.message || String(error) }); }
}

async function stopNextRunnerFromUI() {
    const tabId = getNextRunnerTargetTabId();
    if (!Number.isInteger(tabId)) return;
    try {
        const response = await chrome.runtime.sendMessage({ action:'STOP_NEXT_RUNNER', tabId });
        renderNextRunnerStatus(response);
        if (response?.ok) { adoptNextRunnerStatus({ ...response, tabId }); updateTabsList(); }
    }
    catch (error) { renderNextRunnerStatus({ ok:false, error:error?.message || String(error) }); }
}

function registerNextRunnerHandlers() {
    document.getElementById?.('next-runner-start-btn')?.addEventListener?.('click', startNextRunnerFromUI);
    document.getElementById?.('next-runner-apply-btn')?.addEventListener?.('click', applyNextRunnerIntervalFromUI);
    document.getElementById?.('next-runner-stop-btn')?.addEventListener?.('click', stopNextRunnerFromUI);
    document.getElementById?.('tab-select')?.addEventListener?.('change', () => refreshNextRunnerStatus().catch(() => {}));
}

function registerFileImportHandlers() {
    const input = document.getElementById('plan-file-input');
    const chooseButton = document.getElementById('choose-plan-file-btn');
    const dropZone = document.getElementById('plan-file-drop');

    chooseButton.addEventListener('click', event => {
        event.stopPropagation();
        input.click();
    });

    dropZone.addEventListener('click', event => {
        if (event.target !== chooseButton) input.click();
    });

    dropZone.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            input.click();
        }
    });

    input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (file) await loadPlanFile(file);
    });

    ['dragenter', 'dragover'].forEach(type => {
        dropZone.addEventListener(type, event => {
            event.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(type => {
        dropZone.addEventListener(type, event => {
            event.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', async event => {
        const file = event.dataTransfer?.files?.[0];
        if (file) await loadPlanFile(file);
    });
}

function registerTabListeners() {
    chrome.tabs.onActivated.addListener(() => {
        refreshTargetList({ preferActive: true });
    });

    chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
        if (changeInfo.title !== undefined || changeInfo.url !== undefined) {
            refreshTargetList({ preferActive: false });
        }
    });

    chrome.tabs.onRemoved.addListener(tabId => {
        tabMetadata.delete(tabId);
        refreshTargetList({ preferActive: false });
    });
}

function adoptPlanStateUpdate(plans, visibleTabId, tabId, planState) {
    let nextVisibleTabId = visibleTabId;
    if (!isRenderablePlanState(planState) || !planState.planId) return { currentTabId: nextVisibleTabId };

    for (const [existingTabId, existingPlan] of Array.from(plans.entries())) {
        if (existingTabId === tabId) continue;
        if (existingPlan?.planId !== planState.planId) continue;
        plans.delete(existingTabId);
        if (nextVisibleTabId === existingTabId) nextVisibleTabId = tabId;
    }
    plans.set(tabId, planState);
    return { currentTabId: nextVisibleTabId };
}

// Listen for state updates from service worker.
chrome.runtime.onMessage.addListener((message) => {
    if (!message || typeof message !== 'object') return;

    if (message.action === 'UPDATE_UI') {
        const tabId = message.tabId;
        if (message.planState) {
            const adopted = adoptPlanStateUpdate(activePlans, currentTabId, tabId, message.planState);
            currentTabId = adopted.currentTabId;
        } else if (activePlans.has(tabId)) {
            const planState = activePlans.get(tabId);
            planState.stepIndex = message.stepIndex;
            planState.versions = message.versions || [];
            if (message.dispatchStatus) planState.dispatchStatus = message.dispatchStatus;
            activePlans.set(tabId, planState);
        }

        if (activePlans.has(tabId)) {
            if (activePage === 'dashboard') setTimeout(() => loadDashboardStatus({ force: true }).catch(() => {}), 100);
        if (activePage === 'diagnostics') setTimeout(() => loadDiagnostics(), 100);
            if (tabId === currentTabId) {
                updateUI();
                document.getElementById('status-text').textContent = message.status;
            }
            updateTabsList();
        }
    }

    if (message.action === 'NEXT_RUNNER_UPDATED') {
        adoptNextRunnerStatus(message.status || { tabId:message.tabId, enabled:false });
        updateTabsList();
        if (activePage === 'dashboard') setTimeout(() => loadDashboardStatus({ force:true }).catch(() => {}), 100);
        if (Number(message.tabId) === Number(getNextRunnerTargetTabId())) refreshNextRunnerStatus().catch(() => {});
    }

    if (message.action === 'PLAN_COMPLETE') {
        const tabId = message.tabId;
        if (message.planState) {
            const adopted = adoptPlanStateUpdate(activePlans, currentTabId, tabId, message.planState);
            currentTabId = adopted.currentTabId;
        }
        if (tabId === currentTabId) {
            updateUI();
            document.getElementById('status-text').textContent = 'Complete!';
            setMessage('All plan steps are complete.');
        }
        updateTabsList();
        if (activePage === 'diagnostics') setTimeout(() => loadDiagnostics(), 100);
    }
});

let sidebarBootStarted = false;
let sidebarBootCompleted = false;

function registerCriticalRunnerHandlers() {
    const bindings = [
        ['confirm-btn', 'click', confirmPlan],
        ['generate-debugging-plan-btn', 'click', generateDebuggingPlan],
        ['stop-btn', 'click', stopCurrentPlan],
        ['back-btn', 'click', hidePlanDetails],
        ['refresh-tabs-btn', 'click', () => refreshTargetList({ preferActive: true })],
        ['tab-select', 'change', updateTargetSummary]
    ];
    for (const [id, eventName, handler] of bindings) {
        const element = document.getElementById?.(id);
        if (!element || element.dataset?.codeeBound === '1') continue;
        element.addEventListener(eventName, handler);
        if (element.dataset) element.dataset.codeeBound = '1';
    }
    const mode = document.getElementById?.('debugging-plan-mode');
    if (mode && mode.dataset?.codeeBound !== '1') {
        mode.addEventListener('change', event => { if (event?.currentTarget?.dataset) event.currentTarget.dataset.userChanged = 'true'; });
        if (mode.dataset) mode.dataset.codeeBound = '1';
    }
}

function safelyRegisterSidebarSubsystem(name, registrar) {
    try {
        registrar?.();
        return true;
    } catch (error) {
        console.error(`[Codee] ${name} UI registration failed:`, error);
        return false;
    }
}

async function bootstrapSidebar() {
    if (sidebarBootStarted) return;
    sidebarBootStarted = true;

    // Runner and planner controls are safety-critical and must not depend on any
    // optional dashboard/intelligence subsystem completing initialization.
    registerCriticalRunnerHandlers();

    safelyRegisterSidebarSubsystem('navigation', registerNavigationHandlers);
    document.getElementById('browser-refresh')?.addEventListener('click',()=>loadBrowserWorkspace({force:true}).catch(error=>workspaceSetText('browser-runtime-status',error?.message||String(error))));
    safelyRegisterSidebarSubsystem('workspace pages', registerWorkspacePageHandlers);
    safelyRegisterSidebarSubsystem('dashboard', registerDashboardHandlers);
    safelyRegisterSidebarSubsystem('connections', registerConnectionsHandlers);
    safelyRegisterSidebarSubsystem('MCP inspector', registerMcpInspectorHandlers);
    safelyRegisterSidebarSubsystem('settings', registerSettingsHandlers);
    safelyRegisterSidebarSubsystem('diagnostics', registerDiagnosticsHandlers);
    safelyRegisterSidebarSubsystem('Next Runner', registerNextRunnerHandlers);
    safelyRegisterSidebarSubsystem('plan requirements', registerPlanRequirementHandlers);
    safelyRegisterSidebarSubsystem('production preflight', registerProductionPreflightHandlers);
    safelyRegisterSidebarSubsystem('AI workforce', registerWorkforceHandlers);
    safelyRegisterSidebarSubsystem('libraries', registerLibraryHandlers);
    safelyRegisterSidebarSubsystem('capability registry', registerCapabilityRegistryHandlers);
    safelyRegisterSidebarSubsystem('file import', registerFileImportHandlers);
    safelyRegisterSidebarSubsystem('tab listeners', registerTabListeners);

    refreshNextRunnerStatus().catch(error => console.warn('[Titan Code] Next Runner status unavailable:', error));

    try {
        await loadNavigationRegistry();
    } catch (error) {
        console.error('[Titan Code] Navigation registry failed to load:', error);
    }

    try {
        await loadPreferences();
    } catch (error) {
        console.error('[Titan Code] Preferences failed to load:', error);
    }

    const initialPage = preferences.rememberLastPage ? preferences.lastPage : 'dashboard';
    try {
        setActivePage(initialPage);
    } catch (error) {
        console.error('[Titan Code] Could not restore initial page:', error);
        try { setActivePage('runner'); } catch (_) {}
    }

    try {
        await loadState();
    } catch (error) {
        console.error('[Titan Code] Plan state failed to load:', error);
        setMessage('Titan Code could not restore saved plan state, but the Planner and Start Plan controls remain available.');
    }

    try {
        await refreshTargetList({ preferActive: true });
    } catch (error) {
        console.error('[Titan Code] Conversation target refresh failed:', error);
    }

    await loadCapabilityLibraries().catch(error => console.warn('[Titan Code] Capability libraries unavailable:', error));
    sidebarBootCompleted = true;
}

// Side panels can survive extension/service-worker reloads. Do not rely on a
// single DOMContentLoaded timing edge: boot immediately when the document is
// already interactive/complete, otherwise wait for DOMContentLoaded once.
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    bootstrapSidebar().catch(error => console.error('[Titan Code] Sidebar bootstrap failed:', error));
} else {
    document.addEventListener('DOMContentLoaded', () => { bootstrapSidebar().catch(error => console.error('[Titan Code] Sidebar bootstrap failed:', error)); }, { once: true });
}

// Titan MCP 1.5 connection, client-contract, approval and receipt surface.
let selectedMcpConnectionId = '';
let codeeMcpClientOrigin = '';
function mcpStatus(text, isError = false) {
    const el = document.getElementById?.('mcp-status');
    if (!el) return;
    el.textContent = String(text || '');
    el.classList.toggle('error', isError === true);
}
function mcpButton(label, attrs = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = attrs.primary ? 'btn btn-primary' : 'btn btn-secondary';
    button.textContent = String(label || '');
    for (const [key, value] of Object.entries(attrs.data || {})) button.dataset[key] = String(value || '');
    return button;
}
function addMcpLine(host, strongText, smallText) {
    const wrapper = document.createElement('div');
    const strong = document.createElement('strong'); strong.textContent = String(strongText || ''); wrapper.appendChild(strong);
    if (smallText) { wrapper.appendChild(document.createElement('br')); const small = document.createElement('small'); small.textContent = String(smallText); wrapper.appendChild(small); }
    host.appendChild(wrapper); return wrapper;
}
function titanToolPolicy(tool) {
    const policy = tool?._meta?.['io.titanzero/tool-policy'];
    return policy?.schema === 'titan-mcp-tool-policy/1' ? policy : null;
}
function approvalDetailSummary(details) {
    if (!details || typeof details !== 'object') return '';
    const chunks = [];
    if (details.path) chunks.push(`path=${details.path}`);
    if (details.command) chunks.push(`command=${details.command}`);
    if (details.contentBytes != null) chunks.push(`bytes=${details.contentBytes}`);
    if (details.contentSha256) chunks.push(`contentSha256=${details.contentSha256}`);
    if (details.sqlSha256) chunks.push(`sqlSha256=${details.sqlSha256}`);
    if (details.sqlPreview) chunks.push(`SQL preview=${details.sqlPreview}`);
    if (details.contentPreview) chunks.push(`preview=${details.contentPreview}`);
    if (Array.isArray(details.files)) chunks.push(`files=${details.files.map(f => `${f.path}:${f.contentSha256 || '?'}`).join(', ')}`);
    return chunks.join(' · ').slice(0, 6000);
}
async function loadMcpReceipts() {
    const host = document.getElementById?.('mcp-receipts-list');
    if (!host) return;
    const response = await chrome.runtime.sendMessage({ action:'GET_MCP_RECEIPTS' });
    if (!response?.ok) { host.textContent = response?.error || 'Unable to load MCP receipts.'; return; }
    const rows = Array.isArray(response.receipts) ? response.receipts : [];
    host.replaceChildren();
    if (!rows.length) { host.textContent = 'No mutation receipts.'; return; }
    for (const receipt of rows.slice(0, 30)) {
        const evidence = [receipt.verificationLevel || 'unclassified', receipt.serverCommitted ? 'server committed' : '', (receipt.backupDomains || []).join('+')].filter(Boolean).join(' · ');
        addMcpLine(host, `${receipt.tool || 'Titan mutation'} · ${receipt.verified ? 'verified' : 'not verified'}`, `${receipt.ticketId || receipt.id || ''}${evidence ? ` · ${evidence}` : ''}`);
    }
}
async function loadMcpConnections() {
    const list = document.getElementById?.('mcp-connections-list');
    const response = await chrome.runtime.sendMessage({ action: 'GET_MCP_CONNECTIONS' });
    if (!response?.ok) { if (list) list.textContent = response?.error || 'Unable to load MCP connections.'; return; }
    const connections = Array.isArray(response.connections) ? response.connections : [];
    if (!selectedMcpConnectionId && connections[0]) selectedMcpConnectionId = connections[0].id;
    if (selectedMcpConnectionId && !connections.some(c => c.id === selectedMcpConnectionId)) selectedMcpConnectionId = connections[0]?.id || '';
    codeeMcpClientOrigin = String(response.client?.chromeOrigin || '');
    const origin = document.getElementById?.('mcp-client-origin'); if (origin) origin.textContent = codeeMcpClientOrigin || 'Unavailable';
    if (list) {
        list.replaceChildren();
        if (!connections.length) list.textContent = 'No Titan MCP connections saved.';
        for (const c of connections) {
            const selected = c.id === selectedMcpConnectionId;
            const button = mcpButton(`${selected ? '● ' : ''}${c.name || 'Titan MCP'}`, { data: { mcpId: c.id } });
            const small = document.createElement('small'); small.textContent = `${c.baseUrl || ''} · ${c.id || ''} · ${c.tokenConfigured ? 'token ready' : 'token missing'}`; button.appendChild(document.createElement('br')); button.appendChild(small);
            button.addEventListener('click', () => { selectedMcpConnectionId = c.id || ''; mcpStatus(`Selected ${selectedMcpConnectionId}`); loadMcpConnections().catch(()=>{}); });
            list.appendChild(button);
        }
    }
    renderMcpApprovals(response.approvals || []);
    await loadMcpReceipts();
}
function renderMcpApprovals(approvals) {
    const host = document.getElementById?.('mcp-approvals-list'); if (!host) return;
    const rows = Array.isArray(approvals) ? approvals : [];
    host.replaceChildren();
    if (!rows.length) { host.textContent = 'No pending approvals.'; return; }
    for (const a of rows) {
        const row = document.createElement('div'); row.className = 'mcp-approval-row'; row.dataset.approvalId = String(a.approvalId || '');
        const scope = `${a.classification || 'WRITE'} · ${(a.targets || []).join(', ') || a.reason || 'Mutation request'}`;
        addMcpLine(row, a.name || 'MCP mutation', scope);
        if (a.ticketId) addMcpLine(row, 'Prepared Titan ticket', `${a.ticketId} · argumentsSha256=${a.argumentsSha256 || 'unknown'} · exactBound=${a.exactArgumentsBound === true ? 'yes' : 'no'}`);
        if (Array.isArray(a.backupDomains) && a.backupDomains.length) addMcpLine(row, 'Verified recovery coverage', `${a.backupDomains.join(', ')} · backups=${(a.backupIds || []).join(', ') || 'server evidence'}`);
        const detail = approvalDetailSummary(a.details); if (detail) addMcpLine(row, 'Material mutation', detail);
        const approve = mcpButton('Approve once', { primary: true, data: { mcpApprove: a.approvalId } });
        const deny = mcpButton('Deny', { data: { mcpDeny: a.approvalId } });
        approve.addEventListener('click', async () => { const r = await chrome.runtime.sendMessage({ action:'MCP_MUTATION_APPROVE', approvalId:a.approvalId }); mcpStatus(r?.ok ? 'Mutation approved for one retry. The sealed Titan ticket will be committed on retry.' : (r?.error || 'Approval failed'), !r?.ok); await loadMcpConnections(); });
        deny.addEventListener('click', async () => { const r = await chrome.runtime.sendMessage({ action:'MCP_MUTATION_DENY', approvalId:a.approvalId }); mcpStatus(r?.ok ? 'Mutation denied.' : (r?.error || 'Deny failed'), !r?.ok); await loadMcpConnections(); });
        row.appendChild(document.createElement('br')); row.appendChild(approve); row.appendChild(document.createTextNode(' ')); row.appendChild(deny); host.appendChild(row);
    }
}
function renderMcpTools(discovery) {
    const host = document.getElementById?.('mcp-tools-list'); if (!host) return;
    const tools = Array.isArray(discovery?.tools) ? discovery.tools : [];
    host.replaceChildren();
    if (!tools.length) { host.textContent = 'No tools returned by this Titan MCP connection.'; return; }
    addMcpLine(host, `${discovery.serverInfo?.name || 'Titan MCP'} ${discovery.serverInfo?.version || ''}`, `${tools.length} tools · ${discovery.twoPhaseMutationTickets ? 'two-phase mutation tickets active' : 'legacy direct mutation backup mode'}${discovery.contractHash ? ` · contract=${discovery.contractHash}` : ''}`);
    for (const tool of tools) {
        const policy = titanToolPolicy(tool); const classification = policy?.classification || (tool.annotations?.readOnlyHint ? 'READ' : (tool.annotations?.destructiveHint ? 'DESTRUCTIVE' : 'UNCLASSIFIED'));
        const backup = Array.isArray(policy?.backup_domains) && policy.backup_domains.length ? ` · backup=${policy.backup_domains.join('+')}` : '';
        const flow = policy?.preferred_mutation_flow ? ` · flow=${policy.preferred_mutation_flow}` : '';
        addMcpLine(host, `${classification} · ${tool.name || 'unnamed tool'}`, `${tool.description || ''}${flow}${backup}`);
    }
}
async function saveMcpConnectionFromForm() {
    const name = document.getElementById?.('mcp-connection-name')?.value || 'Titan Zero';
    const baseUrl = document.getElementById?.('mcp-connection-url')?.value || '';
    const token = document.getElementById?.('mcp-connection-token')?.value || '';
    mcpStatus('Saving Titan MCP connection…');
    const response = await chrome.runtime.sendMessage({ action:'SAVE_MCP_CONNECTION', connection:{ name, baseUrl, token, enabled:true } });
    if (!response?.ok) return mcpStatus(response?.error || 'Could not save connection.', true);
    selectedMcpConnectionId = response.connection?.id || selectedMcpConnectionId;
    const tokenInput = document.getElementById?.('mcp-connection-token'); if (tokenInput) tokenInput.value = '';
    mcpStatus(`Saved ${response.connection?.name || 'Titan MCP'}.`); await loadMcpConnections();
}
async function testSelectedMcpConnection() {
    if (!selectedMcpConnectionId) return mcpStatus('Select or save a Titan MCP connection first.', true);
    mcpStatus('Testing Titan MCP…');
    const response = await chrome.runtime.sendMessage({ action:'TEST_MCP_CONNECTION', connectionId:selectedMcpConnectionId });
    if (!response?.ok) return mcpStatus(response?.error || 'Titan MCP health check failed.', true);
    mcpStatus(`Healthy: ${response.serverInfo?.name || 'Titan MCP'} ${response.serverInfo?.version || ''} · tools=${response.toolCount ?? '?'} · protocol=${response.protocolVersion || '?'} · ${response.twoPhaseMutationTickets ? 'two-phase tickets ready' : 'legacy mutation mode'}`);
}
async function discoverSelectedMcpConnection() {
    if (!selectedMcpConnectionId) return mcpStatus('Select a Titan MCP connection first.', true);
    mcpStatus('Discovering Titan MCP tools…');
    const response = await chrome.runtime.sendMessage({ action:'MCP_DISCOVER', connectionId:selectedMcpConnectionId, force:true });
    if (!response?.ok) return mcpStatus(response?.error || 'Titan MCP discovery failed.', true);
    renderMcpTools(response.discovery); mcpStatus(`Discovered ${response.discovery?.tools?.length || 0} Titan MCP tools.`);
}
async function removeSelectedMcpConnection() {
    if (!selectedMcpConnectionId) return mcpStatus('Select a Titan MCP connection first.', true);
    const id = selectedMcpConnectionId;
    const response = await chrome.runtime.sendMessage({ action:'REMOVE_MCP_CONNECTION', connectionId:id });
    if (!response?.ok) return mcpStatus(response?.error || 'Could not remove MCP connection.', true);
    selectedMcpConnectionId = ''; const tools = document.getElementById?.('mcp-tools-list'); if (tools) tools.textContent = 'Connection removed.';
    mcpStatus(`Removed ${id}.`); await loadMcpConnections();
}
async function copyMcpClientOrigin() {
    if (!codeeMcpClientOrigin) return mcpStatus('Chrome extension origin is unavailable.', true);
    if (!navigator.clipboard?.writeText) return mcpStatus(`Chrome origin: ${codeeMcpClientOrigin}`, true);
    await navigator.clipboard.writeText(codeeMcpClientOrigin); mcpStatus('Copied the Titan Code Chrome origin. Add it to Titan MCP trusted Chrome origins.');
}
function wireMcpSettingsUi() {
    document.getElementById?.('mcp-save-btn')?.addEventListener('click', () => saveMcpConnectionFromForm().catch(error => mcpStatus(error?.message || String(error), true)));
    document.getElementById?.('mcp-test-btn')?.addEventListener('click', () => testSelectedMcpConnection().catch(error => mcpStatus(error?.message || String(error), true)));
    document.getElementById?.('mcp-discover-btn')?.addEventListener('click', () => discoverSelectedMcpConnection().catch(error => mcpStatus(error?.message || String(error), true)));
    document.getElementById?.('mcp-remove-btn')?.addEventListener('click', () => removeSelectedMcpConnection().catch(error => mcpStatus(error?.message || String(error), true)));
    document.getElementById?.('mcp-copy-origin-btn')?.addEventListener('click', () => copyMcpClientOrigin().catch(error => mcpStatus(error?.message || String(error), true)));
    loadMcpConnections().catch(error => mcpStatus(error?.message || String(error), true));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireMcpSettingsUi, { once:true }); else wireMcpSettingsUi();
chrome.runtime?.onMessage?.addListener?.((message) => { if (message?.type === 'CODEE_MCP_APPROVAL_REQUIRED') loadMcpConnections().catch(()=>{}); });

function renderHostOperations(data){
    const summary=document.getElementById('host-ops-summary'); if(!summary)return;
    const repo=data?.repositoryHost||{}, artifact=data?.artifactHost||{};
    summary.textContent=`Repository Intelligence: ${data?.repositoryIntelligenceAvailable?'AVAILABLE':'UNAVAILABLE'} · Repository Mutation: ${repo.detected?'HOST DETECTED':'UNAVAILABLE'} · Artifact Verification: ${artifact.verifier?'AVAILABLE':'UNAVAILABLE'}`;
    const render=(id,rows)=>{const host=document.getElementById(id); if(!host)return; host.textContent=''; for(const [label,value] of rows){const row=document.createElement('div');row.className='mcp-inspector-row';const strong=document.createElement('strong');strong.textContent=label;row.append(strong,document.createTextNode(`: ${value}`));host.appendChild(row);}};
    render('repository-host-capabilities',Object.entries({Filesystem:repo.filesystem?'READY':'UNAVAILABLE','Command execution':repo.commandExecution?'READY':'UNAVAILABLE','Verified backups':repo.backupDomains?'READY':'UNAVAILABLE','Backup destination':repo.backupDestination||'not reported','Write verification':repo.writeVerification?'READY':'UNAVAILABLE','Rollback capability':repo.rollbackCapability?'READY':'UNAVAILABLE','Last mutation':repo.lastMutation?JSON.stringify(repo.lastMutation).slice(0,700):'none reported'}));
    render('artifact-host-capabilities',Object.entries({'Verifier status':artifact.verifier?'READY':'UNAVAILABLE','Byte verification':'SUPPORTED','SHA-256 verification':'SUPPORTED','Size verification':'SUPPORTED','ZIP integrity':'SUPPORTED','Content manifest':'SUPPORTED'}));
    render('artifact-host-receipt',[['Receipt',artifact.lastReceipt?JSON.stringify(artifact.lastReceipt).slice(0,1200):'No accepted independent receipt yet']]);
    render('host-ops-held-plans',[['Plans held for artifact/blocked state',data?.heldPlans?.length?data.heldPlans.map(x=>`${x.planId||'plan'} / ${x.stepId||'step'} (${x.state})`).join('; '):'None']]);
}
async function loadHostOperations(){const status=document.getElementById('host-ops-status');if(status)status.textContent='Refreshing host readiness…';try{const r=await chrome.runtime.sendMessage({action:'GET_HOST_OPERATIONS'});if(!r?.ok)throw new Error(r?.error||'Host operations unavailable');renderHostOperations(r.operations);if(status)status.textContent=`Last refreshed ${new Date().toLocaleTimeString()}`;}catch(e){if(status)status.textContent=String(e?.message||e);}}
document.getElementById?.('host-ops-refresh-btn')?.addEventListener?.('click',()=>loadHostOperations());
