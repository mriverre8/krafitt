# Krafitt

Gym progress tracker: build multi-week routines, train the day the routine puts in front of you, and log every set as you do it.

Next.js App Router, server actions for every mutation, Prisma 7 on PostgreSQL, BetterAuth for email/password sessions.

## Features

- **Routines** — N weeks × M training days. Each day holds exercises, and each exercise a list of sets with a rep prescription (range, fixed or AMRAP) and a technique.
- **Guided training** — each routine keeps a cursor over the `week × day` sequence. The home screen shows the pending workout of the routine marked as active and does not advance until the day is finished or skipped by hand.
- **Set-by-set logging** — fields stay locked until the workout is started; a set unlocks only when the previous set of the same exercise is filled in, and is persisted immediately. Filling the last set closes the session and moves the cursor on.
- **Progression feedback** — each set shows what it was given the last time it came round, and whether the new entry went up, down or stayed level.
- **Routine history** — per routine, a day-by-day and week-by-week grid of everything logged, including the weeks that were skipped.
- **Edit locking** — a routine that has been activated, advanced or trained is frozen: its plan is what the logged sessions were recorded against. It can still be deleted.
- **Profile** — active routine, finished routines, and completed-workout count.
- **i18n** — English, Spanish and Catalan. English is the source dictionary and the other two are typed against it, so a missing key is a compile error.
- **Themes** — light/dark resolved on the server from a cookie, so the first paint is already correct: no flash, no blocking script.
- **PWA manifest** — installable with maskable icons.

## Tech Stack

| Technology                              | Purpose                                                             |
| --------------------------------------- | ------------------------------------------------------------------- |
| Next.js 16.3.4 (App Router)             | Server components, server actions, routing                          |
| React 19.2.8                            | UI                                                                  |
| TypeScript 5 (`strict`)                 | Types across app, lib and tests                                     |
| Tailwind CSS 4 (`@tailwindcss/postcss`) | Styling, CSS-first theme tokens in `src/app/globals.css`            |
| Prisma 7 + `@prisma/adapter-pg`         | ORM and PostgreSQL driver adapter                                   |
| PostgreSQL                              | Database                                                            |
| BetterAuth 1.7.3                        | Email/password auth, sessions, Prisma adapter, Next.js cookie plugin |
| Zustand 5                               | Client state (modal host, in-progress session logs)                 |
| lucide-react                            | Icons                                                               |
| Vitest 4 + Testing Library + jsdom      | Component and unit tests                                            |
| ESLint 9 + `eslint-config-next`         | Linting                                                             |
| Prettier + `prettier-plugin-tailwindcss`| Formatting and class sorting                                        |
| pnpm 11.15.1                            | Package manager (pinned via `packageManager`)                       |

## Architecture

Server components own data fetching and authorization; client components own interaction. There is no client-side data layer and no REST API for application data — every mutation is a server action.

- **Data access** lives in `src/lib/queries.ts`. Pages call it directly; nothing fetches over HTTP.
- **Mutations** live in `src/app/actions.ts` (`'use server'`). Forms consume them through `useActionState`, and non-form actions are bound server-side and passed down as props.
- **Authorization** is centralised in `src/lib/access.ts`. `requireRoutine` checks ownership, `requireEditableRoutine` additionally refuses a routine that has gone live. Every action goes through one of them after `requireUser`.
- **Pure logic** — progression (`lib/progress.ts`), rep prescriptions (`lib/reps.ts`) and plan validation (`lib/validate.ts`) are free of Prisma and React, and are the parts covered by unit tests. The same functions run on the server (enforcement) and on the client (enabling/disabling fields), so the UI and the action never disagree.
- **Ordering is enforced server-side**: `logSet` re-derives the session's logs and rejects a set whose predecessors are missing, regardless of what the client sent.
- **Client state** is limited to two Zustand stores: the modal host and the optimistic copy of the current day's logs.
- **Styling** is Tailwind with shared class strings in `src/lib/ui.ts`, so every field, button and card is defined once.
- **Prisma Client** is generated into `src/generated/prisma` (git-ignored, produced by `postinstall`).

