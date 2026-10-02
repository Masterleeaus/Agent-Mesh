# DirectAdmin plugin release runbook

The portfolio release is built from a clean checkout with:

```bash
node scripts/package-directadmin-portfolio.mjs dist/directadmin
```

The output contains the exact plugin-ID archives `titan-server-node.tar.gz` and `titan_dev_access.tar.gz` when both enabled source trees are present, plus `provenance.json` with version, source path and SHA-256 for each artifact. Archives are flat, use normalized ownership/timestamps, reject symlinks, and explicitly set role/lifecycle executable modes.

## Automated release checks

CI runs the portfolio packaging tests, builds all enabled archives, validates the Server Node manifest, and runs shell syntax checks. The tests cover flat archive roots, stable filenames, executable entrypoints, provenance output, and symlink rejection.

## Disposable-host certification

The following remains a live-host check and must be recorded against the exact artifact checksum before a plugin is called released:

1. install the archive with DirectAdmin Plugin Manager;
2. verify Active state and each applicable admin/reseller/user route;
3. exercise light/dark Evolution rendering and diagnostics;
4. run update, rollback to the previous checksum, uninstall, and reinstall;
5. confirm plugin-owned state is preserved as intended and canonical business data, SSH keys, and unrelated files are untouched.

DirectAdmin role or Unix root status is never Titan business authority. Plugin install/update/uninstall scripts must remain self-locating and operate within their declared privilege boundary. No live-host certification is claimed by the repository workflow alone.
