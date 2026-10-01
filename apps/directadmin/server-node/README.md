# Titan Server Node runtime

This package is the bounded DirectAdmin-hosted control-plane runtime. It owns node/control metadata only; company business records remain in their canonical isolated stores and evidence remains owned by the Evidence Ledger.

## Contract

The loopback API is versioned as `titan.server-node/v1`. Authenticated callers must send a bearer node token, `x-titan-schema-version: 1`, `x-titan-caller-id`, and `x-titan-correlation-id`. Company lifecycle intents additionally require `x-titan-company-id` matching the request body. `/v1/bootstrap` reports the node identity, supported capabilities, and ownership boundaries; `/v1/health` and `/v1/dependencies` expose dependency graph state.

The runtime accepts only governed intent envelopes and queues them at the canonical execution boundary. It never treats DirectAdmin/root/plugin privilege or provider acknowledgement as Titan authority or verified outcome. Replays with the same idempotency key and payload are returned safely; conflicting reuse, stale intents, missing authority/evidence references, schema mismatches, secret material, and cross-company calls fail closed. Control metadata is persisted atomically with restrictive permissions; company business records and secrets are never stored here. Checkpoint/restore is metadata-only and requires a matching manifest digest.

## Verification

Run `npm test` from this directory. The tests cover health/dependency projection, authentication/schema failures, stale and cross-company refusal, governed intent acceptance, replay idempotency, persistence across restart, and incompatible snapshot rejection. The systemd unit runs as the dedicated `titan-node` account with filesystem and privilege hardening; host installation must be performed by the server supervisor/package installer.
