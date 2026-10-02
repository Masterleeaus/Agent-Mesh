# Developer Portal for DirectAdmin

The DirectAdmin **Developer Portal** is private/operator tooling for diagnosing and safely inspecting a Titan Business Node. The installed machine/plugin ID remains `titan_dev_access` for compatibility.

Current implemented slice:

- Evolution-aware light/dark UI.
- Runtime diagnostics for Git, SSH, PHP, Composer, Node/npm/pnpm and curl.
- SSH public-key add, fingerprint and revoke. Installed keys are rendered by fingerprint only.
- HOME-scoped working-directory validation using canonical `realpath` boundaries.
- Fail-closed command classification for READ, VERIFY, BUILD/TEST, WRITE and UNKNOWN operations.
- Read/verify/build-test terminal allowlist only; shell chaining, redirection, Git mutation, package installation, destructive and privileged commands are rejected.
- 30-second command timeout and a true 512 KiB streaming output ceiling that terminates over-limit processes.
- Copyable diagnostics with token/password/cookie/private-key redaction.
- DirectAdmin CLI request handling for bounded environment POST fields and optional `pipe_post=yes` stdin bodies, with strict duplicate/array/malformed-input rejection and the installed `csrf` field name.
- Effective-user-bound HOME validation for DirectAdmin CLI requests, including account-scoped CSRF tokens.
- No private-key storage and no automatic sudo/root elevation.

Version 1.3.1 changes only request transport and form compatibility. It keeps the `titan_dev_access` plugin ID, CSRF secret path/token derivation, SSH key paths and flat archive identity; it adds no persistent data migration. Retain the last server-validated archive until DirectAdmin accepts and verifies this candidate. Live upgrade and downgrade behavior still require a disposable-host check.

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
