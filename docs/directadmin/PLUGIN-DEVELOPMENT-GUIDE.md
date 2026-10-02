# Titan Zero DirectAdmin Plugin Development Guide

Status: canonical DirectAdmin development guide for Titan Zero  
Architecture: `docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md`  
Canonical rules: `docs/architecture/CANONICAL-RULES.md`  
DirectAdmin control-plane owner: #812  
Shared Cockpit SDK owner: #1049

## 1. Architectural position

DirectAdmin is Titan Zero's first **Business Node control plane / meta-orchestration environment**.

It sits at the server and manages the business's digital system estate:

- Titan Workforce host/runtime;
- Frappe/ERPNext Business Engine;
- domains, DNS and TLS;
- email, mailboxes and Rspamd;
- websites, WordPress, Microweber and portals;
- databases, Redis and storage;
- Node/PHP/Composer/npm/PM2/Git applications;
- devices/nodes and sync state;
- security and assurance;
- backups, recovery and migration;
- Foundry packages and temporary Mission apps;
- developer/Codex diagnostics and access.

DirectAdmin is intentionally an **active operational control plane**, not merely a dashboard.

It still does **not** replace:
- the Business Evidence Ledger as factual history;
- Titan Constitution / Trust / Authority;
- the canonical Workforce runtime/identity;
- canonical capability ownership;
- the one Titan PWA and one native mobile app, each with Zero/Go/Hub governed modes, plus the separate full `apps/web` base application as user-facing products/surfaces.

The rule is:

> DirectAdmin orchestrates and manages systems; canonical Titan contracts determine truth, authority and verified outcomes.

## 2. Can DirectAdmin plugins use any programming language?

### Short answer

**Yes, effectively any executable language/runtime available on the server can be used for DirectAdmin plugin GUI scripts.**

DirectAdmin's plugin GUI files are executable scripts. A plugin-level `admin/index.html`, `reseller/index.html`, or `user/index.html` is not required to contain HTML source despite its filename. It is executed, and its stdout becomes the page content.

The interpreter is selected by the executable's shebang.

Examples:

```text
#!/usr/local/bin/php
#!/usr/bin/env python3
#!/usr/bin/env perl
#!/usr/bin/env ruby
#!/usr/bin/env bash
#!/usr/bin/env node
```

A compiled native executable can also be invoked directly if it is compatible with the host.

### Practical requirement

The runtime must actually exist on the target server.

For example:
- PHP works on most DirectAdmin hosts.
- Python may be present, but do not assume a particular version.
- Node.js may not be installed globally.
- Composer/npm/pnpm may be absent.
- Go/Rust binaries can be shipped as compiled artifacts if architecture/OS compatibility is handled.
- Java requires a JVM.
- Shell scripts need the referenced shell.

### Recommended Titan pattern

Do **not** rewrite existing TypeScript/Python/PHP work into PHP just because the DirectAdmin page entrypoint is PHP.

Use a thin entrypoint that calls/reaches the canonical implementation.

Example:

```
DirectAdmin PHP entrypoint
        ↓
Titan Cockpit SDK
        ↓
local API / Unix socket / localhost service
        ↓
TypeScript/Node canonical service
```

or:

```
DirectAdmin executable Python entrypoint
        ↓
Titan API client
        ↓
canonical backend
```

or:

```
DirectAdmin plugin
        ↓
narrow privileged helper
        ↓
compiled Go/Rust binary
```

Language choice belongs to the implementation owner, not the control-panel file extension.

## 3. Official DirectAdmin execution model

A plugin lives under:

```
/usr/local/directadmin/plugins/<plugin_id>/
```

Standard structure:

```
plugin.conf
admin/
  index.html
reseller/
  index.html
user/
  index.html
hooks/
scripts/
images/
```

The role entrypoints must be executable.

Routing:

```
/CMD_PLUGINS_ADMIN/<id>      -> admin/index.html
/CMD_PLUGINS_RESELLER/<id>   -> reseller/index.html
/CMD_PLUGINS/<id>            -> user/index.html
```

Evolution may wrap these routes internally, for example:

```
/evo/plugin?src=%2FCMD_PLUGINS_ADMIN%2F<id>
```

Plugin hooks/links must use the canonical `CMD_PLUGINS*` route, not hard-code the `/evo/` wrapper.

### Request execution identity

Plugin scripts execute as the DirectAdmin/UNIX user that triggered the request.

That means:
- DirectAdmin Admin does not automatically mean Linux root.
- do not assume `sudo`;
- do not infer Titan business authority from DirectAdmin role;
- account-context pages must operate inside the effective Unix permission boundary.

