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

- [x] Work only inside the nested `agnos-patient-realtime-intake/` repository; keep the confidential assignment PDF and personal study guide in the parent folder.
- [x] Initialize the Next.js application with App Router, TypeScript, ESLint, Tailwind CSS, and a lockfile.
- [x] Install only required dependencies:
  - `@supabase/supabase-js`
  - `react-hook-form`
  - `zod`
  - `@hookform/resolvers`
  - selected UI primitives only as they become necessary
- [x] Add `.env.example` containing variable names but no credentials.
- [x] Add `AGENTS.md` with verified scripts, directory conventions, scope boundaries, and the rule that P2 work must not begin before successful deployment.
- [x] Add initial scripts for `dev`, `build`, `lint`, and tests if configured.
- [x] Make the first clean commit.

### Exit Criteria
- [x] Development server starts.
- [x] Lint and production build complete.
- [x] No PDF, credentials, or personal study notes are inside the repository.

---

## Phase 1: Real-Time Vertical Slice and Early Deployment (1.5-2.5 hours)

This phase de-risks Supabase and Vercel before the full UI is built.

> **Completed August 28, 2026:** The UUID routes, temporary field, debounced
> Broadcast, Patient Presence, cleanup, and snapshot handshake pass local and
> production verification. The deployed vertical slice is available at
> `https://agnos-patient-realtime-intake.vercel.app`. Phase 2 may now begin.

