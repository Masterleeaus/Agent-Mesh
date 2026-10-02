# Developer Portal recovery runbook

Status: preparation only. No live server backup, upload, install, delete, or restore was performed for this runbook. Use only after the server owner authorizes a specific maintenance window and the recovery destination.

## Installed paths

The stable DirectAdmin plugin ID is `titan_dev_access`:

```text
/usr/local/directadmin/plugins/titan_dev_access/
```

Resolve `DA_HOME` from the exact DirectAdmin account that owns the request. Do not assume that the DirectAdmin role name is the Unix account name. The plugin's per-account state and SSH authorization file are:

```text
$DA_HOME/.titan-dev-access/csrf.key
$DA_HOME/.ssh/authorized_keys
```

The CSRF key is secret material. The SSH authorization file grants access even though it contains public keys. Do not print either file, attach it to GitHub, or send it to Codex. Private keys are outside this plugin's expected state and must not be inspected or copied as part of this procedure.

## Before a future replacement

1. Confirm the DirectAdmin version, plugin ID, installed version, effective Unix owner, and the exact `DA_HOME` for the affected account. Record paths and metadata only; do not collect credentials or secret values.
2. Use the host's approved backup facility and an encrypted, access-restricted destination outside the plugin tree. Back up `/usr/local/directadmin/plugins/titan_dev_access/` as a complete tree while preserving numeric ownership, permissions, timestamps, ACLs, extended attributes, and symlink metadata. Record a SHA-256 manifest for the backup artifact and verify it after writing.
3. Preserve `$DA_HOME/.titan-dev-access/csrf.key` only through the same approved secret-capable backup facility, with access limited to the server owner/operators who need recovery. Its expected directory/file modes are `0700`/`0600`; record modes and ownership without recording its contents or value. Do not rotate, regenerate, or replace it during a package-only recovery.
4. Preserve `$DA_HOME/.ssh/authorized_keys` through the site's approved access-control backup process, retaining owner and modes. Do not display its contents in evidence. Do not include, read, or copy any private key.
5. Retain the exact package artifacts and checksum files separately from the server backup. v1.3.2 SHA-256 `22b54eabaf2a12a5bba04c9b21d58f798f93b7c1a6845362035edf574c488755` and v1.3.1 SHA-256 `a41d5217cd914bcbba5984712ec4f130001be50afe894d466be86d08d70f73cc` are historical artifact references only, not validated rollbacks. Library v1.3.3 SHA-256 `6145b02a9fc0626f31bf7350f881419cf5cfe41036879b724e5abf4c38addbbc` is also retained for audit but must not be installed: synthetic tests found malformed/multiline public-key acceptance and Git remote mutation/read-output gaps. The exact-head v1.3.7 archive and checks are recorded in issue #1048. The v1.3.8 review archive (SHA-256 `6e4a1b1de656a494bd193e6b16ff88d707f421581703bd953aa8ccecd015b1dd`) is superseded because its direct SSH command ignored a saved alias's configured key; it was not installed. The v1.3.9 package (SHA-256 `7842ae6a4d9e9cbd901b2ef25371bbc19837eb7d3d629771ece6ce2529ea2bce`) is superseded because comments could break identity parsing and stale row indexes were not bound to the displayed key; it was not installed. Record the v1.3.10 archive hash and provenance only after its exact-head hosted PHP/archive gates pass; independent security review and staging lifecycle checks remain separate gates.
6. Test the chosen update/recovery procedure on a disposable DirectAdmin host matching the installed host version. Verify role routes, CSRF form submission, install/update failure handling, ownership/modes, and recovery before scheduling any production operation.

## Recovery sequence

1. Stop before using Plugin Manager Delete/Add or replacing files if the exact in-place update behavior and failure semantics have not been proven on the disposable host. DirectAdmin may reject a duplicate plugin ID, and failed Add behavior can remove the plugin. The current `update.sh` is a read-only validator, not an updater or rollback mechanism.
2. Verify the selected archive's checksum and flat archive root. Record the pre-operation plugin-tree backup identifier and checksum manifest.
3. Follow only the already-tested, owner-authorized recovery procedure for the exact DirectAdmin version. Restore the backed-up plugin tree to `/usr/local/directadmin/plugins/titan_dev_access/`, preserving ownership and metadata. Do not restore, replace, or rotate the account CSRF key or SSH authorization file as part of a plugin-code restore.
4. Verify the restored plugin version, route executability, role-page rendering, and valid/invalid CSRF behavior through actual DirectAdmin requests. Confirm the CSRF key and SSH authorization file remain unchanged using the approved host procedure; do not disclose their contents.
5. If verification fails, keep the plugin disabled from further use through the host owner's approved procedure and preserve logs/metadata for diagnosis. Do not broaden permissions, add sudo/root execution, or weaken CSRF validation to make the page load.

## Current compatibility limits

- The earlier installed Titan Dev Access 1.1.3 produced a reproduced invalid-CSRF response on a harmless `pwd` form submission and is not an operationally validated rollback. The latest live UI observation recorded 2026-10-02 is installed v1.3.6; harmless same-page `pwd` and `id` forms completed as Unix `admin`, UID 1000. This does not certify other forms, roles, updates or rollback.
- On the user's Windows workstation, OpenSSH reports `Load key: Permission denied` while using the local `titan` alias. That message indicates local private-key file access failed before server authentication; it does not show a server-side public-key rejection. No private key, ACL, server `authorized_keys`, or server configuration was inspected or changed. End-to-end SSH login remains unverified.
- Source version 1.3.10 adds free-form-comment-safe key identity parsing, ignores comment-only key records while preserving them, and binds revoke forms to the displayed fingerprint to reject stale/reordered rows. It retains saved SSH alias selection and checked, locked, atomic key writes. It is a review candidate only until the exact-head hosted PHP/security/archive workflow and independent security review pass. Do not upload or install it.
- v1.3.1 is retained as an artifact reference; downgrade behavior has not been tested.
- v1.3.2 is a historical, checksum-verified artifact only; v1.3.3 is an unsafe prior candidate with confirmed synthetic validation gaps. Neither is a current install choice or a proven rollback.
- v1.3.7 is a prior review-only source/package candidate with exact-head PHP/package/archive evidence recorded on issue #1048; it has not been installed. Its compatibility with live v1.3.6 is unverified.
- No supported in-place update path or live rollback has been demonstrated. Treat recovery as unproven until the disposable-host sequence passes.
- This document contains no secret values and does not authorize any server-side action.
