# Session Handoff

Updated: August 29, 2026 (Asia/Bangkok)

## Start Here

Repository:
`/Users/keeratipong/Desktop/Dev works/agnos-assignment/agnos-patient-realtime-intake`

Read `AGENTS.md` and all five authoritative files before changing behavior:

1. `docs/REQUIREMENTS.md`
2. `docs/DECISIONS.md`
3. `docs/ARCHITECTURE.md`
4. `docs/IMPLEMENTATION_PLAN.md`
5. `docs/UI_UX_DESIGN.md`

Do not use `../preview-docs/` or `../STUDY_GUIDE_REALTIME.md` as an
implementation specification. Do not copy the confidential assignment PDF into
this repository.

## Current State

- Local `develop` and `main` may contain reviewed fast-forward changes that have not been pushed; verify their exact tips with `git branch -vv` before continuing.
- Remote production/integration release: `5896cf4 release: v0.3.0 - realtime synchronization protocol, recovery, and client isolation (Phase 3)`.
- Active branch: `feature/patient-form`; Patient Form checkpoint `a8f7158 feat: build patient intake form` is pushed to `origin/feature/patient-form`.
- Follow-up work on the same branch adds the single-action Landing redesign, launcher tests, and synchronized documentation updates.
- GitHub: https://github.com/keeratipong4/agnos-patient-realtime-intake (`origin`, public, default branch `main`).
- Production URL: https://agnos-patient-realtime-intake.vercel.app
- Vercel project: `keeratipong-boonnapongkasems-projects/agnos-patient-realtime-intake`.
- Supabase project ref: `kpigrftdqxsjggmxdjyr`.
- Supabase primary region: `ap-northeast-2` (Seoul), accepted for P0.
- Node.js: 24 LTS, pinned by `.nvmrc` and `package.json`.
- There is no database or browser persistence in P0.
- Only fake/demo information may be entered.

The following Vercel environments have the two browser-safe Supabase variables:
Production, Preview, and Development. Never print their values or add
`.env.local`/`.vercel` to Git. Never use a Supabase secret or service-role key in
the frontend.

## Completed and Verified

Phase 0, Phase 1, Phase 2, and Phase 3 are complete and merged into `main` and `develop`. Phase 4 is complete on `feature/patient-form`. Local verification passes:

- 71 Vitest unit and component tests across 6 test suites:
  - `src/lib/validations.test.ts` (13 tests)
  - `src/lib/realtime-events.test.ts` (24 tests)
  - `src/hooks/use-patient-sync.test.ts` (11 tests)
  - `src/hooks/use-staff-sync.test.ts` (13 tests)
  - `src/components/patient/patient-form.test.tsx` (8 tests)
  - `src/components/session-launcher.test.tsx` (2 tests)
- `usePatientSync` and `useStaffSync` protocol hooks:
  - Strict runtime payload validation across all fields and nested `emergencyContact` structures;
  - Monotonically increasing timestamp-based revisions (`Math.max(Date.now(), lastRevision + 1)`) for all Patient events (`FORM_PATCH`, `FORM_SNAPSHOT`, `STATUS_CHANGED`, `FORM_SUBMITTED`), allowing seamless updates after Patient page reloads (ADR 003);
  - Debounced `FORM_PATCH` broadcasting across all `PatientFormData` fields;
  - `SNAPSHOT_REQUEST` on subscribe / reconnect and `FORM_SNAPSHOT` recovery handshake with request ID validation;
  - Stale revision dropping on Staff across all event types (`revision <= latestRevision`);
  - `STATUS_CHANGED` emission only on actual lifecycle transitions (`actively_filling` / `inactive`), preventing bypass of full form validation;
  - Presence restricted to Patient connection tracking;
  - Form submission debounce cancellation and complete `FORM_SUBMITTED` payload;
  - Submission state locking (post-submit patch/snapshot attempts and Presence leave cannot mutate data or revert `submitted` status);
  - Session isolation: pure derived state during render and proper channel/timer cleanup on session changes and unmount;
  - Client isolation (ADR 009): independent `SupabaseClient` instances per hook to prevent channel collisions in split-view/multi-tab environments;
- Backward compatibility: `usePatientVerticalSlice` and `useStaffVerticalSlice` delegated cleanly to the new protocol hooks;
- Complete React Hook Form + Zod Patient UI across all authoritative `PatientFormData` fields;
- Independent `useWatch` broadcasters that update one top-level field at a time without a root-form value subscription;
- Five-second idle tracking with window blur and hidden-document inactivity transitions;
- Accessible blur/submit errors, mutually dependent Emergency Contact feedback, normalized submission, and immutable `Submission Confirmed` UI;
- Responsive one-card Landing flow with one pre-session `Create new session` action, followed by paired Patient/Staff links for the same UUID;
- ESLint (0 errors, 0 warnings);
- Production build (`next build --webpack`).

## Immediate Next Work

Complete Phase 4 through the documented PR/Preview workflow. Local fast-forward
merges do not authorize pushing `develop` or `main`. After Phase 4 is integrated
and released, start Phase 5 Staff Monitoring UI from a fresh
`feature/staff-monitor` branch based on `develop`.

## Git Workflow

Follow `docs/GIT_WORKFLOW.md`:

- `main` is production-only.
- `develop` is the persistent integration/Preview branch.
- Create `feature/<short-name>` or `fix/<short-name>` from `develop`.
- Squash feature PRs into `develop`.
- Release through a reviewed PR from `develop` to `main` after Vercel Preview,
  lint, tests, and build pass.
- Branch protection is currently disabled; observe these gates manually and do
  not push directly to `main`.
- Never force-push `main` or `develop`.
- Do not push or connect external resources without explicit user confirmation.

## New-Session Starter Prompt

```text
Continue the Agnos assignment in:
/Users/keeratipong/Desktop/Dev works/agnos-assignment/agnos-patient-realtime-intake

Read AGENTS.md, HANDOFF.md, docs/GIT_WORKFLOW.md, and all five authoritative
documents before editing. Verify git status, update develop with a fast-forward,
and never work directly on main. Phase 0 through Phase 3 are released at v0.3.0.
Phase 4 Patient Form UI is complete on feature/patient-form, including React Hook
Form + Zod, scoped broadcasting, five-second activity tracking, accessible errors,
submission locking, and a single-action Landing launcher. The suite passes with 71
tests. Production remains on the Phase 3 release at
https://agnos-patient-realtime-intake.vercel.app. Review the Phase 4 working tree,
then integrate it before starting Phase 5 Staff Monitoring UI. Preserve the P0
scope: no database, browser persistence, real patient data, auth, /demo, or
multi-patient dashboard. Run lint, tests, and build, then report changes and
blockers. Do not push or create external resources without my explicit confirmation.
```

## Verification Commands

```bash
cd "/Users/keeratipong/Desktop/Dev works/agnos-assignment/agnos-patient-realtime-intake"
nvm use
git status --short
git branch --show-current
npm ci
npm run lint
npm test
npm run build
```