- [x] Create a Supabase project and use its browser-safe publishable key.
- [x] Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` locally.
- [x] Implement UUID session generation on `/`.
- [x] Generate role links:

  ```text
  /patient?session=<uuid>
  /staff?session=<uuid>
  ```

- [x] Validate the session parameter before channel subscription.
- [x] Build one temporary Patient input and one Staff value display.
- [x] Verify `FORM_PATCH` delivery across two browser contexts.
- [x] Track Patient Presence once after `SUBSCRIBED` and verify join/leave behavior.
- [x] Remove channels, timers, and subscriptions on component unmount.
- [x] Deploy the vertical slice to Vercel.
- [x] Configure production environment variables and repeat the two-browser test on the deployed URL.

### Exit Criteria
- [x] A field typed in Patient appears in Staff without refresh.
- [x] Staff shows Patient connected/disconnected correctly.
- [x] Two different session IDs do not receive each other's events.
- [x] The deployed vertical slice works before Phase 2 begins.

---

## Phase 2: Data Contracts and Validation (1-1.5 hours)

> **Completed locally August 28, 2026:** Vitest now covers the public Patient
> schema, and the schema output is statically tied to `PatientFormData`.

- [x] Define `PatientFormData`, `PatientStatus`, `ConnectionStatus`, and all event payload types.
- [x] Define event names in one shared module:
  - `FIELD_FOCUSED`
  - `FORM_PATCH`
  - `SNAPSHOT_REQUEST`
  - `FORM_SNAPSHOT`
  - `STATUS_CHANGED`
  - `FORM_SUBMITTED`
- [x] Create a Zod schema with the assignment fields.
- [x] Implement Unicode-friendly name validation using trim and length rules rather than an ASCII-only alphabetic regex.
- [x] Validate date of birth as a valid past date.
- [x] Validate phone and email formats with clear error messages.
- [x] Make Emergency Contact optional as a group:
  - both Name and Relationship may be empty;
  - if either is entered, require the other.
- [x] Add focused schema tests for required fields, valid optional fields, Thai/Unicode names, and Emergency Contact cross-field validation.

### Exit Criteria
- [x] All original assignment fields exist in the schema.
- [x] Valid Thai and international names are accepted.
- [x] Invalid email, phone, future DOB, and partial Emergency Contact are rejected.

---

## Phase 3: Real-Time Protocol and Recovery (1.5-2.5 hours)

> **Completed locally August 28, 2026:** `usePatientSync` and `useStaffSync`
> are implemented and verified test-first with 59 passing unit tests across
> strict runtime payload contracts, recovery handshake, monotonic revisions,
> debounced patches, lifecycle transitions, session isolation, and submission locking.

- [x] Implement `usePatientSync` and `useStaffSync`.
- [x] Add a monotonically increasing revision to Patient events.
- [x] Broadcast debounced `FORM_PATCH` events after field changes.
- [x] Broadcast immediate `FIELD_FOCUSED` events so Staff can identify focus before a value changes.
- [x] Staff broadcasts `SNAPSHOT_REQUEST` immediately after subscribe and reconnect.
- [x] Patient responds with `FORM_SNAPSHOT` containing current values, status, and revision.
- [x] Staff ignores events older than the latest applied revision.
- [x] Implement `STATUS_CHANGED` only when patient lifecycle transitions.
- [x] Keep Presence limited to connection tracking; do not update Presence on each keystroke.
- [x] On valid submit, cancel or flush pending debounce work and send `FORM_SUBMITTED` with the complete final form.

### Exit Criteria
- [x] Staff opened after Patient starts typing receives the full current snapshot.
- [x] Refreshing Staff while Patient remains connected restores current values.
- [x] A submitted state is not overwritten by a later Presence leave.
- [x] Pending field changes cannot be lost when Patient submits immediately after typing.

---

## Phase 4: Patient Form (2-3 hours)

> **Completed locally August 29, 2026:** The full Patient form, scoped field
> broadcasting, activity tracker, accessible validation, submission lock, and
> simplified single-action session launcher pass 71 tests, lint, and production build.

- [x] Build accessible sections for Personal, Contact, and Emergency Contact information.
- [x] Integrate React Hook Form and Zod resolver.
- [x] Broadcast form changes through a scoped subscription without forcing a full form re-render for every keystroke.
- [x] Implement the five-second idle timer:
  - input/focus -> `actively_filling`;
  - five seconds without activity, hidden document, or window blur -> `inactive`;
  - valid submit -> `submitted`.
- [x] Show inline errors on blur or submit.
- [x] Show a visible `Demo only — Data is transmitted ephemerally and is not saved to a database or this browser.` notice.
- [x] Provide success feedback after submission.
- [x] Keep active/inactive lifecycle indicators on Staff only; Patient continues broadcasting those states without displaying them.
- [x] Implement one-column mobile layout and a clear desktop layout.
- [x] Simplify the landing page to one `Create new session` action before revealing the paired Patient and Staff links.

### Exit Criteria
- [x] Every field in the authoritative `PatientFormData` contract is present.
- [x] Keyboard navigation and labels work.
- [x] Optional fields behave correctly.
- [x] Patient status transitions are broadcast and recovered by the Phase 3 Staff synchronizer.
- [x] Patient status transitions are visible in the Staff UI (completed in Phase 5).

---

## Phase 5: Staff Monitoring View (1.5-2.5 hours)

> **Released August 29, 2026:** The complete Staff dashboard uses
> `useStaffSync` directly and is included in production v0.5.0 at `7fa1a28`.
> Production behavior QA was completed across Chrome Patient and in-app-browser
> Staff contexts on August 30; the remaining evidence gaps are recorded below.

- [x] Display Connection Status independently from Patient Status.
- [x] Display every Patient field, grouped consistently with the form.
- [x] Show `Waiting for input` for untouched fields.
- [x] Highlight the most recently changed field without relying on color alone.
- [x] Move the active highlight on focus alone, animate it while actively filling, and retain a static highlight when inactive or disconnected.
- [x] Display last activity and submission timestamps.
- [x] Preserve final submitted values and state within the current Staff session.
- [x] Implement clear states for connecting, invalid session, waiting for Patient, disconnected, inactive, and submitted.
- [x] Implement one-column mobile and two-column desktop layouts.

### Exit Criteria
- [x] Staff displays all assignment fields.
- [x] Active, inactive, and submitted labels are visible and text-based.
- [x] Connected/disconnected is reported separately.
- [x] Complete browser viewport QA at exact 375px, 768px, and 1440px widths
  without horizontal overflow.

---

## Phase 6: P0 QA and Production Verification (2-3 hours)

- [x] Run the final local gate with Node 24.20.0: 89 tests pass across 9
  suites, ESLint passes with no findings, and `next build --webpack` succeeds on
  Next.js 16.3.3.
- [x] Test two real browser contexts rather than only components in one React tree.
- [x] Verify every field updates in real time, including both nested Emergency
  Contact paths.
- [x] Verify focus-only movement, the 1.8-second infinite active pulse, inactive
  static highlighting, and disconnected static highlighting.
- [x] Verify late join, Staff refresh, Patient disconnect, and reconnect behavior.
- [x] Verify submitted Patient and Staff locking, disconnect preservation, and
  rejection of a later draft event.
- [x] Verify two sessions are isolated.
- [x] Verify invalid and missing session IDs on Patient and Staff routes.
- [ ] Verify no form payloads are logged in production. Browser consoles contain
  no payloads and source contains no payload logging, but direct Vercel runtime
  log inspection is blocked by authentication.
- [x] Check keyboard navigation, focus visibility, labels, error associations,
  and text-based status feedback.
- [x] Test Chrome plus one additional available browser surface (Codex in-app
  Browser). No other browser family was available.
- [ ] Verify production layouts at exact 375px, 768px, and 1440px widths. The
  available production browser surfaces ignored viewport overrides and retained
  1469px/1280px CSS viewports; exact widths remain locally verified.
- [x] Confirm the existing public deployment rather than re-deploying without
  authorization. Vercel/GitHub production evidence identifies release
  `7fa1a28`; the public alias returns HTTP 200.

### Production Evidence — August 30, 2026

- Vercel GitHub deployment `6154328987` is the newest Production deployment,
  sourced from `7fa1a286fb4f9d88dc920c72dd9ed6817435cba7` and completed
  successfully at `2026-08-29T09:25:39Z`.
- Chrome Patient and in-app-browser Staff exchanged all form values in separate
  contexts. A native keyboard update verified the date input path.
- A focus-only event moved the empty Staff field marker. Computed CSS on the
  active card reported `active-field-pulse 1.8s infinite`; inactivity and
  disconnect removed the pulse while retaining `Last active field`.
- Late-joining and refreshed Staff views recovered all values, lifecycle state,
  and focused field while Patient remained connected.
- Submission disabled all Patient controls and produced a timestamped Staff
  summary. Disconnect and a subsequent draft from another Patient client did not
  replace final values.
- Two UUID sessions stayed isolated in both directions. Missing and malformed IDs
  rendered the invalid-session recovery UI on both routes.
- Labels, tab order, visible focus treatment, `aria-invalid`,
  `aria-describedby`, and text-based statuses were inspected in production.
- Browser consoles had no application errors, fake payload values, or
  `Multiple GoTrueClient` warning. Chrome showed LocatorJS extension warnings
  only; the second browser console was empty.
- A deliberately older-revision packet was not injected into production. Stale
  packet and packet-reordering behavior remain locally verified by automated
  tests.

### P0 Definition of Done
- [ ] All assignment requirements are implementation- and production-verified.
  Exact production widths and authenticated Vercel log inspection remain open.
- [x] The deployed URL works without local development services.
- [x] Patient and Staff synchronize without manual refresh.
- [x] Late-joining Staff receives a snapshot while Patient is connected.
- [x] Status and connection state behave independently.
- [ ] Responsive layouts pass in production at the three target widths. They are
  verified locally, not at exact production CSS viewports in this run.
- [x] Source and repository inspection show no database, browser persistence,
  secrets, confidential PDF, or real patient data.

---

## Phase 7: Submission Documentation and Handoff (1.5-2 hours)

- [x] Create `README.md` with:
  - project overview;
  - live Patient and Staff testing instructions;
  - local setup and environment variables;
  - project structure and component architecture;
  - real-time event and snapshot flow;
  - UI/UX decisions across viewports;
  - accepted demo limitations and production hardening plan.
- [x] Ensure documentation describes only features that are actually implemented
  and labels local, production, and blocked evidence separately.
- [x] Add the live URL and repository URL.
- [ ] Run the final production checklist from a clean browser session. The
  behavior checklist passed except for the two evidence gaps recorded in Phase 6.
- [ ] Prepare the submission email and send with at least a two-hour buffer before 23:59.

### Remaining Submission Work

1. Complete exact-width production checks with a browser harness that enforces
   375px, 768px, and 1440px CSS viewports.
2. Inspect authenticated Vercel runtime logs and confirm that no form payload is
   present.
3. Decide whether production stale-packet injection is required beyond the
   automated monotonic-revision and packet-reordering suites.
4. Review, commit, and push the documentation only with explicit permission.
5. Prepare and send the submission email only with explicit permission.

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
