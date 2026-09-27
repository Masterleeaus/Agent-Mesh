"use client";

import { FormEvent, useMemo, useState } from "react";
import { TitanInteractionClient } from "../titan/runtime/interaction-client";
import { createZeroHttpTransport } from "../titan/runtime/zero-http-transport";

type Pulse = { attention: number; jobs: number; onTrack: number; exceptions: number; activeWorkers: number; waitingWorkers: number; approvals: number };

export function ZeroChatFirst({ pulse, companyId }: { pulse: Pulse; companyId: string }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "accepted" | "unavailable" | "failed">("idle");
  const [lastReply, setLastReply] = useState<string | null>(null);
  const conversationId = `zero:${companyId}:primary`;
  const interaction = useMemo(() => new TitanInteractionClient({
    company_id: companyId,
    conversation_id: conversationId,
    surface: "zero",
    transport: createZeroHttpTransport(),
  }), [companyId, conversationId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || status === "sending") return;
    setStatus("sending");
    setLastReply(null);
    try {
      const events = await interaction.send(text);
      const reply = [...events].reverse().find((item) => item.message?.from === "zero")?.message?.text;
      setLastReply(reply ?? null);
      setMessage("");
      setStatus("accepted");
    } catch (error) {
      const code = (error as { code?: string }).code;
      setStatus(code === "ZERO_RUNTIME_UNAVAILABLE" ? "unavailable" : "failed");
    }
  }

  return (
    <section aria-labelledby="zero-heading" style={{ display: "grid", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
      <div>
        <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "var(--text-sm)", letterSpacing: ".08em" }}>ZERO</p>
        <h1 id="zero-heading" style={{ margin: "var(--space-1) 0 0" }}>What needs attention?</h1>
      </div>
      <form onSubmit={submit} aria-label="Chat with Zero" style={{ display: "flex", gap: "var(--space-2)" }}>
        <label htmlFor="zero-chat" className="sr-only">Chat with Zero</label>
        <input id="zero-chat" name="q" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Chat with Zero…" autoComplete="off" disabled={status === "sending"} style={{ flex: 1, minHeight: 48, padding: "0 var(--space-3)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-card)", color: "inherit", fontSize: "1rem" }} />
        <button type="submit" aria-label="Send to Zero" disabled={status === "sending" || !message.trim()} style={{ minWidth: 48, minHeight: 48 }}>{status === "sending" ? "…" : "Send"}</button>
      </form>
      <div aria-live="polite" style={{ color: status === "failed" || status === "unavailable" ? "var(--danger, #b42318)" : "var(--fg-muted)", fontSize: "var(--text-sm)" }}>
        {status === "unavailable" ? "Zero’s persistent runtime is not available. No business action was taken." : null}
        {status === "failed" ? "Zero could not accept that request. No business action was taken." : null}
        {status === "accepted" && !lastReply ? "Request accepted by Zero." : null}
        {lastReply ?? null}
      </div>
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
