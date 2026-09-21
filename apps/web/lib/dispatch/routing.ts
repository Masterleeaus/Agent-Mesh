import { haversineEstimate } from "@/lib/travel/distance";

export type DispatchRouteReadiness = "comfortable" | "tight" | "late" | "missing";

export interface DispatchRouteVisitInput {
  id: string;
  assignedUserId: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  latitude: number | null;
  longitude: number | null;
}

export interface DispatchRouteLeg {
  fromVisitId: string;
  toVisitId: string;
  estimatedMiles: number | null;
  estimatedMinutes: number | null;
  gapMinutes: number;
  slackMinutes: number | null;
  readiness: DispatchRouteReadiness;
}

function minutesBetweenIso(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms)) return 0;
  return Math.round(ms / 60_000);
}

function routeDay(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "invalid";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function buildDispatchRouteLegs(visits: DispatchRouteVisitInput[]): DispatchRouteLeg[] {
  const grouped = new Map<string, DispatchRouteVisitInput[]>();
  for (const visit of visits) {
    if (!visit.assignedUserId) continue;
    const key = `${visit.assignedUserId}:${routeDay(visit.scheduledStart)}`;
    grouped.set(key, [...(grouped.get(key) ?? []), visit]);
  }

  const legs: DispatchRouteLeg[] = [];
  for (const lane of grouped.values()) {
    lane.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    for (let index = 1; index < lane.length; index += 1) {
      const previous = lane[index - 1];
      const current = lane[index];
      const gapMinutes = minutesBetweenIso(previous.scheduledEnd, current.scheduledStart);
      const hasCoords = previous.latitude != null && previous.longitude != null && current.latitude != null && current.longitude != null;

      if (!hasCoords) {
        legs.push({
          fromVisitId: previous.id,
          toVisitId: current.id,
          estimatedMiles: null,
          estimatedMinutes: null,
          gapMinutes,
          slackMinutes: null,
          readiness: "missing",
        });
        continue;
      }

      const estimate = haversineEstimate(
        { latitude: previous.latitude!, longitude: previous.longitude! },
        { latitude: current.latitude!, longitude: current.longitude! },
      );
      const slackMinutes = gapMinutes - estimate.minutes;
      const readiness: DispatchRouteReadiness = slackMinutes < 0 ? "late" : slackMinutes < 15 ? "tight" : "comfortable";
      legs.push({
        fromVisitId: previous.id,
        toVisitId: current.id,
        estimatedMiles: estimate.miles,
        estimatedMinutes: estimate.minutes,
        gapMinutes,
        slackMinutes,
        readiness,
      });
    }
  }

  return legs;
}
