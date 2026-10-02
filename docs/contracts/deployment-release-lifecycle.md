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
| `created_at`, `expires_at` | ISO timestamps, valid now, maximum 24-hour window |
| `profile` | `portable` or `directadmin` |
| `artifacts` | Records `{role,path,sha256}`; SHA-256 lowercase hex; root-relative portable file paths; no links, traversal, duplicate/case-colliding paths or directories |
| Artifact roles | Required `web`, `worker`, `workforce`, `config`, `migrations`, `sbom`, `provenance`; `evidence` for referenced verification records. Runtime artifacts must be the shipped builds/images, not source-only archives. Config artifacts contain templates/references, never secret values. |
| `rollback` | Different previous-known-good `version` and exact signed payload `manifest_sha256` |
| `migrations` | `{owner,version,rollback_compatible:true}` for GLOBAL_REGISTRY, COMPANY_NATIVE_FSM, RUNTIME, WORKFORCE, AUTHORITY, EVIDENCE, COMPATIBILITY; version `none` explicitly documents an unused owner |
| `compatibility` | `node` version constraint and at least two distinct `substrates` |
| `unresolved_p0` | Explicit empty array from reviewed current issue/closure evidence |
| `regression_count` | Exactly 0, without a tolerated failing baseline |
| `installer_status` | `passed` |
| `checks` | Unique `{id,status,release_id,source_sha,subject_sha256,evidence_path,observed_at}` records; all passed, candidate-bound, recorded within the manifest time window, referencing checksummed evidence files |

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
query live GitHub. Reverify immediately before governed promotion, keep staged
files read-only throughout verification and use the verified immutable digests
at activation. Preserve the envelope and output as evidence; they grant no
business authority. Never treat a copied JSON success record as authorization.
