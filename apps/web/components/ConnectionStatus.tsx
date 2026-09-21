"use client";

import { useEffect, useState } from "react";

/** Passive connection indicator. It never queues or executes commands. */
export function ConnectionStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-status-banner"
      style={{
        margin: "var(--space-3) var(--space-4) 0",
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        color: "var(--fg-muted)",
        fontSize: "var(--text-sm)",
      }}
    >
      <strong style={{ color: "var(--fg)" }}>Offline.</strong>{" "}
      You can keep reviewing available data. Actions that need the server stay unavailable until the connection returns.
    </div>
  );
}
