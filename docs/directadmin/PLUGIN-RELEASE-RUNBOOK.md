# DirectAdmin plugin release runbook

The portfolio release is built from a clean checkout with:

```bash
pnpm install --frozen-lockfile --filter . --ignore-scripts
node scripts/package-directadmin-portfolio.mjs dist/directadmin
```

The output contains `titan-server-node.tar.gz`, `titan_dev_access.tar.gz`, and
`titan_workforce.tar.gz`, each with a SHA-256 sidecar, plus `provenance.json`.
The Workforce archive uses the canonical Workforce package builder and a bundle
of `packages/titan-platform/src/directadmin-plugin.ts` built with the locked
`esbuild@0.27.3`. Provenance records the SDK source and compiled hashes and pins
Workforce's Server Node dependency to the exact version and archive hash in the
same portfolio. Archives are flat, use normalized ownership/timestamps, reject
symlinks, and explicitly set role/lifecycle executable modes.

## Automated release checks

CI installs the locked root build dependencies, runs portfolio and Workforce
package lifecycle tests, builds all enabled archives, validates the Server Node
manifest, verifies the isolated Developer Portal candidate, and runs shell
syntax checks. These checks prove package construction and disposable fixtures;
they do not certify a live DirectAdmin host or exercise a real manager rollback.

## Disposable-host certification

The following remains a live-host check and must be recorded against the exact artifact checksum before a plugin is called released:

1. install the archive with DirectAdmin Plugin Manager;
2. verify Active state and each applicable admin/reseller/user route;
3. exercise light/dark Evolution rendering and diagnostics;
4. run update, rollback to the previous checksum, uninstall, and reinstall;
5. confirm plugin-owned state is preserved as intended and canonical business data, SSH keys, and unrelated files are untouched.

DirectAdmin role or Unix root status is never Titan business authority. Plugin install/update/uninstall scripts must remain self-locating and operate within their declared privilege boundary. No live-host certification is claimed by the repository workflow alone.
