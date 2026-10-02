import Link from "next/link";
import type { Route } from "next";
import { Card, SectionHeader, MetricGrid, LinkButton } from "@/components/ui";
import { NeedsAttentionPanel } from "./NeedsAttentionPanel";
import { JobsToday, Materials, type CommandVisit, type CountAction, type MaterialJob } from "./DashboardWidgets";
import type { FieldDayData } from "@/lib/my-work/field-day-data";
import type { OpenOwnerPromiseRow } from "@/lib/captures/promise-queue";
import { formatCents } from "@/lib/money";
import { formatBusinessTime } from "@/lib/time/business-tz";

function fmtTime(iso: string): string {
  return formatBusinessTime(iso);
}

export function OwnerDashboard({
  actionQueue,
  openPromiseRows,
  todayJobs,
  materialCount,
  materialJobs,
  tomorrowJobs,
  outstandingInvoicesCents = 0,
  pendingDepositsCents = 0,
  paidThisMonthCents = 0,
  openSession,
  vehicles,
  dayMileage,
  yesterdayMiles,
  pendingSegments,
  todayExpensesCents,
  monthExpensesCents,
  receiptsMissing,
}: Pick<FieldDayData, "openSession" | "vehicles" | "dayMileage" | "yesterdayMiles"> & {
  actionQueue: CountAction[];
  openPromiseRows: OpenOwnerPromiseRow[];
  todayJobs: CommandVisit[];
  materialCount: number;
  materialJobs: MaterialJob[];
  tomorrowJobs: CommandVisit[];
  outstandingInvoicesCents?: number;
  pendingDepositsCents?: number;
  paidThisMonthCents?: number;
  pendingSegments: number;
  todayExpensesCents: number;
  monthExpensesCents: number;
  receiptsMissing: number;
}) {
  const vehicleName = openSession?.vehicle_nickname
    ?? vehicles.find((vehicle) => vehicle.id === openSession?.vehicle_id)?.nickname
    ?? "Vehicle";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <NeedsAttentionPanel items={actionQueue} openPromiseRows={openPromiseRows} />

      {actionQueue.length === 0 && openPromiseRows.length === 0 ? (
        <p
          data-testid="overview-nothing-leaking"
          style={{ margin: "-var(--space-3) 0 0", color: "var(--fg-muted)", fontSize: "var(--text-sm)" }}
        >
          Nothing leaking. The day is on{" "}
          <Link href={"/app/my-work" as Route} style={{ color: "var(--accent)", fontWeight: 600 }}>
            Today
          </Link>
          .
        </p>
      ) : null}

      <JobsToday jobs={todayJobs} readOnly />
      <section id="materials" aria-label="Materials">
        <Materials count={materialCount} jobs={materialJobs} />
      </section>

      <div
        style={{
          display: "grid",
          gap: "var(--space-6)",
          gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 340px)",
          alignItems: "start",
        }}
        className="owner-dashboard-grid"
      >
        <Card className="owner-dash-tomorrow">
          <SectionHeader title="Tomorrow" count={tomorrowJobs.length} />
          {tomorrowJobs.length === 0 ? (
            <p style={{ color: "var(--fg-muted)", fontSize: "var(--text-sm)", margin: 0 }}>
              No visits scheduled tomorrow.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {tomorrowJobs.map((job) => (
                <Link
                  key={job.id}
                  href={(job.visit_id ? `/app/visits/${job.visit_id}` : `/app/jobs/${job.id}`) as Route}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "var(--space-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                    color: "inherit",
                    background: "var(--bg-card)",
                  }}
                >
                  <span>
                    <strong>{job.scheduled_start ? fmtTime(job.scheduled_start) : "—"}</strong>
                    {" · "}
                    {job.title}
                  </span>
                  <small style={{ color: "var(--fg-muted)" }}>{job.client_name}</small>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="owner-dash-money" data-testid="overview-money-rail">
          <SectionHeader
            title="Money"
            action={
              <Link href={"/app/reports" as Route} style={{ color: "var(--accent)", fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none" }}>
                Reports →
              </Link>
            }
          />
          <MetricGrid
            metrics={[
              {
                label: "Collected (month)",
                value: formatCents(paidThisMonthCents),
                variant: "success",
              },
              {
                label: "Outstanding",
                value: formatCents(outstandingInvoicesCents),
                variant: outstandingInvoicesCents > 0 ? "alert" : "default",
              },
              {
                label: "Pending deposits",
                value: formatCents(pendingDepositsCents),
              },
            ]}
          />
        </Card>
      </div>

      <Card data-testid="overview-day-summary">
        <SectionHeader title="Mileage and expenses" />
        <p>
          {openSession ? `${vehicleName} · mileage session open` : "No open mileage session"}
          {" · "}{vehicles.length} active vehicle{vehicles.length === 1 ? "" : "s"}
        </p>
        <p>{dayMileage.totalMiles} mi today · {yesterdayMiles} mi yesterday</p>
        <p>
          Expenses: {formatCents(todayExpensesCents)} today · {formatCents(monthExpensesCents)} this month
        </p>
        <p style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: 0 }}>
          <Link href="/app/timeline">{pendingSegments} captured locations to label</Link>
          <Link href="/app/expenses">{receiptsMissing} missing receipts</Link>
          <Link href="/app/mileage">Review mileage</Link>
        </p>
      </Card>

      <p style={{ margin: 0 }}>
        <LinkButton href="/app/my-work" variant="secondary" size="sm" data-testid="go-to-my-day">
          Go to Today
        </LinkButton>
      </p>
    </div>
  );
}
