# Apps agent boundary

Inherits the root `AGENTS.md`.

## Purpose
`apps/` contains several distinct application classes: the full base web application (`apps/web`), the one PWA with Zero/Go/Hub modes, the one native mobile app with the same modes, DirectAdmin operator plugins, Browser/Desktop nodes and channel/host adapters. Apps may provide rich product UX, but they do not own duplicate canonical business truth.

## Rules
- Reuse `packages/` and canonical service contracts for business behavior.
- Do not copy domain, authority, evidence, tenancy, scheduling, payment, customer, workforce, or execution logic into a surface for convenience.
- Keep `company_id` propagation explicit across every server/API boundary.
- Zero/Go/Hub modes in PWA/mobile must project truthful canonical state. Do not create three separate PWA products. Do not treat `apps/web` as the PWA; it is the separate full base web application. Demo/mock state must be isolated and unmistakably non-production.
- Channel-specific adapters may translate protocol/UI concerns, but consequential actions still use governed execution.
- When changing a shared API contract, verify both the app and its canonical provider.
- UI-only work: Tier 1 verification. Cross-boundary/API/execution work: Tier 2 or Tier 3 per root contract.
