# Titan Builder — Blueprint v3.1 Lifecycle Sidecar + Current Titan Installer

Titan Builder v0.8.0 keeps the hardened Blueprint v3.1 lifecycle concepts while using the current Titan installer contract for deployment.

## Manifest roles

- `extension.json` is the current installer manifest (`titan-extension-v1`) and is authoritative for slug, version, folder, provider, migrations, platform requirements, publish tags and package integrity.
- `extension.manifest.json` is the richer lifecycle/capability sidecar. It declares capabilities, route profile, owned tables, company boundary, uninstall policy, optional platform integrations and tests.

The older Blueprint assumption that `extension.json` must be an exact five-field legacy MagicAI manifest is intentionally superseded by the current Titan installer.

## Provider identity

- Slug / registration key: `titan-builder`
- Install folder: `app/Extensions/TitanBuilder`
- Provider: `App\Extensions\TitanBuilder\System\TitanBuilderServiceProvider`
- Provider file: `System/TitanBuilderServiceProvider.php`
- Family: `native`
- Canonical persisted company boundary: `company_id`

Folder, namespace, provider class and Linux filename casing must remain synchronized.

## Publish lifecycle

The provider publishes operational copies under the extension-specific `titan-builder` tag:

- `config/titan-builder.php` -> `config/titan-builder.php`
- declarative Builder resources -> `resources/titan-builder`
- renderer JavaScript/CSS -> `public/vendor/titan-builder/...`
- Titan shell Builder JavaScript -> `public/vendor/titan-builder/js/titan-shell-builder.js`
- Premium Mobilekit presentation assets -> `public/vendor/titan-builder/premium/mobilekit/...`

The generic `extension` publish tag is intentionally not used, preventing cross-extension collisions.

## Uninstall lifecycle

`TitanBuilderServiceProvider::uninstall()` deletes only published operational copies. It does not drop `titan_builder_*` tables or delete company-uploaded assets, matching the sidecar's `retain` policy.

## Company boundary

Every active persisted Builder object remains scoped by positive integer `company_id`. Runtime resolution accepts only trusted middleware/authenticated actor context and does not fall back to `tenant_id`, `user_id` or `team_id`.

## Compatibility

The current installer manifest requires PHP `>=8.2`, MagicAI `>=10.91`, and Titan Platform `>=1.0`. Optional CRM, TitanAI, Interaction Engine, Titan Connect, Titan Mobile and Chatbot relationships remain capability-driven and fail closed when absent.

## Distribution

Production ZIPs must expose `extension.json` and `System/` at archive root, contain no traversal/junk paths, and carry the generated integrity map. See `docs/CURRENT-TITAN-INSTALLER-CONTRACT.md`.
