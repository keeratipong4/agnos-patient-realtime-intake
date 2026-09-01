# Agnos Patient Realtime Intake

Real-time Patient and Staff intake assignment built with Next.js 16, TypeScript,
Tailwind CSS, React Hook Form, Zod, and Supabase Realtime.

Production v0.5.0 at commit `7fa1a28` includes the complete Patient intake form,
the full Staff live monitoring dashboard, focus-driven real-time field
highlights, scoped field broadcasting, five-second activity tracking, snapshot
recovery, submitted-state locking, and a single-action session launcher. The
public app is available at
[agnos-patient-realtime-intake.vercel.app](https://agnos-patient-realtime-intake.vercel.app).

## Features

- **Patient Intake Form (`/patient?session=...`):**
  - Grouped fields (Personal Details, Contact & Demographics, Emergency Contact)
  - Inline schema validation with Zod and accessible error messages
  - Debounced real-time field broadcast and immediate focus broadcasting
  - 5-second idle and blur/visibility activity tracking (`actively_filling` / `inactive`)
  - Submission confirmation lock with clear demo data disclaimer
- **Staff Live Monitor (`/staff?session=...`):**
  - Independent text-based cards for Connection Health and Patient Status
  - Live field synchronization matching Patient form groupings
  - Explicit `"Waiting for input"` indicators for untouched fields
  - Focus-driven pulse/grow indicator (`Patient working here`) and static highlight for inactive/disconnected states (`Last active field`)
  - Snapshot recovery on late join or reconnect
  - Submission state and payload persistence across disconnects
- **Session Launcher (`/`):** Single-action `Create new session` generating paired UUID links.

## Test the live application

1. Open the [production launcher](https://agnos-patient-realtime-intake.vercel.app)
   and select **Create new session**.
2. Open the generated Patient and Staff links in separate browser contexts.
3. Use synthetic demo data only. Focus a Patient field before typing to see the
   Staff marker move immediately, then complete the form and submit it.
4. Refresh or open another Staff view while Patient remains connected to exercise
   snapshot recovery. Disconnect and reconnect Patient to inspect the separate
   connection and lifecycle states.

Do not enter real personal or patient information.

## Local setup

Use Node.js 24 LTS. With `nvm`, select the checked-in version, install from the
lockfile, and copy the public environment variable template:

```bash
nvm use
npm ci
cp .env.example .env.local
```

Set these browser-safe values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never use a Supabase secret or service-role key. Then start the app:

```bash
npm run dev
```

Open `http://localhost:3000` and select **Create new session**. The launcher
reveals Patient and Staff links paired to one UUID. Open the links in separate
browser contexts, enter fake data in Patient, and confirm that it appears in Staff.
Refresh Staff while Patient stays open to exercise the snapshot handshake.

## Commands

- `npm run dev` — start the development server.
- `npm test` — run the complete Vitest unit and component suite (89 tests).
- `npm run lint` — run ESLint.
- `npm run build` — create the production build with Next.js's webpack fallback.
- `npm run start` — serve the production build.

## Real-Time Synchronization Flow

1. **Connection Presence:** Uses Supabase Realtime Presence exclusively to track whether the Patient is physically connected or disconnected.
2. **Field Patches (`FORM_PATCH`):** When the Patient types, individual field patches are broadcast with a monotonically increasing revision.
3. **Focus Tracking (`FIELD_FOCUSED`):** Focusing a field immediately broadcasts an event so Staff sees the active highlight before typing begins.
4. **Lifecycle Events (`STATUS_CHANGED`):** Activity status (`actively_filling` / `inactive`) transitions on interaction, blur, or 5-second idle.
5. **Snapshot Handshake (`SNAPSHOT_REQUEST` / `FORM_SNAPSHOT`):** Late-joining or reconnecting Staff instances request a full form snapshot from the connected Patient.
6. **Submission Lock (`FORM_SUBMITTED`):** Valid form submissions lock both views; Staff retains submitted data even if the Patient disconnects.

## Project Structure & Architecture

```text
src/
├── app/
│   ├── layout.tsx              # Root layout & styling
│   ├── page.tsx                # Session launcher
│   ├── patient/page.tsx        # Patient intake route
│   └── staff/page.tsx          # Staff monitoring route
├── components/
│   ├── session-launcher.tsx    # Single-action UUID session generator
│   ├── patient/
│   │   ├── patient-form.tsx    # Patient form with RHF + Zod
│   │   └── form-section.tsx    # Section wrapper
│   └── staff/
│       └── staff-monitor.tsx   # Staff live monitoring dashboard
├── hooks/
│   ├── use-patient-sync.ts     # Patient realtime hook & broadcaster
│   ├── use-staff-sync.ts       # Staff realtime hook & snapshot receiver
│   └── use-idle-tracker.ts     # 5-second idle & blur activity detector
├── lib/
│   ├── supabase.ts             # Ephemeral isolated Supabase client factory
│   ├── realtime-events.ts      # Event builders & schema guards
│   └── validations.ts          # Zod schema for patient intake
└── types/
    └── index.ts                # Shared types, statuses, & event contracts
```

## UI/UX & Responsive Layouts

- **Patient Form:** Clean one-column mobile layout scaling smoothly to centered desktop cards.
- **Staff Monitor:** Single-column layout on mobile/tablets switching to a two-column responsive grid on desktop (1024px+).
- **Reduced Motion:** Respects `prefers-reduced-motion` for focus pulse animations while preserving text markers and outlines.

## Data and security boundary

- Use fake/demo data only. Never enter real patient information.
- Drafts are held in React memory and sent through ephemeral Broadcast events.
- Supabase auth persistence is disabled; each hook uses an isolated ephemeral client.
- Public Realtime channels are acceptable only for this assignment demo.
- If both clients disconnect, session data is lost by design.
- A production healthcare implementation would require authentication, private
  channels and authorization policies, server-side validation, audit controls,
  encryption and key management, and an explicit retention/deletion policy.

## Verification status

Production behavior was checked on August 30, 2026 with Chrome Patient and an
independent Codex in-app-browser Staff context using fake data only. The verified
flow includes every form field, focus-only movement, the 1.8-second active pulse,
inactive/disconnected static highlighting, reconnect, late join, Staff refresh,
two-session isolation, invalid IDs, accessible validation, submission locking,
and rejection of a later draft after submission. Browser consoles contained no
form values, application errors, or `Multiple GoTrueClient` warning; Chrome
reported LocatorJS extension warnings only.

The release identity is backed by Vercel's GitHub deployment metadata: Production
deployment `6154328987` was sourced from `7fa1a28` and completed successfully on
August 29, 2026. The public alias also returned HTTP 200 during verification.

Evidence boundaries are explicit:

- **Locally verified:** 89 Vitest tests, ESLint with zero warnings/errors,
  `next build --webpack`, stale-event and packet-reordering guards,
  reduced-motion behavior, and exact 375px/768px/1440px layouts without
  horizontal overflow.
- **Not production-verified in this run:** exact target widths, because both
  available browser surfaces ignored viewport overrides; deliberately injecting
  an older-revision packet; and direct Vercel runtime-log inspection, because the
  available Vercel dashboard context required authentication.

See `HANDOFF.md` and `docs/IMPLEMENTATION_PLAN.md` for the complete acceptance
matrix and remaining submission work.

## Documentation

The authoritative project documents are in `docs/`:

- `REQUIREMENTS.md` — Technical Requirements Document (TRD)
- `DECISIONS.md` — Architecture Decision Records (ADRs)
- `ARCHITECTURE.md` — System architecture and protocol design
- `IMPLEMENTATION_PLAN.md` — Phased development plan and status
- `UI_UX_DESIGN.md` — Design system and responsive specification

Operational guidance:

- `HANDOFF.md` — Current session handoff and verified baseline
- `docs/GIT_WORKFLOW.md` — Git branch roles, PR gates, and release flow

## Deployment

- Production: https://agnos-patient-realtime-intake.vercel.app
- Repository: https://github.com/keeratipong4/agnos-patient-realtime-intake
- Release: v0.5.0, commit `7fa1a28`
- Host: Vercel, using the Node.js 24 runtime.
- Realtime: Supabase Broadcast and Presence in `ap-northeast-2` (Seoul).
- Release identity and the production behavior boundary were verified on August
  30, 2026.
