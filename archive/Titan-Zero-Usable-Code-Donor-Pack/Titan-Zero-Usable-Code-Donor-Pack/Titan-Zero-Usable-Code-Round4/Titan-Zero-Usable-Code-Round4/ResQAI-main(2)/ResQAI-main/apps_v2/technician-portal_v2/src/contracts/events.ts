import type { JobDTO } from '../models/dto';

export const TECHNICIAN_PORTAL_EVENTS = {
  JOB_ACCEPTED: 'job.accepted',
  JOB_REJECTED: 'job.rejected',
  JOB_STATUS_CHANGED: 'job.status.changed',
  JOB_PAUSED: 'job.paused',
  JOB_RESUMED: 'job.resumed',
  JOB_ESCALATED: 'job.escalated',
  JOB_COMPLETED: 'job.completed',
  JOB_PROGRESS_UPDATED: 'job.progress.updated',
  NOTES_ADDED: 'notes.added',
  EVIDENCE_UPLOADED: 'evidence.uploaded',
  SIGNATURE_CAPTURED: 'signature.captured',
  PARTS_USED: 'parts.used',
  INVENTORY_REQUESTED: 'inventory.requested',
  MESSAGE_SENT: 'message.sent',
  OFFLINE_SYNC_STARTED: 'offline.sync.started',
  OFFLINE_SYNC_COMPLETED: 'offline.sync.completed',
  OFFLINE_SYNC_FAILED: 'offline.sync.failed',
  NETWORK_STATUS_CHANGED: 'network.status.changed',
  GPS_STATUS_CHANGED: 'gps.status.changed',
} as const;

export type TechnicianPortalEventName = typeof TECHNICIAN_PORTAL_EVENTS[keyof typeof TECHNICIAN_PORTAL_EVENTS];

export interface JobAcceptedPayload { jobId: string; }
export interface JobRejectedPayload { jobId: string; reason?: string; }
export interface JobStatusChangedPayload { jobId: string; previousStatus: string; newStatus: string; }
export interface JobPausedPayload { jobId: string; reason: string; }
export interface JobResumedPayload { jobId: string; }
export interface JobEscalatedPayload { jobId: string; reason: string; escalatedTo?: string; }
export interface JobCompletedPayload { jobId: string; completionNotes: string; }
export interface JobProgressUpdatedPayload { jobId: string; progress: number; }
export interface NotesAddedPayload { jobId: string; noteId: string; category: string; }
export interface EvidenceUploadedPayload { jobId: string; evidenceId: string; type: string; }
export interface SignatureCapturedPayload { jobId: string; signatureId: string; }
export interface PartsUsedPayload { jobId: string; partIds: string[]; }
export interface InventoryRequestedPayload { jobId: string; requestId: string; parts: { name: string; quantity: number }[]; }
export interface MessageSentPayload { jobId: string; messageId: string; }
export interface OfflineSyncStartedPayload { timestamp: number; }
export interface OfflineSyncCompletedPayload { timestamp: number; uploaded: number; downloaded: number; }
export interface OfflineSyncFailedPayload { error: string; }
export interface NetworkStatusChangedPayload { isOnline: boolean; }
export interface GpsStatusChangedPayload { isEnabled: boolean; }

export type TechnicianPortalEventPayload =
  | JobAcceptedPayload
  | JobRejectedPayload
  | JobStatusChangedPayload
  | JobPausedPayload
  | JobResumedPayload
  | JobEscalatedPayload
  | JobCompletedPayload
  | JobProgressUpdatedPayload
  | NotesAddedPayload
  | EvidenceUploadedPayload
  | SignatureCapturedPayload
  | PartsUsedPayload
  | InventoryRequestedPayload
  | MessageSentPayload
  | OfflineSyncStartedPayload
  | OfflineSyncCompletedPayload
  | OfflineSyncFailedPayload
  | NetworkStatusChangedPayload
  | GpsStatusChangedPayload;

export type TechnicianPortalEvent = {
  [K in TechnicianPortalEventName]: { type: K; payload: Extract<TechnicianPortalEventPayload, Record<string, unknown>> };
}[TechnicianPortalEventName];
