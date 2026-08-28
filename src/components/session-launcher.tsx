"use client";

import Link from "next/link";
import { useState } from "react";

export function SessionLauncher() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const createSession = () => {
    setSessionId(crypto.randomUUID());
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-10 sm:px-8 sm:py-16">
      <div className="w-full">
        <header className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-teal-500"
            />
            Agnos Health · Realtime intake demo
          </div>
          <h1 className="mt-7 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Start one shared patient intake session
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Create a session first. The Patient and Staff links will then open
            two synchronized views of that same session.
          </p>
        </header>

        <section
          aria-labelledby="session-launcher-title"
          className="mx-auto mt-9 max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-28px_rgba(15,23,42,0.28)]"
        >
          {!sessionId ? (
            <div className="p-7 text-center sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                Step 1
              </p>
              <h2
                className="mt-3 text-2xl font-bold tracking-tight text-slate-950"
                id="session-launcher-title"
              >
                Create a new session
              </h2>
              <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">
                One private UUID keeps the Patient and Staff views paired and
                isolated from every other demo session.
              </p>
            <button
                className="mx-auto mt-8 flex min-h-12 w-full max-w-sm items-center justify-center rounded-xl bg-teal-700 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              onClick={createSession}
              type="button"
            >
                Create new session
            </button>
            </div>
          ) : (
            <div aria-live="polite">
              <div className="border-b border-emerald-200 bg-emerald-50 px-7 py-6 text-center sm:px-10">
                <p className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
                  >
                    ✓
                  </span>
                  Session ready
                </p>
                <h2
                  className="mt-3 text-2xl font-bold tracking-tight text-slate-950"
                  id="session-launcher-title"
                >
                  One session, two synchronized views
                </h2>
                <p className="mt-2 leading-7 text-slate-600">
                  Open both links to test the live patient-to-staff workflow.
                </p>
              </div>

              <div className="space-y-5 p-7 sm:p-10">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Shared session UUID
                </p>
                <p className="mt-2 break-all font-mono text-sm text-slate-800">
                  {sessionId}
                </p>
              </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    className="flex min-h-14 w-full flex-col items-center justify-center rounded-xl bg-teal-700 px-5 py-3 font-bold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                    href={`/patient?session=${sessionId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open Patient view
                    <span className="mt-0.5 text-xs font-normal text-teal-100">
                      Enter intake information
                    </span>
                  </Link>
                  <Link
                    className="flex min-h-14 w-full flex-col items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                    href={`/staff?session=${sessionId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open Staff view
                    <span className="mt-0.5 text-xs font-normal text-slate-500">
                      Monitor the same session
                    </span>
                  </Link>
                </div>

              <button
                  className="w-full py-2 text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                onClick={createSession}
                type="button"
              >
                  Create another session
              </button>
              </div>
            </div>
          )}
        </section>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-slate-500">
          <strong className="font-semibold text-slate-700">Demo only —</strong>{" "}
          Data is transmitted ephemerally and is not saved to a database or
          this browser.
        </p>
      </div>
    </main>
  );
}
