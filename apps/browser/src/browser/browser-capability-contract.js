(function attachCodeeBrowserCapabilityContract(global) {
    'use strict';

    const PACK_ID = 'codee-browser-control-engine';
    const CONTRACT_VERSION = '1.0.0';
    const OWNER = 'browser-control-engine';

    const BASE_AUTHORITY = Object.freeze({
        mayAdvancePlan: false,
        mayCompletePlan: false,
        maySkipPlan: false,
        mayMutateRepository: false,
        mayMutateServer: false,
        implementsMcpRuntime: false
    });

    const OBJECT_SCHEMA = Object.freeze({ type: 'object', additionalProperties: false, properties: {} });
    const RESULT_SCHEMA = Object.freeze({ type: 'object', additionalProperties: true, properties: { ok: { type: 'boolean' } } });

    function objectSchema(properties = {}, required = []) {
        return { type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) };
    }

    const scalar = Object.freeze({
        tabId: { type: 'integer', minimum: 0 },
        ref: { type: 'string', minLength: 1, maxLength: 256 },
        text: { type: 'string', maxLength: 200000 },
        url: { type: 'string', minLength: 1, maxLength: 8192 },
        timeoutMs: { type: 'integer', minimum: 100, maximum: 120000 },
        snapshotRevision: { type: 'integer', minimum: 0 }
    });

    function descriptor(id, title, options = {}) {
        const operationClass = options.operationClass || 'READ';
        return {
            id,
            pack: PACK_ID,
            contractVersion: CONTRACT_VERSION,
            title,
            description: String(options.description || ''),
            permissionClass: options.permissionClass || 'page_read',
            operationClass,
            readOnly: operationClass === 'READ',
            audit: options.audit || 'action',
            risk: options.risk || 'low',
            timeoutMs: Number(options.timeoutMs || 15000),
            requiredChromePermissions: Array.isArray(options.requiredChromePermissions) ? [...options.requiredChromePermissions] : [],
            requiredHostAccess: options.requiredHostAccess || 'connected-tab-only',
            inputSchema: options.inputSchema || OBJECT_SCHEMA,
            outputSchema: options.outputSchema || RESULT_SCHEMA,
            implementation: {
                status: ['browser.click','browser.double_click','browser.hover','browser.focus','browser.type','browser.insert_text','browser.clear','browser.press_key','browser.select','browser.scroll','browser.drag','browser.fill_form','browser.console.latest','browser.console.errors','browser.console.clear','browser.network.list','browser.network.errors','browser.network.request','browser.network.response_body','browser.snapshot','browser.page_markdown','browser.find','browser.text','browser.navigate','browser.back','browser.forward','browser.reload'].includes(id) ? 'implemented' : 'contract_only',
                owner: OWNER,
                provider: 'titan-code-browser-runtime',
                donor: 'none'
            },
            authority: { ...BASE_AUTHORITY }
        };
    }

    const tab = objectSchema({ tabId: scalar.tabId }, ['tabId']);
    const tabRef = objectSchema({ tabId: scalar.tabId, ref: scalar.ref, snapshotRevision: scalar.snapshotRevision }, ['tabId', 'ref']);
    const tabTimeout = objectSchema({ tabId: scalar.tabId, timeoutMs: scalar.timeoutMs }, ['tabId']);

    const CAPABILITIES = [
        descriptor('browser.tabs', 'List browser tabs', { permissionClass: 'tab_metadata', audit: 'none', requiredChromePermissions: ['tabs'], inputSchema: OBJECT_SCHEMA }),
        descriptor('browser.connect', 'Connect Codee to a tab', { permissionClass: 'tab_session', operationClass: 'SESSION', audit: 'session', risk: 'medium', requiredChromePermissions: ['tabs', 'debugger'], inputSchema: tab }),
        descriptor('browser.disconnect', 'Disconnect Codee from a tab', { permissionClass: 'tab_session', operationClass: 'SESSION', audit: 'session', risk: 'low', requiredChromePermissions: ['tabs', 'debugger'], inputSchema: tab }),

        descriptor('browser.snapshot', 'Capture accessibility snapshot', { permissionClass: 'page_read', requiredChromePermissions: ['debugger'], inputSchema: tabTimeout, timeoutMs: 20000 }),
        descriptor('browser.page_markdown', 'Extract semantic page Markdown', { permissionClass: 'page_read', requiredChromePermissions: ['debugger'], inputSchema: tabTimeout, timeoutMs: 20000 }),
        descriptor('browser.find', 'Find page elements', { permissionClass: 'page_read', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, query: { type: 'string', minLength: 1, maxLength: 4000 }, limit: { type: 'integer', minimum: 1, maximum: 100 } }, ['tabId', 'query']) }),
        descriptor('browser.text', 'Read page or element text', { permissionClass: 'page_read', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, ref: scalar.ref, maxChars: { type: 'integer', minimum: 1, maximum: 200000 } }, ['tabId']) }),
        descriptor('browser.screenshot', 'Capture browser screenshot', { permissionClass: 'page_read', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, ref: scalar.ref, fullPage: { type: 'boolean' }, format: { type: 'string', enum: ['png', 'jpeg'] }, quality: { type: 'integer', minimum: 1, maximum: 100 } }, ['tabId']), timeoutMs: 30000 }),

        descriptor('browser.navigate', 'Navigate tab', { permissionClass: 'page_navigation', operationClass: 'NAVIGATE', audit: 'action', risk: 'medium', requiredChromePermissions: ['tabs'], inputSchema: objectSchema({ tabId: scalar.tabId, url: scalar.url, timeoutMs: scalar.timeoutMs }, ['tabId', 'url']), timeoutMs: 30000 }),
        descriptor('browser.back', 'Navigate back', { permissionClass: 'page_navigation', operationClass: 'NAVIGATE', audit: 'action', risk: 'medium', requiredChromePermissions: ['tabs'], inputSchema: tabTimeout, timeoutMs: 30000 }),
        descriptor('browser.forward', 'Navigate forward', { permissionClass: 'page_navigation', operationClass: 'NAVIGATE', audit: 'action', risk: 'medium', requiredChromePermissions: ['tabs'], inputSchema: tabTimeout, timeoutMs: 30000 }),
        descriptor('browser.reload', 'Reload tab', { permissionClass: 'page_navigation', operationClass: 'NAVIGATE', audit: 'action', risk: 'medium', requiredChromePermissions: ['tabs'], inputSchema: tabTimeout, timeoutMs: 30000 }),
        descriptor('browser.viewport.set', 'Set responsive viewport', { permissionClass: 'page_navigation', operationClass: 'NAVIGATE', audit: 'action', risk: 'low', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, width: { type: 'integer', minimum: 240, maximum: 7680 }, height: { type: 'integer', minimum: 240, maximum: 7680 }, deviceScaleFactor: { type: 'number', minimum: 0.25, maximum: 8 } }, ['tabId', 'width', 'height']) }),
        descriptor('browser.viewport.reset', 'Reset responsive viewport', { permissionClass: 'page_navigation', operationClass: 'NAVIGATE', audit: 'action', risk: 'low', requiredChromePermissions: ['debugger'], inputSchema: tab }),

        descriptor('browser.click', 'Click element', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'medium', requiredChromePermissions: ['debugger'], inputSchema: tabRef }),
        descriptor('browser.double_click', 'Double-click element', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'medium', requiredChromePermissions: ['debugger'], inputSchema: tabRef }),
        descriptor('browser.hover', 'Hover element', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'low', requiredChromePermissions: ['debugger'], inputSchema: tabRef }),
        descriptor('browser.focus', 'Focus element', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'low', requiredChromePermissions: ['debugger'], inputSchema: tabRef }),
        descriptor('browser.type', 'Type text into element', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'medium', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, ref: scalar.ref, text: scalar.text, clearFirst: { type: 'boolean' }, snapshotRevision: scalar.snapshotRevision }, ['tabId', 'ref', 'text']) }),
        descriptor('browser.insert_text', 'Insert text using browser input', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'medium', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, text: scalar.text }, ['tabId', 'text']) }),
        descriptor('browser.clear', 'Clear editable element', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'medium', requiredChromePermissions: ['debugger'], inputSchema: tabRef }),
        descriptor('browser.press_key', 'Press keyboard key', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'medium', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, key: { type: 'string', minLength: 1, maxLength: 100 }, modifiers: { type: 'array', maxItems: 4, items: { type: 'string', enum: ['Alt', 'Control', 'Meta', 'Shift'] } } }, ['tabId', 'key']) }),
        descriptor('browser.select', 'Select option', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'medium', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, ref: scalar.ref, values: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'string', maxLength: 4000 } } }, ['tabId', 'ref', 'values']) }),
        descriptor('browser.scroll', 'Scroll page or element', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'low', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, ref: scalar.ref, deltaX: { type: 'number', minimum: -100000, maximum: 100000 }, deltaY: { type: 'number', minimum: -100000, maximum: 100000 } }, ['tabId']) }),
        descriptor('browser.drag', 'Drag element', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'high', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, sourceRef: scalar.ref, targetRef: scalar.ref }, ['tabId', 'sourceRef', 'targetRef']) }),
        descriptor('browser.fill_form', 'Fill bounded form fields', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'high', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, fields: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'object' } } }, ['tabId', 'fields']) }),

        descriptor('browser.dialog.current', 'Read current browser dialog', { permissionClass: 'page_diagnostics', audit: 'none', requiredChromePermissions: ['debugger'], inputSchema: tab }),
        descriptor('browser.dialog.accept', 'Accept browser dialog', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'high', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, promptText: { type: 'string', maxLength: 10000 } }, ['tabId']) }),
        descriptor('browser.dialog.dismiss', 'Dismiss browser dialog', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'action', risk: 'medium', requiredChromePermissions: ['debugger'], inputSchema: tab }),

        descriptor('browser.console.latest', 'Read recent console events', { permissionClass: 'page_diagnostics', audit: 'none', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, limit: { type: 'integer', minimum: 1, maximum: 500 } }, ['tabId']) }),
        descriptor('browser.console.errors', 'Read console errors', { permissionClass: 'page_diagnostics', audit: 'none', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, limit: { type: 'integer', minimum: 1, maximum: 500 } }, ['tabId']) }),
        descriptor('browser.console.clear', 'Clear Codee console buffer', { permissionClass: 'page_diagnostics', operationClass: 'SESSION', audit: 'session', risk: 'low', requiredChromePermissions: [], inputSchema: tab }),

        descriptor('browser.network.list', 'List observed network requests', { permissionClass: 'page_diagnostics', audit: 'none', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, limit: { type: 'integer', minimum: 1, maximum: 1000 } }, ['tabId']) }),
        descriptor('browser.network.errors', 'Read failed network requests', { permissionClass: 'page_diagnostics', audit: 'none', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, limit: { type: 'integer', minimum: 1, maximum: 500 } }, ['tabId']) }),
        descriptor('browser.network.request', 'Read network request metadata', { permissionClass: 'page_diagnostics', audit: 'none', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, requestId: { type: 'string', minLength: 1, maxLength: 512 } }, ['tabId', 'requestId']) }),
        descriptor('browser.network.response_body', 'Read bounded network response body', { permissionClass: 'page_diagnostics', audit: 'action', risk: 'high', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, requestId: { type: 'string', minLength: 1, maxLength: 512 }, maxChars: { type: 'integer', minimum: 1, maximum: 200000 } }, ['tabId', 'requestId']) }),

        descriptor('browser.react_source', 'Trace element to React source', { permissionClass: 'page_diagnostics', audit: 'action', risk: 'medium', requiredChromePermissions: ['debugger'], inputSchema: tabRef, timeoutMs: 30000 }),
        descriptor('browser.styles', 'Inspect element styles', { permissionClass: 'page_diagnostics', audit: 'action', risk: 'medium', requiredChromePermissions: ['debugger'], inputSchema: tabRef, timeoutMs: 30000 }),
        descriptor('browser.compose', 'Execute validated browser action sequence', { permissionClass: 'page_interact', operationClass: 'INTERACT', audit: 'privileged', risk: 'high', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, actions: { type: 'array', minItems: 1, maxItems: 50, items: { type: 'object' } }, stopOnError: { type: 'boolean' }, timeoutMs: scalar.timeoutMs }, ['tabId', 'actions']), timeoutMs: 120000 }),
        descriptor('browser.evaluate', 'Evaluate developer JavaScript', { permissionClass: 'developer_execute', operationClass: 'EXECUTE', audit: 'privileged', risk: 'critical', requiredChromePermissions: ['debugger'], inputSchema: objectSchema({ tabId: scalar.tabId, expression: { type: 'string', minLength: 1, maxLength: 50000 }, timeoutMs: scalar.timeoutMs }, ['tabId', 'expression']), timeoutMs: 30000 })
    ];

    function deepFreeze(value, seen = new WeakSet()) {
        if (!value || typeof value !== 'object' || seen.has(value)) return value;
        seen.add(value);
        Object.values(value).forEach(item => deepFreeze(item, seen));
        return Object.freeze(value);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    const frozenCapabilities = deepFreeze(CAPABILITIES.map(item => deepFreeze(item)));
    const byId = new Map(frozenCapabilities.map(item => [item.id, item]));
    if (byId.size !== frozenCapabilities.length) throw new Error('Duplicate browser capability id in canonical contract');

    const ALLOWED_PERMISSION_CLASSES = new Set(['tab_metadata','tab_session','page_read','page_navigation','page_interact','page_diagnostics','developer_execute']);
    const ALLOWED_OPERATION_CLASSES = new Set(['READ','SESSION','INTERACT','NAVIGATE','EXECUTE']);
    const ALLOWED_AUDIT = new Set(['none','session','action','privileged']);
    const ALLOWED_RISK = new Set(['low','medium','high','critical']);

    function validateDescriptor(record) {
        if (!record || typeof record !== 'object') return { ok: false, reason: 'descriptor-required' };
        if (!/^browser\.[a-z0-9_.]+$/.test(String(record.id || ''))) return { ok: false, reason: 'id' };
        if (!ALLOWED_PERMISSION_CLASSES.has(record.permissionClass)) return { ok: false, reason: 'permission-class' };
        if (!ALLOWED_OPERATION_CLASSES.has(record.operationClass)) return { ok: false, reason: 'operation-class' };
        if (!ALLOWED_AUDIT.has(record.audit)) return { ok: false, reason: 'audit' };
        if (!ALLOWED_RISK.has(record.risk)) return { ok: false, reason: 'risk' };
        if (!Number.isInteger(record.timeoutMs) || record.timeoutMs < 1000 || record.timeoutMs > 120000) return { ok: false, reason: 'timeout' };
        if (!record.inputSchema || record.inputSchema.type !== 'object') return { ok: false, reason: 'input-schema' };
        if (!record.outputSchema || record.outputSchema.type !== 'object') return { ok: false, reason: 'output-schema' };
        if (!Array.isArray(record.requiredChromePermissions)) return { ok: false, reason: 'chrome-permissions' };
        if (!['contract_only','implemented'].includes(record.implementation?.status)) return { ok: false, reason: 'implementation-status' };
        return { ok: true };
    }

    for (const capability of frozenCapabilities) {
        const validation = validateDescriptor(capability);
        if (!validation.ok) throw new Error(`Invalid browser capability contract ${capability.id}: ${validation.reason}`);
    }

    global.CodeeBrowserCapabilityContract = Object.freeze({
        PACK_ID,
        CONTRACT_VERSION,
        list: () => frozenCapabilities.map(clone),
        get: id => byId.has(String(id || '')) ? clone(byId.get(String(id || ''))) : null,
        has: id => byId.has(String(id || '')),
        validateDescriptor,
        summary: () => ({
            packId: PACK_ID,
            contractVersion: CONTRACT_VERSION,
            count: frozenCapabilities.length,
            implemented: frozenCapabilities.filter(c => c.implementation.status === 'implemented').length,
            contractOnly: frozenCapabilities.filter(c => c.implementation.status !== 'implemented').length,
            executionEnabled: true,
            authority: { ...BASE_AUTHORITY }
        })
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
