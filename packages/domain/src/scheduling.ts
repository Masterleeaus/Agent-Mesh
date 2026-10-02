/** Provider-neutral native scheduling/dispatch contracts. */

export type DispatchContext = {
  company_id: string;
  actor_id: string;
  correlation_id: string;
  idempotency_key: string;
};

export type DispatchCandidate = {
  worker_id: string;
  company_id: string;
  available: boolean;
  eligible: boolean;
  territory_match: boolean;
  required_skills: string[];
  skills: string[];
  active_assignment_count: number;
  estimated_minutes: number;
};

export type AssignmentPlan = {
  kind: "ASSIGN";
  company_id: string;
  worker_id: string;
  expected_revision: number;
  idempotency_key: string;
  correlation_id: string;
};

export type DispatchRecovery =
  | { kind: "REASSIGN"; worker_id: string; reason: "WORKER_UNAVAILABLE" | "TERRITORY_DISRUPTION" }
  | { kind: "ESCALATE"; reason: "NO_ELIGIBLE_WORKER" | "AMBIGUOUS_CURRENT_ASSIGNMENT" };

function validContext(context: DispatchContext): void {
  for (const [key, value] of Object.entries(context)) if (!value.trim()) throw new Error(`dispatch_${key}_required`);
}

export function planAssignment(
  context: DispatchContext,
  work: { company_id: string; revision: number },
  candidates: DispatchCandidate[],
): AssignmentPlan {
  validContext(context);
  if (work.company_id !== context.company_id) throw new Error("dispatch_company_mismatch");
  const eligible = candidates
    .filter(c => c.company_id === context.company_id && c.available && c.eligible && c.territory_match)
    .filter(c => c.required_skills.every(skill => c.skills.includes(skill)))
    .sort((a, b) => a.active_assignment_count - b.active_assignment_count || a.estimated_minutes - b.estimated_minutes || a.worker_id.localeCompare(b.worker_id));
  if (!eligible[0]) throw new Error("dispatch_no_eligible_worker");
  return { kind: "ASSIGN", company_id: context.company_id, worker_id: eligible[0].worker_id, expected_revision: work.revision, idempotency_key: context.idempotency_key, correlation_id: context.correlation_id };
}

export function planDispatchRecovery(
  context: DispatchContext,
  work: { company_id: string; assigned_worker_id: string | null },
  candidates: DispatchCandidate[],
): DispatchRecovery {
  validContext(context);
  if (work.company_id !== context.company_id) throw new Error("dispatch_company_mismatch");
  if (candidates.filter(c => c.worker_id === work.assigned_worker_id).length > 1) return { kind: "ESCALATE", reason: "AMBIGUOUS_CURRENT_ASSIGNMENT" };
  const viable = candidates.filter(c => c.company_id === context.company_id && c.available && c.eligible && c.worker_id !== work.assigned_worker_id);
  const next = viable.find(c => c.territory_match);
  if (next) return { kind: "REASSIGN", worker_id: next.worker_id, reason: "WORKER_UNAVAILABLE" };
  if (viable[0]) return { kind: "REASSIGN", worker_id: viable[0].worker_id, reason: "TERRITORY_DISRUPTION" };
  return { kind: "ESCALATE", reason: "NO_ELIGIBLE_WORKER" };
}

