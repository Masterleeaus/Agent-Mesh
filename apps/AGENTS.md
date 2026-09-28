# Apps agent boundary

Inherits the root `AGENTS.md`.

## Purpose
`apps/` contains Titan surfaces and channel/runtime adapters. Apps present or translate canonical state; they do not own duplicate business truth.

## Rules
- Reuse `packages/` and canonical service contracts for business behavior.
- Do not copy domain, authority, evidence, tenancy, scheduling, payment, customer, workforce, or execution logic into a surface for convenience.
- Keep `company_id` propagation explicit across every server/API boundary.
- Zero/Go/Hub interfaces must project truthful canonical state. Demo/mock state must be isolated and unmistakably non-production.
- Channel-specific adapters may translate protocol/UI concerns, but consequential actions still use governed execution.
- When changing a shared API contract, verify both the app and its canonical provider.
- UI-only work: Tier 1 verification. Cross-boundary/API/execution work: Tier 2 or Tier 3 per root contract.
