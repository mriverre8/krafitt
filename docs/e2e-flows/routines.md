# Routine flows

[← All flows](README.md)

A seeded **complete routine** has the days Push and Pull, each with a press (sets 1 and 2, rep ranges) and a row (one fixed set): three sets a day, four weeks long unless the diagram says otherwise.

## `routines/create.spec.ts`

Every test starts signed in on `/routines`, with the New routine form hydrated and empty.

### create a routine › starts empty, with nothing to show

```mermaid
flowchart TD
    U(["Signed-in user on /routines"])
    C1{{"You have no routines yet."}}
    C2{{"No Requests tab"}}
    U --> C1 --> C2
```

### create a routine › the button waits for a name and a valid duration

```mermaid
flowchart TD
    U(["Signed-in user on /routines"])
    C1{{"Create routine disabled"}}
    A1["Type a name"]
    C2{{"Still disabled: no weeks"}}
    A2["Weeks 0, then 53"]
    C3{{"Still disabled"}}
    A3["Weeks 8"]
    C4{{"Enabled"}}
    A4["Name of only spaces"]
    C5{{"Disabled again"}}
    U --> C1 --> A1 --> C2 --> A2 --> C3 --> A3 --> C4 --> A4 --> C5
```

### create a routine › a fixed-length routine opens on its own page and is listed

```mermaid
flowchart TD
    U(["Signed-in user on /routines"])
    A1["Name Strength block, 8 weeks, Create routine"]
    C1{{"On /routines/id, heading Strength block"}}
    C2{{"8 weeks · 0 days per week, This routine is empty"}}
    A2["Back to /routines"]
    C3{{"Card shows 8 weeks · 0 days and Incomplete"}}
    U --> A1 --> C1 --> C2 --> A2 --> C3
```

### create a routine › an open-ended routine takes no duration

```mermaid
flowchart TD
    U(["Signed-in user on /routines"])
    A1["Name Forever, click Open-ended"]
    C1{{"Weeks field disabled"}}
    A2["Create routine"]
    C2{{"Open-ended · 0 days per week"}}
    U --> A1 --> C1 --> A2 --> C2
```

## `routines/editor.spec.ts`

### routine editor › build a routine from scratch, save it and set it active

```mermaid
flowchart TD
    D[("Empty routine Built by hand")]
    A1["Open it, Options, Edit"]
    A2["Add day Upper"]
    C1{{"Tab Day 1 Upper, 2 things left to finish"}}
    A3["Show errors"]
    C2{{"Toggle pressed: Hide errors"}}
    A4["Exercise Bench press, reps 6 to 8, Save changes"]
    C3{{"Toast Changes saved, routine is complete"}}
    A5["Done, Set active"]
    C4{{"Toast active routine, Active badge"}}
    A6["Reload, then open /"]
    C5{{"Bench press kept; home trains Upper, Week 1 of 4"}}
    D --> A1 --> A2 --> C1 --> A3 --> C2 --> A4 --> C3 --> A5 --> C4 --> A6 --> C5
```

### routine editor › a routine with holes cannot be set active

```mermaid
flowchart TD
    D[("Routine whose only exercise has no sets")]
    A1["Open it"]
    C1{{"Incomplete badge"}}
    C2{{"No Set active button"}}
    D --> A1 --> C1 --> C2
```

### routine editor › undo puts the day back as it was saved

```mermaid
flowchart TD
    D[("Complete routine")]
    A1["Edit, rename exercise 1"]
    C1{{"Save changes appears"}}
    A2["Undo changes"]
    C2{{"Name back to Push press, save bar gone"}}
    D --> A1 --> C1 --> A2 --> C2
```

### routine editor › leaving edit mode with unsaved changes asks before discarding

