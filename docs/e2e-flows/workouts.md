# Workout flows

[← All flows](README.md)

A seeded **complete workout** has one day under its own name, with a press (two ranged sets) and a row (one fixed set).

## `workouts/workouts.spec.ts`

### workouts › create one: named and nothing else, opening empty

```mermaid
flowchart TD
    U(["Signed-in user on /workouts"])
    C1{{"You have no workouts yet., Create workout disabled"}}
    A1["Name Arms, Create workout"]
    C2{{"On /workouts/id, heading Arms"}}
    C3{{"0 exercises · 0 sessions, This workout is empty, Incomplete"}}
    U --> C1 --> A1 --> C2 --> C3
```

### workouts › fill it in, then it is ready to start

```mermaid
flowchart TD
    D[("Empty workout Arms")]
    A1["Edit, Add exercise Curl, reps 10 to 12, save"]
    C1{{"Toast Changes saved, The workout is complete"}}
    A2["Done"]
    C2{{"Start workout shown, 1 exercise · 0 sessions"}}
    D --> A1 --> C1 --> A2 --> C2
```

### workouts › start, log and finish a session

```mermaid
flowchart TD
    D[("Complete workout Quick pump")]
    A1["Start workout"]
    C1{{"On /: Quick pump, Session 1, sets open at once"}}
    A2["Log 40 kg × 12, Finish workout"]
    C2{{"Dialog: This workout is not done."}}
    A3["Finish anyway"]
    C3{{"Toast Workout finished, Nothing in progress"}}
    A4["Open the workout, then History"]
    C4{{"2 exercises · 1 session; cell 40 kg, 12 reps"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

### workouts › while under way it is locked for editing and can be finished from its page

```mermaid
flowchart TD
    D[("Complete workout Busy, in progress")]
    A1["Open it"]
    C1{{"In progress badge; Options has no Edit"}}
    A2["Finish workout, Finish anyway"]
    C2{{"Toast Workout called off, Start workout back"}}
    D --> A1 --> C1 --> A2 --> C2
```

### workouts › starting one over an active routine asks first

```mermaid
flowchart TD
    D[("Active routine My block; workout Extra session")]
    A1["Open the workout, Start workout"]
    C1{{"Dialog: Your routine My block will no longer be active."}}
    A2["Confirm Start workout"]
    C2{{"On /, day Extra session"}}
    D --> A1 --> C1 --> A2 --> C2
```

### workouts › a routine cannot be set active while a workout is under way

```mermaid
flowchart TD
    D[("Workout Unfinished in progress; routine Waiting")]
    A1["Open Waiting, Set active"]
    C1{{"Error toast: Finish the workout Unfinished first"}}
    D --> A1 --> C1
```

### workouts › rename, duplicate and delete

```mermaid
flowchart TD
    D[("Complete workout Core")]
    A1["Options, Rename routine to Core blast"]
    C1{{"Heading Core blast"}}
    A2["Options, Duplicate workout, confirm"]
    C2{{"Heading Core blast copy, under /workouts"}}
    A3["Options, Delete workout"]
    C3{{"Dialog: Everything logged in it is lost."}}
    A4["Delete"]
    C4{{"On /workouts: the copy is gone, Core blast remains"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

### workouts › the full list searches and filters by status

```mermaid
flowchart TD
    D[("Ready one complete; Empty one empty")]
    A1["Open /workouts/all"]
    C1{{"All 2 checked"}}
    A2["Pick Ready"]
    C2{{"Only Ready one"}}
    A3["Pick All, search empty"]
    C3{{"Only Empty one"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```
