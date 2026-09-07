# Krafitt

Gym progress tracking: your routines, today's workout and set-by-set logging.

## Getting started

1. Copy `.env.example` to `.env` and fill it in with your Supabase project:
   - `DATABASE_URL`: the pooler in *Transaction* mode (port 6543, with `?pgbouncer=true`). Used by the app.
   - `DIRECT_URL`: the direct connection (port 5432). Used by `prisma migrate`.
   - `BETTER_AUTH_SECRET`: `openssl rand -base64 32`.
2. `pnpm install`
3. `pnpm db:migrate` — creates the tables in Supabase.
4. `pnpm dev`

## Commands

The project is pinned to pnpm through the `packageManager` field, so `corepack` picks the right version.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm test` | Tests (Vitest) |
| `pnpm db:migrate` | Applies Prisma migrations |

## How it works

- **Routine**: N weeks × M training days. Each day holds exercises with sets, a rep range and a technique.
- **Progress**: each routine keeps a cursor. The home screen shows the pending workout of whichever routine you marked as **active**, and it does not move on until you finish it (or skip it by hand).
- **Logging**: the fields stay locked until you press *Start*. A set only unlocks once the previous one is filled in, and it is saved right away. Filling in the last set closes the workout and moves you to the next day.
- **Ownership**: a routine belongs to whoever created it. There is no sharing.

## Languages and theme

- Languages: English, Spanish and Catalan. Dictionaries live in `src/i18n/{en,es,ca}.ts`; English is the source and the other two are typed against it, so a missing key is a compile error. The locale comes from a cookie, falling back to the browser's `Accept-Language`.
- Light/dark theme through a cookie: the server paints the class on `<html>`, so there is no flash and no blocking script. Colour tokens live in `src/app/globals.css`.
- Both are switched from the top bar. Neither needs an extra dependency.

## Layout

- `src/components/`: one component per file, all client components (they use `useT()`).
- `src/tests/`: one suite per component, plus `progress.test.ts` (pure logic) and `i18n.test.ts` (key parity across locales).
- `src/app/`: server pages and server actions.

## Not done yet

- Stats: no progress charts yet, general or per exercise.
- Plurals: strings such as "1 weeks · 1 days" do not agree with 1. Doing it properly needs `Intl.PluralRules` per placeholder.
