type Pulse = { attention: number; jobs: number };

export function ZeroChatFirst({ pulse }: { pulse: Pulse }) {
  return (
    <section aria-labelledby="zero-heading" style={{ display: "grid", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
      <div>
        <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "var(--text-sm)", letterSpacing: ".08em" }}>ZERO</p>
        <h1 id="zero-heading" style={{ margin: "var(--space-1) 0 0" }}>What needs attention?</h1>
      </div>
      <p role="status" style={{ margin: 0, color: "var(--fg-muted)" }}>Zero chat is awaiting its governed runtime connection. Operational counts below are live.</p>
      <div aria-label="Business pulse" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "var(--space-2)" }}>
        <Pulse label="Needs your attention" value={`${pulse.attention} unread alerts`} />
        <Pulse label="Today's business" value={`${pulse.jobs} scheduled visits`} />
        <Pulse label="Workforce and approvals" value="Status unavailable" />
      </div>
    </section>
  );
}

function Pulse({ label, value }: { label: string; value: string }) {
  return <div style={{ padding: "var(--space-3)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-card)" }}><strong style={{ display: "block", fontSize: "var(--text-sm)" }}>{label}</strong><span style={{ color: "var(--fg-muted)", fontSize: "var(--text-sm)" }}>{value}</span></div>;
}
