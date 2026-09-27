# Upgrade Titan Builder 0.8 → 0.9

1. Install the v0.9 package through Titan Extension Manager.
2. Run normal extension migrations. The only new table is `titan_builder_settings`.
3. Publish the `titan-builder` asset tag so management CSS/JS are available.
4. Ensure host roles have the intended abilities: `builder.read`, `builder.edit`, `builder.publish`, `builder.assets.manage`, `builder.templates.manage`, and `builder.admin` where appropriate.
5. Link the stable company route `titan-builder.manage.dashboard` and optional Super Admin route `titan-builder.admin.dashboard` from the host navigation if the host does not discover extension routes automatically.
6. Run host verification (`optimize:clear`, `route:list`, `migrate --pretend`, tests) before production rollout.

Rollback to v0.8 can leave `titan_builder_settings` in place because uninstall/rollback data policy is retain-by-default. v0.8 runtime does not depend on the table.
