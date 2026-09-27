(function attachCodeePlanRequirementAnalyzer(global) {
    'use strict';

    function text(value, max = 1048576) {
        return String(value ?? '').replace(/\r\n?/g, '\n').slice(0, max);
    }
    function unique(values) { return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean))); }
    function has(haystack, patterns) { return patterns.some(pattern => pattern.test(haystack)); }

    const READ_PATTERNS = [
        /\b(read|inspect|scan|analy[sz]e|review|audit|trace|search|find|understand|map|inventory|diagnose|debug)\b/i,
        /\b(repository|repo|codebase|source|file|class|route|model|migration|schema|blade|javascript|typescript|php|laravel)\b/i
    ];
    const WRITE_PATTERNS = [
        /\b(implement|fix|repair|edit|modify|change|update|upgrade|refactor|add|create|write|wire|integrate|merge|patch|replace|rename)\b/i,
        /\b(code change|source change|migration|hotfix|remediation|build feature)\b/i
    ];
    const DESTRUCTIVE_PATTERNS = [
        /\b(delete|remove|drop|truncate|destroy|purge|wipe|overwrite|reset database|force push)\b/i
    ];
    const COMMAND_PATTERNS = [
        /\b(run|execute)\s+(tests?|test suite|lint|build|phpunit|pest|npm|pnpm|yarn|composer|artisan|migration|migrate|command)/i,
        /\b(phpunit|pest|npm test|npm run|pnpm test|yarn test|composer test|php -l|artisan test|migrate)\b/i
    ];
    const DATABASE_PATTERNS = [/\b(database|schema|migration|migrate|table|column|index|sql|mysql|postgres|sqlite)\b/i];
    const SERVER_PATTERNS = [/\b(server|deploy|deployment|production|service|daemon|nginx|apache|php-fpm|environment variable|\.env|runtime config|host configuration)\b/i];
    const MCP_PATTERNS = [/\bmcp\b/i, /model context protocol/i, /\btool call\b/i];
    const BROWSER_PATTERNS = [/\b(browser|chrome|tab|web ui|website|page|dom|frontend ui|e2e|end-to-end)\b/i];
    const SCREENSHOT_PATTERNS = [/\bscreenshot|visual regression|capture image\b/i];
    const INTERACT_PATTERNS = [/\b(click|type|fill|submit|select|hover|drag|scroll|navigate|open page|login|sign in)\b/i];
    const NETWORK_PATTERNS = [/\b(network|request|response|xhr|fetch|api call|console error)\b/i];
    const PROVIDER_PATTERNS = [/\b(ai provider|provider gateway|ollama|gemini|openrouter|groq|mistral|openai|anthropic|claude|grok|local ai|model)\b/i];
    const LOCAL_ONLY_PATTERNS = [/\blocal[- ]only\b/i, /\bdevice[- ]only\b/i, /\boffline[- ]only\b/i, /\bno cloud\b/i];
    const FREE_ONLY_PATTERNS = [/\bfree[- ]only\b/i, /\bno paid\b/i, /\bnever use paid\b/i, /\bwithout paid\b/i];
    const PAID_ALLOWED_PATTERNS = [/\bpaid provider\b/i, /\bpaid ai\b/i, /\bbudget\b/i, /\bspend cap\b/i];
    const TEST_PATTERNS = [/\b(test|tests|testing|regression|verify|verification|lint|syntax check|certif)\b/i];
    const ARTIFACT_PATTERNS = [/\b(zip|artifact|package|cumulative|delta|patch|release build)\b/i];

    function flattenPlan(plan) {
        return (Array.isArray(plan) ? plan : []).map(step => text(step?.text || step, 120000)).filter(Boolean).join('\n');
    }

    function deriveBrowser(full) {
        const required = has(full, BROWSER_PATTERNS) || has(full, SCREENSHOT_PATTERNS) || has(full, INTERACT_PATTERNS) || has(full, NETWORK_PATTERNS);
        const capabilities = [];
        if (required) capabilities.push('browser.snapshot');
        if (has(full, SCREENSHOT_PATTERNS)) capabilities.push('browser.screenshot');
        if (has(full, INTERACT_PATTERNS)) {
            if (/\bclick\b/i.test(full)) capabilities.push('browser.click');
            if (/\b(type|fill|submit)\b/i.test(full)) capabilities.push('browser.type');
            if (/\bnavigate|open page|login|sign in\b/i.test(full)) capabilities.push('browser.navigate');
            if (/\bselect\b/i.test(full)) capabilities.push('browser.select');
            if (/\bhover\b/i.test(full)) capabilities.push('browser.hover');
            if (/\bscroll\b/i.test(full)) capabilities.push('browser.scroll');
            if (/\bdrag\b/i.test(full)) capabilities.push('browser.drag');
        }
        if (has(full, NETWORK_PATTERNS)) capabilities.push('browser.network.list', 'browser.console.errors');
        return Object.freeze({ required, capabilities: Object.freeze(unique(capabilities)) });
    }

    function analyze(input = {}) {
        const full = flattenPlan(input.plan);
        const protocolMode = String(input.protocolMode || 'signature_v2').toLowerCase();
        const artifactValidationMode = String(input.artifactValidationMode || 'strict_v216').toLowerCase();
        const repositoryRead = has(full, READ_PATTERNS) || has(full, WRITE_PATTERNS);
        const repositoryWrite = has(full, WRITE_PATTERNS) && !/\b(read[- ]only|do not modify|no changes|without changing|analysis only|summari[sz]e only)\b/i.test(full);
        const destructive = repositoryWrite && has(full, DESTRUCTIVE_PATTERNS);
        const commands = has(full, COMMAND_PATTERNS);
        const database = repositoryWrite && has(full, DATABASE_PATTERNS);
        const server = repositoryWrite && has(full, SERVER_PATTERNS);
        const mcp = has(full, MCP_PATTERNS);
        const browser = deriveBrowser(full);
        const providerRequired = has(full, PROVIDER_PATTERNS);
        const localOnly = has(full, LOCAL_ONLY_PATTERNS);
        const freeOnly = has(full, FREE_ONLY_PATTERNS);
        const paidAllowed = !freeOnly && has(full, PAID_ALLOWED_PATTERNS);
        const testsRequired = has(full, TEST_PATTERNS) || Boolean(input.debuggingPlanEnabled) || repositoryWrite;
        const freshArtifactRequired = protocolMode === 'signature_v2' || has(full, ARTIFACT_PATTERNS);
        const backupDomains = [];
        if (repositoryWrite) backupDomains.push('filesystem');
        if (database) backupDomains.push('database');
        if (server) backupDomains.push('server');
        const requiredCapabilities = [];
        if (repositoryRead) requiredCapabilities.push('repository.search');
        if (repositoryWrite) requiredCapabilities.push('repository.host.write');
        if (commands) requiredCapabilities.push('repository.host.command');
        if (destructive) requiredCapabilities.push('repository.host.delete');
        if (mcp) requiredCapabilities.push('mcp.tool.call');
        if (providerRequired) requiredCapabilities.push('ai.gateway.status');
        requiredCapabilities.push(...browser.capabilities);

        let risk = 'low';
        if (destructive) risk = 'critical';
        else if (database || server || repositoryWrite || mcp) risk = 'high';
        else if (browser.required || commands || providerRequired) risk = 'medium';

        const result = {
            schema: 'codee.plan.requirements.v1',
            derivedAt: new Date().toISOString(),
            conversation: Object.freeze({ required: true, exactBindingRequired: true }),
            provider: Object.freeze({ required: providerRequired, localOnly, byoAllowed: !localOnly }),
            repository: Object.freeze({ read: repositoryRead, write: repositoryWrite, commands, destructive }),
            backup: Object.freeze({ required: backupDomains.length > 0, verifyBeforeMutation: backupDomains.length > 0, domains: Object.freeze(unique(backupDomains)) }),
            artifactHost: Object.freeze({ required: freshArtifactRequired, receiptRequired: protocolMode === 'signature_v2', requireContentManifest: protocolMode === 'signature_v2' && artifactValidationMode === 'strict_v216' }),
            mcp: Object.freeze({ required: mcp, governedMutationRequired: mcp && repositoryWrite }),
            browser,
            privacy: Object.freeze({ mode: localOnly ? 'LOCAL_ONLY' : 'STANDARD', secretsInPromptAllowed: false }),
            cost: Object.freeze({ mode: freeOnly ? 'FREE_ONLY' : (paidAllowed ? 'PAID_ALLOWED' : 'UNSPECIFIED'), explicitPaidApprovalRequired: !freeOnly }),
            verification: Object.freeze({ testsRequired, freshArtifactRequired, artifactReceiptRequired: protocolMode === 'signature_v2', postWriteVerificationRequired: repositoryWrite, rollbackEvidenceRequired: backupDomains.length > 0 }),
            requiredCapabilities: Object.freeze(unique(requiredCapabilities)),
            risk: Object.freeze({ level: risk, approvalRecommended: ['high','critical'].includes(risk) }),
            authority: Object.freeze({ mayAdvancePlan: false, mayMutate: false, mayGrantCapability: false, mayMarkReady: false })
        };
        return Object.freeze(result);
    }

    global.CodeePlanRequirementAnalyzer = Object.freeze({ analyze });
})(typeof globalThis !== 'undefined' ? globalThis : this);
