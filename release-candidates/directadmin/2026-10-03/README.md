# DirectAdmin installer candidates — 2026-10-03

This artifact-only bundle is published under **proprietary, all-rights-reserved** terms. It does not license the source repository, grant open-source reuse, or grant rights to Titan/Titan Zero names or marks. See each artifact's `LICENSE.txt` and generated `THIRD_PARTY_NOTICES.txt` before use. These are companion files outside the TARs so the validated archive bytes remain unchanged.

This first branch update contains Titan Server Node and Titan Workforce. Developer Portal 1.3.10 has been downloaded through the authorized GitHub workflow-artifact API and verified against all 13 source files. Its owner will append the TAR and companion files at `developer-portal/` on this branch. The bundle is partial until that commit lands.

| Plugin | Version | Archive | SHA-256 |
|---|---:|---|---|
| Titan Server Node | 0.3.0 | [`titan-server-node.tar.gz`](server-node/titan-server-node.tar.gz) | `580676074d64c431f9d635908f1f71f05aae110b6882f8ace3c2aea0c06f975d` |
| Titan Workforce | 0.1.6 | [`titan_workforce.tar.gz`](workforce/titan_workforce.tar.gz) | `100ecd5c58d6de7f0cfb02636d58440ae05751293047d5cdce6bd61bcf556b26` |
| Developer Portal | 1.3.10 | Pending at `developer-portal/titan_dev_access.tar.gz` | `90261a3dd1d3bc05fa0425466b15b394d936523abfe1f8499d255d62c1f41c27` |

Verify checksums and retain companion license/notices. Install Server Node before Workforce; Portal is independent. Server Node and Workforce require Node.js 22+; Server Node additionally requires systemd and `flock`. Portal requires PHP 7.4+.

No live DirectAdmin Manager install, update, rollback, uninstall, CGI/cookie boundary, SSH flow, or reboot recovery was certified. Server Node's production RAW relay is disabled; Workforce's production session path is not commissioned. See [`INSTALLATION-NOTES.md`](INSTALLATION-NOTES.md) and [`provenance.json`](provenance.json).