Root/setuid helpers are technically possible but are high-risk and should not be the default Titan design.

## 4. Sources

Official DirectAdmin references:

- Plugin structure: https://docs.directadmin.com/developer/plugins/structure.html
- Plugin development: https://docs.directadmin.com/directadmin/customizing-workflow/writing-a-plugin.html
- Plugin overview: https://docs.directadmin.com/developer/plugins/
- Workflow/security notes: https://docs.directadmin.com/directadmin/customizing-workflow/

## 5. Titan DirectAdmin plugin portfolio

All Titan DirectAdmin plugins share the #1049 Cockpit SDK.

Current/published mission architecture:

```
Titan Business Node Control Plane (#812)
├── Cockpit SDK (#1049)
├── Titan Zero (#1046)
├── Titan Workforce (#1050)
├── Titan Operations (#1045)
├── Titan Business Engine / Frappe (#1051)
├── Titan Foundry (#1047)
├── Titan Web / Portal (#1044)
├── Titan Dev (#1048)
├── Titan Experience (#1052)
├── Titan Communications
├── Titan Finance & Commerce
├── Titan Intelligence
├── Titan Governance & Assurance
└── Titan Sprout / Vertical Packs
```

The portfolio map and source assignment live in:
`docs/directadmin/PLUGIN-PORTFOLIO-MAP.md`.

### Shared SDK contract entry point

The current TypeScript contract package is exported as
`@titan-zero/titan-platform/directadmin-plugin`. It provides package validation,
server-resolved DirectAdmin-to-Titan context projection, company/revision checks,
a same-origin versioned API client, authority-neutral widget/navigation types,
and a contribution registry that degrades invalid plugins independently. The
registry treats `sdk_compatibility` as the contribution API's SemVer and
isolates a plugin whose required major differs from the runtime's supported
major; matching majors permit minor and patch updates. The API compatibility
version is separate from the npm package release version. Its diagnostic
redactor removes credential-like fields and common bearer/private-key values
before a support bundle is rendered or exported.

Hosted routes use `DirectAdminSessionBridge` and `createDirectAdminGateway`, which
verify a commissioned issuer's signed credential before calling #302's durable
current-session resolver. The older injected resolver is deprecated presentation
compatibility, not authentication. DirectAdmin role is presentation only; the SDK refuses missing,
expired, unresolved, or inconsistent company mappings. `company_id`, actor IDs,
and revisions carried by the API client are assertions for the Server Node to
re-resolve. They never authorize an action. Consequential work is submitted as a
governed intent and requires canonical authorization, execution, verification,
and evidence downstream. Never put bearer secrets or provider credentials in
plugin contributions, URLs, diagnostics, or browser storage.

Package validators should inspect the final archive, then pass its exact
`<plugin_id>.tar.gz` name, root manifest text/version, complete file list, and
executable paths to `validateDirectAdminPluginPackage`. The function rejects
path traversal, noncanonical role routes, mismatched archive identity/version,
and missing executable modes. This is a reusable contract; it does not itself
install or certify a plugin on a live DirectAdmin host.

Three source consumers now share the authenticated SDK session/renderer:
`apps/directadmin/{zero-core,operations-hub,brand-studio}/cockpit.mjs`.
Their signed-session/SQLite integration tests pass; installed role entrypoints and
real Evolution host integration are still unverified. See the
[authenticated session bridge contract](../contracts/directadmin-authenticated-session-bridge.md)
for credential delivery, CSRF/origin checks, canonical company rotation, execution
revalidation, exact evidence and remaining prerequisites. Do not equate local
adapter tests with a commissioned host or completed portfolio migration.

## 6. Plugin ID and archive naming

DirectAdmin routing uses the installed plugin directory/plugin ID.

For Titan, the final install archive must use the exact plugin ID:

```
titan_dev.tar.gz
titan_zero.tar.gz
titan_workforce.tar.gz
titan_operations.tar.gz
```

Do not publish install files named:

```
titan_dev-1.2.0.tar.gz
titan_dev_rebuilt.tar.gz
titan_dev_fresh.tar.gz
```

unless the package/install mechanism has been explicitly proven to preserve the intended plugin ID.

The version belongs in `plugin.conf`.

## 7. Required package layout

The final tarball must contain:

```
plugin.conf
admin/index.html
reseller/index.html
user/index.html
hooks/...
scripts/install.sh
scripts/uninstall.sh
...
```

directly at archive root.

