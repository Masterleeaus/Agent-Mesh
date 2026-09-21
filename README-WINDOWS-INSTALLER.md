# Titan Zero — Windows Installer Packaging Delta

This is an additive packaging layer for the current Titan Zero canonical source tree.

## What it does
- Keeps the existing Next.js standalone server architecture.
- Adds an Electron desktop shell with Node integration disabled in the renderer.
- Starts the packaged Next.js server on loopback only.
- Adds an NSIS Windows installer target (x64).
- Preserves the existing Titan Zero business/runtime code; no domain logic is replaced.

## Merge
1. Copy `electron/main.cjs`, `electron-builder.json`, `scripts/prepare-windows-runtime.mjs`,
   and `Build-Titan-Zero-Windows.ps1` into the canonical repository.
2. Semantically merge `PACKAGE-JSON-MERGE-FRAGMENT.json` into the root `package.json`.
3. Run `pnpm install --frozen-lockfile` after updating the lockfile for Electron dependencies.
4. Run `pnpm desktop:dist:win`.

Expected output:
`dist/windows/Titan-Zero-Setup-<version>-x64.exe`

## Verification still required on the canonical Merge67 bytes
- Clean dependency install.
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @ai-fsm/web build`
- desktop runtime preparation
- electron-builder/NSIS packaging
- clean Windows VM install, first launch, restart, uninstall/reinstall
- DB/API/environment configuration checks
- code signing before public distribution

This delta intentionally does not claim a final installer was built in the current Linux tool runtime.
