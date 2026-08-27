# Deadline-Aware Implementation Plan

> **Project:** Agnos Health - Real-Time Patient Intake & Staff Monitoring System  
> **Required Stack:** Next.js + Tailwind CSS + suitable real-time technology  
> **Selected Stack:** Next.js 16.x Active LTS + React + TypeScript + Tailwind CSS + React Hook Form + Zod + Supabase Realtime  
> **Deadline:** Friday, August 28, 23:59  
> **Target P0 Effort:** 13-17 focused hours plus a 2-hour submission buffer

---

## 1. Scope and Delivery Rules

The required implementation is an ephemeral, single-session demonstration:

- Patient and Staff join the same unguessable session ID.
- Form patches, snapshots, and lifecycle status use Supabase Broadcast.
- Patient connection state uses Supabase Presence.
- No database or browser persistence is included.
- No `/demo` route is included.
- Only fake/demo patient information may be used.

Complete and deploy all P0 work before starting any optional enhancement. If a P0 acceptance check fails, stop optional work and fix the core path.

---

## Phase 0: Repository and Project Foundation (45-60 minutes)

- [ ] Work only inside the nested `agnos-patient-intake/` repository; keep the confidential assignment PDF and personal study guide in the parent folder.
- [ ] Initialize the Next.js application with App Router, TypeScript, ESLint, Tailwind CSS, and a lockfile.
- [ ] Install only required dependencies:
  - `@supabase/supabase-js`
  - `react-hook-form`
  - `zod`
  - `@hookform/resolvers`
  - selected UI primitives only as they become necessary
- [ ] Add `.env.example` containing variable names but no credentials.
- [ ] Add `AGENTS.md` with verified scripts, directory conventions, scope boundaries, and the rule that P2 work must not begin before successful deployment.
- [ ] Add initial scripts for `dev`, `build`, `lint`, and tests if configured.
- [ ] Make the first clean commit.

### Exit Criteria
- [ ] Development server starts.
- [ ] Lint and production build complete.
- [ ] No PDF, credentials, or personal study notes are inside the repository.

---

## Phase 1: Real-Time Vertical Slice and Early Deployment (1.5-2.5 hours)

This phase de-risks Supabase and Vercel before the full UI is built.

