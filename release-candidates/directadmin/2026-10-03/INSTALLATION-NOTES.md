# Installation notes — DirectAdmin installer candidates (2026-10-03)

These are proprietary candidate packages, not live-certified production releases. Each available archive has a companion `LICENSE.txt` and generated `THIRD_PARTY_NOTICES.txt`; those files are outside the TAR so the tested archive hashes stay unchanged.

## Archive hashes

- Titan Server Node 0.3.0 — `titan-server-node.tar.gz`; `580676074d64c431f9d635908f1f71f05aae110b6882f8ace3c2aea0c06f975d`.
- Titan Workforce 0.1.6 — `titan_workforce.tar.gz`; `100ecd5c58d6de7f0cfb02636d58440ae05751293047d5cdce6bd61bcf556b26`.
- Developer Portal 1.3.10 — owner will append `titan_dev_access.tar.gz` plus companion files at `developer-portal/`; expected SHA `90261a3dd1d3bc05fa0425466b15b394d936523abfe1f8499d255d62c1f41c27`.

## Prerequisites and order

1. Verify each archive against its `.sha256` sidecar.
2. Install Server Node 0.3.0 before Workforce. The combined minimum is Node.js 22 or later; Server Node also requires systemd and `flock`.
3. Workforce declares Server Node 0.3.0 as a dependency by exact archive SHA.
4. Developer Portal is independent; its minimum is PHP 7.4. The exact package/archive workflow passed on PHP CLI 8.3.6.

## Operational limits

No authorized disposable DirectAdmin host was used for Manager installation, update, rollback, uninstall, real CGI, cookie isolation, SSH access, or reboot recovery. Server Node's production RAW relay is disabled and returns sanitized 503. Workforce's production session path is not commissioned. Package checks do not constitute live-host certification.
