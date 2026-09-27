# Pass 20 Hotfix 1 Verification

The hotfix is complete only when: (1) the v1.0.0 regression reproduces declared-only `.gitkeep` paths; (2) v1.0.1 has no hidden package files; (3) live-style visible-file keys exactly equal `extension.json.integrity.files`; (4) every declared SHA-256 matches; (5) cumulative Pass 1–20 tests remain green; and (6) the host-compatible ZIP passes clean extraction/path/CRC checks.
