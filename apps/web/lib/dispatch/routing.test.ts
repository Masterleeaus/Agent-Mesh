import { describe, expect, it } from "vitest";
import { buildDispatchRouteLegs } from "./routing";

const visit = (overrides: Partial<Parameters<typeof buildDispatchRouteLegs>[0][number]> = {}) => ({
  id: "v1",
  assignedUserId: "tech-1",
  scheduledStart: "2026-09-14T09:00:00.000Z",
  scheduledEnd: "2026-09-14T10:00:00.000Z",
  latitude: -37.8136,
  longitude: 144.9631,
  ...overrides,
});

describe("buildDispatchRouteLegs", () => {
  it("builds sequential route legs for the same technician and day", () => {
    const legs = buildDispatchRouteLegs([
      visit(),
      visit({ id: "v2", scheduledStart: "2026-09-14T10:45:00.000Z", scheduledEnd: "2026-09-14T11:30:00.000Z", latitude: -37.8047, longitude: 144.9582 }),
    ]);
    expect(legs).toHaveLength(1);
    expect(legs[0].fromVisitId).toBe("v1");
    expect(legs[0].toVisitId).toBe("v2");
    expect(legs[0].estimatedMinutes).toBeGreaterThan(0);
    expect(legs[0].slackMinutes).not.toBeNull();
  });

  it("marks an impossible transfer as late", () => {
    const legs = buildDispatchRouteLegs([
      visit(),
      visit({ id: "v2", scheduledStart: "2026-09-14T10:00:00.000Z", scheduledEnd: "2026-09-14T11:00:00.000Z", latitude: -37.7, longitude: 145.2 }),
    ]);
    expect(legs[0].readiness).toBe("late");
    expect(legs[0].slackMinutes).toBeLessThan(0);
  });

  it("reports missing routing data when coordinates are unavailable", () => {
    const legs = buildDispatchRouteLegs([
      visit({ latitude: null }),
      visit({ id: "v2", scheduledStart: "2026-09-14T11:00:00.000Z", scheduledEnd: "2026-09-14T12:00:00.000Z" }),
    ]);
    expect(legs[0]).toMatchObject({ readiness: "missing", estimatedMinutes: null, estimatedMiles: null });
  });

  it("does not route between different technicians", () => {
    const legs = buildDispatchRouteLegs([
      visit(),
      visit({ id: "v2", assignedUserId: "tech-2", scheduledStart: "2026-09-14T11:00:00.000Z", scheduledEnd: "2026-09-14T12:00:00.000Z" }),
    ]);
    expect(legs).toHaveLength(0);
  });
});
