# PeopleHub — Phase 1

Editable marketing website, organisation registration portal and super-admin CMS for an Indian HRMS product. HRMS business modules are **not** implemented in this phase. Payment collection is deliberately disabled; subscribing creates `pending_payment`, never a simulated successful payment.

## Run locally

This project uses **npm workspaces only** and a single root `package-lock.json`. Install, run, build, database and publishing commands all use npm.

```sh
npm install
npm run db:setup
# Replit: run the managed PeopleHub and API Server workflows.
# Outside Replit, with PORT and BASE_PATH set:
npm run dev
```

The standalone site defaults to port 3000 and `/`. Managed workflows supply their own port. Use `npm ci` for a clean, repeatable installation.

- `artifacts/peoplehub/src`: React marketing website, organisation dashboard and admin UI.
- `artifacts/peoplehub/server`: Express + Vite SSR, public HTML, real 404s, sitemap and robots routes.
- `artifacts/api-server`: existing shared REST service at `/api`.
- `lib/peoplehub/src`: domain modules shared by the API and the standalone SSR server.
- `lib/peoplehub/migrations`: plain SQL development migrations using `pg`; no ORM migrations.
- `lib/api-spec/openapi.yaml`: API contract; regenerate with `npm run codegen --workspace=@workspace/api-spec`.

The SSR Express app mounts the same API itself, so it can run as one standalone production app. In this Replit project the existing `/api` service remains the most-specific route. Both services use the same business code, PostgreSQL database and signing secret.

## Environment

Never commit credentials or `.env` files.

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Managed PostgreSQL connection, supplied by Replit |
| `PORT` | Service port supplied by the managed workflow |
| `BASE_PATH` | `/` for the PeopleHub root website |
| `JWT_SECRET` | Strong random signing secret; existing `SESSION_SECRET` is used if absent |
| `SUPER_ADMIN_EMAIL` | Super-admin email, set securely |
| `SUPER_ADMIN_PASSWORD` | Super-admin password of at least 10 characters, set securely |
| `SITE_URL` | Actual published origin, e.g. the custom domain, with no path |

No admin password is hardcoded and there is no public admin-creation endpoint. With no admin credentials configured, the site and organisation registration work, but admin access remains unavailable. After setting admin credentials, run `npm run db:seed` or restart PeopleHub. Seeding creates the admin only if the email does not exist; it never upgrades an existing organisation account or resets an existing user's password.

JWTs expire in seven days and are stored in HttpOnly, SameSite=Lax cookies. Passwords are bcrypt-hashed. Sign-in and registration are rate limited. Account roles are checked server-side on every protected request. Cookie mutations are same-origin only. API errors use `{ "error": "message" }`.

## Database setup and seeding

```sh
npm run db:migrate # development schema only
npm run db:seed    # preserve edited content
npm run db:setup   # both
npm run db:seed --workspace=@workspace/peoplehub-core -- --reset # deliberately resets built-in CMS sections
```

The SQL migration is idempotent. `--reset` overwrites CMS content and should not be used casually. Normal seed runs do not overwrite edits, blog posts, landing pages or SEO customisations.

**Production:** use Replit Publish's schema-diff confirmation to apply managed database schema changes. Startup does not execute schema DDL. Content seeding is idempotent. Production legal identity, policy text, contact details, site URL and super-admin secrets must be configured before launch.

## Editing content

Sign in at `/login` with your configured super-admin email, then open `/admin`.

- Content: choose a section, edit nested fields or raw JSON, save, reset and view previous versions.
- Pages: create editable landing pages with paths, titles and body content; publish to make public.
- Blog Posts: author markdown posts, set publication status, cover images, author and tags.
- Organisations: inspect real registrations and change plan, subscription status or trial end.
- Leads: contact submissions persist in PostgreSQL.

Site content is fetched at page render and refreshed in the browser. No rebuild is needed. CMS pricing owns the trial period, plan prices and suite mapping. Updating plan mappings resynchronises organisation module flags.

Draft legal policies are supplied as starting text, not legal advice. They explicitly require operator review before public launch. HRMS features and integrations are marketing descriptions/roadmap, not claims that Phase 2 modules or external connections already work.

## SEO management

`/admin/seo` is restricted to super admins:

