export type VerticalProfile = { profile_id: string; version: string; terminology: Record<string, string>; templates: readonly string[]; workflow_defaults: readonly string[]; canonical_dependencies: readonly string[]; forbidden_owners: readonly string[] };
export type CompiledVerticalProfile = { profile_id: string; version: string; terminology: Readonly<Record<string, string>>; templates: readonly string[]; workflow_defaults: readonly string[]; provenance: 'canonical-profile-compiler/v1' };
const FORBIDDEN = new Set(['customer', 'jobs', 'work-orders', 'scheduling', 'dispatch', 'finance', 'workforce', 'authority', 'evidence']);

export function compileVerticalProfile(profile: VerticalProfile): CompiledVerticalProfile {
  if (!profile.profile_id.trim() || !profile.version.trim()) throw new Error('vertical_identity_required');
  if (!profile.canonical_dependencies.length) throw new Error('vertical_dependencies_required');
  const forbidden = profile.forbidden_owners.filter(owner => FORBIDDEN.has(owner));
  if (forbidden.length) throw new Error(`vertical_forbidden_owner:${forbidden.sort().join(',')}`);
  const terminology = Object.fromEntries(Object.entries(profile.terminology).sort(([a], [b]) => a.localeCompare(b)));
  return { profile_id: profile.profile_id, version: profile.version, terminology, templates: [...new Set(profile.templates)].sort(), workflow_defaults: [...new Set(profile.workflow_defaults)].sort(), provenance: 'canonical-profile-compiler/v1' };
}

