# Browser Map

Titan Browser Node contract: `packages/tools/browser-node-contract.mjs`.

Operations: open, navigate, read, click, type, select, scroll, screenshot, tabs, download, upload, evaluate, wait.

Observation operations are distinguished from write/dangerous operations. `evaluate` requires explicit dangerous-operation risk clearance. Sessions carry company ownership plus personal/agent/team/company/ephemeral scope. Local execution is first-class; cloud browser providers are optional adapters. Domain allow/block controls are enforced before navigation. Login/MFA yield resumable wait states. External page content is always marked untrusted.

OpenAcme donor evidence: Playwright-core BrowserManager; local Chrome/Camoufox and Browserbase/Browser-Use/Firecrawl providers; stable tab aliases; ARIA snapshots; screenshots; forms; persistent per-agent profile bindings. Titan generalises ownership instead of copying per-agent-only scope.
