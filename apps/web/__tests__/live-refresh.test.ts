import { describe, it, expect } from "vitest";
import {
  IDLE_MS,
  OPS_REFRESH_CHANNEL,
  OPS_REFRESH_EVENT,
  OPS_REFRESH_STORAGE_KEY,
  REFRESH_COALESCE_MS,
  isEditing,
  isOperationalRefreshSignal,
} from "@/components/LiveRefresh";

// Minimal Element stand-in — isEditing only reads tagName, isContentEditable, getAttribute.
function el(
  tagName: string,
  { editable = false, expanded }: { editable?: boolean; expanded?: string } = {},
) {
  return {
    tagName,
    isContentEditable: editable,
    getAttribute: (name: string) => (name === "aria-expanded" ? expanded ?? null : null),
  } as unknown as Element;
}

const RECENT = 0;
const STALE = IDLE_MS + 1;

describe("isEditing", () => {
  it("blocks refresh while actively typing in a field", () => {
    expect(isEditing(el("INPUT"), RECENT)).toBe(true);
    expect(isEditing(el("TEXTAREA"), RECENT)).toBe(true);
    expect(isEditing(el("DIV", { editable: true }), RECENT)).toBe(true);
  });

  it("allows refresh when a field is focused but typing went idle (lingering focus)", () => {
    expect(isEditing(el("INPUT"), STALE)).toBe(false);
    expect(isEditing(el("TEXTAREA"), STALE)).toBe(false);
    expect(isEditing(el("DIV", { editable: true }), STALE)).toBe(false);
  });

  it("blocks refresh while a menu/combobox is open, regardless of typing", () => {
    expect(isEditing(el("DIV", { expanded: "true" }), STALE)).toBe(true);
    expect(isEditing(el("DIV", { expanded: "false" }), RECENT)).toBe(false);
  });

  it("allows refresh otherwise", () => {
    expect(isEditing(null, RECENT)).toBe(false);
    expect(isEditing(el("BUTTON"), RECENT)).toBe(false);
    expect(isEditing(el("DIV"), RECENT)).toBe(false);
  });
});

describe("operational refresh contract", () => {
  it("accepts only the bounded cross-tab invalidation envelope", () => {
    expect(isOperationalRefreshSignal({ type: "operational-refresh", source: "tab:a", at: 1 })).toBe(true);
    expect(isOperationalRefreshSignal({ type: "operational-refresh", source: "", at: 1 })).toBe(false);
    expect(isOperationalRefreshSignal({ type: "execute", source: "tab:a", at: 1 })).toBe(false);
    expect(isOperationalRefreshSignal({ type: "operational-refresh", source: "tab:a", at: "1" })).toBe(false);
    expect(isOperationalRefreshSignal(null)).toBe(false);
  });

  it("uses stable names and a bounded coalesce window", () => {
    expect(OPS_REFRESH_EVENT).toBe("ops:refresh");
    expect(OPS_REFRESH_CHANNEL).toContain("operational-refresh");
    expect(OPS_REFRESH_STORAGE_KEY).toContain("operational-refresh");
    expect(REFRESH_COALESCE_MS).toBeGreaterThan(0);
    expect(REFRESH_COALESCE_MS).toBeLessThan(IDLE_MS);
  });
});
