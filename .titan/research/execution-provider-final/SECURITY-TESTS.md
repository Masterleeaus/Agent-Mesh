# Security Tests

Required certification cases:

- denied authority
- expired authority
- revoked authority
- wrong company / cross-company attempt
- malformed provider response
- browser prompt injection / hostile page content
- duplicate execution / retry / reconnect
- provider timeout/failure
- WAITING_USER_AUTH
- WAITING_MFA
- WAITING_APPROVAL
- verification failure after provider acknowledgement

Expected invariant: none of these may yield a false verified business outcome.
