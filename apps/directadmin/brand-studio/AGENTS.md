# Titan Web DirectAdmin plugin

This package is a company-bound presentation adapter only. Canonical identity,
company access, site inventory, publication, storage, secrets and consequential
actions remain with their owning Titan services and governed APIs. Never infer
identity or permission from a DirectAdmin role, local files, URL parameters or
browser state. Never render secret values or raw provider payloads.

Keep role entrypoints non-authoritative and fail closed. Do not provision,
modify, or delete customer websites or business data from install/update/
uninstall scripts. Provider acknowledgement is not a verified business outcome.
