# Auth and session flows

[← All flows](README.md)

## `auth/auth-form.spec.ts`

### auth form › switches between sign in and sign up

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    C1{{"Sign in tab pressed, no Name field, button says Let's go"}}
    A1["Click Sign up tab"]
    C2{{"Sign up tab pressed, Name field shown, button says Create account"}}
    U --> C1 --> A1 --> C2
```

### auth form › blocks an empty submit

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    A1["Submit the empty form"]
    C1{{"Email and password report invalid"}}
    C2{{"Still on /"}}
    U --> A1 --> C1 --> C2
```

### auth form › validates email format and password length

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    A1["Type not-an-email and a 5-letter password"]
    C1{{"Both fields invalid"}}
    A2["Type a real email and an 11-letter password"]
    C2{{"Both fields valid"}}
    U --> A1 --> C1 --> A2 --> C2
```

### auth form › sign up requires a name

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    A1["Sign up tab, fill email and password, leave Name empty"]
    A2["Submit"]
    C1{{"Name field invalid"}}
    U --> A1 --> A2 --> C1
```

## `auth/session.spec.ts`

### sign up › creates the account and signs it in

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    A1["Sign up with a new name, email and password"]
    C1{{"Home says Nothing in progress"}}
    A2["Open the user menu"]
    C2{{"Profile link is there: signed in"}}
    U --> A1 --> C1 --> A2 --> C2
```

### sign up › refuses an email that already has an account

```mermaid
flowchart TD
    D[("Existing account")]
    U(["Signed out, landing open"])
    A1["Sign up with that account's email"]
    C1{{"Alert: already exists"}}
    C2{{"Form still on screen"}}
    D --> U --> A1 --> C1 --> C2
```

### sign in › with the right password

```mermaid
flowchart TD
    D[("Existing account")]
    U(["Signed out, landing open"])
    A1["Sign in with its email and password"]
    C1{{"Home says Nothing in progress"}}
    C2{{"Menu button shows the account name"}}
    D --> U --> A1 --> C1 --> C2
```

### sign in › with the wrong password shows the error and stays out

```mermaid
flowchart TD
    D[("Existing account")]
    U(["Signed out, landing open"])
    A1["Sign in with a wrong password"]
    C1{{"Alert: invalid email or password"}}
    A2["Go to /routines"]
    C2{{"Redirected to /: not signed in"}}
    D --> U --> A1 --> C1 --> A2 --> C2
```

### sign in › a double click sends one request and locks the button

```mermaid
flowchart TD
    D[("Existing account")]
    U(["Signed out, landing open"])
    A0["Hold the sign-in request until released"]
    A1["Fill credentials, double-click submit"]
    C1{{"Button disabled while waiting"}}
    A2["Release the request"]
    C2{{"Signed in: Nothing in progress"}}
    C3{{"Exactly one sign-in request was sent"}}
    D --> U --> A0 --> A1 --> C1 --> A2 --> C2 --> C3
```

### brute-force protection › repeated failed sign-ins from one client are throttled

Production build only: `next dev` turns rate limiting off.

```mermaid
flowchart TD
    D[("Existing account")]
    U(["One API client with a fixed IP"])
    A1["Five sign-ins with wrong passwords"]
    C1{{"First answer is 401"}}
    C2{{"A later answer is 429 Too many requests"}}
    D --> U --> A1 --> C1 --> C2
```

### session › sign out asks first, then ends the session

```mermaid
flowchart TD
    U(["Signed-in user on /"])
    A1["Menu, Sign out"]
    A2["Cancel in the dialog"]
    C1{{"Still signed in"}}
    A3["Menu, Sign out, confirm Sign out"]
    C2{{"Landing shown"}}
    A4["Go to /routines"]
    C3{{"Redirected to /"}}
    U --> A1 --> A2 --> C1 --> A3 --> C2 --> A4 --> C3
```

### session › an expired session is treated as signed out

```mermaid
flowchart TD
    U(["Signed-in user on /routines"])
    C1{{"Routines page shown"}}
    D[("Session expiry set to yesterday")]
    A1["Reload /routines"]
    C2{{"Redirected to /, landing shown"}}
    U --> C1 --> D --> A1 --> C2
```

### route protection (signed out) › redirects home

One test per page: `/routines`, `/routines/all`, `/routines/requests`, `/routines/shared`, `/routines/shared/all`, `/routines/some-id`, `/routines/some-id/people`, `/routines/shared/some-id`, `/workouts`, `/workouts/all`, `/workouts/requests`, `/workouts/some-id`, `/profile/some-id`, `/profile/some-id/follows`, `/progress/some-id`.

```mermaid
flowchart TD
    U(["Signed out"])
    A1["Open the private page"]
    C1{{"URL is /"}}
    C2{{"Landing shown"}}
    U --> A1 --> C1 --> C2
```

### route protection (signed out) › export answers 401

One test per route: `/routines/x/export`, `/progress/x/export`.

```mermaid
flowchart TD
    U(["Signed-out API request"])
    A1["GET the export route"]
    C1{{"Status 401"}}
    U --> A1 --> C1
```
