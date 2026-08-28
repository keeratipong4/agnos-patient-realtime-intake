"use client";

import Link from "next/link";
import { useState } from "react";

export function SessionLauncher() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const createSession = () => {
    setSessionId(crypto.randomUUID());
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-12 sm:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl sm:p-10">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-teal-200">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
            Agnos candidate assignment
          </div>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Real-time patient intake, paired by session.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Create one unguessable session, then open the Patient and Staff
            views in separate browser contexts to verify the live connection.
          </p>
          <div className="mt-9 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            Demo only — Data is transmitted ephemerally and is not saved to a
            database or this browser.
            This vertical slice is ephemeral and has no database or browser
            persistence.
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Session launcher
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            Open the paired views
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Each generated UUID isolates one Patient and one Staff channel.
          </p>

          {!sessionId ? (
            <button
              className="mt-8 flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              onClick={createSession}
              type="button"
            >
              Create secure demo session
            </button>
          ) : (
            <div className="mt-7 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Session UUID
                </p>
                <p className="mt-2 break-all font-mono text-sm text-slate-800">
                  {sessionId}
                </p>
              </div>
              <Link
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                href={`/patient?session=${sessionId}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open Patient view
              </Link>
              <Link
                className="flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-teal-500 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                href={`/staff?session=${sessionId}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open Staff view
              </Link>
              <button
                className="w-full py-2 text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                onClick={createSession}
                type="button"
              >
                Generate another session
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
