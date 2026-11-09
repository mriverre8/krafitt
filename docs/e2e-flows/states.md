# State and responsive flows

[← All flows](README.md)

## `states.spec.ts`

### application states › a failed server action says so and changes nothing

```mermaid
flowchart TD
    D[("Complete routine Flaky network")]
    A1["Open it; make server-action POSTs fail"]
    A2["Set active"]
    C1{{"Alert toast Something went wrong"}}
    A3["Let requests through, reload"]
    C2{{"Set active still offered: nothing changed"}}
    D --> A1 --> A2 --> C1 --> A3 --> C2
```

### application states › offline, an action fails visibly and works again once back online

```mermaid
flowchart TD
    D[("Complete routine Spotty signal")]
    A1["Open it, go offline, Set active"]
    C1{{"Toast Something went wrong"}}
    A2["Back online, Set active"]
    C2{{"Toast now your active routine"}}
    D --> A1 --> C1 --> A2 --> C2
```

### application states › a page still loading shows its skeleton

Production build only: the skeleton arrives with the link's prefetch, which `next dev` does not make.

```mermaid
flowchart TD
    D[("Complete routine Slow to load")]
    A1["Let prefetches through, hold the page's own data"]
    A2["Open /routines, wait for the prefetch, click the card"]
    C1{{"Loading status shown"}}
    A3["Release the data"]
    C2{{"Heading Slow to load"}}
    D --> A1 --> A2 --> C1 --> A3 --> C2
```

### application states › the server refuses what the form would never send

```mermaid
flowchart TD
    U(["Signed-in user on /routines"])
    A1["Strip maxlength from Name, type 61 characters, 4 weeks"]
    A2["Create routine"]
    C1{{"Alert: That name is too long, max 60 characters"}}
    C2{{"Still on /routines: nothing created"}}
    U --> A1 --> A2 --> C1 --> C2
```

### application states › a finished routine leaves the home screen saying so

```mermaid
flowchart TD
    D[("Active routine with all days walked")]
    A1["Open /"]
    C1{{"You finished All done"}}
    D --> A1 --> C1
```

## `responsive.spec.ts`

### mobile and tablet viewport › fits the screen without horizontal scroll

One test per viewport: 375 × 812 and 768 × 1024.

```mermaid
flowchart TD
    U(["Signed out, landing open at the viewport size"])
    C1{{"Hero visible"}}
    C2{{"Page no wider than the screen"}}
    U --> C1 --> C2
```

### mobile and tablet viewport › keeps the main actions reachable

One test per viewport: 375 × 812 and 768 × 1024.

```mermaid
flowchart TD
    U(["Signed out, landing open at the viewport size"])
    C1{{"Start training and Settings in view"}}
    A1["Start training"]
    C2{{"Submit button in view"}}
    U --> C1 --> A1 --> C2
```

### signed in: desktop › the header carries the section links

```mermaid
flowchart TD
    U(["Signed-in user at 1280 × 800 on /"])
    C1{{"Header: menu with the name, links Today, Workouts, Routines"}}
    A1["Click Workouts"]
    C2{{"On /workouts"}}
    U --> C1 --> A1 --> C2
```

### signed in: mobile and tablet › the menu takes over navigation, and app pages fit the screen

One test per viewport: 375 × 812 and 768 × 1024.

```mermaid
flowchart TD
    D[("Active routine Pocket plan")]
    A1["Open / at the viewport size"]
    C1{{"Mobile: header section links hidden"}}
    A2["Menu, Routines"]
    C2{{"On /routines"}}
    A3["Visit /, /routines, the routine, the profile"]
    C3{{"Each has a heading and no horizontal scroll"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### signed in: mobile and tablet › training controls stay within reach

One test per viewport: 375 × 812 and 768 × 1024.

```mermaid
flowchart TD
    D[("Active routine Thumb zone")]
    A1["Open /"]
    C1{{"Start in view"}}
    A2["Start"]
    C2{{"Finish workout in view"}}
    D --> A1 --> C1 --> A2 --> C2
```

### signed in: mobile and tablet › the editor save bar follows the screen

One test per viewport: 375 × 812 and 768 × 1024.

```mermaid
flowchart TD
    D[("Complete routine Edit on the go")]
    A1["Edit, rename exercise 1"]
    C1{{"Save changes in view"}}
    D --> A1 --> C1
```
