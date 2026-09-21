export type ApiEquipmentStatus =
  | "operational"
  | "warning"
  | "critical"
  | "offline"
  | "maintenance";

export type ApiEquipment = {
  equipment_id: string;
  model: string;
  category: string;
  serial_number: string;
  location: string;
  assigned_dealer: string;
  status: ApiEquipmentStatus;
  engine_hours: number;
  fuel_level: number;
  health_score: number;
  last_service_date: string;
};

export type ApiTelemetry = {
  equipment_id: string;
  recorded_at: string;
  engine_temperature_c: number;
  hydraulic_pressure_psi: number;
  engine_rpm: number;
  battery_voltage: number;
  fuel_level: number;
  connectivity: "online" | "degraded" | "offline";
  health_status: ApiEquipmentStatus;
  alerts: string[];
};

export type ApiServiceCase = {
  case_id: number;
  equipment_id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "scheduled" | "resolved";
  source: "manual" | "telemetry" | "automation" | "ai_agent";
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateServiceCaseRequest = {
  equipment_id: string;
  title: string;
  description: string;
  priority: ApiServiceCase["priority"];
  source?: ApiServiceCase["source"];
  assigned_to?: string | null;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(
      `FieldFlow API request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(
  path: string,
  requestBody: unknown,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(
      `FieldFlow API request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export function fetchEquipment(): Promise<ApiEquipment[]> {
  return getJson<ApiEquipment[]>("/api/equipment");
}

export function fetchTelemetry(
  equipmentId: string,
): Promise<ApiTelemetry> {
  return getJson<ApiTelemetry>(
    `/api/equipment/${equipmentId}/telemetry`,
  );
}

export function fetchServiceCases(): Promise<ApiServiceCase[]> {
  return getJson<ApiServiceCase[]>("/api/service-cases");
}

export function createServiceCase(
  request: CreateServiceCaseRequest,
): Promise<ApiServiceCase> {
  return postJson<ApiServiceCase>("/api/service-cases", request);
}