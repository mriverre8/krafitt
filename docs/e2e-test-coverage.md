# E2E coverage (Playwright)

Inventory of Krafitt's features and their end-to-end test coverage. The specs live in [`tests/e2e/`](../tests/e2e); how to run them is in the [README](../README.md#end-to-end-playwright). Every test is drawn as a flowchart in [e2e-flows/](e2e-flows/README.md).

## Test environment and data

| Aspect | How it is handled |
|---|---|
| Database | Never the real one. Without `E2E_DATABASE_URL`, Playwright starts a local, disposable Postgres (`embedded-postgres`, data in `node_modules/.cache/krafitt-e2e-postgres`). In CI, a `postgres:17` service. The suite refuses any host other than `localhost`. |
| Schema | The `setup` project runs `prisma db push` (migrations are not committed). It deletes nothing: there is no need to. |
| Isolation | Every test signs up its own users through BetterAuth (`/api/auth/sign-up/email`) with a random email and password. No test sees another's data, so they run in parallel and in any order. |
| Preconditions | `tests/e2e/support/seed.ts` writes the starting state with SQL (a complete routine, a membership…). The behaviour under test always goes through the UI. |
| Server | Production build (`next build && next start`) on port 3100, with `DATABASE_URL`, `BETTER_AUTH_URL` and a random `BETTER_AUTH_SECRET` per run. `E2E_DEV=1` uses `next dev`. |
| Rate limiting | In production BetterAuth limits authentication attempts per IP. Every test context sends its own `X-Forwarded-For`, as different users behind a proxy would. The limit itself is tested too. |
| External services | Google and GitHub OAuth cannot be tested without real accounts (see Blocked). There are no other external integrations. |
| Credentials | None in the repository or in secrets: every account is created and thrown away on each run. |

## Feature inventory

Key for the "Before" column: the state before this audit (only the signed-out tests from the initial setup existed).

