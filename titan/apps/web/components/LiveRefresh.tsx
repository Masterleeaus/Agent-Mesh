"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** A focused field counts as "editing" only if the user typed this recently. */
export const IDLE_MS = 5_000;
/** Coalesce bursts of mutation/focus/online signals into one server refresh. */
export const REFRESH_COALESCE_MS = 750;
export const OPS_REFRESH_EVENT = "ops:refresh";
export const OPS_REFRESH_CHANNEL = "titan-zero:operational-refresh:v1";
export const OPS_REFRESH_STORAGE_KEY = "titan-zero:operational-refresh-token:v1";

export type OperationalRefreshSignal = Readonly<{
  type: "operational-refresh";
  source: string;
  at: number;
}>;

export function isOperationalRefreshSignal(value: unknown): value is OperationalRefreshSignal {
  if (!value || typeof value !== "object") return false;
  const signal = value as Partial<OperationalRefreshSignal>;
  return (
    signal.type === "operational-refresh" &&
    typeof signal.source === "string" &&
    signal.source.length > 0 &&
    typeof signal.at === "number" &&
    Number.isFinite(signal.at)
  );
}

/**
 * True when refreshing would disrupt the user: an open menu/combobox, or a
 * text field they've typed in within the last `msSinceTyped` window. Lingering
 * focus after the app is backgrounded (no recent typing) does NOT block a
 * refresh — otherwise resume would leave new server state stale indefinitely.
 */
export function isEditing(active: Element | null, msSinceTyped: number): boolean {
  if (!active) return false;
  // An open menu/combobox — a refresh would close it under the user.
  if (active.getAttribute("aria-expanded") === "true") return true;
  const tag = active.tagName;
  const isTextField =
    tag === "INPUT" || tag === "TEXTAREA" || (active as HTMLElement).isContentEditable;
  return isTextField && msSinceTyped < IDLE_MS;
}

/**
 * Passively re-runs server components (router.refresh) so newly-arrived
 * operational state surfaces without a manual reload. Mounted once in
 * AppShell, so every operational page benefits.
 *
 * Refresh sources:
 * - existing `ops:refresh` mutation events in this tab (immediate)
 * - BroadcastChannel/storage fallback from sibling Titan Zero tabs
 * - reconnect, focus and visibility resume
 * - bounded polling for mutations originating from other users/channels
 *
 * This is invalidation only: the server/database remain authoritative. It does
 * not persist business state, grant authority, replay mutations or replace the
 * offline queue/runtime.
 */
export function LiveRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const lastTypedRef = useRef(0);
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    const source = `tab:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
    const channel =
      typeof BroadcastChannel === "function" ? new BroadcastChannel(OPS_REFRESH_CHANNEL) : null;

    const onType = () => {
      lastTypedRef.current = Date.now();
    };

    const refresh = () => {
      if (document.visibilityState !== "visible") return false;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
      if (isEditing(document.activeElement, Date.now() - lastTypedRef.current)) return false;

      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_COALESCE_MS) return false;
      lastRefreshRef.current = now;
      router.refresh();
      return true;
    };

    const broadcastMutation = () => {
      const signal: OperationalRefreshSignal = {
        type: "operational-refresh",
        source,
        at: Date.now(),
      };
      if (channel) {
        channel.postMessage(signal);
        return;
      }
      try {
        // storage events notify sibling tabs but not the writing tab.
        localStorage.setItem(OPS_REFRESH_STORAGE_KEY, JSON.stringify(signal));
      } catch {
        // Storage can be unavailable in restricted/private browser contexts.
      }
    };

    const onOperationalMutation = () => {
      refresh();
      broadcastMutation();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onOnline = () => refresh();
    const onChannelMessage = (event: MessageEvent<unknown>) => {
      if (!isOperationalRefreshSignal(event.data) || event.data.source === source) return;
      refresh();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== OPS_REFRESH_STORAGE_KEY || !event.newValue) return;
      try {
        const signal = JSON.parse(event.newValue) as unknown;
        if (!isOperationalRefreshSignal(signal) || signal.source === source) return;
        refresh();
      } catch {
        // Ignore malformed/stale storage written by older clients.
      }
    };

    document.addEventListener("keydown", onType, true);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", onOnline);
    window.addEventListener(OPS_REFRESH_EVENT, onOperationalMutation);
    window.addEventListener("storage", onStorage);
    channel?.addEventListener("message", onChannelMessage);

    const id = window.setInterval(refresh, intervalMs);
    return () => {
      document.removeEventListener("keydown", onType, true);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", onOnline);
      window.removeEventListener(OPS_REFRESH_EVENT, onOperationalMutation);
      window.removeEventListener("storage", onStorage);
      channel?.removeEventListener("message", onChannelMessage);
      channel?.close();
      window.clearInterval(id);
    };
  }, [router, intervalMs]);

  return null;
}
