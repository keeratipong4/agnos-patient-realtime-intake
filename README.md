# Agnos Patient Realtime Intake

Real-time Patient and Staff intake assignment built with Next.js 16, TypeScript,
Tailwind CSS, and Supabase Realtime. The current implementation is the Phase 1
vertical slice: one temporary Patient input implements Broadcast, Presence, session
isolation, and snapshot recovery before the full form is implemented. Phase 2 adds
the complete Patient data/event contracts, Zod validation, and focused schema tests.
The deployed production app still represents the Phase 1 proof and is available at
[agnos-patient-realtime-intake.vercel.app](https://agnos-patient-realtime-intake.vercel.app).

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

Open `http://localhost:3000`, create a session, and open its Patient and Staff
links in separate browser contexts. Type fake data in Patient and confirm that it
appears in Staff. Refresh Staff while Patient stays open to exercise the snapshot
handshake.

## Commands

- `npm run dev` — start the development server.
- `npm test` — run the focused Vitest schema suite once.
- `npm run lint` — run ESLint.
- `npm run build` — create the production build with Next.js's webpack fallback.
- `npm run start` — serve the production build.

## Data and security boundary

- Use fake/demo data only. Never enter real patient information.
- Drafts are held in React memory and sent through ephemeral Broadcast events.
- Supabase auth persistence is disabled; the app does not use browser storage or
  a database.
- Public Realtime channels are acceptable only for this assignment demo. A real
  system needs authentication, private channels, authorization, and a defined
  retention policy.
- If both clients disconnect, session data is lost by design.

## Documentation

The authoritative project documents are in `docs/`:

- `REQUIREMENTS.md`
- `DECISIONS.md`
- `ARCHITECTURE.md`
- `IMPLEMENTATION_PLAN.md`
- `UI_UX_DESIGN.md`

Operational handoff and delivery guidance:

- `HANDOFF.md`
- `docs/GIT_WORKFLOW.md`

## Deployment

- Production: https://agnos-patient-realtime-intake.vercel.app
- Host: Vercel, using the Node.js 24 runtime.
- Realtime: Supabase Broadcast and Presence in `ap-northeast-2` (Seoul).
- Verified on August 28, 2026 with two production browser tabs: Unicode patch
  delivery, reconnect snapshot recovery, Presence leave, invalid UUID rejection,
  and cross-session isolation all passed.
