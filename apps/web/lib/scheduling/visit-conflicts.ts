import type { DbClient } from "@/lib/db-contract";

export interface VisitConflictCheck {
  accountId: string;
  scheduledStart: string;
  scheduledEnd: string;
  assignedUserId?: string | null;
  jobId?: string | null;
  excludeVisitId?: string | null;
}

export interface VisitScheduleConflicts {
  jobOverlapCount: number;
  technicianOverlapCount: number;
  hasConflict: boolean;
}

function toCount(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Cross-dialect overlap check for the field schedule.
 *
 * Conflict semantics intentionally ignore cancelled/completed visits. A job may
 * have multiple future days, but two active windows on the same job cannot
 * overlap. When a technician is assigned, their visit windows also cannot
 * overlap across different jobs.
 */
export async function getVisitScheduleConflicts(
  client: DbClient,
  check: VisitConflictCheck,
): Promise<VisitScheduleConflicts> {
  const jobParams: unknown[] = [
    check.accountId,
    check.scheduledEnd,
    check.scheduledStart,
  ];
  const jobFilters = [
    "account_id = $1",
    "status NOT IN ('cancelled','completed')",
    "scheduled_start < $2",
    "scheduled_end > $3",
  ];

  if (check.jobId) {
    jobParams.push(check.jobId);
    jobFilters.push(`job_id = $${jobParams.length}`);
  } else {
    // No job means there is no same-job overlap dimension to evaluate.
    return getTechnicianConflicts(client, check, 0);
  }

  if (check.excludeVisitId) {
    jobParams.push(check.excludeVisitId);
    jobFilters.push(`id <> $${jobParams.length}`);
  }

  const jobResult = await client.query<{ count: string | number }>(
    `SELECT COUNT(*) AS count
       FROM visits
      WHERE ${jobFilters.join("\n        AND ")}`,
    jobParams,
  );
  const jobOverlapCount = toCount(jobResult.rows[0]?.count);
  return getTechnicianConflicts(client, check, jobOverlapCount);
}

async function getTechnicianConflicts(
  client: DbClient,
  check: VisitConflictCheck,
  jobOverlapCount: number,
): Promise<VisitScheduleConflicts> {
  if (!check.assignedUserId) {
    return {
      jobOverlapCount,
      technicianOverlapCount: 0,
      hasConflict: jobOverlapCount > 0,
    };
  }

  const params: unknown[] = [
    check.accountId,
    check.assignedUserId,
    check.scheduledEnd,
    check.scheduledStart,
  ];
  const filters = [
    "account_id = $1",
    "assigned_user_id = $2",
    "status NOT IN ('cancelled','completed')",
    "scheduled_start < $3",
    "scheduled_end > $4",
  ];
  if (check.excludeVisitId) {
    params.push(check.excludeVisitId);
    filters.push(`id <> $${params.length}`);
  }

  const result = await client.query<{ count: string | number }>(
    `SELECT COUNT(*) AS count
       FROM visits
      WHERE ${filters.join("\n        AND ")}`,
    params,
  );
  const technicianOverlapCount = toCount(result.rows[0]?.count);
  return {
    jobOverlapCount,
    technicianOverlapCount,
    hasConflict: jobOverlapCount > 0 || technicianOverlapCount > 0,
  };
}
