"use client";

import { useState } from "react";

type Pulse = { attention: number; jobs: number; onTrack: number; exceptions: number; activeWorkers: number; waitingWorkers: number; approvals: number };

export function ZeroChatFirst({ pulse }: { pulse: Pulse }) {
  const [message, setMessage] = useState("");
  return (
    <section aria-labelledby="zero-heading" style={{ display: "grid", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
      <div>
        <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "var(--text-sm)", letterSpacing: ".08em" }}>ZERO</p>
        <h1 id="zero-heading" style={{ margin: "var(--space-1) 0 0" }}>What needs attention?</h1>
      </div>
      <form action="/app/zero" method="get" role="search" aria-label="Chat with Zero" style={{ display: "flex", gap: "var(--space-2)" }}>
        <label htmlFor="zero-chat" className="sr-only">Chat with Zero</label>
        <input id="zero-chat" name="q" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Chat with Zero…" autoComplete="off" style={{ flex: 1, minHeight: 48, padding: "0 var(--space-3)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-card)", color: "inherit", fontSize: "1rem" }} />
        <button type="submit" aria-label="Send to Zero" style={{ minWidth: 48, minHeight: 48 }}>Send</button>
      </form>
      <div aria-label="Business pulse" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "var(--space-2)" }}>
        <Pulse label="Needs your attention" value={`${pulse.attention} decisions`} />
        <Pulse label="Today's business" value={`${pulse.jobs} jobs · ${pulse.onTrack} on track · ${pulse.exceptions} exceptions`} />
        <Pulse label="Workforce" value={`${pulse.activeWorkers} active · ${pulse.waitingWorkers} waiting · ${pulse.approvals} need approval`} />
      </div>
    </section>
  );
}

function Pulse({ label, value }: { label: string; value: string }) {
  return <div style={{ padding: "var(--space-3)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-card)" }}><strong style={{ display: "block", fontSize: "var(--text-sm)" }}>{label}</strong><span style={{ color: "var(--fg-muted)", fontSize: "var(--text-sm)" }}>{value}</span></div>;
}
