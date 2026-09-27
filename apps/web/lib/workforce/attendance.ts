import { clockDurationMinutes } from "@ai-fsm/domain";

export interface AttendanceClockRow {
  user_id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  status: "open" | "closed";
}

export interface AttendanceSummary {
  userId: string;
  workedMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  openSessionCount: number;
  sessionCount: number;
}

export function summarizeAttendance(
  userId: string,
  rows: AttendanceClockRow[],
  weeklyOvertimeMinutes = 40 * 60,
  now: Date = new Date(),
): AttendanceSummary {
  const own = rows.filter((row) => row.user_id === userId);
  const workedMinutes = own.reduce((total, row) => total + clockDurationMinutes(row.clock_in_at, row.clock_out_at, now), 0);
  const regularMinutes = Math.min(workedMinutes, Math.max(0, weeklyOvertimeMinutes));
  return {
    userId,
    workedMinutes,
    regularMinutes,
    overtimeMinutes: Math.max(0, workedMinutes - regularMinutes),
    openSessionCount: own.filter((row) => row.status === "open").length,
    sessionCount: own.length,
  };
}
