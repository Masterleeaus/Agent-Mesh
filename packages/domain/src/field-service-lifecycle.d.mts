export declare const FIELD_SERVICE_LIFECYCLE_SCHEMA: 'titan.field-service.lifecycle.v2';
export declare const STATES: readonly ['REQUESTED', 'QUOTED', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'INVOICING_READY', 'PAID'];

export interface FieldServiceLifecycleReferences {
  customer_id?: string;
  contact_id?: string;
  location_id?: string;
  service_request_id?: string;
  job_id?: string;
  work_order_id?: string;
  quote_id?: string;
  appointment_id?: string;
  dispatch_id?: string;
  task_ids?: string[];
  worker_id?: string;
  vehicle_id?: string;
  invoice_id?: string;
  payment_id?: string;
}

export interface FieldServiceLifecycleEvent {
  event_id: string;
  idempotency_key: string;
  company_id: string;
  lifecycle_id: string;
  revision: number;
  state: (typeof STATES)[number];
  stage: string;
  authority_decision_ref: string;
  execution_id: string | null;
  evidence_refs: string[];
  references: FieldServiceLifecycleReferences;
  verified: boolean;
  provider_acknowledged: boolean;
  line_count: number | null;
  occurred_at: string;
}

export interface FieldServiceLifecycle {
  schema: typeof FIELD_SERVICE_LIFECYCLE_SCHEMA;
  company_id: string;
  lifecycle_id: string;
  request_id: string;
  state: (typeof STATES)[number];
  stage: string;
  revision: number;
  references: FieldServiceLifecycleReferences;
  evidence_refs: string[];
  events: FieldServiceLifecycleEvent[];
  completion_verified: boolean;
  provider_acknowledged: boolean;
  invoiceable_line_count: number;
  authority_effect: false;
  grants_authority: false;
}

export declare function createFieldServiceLifecycle(input: Record<string, unknown>): FieldServiceLifecycle;
export declare function appendFieldServiceLifecycleEvent(current: FieldServiceLifecycle, event: Record<string, unknown>): FieldServiceLifecycle;
export declare function transitionFieldServiceLifecycle(current: FieldServiceLifecycle, input: Record<string, unknown>): FieldServiceLifecycle;
export declare function replayFieldServiceLifecycle(events: readonly FieldServiceLifecycleEvent[]): FieldServiceLifecycle;
export declare function projectNativeFieldServiceLifecycle(input: Record<string, unknown>): FieldServiceLifecycle & { native_state: string };
export declare function executeFieldServiceTransition(input: { gateway: { execute(request: Record<string, unknown>): Promise<Record<string, unknown>> }; lifecycle: FieldServiceLifecycle; input: Record<string, unknown> }): Promise<FieldServiceLifecycle>;
export declare function summarizeFieldServiceLifecycle(current: FieldServiceLifecycle): { company_id: string; lifecycle_id: string; state: string; stage: string; revision: number; events: number; verified_completion: boolean; invoice_ready: boolean; authority_effect: false };