- Route catalogue covers built-ins, CMS suites/services, published landing pages and posts.
- The backend `registerSeoRoute({path,type,titleFrom,descFrom})` is the extension point for future modules.
- Page overrides inherit from dynamic-pattern defaults, content-derived text and global settings.
- Empty overrides do not produce empty metadata.
- Per-route title, description, canonical, OG, Twitter and JSON-LD are rendered into HTML by Express.
- Organization and WebSite schema apply globally; pricing offers, FAQ, service, breadcrumb and article schemas are generated from CMS data.
- Edit global site URL, share image, GA4 ID and search-engine verification codes without redeploying.
- Extra head markup is restricted to safe meta/link elements, not arbitrary scripts.
- History restores write a new version and audit event rather than removing previous versions.
- Sitemap omits drafts, noindex URLs and authenticated app routes; splits into an index above 50,000 URLs.
- Redirects return actual 301/302 statuses, reject loops and count hits.
- Unknown public URLs return HTTP 404 and appear in the 404 monitor.

Authentication-related paths are forced to noindex unless a deliberate override is set. The SEO score is a content checklist, **not** a Lighthouse score. Lighthouse/mobile performance targets require a separate measured audit after configuration and publication.

## Build / production

```sh
npm run typecheck
npm run build
npm run start
```

The client and SSR bundle are built separately. Express serves hashed assets with long-lived cache headers and dynamic HTML with no-store. Vite runs in middleware mode during development; public routes contain rendered content before browser JavaScript. Lottie is client-only and must not access browser globals on the server.

## Future HRMS architecture

- Every new business table must have `organisation_id` and every query must scope to the authenticated organisation.
- Use `requireAuth` then `requireModule('payroll_compliance')` for future protected modules.
- Client `useModule()` reflects organisation module flags; server enforcement remains authoritative.
- Domain modules belong under the shared core, with matching future HRMS API modules; keep `/api/v1` versioning.
- Trial expiry is evaluated lazily on account access and module enforcement.
- Manually activated subscriptions are audited; no amount is charged in this release.

### Deliberately not implemented yet

Email verification and password reset; SSO; WhatsApp Business API; Razorpay billing/orders/signatures/webhooks; custom domains and white-label product features; multi-company and multi-location business modules; i18n/hreflang; API keys and webhooks; S3-compatible file storage; background jobs; full audit-log UI; employee and HR-manager operational screens; all Phase 2 HRMS functions.

`lib/peoplehub/src/payments/provider.ts` defines the stub provider and the required verification/idempotency boundaries for a future Razorpay implementation.

## Appearance, branding and expanded pages

- Both light and dark colour modes are available by default. Visitor mode preferences use a cookie so the server and client render the same mode.
- Appearance offers twelve palettes: Aurora, Ocean, Emerald, Sunset, Rose, Royal, Slate, Teal, Amber, Crimson, Indigo and Forest. Each has light/dark variants. The admin-selected palette applies site-wide, including forms and account screens, and existing visitors receive CMS updates automatically.
- Branding controls the name, tagline, logo URL, logo alt text and wordmark visibility. The name also updates the global SEO site name.
- Products and Services mega menus list the suites and specialist services. Resources and Company menus expose the expanded page collection; menu labels, descriptions and destinations are CMS content.
- Blog and About Us remain available. New pages include Media Coverage, Case Studies, Careers, Our Support and Request a Demo. Coverage, stories and job opportunities start empty rather than inventing endorsements or vacancies.
- Demo and support requests persist as contact leads with their request context. Submitting a demo does not automatically book a meeting.
- The footer has product/service/company/resource columns and editable Instagram, LinkedIn, Facebook and X/Twitter options. Unconfigured social links do not pretend to point to an official account.
- Configure `whatsapp.phone` with your actual number including country code to enable direct WhatsApp chat. Until configured, the floating contact control links to the contact page.
- New collections and pages can be edited through Content and Pages. Existing edits are preserved during normal seeds.

### Client list

The homepage client section is managed under **Admin → Clients**. Administrators can add, edit, hide, reorder or remove clients and change the section heading and description. The seven initial logos are the images supplied by the site owner; two unidentified marks use editable placeholder names rather than invented company identities.

Logo uploads accept PNG, JPEG and WebP, with browser resizing for small logo files. Uploaded logos are bounded data images saved in the existing durable CMS record, not temporary server files, so they remain available after restarts and across the API/SSR services. Local image paths and HTTPS image URLs are also supported. Limits are 150 KB decoded per uploaded logo, 60 clients and 1.5 MB per client section. Website links are optional. Client management requires super-administrator access and uses the existing CMS history and audit trail.
