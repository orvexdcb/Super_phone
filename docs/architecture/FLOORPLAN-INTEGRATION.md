# SUPER PHONE — Floorplan integration decision

Status: implementation plan approved for the existing `feature/founder-architecture-center` branch.
Scope: documentation only in this commit. No application runtime, database, auth, permissions, production branch, or deployment changes.

## Existing project facts

- The repository is a pnpm workspace under `SUPER_PHONE_starter/`.
- Web: Next.js 15 / React 19 at `apps/web`.
- Mobile: Expo 52 / React Native at `apps/mobile`.
- Shared package: `packages/shared`.
- Supabase migrations: `supabase/migrations/`.
- The existing founder-only route is `apps/web/app/founder/architecture/page.tsx`.
- Existing generated data is `apps/web/app/founder/architecture/architecture-data.json`.
- Existing scanner is `.github/scripts/generate-architecture.mjs`; it currently uses regular expressions to extract local imports, web route files, mobile imports, migration-derived tables, foreign keys, RLS enablement, policies, functions, and triggers.
- The architecture page verifies the signed-in user and `profiles.role === "admin"` before rendering.

## Floorplan facts verified from the upstream repository

- Upstream: https://github.com/haydenschmitty/floorplan
- License: MIT (retain upstream copyright and license notices when vendoring or redistributing source).
- Floorplan is a Claude Code plugin with a Codex-compatible skill/workflow, not a Next.js component package.
- Its scripts are mechanical Node.js scripts. Its unattended workflow is documented in `docs/unattended.md` and driven by `skills/floorplan/workflow.json`.
- Unattended mode uses `FLOORPLAN_UNATTENDED=1`, confines writes to the Floorplan working directory, does not start a local server/browser, and reports failures through exit codes and JSON output.
- The mechanical scripts do not call an LLM. A model is needed for the architecture and description JSON jobs.
- The upstream package.json is private and describes the repo as a Claude Code plugin; it is not a published npm dependency suitable for `import floorplan from "floorplan"`.
- The local map server is a developer-machine workflow. It must not be exposed as a public Vercel service without a separate security design.

## Integration architecture

1. Keep the existing Founder Architecture Center route and its admin-only server-side authorization.
2. Run the upstream Floorplan scripts in an isolated GitHub Actions job or controlled developer/agent runner. Pin the upstream repository to a reviewed commit SHA before executing it; do not execute an unpinned `main` branch in production CI.
3. Check out the SUPER PHONE repository and Floorplan source into separate work directories. Run Floorplan in unattended mode with its codebase root explicitly set to the SUPER PHONE workspace.
4. Use Floorplan's own `scan.mjs`, `build.mjs`, `refresh.mjs`, `status.mjs`, and workflow contract. Do not rewrite their output or claim the existing regex scanner is Floorplan.
5. The model stage may read only repository source and Floorplan scan worksheets. It must return schema-validated JSON for Floorplan's documented files. It must not receive Supabase service-role keys, environment files, user records, listing data, or private storage objects.
6. Publish only sanitized architecture artifacts (node descriptions, file paths, route/relationship metadata, health summaries) to the founder-only application. Do not publish prompts, model transcripts, secrets, environment values, user data, or raw CI logs.
7. Keep artifacts versioned by source commit SHA and generation timestamp. Reject stale artifacts when their source SHA does not match the checked-out commit.
8. Keep the existing architecture JSON and UI as a fallback until the Floorplan artifact passes validation and the UI can render both formats safely.

## Data-source boundaries

- GitHub source and migration files are the source for static code structure and intended schema history.
- Supabase live metadata may be compared only through read-only catalog inspection and only after explicit approval of the required inspection scope. No SQL writes, migrations, schema changes, or data mutations are part of this integration.
- A migration-derived RLS policy is not proof that the same policy is currently active in production. The UI must label static and live evidence separately.
- Counts of rows are operational metadata and are not required for an architecture map; avoid exposing them unless there is a clear founder use case.

## Security and deployment guardrails

- No secrets in browser bundles, generated JSON, artifacts, screenshots, or logs.
- Do not put service-role credentials in `NEXT_PUBLIC_*` variables.
- Any future model credential must be a GitHub Actions secret or server-side secret, never committed to the repository.
- GitHub Actions must use least-privilege permissions, pin third-party actions to reviewed immutable SHAs, and avoid untrusted pull-request code receiving secrets.
- Keep the feature branch isolated. Do not merge to `main`, alter Supabase, or deploy to Vercel without a separate explicit approval.
- The architecture page must continue to enforce founder authorization server-side; hiding a navigation link is not authorization.

## Implementation sequence

### Phase A — Baseline and compatibility
- Preserve the current scanner and page.
- Add a deterministic validation step for the existing architecture JSON.
- Capture baseline build results and compare the generated commit SHA to the checked-out commit.

### Phase B — Floorplan runner
- Vendor or fetch Floorplan at a pinned upstream SHA in CI.
- Run the upstream scan/build/refresh scripts in unattended mode.
- Store the output as a CI artifact first; do not automatically commit or publish it.
- Add schema validation and a secret-pattern gate before any artifact is accepted.

### Phase C — Model enrichment
- Add a model provider only after choosing and configuring a server-side credential.
- Use the upstream workflow contract and schemas; keep tool access read-only and confined to the checked-out source tree.
- Require retry limits, output schema validation, and explicit failure when model output is incomplete.

### Phase D — Founder UI
- Adapt the existing architecture UI to consume validated Floorplan JSON.
- Add map navigation, dependency impact, data flow, health, recent work, and source-linked Q&A incrementally.
- Preserve Arabic RTL, navy/gold visual identity, and mobile responsiveness.
- Keep static fallback and display source commit, generation time, and data provenance.

### Phase E — Verification and release
- Run web build and relevant tests on the feature branch.
- Test admin and non-admin access, mobile layout, stale-artifact handling, missing-model-secret behavior, and secret redaction.
- Review the diff before requesting approval to merge or deploy.

## Explicitly not implemented by this document

This decision record does not install Floorplan, run its scripts, add a model provider, create GitHub secrets, modify the app, change Supabase, merge branches, or deploy. Those are separate implementation steps and must be verified independently.
