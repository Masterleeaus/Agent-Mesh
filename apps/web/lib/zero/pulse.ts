import { portableQuery, portableQueryOne } from "@/lib/db/portable";

export type ZeroPulse = {
  attention: number;
  jobs: number;
  onTrack: number;
  exceptions: number;
  activeWorkers: number;
  waitingWorkers: number;
  approvals: number;
};

type CountRow = { count: number | string; [key: string]: unknown };
type WorkRow = { state: string; assignee: string | null; [key: string]: unknown };

const numberOf = (row: CountRow | null) => Number(row?.count ?? 0);

/**
 * Read-only Zero projection. Every query is scoped by the canonical company/account
 * boundary and derives display state from authoritative business/workforce tables.
 * It never creates work, decisions, authority or execution state.
 */
export async function loadZeroPulse(companyId: string): Promise<ZeroPulse> {
  const [jobCount, onTrackCount, exceptionCount, work, approvals] = await Promise.all([
    portableQueryOne<CountRow>(`SELECT COUNT(*) AS count FROM jobs WHERE account_id = $1 AND date(scheduled_start) = date('now')`, [companyId]),
    portableQueryOne<CountRow>(`SELECT COUNT(*) AS count FROM jobs WHERE account_id = $1 AND date(scheduled_start) = date('now') AND status NOT IN ('cancelled','failed','blocked')`, [companyId]),
    portableQueryOne<CountRow>(`SELECT COUNT(*) AS count FROM jobs WHERE account_id = $1 AND date(scheduled_start) = date('now') AND status IN ('failed','blocked')`, [companyId]),
    portableQuery<WorkRow>(`SELECT state, assignee FROM workforce_work_items WHERE company_id = $1 AND state NOT IN ('COMPLETED','FAILED','CANCELLED')`, [companyId]),
    portableQueryOne<CountRow>(`SELECT COUNT(*) AS count FROM workforce_work_items WHERE company_id = $1 AND state = 'WAITING_APPROVAL'`, [companyId]),
  ]);

  const activeWorkers = new Set(
    work.filter((item) => item.state === "IN_PROGRESS" && item.assignee).map((item) => item.assignee),
  ).size;
  const waitingWorkers = new Set(
    work
      .filter((item) => ["WAITING", "WAITING_APPROVAL", "WAITING_EXTERNAL", "BLOCKED"].includes(item.state) && item.assignee)
      .map((item) => item.assignee),
  ).size;
  const approvalCount = numberOf(approvals);
  const exceptions = numberOf(exceptionCount);

  return {
    attention: approvalCount + exceptions,
    jobs: numberOf(jobCount),
    onTrack: numberOf(onTrackCount),
    exceptions,
    activeWorkers,
    waitingWorkers,
    approvals: approvalCount,
  };
}