Wrong:

```
titan_dev-1.0/
  plugin.conf
  admin/
```

Right:

```
plugin.conf
admin/
reseller/
user/
...
```

## 8. Executable modes

Role entrypoints must be executable in the final archive:

```
admin/index.html       0755
reseller/index.html    0755
user/index.html        0755
```

Lifecycle/CLI scripts should have appropriate executable modes.

GitHub file APIs do not always preserve executable bits reliably, so the package builder must explicitly apply them before producing the tarball.

## 9. Never hard-code the final plugin install path in install.sh

DirectAdmin can execute install lifecycle code while the package is still in an extraction/staging location.

Bad:

```sh
chmod 755 /usr/local/directadmin/plugins/titan_dev/admin/index.html
```

Use self-location:

```sh
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PLUGIN_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
```

Prefer carrying correct modes in the tarball rather than fixing them after extraction.

## 10. Plugin entrypoint design

Entry files should remain very small.

Example:

```php
#!/usr/local/bin/php
<?php
require_once dirname(__DIR__).'/lib/bootstrap.php';
Titan\DirectAdmin\run();
```

The entrypoint should:
1. normalize DirectAdmin environment;
2. resolve role and actor;
3. resolve allowed Titan company context;
4. create correlation/request IDs;
5. call the shared #1049 SDK/gateway;
6. render the response.

Do not put business engines inside `admin/index.html`.

## 11. Role model

DirectAdmin roles are presentation/host-access context:

- admin;
- reseller;
- user.

They do **not** grant Titan business authority.

Canonical flow:

```
DirectAdmin authenticated identity
        ↓
DA → Titan actor mapping
        ↓
allowed company_id relationship
        ↓
entitlement
        ↓
capability visibility
        ↓
Titan effective authority
        ↓
governed execution
```

Fail closed when mapping is unresolved.

## 12. Shared Cockpit SDK — #1049

Every production Titan DA plugin should consume the SDK for:

- package validation;
- route/context detection;
- identity/company bridge;
- session/CSRF/origin protections;
- Evolution theme;
- responsive shell;
- navigation registry;
- widgets/cards;
- action-intent envelopes;
- capability client;
- evidence/provenance drawer;
- health/version/dependency state;
- diagnostics/support bundle;
- correlation IDs;
- degraded/read-only states;
- plugin-to-plugin deep links.

Do not copy these systems into every plugin.

## 13. Evolution theming

Plugins should visually behave like part of DirectAdmin.

Requirements:
- support light and dark modes;
- use Evolution/theme CSS variables where available;
- supply safe fallback values;
- never overwrite DirectAdmin skin files;
- remain usable if theme metadata is unavailable;
- responsive keyboard-accessible layout;
- shared tokens/components should come from #1049/#1052.

Avoid hard-coded white pages.

## 14. GET/POST input

DirectAdmin passes request data through its plugin execution environment, not a normal Apache/PHP-FPM request.

Do not assume web-server PHP globals behave identically.

Use the shared SDK request parser once #1049 lands.

Until then:
- inspect `QUERY_STRING`;
- inspect DirectAdmin environment variables;
- normalize request method/body deliberately;
- test inside real Evolution;
- do not infer correctness from local PHP CLI alone.

## 15. CSRF and session handling

CSRF/session handling must be centralized in #1049 and validated in real DirectAdmin Evolution.

Hard rules:
- state-changing requests require anti-CSRF/origin/session protection;
- unresolved/invalid state fails closed;
- do not disable CSRF simply because DirectAdmin authenticated the page;
- never expose session secrets in diagnostics;
- provide a GET-only redacted support bundle so broken POST flows can still be diagnosed.

Known lesson: plugin CGI/CLI execution does not behave exactly like a conventional PHP web app. Test the actual wrapper.

## 16. Diagnostics requirement

Every Titan plugin must expose a read-only diagnostics/support bundle.

Include:
- plugin ID/version;
- DirectAdmin level;
- effective Unix UID/GID;
- relevant HOME/CWD/path;
- dependency versions;
- Titan gateway/node reachability;
- company mapping status;
- enabled capabilities;
- health/degraded dependencies;
- request metadata;
- package/update state;
- redacted security/session diagnostics;
- evidence/correlation IDs.

Never include:
- private SSH keys;
- passwords;
- API tokens;
- database credentials;
- raw secret files;
- unredacted customer PII without explicit need.

Provide a **Copy Full Diagnostics** action.

## 17. Static assets and richer front ends

The plugin executable can render HTML directly or bootstrap a richer client.

