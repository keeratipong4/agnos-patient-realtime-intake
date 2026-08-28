# Architectural Decision Records (ADRs)

## ADR 001: Next.js 16 App Router as the Web Framework

### Status
Accepted

### Decision
Use Next.js 16 with the App Router, TypeScript, and Tailwind CSS. Use React 19 as provided by Next.js 16. Use the `next build --webpack` build command while running Node 24 locally to bypass native Turbopack binding issues.

### Rationale
- Built-in file-based routing matches the required `/patient` and `/staff` URL structure.
- Server Components handle server-side parameter parsing and invalid session gates cleanly.
- Client Components (`"use client"`) scope the stateful real-time interactions to the interactive view components.
- Tailwind CSS allows fast, consistent styling without CSS runtime overhead.

---

## ADR 002: Realtime-Only Transport via Supabase Realtime

### Status
Accepted

### Decision
Use Supabase Realtime exclusively as an ephemeral transport layer for Broadcast and Presence. Do not read or write to Supabase Database (Postgres tables).

### Rationale
- The assignment explicitly evaluates real-time synchronization between two ephemeral browser contexts.
- No database tables or persistence are required by the requirements.
- Removing database operations eliminates schema migrations, row-level security policy complexity, and storage overhead.
- Ephemeral WebSocket transport satisfies the real-time requirements with sub-second latency.

---

## ADR 003: Monotonic Revisions for Out-of-Order Event Protection

### Status
Accepted

### Decision
Every event emitted by the Patient client (`FORM_PATCH`, `FORM_SNAPSHOT`, `STATUS_CHANGED`, `FORM_SUBMITTED`) includes a monotonically increasing integer `revision` property generated using `Math.max(Date.now(), lastRevision + 1)`. The Staff client maintains a `latestRevision` ref and drops any incoming event where `event.revision <= latestRevision`.

### Rationale
- Real-time WebSocket messages and network delays can occasionally deliver packets out of order.
- Generating revisions based on monotonic millisecond timestamps (`Math.max(Date.now(), lastRevision + 1)`) guarantees that when a Patient refreshes their page and starts entering new data, the new events carry a higher timestamp revision than the prior session, allowing Staff to seamlessly accept post-refresh updates without dropping them as stale events.
- Monotonicity within the same millisecond is preserved by the `lastRevision + 1` fallback.
- Snapshot requests increment the revision counter before replying, guaranteeing that snapshot data supersedes prior patches.

---

## ADR 004: Dual-State Model (Presence vs. Patient Lifecycle)

### Status
Accepted

### Decision
Maintain two distinct, orthogonal status concepts in the application:

1. **`ConnectionStatus`** (`"connecting" | "connected" | "disconnected"`):
   - Managed via Supabase Realtime Presence.
   - Represents physical WebSocket connectivity between the browser and the Supabase Realtime cluster.

2. **`PatientStatus`** (`"actively_filling" | "inactive" | "submitted"`):
   - Managed via ephemeral Broadcast events (`STATUS_CHANGED`, `FORM_SNAPSHOT`, `FORM_SUBMITTED`).
   - Represents the clinical/intake activity state of the patient.
   - Transitioned to `"actively_filling"` on user input/focus.
   - Transitioned to `"inactive"` after a 5-second idle timeout, window blur, or document hide.
   - Transitioned to `"submitted"` upon valid form submission. Once `"submitted"`, status is immutable.

### Rationale
- Decouples network connection drops (e.g., brief Wi-Fi blips) from user behavior (e.g., typing vs. idle).
- Snapshot responses include the current `PatientStatus`, allowing a late-joining Staff client to recover it while Patient remains connected.
- The UI can explain connection health separately from Patient progress.

---

## ADR 005: No Database or Browser Persistence in Submission Scope

### Status
Accepted

### Decision
- Do not create a patient submissions table for the required implementation.
- Do not store form values in `localStorage`, `sessionStorage`, cookies, or IndexedDB.
- Hold draft data in React state and exchange it through ephemeral Broadcast events.
- Display a prominent warning that the deployed application is a demo and must not receive real patient data.