```text
src/
├── app/
│   ├── actions.ts               # all server actions
│   ├── api/auth/[...all]/       # BetterAuth route handler (the only one)
│   ├── routines/[id]/progress/  # routine history
│   ├── profile/
│   ├── layout.tsx               # theme + locale resolution, nav, modal host
│   └── globals.css              # theme tokens, Tailwind entry
├── components/                  # auth, chrome, history, modal, routine, ui, workout
├── i18n/                        # en (source), es, ca, provider, server helpers
├── lib/                         # auth, db, access, queries, progress, reps, validate, ui
├── store/                       # zustand: modal, session
└── tests/                       # vitest suites
prisma/schema.prisma
```

## Getting Started

### Prerequisites

- Node.js 24 (the version CI runs)
- pnpm 11.15.1 — the repo pins it through `packageManager`, so `corepack enable` is enough
- A PostgreSQL database. `.env.example` is written for Supabase (pooled connection for the app, direct connection for migrations)

### Installation

```bash
pnpm install
```

`postinstall` runs `prisma generate`, so the client is built as part of the install.

### Environment Variables

Copy `.env.example` to `.env` and fill it in:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[AWS_REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[AWS_REGION].pooler.supabase.com:5432/postgres"
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
```

| Variable              | Used by                        | Notes                                                                        |
| --------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `DATABASE_URL`        | the app (`@prisma/adapter-pg`) | Pooled connection (Supabase: transaction pooler, port 6543, `?pgbouncer=true`) |
| `DIRECT_URL`          | `prisma migrate`               | Direct connection (port 5432). Falls back to `DATABASE_URL` if unset          |
| `BETTER_AUTH_SECRET`  | BetterAuth                     | Generate with `openssl rand -base64 32`                                       |
| `BETTER_AUTH_URL`     | BetterAuth                     | Base URL of the deployment                                                    |

`.env.local` is loaded before `.env` and wins, matching Next.js behaviour (see `prisma7.config.ts`).

### Database

```bash
pnpm db:migrate
```

### Development

```bash
pnpm dev
```

## Available Scripts

```bash
pnpm dev           # development server
pnpm build         # prisma generate && next build
pnpm start         # production server (after build)
pnpm lint          # eslint
pnpm typecheck     # next typegen && tsc --noEmit
pnpm test          # vitest run
pnpm test:watch    # vitest in watch mode
pnpm db:migrate    # prisma migrate dev
pnpm db:generate   # prisma generate
pnpm format        # prettier --write "src/**/*.{ts,tsx}"
pnpm format:check  # prettier --check "src/**/*.{ts,tsx}"
```

## Project Structure

| Path                        | Contents                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `src/app/`                  | Routes (server components), `loading.tsx` skeletons, and every server action                  |
| `src/components/`           | One component per file, grouped by area: `auth`, `chrome`, `history`, `modal`, `routine`, `ui`, `workout`. Client components, since they use `useT()` |
| `src/lib/`                  | Auth, Prisma client, access control, queries, pure domain logic, shared class strings          |
| `src/i18n/`                 | Dictionaries and the server/client translators                                                 |
| `src/store/`                | Zustand stores                                                                                 |
| `src/tests/`                | One suite per component, plus `progress`, `reps`, `validate` and `i18n` key-parity tests       |
| `prisma/schema.prisma`      | BetterAuth models (`User`, `Session`, `Account`, `Verification`) and the domain models         |
| `prisma7.config.ts`         | Prisma 7 config: schema path, migrations path, `.env` loading, direct datasource URL           |

## Configuration

- **Path alias** — `@/*` maps to `src/*` (`tsconfig.json`, mirrored in `vitest.config.mts`).
- **Prisma 7** does not load `.env` on its own; `prisma7.config.ts` uses Node's built-in `loadEnvFile`, and points migrations at `DIRECT_URL`.
- **Prettier** — 4-space indent, single quotes, `printWidth` 80, one JSX attribute per line, Tailwind class sorting. `pnpm-lock.yaml`, `prisma/migrations` and `src/generated` are ignored.
- **Tailwind 4** — no config file. Palette and variants are declared in `src/app/globals.css` (`@theme inline`, `@custom-variant dark`).
- **Preference cookies** — `krafitt.theme` and `krafitt.locale`, one year, `SameSite=Lax`, written on the client and read on the server. Locale falls back to `Accept-Language`, then English.

## Database

PostgreSQL through Prisma 7 with the `@prisma/adapter-pg` driver adapter (`src/lib/db.ts`), which keeps a single client instance across HMR reloads in development.

Schema (`prisma/schema.prisma`):

- **BetterAuth**: `User`, `Session`, `Account`, `Verification`.
- **Domain**: `Routine` (name, `durationWeeks`, `isActive`, `cursor`) → `Workout` (a training day, ordered) → `Exercise` (ordered) → `ExerciseSet` (order, `repMode`, `repMin`, `repMax`, `technique`).
- **Training**: `WorkoutSession`, unique on `(userId, workoutId, week)`, holding `SetLog` rows unique on `(sessionId, exerciseId, setIndex)`.

Everything cascades from `User`, so deleting an account removes its routines and logs.

```bash
pnpm db:migrate    # create and apply a migration (uses DIRECT_URL)
pnpm db:generate   # regenerate the client into src/generated/prisma
```

There is no seed script.

## API

Application data has no HTTP API. The only route handler is BetterAuth's catch-all at `src/app/api/auth/[...all]/route.ts`, which exports `GET`/`POST` from `toNextJsHandler(auth.handler)` and serves sign-up, sign-in, sign-out and session endpoints under `/api/auth/*`. The browser talks to it through `authClient` (`better-auth/react`); the server reads the session with `currentUser()` / `requireUser()`.

Everything else is a server action in `src/app/actions.ts`:

| Action                                                        | Effect                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `createRoutine(prev, formData)`                               | Creates a routine (never active) and redirects to it                        |
| `setActiveRoutine(routineId)`                                 | Deactivates the user's other routines and activates this one. Refuses an incomplete or finished plan |
| `deleteRoutine(routineId)`                                    | Deletes the routine and everything under it                                 |
| `addWorkout(prev, formData)`                                  | Adds a training day to an editable routine                                  |
| `saveExercises(prev, formData)`                               | Saves a whole day at once from a JSON payload. Kept exercises retain their ids, so logged sessions survive an edit; returns the stored day back to the editor |
| `deleteWorkout(workoutId)`                                    | Deletes a training day from an editable routine                             |
| `logSet(workoutId, week, exerciseId, setIndex, weight, reps)` | Opens the week's session on the first set, validates ranges and ordering, upserts the log, and closes the session when the last set lands |
| `skipDay(routineId)`                                          | Advances the cursor without training                                        |

Form actions return `{ error?: string; ok?: true }` for `useActionState`; the rest throw, and validation limits are shared with the form fields through `src/lib/constants.ts`.

## Testing

Vitest with jsdom, Testing Library and `@testing-library/jest-dom`. `vitest.setup.ts` resets the modal store between tests and fills in the two things jsdom does not implement (`scrollIntoView`, `<dialog>` open/close).

```bash
pnpm test
pnpm test:watch
```

Coverage is one suite per component, plus unit tests for the pure modules (`progress`, `reps`, `validate`) and a key-parity test across the three locales.

## Deployment

No hosting-provider configuration is committed, so any platform that can build and run a Next.js app works:

```bash
pnpm install
pnpm build   # prisma generate && next build
pnpm start
```

Requirements on the target environment:

- `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (pointing at the deployed origin) set.
- The schema already applied. `build` does not run migrations, and `prisma migrate` needs `DIRECT_URL` — apply them from a machine with the direct connection before releasing.

## Contributing

Branch off `main`, and before opening a pull request run what CI runs:

```bash
pnpm typecheck
pnpm test
pnpm format:check
```

GitHub Actions runs those three plus `oxlint` on `src` for every push to `main` and every pull request.

## Notes

- `prisma/migrations` is git-ignored, so the migration history is not versioned. A fresh clone generates its own initial migration on the first `pnpm db:migrate`, and there is no `prisma migrate deploy` step anywhere in the build.
- `pnpm lint` runs ESLint, but CI lints with `oxlint@1.82.0` through `npx`. The two rule sets are not equivalent, and oxlint is not a project dependency.
- `next.config.ts` is empty; the app runs on Next.js defaults.
- `public/` still carries the `create-next-app` placeholders (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`), which nothing references.

## Known Issues

- No statistics or progress charts, general or per exercise.
- Interpolated strings do not agree in number: counts of 1 render as "1 weeks · 1 days". Fixing it properly needs `Intl.PluralRules` per placeholder.
