import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthSession } from "@/lib/auth/middleware";
import { portableQuery } from "@/lib/db/portable";
import { summarizeAttendance, type AttendanceClockRow } from "@/lib/workforce/attendance";

export const dynamic = "force-dynamic";

function requireManager(session: AuthSession) {
  return session.role === "owner" || session.role === "admin";
}

function isoDate(value: string | null, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

export const GET = withAuth(async (request: NextRequest, session: AuthSession) => {
  if (!requireManager(session)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Owner or admin role required" } }, { status: 403 });
  }
  const now = new Date();
  const monday = new Date(now);
  const dow = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - dow);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const start = isoDate(request.nextUrl.searchParams.get("start"), monday.toISOString().slice(0, 10));
  const end = isoDate(request.nextUrl.searchParams.get("end"), sunday.toISOString().slice(0, 10));
  const overtimeThreshold = Math.max(0, Number(request.nextUrl.searchParams.get("weekly_overtime_minutes") ?? 2400) || 2400);

  const [members, clocks] = await Promise.all([
    portableQuery<{ user_id: string; full_name: string; email: string; role: string }>(
      `SELECT bm.user_id, u.full_name, u.email, bm.role
         FROM business_memberships bm
         JOIN users u ON u.id = bm.user_id AND u.account_id = bm.account_id
        WHERE bm.account_id = $1 AND bm.status = 'active'
        ORDER BY u.full_name, u.email`,
      [session.accountId],
    ),
    portableQuery<AttendanceClockRow>(
      `SELECT user_id, clock_in_at, clock_out_at, status
         FROM time_clock_sessions
        WHERE account_id = $1 AND voided_at IS NULL
          AND clock_in_at >= $2 AND clock_in_at < $3
        ORDER BY user_id, clock_in_at`,
      [session.accountId, `${start}T00:00:00.000Z`, `${end}T23:59:59.999Z`],
    ),
  ]);

  const data = members.map((member) => ({
    ...member,
    ...summarizeAttendance(member.user_id, clocks, overtimeThreshold, now),
  }));
  return NextResponse.json({ data: { start, end, weekly_overtime_minutes: overtimeThreshold, members: data } });
});
