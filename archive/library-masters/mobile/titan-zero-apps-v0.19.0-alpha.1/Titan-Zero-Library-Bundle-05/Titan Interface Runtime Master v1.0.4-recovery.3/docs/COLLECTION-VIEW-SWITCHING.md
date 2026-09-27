# Collection View Switching

Pass 12 treats Cards, Table, Board, Calendar, Timeline and Feed as projections of the same collection authority.

A switch set is formed only from visible and authorized view descriptors that share the exact same `data_source.authority`, `data_source.mode` and `data_source.reference`. The selected view performs one governed read through `AuthorizedViewReader`. Subsequent `reproject()` calls reuse that exact read result and query fingerprint.

UI preference is presentation metadata only. It is keyed by tenant, user, product surface and object key and may be stored in the authenticated Laravel session. An invalid, unauthorized or stale preference is ignored rather than used to bypass visibility rules.

Map remains outside same-authority collection switching because spatial state is owned by Titan Maps Intelligence. Pass 13 now exposes Map through the dedicated Spatial Workspace, preserving the Pass 12 same-authority invariant.