Use `images/` or other supported plugin static-resource paths for CSS/JS/images.

For complex cockpits:
- keep authentication/context server-side;
- serve a small JS application if useful;
- call Titan APIs through a constrained gateway;
- never put raw provider credentials in browser JS;
- do not make client-side state authoritative.

React/Vue/Svelte/etc. can be built ahead of time and served as static assets while the DirectAdmin executable entrypoint handles secure bootstrap/context.

## 18. Long-running runtimes

Do not try to run the full Titan Workforce or Frappe inside a short-lived plugin page process.

The DirectAdmin plugin is the **control plane UI/orchestrator**.

Long-running components belong in:
- systemd services;
- supervised processes;
- containers;
- Frappe bench/services;
- Node/TypeScript services;
- worker daemons.

The plugin observes/controls them through stable contracts.

## 19. Privileged operations

Prefer:
1. DirectAdmin APIs;
2. existing DirectAdmin task queue/CustomBuild;
3. canonical Titan provider/helper APIs;
4. narrow privileged helper;
5. arbitrary root shell only as exceptional emergency tooling.

Never:
- `sudo ALL`;
- expose unrestricted root terminal to ordinary users;
- equate DA Admin/root privilege with Titan authority.

Privileged helper design:
- explicit command/capability allowlist;
- typed parameters;
- reject shell fragments;
- company/actor correlation;
- timeout;
- receipt/evidence;
- observed-state verification.

## 20. Multi-language porting strategy

Existing Titan code should be **assigned**, not blindly copied.

### TypeScript/Node code

Preferred:
- keep canonical implementation in `packages/` / `services/`;
- expose local HTTP/Unix socket/MCP/capability gateway;
- DirectAdmin plugin calls it.

Use Node entrypoints directly only when Node availability is guaranteed by the Server Node profile.

### PHP donor code

Can often be reused directly for:
- DirectAdmin entrypoints;
- host integrations;
- WordPress;
- legacy donor algorithms.

Move business authority/state ownership into canonical Titan boundaries before adoption.

### Python

Excellent for:
- diagnostics;
- data processing;
- ML/system scripts;
- deployment/support tooling.

Call from a bounded service/helper or executable plugin subcommand.

### Shell

Use for:
- install/uninstall;
- packaging;
- service lifecycle;
- narrow orchestration.

Do not implement large business logic in shell.

### Go/Rust/native

Good for:
- narrow privileged helper;
- high-confidence system capability;
- performance-sensitive agent/helper;
- single-binary utilities.

Pin architecture/release artifacts and verify signatures/hashes.

### Flutter/Dart

Mobile UI stays in mobile. Do not move Flutter source into DirectAdmin. Expose/configure the mobile/Edge system from Operations.

### React/Next.js/web code

Reuse components/presentation logic where appropriate, but compile an embeddable/static cockpit client or consume canonical APIs. Do not transplant a whole web business runtime into the plugin.

## 21. Business Evidence requirements

Consequential plugin operations follow:

```
Intent
→ Decision
→ Risk
→ Assurance
→ Effective Authority
→ ExecutionGateway
→ Provider effect
→ PROVIDER_ACKNOWLEDGED
→ observed-state verification
→ VERIFIED
→ Business Evidence Ledger
```

The plugin must not display provider ACK as final verified success.

## 22. Frappe/ERPNext Business Engine

#1051 is the operational domain substrate managed by DirectAdmin.

DirectAdmin owns its lifecycle:
- provision company site/database;
- enable modules;
- vertical overlays;
- migrations;
- backup/restore;
- health;
- reconciliation;
- upgrades;
- retirement.

Titan surfaces must consume a Titan Domain API/anti-corruption layer, not bind directly to Frappe DocTypes.

Default:
- shared versioned runtime/application code;
- per-company site/database;
- `company_id` remains canonical Titan identity/evidence boundary.

## 23. Plugin lifecycle

Every plugin needs:

### Install
- verify package structure;
- detect dependencies;
- create plugin-owned state only;
- register/update safely;
- fail loudly;
- never destroy user/business state on failed install.

### Update
- compatibility/preflight;
- backup plugin-owned mutable config if needed;
- atomic/rollback-safe activation;
- preserve customer/business data.

### Uninstall
- remove plugin-owned code/config;
- leave canonical business state intact;
- do not delete user SSH keys/repos/data by default;
- explicitly retire/revoke temporary credentials if plugin owns them.

## 24. Package builder

Every plugin should have a repeatable packaging tool.

Example output:

