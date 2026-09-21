import type {
  Appointment as SharedAppointment,
  Customer as SharedCustomer,
  Technician as SharedTechnician,
} from '../../../../packages/types';

export type Customer = SharedCustomer;
export type Technician = SharedTechnician;
export type Appointment = SharedAppointment;

export { SERVICE_LABELS, STATUS_VARIANTS, formatServiceType } from '../../../../packages/config/constants';

export interface AppointmentwithDetails extends Appointment {
  customer_name?: string;
  customer_phone?: string;
  technician_name?: string;
}

export interface AISuggestion {
  pick_tech_name: string;
  score: number;
  rationale: string;
  alternatives: string[];
}

export type AppointmentSection = 'today' | 'upcoming' | 'followup' | 'past';

export interface AppointmentGroup {
  section: AppointmentSection;
  title: string;
  items: AppointmentwithDetails[];
}
