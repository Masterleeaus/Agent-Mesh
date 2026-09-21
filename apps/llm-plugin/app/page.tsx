"use client";

import { FormEvent, useState } from "react";
import { useWidgetProps, useMaxHeight, useDisplayMode, useRequestDisplayMode, useCallTool } from "./hooks";
import type { TitanUiCard, TitanWorkforceProjection } from "@/lib/titan/contracts";

type TitanState = {
  request?: string;
  capability?: string;
  operation?: string;
  status?: string;
  message?: string;
  receipt_id?: string;
  cards?: TitanUiCard[];
  workforce?: TitanWorkforceProjection;
  requires_approval?: boolean;
  approval_token?: string;
};

type Mode = "home" | "customer-search" | "customer-create" | "booking-prepare" | "quote-prepare" | "message-prepare";

export default function Home() {
  const output = useWidgetProps<{ result?: { structuredContent?: TitanState } }>();
  const state = output?.result?.structuredContent;
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();
  const requestDisplayMode = useRequestDisplayMode();
  const callTool = useCallTool();
  const [mode, setMode] = useState<Mode>("home");
  const [busy, setBusy] = useState(false);

  const run = async (capability: string, operation: string, request: string, payload?: Record<string, unknown>) => {
    setBusy(true);
    try { await callTool("titan_zero", { capability, operation, request, payload }); } finally { setBusy(false); }
  };

  const submit = (capability: string, operation: string, request: string) => async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    await run(capability, operation, request, data);
  };

  return <main className="min-h-screen bg-black text-zinc-100 p-5 sm:p-7" style={{ maxHeight, height: displayMode === "fullscreen" ? maxHeight : undefined }}><section className="mx-auto max-w-3xl">
    <header className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5"><div><div className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-400">Titan Zero</div><h1 className="mt-2 text-2xl font-semibold">Run your business by talking to it.</h1><p className="mt-2 text-sm text-zinc-400">One workforce. One authority chain. Generative UI only when it helps.</p></div>{displayMode !== "fullscreen" && <button onClick={() => requestDisplayMode("fullscreen")} className="rounded-xl border border-zinc-700 px-3 py-2 text-xs">Expand</button>}</header>

    <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="text-sm text-zinc-400">Ask Titan</div><div className="mt-2 text-lg">{state?.message || "What needs your attention today?"}</div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-500/15 px-3 py-1.5 text-blue-300">{state?.capability || "ask_titan"}</span><span className="rounded-full bg-zinc-800 px-3 py-1.5">{state?.status || "ready"}</span>{state?.receipt_id && <span className="rounded-full bg-zinc-800 px-3 py-1.5">receipt {state.receipt_id.slice(0, 12)}</span>}</div></section>

    {state?.workforce && <WorkforcePanel workforce={state.workforce} />}

    {mode === "home" && <section className="mt-4 grid gap-3 sm:grid-cols-2">
      <Action title="Find customer" text="Search canonical customer records" onClick={() => setMode("customer-search")} />
      <Action title="New customer" text="Prepare a customer creation request" onClick={() => setMode("customer-create")} />
      <Action title="Prepare booking" text="Build a booking proposal before confirmation" onClick={() => setMode("booking-prepare")} />
      <Action title="Jobs needing attention" text="Ask the service-delivery workforce for exceptions" onClick={() => run("jobs", "query", "Show jobs that need attention")} />
      <Action title="Prepare quote" text="Draft a governed quote for review" onClick={() => setMode("quote-prepare")} />
      <Action title="Outstanding invoices" text="Ask Finance what needs attention" onClick={() => run("invoices", "query", "Show outstanding invoices that need attention")} />
      <Action title="Prepare message" text="Draft a customer message before sending" onClick={() => setMode("message-prepare")} />
      <Action title="Bookings needing attention" text="Ask Customer Access for booking exceptions" onClick={() => run("bookings", "query", "Show bookings that need attention")} />
    </section>}

    {mode !== "home" && <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><button className="mb-4 text-xs text-zinc-400" onClick={() => setMode("home")}>← Back</button>
      {mode === "customer-search" && <TitanForm title="Find customer" onSubmit={submit("customers", "query", "Find customer")} fields={[["query","Name, phone or email"]]} submit="Search" busy={busy} />}
      {mode === "customer-create" && <TitanForm title="New customer" onSubmit={submit("customers", "prepare", "Prepare new customer")} fields={[["name","Customer name"],["phone","Phone"],["email","Email"],["address","Address"]]} submit="Prepare customer" busy={busy} />}
      {mode === "booking-prepare" && <TitanForm title="Prepare booking" onSubmit={submit("bookings", "prepare", "Prepare booking")} fields={[["customer","Customer"],["service","Service"],["date","Date / time"],["address","Job address"],["notes","Notes"]]} submit="Prepare booking" busy={busy} />}
      {mode === "quote-prepare" && <TitanForm title="Prepare quote" onSubmit={submit("quotes", "prepare", "Prepare quote")} fields={[["customer","Customer"],["job","Job / opportunity"],["scope","Scope"],["amount","Amount or pricing note"],["notes","Notes"]]} submit="Prepare quote" busy={busy} />}
      {mode === "message-prepare" && <TitanForm title="Prepare message" onSubmit={submit("messages", "prepare", "Prepare customer message")} fields={[["recipient","Recipient"],["channel","Channel"],["message","Message"],["reason","Reason / context"]]} submit="Prepare message" busy={busy} />}
    </section>}

    {state?.cards?.length ? <section className="mt-4 grid gap-3">{state.cards.map(card => <article key={card.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"><div className="flex justify-between gap-3"><div><h2 className="font-medium">{card.title}</h2>{card.subtitle && <p className="mt-1 text-sm text-zinc-500">{card.subtitle}</p>}</div><span className="text-xs text-blue-300">{card.kind}</span></div>{card.fields?.length ? <dl className="mt-3 grid gap-2 sm:grid-cols-2">{card.fields.map(f => <div key={`${card.id}:${f.label}`}><dt className="text-xs text-zinc-600">{f.label}</dt><dd className="text-sm text-zinc-300">{f.value}</dd></div>)}</dl> : null}{card.actions?.length ? <div className="mt-3 flex flex-wrap gap-2">{card.actions.map(action => <button key={action.id} disabled={busy} onClick={() => run(action.capability, action.operation, action.label, action.payload)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs disabled:opacity-40">{action.label}</button>)}</div> : null}</article>)}</section> : null}

    {state?.requires_approval && <section className="mt-4 rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4"><div className="text-sm text-amber-200">Titan has prepared this action. Confirmation returns the approval token through the governed capability path.</div><button disabled={busy || !state.approval_token} onClick={() => run(state.capability || "ask_titan", "confirm", "Confirm prepared Titan action", { approval_token: state.approval_token })} className="mt-3 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-black disabled:opacity-40">Confirm with Titan</button></section>}
    <footer className="mt-5 text-xs text-zinc-600">Customers · Bookings · Jobs · Quotes · Invoices · Messages</footer>
  </section></main>;
}