| # | Feature | Where | Expected behaviour | Main cases | Edge cases and errors | Before | New tests |
|---|---|---|---|---|---|---|---|
| 1 | Landing | `/` signed out (`components/landing`) | Introduces the app and the sign-in form | Hero, 4 sections, anchor CTAs, header and footer | Mobile and tablet with no horizontal scroll | Yes | No |
| 2 | Legal pages | `/legal/[doc]` | Shows privacy, terms or cookies in the active language | Footer links, tab title, Back button | Unknown document → not found (noindex) | Yes | No |
| 3 | Settings and language | Settings modal | Change theme and language (en, es, ca) | Open and close (button and Escape), persistent theme, Spanish, Catalan signed in and out | The language survives a reload | Yes | Yes |
| 4 | Sign up | Landing form, BetterAuth | Creates the account and signs it in | Successful sign-up | Email already registered, native validation (required, format, minimum length) | Validation only | Yes |
| 5 | Sign in | Landing form | Signs in with email and password | Successful sign-in | Wrong password, double click (one request, button locked), brute force (429) | Validation only | Yes |
| 6 | Social login | Google / GitHub | OAuth with the provider | — | — | No | Blocked |
| 7 | Sign out | User menu | Asks for confirmation and ends the session | Cancel and confirm | Private routes are no longer reachable | No | Yes |
| 8 | Expired session | Any private page | An expired session counts as no session | Redirect to `/` | — | No | Yes |
| 9 | Route protection | 15 private pages, 2 exports | Signed out: redirect to `/` or 401 | Every route | — | No | Yes |
| 10 | Not found pages | Unknown routes and `[id]`s | 404 inside the layout, with a way back | Missing route, unknown id in every section | Workout under `/routines`, someone else's private routine | Partial | Yes |
| 11 | Create a routine | `/routines`, `/routines/all` | Name and duration (1–52 weeks) or open-ended | Fixed duration, open-ended, redirect to the routine, shows in the list | Button disabled without a name or with weeks out of range; a name that is too long is refused by the server | No | Yes |
| 12 | Day editor | `/routines/[id]` in edit mode | The whole day's plan as one form, saved at once | Add a day, exercise, sets and ranges, save, reload | Outstanding problems and "Show errors", undo, discard when leaving with changes, add/remove/reorder exercises, rep type; techniques, drop sets, rest-pause (and missing pause), timed sets, preview only, bringing back a removed exercise | No | Yes |
| 13 | Day management | Day tabs and day menu | Rename, reorder and delete while the routine has not started | All three, persisted | Started routine: no adding, reordering or deleting; keyboard on the tabs | No | Yes |
| 14 | Activate a routine | Routine page | Only one active routine, and only if complete | Activate, deactivate, switch the active one | Incomplete routine has no button; a workout in progress prevents it | No | Yes |
| 15 | Routine options | "Options" menu | Rename, duration, visibility, share, duplicate, delete, export | All of them, persisted | Open-ended routine has no duration; incomplete has no export or send (409); finished is read-only | No | Yes |
| 16 | Routine lists | `/routines`, `/routines/all` | Preview of 5, full paginated list | "View more", search, status filter with counts, pagination by 10 | Search with no results, empty state | No | Yes |
| 17 | Today's training | `/` with an active routine | Shows the day owed and logs its sets | Start, log with effort, persistence, history | Sets in order only, invalid values, weight 0 = bodyweight, finish with blanks or with nothing, complete day | No | Yes |
| 18 | Routine progress | Bottom bar of `/` | Change day, skip week, finish the routine | All three, with confirmation | Last week's values as a reference; finished routine on the home screen | No | Yes |
| 19 | History | `/progress/[id]` | Summary, table per exercise and week, export | Logged set with its effort, volume, browsing exercises and days, `.xlsx` | Someone else's private routine → not found; member allowed; workout has no export | No | Yes |
| 20 | Workouts | `/workouts`, `/workouts/[id]` | A one-day routine that repeats | Create, fill in, start, log, finish, history | Locked while in progress; starting over an active routine asks first; called off with no sets | No | Yes |
| 21 | Workout options | Workout menu | Rename, duplicate, delete, send, make public | Rename, duplicate, delete | — | No | Yes |
| 22 | Workout list | `/workouts/all` | Search and status filter | "Ready" filter and search | — | No | Yes |
| 23 | Members | `/routines/[id]/people`, `/routines/requests` | The owner invites; the invitee accepts or declines | Invite, accept, read the routine and its history, remove a member, leave | Unknown email, your own, repeated invitation, decline, cancel an invitation, owner-only page | No | Yes |
| 24 | Send a routine or workout | "Send" modal | The recipient gets their own copy if they accept | Send with or without membership, accept, workouts inbox | Unknown email, to yourself, decline | No | Yes |
| 25 | Public and private | Routines and workouts | Public = read and copy for anyone with the link | View, export, save a copy, link to the creator | Private → not found (page, history and export) | No | Yes |
| 26 | Shared with me | `/routines/shared`, `/shared/all`, `/shared/[ownerId]` | Grouped by owner | Blocks of 3, owner's page, search by person or email | No results, owner sharing nothing → not found | No | Yes |
| 27 | Profile | `/profile/[id]` | Name, followers, training year, active routine and finished public ones | Own profile and someone else's | Private or unfinished routines are not shown | No | Yes |
| 28 | Following | Profile and `/profile/[id]/follows` | Follow and unfollow; follower and following lists | Follow, unfollow, follow back, tabs, "Load more" | Empty lists; you cannot follow yourself; share profile | No | Yes |
| 29 | Account | Settings modal signed in | Name, picture, delete account | Change name, upload and remove picture, delete account | A file that is not an image; a deleted account can no longer sign in | No | Yes |
| 30 | App states | Global | Visible errors, loading and empty states | Failed server action, offline, loading skeleton | The UI does not change when the action fails | No | Yes |
| 31 | Responsive | Global | Usable on desktop, tablet and mobile | Header and menu navigation, no horizontal scroll, controls within reach | Bottom bar of the installed PWA | Partial | Yes |

## Coverage matrix

