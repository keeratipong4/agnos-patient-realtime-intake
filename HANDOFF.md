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

- Checked-out branch: `develop`.
- Local and origin `develop`, `main`, and `feature/patient-form` all point to
  `9886d8a`, following Patient Form commit `a8f7158`.
- Phase 0 through Phase 4 are integrated. Phase 5 Staff Monitoring UI is next.
- Production: https://agnos-patient-realtime-intake.vercel.app — deployment of
  `9886d8a` has not been re-verified in this handoff.
- Create `feature/staff-monitor` from `develop`; do not implement Phase 5
  directly on `develop` or `main`.
- Do not push, deploy, or create external resources without explicit permission.

## Verified Baseline

- Node.js 24; 71 Vitest tests pass; ESLint has no warnings/errors; webpack
  production build succeeds.
- Landing has one `Create new session` action before revealing paired links.
- Patient Form uses React Hook Form + Zod, scoped broadcasting, five-second
  activity tracking, accessible errors, and submission locking.
- Phase 3 realtime hooks already implement patches, lifecycle events, snapshot
  recovery, monotonic revisions, session isolation, and client isolation.

## Phase 5: Staff Monitoring UI

Use the existing `useStaffSync(sessionId)` hook; do not duplicate the realtime
protocol in the component.

Implement:

- Separate text-based Connection and Patient Status indicators.
- Every `PatientFormData` field, grouped like the Patient Form, with
  `Waiting for input` for untouched values.
- Non-color-only recent-field highlighting plus activity/submission timestamps.
- Clear connecting, disconnected, inactive, submitted, and invalid-session states.
- A read-only submitted summary that Presence leave cannot overwrite.
- Responsive layouts at 375px, 768px, and 1440px.
- Component tests for fields, highlights, statuses, recovery, disconnect, and
  submitted-state locking.

## Protocol Guardrails

- Presence reports connection only; Broadcast carries form/lifecycle state.
- Preserve monotonic revisions, stale-event dropping, and snapshot recovery.
- Disconnect and stale events must never replace `submitted` state.
- Keep one isolated Supabase client per synchronizer hook (ADR 009).
- No database, auth, browser persistence, `/demo`, multi-patient dashboard, or
  form-payload logging.

## Key Files

- UI entry points: `src/app/staff/page.tsx` and
  `src/components/staff/staff-vertical-slice.tsx`.
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
