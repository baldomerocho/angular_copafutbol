# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Angular 20 + PrimeNG 20 frontend for **Copa Fútbol**, a system for running amateur football championships. It talks to the Go API in `~/Projects/saas/copafutbol` (repo `baldomerocho/copafutbol`), which is exposed through a cloudflared tunnel at `https://app-dev-clubfutbol.server.gt` — that is what `environment.ts` points at, so `ng serve` works against real data with no local backend.

The project started from the Sakai template; the demo pages, demo services and demo widgets have been removed. What is left is application code.

## Commands

```bash
npm start                        # ng serve on :4200
npm run build                    # production build
npx ng build --configuration development
npx ng lint
npx prettier --write "src/**/*.{ts,html,scss}"
```

## Architecture

### Two apps in one bundle

| Area | Route | Guard | Purpose |
|---|---|---|---|
| Management console | `/` and `/pages/*` | `authGuard` + `authChildGuard` | what organizers and delegates operate |
| Public portal | `/publico/*` | none | what players and fans read, no account needed |
| Auth | `/auth/*` | none | login and sign-up |

`authGuard` protects the parent route; **`authChildGuard` is what actually enforces the `data: { roles: [...] }` declared on each child** — `canActivate` on a parent only ever sees the parent's own `data`, so roles declared on children are dead config without it. A signed-in user who lacks the role lands on `/acceso-denegado`.

### Services

Every API service extends `ApiBase` (`src/app/pages/service/api.base.ts`), which supplies:

- `scoped(path)` — builds `<apiUrl>/<role-prefix><path>`. The backend mounts the same handler under `/manager`, `/staff` and `/admin` and scopes the rows it returns by the caller's role, so a service only picks the prefix; it never branches on role itself.
- `pub(path)` — builds `<apiUrl>/public<path>` for anything an anonymous visitor may read.
- `params(obj)` — drops empty values so they never reach the API.

Two endpoints are deliberately hardcoded rather than scoped, because only one role may call them: deleting a tournament (`/admin/tournaments/:id`) and platform settings (`/admin/settings`). `UserService` picks between `/admin/users` and `/staff/managers` for the same reason.

Every response is `BaseResponse<T>` = `{ data, message?, meta? }`.

### Boot sequence

`provideAppInitializer` in `app.config.ts` fetches branding (`/public/settings/app`) and catalogs (`/public/settings/catalogs`) before the first render, both tolerant of failure so a cold API still lets the user reach the login screen.

**Catalogs are the source of enum labels.** The API serves the Spanish label for every enum — statuses, stages, event types, roles, tiebreakers, positions, weekdays — from a `settings` row it rewrites on boot. Never hardcode those strings: use `catalogService.label('match_statuses', value)` for one label and `catalogService.get('match_event_types')` to feed a `p-select`. A new enum on the backend shows up here without a frontend release.

Branding (platform name, logo, currency symbol, primary colour) comes from the same initializer; `ConfigService.appConfig()` is a signal, and the configured colour is painted over the Aura palette at boot.

### Auth

`AuthService` decodes the JWT client-side to read `role`, `user_id` and `exp`. `isLoggedIn()` returns false and clears storage once `exp` has passed, so an expired session cannot leave the app half-signed-in. `authInterceptor` attaches the token to any request whose URL starts with `environment.apiUrl` — matched against the environment, never a literal hostname — and signs the user out on a 401 from our own API.

Sign-up creates a manager and nothing else; the role is decided by the API. Staff and admin accounts are created from the users screen.

### Conventions

- Standalone components with inline templates. The older pages that still have separate `.html` files are the exception, not the pattern to copy.
- Signals for component state (`readonly items = signal<T[]>([])`), `inject()` over constructor injection.
- New control flow (`@if`, `@for`, `@empty`) rather than `*ngIf` / `*ngFor`.
- Status colours come from `src/app/pages/shared/status.ts` so a status reads the same everywhere. Add new mappings there rather than inline in a template.
- Spanish for everything the user reads; English for identifiers, comments and commit messages.
- Tables get an `emptymessage` template that explains what to do next, not just "no data".
- Errors surface through `MessageService` with the API's own `err.error.message` when it has one — the backend returns actionable Spanish text for the domain rules (closed registration, unpaid enrollment, occupied field, suspended player).

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main`/`master`, deploys to GitHub Pages, and tags a semver release. The version bump is read from the push commit message: `[change major|minor|patch]`, `[skip version]`, default patch.

Pages serves from `/<repo>/`, so the workflow passes `--base-href` and copies `index.html` to `404.html` for SPA deep links. Deploying to Cloudflare Pages or Vercel instead means dropping those two steps and using that platform's rewrite config (`vercel.json` is already in the repo).

## Still open

- No pagination: `BaseResponse.meta` is typed but the API never fills it, so tables load everything.
- No tests beyond the Karma scaffolding.
- The knockout bracket renders as a list of rounds, not a connected bracket diagram.
- Match events cannot be edited, only created and deleted.
