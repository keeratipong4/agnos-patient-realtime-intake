# Architecture Decision Records (ADR)

> **Project:** Agnos Health - Real-Time Patient Intake & Staff Monitoring System  
> **Purpose:** Record the decisions that affect implementation scope and explain their trade-offs.  
> **Document Version:** 2.0.0

---

## ADR 001: Next.js Active LTS with App Router and TypeScript

### Status
Accepted

### Decision
Initialize the project with `create-next-app@latest`, use the generated Next.js 16.x Active LTS version, App Router, React, TypeScript, ESLint, and Tailwind CSS. Pin the installed versions in the lockfile.

### Rationale
- Next.js is required by the assignment.
- TypeScript provides explicit contracts for form data and real-time events.
- App Router provides a straightforward route structure for `/patient` and `/staff`.

### Trade-offs
The application is primarily client-interactive, so the real-time form and dashboard require Client Components. Server Actions and advanced caching features are not necessary for the assignment.

The decision does not rely on claims that previous supported Next.js versions are obsolete; it simply selects the current Active LTS version for a new project.

### Phase 0 Implementation Note

The project was scaffolded with Next.js 16.3.3. The checked-in production build
script uses Next.js's supported `next build --webpack` fallback because the local
validation environment prevents Turbopack's CSS transform worker from binding a
loopback port. This does not change the App Router, React, TypeScript, Tailwind,
or deployment architecture. The same build completed successfully on Vercel with
Node.js 24 and was production-verified on August 28, 2026. Keep webpack for the
P0 checkpoint; Turbopack can be re-evaluated later without blocking delivery.

---

## ADR 002: Supabase Realtime for Transport

### Status
Accepted

### Context
The Patient and Staff interfaces must synchronize while deployed on Vercel. A persistent custom WebSocket server would require a separate long-running backend and deployment pipeline.

### Decision
Use Supabase Realtime client-to-client Broadcast for form and lifecycle events, and Presence for connection tracking.

### Rationale
- Managed persistent real-time infrastructure keeps the implementation focused on front-end behavior.
- Broadcast supports low-latency client messages without writing every change to a database.
- Presence provides join, sync, and leave events for connection state.

### Trade-offs
- Client-side Broadcast is transient and does not automatically restore state for a late subscriber.
- Public channels do not provide production-grade authorization.
- The assignment must use fake/demo data and document that production would require authentication, private channels, and Realtime Authorization.

---

## ADR 003: Snapshot Handshake for Late Join and Reconnection

### Status
Accepted

### Context
If Staff opens or refreshes the dashboard after Patient has already entered data, previous client-side Broadcast messages are no longer available. Without recovery, Staff would display an incomplete form.

### Decision
Add an application-level request/response handshake:

1. Staff subscribes to the session channel.
2. Staff broadcasts `SNAPSHOT_REQUEST` with a unique request ID.
3. A connected Patient responds with `FORM_SNAPSHOT` containing current values, lifecycle status, and revision.
4. Staff applies the snapshot, then continues applying later `FORM_PATCH` events.

Patient submission sends `FORM_SUBMITTED` with the complete validated form so the final state cannot depend on a pending debounce timer.

### Rationale
- Meets the late-join requirement without introducing a database.
- Keeps the proof of concept focused and easy to explain.
- Reuses the same mechanism after a Staff reconnection.

### Limitations
If Patient is disconnected before Staff requests a snapshot, there is no source from which to recover the missing state. If both clients refresh, the session state is lost. These are accepted assignment-demo limitations and must be stated in the README.

### Alternatives Considered
- **Persist every draft to PostgreSQL:** More durable, but adds schema design, RLS, retention, and privacy work outside the assignment scope.
- **Supabase Broadcast Replay:** Replay applies to database-originated broadcasts on private channels, not the planned client-to-client Broadcast flow.

---

## ADR 004: Separate Connection Presence from Patient Lifecycle

### Status
Accepted

### Context
Supabase Presence supports arbitrary custom payloads. The application could call `track({ status: "actively_filling" })`, `track({ status: "inactive" })`, or `track({ status: "submitted" })`, and other subscribed clients could read that state.

Presence does not automatically detect browser focus, typing, an application-defined idle threshold, or successful form submission. Those signals still have to be produced by browser event handlers, an idle timer, and form validation. Presence only synchronizes the payload that the application publishes.

Connection state and patient lifecycle also represent different dimensions. A Patient may be connected but inactive, or submitted and later disconnected.

### Decision
Model two independent states:

```typescript
type ConnectionStatus = "connecting" | "connected" | "disconnected";
type PatientStatus = "actively_filling" | "inactive" | "submitted";
```

- Presence controls `ConnectionStatus` and is tracked once after subscription.
- Browser focus/input/visibility handlers and the idle timer determine `PatientStatus` locally.
- Broadcast `STATUS_CHANGED` synchronizes `PatientStatus` and is sent only on state transitions.
- Presence leave may map a non-submitted Patient to inactive, but it must never overwrite a submitted state.

### Rationale
- **Capability versus responsibility:** Presence is capable of carrying active/idle metadata, but the application—not Supabase—detects those states. Restricting Presence to connection metadata makes that responsibility explicit.
- **Update characteristics:** Supabase documents Presence as slow-changing synchronized state and warns against frequent `track()` calls. Focus/blur/idle transitions can occur repeatedly, so Broadcast is a safer fit. See the [Supabase Presence guide](https://supabase.com/docs/guides/realtime/presence).
- **Business-state lifetime:** A Presence entry is removed when its client leaves. `submitted` is a business result and must remain visible in the current Staff session after the Patient disconnects.
- **Independent truth:** Staff may correctly display `connectionStatus: "disconnected"` and `patientStatus: "submitted"` at the same time.

### Alternative Considered: Store Lifecycle in Presence

This alternative is technically valid if the application:

1. detects focus and idle locally;
2. calls `track()` only when the status changes and throttles rapid transitions;
3. distinguishes Patient and Staff presence keys; and
4. stores the submitted result separately so it is not lost when Patient Presence leaves.

It was rejected because step 4 already requires a separate business-state mechanism, while mixing both concepts into one Presence payload makes disconnect and submitted behavior harder to reason about.

### Consequences

- The application maintains two explicit status fields instead of one combined badge state.
- Staff subscribes to both Presence events and Broadcast lifecycle events.
- Snapshot responses include the current `PatientStatus`, allowing a late-joining Staff client to recover it while Patient remains connected.
- The UI can explain connection health separately from Patient progress.

---

## ADR 005: No Database or Browser Persistence in Submission Scope

### Status
Accepted

### Context
The assignment requires real-time synchronization but does not require history, durable storage, authentication, or draft recovery. The form contains personally identifiable information such as name, date of birth, phone, email, and address.

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
