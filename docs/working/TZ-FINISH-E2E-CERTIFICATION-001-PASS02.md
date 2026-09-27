# TZ-FINISH-E2E-CERTIFICATION-001 — Pass 02

## Outcome
Created a reusable deterministic Playwright certification harness on authoritative Merge64.

## Reuse-first implementation
- Retained all 14 existing E2E specs and existing Playwright configuration structure.
- Reused the seeded two-company contract from `db/migrations/002_seed_dev.sql`.
- Company A provides owner/admin/tech actors; Company B provides a separate owner for deliberate isolation tests.

## Added harness
- `tests/e2e/support/certification-env.ts` — company/user seed identities, deterministic label generation, run namespace and seed validation.
- `tests/e2e/support/certification-fixtures.ts` — reusable Playwright fixture plus API authentication that asserts returned account/company and role.
- `tests/e2e/certification/harness-contract.spec.ts` — validates primary/isolation identities and deterministic company-sensitive fixture labels.
- `tests/e2e/certification/harness-contract.generated.json` — machine-readable harness contract.
- `playwright.config.ts` — stable `en-AU` locale, Australia/Melbourne timezone and managed E2E login-rate-limit disablement.

## Safety invariants
- `company_id`/seed account boundary remains explicit.
- Authentication fixtures do not grant authority; they only authenticate known seeded actors and assert the returned role/account.
- No production mutation path, permission model or runtime authority was changed.

## Verification
- Changed/focused TS syntax transpile: 5/5 PASS.
- Harness static contract: 9/9 PASS.
- Certification JSON evidence parse: 2/2 PASS.
- Full Playwright execution unavailable in reconstructed canonical because `node_modules` and `pnpm` are absent.
