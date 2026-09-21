# Titan Storage Recovery and Failover Contract — Pass 56

## Core rule

Storage failover must never create a second canonical truth.

Mobile does not promote storage.

## Degraded canonical state

When a canonical endpoint is degraded/unavailable, mobile may:

- continue using an already authorised encrypted offline projection;
- read an authorised cache;
- stage a backup for Core-governed restoration;
- stage an archive for Core-governed restoration;
- keep evidence staged until its authorised destination returns.

Mobile may not:

- declare a projection canonical;
- mutate a replica as if it were primary;
- convert Google Drive/Dropbox into a CRM database;
- replay business mutations into a backup;
- silently move authoritative ownership.

## Recovery order

Each data class carries a Core-issued `recovery_order`.

The mobile recovery planner reports that order but every step has:

`canonicalPromotionAllowed = false`

A restore operation is a staged read only.

The bytes plus digest/receipt can be supplied to a later Core-governed restoration/import workflow.

## Non-canonical provider failover

For roles such as backup/evidence/archive, mobile may move to the next healthy endpoint already authorised in the canonical route.

Example:

`backup S3-A degraded → backup S3-B healthy`

is allowed because both endpoints were already authorised as backup destinations.

This does not alter the canonical transactional owner.

## Stale topology

The last accepted topology may remain usable for bounded offline semantics, but UI reports it as stale.

Stale topology never expands permissions or grants canonical promotion.
