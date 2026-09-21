const API_BASE_URL = "http://127.0.0.1:8000";

export type AgentChatResponse = {
  interaction_id: number;
  reply: string;
  intent: string;
  confidence: number;
  equipment_id: string | null;
  requires_confirmation: boolean;
  action_status: string;
  service_case_id: number | null;
  recommended_actions: string[];
  sources: string[];
  created_at: string;
};

export async function sendAgentMessage(
  message: string,
  confirmAction = false,
) {
  const response = await fetch(`${API_BASE_URL}/api/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      confirm_action: confirmAction,
    }),
  });

  if (!response.ok) {
    throw new Error("The Service Agent could not process the request.");
  }

  return (await response.json()) as AgentChatResponse;
}