| Feature | Scenarios | Tests | Status |
|---|---|---|---|
| Landing | Load, sections, header and footer | `home.spec.ts` | Covered |
| Public navigation | Anchor CTAs, legal pages, Back, logo | `navigation/navigation.spec.ts` | Covered |
| Settings signed out | Open and close, persistent theme, language | `navigation/settings.spec.ts` | Covered |
| Sign-in form validation | Required fields, email format, password length, name on sign-up | `auth/auth-form.spec.ts` | Covered |
| Sign up | Successful; email already registered | `auth/session.spec.ts` | Covered |
| Sign in | Successful; wrong password; double submit | `auth/session.spec.ts` | Covered |
| Brute-force protection | 429 after several failed attempts from one client | `auth/session.spec.ts` | Covered |
| Sign out | Confirmation, cancel, session ended | `auth/session.spec.ts` | Covered |
| Expired session | Redirect once expired | `auth/session.spec.ts` | Covered |
| Protected routes | 15 pages → `/`, 2 exports → 401 | `auth/session.spec.ts` | Covered |
| Social login (Google, GitHub) | OAuth with a real provider | — | Blocked by external dependency |
| 404 | Route, legal page, unknown `[id]` in 4 sections, wrong kind | `errors.spec.ts` | Covered |
| Create a routine | Validation, fixed, open-ended, listed | `routines/create.spec.ts` | Covered |
| Server-side validation | Name > 60 characters, bypassing `maxlength` | `states.spec.ts` | Covered |
| Editor: build and activate | Day, exercise, range, save, complete, activate, home | `routines/editor.spec.ts` | Covered |
| Editor: outstanding problems | Count, show errors, incomplete routine cannot be activated | `routines/editor.spec.ts` | Covered |
| Editor: undo and discard | Undo, leaving with changes (cancel and discard) | `routines/editor.spec.ts` | Covered |
| Editor: exercises and sets | Add, delete, move, add a set, AMRAP, persistence | `routines/editor.spec.ts` | Covered |
| Editor: set variants | Preset and custom technique, drop set, rest-pause and rest-pause with no pause, timed sets, preview only (and a day of previews only), bringing back a removed exercise with its history | `routines/editor-variants.spec.ts` | Covered |
| Days | Rename, reorder, delete, locked once started, keyboard tabs | `routines/editor.spec.ts` | Covered |
| Activation | Activate, deactivate, only one active, conflict with a workout | `routines/options.spec.ts`, `workouts/workouts.spec.ts` | Covered |
| Routine options | Rename, duration, visibility, share, duplicate, delete, export, finished | `routines/options.spec.ts` | Covered |
| Routine lists | Preview, search, filter, pagination, cards, tabs | `routines/list.spec.ts` | Covered |
| Today's training | Start, order, validation, effort, persistence, bodyweight, finish, complete | `training/today.spec.ts` | Covered |
| Routine progress | Change day, skip week, previous values, finish the routine, finished routine | `training/today.spec.ts`, `states.spec.ts` | Covered |
| Resumed day | Day trained ahead and left half done, "Change day (1 incomplete)", "Continue", earlier sets locked | `training/today.spec.ts` | Covered |
| History | Logged cell with its effort; access for members and strangers | `training/today.spec.ts`, `training/history.spec.ts`, `workouts/workouts.spec.ts`, `sharing/public.spec.ts` | Covered |
| History: summary, browsing and export | Volume and week, previous and next exercise, day tabs, `.xlsx`, workout by sessions with no export | `training/history.spec.ts` | Covered |
| Workouts | Create, fill in, start, log, finish, call off, lock, conflict | `workouts/workouts.spec.ts` | Covered |
| Workout options and list | Rename, duplicate, delete, search, filter | `workouts/workouts.spec.ts` | Covered |
| Members | Invite, accept, read, remove, leave, decline, cancel, errors, permissions | `sharing/members.spec.ts` | Covered |
| Sending | Routine with membership, workout, decline, errors | `sharing/send.spec.ts` | Covered |
| Public and private | Private hidden, public readable, exportable and savable, creator | `sharing/public.spec.ts` | Covered |
| Shared with me | Blocks by owner, owner's page, searches | `sharing/shared-list.spec.ts` | Covered |
| Profile | Own, someone else's, active routine, finished public ones | `profile/profile.spec.ts` | Covered |
| Following | Follow, unfollow, lists, follow back, empty states | `profile/profile.spec.ts` | Covered |
| Followers: "Load more" | First 50, then the rest | `profile/profile.spec.ts` | Covered |
| Account | Name, picture, invalid file, delete account | `profile/account.spec.ts` | Covered |
| Error states | Failed action, offline | `states.spec.ts` | Covered |
| Loading state | Skeleton while the page arrives | `states.spec.ts` | Covered |
| Empty states | Home, routines, workouts, shared, requests, members, followers, empty workout | Across the specs | Covered |
| Responsive | Landing, navigation signed in and out, no horizontal scroll, controls within reach | `responsive.spec.ts` | Covered |
| Bottom bar (installed PWA) | Only with `display-mode: standalone` | — | Blocked by external dependency |
| Catalan and profile sharing | Catalan signed in and out, persistent; copying the profile link | `navigation/settings.spec.ts`, `profile/account.spec.ts`, `profile/profile.spec.ts` | Covered |

**Summary**: 44 scenario rows. 42 covered and 2 blocked by external dependencies: **95% covered**, and **100%** of what can be automated without external services.

## Pending

None: everything that can be automated without external services has a test.

## Blocked and why

| Feature | Reason | What it would take |
|---|---|---|
| Google and GitHub sign-in | The OAuth flow ends at `accounts.google.com` and `github.com`; testing it needs real OAuth apps and accounts. | A test OAuth app and test accounts, or mocking the provider with a local OAuth server. |
| Bottom navigation bar | Only shown with `display-mode: standalone` (the installed PWA), a media feature Playwright cannot emulate. | Testing it on a real device, or a test-only CSS variant. |

## Run notes

- Firefox does not start on the current development machine (Windows Insider build 26300: a side-by-side error loading `mozglue.dll`). CI (Ubuntu) runs it along with the other two browsers.
- The copy-to-clipboard tests (routine and profile) only run in Chromium, the only browser that grants clipboard permissions in Playwright.
- The brute-force test only runs against the production build (`next dev` turns rate limiting off).
