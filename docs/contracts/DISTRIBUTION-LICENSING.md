# Distribution licensing and provenance

The repository has no root `LICENSE`, `COPYING`, or `NOTICE`, and active package manifests do not establish an owner-approved license for Titan. The `private` field in `package.json` only prevents normal npm publication; it does not grant or deny rights to publish a Chrome extension, WordPress plugin, archive, source tree, or commercial artifact.

Until the owner records a licensing decision, source and artifact distribution is blocked wherever rights are unknown. This does not classify Titan as proprietary or open source. Do not copy donor/archive material into a distributable because it is present in the repository, and do not infer redistribution permission from document ingestion or RAG retrieval rights.

`distribution-provenance.json` is the current machine-readable status. `package-license-audit.json` records exact active `package.json` paths, license fields, npm-private flags, and content hashes. It also hashes the 86 compressed archives under `archive/` as uninspected donor inputs and records license/notice files as evidence requiring review; neither archive presence nor an embedded license string implies redistribution rights. Refresh it only after reviewing the changed inputs:

```sh
python3 .github/scripts/check-distribution-provenance.py --write-package-audit
python3 .github/scripts/check-distribution-provenance.py --check
```

Release packagers must invoke the guard for their artifact before writing or publishing it:

```sh
python3 .github/scripts/check-distribution-provenance.py --artifact <artifact-id> --output THIRD_PARTY_NOTICES.txt
```

The command fails closed unless the artifact has an approved first-party SPDX expression and license text, an owner approval reference, complete dependency-license inventory, and required notices. Unknown or missing source records cannot be promoted by adding a package `license` string alone. The current Browser Node candidate is blocked; no WordPress plugin artifact is present in current main. The existing OpenBrowser notice is recorded with its MIT claim, but upstream URL/hash and exact artifact inclusion still need review. The staged browser-AI donor archive remains staging-only with unestablished redistribution rights.

This inventory is an engineering control, not legal advice or an owner licensing decision. The root policy, product-specific licensing, trademark treatment, and any public/open-source components remain owner decisions. #1234 remains open until artifact-specific acceptance is met.
