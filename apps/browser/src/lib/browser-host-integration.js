(function attachCodeeBrowserHostIntegration(global) {
    'use strict';

    const PACK_ID = 'codee-browser-control-engine';

    function requireRuntime() {
        if (!global.CodeeCapabilityRegistry) throw new Error('Codee capability registry is unavailable');
        if (!global.CodeeBrowserCapabilityContract) throw new Error('Browser capability contract is unavailable');
    }

    function requirePolicyRuntime() {
        requireRuntime();
        if (!global.CodeeBrowserPolicy) throw new Error('Browser policy runtime is unavailable');
        if (!global.CodeeBrowserPolicyStore) throw new Error('Browser policy store is unavailable');
    }

    function register() {
        requireRuntime();
        const capabilities = global.CodeeBrowserCapabilityContract.list();
        for (const capability of capabilities) {
            const implemented = ['browser.tabs','browser.snapshot','browser.page_markdown','browser.find','browser.text','browser.navigate','browser.back','browser.forward','browser.reload','browser.click','browser.focus','browser.type','browser.insert_text','browser.clear','browser.press_key','browser.double_click','browser.hover','browser.select','browser.scroll','browser.drag','browser.fill_form','browser.console.latest','browser.console.errors','browser.console.clear','browser.network.list','browser.network.errors','browser.network.request','browser.network.response_body'].includes(capability.id);
            global.CodeeCapabilityRegistry.registerCapability(implemented ? { ...capability, implementation: { status: 'implemented', runtime: capability.id === 'browser.tabs' ? 'canonical-tab-registry' : (['browser.navigate','browser.back','browser.forward','browser.reload'].includes(capability.id) ? 'canonical-browser-navigation' : (['browser.click','browser.focus','browser.type','browser.insert_text','browser.clear','browser.press_key'].includes(capability.id) ? 'canonical-browser-interaction' : 'canonical-browser-perception')) } } : capability);
        }
        const implementedCount = capabilities.filter(capability => ['browser.tabs','browser.snapshot','browser.page_markdown','browser.find','browser.text','browser.navigate','browser.back','browser.forward','browser.reload','browser.click','browser.focus','browser.type','browser.insert_text','browser.clear','browser.press_key','browser.double_click','browser.hover','browser.select','browser.scroll','browser.drag','browser.fill_form','browser.console.latest','browser.console.errors','browser.console.clear','browser.network.list','browser.network.errors','browser.network.request','browser.network.response_body'].includes(capability.id)).length;
        return {
            registered: true,
            packId: PACK_ID,
            contractVersion: global.CodeeBrowserCapabilityContract.CONTRACT_VERSION,
            capabilities: capabilities.length,
            implemented: implementedCount,
            contractOnly: capabilities.length - implementedCount,
            executionEnabled: implementedCount > 0,
            policyImplemented: true
        };
    }

    function statusPayload() {
        requireRuntime();
        const capabilities = global.CodeeBrowserCapabilityContract.list();
        const registered = global.CodeeCapabilityRegistry.snapshot().capabilities.filter(item => item.pack === PACK_ID);
        return {
            registered: registered.length === capabilities.length,
            packId: PACK_ID,
            contractVersion: global.CodeeBrowserCapabilityContract.CONTRACT_VERSION,
            total: capabilities.length,
            registeredCount: registered.length,
            implemented: registered.filter(item => item.implementation?.status === 'implemented').length,
            contractOnly: registered.filter(item => item.implementation?.status === 'contract_only').length,
            executionEnabled: registered.some(item => item.implementation?.status === 'implemented'),
            manifestPermissionsActivated: true,
            policyImplemented: !!(global.CodeeBrowserPolicy && global.CodeeBrowserPolicyStore),
            policyStates: global.CodeeBrowserPolicy ? [...global.CodeeBrowserPolicy.STATES] : [],
            nextPass: 'browser-developer-inspection',
            authority: {
                mayAdvancePlan: false,
                mayMutateRepository: false,
                mayMutateServer: false,
                implementsMcpRuntime: false
            }
        };
    }

    async function policyStatusPayload() {
        requirePolicyRuntime();
        return global.CodeeBrowserPolicyStore.status();
    }

    async function connectPolicy(tab, options = {}) {
        requirePolicyRuntime();
        return global.CodeeBrowserPolicyStore.connect(tab, options);
    }

    async function grantPolicy(tab, grant, options = {}) {
        requirePolicyRuntime();
        return global.CodeeBrowserPolicyStore.grant(tab, grant, options);
    }

    async function revokePolicy(tabId, grant, options = {}) {
        requirePolicyRuntime();
        return global.CodeeBrowserPolicyStore.revoke(tabId, grant, options);
    }

    async function disconnectPolicy(tabId, options = {}) {
        requirePolicyRuntime();
        return global.CodeeBrowserPolicyStore.disconnect(tabId, options);
    }

    async function getTabPolicy(tabId) {
        requirePolicyRuntime();
        return global.CodeeBrowserPolicyStore.get(tabId);
    }

    async function authorizePolicy(capabilityId, tab) {
        requirePolicyRuntime();
        const capability = global.CodeeBrowserCapabilityContract.get(capabilityId);
        if (!capability) return { ok: false, reason: 'unknown-capability' };
        return global.CodeeBrowserPolicyStore.authorize(capabilityId, tab, capability);
    }

    async function audit(limit = 40) {
        requirePolicyRuntime();
        return global.CodeeBrowserPolicyStore.audit(limit);
    }

    global.CodeeBrowserHostIntegration = Object.freeze({
        PACK_ID,
        register,
        statusPayload,
        policyStatusPayload,
        connectPolicy,
        grantPolicy,
        revokePolicy,
        disconnectPolicy,
        getTabPolicy,
        authorizePolicy,
        audit
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
