# Security

Security invariants:

1. `tenant_company_id` and `user_id` are mandatory before tenant-scoped composition.
2. Tenant/user identity comes from authenticated/trusted host state, never caller query/body security fields.
3. Conflicting or missing tenant identity fails closed.
4. Roles and capabilities cannot be supplied or escalated through context overrides.
5. Product surface, trace ID and correlation ID cannot be rewritten by child-context propagation.
6. Presentation metadata does not bypass source authorization.
7. Hub exposure requires `customer_safe=true` and runtime/source authorization.
8. The runtime contains no direct business persistence write path.
9. Mutations are delegated to governed capabilities or Interaction Engine references.
10. Offline operation never increases authority.
11. Tenant-scoped object declarations must use canonical `tenant_company_id`; alternative tenant keys fail closed.
12. Tenant-scoped object references must carry an explicit tenant identifier matching the authenticated Interface Context before source lookup.
13. Global object references must not carry tenant qualifiers.
14. Object identifiers are opaque bounded tokens; paths, control characters and traversal syntax are rejected.

Trusted upstream middleware may bind a verified `tenant_company_id` as a server-side request attribute. The default authenticated principal provider also supports the host's active/current/company user attributes and fails closed if those sources conflict.
