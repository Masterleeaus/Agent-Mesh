# DirectAdmin Plugin Agent Guide — Titan Dev Access

Treat these as hard constraints unless current DirectAdmin documentation and a real server test prove otherwise.

## Proven environment

- DirectAdmin Evolution skin.
- Plugin installed through DirectAdmin Plugin Manager.
- InterServer host account validated as Unix user `admin`, UID 1000, HOME `/home/admin`.
- `sudo` is not available to this account.
- Plugin pages run in the DirectAdmin/Unix account context; do not assume root.

## Packaging rules — critical

1. The install archive must be named exactly after the plugin ID: `titan_dev_access.tar.gz`.
2. Do NOT add version text, `-rebuilt`, `-fresh`, or other suffixes to the install archive filename.
3. `plugin.conf` must be at the archive root, not inside an enclosing directory.
4. The archive root must directly contain `plugin.conf`, `admin/`, `reseller/`, `user/`, `hooks/`, `lib/`, and `scripts/`.
5. `admin/index.html`, `reseller/index.html`, and `user/index.html` must be executable in the install archive.
6. Lifecycle shell scripts must be executable in the install archive.
7. Do not depend on `install.sh` to chmod files in a hard-coded final path. DirectAdmin may invoke installation while the plugin is still in a staging/extraction path.
8. `install.sh` must determine its own location and validate the extracted plugin tree.
9. Before release, inspect the FINAL `.tar.gz`, not only the source tree.
10. Repository source mode is not authoritative for the DirectAdmin package: `tools/package.sh` explicitly applies required executable modes before creating the tarball.

## Routing rules

Use DirectAdmin routes, never `/evo/...` in plugin hooks:

- Admin: `/CMD_PLUGINS_ADMIN/titan_dev_access`
- Reseller: `/CMD_PLUGINS_RESELLER/titan_dev_access`
- User: `/CMD_PLUGINS/titan_dev_access`

Evolution may display:

`/evo/plugin?src=%2FCMD_PLUGINS_ADMIN%2Ftitan_dev_access`

That is normal. The `src` value is the backend plugin route.

## Evolution theming

- Prefer DirectAdmin/Evolution CSS variables with sensible fallbacks.
- Support both light and dark modes.
- Do not hard-code a white page.
- Plugin functionality must remain usable when parent-theme information is unavailable.

## Security rules

- Never request, accept, or store private SSH keys.
- Only public keys may be managed.
- `~/.ssh`: 0700; `authorized_keys`: 0600.
- DirectAdmin Admin level or Unix identity is not Titan business authority.
- Never grant sudo/root automatically.
- Escape rendered terminal/key content.
- Use CSRF protection for state-changing forms.
- Bound terminal execution time and output.
- Keep terminal working directory inside the current account HOME unless an intentionally governed workspace model expands it.

## Release validation checklist

1. `php -l` every PHP file.
2. `bash -n` every shell script.
3. Confirm `plugin.conf` is top-level in the final archive.
4. Confirm there is no enclosing package/version directory.
5. Confirm executable modes on the three `*/index.html` entrypoints and lifecycle scripts inside the final tarball.
6. Extract the final archive into a clean directory and re-run syntax validation.
7. Confirm the final filename is exactly `titan_dev_access.tar.gz`.
8. Confirm all hooks use the exact `titan_dev_access` route ID.
9. Preserve the last server-validated package until the new package is installed and routable.

## Server-validation sequence

1. Plugin Manager accepts archive.
2. `install.sh` exits 0.
3. Plugin appears Active.
4. Admin route loads.
5. Reseller/User routes are tested when applicable.
6. Evolution displays UI correctly in light and dark themes.
7. State-changing forms and CSRF protection work.
8. Upgrade from the previous validated package succeeds.
9. Uninstall succeeds without deleting unrelated SSH keys/user data.

## Known failures already encountered

- Missing `plugin.conf`: archive root/layout wrong.
- `chmod .../plugins/titan_dev_access/...: No such file`: installer assumed final path too early.
- Plugin Active but page 404: archive/plugin directory ID did not match `titan_dev_access`.
- Versioned/rebuilt archive names can break plugin routing.

Do not repeat these failures.
