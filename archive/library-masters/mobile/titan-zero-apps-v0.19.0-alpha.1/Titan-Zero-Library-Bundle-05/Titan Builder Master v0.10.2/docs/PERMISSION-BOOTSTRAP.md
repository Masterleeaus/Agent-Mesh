# Titan Builder Permission Bootstrap

Titan Builder v0.9.2 fixes `Titan Builder actor lacks capability: builder.read` on MagicAI installations where Builder routes are present but Builder abilities were never registered in the host permission system.

## Host permission schema

The current Titan/MagicAI database uses the shared Spatie-style tables:

- `permissions`
- `roles`
- `role_has_permissions`
- optionally `model_has_roles` / `model_has_permissions` for actor assignment

Titan Builder does not own these tables.

## Registered abilities

- `builder.read`
- `builder.edit`
- `builder.publish`
- `builder.assets.manage`
- `builder.templates.manage`
- `builder.admin`

## Default role mapping

`user` receives all company-level Builder abilities and does **not** receive `builder.admin`.

`admin` and `super_admin` receive the full Builder ability set including `builder.admin`.

These defaults make the current MagicAI user/admin role model usable immediately. A host can disable the compatibility fallback and replace role assignments with its own permission policy.

## Legacy `users.type` compatibility

Some current MagicAI databases define roles and permissions tables but have no `model_has_roles` assignments for existing accounts. Titan Builder therefore checks authorization in this order:

1. native host `user()->can($ability)`;
2. if not granted and compatibility is enabled, the authenticated actor's trusted `users.type` / attached role name is mapped through Titan Builder's configured defaults;
3. otherwise deny.

Request parameters, route parameters, `company_id`, source surface, headers, and menu entries never grant abilities.

## Configuration

`config/titan-builder.php` exposes:

- `authorization.legacy_actor_fallback`
- `authorization.legacy_actor_defaults`

Set `legacy_actor_fallback` to `false` after the host has complete explicit Builder permission assignments if strict Spatie-only authorization is preferred.