```
dist/titan_operations.tar.gz
```

Builder must:
1. stage source in clean temp dir;
2. apply executable bits;
3. exclude dev/test/secrets;
4. create flat archive;
5. verify `plugin.conf` root;
6. verify required entrypoints;
7. syntax/lint/test supported languages;
8. extract final tarball to new temp dir;
9. validate again;
10. optionally create SHA-256 manifest.

## 25. Security checklist

Before release:
- path traversal;
- shell injection;
- argument injection;
- XSS/output escaping;
- CSRF/session/origin;
- cross-user access;
- cross-company access;
- secret leakage;
- SSRF if URLs accepted;
- arbitrary file read/write;
- unsafe archive extraction;
- privilege escalation;
- replay/idempotency;
- stale authority;
- provider-ACK false success;
- diagnostic redaction.

## 26. Verification tiers

For simple UI/read-only plugin:
- package validation;
- syntax/lint;
- route smoke;
- role/permission tests;
- theme light/dark;
- diagnostics.

For operational/mutating plugin:
- all above;
- company isolation;
- authority denial;
- CSRF/session;
- idempotency;
- provider failure;
- verification failure;
- restart/recovery;
- rollback;
- evidence correlation.

## 27. Real-server install certification

Do not call a DirectAdmin plugin finished until tested on a real clean target.

Minimum:
1. install via Plugin Manager;
2. active status;
3. admin route;
4. applicable reseller/user routes;
5. light/dark rendering;
6. GET/POST behavior;
7. diagnostics;
8. dependency degradation;
9. update;
10. uninstall;
11. reinstall;
12. state preservation.

## 28. Known server-validated lessons from Titan Dev Access

These failures already happened and must not recur:

### Missing plugin.conf
Cause: wrong archive root/layout.

### chmod final path not found
Cause: install script assumed final DirectAdmin path before installation finished.

### plugin active but route 404
Cause: plugin/archive ID mismatch.

### plain white UI
Cause: no Evolution-aware styling.

### broken POST/CSRF
Cause: treating plugin execution like a normal PHP web application; centralize/test real Evolution behavior.

The current donor/reference:
`apps/directadmin/dev-access/AGENTS.md`.

## 29. Source ownership rule

DirectAdmin plugins should **reuse current Titan code**, but not move every canonical source file under `apps/directadmin`.

Use this rule:

- canonical reusable business/runtime implementation stays in `packages/` / `services/`;
- DirectAdmin-specific UI/adapter/orchestration code lives in `apps/directadmin/<plugin>/`;
- privileged/server composition belongs to canonical deployment/provider owners;
- donor code may be ported into canonical owners first, then exposed through plugins.

This preserves one implementation across PWA, mobile, browser, AI hosts and DirectAdmin.

## 30. Definition of done for a Titan DirectAdmin plugin

A plugin is done only when:

- canonical owner/issue is identified;
- source/reuse matrix recorded;
- no duplicated truth/authority/runtime owner introduced;
- package builds reproducibly;
- flat archive validated;
- exact plugin ID/routes validated;
- role access correct;
- company mapping fails closed;
- entitlement and authority separated;
- operational actions traverse governed execution;
- provider ACK and verification separated;
- evidence correlation present;
- diagnostics/support bundle works;
- light/dark/responsive UX works;
- update/rollback/uninstall behavior verified;
- real DirectAdmin install certification passes.



## 19. Company provisioning and privileged mechanics

Company provisioning is a Titan lifecycle, not a DirectAdmin shell script.

Canonical flow:

```
Titan provisioning intent/state machine
        ↓ governed capability request
#322 deployment/resource contract
        ↓
#812 bounded Server Node provider
        ↓
filesystem/database/service mechanic
        ↓
provider receipt
        ↓
independent observed-state verification
        ↓
Titan provisioning evidence / READY
```

For the default native SQLite company profile, the Titan service identity should normally create company databases inside a pre-provisioned writable `TITAN_COMPANY_DATA_ROOT` without root. Privileged setup is reserved for establishing/repairing host-level directories, ownership, service units, TLS/firewall, container/runtime resources and similar mechanics.

Production provisioning must not call the Titan Dev Access arbitrary terminal. Dev Access is diagnostic/developer tooling and runs in the current Unix account boundary. Production privileged helpers/providers require typed allowlisted operations, strict schemas, approved-root path canonicalization, traversal/symlink-escape rejection, idempotency, bounded execution, redacted receipts and independent verification. DirectAdmin/Admin/root identity never grants Titan business authority.
