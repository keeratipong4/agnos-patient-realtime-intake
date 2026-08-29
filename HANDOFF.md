# Session Handoff

Updated: August 29, 2026 (Asia/Bangkok)

## Start Here

Repository:
`/Users/keeratipong/Desktop/Dev works/agnos-assignment/agnos-patient-realtime-intake`

Before editing, read `AGENTS.md`, `docs/GIT_WORKFLOW.md`, and the five
authoritative documents in `docs/`. Check the relevant bundled Next.js 16 guide
in `node_modules/next/dist/docs/` before writing Next.js code.

Do not use `../preview-docs/`, `../STUDY_GUIDE_REALTIME.md`, or the confidential
assignment PDF as an implementation specification.

## Current State

- Checked-out branch: `feature/staff-monitor`, created from local `develop` at
  `98851ec`. Phase 5 changes are intentionally uncommitted pending approval.
- Local `develop` points to `98851ec`; `origin/develop`, `main`, and
  `feature/patient-form` point to `9886d8a`.
- Phase 0 through Phase 4 are integrated. Phase 5 Staff Monitoring UI is
  implemented locally and Phase 6 QA/release work is next.
- Production: https://agnos-patient-realtime-intake.vercel.app — deployment of
  `9886d8a` has not been re-verified in this handoff.
- Do not push, deploy, or create external resources without explicit permission.

## Verified Baseline

- Node.js 24; 79 Vitest tests pass across 8 suites; ESLint has no
  warnings/errors; webpack
  production build succeeds.
- Landing has one `Create new session` action before revealing paired links.
- Patient Form uses React Hook Form + Zod, scoped broadcasting, five-second
  activity tracking, accessible errors, and submission locking.
- Phase 3 realtime hooks already implement patches, lifecycle events, snapshot
  recovery, monotonic revisions, session isolation, and client isolation.

## Phase 5: Staff Monitoring UI

`src/components/staff/staff-monitor.tsx` now uses the existing
`useStaffSync(sessionId)` hook directly and provides:

- separate text-based Connection and Patient Status cards;
- all Patient fields in the same three groups as the Patient Form, including
  explicit `Waiting for input` values;
- text-and-outline latest-field feedback plus activity/submission timestamps;
- connecting, waiting, disconnected, inactive, submitted, and invalid-session
  states;
- a read-only submitted summary protected by the existing hook guards; and
- responsive one- and two-column Tailwind layouts.

The new component integration suite drives the real synchronizer through a mock
Realtime channel and covers full/partial snapshots, patches, recent-field
feedback, lifecycle changes, disconnect preservation, and submission locking.

## Protocol Guardrails

- Presence reports connection only; Broadcast carries form/lifecycle state.
- Preserve monotonic revisions, stale-event dropping, and snapshot recovery.
- Disconnect and stale events must never replace `submitted` state.
- Keep one isolated Supabase client per synchronizer hook (ADR 009).
- No database, auth, browser persistence, `/demo`, multi-patient dashboard, or
  form-payload logging.

## Key Files

- UI entry points: `src/app/staff/page.tsx` and
  `src/components/staff/staff-monitor.tsx`.
- Contracts: `src/hooks/use-staff-sync.ts`, `src/lib/realtime-events.ts`, and
  `src/types/index.ts`.
- Reference UI/spec: `src/components/patient/patient-form.tsx`, Phase 5 in
  `docs/IMPLEMENTATION_PLAN.md`, and Staff details in `docs/UI_UX_DESIGN.md`.

## Verification Before Handoff

```bash
nvm use
git status --short
git branch --show-current
npm test
npm run lint
npm run build
```

Also test Patient and Staff in separate browser contexts for live updates, late
join, refresh recovery, disconnect, inactivity, submission, and session
isolation. Report blockers and leave commits/pushes for explicit approval.

Local browser QA passed those realtime scenarios using Chrome Patient and
in-app-browser Staff contexts with fake data. The desktop layout was visually
inspected at the browser surface's 1280px CSS viewport. Exact 375px, 768px, and
1440px visual checks remain manual because both browser viewport capabilities
retained their existing desktop-sized CSS viewports, and the browser security
policy rejected an embedded fixed-width harness. No workaround was attempted.
