# Training flows

[← All flows](README.md)

A seeded **complete routine** has the days Push and Pull, each with a press (sets 1 and 2, rep ranges) and a row (one fixed set): three sets a day, four weeks long unless the diagram says otherwise.

## `training/today.spec.ts`

### training today › idle: nothing active, nothing owed

```mermaid
flowchart TD
    U(["Signed-in user, no routines"])
    A1["Open /"]
    C1{{"Nothing in progress"}}
    U --> A1 --> C1
```

### training today › the active routine puts its day on the home screen

```mermaid
flowchart TD
    D[("Complete routine Upper Lower, active")]
    A1["Open /"]
    C1{{"Day Push, routine name, Week 1 of 4"}}
    C2{{"No set fields until started; History link shown"}}
    D --> A1 --> C1 --> C2
```

### training today › log sets in order, with their effort, and keep them across a reload

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Open /, Start"]
    C1{{"0/3 sets; set 2 locked until set 1 is in"}}
    A2["Set 1: 80 kg and 0 reps"]
    C2{{"Save disabled"}}
    A3["Reps 8x"]
    C3{{"Box keeps only 8"}}
    A4["Save set 1, pick Went to failure, Bank set 1"]
    C4{{"Set 1 done, 1/3 sets, set 2 open"}}
    A5["Reload"]
    C5{{"80 and 8 still there, 1/3 sets"}}
    A6["History"]
    C6{{"Cell 80 kg, 8 reps, Went to failure"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4 --> A5 --> C5 --> A6 --> C6
```

### training today › a weight of zero reads as bodyweight

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Start, set 1 weight 0"]
    C1{{"Bodyweight note under the box"}}
    D --> A1 --> C1
```

### training today › finishing with blanks asks, then moves on to the next day

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Start, log one set, Finish workout"]
    C1{{"Dialog: This workout is not done."}}
    A2["Finish anyway"]
    C2{{"Toast Workout finished, day is now Pull"}}
    D --> A1 --> C1 --> A2 --> C2
```

### training today › finishing with nothing logged calls the day off

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Start, Finish workout"]
    C1{{"Dialog: You have not logged a single set"}}
    A2["Finish anyway"]
    C2{{"Toast Workout called off; still Push, Start offered"}}
    D --> A1 --> C1 --> A2 --> C2
```

### training today › logging every set completes the day

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Start, log all three sets"]
    C1{{"Status Workout complete"}}
    A2["Reload"]
    C2{{"Day is now Pull"}}
    D --> A1 --> C1 --> A2 --> C2
```

### training today › change day trains another day of the week first

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Change day"]
    C1{{"Push disabled: it is the current day"}}
    A2["Pick Pull"]
    C2{{"Day is now Pull"}}
    D --> A1 --> C1 --> A2 --> C2
```

### training today › skip week asks, then jumps to next week

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Skip week"]
    C1{{"Dialog: You move on to next week."}}
    A2["Confirm Skip week"]
    C2{{"Toast Week skipped, Week 2 of 4, day Push"}}
    D --> A1 --> C1 --> A2 --> C2
```

### training today › the next week shows what was lifted the week before

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Start, log 82.5 kg × 6, finish anyway"]
    C1{{"Day is Pull"}}
    A2["Skip week"]
    C2{{"Week 2 of 4"}}
    A3["Start"]
    C3{{"Set 1 placeholders read 82.5 kg and 6 reps"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### training today › the last week can finish the whole routine

```mermaid
flowchart TD
    D[("Complete one-week routine, active")]
    A1["Finish routine"]
    C1{{"Dialog: This is the last week"}}
    A2["Confirm"]
    C2{{"Toast Routine finished, home says You finished it"}}
    D --> A1 --> C1 --> A2 --> C2
```

### training today › a day left incomplete is taken up again with what it had locked

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Change day to Pull, Start, log 70 kg × 8, finish anyway"]
    C1{{"Back on Push"}}
    A2["Change day (1 incomplete)"]
    C2{{"Pull marked Incomplete"}}
    A3["Pick Pull, Continue"]
    C3{{"Set 1 shows 70 and is locked; set 2 open"}}
    A4["Log set 2"]
    C4{{"2/3 sets"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

## `training/history.spec.ts`

Most tests first train Push on the home screen: 80 kg × 8 and 70 kg × 10, then finish anyway.

### history › the summary adds up what was lifted

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Train Push: 80 × 8 and 70 × 10"]
    A2["Open /progress/id"]
    C1{{"Volume 1,340 kg"}}
    C2{{"Week 1 of 4, How the sets felt shown"}}
    D --> A1 --> A2 --> C1 --> C2
```

### history › exercises and days are browsed one at a time

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Train Push, open history"]
    C1{{"Push press, exercise 1 of 2; Previous disabled; 70 kg, 10 reps cell"}}
    A2["Next exercise"]
    C2{{"Push row, exercise 2 of 2; Not logged cell"}}
    A3["Tab Day 2 Pull"]
    C3{{"Pull press shown"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### history › the history exports as a spreadsheet

```mermaid
flowchart TD
    D[("Complete routine Paper trail, active")]
    A1["Train Push, open history, Export to Excel"]
    C1{{"Download from /progress/id/export"}}
    A2["GET the same route"]
    C2{{"200, spreadsheet type, name Paper trail - History, zip bytes PK"}}
    D --> A1 --> C1 --> A2 --> C2
```

### history › members read and export it; strangers get nothing

```mermaid
flowchart TD
    D[("Owner's routine Team log, active, with a member")]
    A1["Member opens /progress/id"]
    C1{{"Heading Team log"}}
    C2{{"Member export: 200"}}
    A2["Stranger GETs the export"]
    C3{{"404"}}
    D --> A1 --> C1 --> C2 --> A2 --> C3
```

### history › a workout reads by sessions and does not export

```mermaid
flowchart TD
    D[("Complete workout, done once")]
    A1["Open /progress/id"]
    C1{{"Summary counts Sessions"}}
    C2{{"No Export to Excel; export route 404"}}
    D --> A1 --> C1 --> C2
```
