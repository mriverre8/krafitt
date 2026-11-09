# Public pages and error flows

[← All flows](README.md)

## `home.spec.ts`

### home page (signed out) › loads with title and hero

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    C1{{"Tab title is Krafitt"}}
    C2{{"Wordmark heading, Start training and See how it works shown"}}
    U --> C1 --> C2
```

### home page (signed out) › shows every landing section

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    C1{{"Headings: Today's workout, Write the plan, Every set week by week, Write your first routine"}}
    C2{{"Sign-in region visible"}}
    U --> C1 --> C2
```

### home page (signed out) › renders header and footer chrome

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    C1{{"Logo links to /"}}
    C2{{"Source code links to the GitHub repo"}}
    C3{{"Contact is a mailto link"}}
    U --> C1 --> C2 --> C3
```

## `navigation/navigation.spec.ts`

### navigation › hero CTAs jump to their sections

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    A1["Click See how it works"]
    C1{{"URL ends in #today, section in view"}}
    A2["Click Start training"]
    C2{{"URL ends in #join, email field in view"}}
    U --> A1 --> C1 --> A2 --> C2
```

### navigation › footer opens the legal page

One test per page: Privacy policy → `/legal/privacy`, Terms of service → `/legal/terms`, Cookie policy → `/legal/cookies`.

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    A1["Click the page in the Legal footer nav"]
    C1{{"URL is /legal/slug"}}
    C2{{"Heading and tab title name the page"}}
    U --> A1 --> C1 --> C2
```

### navigation › back button returns to the previous page

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    A1["Click Privacy policy"]
    C1{{"On /legal/privacy"}}
    A2["Click Back"]
    C2{{"Back on /, hero shown"}}
    U --> A1 --> C1 --> A2 --> C2
```

### navigation › logo leads home from a deep link

```mermaid
flowchart TD
    U(["Signed out"])
    A1["Open /legal/terms directly"]
    A2["Click the Krafitt logo"]
    C1{{"URL is /"}}
    U --> A1 --> A2 --> C1
```

## `navigation/settings.spec.ts`

### settings modal (signed out) › opens and closes

```mermaid
flowchart TD
    U(["Signed out, landing open"])
    A1["Click Settings"]
    C1{{"Settings dialog open"}}
    A2["Click Close"]
    C2{{"Dialog gone"}}
    A3["Open again, press Escape"]
    C3{{"Dialog gone"}}
    U --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### settings modal (signed out) › theme switch toggles dark mode

```mermaid
flowchart TD
    U(["Signed out, Settings open"])
    A1["Note the theme, flip the switch"]
    C1{{"Switch and html dark class flipped"}}
    A2["Reload"]
    C2{{"Theme kept: stored in a cookie"}}
    U --> A1 --> C1 --> A2 --> C2
```

### settings modal (signed out) › language switch translates the page

```mermaid
flowchart TD
    U(["Signed out, Settings open"])
    A1["Pick es"]
    C1{{"Dialog is now Configuración"}}
    C2{{"Page heading Monta tu primera rutina"}}
    U --> A1 --> C1 --> C2
```

### settings modal (signed out) › Catalan translates the page and survives a reload

```mermaid
flowchart TD
    U(["Signed out, Settings open"])
    A1["Pick ca"]
    C1{{"Dialog is Configuració, ca pressed in Idioma"}}
    A2["Reload"]
    C2{{"html lang is ca"}}
    C3{{"Heading Munta la teva primera rutina"}}
    U --> A1 --> C1 --> A2 --> C2 --> C3
```

## `errors.spec.ts`

### not found › unknown route answers 404

```mermaid
flowchart TD
    U(["Signed out"])
    A1["Open /this-route-does-not-exist"]
    C1{{"Status 404, not-found message"}}
    A2["Click the logo"]
    C2{{"Back on /"}}
    U --> A1 --> C1 --> A2 --> C2
```

### not found › unknown legal document shows the not-found page

```mermaid
flowchart TD
    U(["Signed out"])
    A1["Open /legal/not-a-doc"]
    C1{{"Not-found message"}}
    C2{{"Meta robots says noindex"}}
    U --> A1 --> C1 --> C2
```

The status is 200, not 404: the page has a `loading.tsx`, so the response is already streaming when `notFound()` runs.

### not found › signed in, an unknown /section/[id] is not found

One test per section: `routines`, `workouts`, `profile`, `progress`.

```mermaid
flowchart TD
    U(["Signed-in user"])
    A1["Open /section/random-id"]
    C1{{"Not-found message"}}
    C2{{"Still signed in: menu shows the name"}}
    U --> A1 --> C1 --> C2
```

### not found › a workout is not found under /routines, nor a routine under /workouts

```mermaid
flowchart TD
    U(["Signed-in user"])
    D[("Their complete workout Leg day")]
    A1["Open /routines/workout-id"]
    C1{{"Not found"}}
    A2["Open /workouts/workout-id"]
    C2{{"Heading Leg day"}}
    U --> D --> A1 --> C1 --> A2 --> C2
```
