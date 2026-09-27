# Agent 4 Final Verification

This directory contains the cross-system SQLite cleaning-business acceptance harness used by final-production verification. The harness composes existing canonical systems; it does not define a parallel runtime, workforce, authority or execution architecture.

The focused CI workflow intentionally bypasses the currently stale root pnpm lockfile only so acceptance tests can execute; the lockfile mismatch remains a separate production-readiness failure that must be repaired before final certification.
