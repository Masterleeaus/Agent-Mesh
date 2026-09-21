const API_BASE_URL = "http://127.0.0.1:8000";

export type AutomationEvent = {
  event_id: number;
  equipment_id: string;
  event_type: string;
  outcome: string;
  details: string;
  service_case_id: number | null;
  created_at: string;
};

export type AutomationEvaluation = {
  equipment_id: string;
  outcome: string;
  message: string;
  service_case_id: number | null;
  event_id: number;
  evaluated_at: string;
};

export async function fetchAutomationEvents() {
  const response = await fetch(`${API_BASE_URL}/api/automation-events`);

  if (!response.ok) {
    throw new Error("Unable to load automation events.");
  }

  return (await response.json()) as AutomationEvent[];
}

export async function evaluateEquipment(equipmentId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/automations/evaluate/${equipmentId}`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to evaluate equipment automation.");
  }

  return (await response.json()) as AutomationEvaluation;
}