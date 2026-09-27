# Donor-First Browser Intelligence Pass 05 — Offscreen Inference Runtime

## Outcome

Titan Code now has a governed MV3 offscreen runtime under the existing `src/intelligence` architecture. It is intentionally a lifecycle/transport host, not a second intelligence controller.

## Reused donor implementation

Primary clean donor: Auto Browser v1.4.2 `src/offscreen-manager.js` (`sha256 65a33153794afa34744721657b3959546ada679c51eb52edc054a3443d4456a3`). The following behavior was retained with minimal conceptual change:

- ref-counted retain/release lifecycle;
- one shared offscreen document across concurrent retainers;
- serialized create/close operations;
- idempotent handling of Chrome's already-created/no-document races;
- no service-worker keepalive timer;
- `finally`-scoped release after each operation.

The donor `offscreen.js` (`sha256 e45a68f8df130da76db3cf309fffc61f9d8b08f19801b33e07c9de6b4aa1d8bf`) was used as the listener/lifecycle pattern only. Codee's document dispatch was adapted to the existing intelligence request/session envelope instead of importing donor perception behavior.

## Codee adaptations

- `src/intelligence/offscreen-runtime.js` uses Codee IIFE/global loading conventions so it can be loaded by the existing service worker.
- `src/intelligence/offscreen-document.js` validates the Codee offscreen message schema and delegates only to a registered inference adapter.
- `src/intelligence/offscreen.html` is the MV3 offscreen document.
- `manifest.json` adds the `offscreen` permission only; no host permission was added.
- `src/lib/service-worker.js` imports the runtime beside the existing intelligence contract/host.

## Authority boundary

The offscreen document cannot advance plans or independently perform browser/repository/shell/mutation/credential/artifact-verification operations. It is only an execution context for future browser-local inference adapters. All privileged actions remain behind existing Codee governance.

## Verification

`tests/test-browser-intelligence-offscreen-runtime-donor-pass5.js` covers lifecycle sharing, final release, idempotent creation races, request/session transport identity, failure cleanup, manifest permission and required document assets.
