# Deployment release lifecycle contract

The canonical release lifecycle is `DRAFT -> BUILT -> VERIFIED -> ACTIVE`. Activation is impossible before verification, so a build cannot be switched into service without a verification record. Every transition carries an idempotency key and immutable event record; conflicting replays fail closed.

An active release may transition to `ROLLED_BACK` only when a previous-known-good version was declared at plan creation and rollback evidence is supplied. The contract is company-aware when a provider release is company-scoped, rejects legacy tenant boundary fields, and is authority-neutral: deployment state does not grant business authority or mutate business data.
