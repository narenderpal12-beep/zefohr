# PeopleHub

Phase 1 marketing website and organisation signup portal for an Indian HRMS product.

## Run & Operate

- `artifacts/peoplehub: web` — primary Express/Vite SSR website, including a standalone API for production.
- `artifacts/api-server: API Server` — existing shared `/api` service using the same domain library.
- `pnpm run db:setup` — development SQL schema and non-overwriting defaults.
- `pnpm run typecheck` — workspace library and app checks.
- `pnpm --filter @workspace/api-spec run codegen` — API hooks and Zod validators.
- See README.md for secure admin creation, environment configuration and future roadmap.

## Architecture decisions

- Keep the provided pnpm workspace. Website client/server are in the PeopleHub artifact; shared domain logic is in `lib/peoplehub`.
- The user explicitly requested JWT/bcrypt and pg/plain SQL; do not migrate this app to Clerk or Drizzle without asking.
- **Do not use Drizzle push for this product:** the SQL migration is authoritative and the starter Drizzle schema does not describe these tables.
- Production database schema changes go through Replit Publish. Startup seeds missing content only; it never executes schema DDL.
- API and SSR services must share the same signing secret and business library. JWT lives in an HttpOnly cookie, not localStorage.

## Product boundaries

The user requested Phase 1 only. HRMS operational modules are future scope. Payment provider is intentionally a stub: subscribe requests stay pending; no simulated successful payments. No public super-admin creation or default password.

## Key files

- `lib/peoplehub/src/defaults.ts` — CMS defaults and initial suites/services/plans.
- `lib/peoplehub/migrations/001_initial.sql` — schema.
- `lib/peoplehub/src/{auth,content,seo,seo-routes}.ts` — domain handlers.
- `lib/api-spec/openapi.yaml` — contract.
- `artifacts/peoplehub/src` — public site, auth, organisation dashboard and admin screens.
- `artifacts/peoplehub/server/index.ts` — SSR and HTTP routing.

## Before launch

Configure super-admin credentials securely, actual site URL and business contacts; review draft legal policies. Performance/Lighthouse targets have not been independently audited.
