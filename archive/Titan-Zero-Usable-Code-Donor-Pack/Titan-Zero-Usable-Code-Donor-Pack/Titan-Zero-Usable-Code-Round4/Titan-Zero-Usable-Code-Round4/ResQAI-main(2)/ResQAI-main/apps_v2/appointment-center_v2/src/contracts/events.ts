export const AppointmentEvents = {
  Created: 'appointment.created',
  Assigned: 'appointment.assigned',
  StatusChanged: 'appointment.status.changed',
  Cancelled: 'appointment.cancelled',
  Completed: 'appointment.completed',
  Rescheduled: 'appointment.rescheduled',
  Updated: 'appointment.updated',
  NoShow: 'appointment.no_show',
  ConflictDetected: 'appointment.conflict_detected',
  BatchAction: 'appointment.batch_action',
} as const;

export interface AppointmentCreatedPayload {
  appointmentId: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  technicianId: string;
}

export interface AppointmentAssignedPayload {
  appointmentId: string;
  technicianId: string;
  technicianName: string;
  assignedBy: string;
}

export interface AppointmentStatusChangedPayload {
  appointmentId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}

export interface AppointmentCancelledPayload {
  appointmentId: string;
  reason: string;
  cancelledBy: string;
}

export interface AppointmentCompletedPayload {
  appointmentId: string;
  technicianId: string;
  notes: string;
  completedBy: string;
}

export interface AppointmentRescheduledPayload {
  appointmentId: string;
  oldDate: string;
  newDate: string;
  oldTimeSlot: string;
  newTimeSlot: string;
  reason: string;
}

export interface AppointmentUpdatedPayload {
  appointmentId: string;
  updatedFields: string[];
  updatedBy: string;
}

export interface AppointmentNoShowPayload {
  appointmentId: string;
  customerId: string;
  technicianId: string;
}

export interface ConflictDetectedPayload {
  appointmentId: string;
  conflictType: string;
  message: string;
}

export interface BatchActionPayload {
  appointmentIds: string[];
  action: string;
  performedBy: string;
}
