# Titan Apps: Interaction Engine — Agent 2 Production Hardening Pass 2

Version: 10.7.0

This pass adds a compatibility-safe construction path for public interaction contexts.

`InteractionContext` remains strict and accepts only canonical `zero`, `go`, and `hub` surfaces. The new public `InteractionContextFactoryInterface` canonicalizes legacy aliases before construction, so compatibility does not weaken the canonical value object.

Notable behavior:

- `command`, `bos`, `owner`, `manager`, `business` -> `zero`
- `field`, `worker` -> `go`
- `customer` -> `hub`
- legacy `onboarding` surface -> `surface: zero`, `journey: onboarding`
- onboarding on Go or Hub fails closed

The factory is registered through the Interaction Engine service provider and exposed as a public contract for wider-platform callers.
