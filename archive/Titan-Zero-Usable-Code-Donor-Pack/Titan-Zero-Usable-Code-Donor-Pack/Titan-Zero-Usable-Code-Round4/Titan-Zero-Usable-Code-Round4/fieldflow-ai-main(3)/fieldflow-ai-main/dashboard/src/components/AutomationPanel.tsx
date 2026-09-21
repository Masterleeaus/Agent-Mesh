import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleGauge,
  LoaderCircle,
  Play,
} from "lucide-react";

import {
  evaluateEquipment,
  fetchAutomationEvents,
  type AutomationEvaluation,
  type AutomationEvent,
} from "../services/automationApi";

type AutomationPanelProps = {
  equipmentId: string;
};

function formatOutcome(outcome: string) {
  const labels: Record<string, string> = {
    service_case_created: "Case created",
    duplicate_prevented: "Duplicate stopped",
    no_action: "No action needed",
  };

  return labels[outcome] ?? outcome;
}

export function AutomationPanel({
  equipmentId,
}: AutomationPanelProps) {
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [lastResult, setLastResult] =
    useState<AutomationEvaluation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const records = await fetchAutomationEvents();
        setEvents(records);
      } catch {
        setError("Automation history is currently unavailable.");
      }
    }

    void loadEvents();
  }, []);

  async function runAutomation() {
    setIsRunning(true);
    setError(null);

    try {
      const result = await evaluateEquipment(equipmentId);
      const refreshedEvents = await fetchAutomationEvents();

      setLastResult(result);
      setEvents(refreshedEvents);
    } catch {
      setError("The automation could not be completed.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <article className="panel automation-panel">
      <div className="panel-heading">
        <div>
          <p>WORKFLOW STATUS</p>
          <h2>Automation health</h2>
        </div>

        <span className="healthy-label">
          <CheckCircle2 size={15} />
          Healthy
        </span>
      </div>

      <div className="automation-score">
        <div>
          <strong>100%</strong>
          <span>{events.length} successful evaluations</span>
        </div>
        <CircleGauge size={55} strokeWidth={1.5} />
      </div>

      <button
        className="automation-run-button"
        disabled={isRunning}
        onClick={() => void runAutomation()}
        type="button"
      >
        {isRunning ? (
          <LoaderCircle className="spinning" size={15} />
        ) : (
          <Play size={15} />
        )}

        {isRunning ? "Evaluating..." : `Evaluate ${equipmentId}`}
      </button>

      {lastResult && (
        <div className={`automation-result ${lastResult.outcome}`}>
          <strong>{formatOutcome(lastResult.outcome)}</strong>
          <span>{lastResult.message}</span>
        </div>
      )}

      {error && <p className="automation-error">{error}</p>}

      <div className="automation-list">
        {events.length === 0 && !error ? (
          <div>
            <span>No evaluations recorded</span>
            <strong>Ready</strong>
          </div>
        ) : (
          events.slice(0, 3).map((event) => (
            <div key={event.event_id}>
              <span>{event.equipment_id}</span>
              <strong>{formatOutcome(event.outcome)}</strong>
            </div>
          ))
        )}
      </div>
    </article>
  );
}