- [ ] Create a Supabase project and use its browser-safe publishable key.
- [ ] Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` locally.
- [ ] Implement UUID session generation on `/`.
- [ ] Generate role links:

  ```text
  /patient?session=<uuid>
  /staff?session=<uuid>
  ```

- [ ] Validate the session parameter before channel subscription.
- [ ] Build one temporary Patient input and one Staff value display.
- [ ] Verify `FORM_PATCH` delivery across two browser contexts.
- [ ] Track Patient Presence once after `SUBSCRIBED` and verify join/leave behavior.
- [ ] Remove channels, timers, and subscriptions on component unmount.
- [ ] Deploy the vertical slice to Vercel.
- [ ] Configure production environment variables and repeat the two-browser test on the deployed URL.

### Exit Criteria
- [ ] A field typed in Patient appears in Staff without refresh.
- [ ] Staff shows Patient connected/disconnected correctly.
- [ ] Two different session IDs do not receive each other's events.
- [ ] The deployed vertical slice works before Phase 2 begins.

---

## Phase 2: Data Contracts and Validation (1-1.5 hours)

- [ ] Define `PatientFormData`, `PatientStatus`, `ConnectionStatus`, and all event payload types.
- [ ] Define event names in one shared module:
  - `FORM_PATCH`
  - `SNAPSHOT_REQUEST`
  - `FORM_SNAPSHOT`
  - `STATUS_CHANGED`
  - `FORM_SUBMITTED`
- [ ] Create a Zod schema with the assignment fields.
- [ ] Implement Unicode-friendly name validation using trim and length rules rather than an ASCII-only alphabetic regex.
- [ ] Validate date of birth as a valid past date.
- [ ] Validate phone and email formats with clear error messages.
- [ ] Make Emergency Contact optional as a group:
  - both Name and Relationship may be empty;
  - if either is entered, require the other.
- [ ] Add focused schema tests for required fields, valid optional fields, Thai/Unicode names, and Emergency Contact cross-field validation.

### Exit Criteria
- [ ] All original assignment fields exist in the schema.
- [ ] Valid Thai and international names are accepted.
- [ ] Invalid email, phone, future DOB, and partial Emergency Contact are rejected.

---

## Phase 3: Real-Time Protocol and Recovery (1.5-2.5 hours)

- [ ] Implement `usePatientSync` and `useStaffSync`.
- [ ] Add a monotonically increasing revision to Patient events.
- [ ] Broadcast debounced `FORM_PATCH` events after field changes.
- [ ] Staff broadcasts `SNAPSHOT_REQUEST` immediately after subscribe and reconnect.
- [ ] Patient responds with `FORM_SNAPSHOT` containing current values, status, and revision.
- [ ] Staff ignores events older than the latest applied revision.
- [ ] Implement `STATUS_CHANGED` only when patient lifecycle transitions.
- [ ] Keep Presence limited to connection tracking; do not update Presence on each keystroke.
- [ ] On valid submit, cancel or flush pending debounce work and send `FORM_SUBMITTED` with the complete final form.

### Exit Criteria
- [ ] Staff opened after Patient starts typing receives the full current snapshot.
- [ ] Refreshing Staff while Patient remains connected restores current values.
- [ ] A submitted state is not overwritten by a later Presence leave.
- [ ] Pending field changes cannot be lost when Patient submits immediately after typing.

---

## Phase 4: Patient Form (2-3 hours)

- [ ] Build accessible sections for Personal, Contact, and Emergency Contact information.
- [ ] Integrate React Hook Form and Zod resolver.
- [ ] Broadcast form changes through a scoped subscription without forcing a full form re-render for every keystroke.
- [ ] Implement the five-second idle timer:
  - input/focus -> `actively_filling`;
  - five seconds without activity, hidden document, or window blur -> `inactive`;
  - valid submit -> `submitted`.
- [ ] Show inline errors on blur or submit.
- [ ] Show a visible `Demo only - do not enter real patient information` notice.
- [ ] Provide success feedback after submission.
- [ ] Implement one-column mobile layout and a clear desktop layout.

### Exit Criteria
- [ ] Every field in the assignment is present.
- [ ] Keyboard navigation and labels work.
- [ ] Optional fields behave correctly.
- [ ] Patient status transitions are observable in Staff.

---

## Phase 5: Staff Monitoring View (1.5-2.5 hours)

- [ ] Display Connection Status independently from Patient Status.
- [ ] Display every Patient field, grouped consistently with the form.
- [ ] Show `Waiting for input` for untouched fields.
- [ ] Highlight the most recently changed field without relying on color alone.
- [ ] Display last activity and submission timestamps.
- [ ] Preserve final submitted values and state within the current Staff session.
- [ ] Implement clear states for connecting, invalid session, waiting for Patient, disconnected, inactive, and submitted.
- [ ] Test one-column mobile and two-column desktop layouts.

### Exit Criteria
- [ ] Staff displays all assignment fields.
- [ ] Active, inactive, and submitted labels are visible and text-based.
- [ ] Connected/disconnected is reported separately.
- [ ] Staff remains usable at 375px, 768px, and 1440px widths.

---

## Phase 6: P0 QA and Production Verification (2-3 hours)

- [ ] Run lint, tests, and production build.
- [ ] Test two real browser contexts rather than only components in one React tree.
- [ ] Verify every field updates in real time.
- [ ] Verify late join, Staff refresh, Patient disconnect, and reconnect behavior.
- [ ] Verify two sessions are isolated.
- [ ] Verify invalid and missing session IDs.
- [ ] Verify no form payloads are logged in production.
- [ ] Check keyboard navigation, focus visibility, labels, error associations, and status text.
- [ ] Test Chrome plus one additional browser.
- [ ] Re-deploy and repeat the P0 acceptance checklist on the public URL.

### P0 Definition of Done
- [ ] All assignment requirements are implemented.
- [ ] The deployed URL works without local development services.
- [ ] Patient and Staff synchronize without manual refresh.
- [ ] Late-joining Staff receives a snapshot while Patient is connected.
- [ ] Status and connection state behave independently.
- [ ] Responsive layouts pass at the three target widths.
- [ ] No database, browser persistence, secrets, confidential PDF, or real patient data is present.

---

## Phase 7: Submission Documentation and Handoff (1.5-2 hours)

- [ ] Create `README.md` with:
  - project overview;
  - live Patient and Staff testing instructions;
  - local setup and environment variables;
  - project structure and component architecture;
  - real-time event and snapshot flow;
  - UI/UX decisions across viewports;
  - accepted demo limitations and production hardening plan.
- [ ] Ensure documentation describes only features that are actually implemented.
- [ ] Add the live URL and repository URL.
- [ ] Run the final production checklist from a clean browser session.
- [ ] Prepare the submission email and send with at least a two-hour buffer before 23:59.

---

## Post-Deployment Enhancements (P2 - Likely Not Implemented)

Consider these only after every P0 Definition of Done item passes on production:

- Authentication, private channels, and Realtime Authorization/RLS.
- PostgreSQL persistence and submission history.
- Draft recovery with an approved privacy and retention design.
- Split-screen `/demo` route.
- Multi-patient session management.
- Quick-fill sample data.
- Audio notifications.
- Print/export.
- Form completion progress.

Do not mention any P2 item as an implemented bonus unless it is complete, deployed, and verified.
