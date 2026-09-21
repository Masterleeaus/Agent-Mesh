# Required Mega Pack 1 scope rebase

The earlier `Titan-Zero-Developer-Intelligence-Mega-Pack-v1.0.0` was created while extension internals were temporarily out of scope. That decision has been superseded.

When Pack 1 is integrated beside this pack, the integrating agent MUST remove the old locked exclusion behavior:

- `ignoreExtensions: true` must not remain a locked default.
- `app/Extensions/**` must be eligible for project/symbol/route/service/model/migration/frontend analysis.
- Documentation saying extension internals are deliberately excluded must be updated.
- Any snapshot policy that filters `app/Extensions/**` must be rebased.
- Extension code remains subject to the same secret/path protections as core code.

Do not blindly edit the historical Pack 1 ZIP. Apply this rebase to the actual current Codee integration after deep-scanning the receiver code.