function WorkforcePanel({ workforce }: { workforce: TitanWorkforceProjection }) {
  const chain = workforce.delegation_chain ?? (workforce.active_agent ? [workforce.active_agent] : []);
  return <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Titan workforce</div><div className="mt-1 text-sm text-zinc-300">{chain.length ? chain.map(node => node.display_name || node.agent_id).join(" → ") : "Canonical workforce selected by Titan"}</div></div>{workforce.authority?.effective_mode && <span className="rounded-full bg-blue-500/15 px-3 py-1.5 text-xs text-blue-300">{workforce.authority.effective_mode}</span>}</div>{workforce.active_agent?.responsibility && <p className="mt-3 text-xs text-zinc-500">{workforce.active_agent.responsibility}</p>}<div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">{workforce.authority?.trust_state && <span>trust: {workforce.authority.trust_state}</span>}{workforce.authority?.entitlement_ceiling && <span>ceiling: {workforce.authority.entitlement_ceiling}</span>}{workforce.approval && <span>approval: {workforce.approval.required ? "required" : "not required"}</span>}{workforce.outcome?.status && <span>outcome: {workforce.outcome.status}</span>}{workforce.execution?.correlation_id && <span>correlation: {workforce.execution.correlation_id.slice(0,12)}</span>}</div>{workforce.outcome?.summary && <p className="mt-3 text-xs text-zinc-400">{workforce.outcome.summary}</p>}{workforce.execution?.recovery?.available && <p className="mt-2 text-xs text-amber-300">Recovery available{workforce.execution.recovery.rewind_ref ? ` · Rewind ${workforce.execution.recovery.rewind_ref}` : ""}</p>}</section>;
}

function Action({ title, text, onClick }: { title: string; text: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left hover:border-zinc-600"><h2 className="font-medium">{title}</h2><p className="mt-2 text-sm text-zinc-500">{text}</p></button>; }
function TitanForm({ title, fields, submit, onSubmit, busy }: { title: string; fields: string[][]; submit: string; onSubmit: (e: FormEvent<HTMLFormElement>) => void; busy: boolean }) { return <form onSubmit={onSubmit}><h2 className="font-medium">{title}</h2><div className="mt-4 grid gap-3">{fields.map(([name,label]) => <label key={name} className="text-xs text-zinc-400">{label}<input name={name} required={["name","query","customer","service","recipient","message"].includes(name)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" /></label>)}</div><button disabled={busy} className="mt-4 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">{busy ? "Asking Titan…" : submit}</button></form>; }
