# Pass 6 Verification

Verification is performed against the frozen release tree before packaging and again after clean ZIP extraction.

Required gates:

- Pass 1–6 standalone regression verifiers.
- PHP lint across every PHP source/test/tool file.
- JSON parse and Blueprint v4.1 schema validation.
- Blueprint architecture/package security scan.
- Titan host installer manifest validation.
- Titan host integrity-map verification.
- Package ledger verification.
- ZIP CRC and path-safety verification after clean extraction.
