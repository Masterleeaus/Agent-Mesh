export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
  notes?: string;
}

export interface Technician {
  id: string;
  name: string;
  skill: string;
  availability: string;
  rating?: number;
  status: string;
}

export interface Appointment {
  id: string;
  customer_id: string;
  service_type: string;
  date: string;
  status: string;
  technician_id?: string;
  notes?: string;
}

export interface Ticket {
  id: string;
  customer_name?: string;
  channel: string;
  subject: string;
  message: string;
  request_type?: string;
  urgency?: string;
  suggested_owner?: string;
  owner?: string;
  draft_reply?: string;
  human_notes?: string;
  approved_to_send?: boolean;
  status: string;
  created_at?: string;
}

export interface Dispute {
  id: string;
  appointment_id: string;
  customer_claim: string;
  provider_claim: string;
  evidence_summary: string;
  recommended_resolution?: string;
  resolution_reason?: string;
  confidence?: number;
  status: string;
  human_notes?: string;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  owner?: string;
  priority?: string;
  status: string;
  due_date?: string;
}

export interface Followup {
  id: string;
  account_id: string;
  customer_id?: string;
  subject: string;
  type: string;
  status: string;
  priority: string;
  due_date?: string;
  owner?: string;
  related_appointment_id?: string;
  related_ticket_id?: string;
  related_dispute_id?: string;
  notes?: string;
}

export interface Account {
  id: string;
  customer_id?: string;
  name: string;
  relationship_status?: string;
  health?: string;
  health_score?: number;
  primary_service_type?: string;
  last_contact_date?: string;
  last_service_date?: string;
  next_follow_up_due?: string;
  lifetime_jobs?: number;
  lifetime_revenue_cents?: number;
  open_followups?: number;
  overdue_followups?: number;
  open_disputes?: number;
  owner?: string;
  notes?: string;
}

export interface OperationsLogEntry {
  id: string;
  action: string;
  result?: string;
  timestamp: string;
  actor: string;
}

export interface SlippingFollowupItem {
  followup_id: string;
  account_id: string;
  customer_id: string;
  customer_name: string;
  subject: string;
  type: string;
  status: string;
  priority: string;
  due_date: string;
  days_overdue: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  bucket: 'overdue' | 'due_today' | 'due_soon';
  owner?: string;
  related_appointment_id?: string;
  related_ticket_id?: string;
  notes?: string;
}

export interface AccountHealthScanResult {
  today: string;
  scan_params: Record<string, unknown>;
  totals: { scanned: number; wrote_back: number; signpost_totals: Record<string, number> };
  by_health: { healthy: number; watch: number; slipping: number; critical: number };
  top_risk: AccountHealthRow[];
  all_rows: AccountHealthRow[];
}

export interface AccountHealthRow {
  account_id: string;
  customer_id: string;
  name: string;
  relationship_status: string;
  prior_health: string;
  new_health: string;
  new_score: number;
  score_delta: number;
  open_followups: number;
  overdue_followups: number;
  open_disputes: number;
  signposts: AccountRiskSignal[];
  summary: string;
  prior_score?: number;
  days_since_last_contact?: number;
  days_since_last_service?: number;
}

export interface AccountRiskSignal {
  label: string;
  weight: number;
}

export interface FlagSlippingFollowupsResult {
  today: string;
  window: { days_ahead: number; from: string; to: string };
  counts: { total_scanned: number; slipping: number; overdue: number; due_today: number; due_soon: number; excluded_completed: number; excluded_outside_window: number };
  top: SlippingFollowupItem[];
}

export type AgentConversation = {
  id: string;
};

export type AgentMessage = {
  id: string;
  role: string;
  text?: string;
  metadata?: { is_final_answer?: boolean };
};
