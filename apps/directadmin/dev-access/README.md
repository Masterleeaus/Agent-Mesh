# Developer Portal for DirectAdmin

The DirectAdmin **Developer Portal** is private/operator tooling for diagnosing and safely inspecting a Titan Business Node. The installed machine/plugin ID remains `titan_dev_access` for compatibility.

Current implemented slice:

- Evolution-aware light/dark UI.
- Runtime diagnostics for Git, SSH, PHP, Composer, Node/npm/pnpm and curl.
- Read-only Git workflow readiness for canonical `agent/issue-N` branch naming and cached upstream ahead/behind counts. Git lazy fetching is disabled; it does not verify GitHub ownership or fetch/push. Probe outcomes carry explicit available, detached, unavailable, or unknown states. Failed, timed-out, or over-8-KiB probes produce unknown nullable readiness fields; they are never reported as clean, invalid, or absent. Detached HEAD is reported separately from a failed branch probe.
- SSH public-key add, fingerprint and revoke. Installed keys are rendered by fingerprint only.
- HOME-scoped working-directory validation using canonical `realpath` boundaries.
- Fail-closed command classification for READ, VERIFY, BUILD/TEST, WRITE and UNKNOWN operations.
- Read/verify/build-test terminal allowlist only; shell chaining, redirection, Git mutation, package installation, destructive and privileged commands are rejected.
- Exact Git read commands only: `status` (optionally `--short`), `diff --stat`, `diff --name-only`, `log --oneline -5`, `branch --show-current`, `rev-parse --short HEAD`, `ls-files`, and `describe --always --dirty`. All `remote` commands, Git config, global options, and other Git argument combinations are blocked.
- Before Git terminal commands or Codex-readiness probes, the worktree root, `.git` pointer, Git directory, common directory, and object alternates must resolve inside the account HOME. The Git child receives bounded fixed options with system/global config, credential helpers, hooks and fsmonitor disabled. Command output redacts URL userinfo.
- 30-second command timeout and a true 512 KiB streaming output ceiling that terminates over-limit processes.
- Copyable diagnostics with token/password/cookie/private-key redaction.
- DirectAdmin CLI request handling for bounded raw POST bodies from the `POST` environment value or stdin selected by `pipe_post=yes`; exploded per-field environment values fail closed. The parser rejects duplicate/array/malformed input and uses the installed `csrf` field name.
- Effective-user-bound HOME validation for DirectAdmin CLI requests, including account-scoped CSRF tokens.
- PHP 7.4.0 minimum from the production argv-form `proc_open` call; the no-setup hosted PHP workflow currently verifies PHP 8.3.6, and the DirectAdmin-selected CLI version still needs host confirmation.
- Guided workstation SSH setup displays the validated DirectAdmin Unix username, a validated configured host or panel-server-name fallback, and a configured port or default 22. The copyable command is client-side only; host/port overrides are not submitted. Admins see installed public-key fingerprints and a CSRF-protected public-key-only install form; reseller/user views remain read-only. A local-only one-line diagnostic distinguishes Windows `Load key: Permission denied` (client key-file access, before server authentication) from server `Permission denied (publickey)`, DNS, timeout, refusal, and host-key trust errors. It never reads a private key or submits diagnostic text.
- Read-only canonical Server Node health projection from the fixed loopback `/v1/status` endpoint; malformed, oversized or unavailable responses fail closed.
- No private-key storage and no automatic sudo/root elevation.

Version 1.3.8 is a source candidate for guided SSH connection setup and client-side error classification, on top of v1.3.7's read-only Git probe outcomes. It does not initiate SSH, read workstation files, mutate Windows ACLs, add server-side commands, change SSH key state automatically, or migrate persisted data. PHP and archive verification must pass on the exact candidate head; this source has not been installed. Compatibility from installed v1.3.6 to this candidate has not been verified. Preserve the v1.3.6 archive until disposable-host update/rollback checks pass.

The configured endpoint environment names are `TITAN_DEV_ACCESS_SSH_HOST` and `TITAN_DEV_ACCESS_SSH_PORT`; supply them only through the host's approved DirectAdmin PHP process configuration. The portal never accepts these values from POST. Hosts must be DNS names or IPv4 addresses, and ports must be decimal values from 1 to 65535. Without a configured host it uses `SERVER_NAME`; without a configured port it uses 22. The user may edit the visible endpoint in their browser to build a local command. Confirm the SSH endpoint with the server administrator.

Installed v1.3.6 carries the bounded DirectAdmin request bridge with exact terminal LF/CRLF normalization and a narrow stdin-only framing compatibility: one terminal raw NUL is removed only when CONTENT_LENGTH is absent or declares the preceding form bytes. It is not removed from environment POST transport, when included in CONTENT_LENGTH, or when repeated/interior; percent-encoded NUL and invalid UTF-8 continue to fail strict value validation. Rejection diagnostics may show only fixed terminal-byte class and byte counts, never form values or body bytes. This behavior reproduces the observed +1-byte stdin shape but remains an inference until the parent verifies it through the installed DirectAdmin form. The parser retains exact CSRF/action/role checks, strict duplicate/array/malformed validation and the existing command policy. PHP integration/security tests run the packaged role executables and use disposable account/repository fixtures only. The user's live smoke on 2026-10-02 passed actual same-page pwd and id forms on installed v1.3.6 only; it does not isolate terminal-NUL causality or certify other forms or roles. Update, uninstall, and rollback behavior remains unverified.

The previously Library-published v1.3.3 archive (SHA-256 `6145b02a9fc0626f31bf7350f881419cf5cfe41036879b724e5abf4c38addbbc`) is **not a safe current candidate**: independent synthetic probes found malformed or multiline SSH key payloads were accepted and Git remote commands were not actually read-only. Keep that historical artifact intact for audit, but do not install it or treat it as a rollback.

The committed v1.3.2 archive (SHA-256 `22b54eabaf2a12a5bba04c9b21d58f798f93b7c1a6845362035edf574c488755`) is historical and checksum-verified. It is not an operational rollback. v1.3.1 is also retained only as an artifact reference. No existing archive has been verified as a working rollback for the previously installed 1.1.3 or observed live 1.3.6 plugin. The retained v1.3.5 archive remains unchanged as a historical package candidate; its hash is recorded on issue #1048. v1.3.7's exact-head candidate hash and PHP gate are recorded on issue #1048. The v1.3.8 archive must be generated from the exact tested head, accompanied by a version/hash provenance sidecar, and independently reviewed before any publication or installation. Live DirectAdmin update, install, remove/reinstall, and rollback behavior still require a matching disposable-host check.

This plugin does **not** grant Titan business authority. Mutating or privileged repair work belongs to canonical governed execution and deployment/runtime owners.

## DirectAdmin install artifact

The install archive **must** be named exactly:

`titan_dev_access.tar.gz`

Do not add version, `-fresh`, `-rebuilt`, or other suffixes to the install filename.

Build and run the security/package verification with:

```bash
bash tools/package.sh
```

The resulting archive is written to `dist/titan_dev_access.tar.gz`.

See `AGENTS.md` for the server-validated DirectAdmin packaging, routing and live-host verification rules.
