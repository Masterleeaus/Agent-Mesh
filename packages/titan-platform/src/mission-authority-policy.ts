export type MissionPolicyRule =
  | { kind: "max_amount"; currency: string; amount: number }
  | { kind: "requires_approval"; operation: string }
  | { kind: "allowed_capabilities"; capabilities: string[] };

export type MissionPolicyInput = {
  company_id: string;
  policy_id: string;
  version: number;
  statement: string;
  source_ref: string;
  author_id: string;
  approver_id: string;
  scope: { mission_id: string; agent_ids?: string[] };
  effective_from: string;
  effective_until?: string | null;
  rules: MissionPolicyRule[];
};

export type CompiledMissionPolicy = MissionPolicyInput & {
  schema: "titan.mission-authority-policy.v1";
  status: "active";
  compiled_at: string;
};

export type MissionAuthorityContext = {
  company_id: string;
  mission_id: string;
  agent_id?: string;
  operation: string;
  capability: string;
  amount?: number;
  currency?: string;
  now?: string;
  mission_state?: "active" | "paused" | "closed";
  revoked?: boolean;
  expired?: boolean;
};

export type MissionAuthorityResult = {
  decision: "allow" | "approval_required" | "deny";
  reason: string;
  policy_id: string;
  policy_version: number;
  constraints: readonly string[];
};

const required = (value: unknown, name: string): string => {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(`${name}-required`);
  return normalized;
};

const date = (value: unknown, name: string): string => {
  const normalized = required(value, name);
  if (!Number.isFinite(Date.parse(normalized))) throw new Error(`${name}-invalid`);
  return normalized;
};

export function compileMissionAuthorityPolicy(input: MissionPolicyInput): CompiledMissionPolicy {
  const company_id = required(input.company_id, "company_id");
  const policy_id = required(input.policy_id, "policy_id");
  const statement = required(input.statement, "statement");
  const source_ref = required(input.source_ref, "source_ref");
  const author_id = required(input.author_id, "author_id");
  const approver_id = required(input.approver_id, "approver_id");
  if (!Number.isInteger(input.version) || input.version < 1) throw new Error("policy-version-invalid");
  if (!input.scope || required(input.scope.mission_id, "mission_id") === "") throw new Error("mission_id-required");
  if (author_id === approver_id) throw new Error("author-cannot-approve-own-policy");
  const effective_from = date(input.effective_from, "effective_from");
  const effective_until = input.effective_until == null ? null : date(input.effective_until, "effective_until");
  if (effective_until && Date.parse(effective_until) <= Date.parse(effective_from)) throw new Error("policy-period-invalid");
  if (!Array.isArray(input.rules) || input.rules.length === 0) throw new Error("policy-rules-required");
  const rules = input.rules.map((rule) => {
    if (rule.kind === "max_amount") {
      if (!Number.isFinite(rule.amount) || rule.amount < 0) throw new Error("policy-amount-invalid");
      return { ...rule, currency: required(rule.currency, "currency").toUpperCase() };
    }
    if (rule.kind === "requires_approval") return { ...rule, operation: required(rule.operation, "operation") };
    if (rule.kind === "allowed_capabilities") {
      const capabilities = [...new Set((rule.capabilities ?? []).map((v) => required(v, "capability")))];
      if (!capabilities.length) throw new Error("policy-capabilities-required");
      return { ...rule, capabilities };
    }
    throw new Error("policy-rule-invalid");
  });
  return Object.freeze({ ...input, company_id, policy_id, statement, source_ref, author_id, approver_id,
    scope: { ...input.scope, mission_id: required(input.scope.mission_id, "mission_id") }, effective_from,
    effective_until, rules, schema: "titan.mission-authority-policy.v1", status: "active", compiled_at: new Date().toISOString() });
}

export function evaluateMissionAuthorityPolicy(policy: CompiledMissionPolicy, context: MissionAuthorityContext): MissionAuthorityResult {
  if (policy.company_id !== required(context.company_id, "company_id")) throw new Error("policy-company-mismatch");
  if (policy.scope.mission_id !== required(context.mission_id, "mission_id")) throw new Error("policy-mission-mismatch");
  const now = Date.parse(context.now ?? new Date().toISOString());
  if (!Number.isFinite(now)) throw new Error("policy-now-invalid");
  if (context.revoked || context.expired || context.mission_state === "paused" || context.mission_state === "closed")
    return result(policy, "deny", context.revoked ? "policy-revoked" : "mission-not-active");
  if (now < Date.parse(policy.effective_from) || (policy.effective_until && now >= Date.parse(policy.effective_until)))
    return result(policy, "deny", "policy-outside-effective-window");
  if (policy.scope.agent_ids?.length && (!context.agent_id || !policy.scope.agent_ids.includes(context.agent_id)))
    return result(policy, "deny", "agent-outside-mission-scope");
  const allowed = policy.rules.find((rule) => rule.kind === "allowed_capabilities");
  if (allowed?.kind === "allowed_capabilities" && !allowed.capabilities.includes(context.capability))
    return result(policy, "deny", "capability-not-allowed");
  const ceiling = policy.rules.find((rule) => rule.kind === "max_amount");
  if (ceiling?.kind === "max_amount" && (context.currency ?? "").toUpperCase() !== ceiling.currency)
    return result(policy, "deny", "currency-mismatch");
  if (ceiling?.kind === "max_amount" && (context.amount == null || !Number.isFinite(context.amount) || context.amount > ceiling.amount))
    return result(policy, "deny", "amount-limit-exceeded");
  if (policy.rules.some((rule) => rule.kind === "requires_approval" && rule.operation === context.operation))
    return result(policy, "approval_required", "policy-approval-required");
  return result(policy, "allow", "policy-constraints-satisfied");
}

function result(policy: CompiledMissionPolicy, decision: MissionAuthorityResult["decision"], reason: string): MissionAuthorityResult {
  return Object.freeze({ decision, reason, policy_id: policy.policy_id, policy_version: policy.version,
    constraints: Object.freeze(policy.rules.map((rule) => rule.kind)) });
}
