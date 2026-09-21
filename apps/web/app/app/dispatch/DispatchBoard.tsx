"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DispatchTechnicianCapacity, DispatchVisit } from "@/lib/dispatch/capacity";

function formatMinutes(minutes: number) {
  const sign = minutes < 0 ? "−" : "";
  const value = Math.abs(minutes);
  const h = Math.floor(value / 60);
  const m = value % 60;
  if (!h) return `${sign}${m}m`;
  return m ? `${sign}${h}h ${m}m` : `${sign}${h}h`;
}

function visitTime(visit: DispatchVisit) {
  const start = new Date(visit.scheduledStart);
  return `${start.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })} · ${start.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`;
}

type LiveRoute = {
  one_way_miles: number;
  one_way_minutes: number;
  source: string;
  geocode_failed: boolean;
  error?: string;
};

function routeTone(readiness: NonNullable<DispatchVisit["routeFromPrevious"]>["readiness"]) {
  if (readiness === "late") return "var(--danger, #dc2626)";
  if (readiness === "tight") return "var(--warning, #b45309)";
  return "var(--fg-muted)";
}

export function DispatchBoard({ technicians, visits, vehicles }: { technicians: DispatchTechnicianCapacity[]; visits: DispatchVisit[]; vehicles: { id: string; name: string; plate: string | null }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [routePending, setRoutePending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveRoutes, setLiveRoutes] = useState<Record<string, LiveRoute>>({});
  const grouped = useMemo(() => {
    const map = new Map<string, DispatchVisit[]>();
    for (const visit of visits) {
      const key = visit.assignedUserId ?? "unassigned";
      map.set(key, [...(map.get(key) ?? []), visit]);
    }
    for (const lane of map.values()) lane.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    return map;
  }, [visits]);

  async function assign(visitId: string, userId: string) {
    setPending(visitId);
    setError(null);
    try {
      const response = await fetch("/api/v1/dispatch/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visit_id: visitId, assigned_user_id: userId || null, sync_work_order_lead: false }),
      });
      const payload = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Assignment failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setPending(null);
    }
  }

  async function assignVehicle(userId: string, vehicleId: string) {
    setPending(`vehicle:${userId}`);
    setError(null);
    try {
      const response = await fetch("/api/v1/dispatch/vehicle-assignment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, vehicle_id: vehicleId || null }),
      });
      const payload = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Vehicle assignment failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vehicle assignment failed");
    } finally { setPending(null); }
  }

  async function refreshRoute(visit: DispatchVisit) {
    if (!visit.routeFromPrevious) return;
    setRoutePending(visit.id);
    setError(null);
    try {
      const response = await fetch("/api/v1/dispatch/route-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_visit_id: visit.routeFromPrevious.fromVisitId, to_visit_id: visit.id }),
      });
      const payload = await response.json() as { data?: LiveRoute; error?: { message?: string } };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "Route preview failed");
      setLiveRoutes((current) => ({ ...current, [visit.id]: payload.data! }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Route preview failed");
    } finally {
      setRoutePending(null);
    }
  }

  const lanes = [{ userId: "unassigned", name: "Unassigned", scheduledMinutes: 0, visitCount: grouped.get("unassigned")?.length ?? 0, nominalCapacityMinutes: 0, availableCapacityMinutes: 0, capacitySource: "nominal_fallback" as const, utilizationPct: 0, skills: [], assignedVehicle: null }, ...technicians];

  return <div style={{ display: "grid", gap: 16 }}>
    {error && <div role="alert" style={{ padding: 12, border: "1px solid var(--danger, #dc2626)", borderRadius: 8 }}>{error}</div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
      {lanes.map((tech) => {
        const laneVisits = grouped.get(tech.userId) ?? [];
        return <section key={tech.userId} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, minHeight: 180 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", marginBottom: 10 }}>
            <strong>{tech.name}</strong>
            {tech.userId !== "unassigned" && <span style={{ fontSize: 12, color: tech.utilizationPct > 100 ? "var(--danger, #dc2626)" : "var(--fg-muted)" }}>{formatMinutes(tech.scheduledMinutes)} / {formatMinutes(tech.availableCapacityMinutes)} · {tech.utilizationPct}%{tech.capacitySource === "nominal_fallback" ? " · nominal" : " · available"}</span>}
          </div>
          {tech.userId !== "unassigned" && <div style={{ marginBottom: 8 }}>
            <select aria-label={`Vehicle for ${tech.name}`} value={tech.assignedVehicle?.id ?? ""} disabled={pending === `vehicle:${tech.userId}`} onChange={(e) => assignVehicle(tech.userId, e.target.value)} style={{ width: "100%", fontSize: 12 }}>
              <option value="">No assigned vehicle</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}{vehicle.plate ? ` · ${vehicle.plate}` : ""}</option>)}
            </select>
          </div>}
          {tech.userId !== "unassigned" && tech.skills.length > 0 && <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 8 }}>Skills: {tech.skills.map((skill) => skill.name).join(", ")}</div>}
          <div style={{ display: "grid", gap: 8 }}>
            {laneVisits.length === 0 && <span style={{ color: "var(--fg-muted)", fontSize: 13 }}>No assigned visits</span>}
            {laneVisits.map((visit) => {
              const liveRoute = liveRoutes[visit.id];
              const route = visit.routeFromPrevious;
              const directionsHref = visit.propertyAddress ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(visit.propertyAddress)}` : null;
              return <article key={visit.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 10, background: "var(--surface, #fff)" }}>
                <a href={`/app/visits/${visit.id}`} style={{ fontWeight: 700, textDecoration: "none" }}>{visit.jobTitle}</a>
                <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 3 }}>{visitTime(visit)}</div>
                {visit.clientName && <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{visit.clientName}</div>}
                {visit.propertyAddress && <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>{visit.propertyAddress}</div>}

                {visit.plannedTravelMinutes != null && <div style={{ fontSize: 12, marginTop: 6 }}>
                  Planned from base: {visit.plannedTravelMiles ?? 0} mi · {formatMinutes(visit.plannedTravelMinutes)}
                  {visit.plannedTravelSource ? ` · ${visit.plannedTravelSource.replaceAll("_", " ")}` : ""}
                </div>}

                {route && <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, color: routeTone(route.readiness) }}>
                    {liveRoute
                      ? `From previous: ${liveRoute.one_way_miles} mi · ${formatMinutes(liveRoute.one_way_minutes)} · ${liveRoute.source.replaceAll("_", " ")}`
                      : route.estimatedMinutes == null
                        ? "From previous: route coordinates unavailable"
                        : `From previous: ~${route.estimatedMiles} mi · ~${formatMinutes(route.estimatedMinutes)} · ${route.slackMinutes == null ? "" : `${formatMinutes(route.slackMinutes)} slack`}`}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                    <button type="button" disabled={routePending === visit.id} onClick={() => refreshRoute(visit)} style={{ fontSize: 12 }}>
                      {routePending === visit.id ? "Routing…" : "Refresh route"}
                    </button>
                    {directionsHref && <a href={directionsHref} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Directions ↗</a>}
                  </div>
                </div>}

                {!route && directionsHref && <div style={{ marginTop: 6 }}><a href={directionsHref} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Directions ↗</a></div>}

                <select aria-label={`Assign ${visit.jobTitle}`} value={visit.assignedUserId ?? ""} disabled={pending === visit.id} onChange={(e) => assign(visit.id, e.target.value)} style={{ width: "100%", marginTop: 8 }}>
                  <option value="">Unassigned</option>
                  {technicians.map((candidate) => <option key={candidate.userId} value={candidate.userId}>{candidate.name} · {candidate.utilizationPct}%</option>)}
                </select>
              </article>;
            })}
          </div>
        </section>;
      })}
    </div>
  </div>;
}
