# Legacy DOM Discovery Fallback

The existing Retriever DOM bridge remains supported only as a fallback path.

The typed adapter remains preferred. This wrapper can construct the existing `TITAN_EXECUTE_OUTCOME` transport only when negotiation has failed or declared the typed adapter unavailable and `fallback_allowed` is true. Every fallback produces `TITAN_LEGACY_DOM_FALLBACK_DEPRECATED` telemetry with no customer content. Fallback selection, telemetry, and runtime identity grant no permission or execution authority. Fallback is rejected when the typed path is ready.
