# RESQAI V2 — Event Versioning Strategy

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Versioning Principles](#1-versioning-principles)
2. [Semantic Versioning for Events](#2-semantic-versioning-for-events)
3. [Schema Evolution Rules](#3-schema-evolution-rules)
4. [Backward Compatibility](#4-backward-compatibility)
5. [Version Migration Strategy](#5-version-migration-strategy)
6. [Version Lifecycle](#6-version-lifecycle)
7. [Consumer Compatibility](#7-consumer-compatibility)

---

## 1. Versioning Principles

| Principle | Description |
|-----------|-------------|
| **Every event has a version** | All events carry `event_version` in their envelope |
| **Semantic versioning** | MAJOR.MINOR.PATCH for all event schemas |
| **Backward compatible by default** | MINOR/PATCH changes must not break consumers |
| **Explicit opt-in for breaking changes** | MAJOR version requires consumer migration |
| **Version enumeration** | Event registry tracks all active versions |
| **No silent schema changes** | All schema changes are versioned and documented |

---

## 2. Semantic Versioning for Events

### 2.1 Version Format

```
MAJOR.MINOR.PATCH

Example: ticket.created → 1.3.2
```

### 2.2 Version Increment Rules

| Increment | When To Use | Consumer Impact |
|-----------|-------------|-----------------|
| **MAJOR** | Breaking schema change: field removal, type change, required field addition, rename | Requires consumer code changes |
| **MINOR** | Non-breaking addition: optional field added, new enum value, larger maxLength | Transparent to consumers |
| **PATCH** | Bug fix: corrected description, relaxed constraint, fixed example | No consumer impact |

### 2.3 Examples

| Change | Version Bump | Reason |
|--------|:-----------:|--------|
| Add `customer_tier` (optional) | MINOR | New optional field |
| Remove `customer_name` | MAJOR | Breaking removal |
| Change `rating` type: integer → string | MAJOR | Type change breaks consumers |
| Add enum value `phone` to channel | MINOR | New non-breaking option |
| Fix `maxLength` from 500 to 1000 | PATCH | Relaxed constraint |
| Make `customer_id` required | MAJOR | New required field |
| Add description to field | PATCH | No schema change |
| Rename `ticket_id` to `id` | MAJOR | Field name change |

---

## 3. Schema Evolution Rules

### 3.1 Allowed Backward-Compatible Changes (MINOR/PATCH)

```
✓ Adding new optional fields
✓ Adding new enum values
✓ Relaxing constraints (e.g., increasing maxLength)
✓ Extending format (e.g., string → string/format)
✓ Adding descriptions, examples, documentation
✓ Changing `additionalProperties` from false to true
✓ Making required fields optional (MAJOR for consumers removing field)
```

### 3.2 Breaking Changes Requiring MAJOR Version

```
✗ Removing fields
✗ Renaming fields
✗ Changing field types
✗ Making optional fields required
✗ Adding new required fields
✗ Removing enum values
✗ Restructuring nested objects
✗ Changing the event name itself
✗ Splitting or merging events
✗ Changing payload encoding
✗ Reducing field constraints
```

### 3.3 Version Compatibility Matrix

| Consumer Version | Producer v1.0 | Producer v1.1 | Producer v2.0 |
|:----------------:|:-------------:|:-------------:|:-------------:|
| **Consumes v1.0** | ✓ Compatible | ✓ Compatible (backward) | ✗ Incompatible |
| **Consumes v1.1** | ✓ Compatible | ✓ Compatible | ✗ Incompatible |
| **Consumes v2.0** | ✓ Compatible (forward)* | ✓ Compatible (forward)* | ✓ Compatible |

*Forward compatibility requires consumer to ignore unknown fields.

---

## 4. Backward Compatibility

### 4.1 Producer Responsibilities

| Rule | Description |
|------|-------------|
| **Don't remove fields** | Mark as deprecated instead; remove after MAJOR version |
| **Don't rename fields** | Add new field with new name; deprecate old one |
| **Don't change types** | Add new field with new type; deprecate old field |
| **Add optional fields only** | New fields must have defaults or be nullable |
| **Version all changes** | Every schema change must increment the version |
| **Document deprecations** | Deprecated fields marked in schema with `deprecated: true` |

### 4.2 Consumer Responsibilities

| Rule | Description |
|------|-------------|
| **Ignore unknown fields** | Consumers must tolerate unexpected fields |
| **Use defaults for missing fields** | Optional fields may be absent in older versions |
| **Subscribe to version range** | Consumers declare `accepts_versions: ">=1.0 <2.0"` |
| **Monitor deprecation notices** | Check event registry for deprecated fields |
| **Test against new versions** | Consumers should test against schema registry |

### 4.3 Forward Compatibility

The event bus supports forward compatibility by:

1. **Ignoring unknown fields** — consumers process fields they understand
2. **Default values** — missing optional fields get defaults
3. **Schema negotiation** — consumer declares max supported version
4. **Version transformation** — bus can transform MAJOR versions if transformer registered

---

## 5. Version Migration Strategy

### 5.1 Standard Migration Process

```
Phase 1: Announce (T+0)
  ── Publish deprecation notice for old version
  ── Set sunset date (90 days for MAJOR, 30 days for MINOR)

Phase 2: Dual-Run (T+14)
  ── Producer publishes both versions (old + new)
  ── Bus routes by consumer subscription version
  ── Metrics compare old vs new consumption

Phase 3: Migrate Consumers (T+14 to T+60)
  ── Consumers update to new version
  ── Verified via event bus consumer registry
  ─── Un-migrated consumers receive deprecated event

Phase 4: Sunset Old Version (T+90)
  ── Stop producing old version
  ── Un-migrated consumers routed to dead letter
  ── Old version marked as retired in registry
```

### 5.2 MAJOR Version Migration Timeline

```
Day 0:  Publish v2 schema, announce deprecation of v1
Day 14: Start dual-publish (v1 + v2)
Day 30: Deadline for consumer migration (soft)
Day 60: Deadline for consumer migration (hard)
Day 90: Stop v1 production, retire v1
```

### 5.3 MINOR Version Migration Timeline

```
Day 0: Publish v1.1 schema (backward compatible)
Day 0: Start v1.1 production (old v1.0 consumers unaffected)
Day 30: v1.0 deprecated
Day 60: v1.0 retired
```

### 5.4 PATCH Version Migration

```
Immediate: Publish v1.0.1
No migration needed — backward and forward compatible
```

---

## 6. Version Lifecycle

```
draft ──→ active ──→ deprecated ──→ retired
  │
  └──→ abandoned
```

| Phase | Description | Allowed Producers | Allowed Consumers |
|-------|-------------|:-----------------:|:-----------------:|
| **draft** | Schema under development | Test only | Test only |
| **active** | Current version in production | ✓ All | ✓ All |
| **deprecated** | Replaced by newer version | Dual-publish only | Existing only; no new subscriptions |
| **retired** | Permanently removed | ✗ None | ✗ None |

### Version Registry Example

```json
{
  "event_name": "ticket.created",
  "versions": [
    {
      "version": "1.0.0",
      "status": "retired",
      "retired_at": "2026-06-01"
    },
    {
      "version": "1.1.0",
      "status": "active",
      "active_since": "2026-05-01",
      "schema_url": "/schemas/events/ticket.created.v1.1.json"
    },
    {
      "version": "2.0.0",
      "status": "draft",
      "schema_url": "/schemas/events/ticket.created.v2.0.json",
      "planned_activation": "2026-08-01"
    }
  ]
}
```

---

## 7. Consumer Compatibility

### 7.1 Consumer Version Declaration

Each consumer must declare which event versions it can process:

```json
{
  "consumer_name": "ticket-auto-response_v2",
  "subscriptions": [
    {
      "event_name": "ticket.created",
      "accepts_versions": ">=1.0.0 <2.0.0",
      "preferred_version": "1.1.0"
    }
  ]
}
```

### 7.2 Version Routing Rules

| Consumer Declares | Producer Publishes | Route Decision |
|-------------------|-------------------|----------------|
| `>=1.0 <2.0` | 1.1.0 | Route directly |
| `>=1.0 <2.0` | 2.0.0 | Do not route; alert consumer |
| `>=2.0 <3.0` | 1.1.0 | Do not route; alert consumer |
| `>=1.0` | 2.0.0 | Route (consumer accepts all) |
| `=1.0.0` | 1.1.0 | Do not route (strict pinning) |
| Not declared | Any | Route all; log warning |

### 7.3 Version Compatibility Check

```
1. Consumer subscribes to event E at version range R
2. Producer publishes event E at version V
3. Event bus checks: is V in range R?
   ├── YES → Route to consumer
   └── NO  → Block event; notify both parties
4. If dual-publish, route V1 to old consumers, V2 to new consumers
```

---

## 8. Initial Event Versions

All events in this architecture are initialized at version 1.0.0:

| Event | Initial Version | Notes |
|-------|:--------------:|-------|
| All `ticket.*` events | 1.0.0 | Per existing contracts |
| All `appointment.*` events | 1.0.0 | Per existing contracts |
| All `operation.*` events | 1.0.0 | Per existing contracts |
| All `job.*` events | 1.0.0 | Per existing contracts |
| All `resolution.*` events | 1.0.0 | Per existing contracts |
| All `account.*` events | 1.0.0 | Per existing contracts |
| All `analytics:*` events | 1.0.0 | Per existing contracts (note: colon delimited) |
| All `system.*` events | 1.0.0 | Newly defined |
| All `audit.*` events | 1.0.0 | Newly defined |
| All `security.*` events | 1.0.0 | Newly defined |
| All `integration.*` events | 1.0.0 | Newly defined |
| All `lifecycle.*` events | 1.0.0 | Newly defined |
| All `user.*` events | 1.0.0 | Newly defined |
| All `notification.*` events | 1.0.0 | Newly defined |
| All business events | 1.0.0 | Newly defined |
| All database events | 1.0.0 | Newly defined |

---

> **End of EVENT_VERSIONING.md**
