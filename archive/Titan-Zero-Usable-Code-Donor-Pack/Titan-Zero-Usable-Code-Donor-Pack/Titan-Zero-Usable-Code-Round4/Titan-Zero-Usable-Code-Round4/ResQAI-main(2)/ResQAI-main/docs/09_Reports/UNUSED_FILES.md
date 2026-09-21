# Unused / Dead File Report

## Files Moved to Archive

### `apps/shared/` (Duplicate)
- **Status**: Identical to `shared/sdk/lemma-sdk.ts` and `shared/types/index.ts`
- **Reason**: Nothing imports from `apps/shared/`. All apps import from `../../../shared/...`
- **Action**: Moved to `archive/apps/shared/`
- **Files**:
  - `archive/apps/shared/lemma-sdk.ts` (132 lines)
  - `archive/apps/shared/types.ts` (182 lines)

## Files Left in Place (Build Artifacts / Caches)

### `apps/support-queue/dist/`
- Build output (index.html). Can be regenerated with `npm run build`.
- Should be added to `.gitignore`.

### `functions/*/.pytest_cache/`
- Pytest cache directories (2 functions, ~13 files total).
- Should be added to `.gitignore`.

### `**/__pycache__/`
- Python bytecode cache directories.
- Already excluded in VS Code settings; should also be added to `.gitignore`.

### `**/package-lock.json`
- 5 lock files (one per app) — required without npm workspaces.
- Leave unchanged unless switching to npm workspaces.

## Note on `.gitignore`
No `.gitignore` file exists in the repository. The following should be gitignored:
- `node_modules/`
- `dist/`
- `__pycache__/`
- `.pytest_cache/`
