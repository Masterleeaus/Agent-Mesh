# Titan Dev Access for DirectAdmin

A lightweight DirectAdmin plugin that provides:

- Evolution-aware light/dark UI.
- Server diagnostics for Git, SSH, PHP, Composer, Node/npm/pnpm and curl.
- Bounded command terminal (30 seconds / 512 KB output).
- SSH public-key add, fingerprint and revoke.
- No private-key storage and no automatic sudo/root elevation.

## DirectAdmin install artifact

The install archive **must** be named exactly:

`titan_dev_access.tar.gz`

Do not add version, `-fresh`, `-rebuilt`, or other suffixes to the install filename.

Build with:

```bash
bash tools/package.sh
```

The resulting archive is written to `dist/titan_dev_access.tar.gz`.

See `AGENTS.md` for the server-validated DirectAdmin packaging and routing rules.
