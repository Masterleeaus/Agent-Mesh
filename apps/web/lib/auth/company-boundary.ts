/**
 * Compatibility adapter while the authenticated web session still names its
 * boundary accountId. No request-supplied company_id is accepted.
 *
 * The current web schema has no separate account→company mapping authority, so
 * the authenticated account UUID is normalized into the canonical company_id
 * namespace here. Remove this adapter when AuthSession exposes companyId.
 */
export function canonicalCompanyIdFromSession(accountId:string):string{
 const company_id=String(accountId??"").trim();
 if(!company_id)throw new Error("CANONICAL_COMPANY_BOUNDARY_UNAVAILABLE");
 return company_id;
}
