import type { Appointment, Customer, Technician, AISuggestion } from '../types';
import {
  listRecords,
  updateRecord,
  runAgent,
  waitForAgentResponse,
  logOperation,
} from '../../../../packages/sdk/lemma-sdk';

export async function fetchAppointments(): Promise<Appointment[]> {
  return listRecords<Appointment>('appointments', 500);
}

export async function fetchCustomers(): Promise<Customer[]> {
  return listRecords<Customer>('customers', 500);
}

export async function fetchTechnicians(): Promise<Technician[]> {
  return listRecords<Technician>('technicians', 200);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string,
  actor = 'human'
): Promise<void> {
  await updateRecord('appointments', appointmentId, { status });
  await logOperation(
    'update_appointment_status',
    `Appointment ${appointmentId} → ${status}`,
    actor
  );
}

export async function assignTechnician(
  appointmentId: string,
  technicianId: string,
  technicianName: string,
  actor = 'human'
): Promise<void> {
  await updateRecord('appointments', appointmentId, {
    technician_id: technicianId,
  });
  await logOperation(
    'assign_technician',
    `Appointment ${appointmentId} → tech ${technicianName} (${technicianId})`,
    actor
  );
}

export interface SuggestTechInput {
  serviceType: string;
  date: string;
  customerName: string;
  availableTechs: { name: string; skill: string; availability: string }[];
}

export async function suggestTechnician(
  input: SuggestTechInput
): Promise<AISuggestion | null> {
  const prompt = `You are a scheduling coordinator. Given a service request and available technicians, suggest the best technician.

Service type: ${input.serviceType}
Date: ${input.date}
Customer: ${input.customerName}

Available technicians:
${input.availableTechs
  .map(
    (t) =>
      `- ${t.name} (skill: ${t.skill}, availability: ${t.availability})`
  )
  .join('\n')}

Return a JSON object with:
- pick_tech_name: the chosen technician's name
- score: a confidence score 0-100
- rationale: brief explanation
- alternatives: array of alternative tech names`;

  const conv = await runAgent(
    'tech-suggester',
    prompt,
    'Tech Suggestion'
  );
  const text = await waitForAgentResponse(conv.id);
  try {
    return JSON.parse(text) as AISuggestion;
  } catch {
    return null;
  }
}
