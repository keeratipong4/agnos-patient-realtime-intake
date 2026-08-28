"use client";

import Link from "next/link";

import { StatusBadge } from "@/components/common/status-badge";
import { usePatientVerticalSlice } from "@/hooks/use-patient-vertical-slice";

export function PatientVerticalSlice({ sessionId }: { sessionId: string }) {
  const { connectionStatus, firstName, syncError, updateFirstName } =
    usePatientVerticalSlice(sessionId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Patient view · Phase 1
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Patient intake vertical slice
          </h1>
        </div>
        <StatusBadge status={connectionStatus} />
      </header>

      <div
        className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
        role="note"
      >
        <strong>Demo only —</strong> Data is transmitted ephemerally and is not
        saved to a database or this browser.
      </div>

      {syncError ? (
        <div
          className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"
          role="status"
        >
          {syncError}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="mb-7 flex flex-col gap-2 border-b border-slate-200 pb-6">
          <h2 className="text-xl font-bold text-slate-950">
            Realtime transport proof
          </h2>
          <p className="leading-7 text-slate-600">
            This temporary field proves debounced Broadcast delivery, Presence,
            and late-join snapshot recovery before the complete form is built.
          </p>
        </div>

        <label
          className="block text-sm font-bold text-slate-800"
          htmlFor="first-name"
        >
          Demo first name
        </label>
        <input
          autoComplete="off"
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          id="first-name"
          onChange={(event) => updateFirstName(event.target.value)}
          placeholder="Type fake data here"
          type="text"
          value={firstName}
        />
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Updates are debounced by 300 ms. Refreshing Staff while this Patient
          tab stays connected requests the current snapshot.
        </p>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="break-all text-xs leading-5 text-slate-500">
            Session: <span className="font-mono">{sessionId}</span>
          </p>
          <Link
            className="mt-4 inline-flex text-sm font-semibold text-teal-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            href="/"
          >
            Return to session launcher
          </Link>
        </div>
      </section>
    </main>
  );
}