```mermaid
flowchart TD
    D[("Complete routine")]
    A1["Edit, rename exercise 1 to Never saved"]
    C1{{"Tab marked unsaved changes"}}
    A2["Done, Cancel in Unsaved changes"]
    C2{{"Still editing, text kept"}}
    A3["Done, Discard changes"]
    C3{{"Edit mode left"}}
    A4["Reload"]
    C4{{"Push press shown, Never saved gone"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

### routine editor › exercises: add, remove, reorder and add sets, then persist

```mermaid
flowchart TD
    D[("Complete routine")]
    A1["Edit, Add exercise, then delete exercise 3"]
    C1{{"Card gone, nothing to save"}}
    A2["Move exercise 2 up"]
    C2{{"Exercise 1 is Push row"}}
    A3["Add set 2 to exercise 1, rep type AMRAP, save"]
    C3{{"Toast Changes saved"}}
    A4["Reload, Edit"]
    C4{{"Order Push row, Push press; set 2 still AMRAP"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

### routine editor › days: rename, reorder and delete before the routine starts

```mermaid
flowchart TD
    D[("Complete routine: Push, Pull, Legs")]
    A1["Edit, Day 2, Day options, Rename day to Back"]
    C1{{"Tab Day 2 Back"}}
    A2["Reorder days: Save disabled, move Legs up twice"]
    C2{{"Was day 3 shown"}}
    A3["Save"]
    C3{{"Toast Day order saved, Day 1 is Legs"}}
    A4["Day 2 Push, Delete day"]
    C4{{"Confirm says Delete Push and its exercises?"}}
    A5["Delete"]
    C5{{"Two tabs left"}}
    A6["Reload"]
    C6{{"4 weeks · 2 days per week: Legs, Back"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4 --> A5 --> C5 --> A6 --> C6
```

### routine editor › once started, days can no longer be added, moved or deleted

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Open it, Edit"]
    C1{{"No Add day, no Reorder days"}}
    A2["Day options"]
    C2{{"Rename day offered, Delete day not"}}
    D --> A1 --> C1 --> A2 --> C2
```

### routine editor › day tabs switch with buttons and arrow keys

```mermaid
flowchart TD
    D[("Complete routine: Push, Pull")]
    A1["Open it"]
    C1{{"Day 1 selected, Previous day disabled"}}
    A2["Next day"]
    C2{{"Day 2 selected, Pull press shown"}}
    A3["Arrow Left on the tab"]
    C3{{"Day 1 selected and focused"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

## `routines/editor-variants.spec.ts`

### editor: what a set can be › techniques: a preset, a custom name, and removing it

```mermaid
flowchart TD
    D[("Complete routine")]
    A1["Edit; set 1 technique: Top set"]
    C1{{"Set 1 reads Top set"}}
    A2["Set 2 technique: Custom"]
    C2{{"Confirm disabled while empty"}}
    A3["Type Cluster, confirm, save, Done"]
    C3{{"Preview shows Top set and Cluster"}}
    A4["Edit, remove set 1 technique, save, reload"]
    C4{{"Top set gone, Cluster kept"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

### editor: what a set can be › drop sets and rest-pause sets hang off a working set

```mermaid
flowchart TD
    D[("Complete routine")]
    A1["Edit; exercise 1 set 1: Add drop set, 20 percent, reps 8 to 10"]
    C1{{"Set menu now offers only drops"}}
    A2["Exercise 2 set 1: Add rest-pause set, reps 3 to 5, pause 15"]
    A3["Save, Done"]
    C2{{"Toast saved; preview shows Drop set −20% and Rest-pause set 15 s"}}
    A4["Edit, remove DS1, save, reload"]
    C3{{"Drop set gone, rest-pause kept"}}
    D --> A1 --> C1 --> A2 --> A3 --> C2 --> A4 --> C3
```

### editor: what a set can be › a rest-pause set without its pause is a hole in the plan

```mermaid
flowchart TD
    D[("Complete routine")]
    A1["Edit; Add rest-pause set to exercise 2, reps only, save"]
    C1{{"1 thing left to finish: Push row, set RP1 — the pause is missing"}}
    A2["Done"]
    C2{{"Incomplete, no Set active"}}
    D --> A1 --> C1 --> A2 --> C2
```

### editor: what a set can be › a timed set is written and trained in seconds

```mermaid
flowchart TD
    D[("Complete routine Planks")]
    A1["Edit; exercise 2 set 1 rep type Time, 90 seconds"]
    C1{{"Hint 1:30 min"}}
    A2["Save, Done"]
    C2{{"Preview shows 1:30 min"}}
    A3["Set active, home, Start"]
    C3{{"Push row asks for Seconds, not Reps"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### editor: what a set can be › a preview-only exercise is shown but never logged

```mermaid
flowchart TD
    D[("Complete routine")]
    A1["Edit; tick Preview only on exercise 2, save, Done"]
    C1{{"Preview only mark on the card"}}
    A2["Set active, home, Start"]
    C2{{"0/2 sets: the row does not count"}}
    C3{{"Push row shown, with no fields to log"}}
    D --> A1 --> C1 --> A2 --> C2 --> C3
```

### editor: what a set can be › a day of nothing but previews cannot be trained

```mermaid
flowchart TD
    D[("Complete routine")]
    A1["Edit; tick Preview only on both exercises, save"]
    C1{{"Problem: This day needs at least one exercise that is not preview only"}}
    D --> A1 --> C1
```

### editor: what a set can be › a removed exercise with history is offered back, history and all

```mermaid
flowchart TD
    D[("Complete routine, active")]
    A1["Home: log Push press set 1, 80 kg × 8, finish"]
    A2["Edit routine, delete Push press, save"]
    C1{{"Toast Changes saved"}}
    A3["Add exercise, focus its name"]
    C2{{"List Removed exercises of this day offers Push press"}}
    A4["Pick it, fill reps, save"]
    A5["History, Next exercise"]
    C3{{"Push press still shows 80 kg, 8 reps"}}
    D --> A1 --> A2 --> C1 --> A3 --> C2 --> A4 --> A5 --> C3
```

## `routines/options.spec.ts`

### routine options › rename: the save waits for a change, and the name persists

```mermaid
flowchart TD
    D[("Complete routine Old name")]
    A1["Options, Rename routine"]
    C1{{"Field says Old name, Save disabled"}}
    A2["Spaces only"]
    C2{{"Save disabled"}}
    A3["New name, Save"]
    C3{{"Toast Name changed, heading New name"}}
    A4["Open /routines"]
    C4{{"Card New name listed"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

### routine options › duration: refuses weeks out of range and saves a valid one

```mermaid
flowchart TD
    D[("Complete routine, 4 weeks")]
    A1["Options, Change duration"]
    C1{{"Field says 4"}}
    A2["0, 53 and 4"]
    C2{{"Save disabled for each"}}
    A3["12, Save"]
    C3{{"Toast Duration changed, 12 weeks · 2 days per week"}}
    A4["Reload"]
    C4{{"Still 12 weeks"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

### routine options › an open-ended routine has no duration to change

```mermaid
flowchart TD
    D[("Complete open-ended routine")]
    A1["Open Options"]
    C1{{"Rename routine offered, Change duration not"}}
    D --> A1 --> C1
```

### routine options › visibility: public shows the share button, private hides it

```mermaid
flowchart TD
    D[("Complete private routine")]
    C1{{"No Share button"}}
    A1["Options, Make public"]
    C2{{"Toast now public, Share button shown"}}
    A2["Options, Make private"]
    C3{{"Toast now private, Share button gone"}}
    D --> C1 --> A1 --> C2 --> A2 --> C3
```

### routine options › share copies the routine link

Chromium only (clipboard permissions).

```mermaid
flowchart TD
    D[("Complete public routine")]
    A1["Grant clipboard access, click Share"]
    C1{{"Button says Link copied"}}
    C2{{"Clipboard holds the page URL"}}
    D --> A1 --> C1 --> C2
```

### routine options › duplicate asks, then opens a fresh private copy

```mermaid
flowchart TD
    D[("Complete routine Original, active")]
    A1["Options, Duplicate routine"]
    C1{{"Dialog: the copy starts from scratch"}}
    A2["Confirm"]
    C2{{"Toast Copy of Original created, new URL"}}
    C3{{"Heading Original copy, Set active shown, two days"}}
    D --> A1 --> C1 --> A2 --> C2 --> C3
```

### routine options › delete asks, can be cancelled, and removes the routine

```mermaid
flowchart TD
    D[("Complete routine Doomed")]
    A1["Options, Delete routine, Cancel"]
    C1{{"Still on Doomed"}}
    A2["Options, Delete routine, Delete"]
    C2{{"On /routines: You have no routines yet."}}
    A3["Open the old URL"]
    C3{{"Not found"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### routine options › set active and deactivate

```mermaid
flowchart TD
    D[("Complete routine Toggle")]
    A1["Set active"]
    C1{{"Toast now your active routine"}}
    A2["Deactivate"]
    C2{{"Toast no longer active, Set active back"}}
    A3["Open /"]
    C3{{"Nothing in progress"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### routine options › only one routine is active at a time

```mermaid
flowchart TD
    D[("First active, Second not")]
    A1["Second: Set active"]
    C1{{"Toast Second is now your active routine"}}
    A2["Open First"]
    C2{{"First offers Set active again"}}
    D --> A1 --> C1 --> A2 --> C2
```

### routine options › export downloads the plan as an .xlsx

```mermaid
flowchart TD
    D[("Complete routine Spreadsheet")]
    A1["Options, Export to Excel"]
    C1{{"Download from /routines/id/export"}}
    A2["GET the same route"]
    C2{{"Spreadsheet content type, filename Spreadsheet.xlsx, zip bytes PK"}}
    D --> A1 --> C1 --> A2 --> C2
```

### routine options › an incomplete routine offers no export or send, and the route refuses it

```mermaid
flowchart TD
    D[("Routine with an empty exercise")]
    A1["Open Options"]
    C1{{"No Export to Excel, no Send routine"}}
    A2["GET /routines/id/export"]
    C2{{"Status 409"}}
    D --> A1 --> C1 --> A2 --> C2
```

### routine options › a finished routine is read-only

```mermaid
flowchart TD
    D[("Complete routine, all 8 days walked")]
    A1["Open it"]
    C1{{"Finished badge"}}
    A2["Open Options"]
    C2{{"No Edit, Rename or Change duration; Duplicate offered"}}
    D --> A1 --> C1 --> A2 --> C2
```

## `routines/list.spec.ts`

### routine lists › the index previews five and links to the full list

```mermaid
flowchart TD
    D[("Six routines")]
    A1["Open /routines"]
    C1{{"Five cards"}}
    A2["View more"]
    C2{{"On /routines/all, My routines, six cards"}}
    D --> A1 --> C1 --> A2 --> C2
```

### routine lists › search narrows by name, and says so when nothing matches

```mermaid
flowchart TD
    D[("Leg day, Upper body")]
    A1["/routines/all, search leg"]
    C1{{"URL has q=leg, only Leg day"}}
    A2["Search zzz"]
    C2{{"Nothing matches your search."}}
    A3["Clear the search"]
    C3{{"Both listed"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### routine lists › the status filter counts and filters

```mermaid
flowchart TD
    D[("One active, one ready, one draft")]
    A1["Open /routines/all"]
    C1{{"All 3 checked, Active 1, Finished 0"}}
    A2["Pick Incomplete"]
    C2{{"status=incomplete, only the draft"}}
    A3["Pick Active"]
    C3{{"status=active, only the active one"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### routine lists › pagination walks ten at a time and keeps the search

```mermaid
flowchart TD
    D[("Twelve routines Block 1 to 12")]
    A1["Open /routines/all?q=Block"]
    C1{{"Page 1 of 2, ten cards"}}
    A2["Next"]
    C2{{"page=2 and q=Block in the URL, two cards, no Next"}}
    A3["Previous"]
    C3{{"Page 1 of 2"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### routine lists › a card opens its routine and shows its progress

```mermaid
flowchart TD
    D[("Complete routine Halfway, active, 3 days walked")]
    A1["Open /routines"]
    C1{{"Card shows 3/8 days and Active"}}
    A2["Click the card"]
    C2{{"On /routines/id"}}
    D --> A1 --> C1 --> A2 --> C2
```

### routine lists › tabs move between my routines and the ones shared with me

```mermaid
flowchart TD
    U(["Signed-in user on /routines"])
    A1["Click Shared with me"]
    C1{{"On /routines/shared: Nothing shared yet"}}
    U --> A1 --> C1
```
