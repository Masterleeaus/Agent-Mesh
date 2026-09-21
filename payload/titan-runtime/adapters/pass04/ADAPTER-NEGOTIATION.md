# Adapter Negotiation and Feature Detection

Pass 4 introduces runtime feature detection and typed-adapter negotiation without granting permission or execution authority.

Rules:
- Feature detection reports support only.
- Capability negotiation computes compatibility only.
- Matching capability names never imply Chrome permission, Titan entitlement, approval, policy authority, or execution authority.
- Major protocol mismatch fails closed for the typed path.
- Missing required capabilities fail the typed path.
- Legacy fallback may be selected only when explicitly declared available; actual fallback execution remains a later pass.
- No permission state is inferred from feature support.
- No authority state is inferred from adapter presence, runtime identity, version compatibility, or negotiated capability.
