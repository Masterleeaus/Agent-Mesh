# Cleaning-first DirectAdmin three-plugin release candidate

Status: reproducible local package candidate; **not authorized or ready for host installation**. This is a bounded integration handoff for [#1157](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/issues/1157), not portfolio certification and not a claim of live DirectAdmin acceptance.

Initial launch scope is **cleaning only**. Other vertical source and packs remain in the repository but are deferred from default UI, this candidate's acceptance, and launch certification. Reuse existing company-scoped cleaning defaults and shared CRM/booking/scheduling/jobs/evidence/payment owners; do not fork a cleaning backend or copy their state. No pricing, regulatory/compliance claim, or chemical-safety advice is supplied as a default.

## Pinned source and package artifacts

All artifacts below were rebuilt from repository source pin `4efc5cdf80fe4998778cff4b73078bdab608d3da` (current `main` at build time), with Node `v24.19.0` and the root `esbuild@0.28.1` compiler checked by the packager. Source-tree IDs help detect substitution within that pin.

| Install name / display label | Version | Source path tree | Archive SHA-256 | Dependency |
|---|---:|---|---|---|
| `titan-server-node` / `titan-server-node` | `0.3.0` | `apps/directadmin/server-node` `ffb2ce077426dfd5400f37ebdba858d989b9db0c` | `580676074d64c431f9d635908f1f71f05aae110b6882f8ace3c2aea0c06f975d` | None |
| `titan_dev_access` / `Developer Portal` | `1.3.8` | `apps/directadmin/dev-access` `97233af44b03f3b8aca586ed37c03a650ff0f9ab` | `a857914ce0cb5e644e00bb964aa3da4c405cd6c1f3589d18967d27a5cff036e7` | None |
| `titan_workforce` / `Titan Workforce` | `0.1.5` | `apps/directadmin/workforce` `fbcc594374f94323fd929e47640c87c5eaf61b29` | `aea2f434f42cb6687b1b05b17507003b915f8d5dc571272f2ced5f04e05068e4` | Exact Server Node archive above |

Workforce embeds the shared #1049 SDK. The source is `packages/titan-platform/src/directadmin-plugin.ts`, blob `c4c59c35019716718472f7b9eb01683b8d527852`, SHA-256 `c4a45025347733e2d4a0735dc6b68c9e6335484da1b54967582bb0e34d561489`. Its package declares SDK compatibility `1.0.0`. The deterministic browser bundle was built by `esbuild@0.28.1` with `--bundle --format=esm --platform=browser --target=es2022`; bundle SHA-256 `7c08d37f6ea274760f8e52092b2e86a07a93ae175fe4a6216df9156d1fc39681`.

The current-main archives and generated `provenance.json` are in `/tmp/titan-three-plugin-current-4efc5cdf`, then assembled with the supported cleaning defaults below in the ignored workspace directory `dist/directadmin-cleaning-candidate-4efc5cdf`. They are local review artifacts, not published release files. The Developer Portal archive is now v1.3.8; an earlier v1.3.7 candidate from commit `9124b793` is stale and must not be substituted for this one.

To regenerate the selected three IDs with the existing portfolio packager:

```sh
node --input-type=module <<'NODE'
import { ENABLED_PLUGINS, packagePortfolio } from './scripts/package-directadmin-portfolio.mjs';
const ids = new Set(['titan-server-node', 'titan_dev_access', 'titan_workforce']);
const plugins = ENABLED_PLUGINS.filter(({ id }) => ids.has(id));
packagePortfolio({ plugins, outputDir: '/tmp/titan-three-plugin-current-<source-sha>' });
NODE
```

### Supported cleaning defaults included alongside the plugin archives

The candidate directory also contains the existing module asset `cleaning-workforce.bundle.json`, pinned to Git blob `9dd77474f7d94333cb3e691bf7ab9658b77b8a40` and SHA-256 `fede4f9188cef2423d035ab1681d014222da70298dd49b25d9fce6ad708f65b1`. It is bundle `titan.cleaning-workforce-pack` v`1.0.0` (`titan-module-bundle/v1`), with 16 cleaning specialists and the following seven canonical job types/checklists:

| Job type ID | Display label | Checklist items |
|---|---|---:|
| `domestic_recurring` | Domestic recurring clean | 7 |
| `deep_clean` | Deep clean | 7 |
| `bond_end_of_lease` | Bond / end-of-lease clean | 8 |
| `airbnb_turnover` | Airbnb / short-stay turnover | 8 |
| `commercial` | Commercial cleaning | 8 |
| `move_in` | Move-in clean | 6 |
| `office` | Office clean | 7 |

These are the existing supported defaults, not copies embedded in a DirectAdmin plugin archive. `titan_workforce` does not yet consume or render this module projection; the company-bound pack install/configure/upgrade lifecycle belongs to #1057 and is not wired into this candidate. A source search found no cleaning bundle consumer or binding in the packaged Workforce client/SDK. Until #1050 and #1057 agree and verify that composition, the attached bundle is a payload-only pinned input—not an activated company configuration and not proof that any of the 16 specialist profiles run in the plugin. The seven default job types carry no company prices; pricing inputs remain company setup. The bundled common role catalogue remains shared infrastructure; this release does not certify other verticals.

## Host compatibility and current stop conditions

| Requirement | Source requirement | Previously reported host observation | Release effect |
|---|---|---|---|
| Node runtime | Server Node requires Node 20+ at its configured `/usr/bin/node`; Workforce requires Node 22+. Use Node 22+ for the combined candidate. | `/usr/bin/node` v16.20.2. | **Fails.** Do not overwrite the RPM-owned executable or change the host package source without an approved package plan. |
| PHP CLI | Developer Portal requires PHP 7.4.0+ for its argv-form `proc_open` path; check the DirectAdmin-selected CLI, not FPM alone. | PHP-FPM 7.4/8.3 was reported; PHP CLI was not found in this execution environment and the DirectAdmin CLI selection was not verified. | **Unverified / fails local CLI check.** |
| OS and architecture | Linux host; package contains no native build step. | AlmaLinux 9.8 x86_64 was reported. | Compatible as a candidate platform; not a DirectAdmin certification. |
| DirectAdmin | A supported-version range is not declared by all three manifests. | DirectAdmin 1.711 was reported. | **Uncertified.** Exercise the exact host version on an authorized disposable panel first. |
| systemd and lock utility | Server Node uses systemd and util-linux `flock`. | systemd 252 and `flock` 2.37.4 were reported present; the systemd bus was denied in the sandbox. | Installed-component check only; live service state is unknown. |

The host report also described Apache 2.4.68, MariaDB 10.6.28, CSF/LFD, PHP-FPM 7.4/8.3, 1 CPU, and about 1.7 GiB RAM. These are prior, sandbox-limited observations, not a fresh host inspection. Preserve Apache, CSF/LFD, MariaDB, and existing sites. No host command, installation, service, firewall, database, credential, DNS, or site change was performed for this candidate.

**Do not install this candidate yet.** The current Server Node README marks `0.3.0` experimental and not approved for host installation. The package builder emits that same manifest version, so this rebuilt digest is not a release-version approval. Its production RAW relay returns sanitized `503 cookie_boundary_unverified` before reading configuration or connecting upstream. The current source deliberately has no production relay configuration that can enable forwarding. The Workforce UI depends on that relay, so a green package build is not a usable Workforce session path.

## Conditional install order

This is the order for a later, separately authorized disposable-host acceptance run, after the stop conditions above are resolved. It is not an instruction to install now.

1. Verify the exact artifact checksums and runtime prerequisites. Stop if the installed `/usr/bin/node` is below 22, the DirectAdmin-selected PHP CLI is below 7.4, or an existing plugin lacks a verifiable retained package for rollback.
2. Install the approved Server Node release first because Workforce declares it as a package dependency. Do not use the current experimental `0.3.0` archive.
3. Install Developer Portal `titan_dev_access` as a separately verified diagnostic surface. It is not the Titan/ChatGPT login issuer and does not complete the #1300 nonce handoff.
4. Install Workforce only after #812, #811, #1049/#302, and #1300 provide a reviewed, production-composed relay/session path and a protected provider module. The present RAW 503 and absent trusted page composition are blockers, not settings to bypass.
5. Apply the pinned cleaning bundle only through the canonical company-bound pack lifecycle after #1057 provides that path. Keep company-specific service selections/pricing under onboarding and billing owners; do not manually copy checklist rows into the plugin.

## Configuration boundary

- Server Node's service is configured by `/etc/titan/server-node.env`, runs as `titan-node`, and uses `/usr/bin/node`. Its service state lives at `/var/lib/titan/server-node/control.json`; its control API defaults to loopback port 3015 and its health bridge to loopback port 3099. Tokens stay in protected host files and must never be copied into this record. The production DirectAdmin relay has no approved config; **do not create `/etc/titan/server-node-directadmin-relay.json` or attempt to enable forwarding**.
- Workforce's production DirectAdmin composition is optional behind `WORKFORCE_DIRECTADMIN_DEPENDENCIES_MODULE`. A real, protected absolute module path must export `createWorkforceDirectAdminDependencies`; the returned object must supply the approved public origin and gateway factory. The module must compose the real #302 issuer/nonce consumer and #1049 bridge. No fixture module or test key is a production configuration. Workforce service ports remain private/loopback.
- Developer Portal binds its CSRF state to the DirectAdmin Unix account HOME at `$HOME/.titan-dev-access/csrf.key`; expected modes are `0700` for the containing directory and `0600` for the key. Confirm the effective UID, account name and HOME mapping with the host owner. Keep key contents, SSH authorization-file contents, and all private keys out of logs, issues and chat. Portal terminal commands do not authenticate ChatGPT/Codex on the user's behalf.
- One exact HTTPS DirectAdmin `:2222` origin must eventually be agreed among #1049, #1050 and #811. A candidate hostname or successful login page does not prove cookie isolation. Do not expose ports 3010/3015 or forward generic DirectAdmin cookies through #812.

## Rollback material and acceptance procedure

Before any later host test, retain outside the plugin tree the exact currently installed archive and checksum for **each** plugin, plus the host owner's metadata-preserving plugin-tree backup. If any installed version lacks a verified restore archive, stop before update/remove. Candidate archives in `/tmp` are not rollback artifacts. The recorded Developer Portal v1.3.6 `pwd`/`id` smoke is not update or rollback proof; v1.3.2 and v1.3.3 are historical and are not validated rollbacks. Do not restore or remove CSRF keys, SSH `authorized_keys`, service credentials, company data, revocations or evidence as part of plugin rollback.

After code and commissioning blockers are cleared, run these checks on an authorized disposable DirectAdmin host matching the target version:

1. **Host preflight:** record sanitized OS, DirectAdmin version, architecture, `/usr/bin/node` package owner/version, selected PHP CLI/version, `systemd`, `flock`, free memory/disk, current plugin versions and service state. Confirm preservation boundaries for Apache, CSF/LFD, MariaDB and sites.
2. **Artifact preflight:** verify the three SHA-256 sidecars; confirm flat archive roots and executable modes; stage each archive in a disposable directory and run the package preflight. Keep the source SHA, archive SHA and provenance together.
3. **Server Node lifecycle:** use only a future approved Server Node archive. Verify service-user ownership, systemd activation, loopback-only listeners, `/live` versus `/ready`, failure behavior, restart and reboot. Validate that unavailable canonical identity/authority/provider adapters remain unavailable and that no host action is reported successful from process liveness alone.
4. **Developer Portal:** test admin, reseller and user routes through actual DirectAdmin CGI and its selected PHP CLI; valid/invalid CSRF; request framing; account HOME/UID binding; harmless `pwd`/`id`; SSH fingerprint display and safe add/revoke; malformed key and command denials. Preserve state and prove update failure/recovery without exposing key material.
5. **Trusted bootstrap:** complete #1300's trusted page renderer and server-side nonce issue/redeem path. Prove current DirectAdmin cookies remain inside the DirectAdmin trust boundary, the single-use nonce binds current operator/company/device/origin, and only a verified assertion reaches canonical session issuance. Test first login, document reload with an existing Titan cookie, renewal, expiry, replay, forged CGI identity, company switch and revocation. Do not weaken #812's cookie rejection to make this pass.
6. **Workforce:** through each role route, verify read-only projection, truthful unavailable state, typed denial with no writes, session reload/revalidation, company isolation and stale response clearing. Show that no controls or successful lifecycle result appear until the canonical owner publishes an authorized control and accepted evidence.
7. **Lifecycle and rollback:** install in the order above, update each candidate by verified digest, inject a failed update/activation, restore each retained archive through Plugin Manager, remove and reinstall. Confirm plugin-owned state policy, service state, SSH keys, CSRF state, unrelated files and canonical business/evidence state remain as expected.
8. **Evidence:** capture host/version and archive/source hashes, sanitized route/status/mode observations, owner reviews and exact commands/results. Mark any unavailable, failed or unrun condition literally. Only an actual matching DirectAdmin run can change the host-certification status.

## Verification recorded for this package candidate

Built on Node `v24.19.0` from repository pin `4efc5cdf80fe4998778cff4b73078bdab608d3da`; the packager verified `esbuild@0.28.1` against the root dependency declaration:

```text
node --test scripts/package-directadmin-portfolio.test.mjs apps/directadmin/workforce/tests/package.test.mjs
  16 passed, 0 failed
node scripts/validate-directadmin-plugin.mjs apps/directadmin/server-node
  valid: true
sha256sum --check dist/directadmin-cleaning-candidate-4efc5cdf/*.sha256
  all 4 OK (three plugin archives plus cleaning payload)
```

The package tests cover flat output, checksums, modes, dependencies, immutable publication and refusal of symlinked input. PHP CLI tests, browser/Playwright integration, the complete `pnpm gate:fast` / `pnpm gate`, DirectAdmin CGI, Plugin Manager lifecycle, Apache cookie isolation, production identity/bootstrap, service reboot and live rollback were not run here. No mock or sandbox result is represented as live-host certification.

The current-main canonical SDK contract was compiled from `packages/titan-platform/src/directadmin-plugin.ts` and exercised with:

```text
TITAN_COCKPIT_SDK_MODULE=/tmp/titan-canonical-sdk-4efc.mjs node --test \
  --test-name-pattern='real package satisfies the canonical shared SDK archive contract|canonical SDK accepts authority-neutral Workforce contribution|typed' \
  apps/directadmin/workforce/tests/sdk-contract.integration.mjs
  3 passed, 0 failed
```

This exact current-main contract distinguishes same-company typed authority denial (sanitized denial, no intent effect, refreshed same-company view remains ready) from a caller company-scope mismatch (session/content denied and cleared). The earlier cross-candidate report that expected `unavailable` came from a mismatched historical PR-head pairing; the current merged source/test pair passes. Do not substitute those historical build artifacts for this pinned candidate.

Cleaning acceptance was exercised against the existing canonical vertical projection source, with temporary TypeScript-to-ESM output removed after the run:

```text
node_modules/.bin/esbuild packages/titan-platform/src/verticals/cleaning/*.ts \
  --outdir=packages/titan-platform/.cleaning-test-dist \
  --outbase=packages/titan-platform/src --format=esm --platform=node --target=node24
node --test packages/titan-platform/tests/cleaning-vertical-pass*.test.mjs
  74 passed, 0 failed
```

This includes the Pass 10 residential reference lifecycle from onboarding through rebooking and checks that it remains projection-only, company-scoped, owner-preserving, and non-authoritative. It is a simulated vertical contract run: it does not write a hosted Workforce work order, create a customer/booking/invoice, send a message, collect payment, or prove the DirectAdmin plugin uses the module. Hosted Workforce cleaning consumption and a real company lifecycle remain unverified.

## Code/integration blockers versus operator commissioning

**Code/integration blockers:** the production relay is deliberately disabled; current #812 RAW bootstrap rejects existing Titan cookies while #1049 `connectCurrentSession()` can bootstrap on reload with that cookie; #1300's trusted page/nonce/proof composition is not implemented in current source (open PR #1354 is documentation-only); and #1050's DirectAdmin plugin does not consume/render the separate cleaning bundle. #1057's company-bound pack install/configure/upgrade/retire path is not integrated into this candidate. Keep the shared cleaning bundle as the only catalogue source; the required native binding and consumer projection need coordination between #1057 and #1050. Until that exists, the 16 specialist profiles and seven job types are payload data only, not runnable plugin features. Do not solve this with configuration, browser-supplied identity, broader cookie forwarding, or a plugin-local copy of the catalogue.

**Operator commissioning after code readiness:** select and install a vendor-owned Node 22+ runtime without overwriting RPM files; confirm DirectAdmin's PHP CLI; provision the real protected Workforce dependency/issuer module and nonce-store initialization; agree the exact `:2222` origin and private upstream; verify service state, cookie boundary, package ownership and backups on a disposable matching host. The prior sandbox report cannot satisfy these steps.

Issue #1157 remains open. This record is `Refs #1157`; package and fixture evidence do not complete the mission or certify the host.
