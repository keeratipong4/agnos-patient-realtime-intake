import Link from "next/link";

export function InvalidSession({ role }: { role: "Patient" | "Staff" }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-12 sm:px-8">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
          {role} view
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          This session link is invalid
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-slate-600">
          The URL must include a valid, unguessable session UUID. Return to the
          session launcher to create a matching Patient and Staff link.
        </p>
        <Link
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          href="/"
        >
          Create a new session
        </Link>
      </section>
    </main>
  );
}
