import { notFound } from "next/navigation";
import { portableQuery, portableQueryOne } from "@/lib/db/portable";

export const dynamic = "force-dynamic";

type ReportRow = Record<string, unknown> & {
  visit_id: string;
  account_name: string | null;
  job_title: string | null;
  scheduled_start: string | Date;
  scheduled_end: string | Date;
  completed_at: string | Date | null;
  tech_name: string | null;
  client_name: string | null;
  property_address: string | null;
  completion_notes: string | null;
  photos_waived: boolean | number | null;
  photos_waiver_reason: string | null;
  signature_url: string | null;
  signature_waiver: boolean | number | null;
  customer_name: string | null;
  acknowledged_at: string | Date | null;
  acknowledgement_notes: string | null;
};
type ChecklistRow = Record<string, unknown> & { id: string; label: string; disposition: string | null; note: string | null };

function validToken(token: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token); }
function fmt(value: string | Date | null) { return value ? new Date(value).toLocaleString() : "—"; }

export default async function PublicServiceReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!validToken(token)) notFound();
  const report = await portableQueryOne<ReportRow>(
    `SELECT d.visit_id, a.name AS account_name, j.title AS job_title,
            v.scheduled_start, v.scheduled_end, v.completed_at,
            u.full_name AS tech_name, c.name AS client_name, p.address AS property_address,
            cp.notes AS completion_notes, cp.photos_waived, cp.photos_waiver_reason,
            cp.signature_url, cp.signature_waiver,
            ack.customer_name, ack.acknowledged_at, ack.acknowledgement_notes
       FROM field_service_report_deliveries d
       JOIN visits v ON v.id = d.visit_id AND v.account_id = d.account_id
       LEFT JOIN jobs j ON j.id = v.job_id AND j.account_id = d.account_id
       LEFT JOIN clients c ON c.id = j.client_id AND c.account_id = d.account_id
       LEFT JOIN properties p ON p.id = j.property_id AND p.account_id = d.account_id
       LEFT JOIN users u ON u.id = v.assigned_user_id
       LEFT JOIN accounts a ON a.id = d.account_id
       LEFT JOIN completion_packets cp ON cp.visit_id = v.id AND cp.account_id = d.account_id
       LEFT JOIN field_service_report_acknowledgements ack ON ack.visit_id = v.id AND ack.account_id = d.account_id
      WHERE d.access_token = $1 AND v.status = 'completed'`,
    [token],
  );
  if (!report) notFound();
  const checklist = await portableQuery<ChecklistRow>(
    `SELECT id, label, disposition, note
       FROM visit_checklist_items
      WHERE visit_id = $1
      ORDER BY sort_order ASC`,
    [report.visit_id],
  );
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif", color: "#111" }}>
      <header style={{ borderBottom: "1px solid #ddd", paddingBottom: 20, marginBottom: 24 }}>
        <div style={{ color: "#666", fontSize: 13 }}>{report.account_name ?? "Service report"}</div>
        <h1 style={{ margin: "4px 0" }}>Completed service report</h1>
        {report.job_title && <div style={{ fontSize: 18 }}>{report.job_title}</div>}
      </header>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 28 }}>
        <div><strong>Customer</strong><div>{report.client_name ?? "—"}</div></div>
        <div><strong>Service address</strong><div>{report.property_address ?? "—"}</div></div>
        <div><strong>Technician</strong><div>{report.tech_name ?? "—"}</div></div>
        <div><strong>Completed</strong><div>{fmt(report.completed_at)}</div></div>
      </section>
      {checklist.length > 0 && <section style={{ marginBottom: 28 }}><h2>Work and findings</h2>{checklist.map((item) => <div key={item.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}><strong>{item.label}</strong>{item.disposition && <span style={{ marginLeft: 8, color: "#666" }}>· {item.disposition.replaceAll("_", " ")}</span>}{item.note && <div style={{ color: "#555", marginTop: 4 }}>{item.note}</div>}</div>)}</section>}
      <section style={{ marginBottom: 28 }}>
        <h2>Completion record</h2>
        {report.completion_notes && <p style={{ whiteSpace: "pre-wrap" }}>{report.completion_notes}</p>}
        <ul>
          <li>Photos: {report.photos_waived ? `waived${report.photos_waiver_reason ? ` — ${report.photos_waiver_reason}` : ""}` : "captured with the visit record"}</li>
          <li>Customer signature: {report.signature_waiver ? "waived" : report.signature_url ? "captured" : "not recorded"}</li>
        </ul>
      </section>
      {report.acknowledged_at && <section style={{ borderTop: "1px solid #ddd", paddingTop: 20 }}><h2>Customer acknowledgement</h2><p>Reviewed by <strong>{report.customer_name ?? "customer"}</strong> on {fmt(report.acknowledged_at)}.</p>{report.acknowledgement_notes && <p style={{ whiteSpace: "pre-wrap" }}>{report.acknowledgement_notes}</p>}<p style={{ fontSize: 12, color: "#666" }}>Acknowledgement records review of this service report. It is not a payment confirmation, warranty waiver, or legal release.</p></section>}
      <footer style={{ borderTop: "1px solid #ddd", marginTop: 36, paddingTop: 16, fontSize: 12, color: "#777" }}>Private service report link. Share only with people who should have access to this report.</footer>
    </main>
  );
}
