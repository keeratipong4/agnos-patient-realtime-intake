# Session Handoff

Updated: August 28, 2026 (Asia/Bangkok)

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

- Integration branch: `develop`; it was fast-forwarded through the latest
  production release before this handoff update.
- Next working branch: `feature/patient-schema`, created from the updated
  `develop` branch for Phase 2.
- GitHub: https://github.com/keeratipong4/agnos-patient-realtime-intake
  (`origin`, public, default branch `main`).
- Production checkpoint on `main`: `621f2b0 Merge pull request #1 from
  keeratipong4/develop`.
- Phase 1 implementation checkpoint: `088e793 feat: add verified realtime
  vertical slice`.
- Foundation commit: `d4b7799 chore: scaffold Next.js application foundation`.
- Production: https://agnos-patient-realtime-intake.vercel.app
- Vercel project: `keeratipong-boonnapongkasems-projects/agnos-patient-realtime-intake`.
- The GitHub repository is connected to the existing Vercel project; `main` is
  the production line and non-`main` branches are Preview deployments.
- Supabase project ref: `kpigrftdqxsjggmxdjyr`.
- Supabase primary region: `ap-northeast-2` (Seoul), accepted for P0.
- Node.js: 24 LTS, pinned by `.nvmrc` and `package.json`.
- There is no database or browser persistence in P0.
- Only fake/demo information may be entered.

The following Vercel environments have the two browser-safe Supabase variables:
Production, Preview, and Development. Never print their values or add
`.env.local`/`.vercel` to Git. Never use a Supabase secret or service-role key in
the frontend.

GitHub PR #1 established the documented development workflow and CI. It was
merged to `main` with a release merge commit. The resulting `quality` workflow
run passed, Vercel reported a successful production deployment, and the stable
production URL returned HTTP 200. Branch protection is not enabled; continue to
use PR, CI, and Preview checks manually until that decision is revisited.

## Completed and Verified

Phase 0 and the Phase 1 real-time vertical slice are complete. Local and Vercel
production checks passed for:

- lint and the webpack production build;
- secure UUID session generation and invalid UUID rejection;
- Patient/Staff role routes;
- debounced Unicode `FORM_PATCH` delivery;
- Patient Presence join/leave;
- Staff reconnect `SNAPSHOT_REQUEST` / Patient `FORM_SNAPSHOT` recovery;
- revision ordering;
- cross-session isolation;
- visible fake-data warning and ephemeral-data disclosure.

Turbopack cannot bind its CSS worker port inside the Codex sandbox. This is an
environment restriction, not an application failure. Keep `next build --webpack`
for the P0 checkpoint. Vercel and local webpack builds pass.

## Immediate Next Work

Start Phase 2 from `docs/IMPLEMENTATION_PLAN.md`. Do not jump directly to the
full Patient form.

1. Add a focused test runner suitable for TypeScript schema tests.
2. Define the complete `PatientFormData`, event payloads, `PatientStatus`, and
   `ConnectionStatus` contracts.
3. Implement the Zod schema using trim plus Unicode-friendly length rules.
4. Validate email, phone, and date of birth in the past.
5. Implement optional Emergency Contact cross-field validation.
6. Write tests for valid/invalid data, Thai/Unicode names, DOB, and partial
   Emergency Contact.
7. Run lint, tests, and production build before committing.

After Phase 2, proceed to Phase 3 protocol/recovery, then the complete Patient
form and Staff dashboard. P2 bonus features remain out of scope until all P0
acceptance checks pass on the final production implementation.

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
documents before editing. Verify git status and use feature/patient-schema,
created from develop; never work directly on main. Phase 0 and the Phase 1
production realtime vertical slice are complete at
https://agnos-patient-realtime-intake.vercel.app. Production checkpoint 621f2b0
has passed GitHub CI and Vercel verification. Start Phase 2 data contracts and
Zod validation test-first. Preserve the P0 scope: no database, browser
persistence, real patient data, auth, /demo, or multi-patient dashboard. Run
lint, configured tests, and production build, then report changes and blockers.
Do not push or create external resources without my explicit confirmation.
```

## Verification Commands

```bash
cd "/Users/keeratipong/Desktop/Dev works/agnos-assignment/agnos-patient-realtime-intake"
nvm use
git status --short
git branch --show-current
npm ci
npm run lint
npm run build
```

There is no test script yet; Phase 2 should add one before claiming tests pass.
