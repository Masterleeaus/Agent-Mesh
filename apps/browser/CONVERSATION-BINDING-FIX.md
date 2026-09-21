# Titan Code v2.11.0 — Conversation Binding Fail-Closed Repair

## Root cause
Titan Code's recovery layer allowed two unsafe cases for plans that originated on provider new-chat/root pages:

1. Automatic content-receiver recovery could reload a provider root/new-chat URL when the extension receiver was missing.
2. A provisional new-chat plan identity could promote/rebind to a different structured conversation based only on provider equality, without proving that the structured conversation descended from the same provisional page session.

The Active Plans Stop & Clear feature did not modify the service worker and was not the cause of the routing defect.

## Repair
- Automatic recovery reloads now require a stable structured conversation URL.
- Provider root/new-chat pages fail closed instead of being auto-reloaded.
- Provisional -> structured promotion requires the exact provisional lineage token reported by the same page session.
- Orphaned provisional plans no longer attach to arbitrary conversations on the same provider.
- Existing exact structured conversation rebind behavior is retained.

## Verification
- Added regression coverage for new-chat reload prevention, provisional promotion lineage, and provisional orphan rebind lineage.
- Updated one historical test that encoded the unsafe provider-only rebind behavior.
- Full Titan verifier passes after source-manifest regeneration.


## v2.11.1 concurrency correction
The v2.11.0 conversation-global ownership guard was too restrictive for the established multi-conversation runner model. Active-plan ownership is now tab-scoped again: each open ChatGPT/Claude conversation tab can own an independent plan concurrently. Exact conversation identity is still retained for routing/recovery validation, but it no longer acts as a global mutex across tabs.

The same-tab replacement guard remains fail-closed, so a second plan cannot silently overwrite an active plan in the same tab.
