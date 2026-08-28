# Git and Vercel Workflow

## Goals

- Keep the production branch stable and auditable.
- Obtain a Vercel Preview for work before it reaches production.
- Keep the process lightweight enough for a single-developer candidate assignment.
- Prevent credentials and generated deployment metadata from entering Git.

## Branch Roles

### `main`

- Production-only and the Vercel Production Branch.
- Must always represent a reviewed, production-verified release.
- No direct feature commits, force pushes, or history rewrites.
- A merge to `main` is authorization to create a Vercel Production deployment.

### `develop`

- Persistent integration branch and the shared Vercel Preview line.
- Phase-level work is integrated here before release.
- Keep it buildable; do not use it as a personal scratch branch.

### Short-lived branches

- `feature/<short-name>` for planned functionality.
- `fix/<short-name>` for non-production fixes.
- `hotfix/<short-name>` for urgent fixes starting from `main`.
- `docs/<short-name>` for documentation-only work.

Use lowercase kebab-case, for example `feature/patient-schema`.

## Normal Change Flow

```text
develop -> feature/patient-schema -> PR to develop -> Vercel Preview + CI
develop -> release PR to main -> production deployment + verification
```

1. Update local integration state:

   ```bash
   git switch develop
   git pull --ff-only origin develop
   git switch -c feature/<short-name>
   ```

2. Make one bounded change. Run lint, tests when configured, and build.
3. Push the short-lived branch and open a PR to `develop`.
4. Squash-merge feature/fix PRs into `develop`, then delete the short-lived branch.
5. Verify the latest `develop` Vercel Preview across Patient and Staff contexts.
6. Open a release PR from `develop` to `main`.
7. Use a merge commit for the release PR so `main` and `develop` retain shared
   ancestry; do not squash the entire release.
8. Verify production after Vercel finishes, then merge `main` back into
   `develop` if GitHub added a release merge commit.

## Hotfix Flow

1. Branch `hotfix/<short-name>` from `main`.
2. Validate and open a PR to `main`.
3. Verify the resulting production deployment.
4. Merge `main` back into `develop` immediately so the fix is not lost.

## Required Checks

Run locally and in CI:

```bash
npm ci
npm run lint
npm test       # after Phase 2 configures the test runner
npm run build
```

Do not add `--no-verify`, disable TypeScript build errors, or merge a failing
Preview. Re-run the Patient/Staff production smoke test for every release.

## GitHub Repository Settings

The repository is public:
https://github.com/keeratipong4/agnos-patient-realtime-intake. Keep confidential
assignment material, credentials, environment files, and real patient
information out of every commit and branch.

Branch protection is not currently enabled. Until it is enabled, follow the PR,
CI, and Preview gates in this document manually and do not push directly to
`main`.

If branch protection is enabled later:

- Protect `main`: require a pull request, successful CI, resolved conversations,
  and block force pushes/deletion.
- Protect `develop`: require successful CI and block force pushes/deletion.
- For a solo deadline project, an approval requirement is optional; CI and
  Preview verification remain mandatory.
- Enable secret scanning and push protection when available.

Create a GitHub Actions workflow with one uniquely named validation job after
the Phase 2 test command is configured. The current `.github/workflows/ci.yml`
uses the uniquely named `quality` job and runs tests only when the script exists;
Phase 2 will activate that step by adding the test script. Required status checks
should only be selected after the job has run once on GitHub.

## Vercel Settings

- Connect the existing Vercel project to the GitHub repository.
- Keep `main` as Vercel's Production Branch.
- All other branches, including `develop`, remain Preview branches.
- Production, Preview, and Development currently use the same Supabase project.
  This is acceptable while sessions are ephemeral and UUID-isolated. Revisit it
  before adding database persistence.
- Never run `vercel --prod` for ordinary feature work. Use Preview deployments
  and release through `main`.

## Repository Safety

The following must remain untracked:

- `.env`, `.env.local`, and other local environment files;
- `.vercel/` and Vercel OIDC tokens;
- Supabase secret/service-role keys and database passwords;
- the confidential assignment PDF and personal study materials;
- real patient information.

Before every push:

```bash
git status --short
git diff --check
git diff --cached --check
git ls-files .env.local .vercel
```
