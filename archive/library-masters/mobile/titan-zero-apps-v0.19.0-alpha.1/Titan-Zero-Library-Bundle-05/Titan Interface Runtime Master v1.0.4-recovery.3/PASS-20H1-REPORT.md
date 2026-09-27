# Pass 20 Hotfix 1 — Installer 1.7.6 Hidden-File Integrity Compatibility

## Root cause
The v1.0.0 ZIP declared two hidden `.gitkeep` files in `extension.json.integrity.files`. The live verifier builds its actual list with Laravel `File::allFiles()`, whose Symfony Finder enumeration omits hidden files. The declared list therefore had 448 entries while the live actual list had 446 visible files, causing the exact line-92 file-list mismatch.

## Fix
- Remove the two hidden placeholder files.
- Keep integrity verification enabled; do **not** bypass or remove `integrity.files`.
- Regenerate the package ledger and integrity map from the exact release tree.
- Add a regression that ignores hidden paths exactly as the live Laravel file enumeration does.

No migrations or runtime/domain behavior changed.
