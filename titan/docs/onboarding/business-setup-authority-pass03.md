# TZ-NEXT-015 Pass 3 — Business setup authority wiring

Pass 3 preserves the existing Titan authority split instead of creating a parallel settings/business database.

Business identity, service areas, operating hours, and contact details are company-scoped business facts. They are persisted through the existing Titan business database under `titan-onboarding/business-profile/current`. Company preferences are written only when the key already exists in the canonical Settings registry, is editable, company-scoped, and non-secret; those writes go through the existing Settings storage adapter.

The bridge rejects legacy tenant aliases and cross-company payloads, supports optimistic revision checks, verifies preference writes, and never grants authority or execution permission. It does not modify the central Settings registry or any protected shared runtime hotspot.
