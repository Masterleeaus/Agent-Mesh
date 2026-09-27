# Failure Modes

The runtime is designed to fail closed for missing tenant/user context and to degrade individual contribution sources rather than taking down Titan Zero. Pass 1 does not yet discover contributors. Direct business writes are prohibited even during degraded operation.
