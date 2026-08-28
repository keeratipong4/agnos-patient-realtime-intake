"use client";

import Link from "next/link";

import { StatusBadge } from "@/components/common/status-badge";
import { useStaffVerticalSlice } from "@/hooks/use-staff-vertical-slice";

export function StaffVerticalSlice({ sessionId }: { sessionId: string }) {
  const { connectionStatus, firstName, syncError } =
    useStaffVerticalSlice(sessionId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-300">
              Staff view · Phase 1
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Live intake monitor
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              One temporary field is shown while the realtime transport is
              verified across separate browser contexts.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3 text-slate-950">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Patient connection
            </p>
            <StatusBadge status={connectionStatus} />
          </div>
        </div>
        <p className="mt-6 break-all border-t border-white/10 pt-5 font-mono text-xs text-slate-400">
          {sessionId}
        </p>
      </header>

      {syncError ? (
        <div
          className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"
          role="status"
        >
          {syncError}
        </div>
      ) : null}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">
              Live field
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Demo first name
            </h2>
          </div>
          <p className="text-sm text-slate-500">Broadcast + snapshot</p>
        </div>

        <div
          aria-live="polite"
          className="mt-6 min-h-24 rounded-2xl border border-teal-200 bg-teal-50 p-5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-800">
            Current value
          </p>
          <p
            className={`mt-3 break-words text-2xl font-bold ${
              firstName ? "text-slate-950" : "text-slate-400"
            }`}
          >
            {firstName || "Waiting for input…"}
          </p>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-500">
          Connection Presence is independent from field Broadcast events. No
          values are persisted after both clients leave.
        </p>
        <Link
          className="mt-5 inline-flex text-sm font-semibold text-teal-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          href="/"
        >
          Return to session launcher
        </Link>
      </section>
    </main>
  );
}