### Rationale
- Avoids retaining PII without an explicit security and retention design.
- Reduces implementation and deployment risk before the deadline.
- Keeps the deliverable aligned with the explicit assignment requirements.

### When a Database Would Be Required
A production version should add a database only when the product requires submission history, recovery after both clients disconnect, auditing, or staff workflows across sessions. That change must include authentication, authorization/RLS, server-side validation, encryption considerations, and a retention/deletion policy. It is a post-deployment enhancement, not part of P0.

---

## ADR 006: Form Handling and Validation

### Status
Accepted

### Decision
Use React Hook Form with Zod and the resolver package.

Validation rules include:
- Required names are trimmed and limited to 1-100 characters without an ASCII-only alphabetic restriction. Thai and other Unicode names, spaces, hyphens, and apostrophes are accepted.
- Date of birth must be a valid past date.
- Email and phone number must pass documented format rules.
- Emergency Contact is optional as a group. Both Name and Relationship may be blank, but entering either field makes the other required.
- Optional empty strings are normalized consistently before submission.

Use a scoped form subscription for real-time broadcasting so observing form values does not unnecessarily re-render the entire form.

---

## ADR 007: Focused UI Scope without a Demo Route

### Status
Accepted

### Decision
Build only the landing/session page, Patient route, and Staff route before deployment. Do not add `/demo`, multi-session management, audio notifications, quick fill, print/export, or a progress indicator to the required implementation.

### Rationale
- Reviewers can test real-time behavior by opening the generated Patient and Staff links in two tabs or windows.
- A split-screen route introduces another composition and synchronization path that must be tested.
- Removing bonus UI protects time for core correctness, responsiveness, and documentation.

Optional evaluator conveniences may be reconsidered only after the production deployment passes all P0 acceptance checks.

---

## ADR 008: Prove and Deploy the Real-Time Path Early

### Status
Accepted

### Decision
Before building the full form:

1. Create one Patient input and one Staff output.
2. Verify Broadcast and Presence in two browser contexts.
3. Verify channel cleanup and reconnection.
4. Deploy this vertical slice to Vercel and confirm environment variables work in production.
5. Continue only after the deployed proof of concept succeeds.

### Rationale
The largest technical risk is the real-time and cloud configuration, not the static form layout. An early deployed vertical slice exposes credential, channel, and hosting problems while they are still cheap to fix.

---

## ADR 009: Isolated Supabase Client Instances per Synchronizer Hook

### Status
Accepted

### Context
In evaluator and demo workflows, reviewers frequently open `/patient` and `/staff` simultaneously in split-screen browser panes (e.g., Arc Split View, Chrome side-by-side tabs) or navigate rapidly between routes within the same JavaScript execution context.

If `getSupabaseBrowserClient()` returns a module-level singleton instance, both `usePatientSync` and `useStaffSync` share the same `SupabaseClient`. When the second hook attempts to register event listeners (e.g., `channel.on("presence", ...)` or `channel.on("broadcast", ...)`) on a channel topic that the first hook has already subscribed to, the underlying Supabase Realtime SDK throws:
```text
Error: cannot add callbacks for realtime:<channel> after subscribe()
```
This unhandled error aborts the second hook's `useEffect`, permanently trapping Staff in a `disconnected` state, preventing presence synchronization, and blocking `SNAPSHOT_REQUEST` recovery.

### Decision
- `getSupabaseBrowserClient()` in `src/lib/supabase.ts` returns a fresh, independent `SupabaseClient` instance (`createClient(...)`) for each consumer hook.
- Client instances are configured with `auth.persistSession: false` and `auth.autoRefreshToken: false` to remain lightweight and fully ephemeral.
- Each synchronizer hook maintains full ownership of its own channel subscription lifecycle and cleans up its own channel on unmount without affecting other active hooks.

### Rationale
- Eliminates channel collisions and SDK listener registration errors in split-view, multi-tab, and fast-navigation scenarios.
- Ensures total connection isolation between Patient and Staff roles.
- Guarantees predictable channel creation, presence tracking, and snapshot recovery regardless of the reviewer's browser layout.
