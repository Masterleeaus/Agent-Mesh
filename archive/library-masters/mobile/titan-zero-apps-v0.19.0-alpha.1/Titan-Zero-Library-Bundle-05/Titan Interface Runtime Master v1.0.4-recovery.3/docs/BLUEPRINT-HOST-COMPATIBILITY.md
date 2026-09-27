# Blueprint / Host Installer Compatibility

## Canonical contract

Pass 11R rebases Titan Interface Runtime onto the latest supplied Titan Extension Blueprint Step 10 contract:

- `extension.manifest.json`: canonical Manifest **v2.2**, architecture profile `ui-surface`, production inheritance `titan.production.core.v1`.
- `resources/interface/interface-manifest.json`: Interface Contribution Contract **v1.1**.
- runtime discovery accepts **v1.0 and v1.1** contributors.
- `extension.json`: strict Installer 1.7.8 identity/integrity manifest only.
- ZIP package: flat root; POSIX-safe paths; no outer extension directory; no symlinks/junk; exact `integrity.files` set.

The canonical Step-10 installer schema deliberately permits only `schema`, `slug`, `folder`, `provider`, `version`, and `integrity`. Rich architecture is never duplicated into the root installer manifest.

## Website1408 transition

The supplied Website1408 snapshot reports `CustomExtensionManifestValidator::TITAN_INSTALLER_BUILD = 1.7.8` but still requires the older root fields `schema`, `slug`, **`name`**, `version`, `folder`, and `provider`. It accepts flat-root packages and uses the same exact integrity semantics, but its `name` requirement contradicts the newer Step-10 strict schema, whose executable regression explicitly rejects `name` as an unsupported field.

Because extension code cannot run before the installer validates `extension.json`, Titan Interface Runtime cannot self-heal that root-manifest mismatch. Release output therefore distinguishes:

1. **Canonical Step-10 package** — strict latest-Blueprint root manifest; Blueprint-certified.
2. **Website1408 transitional package** — same frozen extension tree and integrity map, plus `name: "Titan Interface Runtime"` in `extension.json`; accepted by the current Website1408 manifest validator but intentionally not claimed as strict Step-10 root-schema compliant.

The transitional package should be retired once the host installer is updated to the Step-10 strict manifest contract.

## Navigation

`TitanHostMenuCompatibilityAdapter` first attempts `MenuContributionRegistry`. On older hosts it may self-heal only Titan Interface Runtime's own row in the shared `menus` table and call `App\Services\Common\MenuService::regenerate()`. Existing administrator order/position/enabled/active state is preserved. This isolated host metadata write is not business-domain persistence.

## Authorization

`TitanHostAuthorizationAdapter` supports `isSuperAdmin()`, `isAdmin()`, `can()`, `checkPermission()`, and `hasPermissionTo()`. Only Super Admin has unconditional platform bypass. Delegated Admin remains bounded by explicit delegated permissions.

## Certification boundary

Offline verification can certify package/schema/integrity/migration static safety. BOOT, NAVIGATION, AUTHORIZATION role matrix, runtime, upgrade and uninstall stages remain `NOT_RUN` until executed on a deployed live host.
