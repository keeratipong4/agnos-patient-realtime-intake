<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository guide

## Commands

- `nvm use` selects the checked-in Node.js 24 toolchain.
- `npm run dev` starts the Next.js development server.
- `npm run build` creates the production build with Next.js's supported webpack
  fallback. Turbopack cannot bind its CSS transform worker port in the current
  validation environment.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint over the repository.
- `npm test` runs the complete Vitest unit and component suite once.

## Verified structure

- `src/app/` contains App Router routes, the root layout, and global styles.
- `public/` contains static assets.
- `docs/` contains the authoritative requirements, decisions, architecture,
  implementation plan, and UI/UX design documents. Read all five before
  changing implementation behavior.
- Shared components, hooks, libraries, and types belong under `src/components/`,
  `src/hooks/`, `src/lib/`, and `src/types/` respectively as they are introduced.

## Project boundaries

- Work inside this nested repository and preserve `.git`, `.gitignore`, and
  `docs/`.
- Use Next.js 16 App Router, TypeScript, Tailwind CSS, React Hook Form, Zod, and
  Supabase Realtime Broadcast plus Presence.
- Keep Patient and Staff roles route-derived and scoped to one unguessable UUID
  session at a time.
- Keep demo form data ephemeral. Do not add a database, cookies, localStorage,
  sessionStorage, IndexedDB, or any other browser persistence in P0.
- Never add secrets, a Supabase service-role key, confidential assignment files,
  or real patient information. Browser code may use only the publishable key.
- Keep connection state independent from Patient lifecycle state. Presence is
  for slow-changing participation; Broadcast carries form and lifecycle events.
- Do not start P2 features until P0 is deployed and verified in production.
- The Phase 3 realtime protocol release is deployed at
  `https://agnos-patient-realtime-intake.vercel.app` as production v0.3.0.
- Phase 4 Patient Form UI is complete on `feature/patient-form`, including the
  single-action session launcher. Phase 5 Staff Monitoring UI is implemented
  locally on `feature/staff-monitor`; Phase 6 QA and release work are next.
- Do not push, deploy, or create external resources without explicit user
  confirmation.
