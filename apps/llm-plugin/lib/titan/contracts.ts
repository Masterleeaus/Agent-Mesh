export const titanCapabilities = ["ask_titan", "customers", "bookings", "jobs", "quotes", "invoices", "messages"] as const;
export const titanAutonomyModes = ["suggest", "assist", "semi_auto", "auto", "trusted_auto"] as const;
export const titanTrustStates = ["earning", "eligible", "granted", "stable", "watch", "degraded", "suspended", "earned_but_plan_locked"] as const;

export type TitanCapability = (typeof titanCapabilities)[number];
export type TitanOperation = "query" | "prepare" | "confirm" | "create" | "update" | "cancel" | "authority_status" | "request_autonomy" | "upgrade_options";
export type TitanAgentClass = "worker" | "specialist" | "manager" | "orchestrator";
export type TitanAutonomyMode = (typeof titanAutonomyModes)[number];
export type TitanTrustState = (typeof titanTrustStates)[number];

export type TitanActorContext = {
  actor_id: string; company_id: string; surface: "chatgpt"; trace_id: string;
  auth_source: "titan_authenticated_session"; session_ref: string; entitlement_ref?: string;
};
export type TitanExecutionContext = { correlation_id: string; causation_id?: string; idempotency_key: string };
export type TitanCapabilityRequest = { capability: TitanCapability; operation?: TitanOperation; request: string | null; payload?: Record<string, unknown>; context: TitanActorContext; execution?: TitanExecutionContext };
export type TitanDelegationNode = { agent_id: string; class: TitanAgentClass; display_name?: string; responsibility?: string };
export type TitanAuthorityProjection = {
  responsibility_scope?: string;
  desired_mode?: TitanAutonomyMode;
  earned_mode?: TitanAutonomyMode;
  effective_mode: TitanAutonomyMode;
  entitlement_ceiling?: TitanAutonomyMode;
  trust_state?: TitanTrustState;
  plan_locked?: boolean;
  next_eligible_mode?: TitanAutonomyMode;
  handshake?: { platform: "approved"|"pending"|"denied"; user: "approved"|"pending"|"denied"; assurance: "approved"|"pending"|"denied"; hierarchy_gates?: Array<{ agent_id: string; class: TitanAgentClass; state: "approved"|"pending"|"denied" }> };
  reason_codes?: string[];
};
export type TitanWorkforceProjection = {
  active_agent?: TitanDelegationNode; delegation_chain?: TitanDelegationNode[]; authority?: TitanAuthorityProjection;
  approval?: { required: boolean; reason?: string; gate_count?: number };
  outcome?: { status: "pending"|"verified"|"failed"|"recovered"; summary?: string; verified?: boolean; evidence_refs?: string[] };
  execution?: { correlation_id: string; causation_id?: string; idempotency_key?: string; event_ids?: string[]; recovery?: { available: boolean; rewind_ref?: string; status?: "not_required"|"available"|"requested"|"completed"|"failed" } };
};
export type TitanUiCard = { id: string; kind: "customer"|"booking"|"job"|"quote"|"invoice"|"message"|"status"|"approval"|"workforce"|"autonomy"|"upgrade"; title: string; subtitle?: string; fields?: Array<{label:string;value:string}>; actions?: Array<{id:string;label:string;capability:TitanCapability;operation:TitanOperation;payload?:Record<string,unknown>}> };
export type TitanReceipt = { receipt_id:string; trace_id:string; correlation_id?:string; causation_id?:string; capability:TitanCapability; status:"requires_backend_binding"|"requires_approval"|"accepted"|"completed"|"rejected"|"plan_locked"; authority_path:"risk>shield>governance>autonomy>command_bus"; message:string; cards?:TitanUiCard[]; workforce?:TitanWorkforceProjection; requires_approval?:boolean; approval_token?:string };
