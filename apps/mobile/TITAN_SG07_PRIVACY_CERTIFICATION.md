# TZ-ROADMAP-47-SG-07 — Hub privacy / isolation checkpoint

## Verified static invariants
- Hub remains a customer-authorised projection, never an independent authority plane.
- `company_id` and customer identity must match the expected projection scope.
- Internal provider keys, API keys, storage topology, risk scores, internal notes,
  workforce hierarchy, authority/capability tokens and device secrets are rejected.
- Customer and commercial workforce intents preserve canonical `agent_id`.
- Offline state cannot elevate authority.
- Consequential Hub intents must re-enter Command Bus execution.
- Commercial/offline consequential intents require server revalidation.
- Canonical surface is `hub`; legacy/non-canonical surfaces are rejected.
- No Hub-specific workforce identity is introduced.

## Runtime certification
Flutter/device runtime certification is not claimed in this environment. The
checkpoint is static-contract complete and remains subject to physical-device,
backend authority, Command Bus and server-revalidation integration testing.
