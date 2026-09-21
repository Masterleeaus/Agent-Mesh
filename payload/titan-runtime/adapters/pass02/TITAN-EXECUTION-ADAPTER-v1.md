# TITAN Execution Adapter Protocol v1

This protocol adds a typed, versioned envelope over Titan's existing Retriever/Monica runtime compatibility seams.

## Authority
Adapter discovery, activation, handshake, capability advertisement, and capability negotiation **never grant execution authority**. Canonical `company_id` remains mandatory on all work lifecycle messages. Existing policy, permissions, autonomy, approval, entitlement and risk gates remain downstream authority.

## Versioning
Versions use `major.minor`. Matching major versions negotiate the lower supported minor version. Major-version mismatch fails closed with `ADAPTER_VERSION_INCOMPATIBLE`.

## Capabilities
v1 capabilities are `work_submission`, `progress_observation`, `result_delivery`, and `cancellation`. Negotiation returns only the intersection. A negotiated capability is transport compatibility, not permission or authority.

## Lifecycle
`TITAN_ADAPTER_HELLO` / `TITAN_ADAPTER_HELLO_ACK` negotiate runtime compatibility. Work lifecycle uses `TITAN_WORK_SUBMIT`, `TITAN_WORK_ACCEPTED`, `TITAN_WORK_PROGRESS`, `TITAN_WORK_COMPLETE`, `TITAN_WORK_ERROR`, `TITAN_WORK_CANCEL`, and `TITAN_WORK_CANCELLED`.

Existing `TITAN_EXECUTE_OUTCOME` and `TITAN_OUTCOME_*` contracts remain untouched for compatibility. Later passes adapt them behind this typed layer rather than replacing them abruptly.

## Errors
Malformed envelopes fail closed as `ADAPTER_ENVELOPE_INVALID`. Errors carry no execution authority and are non-retryable unless explicitly marked otherwise.
