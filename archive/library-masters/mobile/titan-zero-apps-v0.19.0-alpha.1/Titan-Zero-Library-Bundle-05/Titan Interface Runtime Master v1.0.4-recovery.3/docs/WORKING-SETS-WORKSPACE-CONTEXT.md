# Working Sets & Workspace Context — Pass 16

Titan Interface Runtime treats the host's existing `titan_workspace_projects` / `titan_workspace_project_items` system as the authoritative working-set source. Interface Runtime does not create another workspace table and does not own membership persistence.

## Source boundary

The current host authority is exposed through `TitanWorkspaceProjectGateway`, a read-only adapter over the existing Titan Workspace Project models. The adapter is deliberately platform-specific and isolated from business-domain models.

A working set can contain mixed references such as customers, properties, jobs, quotes, invoices, assets, files, photos, chats and workbooks. Membership means only **"include this reference in this working context"**. It does not grant permission to read the referenced business object.

## Independent authorization

For a business-domain item, `WorkingSetWorkspaceComposer` must:

1. map the host item type to a registered Interface Runtime object type;
2. check object product-surface visibility and Hub customer safety;
3. check the authenticated `InterfaceContext` capabilities;
4. ask `HostTitanAssistWorkingSetItemVerifier` to re-resolve the item through `titan.assist.context` for the current business/tenant;
5. only then emit a canonical tenant-bound `object_ref`.

If any step fails, the item is omitted. The membership row is never treated as proof of object authorization.

User-owned opaque items (`file`, `photo`, `chat`, `workbook`) may remain in the working set without inventing a Titan business-object authority. They carry reference metadata only; Interface Runtime does not load their authoritative payloads.

## Context envelope

Opening a working set derives a child `InterfaceContext` with `workspace_id` set to the authoritative project id. Tenant, user, roles, capabilities, product surface, trace id and correlation id remain immutable.

The shared envelope supplied to people/Zero contains only:

- working-set id and source authority;
- sanitized host workspace context;
- independently authorized canonical object references;
- opaque user-owned item references;
- tenant/user/product-surface and trace/correlation identity;
- explicit `membership_grants_authorization=false` and `payloads_included=false` flags.

This envelope is context, not a data copy.

## Membership mutations

Pass 16 emits membership operations as non-executable handoff intents only. Every detach intent states:

- `membership_only=true`;
- `deletes_authoritative_data=false`;
- `executable=false`.

The current host's `TitanWorkspaceProjectController::detachItem()` deletes only the `TitanWorkspaceProjectItem` membership row. Removing a customer/job/invoice/asset from a working set must never delete the authoritative domain record.

## Endpoint

`GET /dashboard/user/titan-interface-runtime/working-sets/{workingSetId}` returns the presentation-only working-set snapshot under the canonical authenticated Interface Context.
