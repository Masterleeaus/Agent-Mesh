# Security tests

Implemented in `packages/tools/execution-gateway.test.mjs`: denied authority, credential material, company/domain scope, MCP discovery neutrality, false provider verification, concurrent duplicate and conflicting idempotency payload.

Outstanding: authority expiry/revocation against current canonical authority, browser prompt injection in an actual executor, provider timeout ambiguity, MFA/auth resume, cross-process duplicate effects, malformed replies, and verified delivery state. No consequential certification is claimed for these.
