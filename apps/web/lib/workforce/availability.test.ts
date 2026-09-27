import { describe, expect, it } from "vitest";
import { availableMinutesInRange, isWithinAvailability, type AvailabilityWindow } from "./availability";

const monday: AvailabilityWindow = { id: "a", userId: "u", weekday: 1, specificDate: null, startTime: "08:00:00", endTime: "16:00:00", kind: "available", note: null };

describe("technician availability", () => {
  it("calculates configured weekly capacity", () => {
    expect(availableMinutesInRange([monday], new Date(2026, 8, 14), new Date(2026, 8, 15))).toBe(480);
  });
  it("returns null when availability is not configured", () => {
    expect(availableMinutesInRange([], new Date(2026, 8, 14), new Date(2026, 8, 15))).toBeNull();
  });
  it("blocks a visit outside the configured window", () => {
    expect(isWithinAvailability([monday], new Date(2026, 8, 14, 9), new Date(2026, 8, 14, 11))).toBe(true);
    expect(isWithinAvailability([monday], new Date(2026, 8, 14, 16), new Date(2026, 8, 14, 17))).toBe(false);
  });
  it("lets date-specific unavailability override weekly availability", () => {
    const blocked: AvailabilityWindow = { id: "b", userId: "u", weekday: null, specificDate: "2026-09-14", startTime: "00:00:00", endTime: "23:59:00", kind: "unavailable", note: "Leave" };
    expect(isWithinAvailability([monday, blocked], new Date(2026, 8, 14, 9), new Date(2026, 8, 14, 11))).toBe(false);
  });
});
