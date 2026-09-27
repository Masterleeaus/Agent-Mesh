# Authorization Matrix

| Operation | Authority rule |
|---|---|
| Resolve authenticated principal | Host authorization adapter | Tenant/user identity comes from authenticated/trusted host context, never request overrides. |
| Super Admin | Platform bypass | `isSuperAdmin()` may grant wildcard capability. |
| Delegated Admin | Explicit delegation only | `isAdmin()` alone is **not** an unconditional bypass; delegated permissions remain bounded. |
| Ordinary permissions | Host methods | `can()`, `checkPermission()`, `hasPermissionTo()` and enumerated permission collections are supported. |
| Render Hub object/facet/view/action | Interface filter + source auth | Product surface and `customer_safe` must permit Hub; declared capabilities must be present. |
| Read authoritative object data | Owning read adapter | Source authority re-authorizes the canonical tenant/user/object context. |
| Present a mutation | Interface only | Returns non-executable intent referencing governed capability or Interaction Engine. |
| Execute mutation | External governed authority | Interface Runtime never performs direct business writes. |
| Host navigation self-heal | Compatibility boundary | May update only Titan Interface Runtime's own host-menu metadata; preserves administrator order/enabled state. |

Offline mode never increases authority. Child contexts cannot change tenant, user, roles, capabilities, product surface, trace or correlation identity.
