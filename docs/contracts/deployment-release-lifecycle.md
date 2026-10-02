# Deployment release lifecycle contract

The canonical release lifecycle is `DRAFT -> BUILT -> VERIFIED -> ACTIVE`. Activation is impossible before verification, so a build cannot be switched into service without a verification record. Every transition carries an idempotency key and immutable event record; conflicting replays fail closed.

An active release may transition to `ROLLED_BACK` only when a previous-known-good version was declared at plan creation and rollback evidence is supplied. The contract is company-aware when a provider release is company-scoped, rejects legacy tenant boundary fields, and is authority-neutral: deployment state does not grant business authority or mutate business data.

## Signed candidate gate (#322)

The lifecycle above is a state contract, not host certification. Before promotion,
the release operator runs the canonical verifier from a trusted checkout against
an immutable staging directory containing the exact shipped artifacts:

```sh
node scripts/verify-release-candidate.mjs signed-envelope.json /staging/candidate /trusted/release-public.pem
```

The command emits a JSON `RELEASE_VERIFIED` record only on success and exits 1
without a success record on failure. It never installs, migrates, activates,
publishes, or grants authority. #812 consumes verification through its governed
host boundary; #1068 must separately report STORE_SUBMITTED/REVIEWING/PUBLISHED.
The existing transitional VPS installer does not yet enforce this gate and is
not production certified. A successful fixture test is not a verified release.

Trust comes from an externally configured Ed25519 public key, never a key
embedded in a bundle. The envelope has `payload` (base64 of exact UTF-8 JSON
manifest bytes) and `signature` (base64 Ed25519 signature over those bytes).
Whitespace changes in the payload invalidate the signature. Provisioning,
rotation, custody and approval of the release signing key belong to the operator;
this tool neither generates production keys nor accepts private keys.

Manifest schema `titan.deployment.release-candidate.v1` requires:

| Field | Requirement |
| --- | --- |
| `release_id`, `version`, `channel` | Nonempty release identity and intended distribution channel |
| `source_sha` | Exact 40-character lowercase Git SHA |
| `created_at`, `expires_at` | Canonical UTC timestamps in `YYYY-MM-DDTHH:mm:ss.sssZ` form, valid now, maximum 24-hour window |
| `profile` | `portable` or `directadmin` |
| `artifacts` | Records `{role,path,sha256}`; SHA-256 lowercase hex; root-relative portable file paths; no links, traversal, duplicate/case-colliding paths or directories |
| Artifact roles | Required `web`, `worker`, `workforce`, `config`, `migrations`, `sbom`, `provenance`; `evidence` for referenced verification records. Runtime artifacts must be the shipped builds/images, not source-only archives. Config artifacts contain templates/references, never secret values. |
| `rollback` | Different previous-known-good `version` and exact signed payload `manifest_sha256` |
| `migrations` | `{owner,version,rollback_compatible:true}` for GLOBAL_REGISTRY, COMPANY_NATIVE_FSM, RUNTIME, WORKFORCE, AUTHORITY, EVIDENCE, COMPATIBILITY; version `none` explicitly documents an unused owner |
| `compatibility` | `node` version constraint and at least two distinct `substrates` |
| `unresolved_p0` | Explicit empty array from reviewed current issue/closure evidence |
| `regression_count` | Exactly 0, without a tolerated failing baseline |
| `installer_status` | `passed` |
| `checks` | Unique `{id,status,release_id,source_sha,subject_sha256,evidence_path,observed_at}` records; all passed, candidate-bound, `observed_at` in canonical UTC `YYYY-MM-DDTHH:mm:ss.sssZ` form within the manifest time window, referencing checksummed evidence files |

`subject_sha256` is the SHA-256 of UTF-8 `JSON.stringify(subject)`, where
`subject` is the artifact array excluding role `evidence`, each record projected
in property order `{role,path,sha256}`, sorted by `path` using code-unit ascending
order. This binds checks to exact shipped bytes even when a build reuses a Git
SHA. Evidence files are separately included in the signed artifact checksums.

Required check IDs are `ci_648`, `native_fsm_809`, `workforce_811`, `security_302`,
`fresh_install`, `production_readiness`, `native_without_frappe`,
`company_isolation`, `upgrade`, `rollback`, `reboot_recovery`,
`backup_restore_semantic`, and `second_substrate`. DirectAdmin also requires
`business_node_812`. Do not substitute a provider acknowledgement or a process
start for observed readiness of web, worker, Workforce and their required stores.
Restore evidence must cover DB plus company file namespaces, destructive-loss
simulation on a disposable host, semantic reread, isolation and immutable history.

The trusted signer is responsible for reviewing the actual owner/host evidence,
including exact artifacts/config, compatibility, required closure criteria and
current unresolved P0 state before signing. Cryptographic authenticity and
checksums cannot establish that an asserted test was honestly performed. This
verifier validates assertions and bytes; it does not rerun host acceptance or
query live GitHub. Reverify immediately before governed promotion. The staging
directory and its artifacts must be read-only and operator-controlled throughout
verification and until promotion; the verifier opens artifacts without following
the final path component and rejects inode or content metadata changes it detects
while hashing. Promotion must consume the exact verified immutable digests.
Preserve the envelope and output as evidence; they grant no business authority.
Never treat a copied JSON success record as authorization.

## Real build artifact inventory

The release candidate gate now has a separate inventory step for bytes actually
produced by the CI build. `vps-installer-smoke.yml` saves the built web, worker
and Workforce container images, the VPS configuration inputs and SQLite
migrations, then hashes those files with the same safe path and descriptor
checks used by the signed verifier. Its unsigned build receipt records each
image ID and the Node version inside the built image; it also records the limited
CI observations from that run. The uploaded artifact is a short-lived review
input, not a published release.

The inventory CLI accepts only the source SHA, target profile and role/path map:

```sh
node scripts/inventory-release-artifacts.mjs inventory-request.json /staging/build-files
```

It outputs schema `titan.deployment.release-artifact-inventory.v1` with the
exact artifact hashes, the canonical non-evidence `subject_sha256`, required
roles and check IDs that are still absent or unattested. The inventory does not
accept check statuses, host outcomes, a signature, or authority fields from its
request. Its release gate is always `DENIED`; it is not a
`titan.deployment.release-candidate.v1` manifest and cannot be passed off as
`RELEASE_VERIFIED`.

The current CI inventory intentionally reports `sbom` missing and every release
check unattested. The smoke run builds images and exercises a disposable,
uncommissioned Workforce; it does not start the production web/worker services,
install on a fresh host, certify DirectAdmin, test company business effects,
perform upgrade/rollback, destructive backup/restore, or verify another
substrate. The CI build receipt is unsigned and is not a publisher provenance
attestation. No production signing key or host credential is used. A trusted
operator must still gather and review the exact required evidence, add the
versioned compatibility/migration/rollback metadata, sign it with the separately
provisioned Ed25519 key, and run the signed verifier. Until then release
promotion remains denied and no authority is granted.
