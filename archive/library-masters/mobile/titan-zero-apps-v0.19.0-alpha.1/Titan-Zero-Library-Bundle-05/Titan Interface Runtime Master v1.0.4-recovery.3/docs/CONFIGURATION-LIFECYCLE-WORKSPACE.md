# Configuration Lifecycle Workspace

Pass 17 standardizes configuration presentation as **Draft → Preview → Validate → Publish → History → Rollback** without moving configuration authority into Titan Interface Runtime.

## Opt-in contract

A source extension declares a normal Interface Contribution v1.1 view with `component_hint` set to `configuration-lifecycle`. The view uses an existing governed `read-model` or `capability` data source. The source read returns metadata only:

```json
{
  "status": "validated",
  "current_version": {"id":"v3","label":"Draft v3","state":"draft"},
  "published_version": {"id":"v2","label":"Published v2","state":"published"},
  "preview": {"available":true,"source_ref":"preview:v3"},
  "validation": {"status":"valid","errors":[],"warnings":[]},
  "history": [{"id":"v2","label":"Published v2","state":"published"}],
  "rollback": {"available":true,"target_version_id":"v2"},
  "action_refs": {
    "preview":"builder.preview",
    "validate":"builder.validate",
    "publish":"builder.publish",
    "rollback":"builder.rollback"
  }
}
```

The runtime deliberately discards raw configuration bodies, rendered preview HTML, arbitrary version blobs and caller-supplied capabilities. `action_refs` are re-resolved against the registered action contract, current product surface and authenticated capabilities. Publish and rollback actions must be declared as mutating. All returned intents have `executable=false`.

## Authority boundary

The source extension owns configuration versions, validation, publish state, history, snapshots and rollback. Interface Runtime stores no configuration version rows and performs no configuration mutation. Titan Builder already has validated preview, `BuilderVersion`, immutable `PublishSnapshot`, versioned publish and rollback facilities; it can opt in later by publishing this contribution contract rather than by adding concrete coupling to Interface Runtime.
