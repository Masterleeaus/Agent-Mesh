# Interaction Engine Adapter

Pass 9 makes Titan Interface Runtime a presentation consumer of Titan Interaction Engine v10.5.x contracts.

## Authority boundary

Interaction Engine remains authoritative for wizard definitions, branching, validation, session persistence, progress, checkpoints, offline mode, journey handoffs, governance, approvals and execution. Interface Runtime does not copy those algorithms or persist wizard answers.

## Soft runtime bridge

The adapter resolves these Interaction Engine services by container key, without concrete PHP imports:

- `WizardSessionStoreInterface`
- `WizardSessionAccessPolicy`
- `HybridRenderer`
- optional `JourneyRunStoreInterface`

The Interaction Engine access policy is invoked before any session presentation is returned. Tenant/user/roles come from the immutable Interface Context, not request parameters.

## Presentation modes

One persisted session can be projected as:

- `chat` / `conversational`
- `panel` / `hybrid`
- `full-workspace` / `structured`

All modes retain the same `session_id`, `resume_key`, source snapshot fingerprint, wizard progress, offline classification and journey state.

## Safety

- accumulated wizard `data` is not copied into Interface Runtime snapshots;
- raw Interaction Engine `context` and `command` payloads are stripped;
- generated `submit` / `pause` actions become non-executable intents with `authority=titan-interaction-engine`;
- Interface Runtime exposes no answer/approve/execute endpoint in this pass;
- session access failures fail closed without revealing whether the session exists.
