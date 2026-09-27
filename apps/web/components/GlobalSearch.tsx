"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Result = {
  type: string;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const body = (await response.json()) as { data?: Result[] };
        setResults(body.data ?? []);
      } catch (error) {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const choose = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="p7-global-search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search business records"
        title="Search · Ctrl/⌘ K"
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, padding: "8px 10px", margin: "0 0 8px", borderRadius: 6,
          border: "1px solid var(--border, #d4d4d8)", background: "var(--surface, #fff)",
          color: "var(--text-muted, #52525b)", fontSize: 13, cursor: "pointer",
        }}
      >
        <span><span aria-hidden="true">⌕</span><span className="p7-global-search-label"> Search</span></span><span className="p7-global-search-shortcut" style={{ fontSize: 11, opacity: 0.7 }}>⌘K</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Global search"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
              requestAnimationFrame(() => triggerRef.current?.focus());
            }
          }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,.35)", display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "10vh" }}
        >
          <div ref={dialogRef} style={{ width: "min(680px, calc(100vw - 24px))", maxHeight: "70vh", overflow: "hidden", background: "var(--surface, #fff)", borderRadius: 12, boxShadow: "0 24px 80px rgba(15,23,42,.24)", border: "1px solid var(--border, #e4e4e7)" }}>
            <div style={{ padding: 12, borderBottom: "1px solid var(--border, #e4e4e7)", display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search clients, properties, jobs, estimates, invoices or requests…"
                aria-label="Search"
                style={{ width: "100%", border: 0, outline: 0, fontSize: 16, background: "transparent", color: "inherit" }}
              />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  requestAnimationFrame(() => triggerRef.current?.focus());
                }}
                aria-label="Close search"
                style={{ width: 44, height: 44, flex: "0 0 44px", borderRadius: 8, border: "1px solid var(--border, #d4d4d8)", background: "transparent", color: "inherit", cursor: "pointer", fontSize: 20 }}
              >
                ×
              </button>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "calc(70vh - 56px)", padding: 8 }}>
              {loading && <div style={{ padding: 14, opacity: .7 }}>Searching…</div>}
              {!loading && query.trim().length >= 2 && results.length === 0 && <div style={{ padding: 14, opacity: .7 }}>No matching business records.</div>}
              {!loading && query.trim().length < 2 && <div style={{ padding: 14, opacity: .7 }}>Type at least 2 characters. Results stay inside your current business account.</div>}
              {results.map((result) => (
                <button
                  key={`${result.type}:${result.id}`}
                  type="button"
                  onClick={() => choose(result.href)}
                  style={{ width: "100%", textAlign: "left", display: "flex", gap: 12, alignItems: "center", border: 0, background: "transparent", padding: "10px 12px", borderRadius: 8, cursor: "pointer", color: "inherit" }}
                >
                  <span style={{ minWidth: 70, fontSize: 11, textTransform: "uppercase", opacity: .6 }}>{result.type}</span>
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.title}</strong>
                    {result.subtitle && <span style={{ fontSize: 12, opacity: .7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.subtitle}</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
