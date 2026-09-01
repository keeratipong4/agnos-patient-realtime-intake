# Session Handoff

Updated: August 30, 2026, 00:14 Asia/Bangkok

## Start Here

Repository:
`/Users/keeratipong/Desktop/Dev works/agnos-assignment/agnos-patient-realtime-intake`

Before editing, read `AGENTS.md`, `docs/GIT_WORKFLOW.md`, and the five
authoritative documents in `docs/`. Check the relevant bundled Next.js 16 guide
in `node_modules/next/dist/docs/` before writing Next.js code.

Do not use `../preview-docs/`, `../STUDY_GUIDE_REALTIME.md`, or the confidential
assignment PDF as an implementation specification.

## Authoritative Git State

The remote-tracking refs were refreshed with `git fetch origin --prune` before
this handoff work. The clean pre-QA snapshot was:

- checked-out branch: `develop`;
- `develop` and `origin/develop`: `0ef270d` — merge
  `feature/staff-monitor` into `develop`;
- `feature/staff-monitor` and `origin/feature/staff-monitor`: `31057d6`;
- `main` and `origin/main`: `7fa1a28` — release v0.5.0;
- focus/highlight implementation: `aa6f17e`, contained by
  `feature/staff-monitor`, `develop`, and `main`.

Documentation changes from this QA handoff are intentionally uncommitted. No
commit, push, deployment, release, submission email, or external resource was
created.

## Production Release Evidence

Production: https://agnos-patient-realtime-intake.vercel.app

The public deployment is release `7fa1a286fb4f9d88dc920c72dd9ed6817435cba7`.
Authoritative evidence collected on August 29-30, 2026:

- the Vercel GitHub App recorded the newest `Production` deployment as GitHub
  deployment `6154328987`, sourced from `7fa1a28` at
  `2026-08-29T09:25:38Z`;
- the deployment status is `success` with `Deployment has completed` at
  `2026-08-29T09:25:39Z`;
- the commit status for `7fa1a28` is `success` in the `Vercel` context; and
- the public production alias returned HTTP 200 from Vercel during verification.

The deployment-specific Vercel URL requires authentication, but the public
production alias is accessible without local services.

## Production-Verified P0 Behavior

All form entries below used synthetic demo data only.

- Landing/session creation produced one UUID and paired Patient/Staff links.
- Chrome Patient and Codex in-app-browser Staff ran in independent browser
  contexts. These were the only two browser surfaces available.
- All 13 controls reached Staff in real time, including exact nested paths for
  `emergencyContact.name` and `emergencyContact.relationship`.
- Focus alone moved the Staff marker before value entry. Connected active state
  showed `Patient working here`; computed production CSS reported
  `active-field-pulse`, `1.8s`, and `infinite`, with the teal outline/background
  and a live scale transform.
- Five-second inactivity retained a static `Last active field` marker with no
  active pulse class.
- Patient disconnect retained values and the static focused-field marker;
  reconnect restored `Connected` and subsequent patches arrived immediately.
- A brand-new Staff tab and a refreshed Staff tab recovered the complete draft,
  focused field, and lifecycle status through the snapshot handshake.
- Valid submission locked every Patient control and showed
  `Submission Confirmed`. Staff showed a timestamped, read-only Submitted
  summary.
- Patient disconnect and a later draft from another Patient client did not
  replace the submitted status or final values.
- Two generated UUID sessions remained isolated in both directions.
- Patient and Staff both rejected missing and malformed session IDs with an
  explicit recovery link.
- Keyboard navigation reached every form control, Submit, and the launcher link.
  Labels use matching `for`/`id` pairs, keyboard focus has visible ring/outline
  feedback, invalid controls use `aria-invalid`, and every validation message is
  referenced through `aria-describedby`.
- Connection, lifecycle, loading, inactive, disconnected, and submitted states
  all use visible text in addition to color/icon feedback.
- Browser console inspection found no fake form values, no application-originated
  errors, and no `Multiple GoTrueClient` warning. Chrome reported only LocatorJS
  extension warnings; the independent browser console was empty.

## Locally Verified

- Node.js 24 baseline with 89 Vitest tests across 9 suites.
- ESLint baseline: 0 errors and 0 warnings.
- `next build --webpack` baseline succeeds.
- Exact 375px, 768px, and 1440px Patient/Staff layouts were previously checked
  locally without horizontal overflow.
- Unit and integration suites cover stale revision dropping, packet reordering,
  snapshot recovery, focus recovery, reduced-motion behavior, and immutable
  submitted state.
- Source inspection found no `console.*` form logging, database writes,
  `localStorage`, `sessionStorage`, IndexedDB, or cookie persistence.

The final tests, lint, and build were re-run after documentation synchronization
and are recorded below.

## Not Production-Verified or Blocked

- Exact 375px, 768px, and 1440px production viewport checks are not verified in
  this run. Both available browser surfaces ignored their viewport override and
  retained 1469px and 1280px CSS viewports. Desktop production layouts had no
  horizontal overflow, and the exact target widths remain locally verified.
- Direct Vercel runtime-log inspection is blocked by Vercel authentication in
  the available Chrome context. Browser console logs and source logging paths
  were checked, but Vercel production logs must not be marked verified without
  authenticated evidence.
- Production QA verified disconnect locking and rejection of a later draft after
  submission. It did not inject a deliberately older-revision packet into the
  public channel. Exact stale-packet behavior remains locally verified by tests.
- `prefers-reduced-motion` behavior remains locally verified; the available
  production browser controls did not expose a media-preference override.

## Protocol Guardrails

- Presence reports Patient connection only; Broadcast carries form/lifecycle
  state.
- Preserve `FIELD_FOCUSED`, `FORM_PATCH`, `SNAPSHOT_REQUEST`, `FORM_SNAPSHOT`,
  `STATUS_CHANGED`, and `FORM_SUBMITTED`.
- Preserve monotonic revisions, stale-event dropping, and snapshot recovery.
- Disconnect and stale events must never replace `submitted` state.
- Keep one isolated Supabase client per synchronizer hook (ADR 009).
- No database, auth, browser persistence, `/demo`, multi-patient dashboard, or
  form-payload logging.

## Remaining Submission Tasks

1. Repeat exact-width checks against the public URL in a production browser
   harness that can enforce 375px, 768px, and 1440px CSS viewports.
2. Inspect Vercel production runtime logs while authenticated and confirm that no
   form payload appears.
3. Decide whether a production stale-packet injection is required beyond the
   existing automated stale-event coverage.
4. Review and, only with explicit permission, commit/push the documentation
   handoff.
5. Prepare and send the submission email only with explicit permission.

## Final Local Verification

- Toolchain: Node.js 24.20.0 and npm 11.19.0 via the checked-in `.nvmrc`.
- `npm test`: 89 tests pass across 9 suites.
- `npm run lint`: passes with no ESLint findings.
- `npm run build`: succeeds with Next.js 16.3.3 and the supported webpack
  fallback; `/`, `/patient`, and `/staff` build successfully.
- The shell default was Node.js 20.17.0. Its first Vitest invocation stopped at
  config loading with an ESM compatibility error and collected no tests; the
  required Node 24 rerun above is the authoritative result.
- `git diff --check` and `git diff --cached --check` pass. No `.env.local`,
  `.vercel` metadata, PDF, preview-docs, or study-guide file is tracked.
