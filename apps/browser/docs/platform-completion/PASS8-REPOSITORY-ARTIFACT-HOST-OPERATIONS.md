# Pass 8 — Repository Host + Artifact Host Operations

Status: completed in v2.9.0.

The Infrastructure → Repository Host surface is read-only and reports privileged host readiness without conflating it with Repository Intelligence. Repository Host evidence covers filesystem access, command execution, verified backups, backup destination when reported, post-write verification, rollback capability and last mutation when reported. Artifact Host evidence covers verifier readiness, byte/hash/size/ZIP/content-manifest checks, latest accepted independent verification receipt and plans held in artifact/blocked states. No mutation action is exposed from this surface.
