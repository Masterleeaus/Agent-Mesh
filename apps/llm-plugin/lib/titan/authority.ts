import type { TitanAutonomyMode, TitanAuthorityProjection } from "./contracts";
const rank: Record<TitanAutonomyMode, number> = { suggest:0, assist:1, semi_auto:2, auto:3, trusted_auto:4 };
export function isPlanLocked(a: TitanAuthorityProjection): boolean { return !!a.earned_mode && !!a.entitlement_ceiling && rank[a.earned_mode] > rank[a.entitlement_ceiling]; }
export function canRequestMode(a: TitanAuthorityProjection, requested: TitanAutonomyMode): boolean {
  if (!a.earned_mode || !a.entitlement_ceiling) return false;
  return rank[requested] <= rank[a.earned_mode] && rank[requested] <= rank[a.entitlement_ceiling];
}
export function authoritySummary(a: TitanAuthorityProjection): string {
  if (a.plan_locked || isPlanLocked(a)) return "Titan has earned more authority for this responsibility than the current plan permits.";
  if (a.desired_mode && a.desired_mode !== a.effective_mode) return `Desired ${a.desired_mode}; currently effective ${a.effective_mode}. Titan applies the most restrictive valid authority gate.`;
  return `Effective autonomy: ${a.effective_mode}.`;
}
