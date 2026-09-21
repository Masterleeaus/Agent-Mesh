# Remaining work

## ✅ Resolved Items (2026-06-28)

| Item | Status |
|------|--------|
| ~~SDK Import Bug (lemma-sdk.ts `'./types'` → `'../types'`)~~ | ✅ **Resolved** |
| ~~ESLint Configuration~~ | ✅ **Added** |
| ~~`.env` File Usage~~ | ✅ **Verified gitignored** |
| ~~Import paths across all 5 apps (191 TS errors)~~ | ✅ **Resolved** |
| ~~Missing `tech-suggester` agent~~ | ✅ **Created** |
| ~~Missing workflow functions (4)~~ | ✅ **Created** |

## High Priority

### 1. npm workspace Setup
Create proper npm workspace configuration to eliminate duplicate dependency declarations across all 5 apps. See `DEPENDENCY_REPORT.md` for details.

### 2. Testing Coverage
- `support-queue` has vitest tests; other 4 apps have no tests
- Python function tests exist for both functions (79/79 passing)

### 3. CI/CD Pipeline
No CI configuration exists. Consider adding GitHub Actions for:
- Pull request validation (type-check, lint, test)
- NPM workspace install + build

## Medium Priority

### 4. Prettier Configuration
No Prettier config exists despite it being the default formatter. Add shared Prettier config.

## Low Priority

### 5. Docker / Infrastructure
`infrastructure/` folder is empty. No Docker, docker-compose, or deployment configs exist.

### 6. workflows Folder
`workflows/` folder is empty. No Lemma workflow definitions exist.

### 7. Documentation Consolidation
Multiple `ARCHITECTURE.md` and `README.md` files exist inside each app. Consider whether these should be consolidated or linked from root docs.

### 8. Git History
Repository has no commits. First commit needs to be made.
