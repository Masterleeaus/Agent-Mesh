// Content Script - Runs on ChatGPT/Claude pages
// Handles plan prompt delivery and ZIP detection inside one conversation tab.

const detectedVersions = new Set();
const detectedArtifactKeys = new Set();
const pendingArtifactKeys = new Set();
const pendingVersionKeys = new Set();
const submittedStepTokens = new Set();
const MAX_SUBMITTED_TOKENS = 100;
const MAX_DETECTED_ARTIFACT_KEYS = 1000;
const MAX_DETECTED_VERSIONS = 500;
let zipPollTimer = null;
let artifactObserver = null;
let artifactScanTimer = null;
let artifactScanInFlight = null;
let contextInvalidated = false;
const contentHealth = {
    loadedAt: Date.now(),
    scanCount: 0,
    lastScanAt: null,
    lastArtifactCount: 0,
    lastVersionCount: 0,
    lastError: '',
    lastRuntimeError: '',
    lastPromptAttemptAt: null,
    lastPromptAcceptedAt: null,
    lastPromptError: '',
    lastNudgeAttemptAt: null,
    lastNudgeAcceptedAt: null,
    lastNudgeError: ''
};


const provisionalConversationIds = Object.create(null);
function getProviderAdapterForUrl(url) {
    if (globalThis.CodeeProviderRegistry?.forUrl) return globalThis.CodeeProviderRegistry.forUrl(url);
    try {
        const host = new URL(String(url || '')).hostname.toLowerCase();
        if (host === 'chatgpt.com' || host.endsWith('.chatgpt.com')) return {
            id: 'chatgpt', composerSelectors: ['#prompt-textarea','[data-testid="prompt-textarea"]','textarea[name="prompt-textarea"]','[data-testid="composer-text-input"]'],
            submitSelectors: ['#composer-submit-button','button[data-testid="send-button"]','button[aria-label="Send prompt"]','button[aria-label*="Send" i]'],
            userMessageSelectors: ['[data-message-author-role="user"]']
        };
        if (host === 'claude.ai' || host.endsWith('.claude.ai')) return {
            id: 'claude', composerSelectors: ['[contenteditable="true"][data-lexical-editor="true"]','div[role="textbox"][contenteditable="true"]'],
            submitSelectors: ['button[aria-label*="Send" i]','button[data-testid*="send" i]'],
            userMessageSelectors: ['[data-testid*="user-message" i]','[data-is-user-message="true"]']
        };
    } catch (_error) {}
    return null;
}
function getProviderKeyForUrl(url) { return getProviderAdapterForUrl(url)?.id || ''; }
function getStructuredConversationIdentityForUrl(url) {
    if (globalThis.CodeeProviderRegistry?.structuredIdentity) return globalThis.CodeeProviderRegistry.structuredIdentity(url);
    try {
        const parsed = new URL(String(url || '')); const provider = getProviderKeyForUrl(parsed.href);
        if (provider === 'chatgpt') { const m=parsed.pathname.match(/^\/c\/([^/?#]+)/i); return m ? `chatgpt:${m[1]}` : ''; }
        if (provider === 'claude') { const m=parsed.pathname.match(/^\/chat\/([^/?#]+)/i); return m ? `claude:${m[1]}` : ''; }
    } catch (_error) {}
    return '';
}
function createProvisionalId() {
    try { if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID(); } catch (_error) {}
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}
function getStoredProvisionalConversationIdentity(provider) {
    if (!provider) return '';
    const id=String(provisionalConversationIds[provider] || '');
    return id ? `${provider}:page:new-chat:${id}` : '';
}
function getOrCreateProvisionalConversationIdentity(provider) {
    if (!provider) return '';
    const existing=getStoredProvisionalConversationIdentity(provider); if(existing)return existing;
    const id=createProvisionalId(); provisionalConversationIds[provider]=id; return `${provider}:page:new-chat:${id}`;
}
function getConversationIdentitySnapshot() {
    const url=String(globalThis.location?.href || ''); const provider=getProviderKeyForUrl(url);
    const structuredIdentity=getStructuredConversationIdentityForUrl(url);
    const provisionalIdentity=structuredIdentity ? getStoredProvisionalConversationIdentity(provider) : getOrCreateProvisionalConversationIdentity(provider);
    return {provider,structuredIdentity,provisionalIdentity,conversationIdentity:structuredIdentity || provisionalIdentity};
}

function isExtensionContextValid() {
    if (contextInvalidated) return false;

    try {
        return Boolean(chrome?.runtime?.id);
    } catch (_error) {
        return false;
    }
}

function isContextInvalidatedError(error) {
    return /Extension context invalidated/i.test(error?.message || String(error || ''));
}

function stopZIPPolling(reason) {
    contextInvalidated = true;

    if (zipPollTimer !== null) {
        clearInterval(zipPollTimer);
        zipPollTimer = null;
    }

    if (artifactScanTimer !== null) {
        clearTimeout(artifactScanTimer);
        artifactScanTimer = null;
    }

    if (artifactObserver) {
        artifactObserver.disconnect();
        artifactObserver = null;
    }

    contentHealth.lastError = String(reason || 'polling stopped');
    console.warn('[Codee] artifact polling stopped:', reason);
}

async function safeRuntimeSendMessage(message) {
    if (!isExtensionContextValid()) {
        stopZIPPolling('extension context is no longer valid; reload this page after updating Codee');
        return false;
    }

    try {
        const response = await chrome.runtime.sendMessage(message);
        // A missing response is not an acknowledgement. Treat it as transient so
        // artifact/ZIP detection stays retryable instead of being permanently cached.
        return response === undefined
            ? { ok: false, retryable: true, reason: 'no-response' }
            : response;
    } catch (error) {
        if (isContextInvalidatedError(error) || !isExtensionContextValid()) {
            stopZIPPolling('extension was reloaded or updated; reload this page to attach the new content script');
            return false;
        }

        contentHealth.lastRuntimeError = error?.message || String(error);
        console.warn('[Codee] Runtime message failed:', error);
        return false;
    }
}

function rememberBounded(set, value, maxSize) {
    if (!(set instanceof Set) || !value) return false;
    set.delete(value);
    set.add(value);
    while (set.size > maxSize) {
        const oldest = set.values().next().value;
        set.delete(oldest);
    }
    return true;
}

function normalizeArtifactFieldName(name) {
    return String(name || '').trim().toUpperCase();
}

const MAX_CODEE_ARTIFACT_BLOCK_CHARS = 65536;

function parseCodeeArtifactBlocks(text) {
    const source = String(text || '').replace(/\r\n?/g, '\n');
    const artifacts = [];
    const blockPattern = /(?:^|\n)\s*CODEE_ARTIFACT\s*\n([\s\S]*?)\n\s*CODEE_ARTIFACT_READY\s*(?=\n|$)/g;
    let match;

    while ((match = blockPattern.exec(source)) !== null) {
        if (match[1].length > MAX_CODEE_ARTIFACT_BLOCK_CHARS) continue;
        const fields = {};
        let duplicateField = false;
        match[1].split('\n').forEach(line => {
            const fieldMatch = line.match(/^\s*([A-Z0-9_]+)\s*:\s*(.*?)\s*$/);
            if (!fieldMatch) return;
            const name = normalizeArtifactFieldName(fieldMatch[1]);
            if (Object.prototype.hasOwnProperty.call(fields, name)) { duplicateField = true; return; }
            fields[name] = fieldMatch[2];
        });
        if (duplicateField) continue;

        const asNumber = value => {
            const normalized = String(value ?? '').trim();
            if (!/^\d+$/.test(normalized)) return null;
            const parsed = Number(normalized);
            return Number.isSafeInteger(parsed) ? parsed : null;
        };
        const isPlaceholder = value => /^<[^>]+>$/.test(String(value || '').trim());
        // The dispatched user prompt contains a machine-readable footer template with
        // real run/step tokens but placeholder artifact fields. Whole-page recovery scans
        // must not report that template back to the worker as if the assistant produced it.
        if ([fields.ARTIFACT_ID, fields.ZIP, fields.SHA256, fields.VERIFICATION].some(isPlaceholder)) {
            continue;
        }

        artifacts.push({
            ready: true,
            protocolVersion: asNumber(fields.PROTOCOL_VERSION),
            planId: fields.PLAN_ID || '',
            runId: fields.RUN_ID || '',
            stepId: fields.STEP_ID || '',
            stepToken: fields.STEP_TOKEN || '',
            stepCompleted: asNumber(fields.STEP_COMPLETED),
            stepTotal: asNumber(fields.STEP_TOTAL),
            status: String(fields.STATUS || '').toLowerCase(),
            artifactId: fields.ARTIFACT_ID || '',
            zip: fields.ZIP || '',
            type: fields.TYPE || '',
            version: fields.VERSION || '',
            parentSha256: fields.PARENT_SHA256 || '',
            sha256: String(fields.SHA256 || '').toLowerCase(),
            zipSize: fields.ZIP_SIZE || '',
            deltaSize: fields.DELTA_SIZE || '',
            filesChanged: fields.FILES_CHANGED || '',
            tests: fields.TESTS || '',
            verification: fields.VERIFICATION || '',
            createdAt: fields.CREATED_AT || '',
            nextAction: String(fields.NEXT_ACTION || '').toLowerCase()
        });
    }

    return artifacts;
}

function collectCodeeArtifacts() {
    const messages = document.querySelectorAll('[role="article"], [data-message-author-role="assistant"], .message-row, [class*="message"]');
    const artifacts = new Map();

    const addFromText = (text) => {
        parseCodeeArtifactBlocks(text || '').forEach(artifact => {
            const key = getArtifactDetectionKey(artifact);
            if (key) artifacts.set(key, artifact);
        });
    };

    const addFromNode = (node) => {
        if (!node) return;
        const textContent = String(node.textContent || '');
        addFromText(textContent);
        // Rendered Markdown can preserve CODEE footer line breaks only in innerText while
        // textContent is non-empty but flattened. Read innerText only when the sentinel is
        // present, avoiding unnecessary layout work on ordinary page mutations.
        if (!textContent || textContent.includes('CODEE_ARTIFACT')) {
            const innerText = String(node.innerText || '');
            if (innerText && innerText !== textContent) addFromText(innerText);
        }
    };

    messages.forEach(addFromNode);

    // Provider DOMs change frequently and selectors can expose only some messages.
    // Always supplement selector results with whole-page scans; Map deduplication plus
    // worker-side run/step/token validation remains authoritative.
    addFromNode(document.body);
    if (document.documentElement !== document.body) addFromNode(document.documentElement);

    return Array.from(artifacts.values());
}

function getArtifactDetectionKey(artifact) {
    // Include every field that can materially change worker validation. A corrected
    // footer (for example PARENT_SHA256 or VERIFICATION) must produce a new key so
    // it can be retried even if an earlier malformed footer was already rejected.
    return JSON.stringify([
        artifact?.protocolVersion ?? '',
        artifact?.planId || '',
        artifact?.runId || '',
        artifact?.stepId || '',
        artifact?.stepToken || '',
        artifact?.stepCompleted ?? '',
        artifact?.stepTotal ?? '',
        artifact?.status || '',
        artifact?.artifactId || '',
        artifact?.parentSha256 || '',
        artifact?.verification || '',
        artifact?.nextAction || '',
        artifact?.sha256 || '',
        artifact?.zip || ''
    ]);
}

function recordSubmittedStepToken(stepToken) {
    const token=String(stepToken || '').trim(); if(!token)return false;
    submittedStepTokens.delete(token); submittedStepTokens.add(token);
    while(submittedStepTokens.size>MAX_SUBMITTED_TOKENS){const oldest=submittedStepTokens.values().next().value;submittedStepTokens.delete(oldest);}
    return true;
}
function getUserMessageNodes() {
    const adapter=getProviderAdapterForUrl(String(globalThis.location?.href || '')); if(!adapter)return [];
    const out=[]; const seen=new Set();
    for(const selector of adapter.userMessageSelectors||[]){
        let nodes=[]; try{nodes=Array.from(document.querySelectorAll(selector)||[]);}catch(_error){}
        for(const node of nodes)if(node&&!seen.has(node)){seen.add(node);out.push(node);}
    }
    return out;
}
function hasSubmittedStepToken(stepToken) {
    const token=String(stepToken || '').trim(); if(!token)return false;
    if(submittedStepTokens.has(token))return true;
    const marker=`STEP_TOKEN: ${token}`;
    const composer=findComposer(); if(composer&&readComposerText(composer).includes(marker))return false;
    return getUserMessageNodes().some(node=>String(node?.innerText ?? node?.textContent ?? '').includes(marker));
}

function collectZIPVersions() {
    const versions = new Set();
    const messages = document.querySelectorAll('[role="article"], .message-row, [class*="message"]');

    messages.forEach((msg) => {
        const text = msg.textContent || '';
        if (!text.includes('.zip')) return;

        const matches = text.match(/v(\d+\.\d+\.\d+)/g);
        if (!matches) return;

        matches.forEach(match => versions.add(match.substring(1)));
    });

    return Array.from(versions);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== 'object') return;

    if (message.action === 'SEND_PROMPT') {
        sendPromptToProvider(message.prompt, message.stepToken)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'SEND_NEXT_NUDGE') {
        sendNextNudgeToChatGPT()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }

    if (message.action === 'PROBE_COMPOSER') {
        if (isProviderGenerating()) {
            sendResponse({ ok: false, skipped: true, reason: 'provider-busy', error: 'AI response is still generating' });
            return;
        }
        waitForComposer({ timeoutMs: 2500, intervalMs: 100 })
            .then(composer => sendResponse(composer
                ? { ok: true, composerFound: true }
                : { ok: false, retryable: true, reason: 'composer-not-found', error: 'Could not find the AI chat composer' }))
            .catch(error => sendResponse({ ok:false, retryable:true, reason:'composer-probe-failed', error:error?.message || String(error) }));
        return true;
    }

    if (message.action === 'GET_PAGE_STATE') {
        const identity = getConversationIdentitySnapshot();
        sendResponse({
            ok: true,
            versions: collectZIPVersions(),
            artifacts: collectCodeeArtifacts(),
            hasSubmittedStepToken: hasSubmittedStepToken(message.expectedStepToken),
            conversationIdentity: identity.conversationIdentity,
            structuredConversationIdentity: identity.structuredIdentity,
            provisionalConversationIdentity: identity.provisionalIdentity
        });
        return;
    }

    if (message.action === 'GET_CONVERSATION_IDENTITY') {
        sendResponse({ ok: true, ...getConversationIdentitySnapshot() });
        return;
    }

    if (message.action === 'GET_CODEE_DIAGNOSTICS') {
        let composer = null;
        let composerError = '';
        try { composer = findComposer(); } catch (error) { composerError = error?.message || String(error); }
        let artifacts = [];
        let versions = [];
        try {
            artifacts = collectCodeeArtifacts();
            versions = collectZIPVersions();
        } catch (error) {
            contentHealth.lastError = error?.message || String(error);
        }
        const identity = getConversationIdentitySnapshot();
        sendResponse({
            ok: true,
            conversationIdentity: identity.conversationIdentity,
            structuredConversationIdentity: identity.structuredIdentity,
            provisionalConversationIdentity: identity.provisionalIdentity,
            contextValid: isExtensionContextValid(),
            contextInvalidated,
            composerFound: Boolean(composer),
            submitButtonFound: Boolean(composer && findSubmitButton(composer)),
            providerBusy: isProviderGenerating(),
            artifactCount: artifacts.length,
            versionCount: versions.length,
            pendingArtifactCount: pendingArtifactKeys.size,
            pendingVersionCount: pendingVersionKeys.size,
            detectedArtifactCount: detectedArtifactKeys.size,
            submittedTokenCount: submittedStepTokens.size,
            scanCount: contentHealth.scanCount,
            lastScanAt: contentHealth.lastScanAt,
            lastError: composerError || contentHealth.lastError,
            lastRuntimeError: contentHealth.lastRuntimeError,
            lastPromptError: contentHealth.lastPromptError,
            lastPromptAttemptAt: contentHealth.lastPromptAttemptAt,
            lastPromptAcceptedAt: contentHealth.lastPromptAcceptedAt,
            lastNudgeAttemptAt: contentHealth.lastNudgeAttemptAt,
            lastNudgeAcceptedAt: contentHealth.lastNudgeAcceptedAt,
            lastNudgeError: contentHealth.lastNudgeError,
            loadedAt: contentHealth.loadedAt
        });
        return;
    }

    if (message.action === 'CHECK_FOR_ZIP') {
        checkForZIP()
            .then(() => sendResponse({ ok: true }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }
});

function getCurrentProviderUrl() {
    const direct = String(globalThis.location?.href || globalThis.window?.location?.href || '').trim();
    if (direct) return direct;
    const hostname = String(globalThis.location?.hostname || globalThis.window?.location?.hostname || '').trim();
    return hostname ? `https://${hostname}/` : '';
}
function findComposer() {
    const adapter=getProviderAdapterForUrl(getCurrentProviderUrl()); if(!adapter)return null;
    for(const selector of adapter.composerSelectors||[]){const candidate=document.querySelector(selector);if(candidate&&!candidate.disabled&&candidate.getAttribute?.('aria-disabled')!=='true')return candidate;}
    return null;
}
async function waitForComposer(options = {}) {
    const timeoutMs = Math.max(0, Math.min(5000, Number(options.timeoutMs) || 2500));
    const intervalMs = Math.max(50, Math.min(500, Number(options.intervalMs) || 100));
    const deadline = Date.now() + timeoutMs;
    let composer = findComposer();
    while (!composer && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        composer = findComposer();
    }
    return composer;
}
function readComposerText(input) {
    if(!input)return ''; if(input.contentEditable==='true')return String(input.innerText ?? input.textContent ?? '').trim(); return String(input.value ?? '').trim();
}
function findSubmitButton(input) {
    const adapter=getProviderAdapterForUrl(getCurrentProviderUrl()); if(!adapter)return null;
    for(const selector of adapter.submitSelectors||[]){const scoped=input?.closest?.('form')?.querySelector?.(selector)||input?.parentElement?.querySelector?.(selector)||document.querySelector(selector);if(scoped)return scoped;}
    return null;
}
function isProviderGenerating() {
    try {
        return Boolean(document.querySelector('button[data-testid="stop-button"], button[aria-label*="Stop generating" i], button[aria-label*="Stop response" i], .result-streaming, [data-is-streaming="true"]'));
    } catch (_error) {
        return false;
    }
}

function normalizeNudgeMessageText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}
function countRenderedNextMessages() {
    return getUserMessageNodes().reduce((count, node) => {
        const text = normalizeNudgeMessageText(node?.innerText ?? node?.textContent ?? '');
        return count + (text === 'next' ? 1 : 0);
    }, 0);
}
async function waitForNudgeAcceptance(originalInput, baselineMessages, baselineNextCount) {
    const baseline = new Set(Array.isArray(baselineMessages) ? baselineMessages : []);
    const initialNextCount = Number(baselineNextCount) || 0;
    for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const liveInput = findComposer();
        const composerCleared = (!liveInput && typeof document.contains === 'function' && !document.contains(originalInput)) || Boolean(liveInput && readComposerText(liveInput) === '');
        const messages = getUserMessageNodes();
        const newRenderedNext = messages.some(node => !baseline.has(node) && normalizeNudgeMessageText(node?.innerText ?? node?.textContent ?? '') === 'next');
        const nextCountAdvanced = messages.reduce((count, node) => count + (normalizeNudgeMessageText(node?.innerText ?? node?.textContent ?? '') === 'next' ? 1 : 0), 0) > initialNextCount;
        if (composerCleared && (newRenderedNext || nextCountAdvanced)) return true;
    }
    return false;
}

async function sendNextNudgeToChatGPT() {
    contentHealth.lastNudgeAttemptAt = Date.now();
    contentHealth.lastNudgeError = '';
    if (isProviderGenerating()) {
        contentHealth.lastNudgeError = 'AI response is still generating';
        return { ok:false, skipped:true, reason:'provider-busy', error:contentHealth.lastNudgeError };
    }
    const input = await waitForComposer({ timeoutMs: 2500, intervalMs: 100 });
    const baselineUserMessages = getUserMessageNodes();
    const baselineNextCount = countRenderedNextMessages();
    if (!input) {
        contentHealth.lastNudgeError = 'Could not find the AI chat composer';
        return { ok:false, skipped:true, reason:'composer-not-found', error:contentHealth.lastNudgeError };
    }
    if (readComposerText(input)) {
        contentHealth.lastNudgeError = 'Composer contains user text';
        return { ok:false, skipped:true, reason:'composer-not-empty', error:contentHealth.lastNudgeError };
    }
    try {
        if (input.contentEditable === 'true') input.textContent = 'next'; else input.value = 'next';
        input.dispatchEvent(new Event('input', { bubbles:true }));
        input.dispatchEvent(new Event('change', { bubbles:true }));
        await new Promise(resolve => setTimeout(resolve, 120));
        const submitButton = findSubmitButton(input);
        if (submitButton && typeof submitButton.click === 'function' && !submitButton.disabled && submitButton.getAttribute?.('aria-disabled') !== 'true') {
            submitButton.click();
        } else {
            input.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', code:'Enter', bubbles:true }));
        }
        const accepted = await waitForNudgeAcceptance(input, baselineUserMessages, baselineNextCount);
        if (!accepted) {
            if (readComposerText(input).toLowerCase() === 'next') {
                if (input.contentEditable === 'true') input.textContent = ''; else input.value = '';
                input.dispatchEvent(new Event('input', { bubbles:true }));
                input.dispatchEvent(new Event('change', { bubbles:true }));
            }
            contentHealth.lastNudgeError = 'The next nudge was not accepted by the conversation';
            return { ok:false, retryable:true, reason:'not-accepted', error:contentHealth.lastNudgeError };
        }
        contentHealth.lastNudgeAcceptedAt = Date.now();
        return { ok:true, sent:true, text:'next' };
    } catch (error) {
        contentHealth.lastNudgeError = error?.message || String(error);
        return { ok:false, retryable:true, reason:'send-error', error:contentHealth.lastNudgeError };
    }
}

async function waitForSubmissionAcceptance(stepToken, expectedPrompt, baselineMessages) {
    const token=String(stepToken||'').trim(); const marker=token?`STEP_TOKEN: ${token}`:'';
    const baseline=new Set(Array.isArray(baselineMessages)?baselineMessages:[]);
    const legacyNeedle=String(expectedPrompt||'').trim().slice(0,160);
    for(let attempt=0;attempt<30;attempt++){
        await new Promise(resolve=>setTimeout(resolve,100));
        const messages=getUserMessageNodes();
        for(const node of messages){const text=String(node?.innerText ?? node?.textContent ?? '');if(marker&&text.includes(marker))return true;if(!marker&&!baseline.has(node)&&legacyNeedle&&text.includes(legacyNeedle))return true;}
    }
    return false;
}

async function sendPromptToProvider(prompt, stepToken = '') {
    contentHealth.lastPromptAttemptAt = Date.now();
    contentHealth.lastPromptError = '';
    try {
        const input = await waitForComposer({ timeoutMs: 2500, intervalMs: 100 });
        const baselineUserMessages = getUserMessageNodes();

        if (!input) {
            const error = 'Could not find the AI chat composer';
            console.error('[Codee]', error);
            contentHealth.lastPromptError = error;
            return { ok: false, error };
        }

        const expected = String(prompt || '').trim();
        if (!expected) { contentHealth.lastPromptError = 'Prompt is empty'; return { ok: false, error: 'Prompt is empty' }; }

        if (input.contentEditable === 'true') {
            input.textContent = prompt;
        } else {
            input.value = prompt;
        }

        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // Let React/provider editor state absorb the input event before submitting.
        await new Promise(resolve => setTimeout(resolve, 120));

        const submitButton = findSubmitButton(input);
        if (submitButton && typeof submitButton.click === 'function' && !submitButton.disabled && submitButton.getAttribute?.('aria-disabled') !== 'true') {
            submitButton.click();
        } else {
            input.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                ctrlKey: true,
                bubbles: true
            }));
        }

        // Composer clearing is only supporting UI evidence. Authoritative acknowledgement
        // requires a provider-rendered user message containing the exact step token.
        const accepted = await waitForSubmissionAcceptance(stepToken, expected, baselineUserMessages);
        if (!accepted) {
            contentHealth.lastPromptError = 'Prompt was placed in the composer but was not submitted';
            return { ok: false, error: contentHealth.lastPromptError };
        }

        contentHealth.lastPromptAcceptedAt = Date.now();
        recordSubmittedStepToken(stepToken);
        console.log('[Codee] Prompt submitted:', expected.substring(0, 50) + '...');
        return { ok: true, stepToken: String(stepToken || '') };
    } catch (error) {
        contentHealth.lastPromptError = error?.message || String(error);
        console.error('[Codee] Error sending prompt:', error);
        return { ok: false, error: contentHealth.lastPromptError };
    }
}

// Backward-compatible test/internal alias; runtime dispatch uses the provider-neutral entry point.
async function sendPromptToChatGPT(prompt, stepToken = '') {
    return sendPromptToProvider(prompt, stepToken);
}


// Detect canonical CODEE artifact signatures first. ZIP/version detection remains
// available only for legacy plans that predate the signature-v2 protocol.
async function performArtifactScan() {
    contentHealth.scanCount += 1;
    contentHealth.lastScanAt = Date.now();
    if (!isExtensionContextValid()) {
        stopZIPPolling('extension context is no longer valid; reload this page after updating Codee');
        return;
    }

    const deliveries = [];
    const scannedArtifacts = collectCodeeArtifacts();
    const scannedVersions = collectZIPVersions();
    contentHealth.lastArtifactCount = scannedArtifacts.length;
    contentHealth.lastVersionCount = scannedVersions.length;

    scannedArtifacts.forEach((artifact) => {
        const key = getArtifactDetectionKey(artifact);
        if (!key || detectedArtifactKeys.has(key) || pendingArtifactKeys.has(key)) return;
        pendingArtifactKeys.add(key);

        const delivery = safeRuntimeSendMessage({
            action: 'ARTIFACT_DETECTED',
            artifact,
            timestamp: Date.now()
        }).then(response => {
            // Retryable state/timing rejections must remain visible to later scans.
            if (response && (response.ok || response.terminal === true)) {
                rememberBounded(detectedArtifactKeys, key, MAX_DETECTED_ARTIFACT_KEYS);
            }
            return response;
        }).finally(() => pendingArtifactKeys.delete(key));
        deliveries.push(delivery);
    });

    scannedVersions.forEach((version) => {
        if (detectedVersions.has(version) || pendingVersionKeys.has(version)) return;
        pendingVersionKeys.add(version);

        const delivery = safeRuntimeSendMessage({
            action: 'ZIP_DETECTED',
            version,
            timestamp: Date.now()
        }).then(response => {
            if (response && (response.ok || response.terminal === true || response.ignored)) {
                rememberBounded(detectedVersions, version, MAX_DETECTED_VERSIONS);
            }
            return response;
        }).finally(() => pendingVersionKeys.delete(version));
        deliveries.push(delivery);
    });

    await Promise.allSettled(deliveries);
}

function checkForZIP() {
    if (artifactScanInFlight) return artifactScanInFlight;
    artifactScanInFlight = performArtifactScan()
        .catch(error => {
            contentHealth.lastError = error?.message || String(error);
            console.warn('[Codee] Artifact scan failed; a later event/minute sweep will retry:', error);
            return { ok: false, retryable: true, error: error?.message || String(error) };
        })
        .finally(() => {
            artifactScanInFlight = null;
        });
    return artifactScanInFlight;
}

// Register polling before the readiness handshake. If this page still has an old,
// invalidated extension context, safeRuntimeSendMessage() can then stop the timer
// immediately rather than leaving a newly-created orphan interval behind.
zipPollTimer = setInterval(checkForZIP, 60000);

// On a fresh/reloaded page, report all ZIP versions already visible before Codee
// retries any pending prompt. This creates a baseline so old artifacts cannot be
// mistaken for completion of the newly retried step.
const initialVersions = collectZIPVersions();
initialVersions.forEach(version => rememberBounded(detectedVersions, version, MAX_DETECTED_VERSIONS));
// Do not pre-mark artifacts as processed. CONTENT_READY reconciles visible artifacts
// first, and later scans must remain able to retry if that handshake fails transiently.

function announceContentReady() {
    try {
        const identity = getConversationIdentitySnapshot();
        safeRuntimeSendMessage({
            action: 'CONTENT_READY',
            versions: collectZIPVersions(),
            artifacts: collectCodeeArtifacts(),
            conversationIdentity: identity.conversationIdentity,
            structuredConversationIdentity: identity.structuredIdentity,
            provisionalConversationIdentity: identity.provisionalIdentity,
            timestamp: Date.now()
        });
    } catch (error) {
        console.warn('[Codee] Content-ready snapshot failed; scheduled recovery will retry:', error);
    }
}

announceContentReady();
// ChatGPT/Claude can finish mounting their composer after document_end. A couple of
// bounded readiness retries let a pending step recover automatically after reload
// without creating a permanent reconnect loop.
setTimeout(announceContentReady, 1500);
setTimeout(announceContentReady, 4000);

// Event-driven completion detection: as the assistant response DOM changes, scan
// shortly after mutations. The one-minute interval remains a recovery fallback.
if (typeof MutationObserver === 'function' && document.documentElement) {
    artifactObserver = new MutationObserver(() => {
        if (artifactScanTimer !== null) clearTimeout(artifactScanTimer);
        artifactScanTimer = setTimeout(() => {
            artifactScanTimer = null;
            checkForZIP();
        }, 500);
    });
    artifactObserver.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
}

console.log('[Codee] Content script loaded on', window.location.hostname);
