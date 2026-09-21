import { useEffect, useState } from "react";
import {
  Bot,
  ChevronRight,
  Clock3,
  LoaderCircle,
} from "lucide-react";

import {
  fetchServiceCases,
  type ApiServiceCase,
} from "../services/fieldflowApi";

type LoadStatus = "loading" | "success" | "error";

function formatRelativeTime(timestamp: string): string {
  const createdTime = new Date(timestamp).getTime();
  const difference = Date.now() - createdTime;
  const minutes = Math.max(0, Math.floor(difference / 60_000));

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatPriority(
  priority: ApiServiceCase["priority"],
): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function ServiceCasePanel() {
  const [serviceCases, setServiceCases] =
    useState<ApiServiceCase[]>([]);
  const [loadStatus, setLoadStatus] =
    useState<LoadStatus>("loading");

  useEffect(() => {
    let requestCancelled = false;

    async function loadServiceCases() {
      try {
        const cases = await fetchServiceCases();

        if (!requestCancelled) {
          setServiceCases(cases);
          setLoadStatus("success");
        }
      } catch (error) {
        console.error("Unable to load service cases:", error);

        if (!requestCancelled) {
          setLoadStatus("error");
        }
      }
    }

    function handleServiceCaseCreated() {
      void loadServiceCases();
    }

    void loadServiceCases();

    window.addEventListener(
      "fieldflow:service-case-created",
      handleServiceCaseCreated,
    );

    return () => {
      requestCancelled = true;

      window.removeEventListener(
        "fieldflow:service-case-created",
        handleServiceCaseCreated,
      );
    };
  }, []);

  const openCaseCount = serviceCases.filter(
    (serviceCase) => serviceCase.status !== "resolved",
  ).length;

  function openServiceAgent() {
    window.dispatchEvent(new Event("fieldflow:open-agent"));
  }

  return (
    <article className="panel case-panel">
      <div className="panel-heading">
        <div>
          <p>SERVICE QUEUE</p>
          <h2>Priority cases</h2>
        </div>

        <span className="case-count">
          {loadStatus === "success"
            ? `${openCaseCount} open`
            : "Loading"}
        </span>
      </div>

      {loadStatus === "loading" && (
        <div className="case-message">
          <LoaderCircle className="spinning" size={18} />
          Loading service cases
        </div>
      )}

      {loadStatus === "error" && (
        <div className="telemetry-error">
          Unable to retrieve service cases from the API.
        </div>
      )}

      {loadStatus === "success" && (
        <div className="case-list">
          {serviceCases.slice(0, 3).map((serviceCase) => (
            <button
              className="case-item"
              key={serviceCase.case_id}
              type="button"
            >
              <span
                className={`priority-line ${serviceCase.priority}`}
              />

              <span className="case-content">
                <span className="case-meta">
                  <strong>CASE-{serviceCase.case_id}</strong>
                  <span>
                    {formatPriority(serviceCase.priority)}
                  </span>
                </span>

                <b>{serviceCase.title}</b>

                <small>
                  {serviceCase.equipment_id}
                  {serviceCase.assigned_to
                    ? ` | ${serviceCase.assigned_to}`
                    : ""}
                </small>

                <span className="case-time">
                  <Clock3 size={14} />
                  {formatRelativeTime(serviceCase.created_at)}
                </span>
              </span>

              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      )}

      <button
        className="agent-action"
        onClick={openServiceAgent}
        type="button"
      >
        <span>
          <Bot size={19} />
        </span>

        <div>
          <strong>Ask Service Agent</strong>
          <small>Investigate an equipment issue</small>
        </div>

        <ChevronRight size={17} />
      </button>
    </article>
  );
}