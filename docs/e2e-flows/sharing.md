# Sharing flows

[← All flows](README.md)

Where two people take part, each one is a box of their own: they are separate browser sessions, signed in as separate accounts.

## `sharing/members.spec.ts`

### routine members › invite by email, accept, then read the plan and its history

```mermaid
flowchart TD
    D[("Owner's complete routine Team plan, active; account Bea Member")]
    subgraph O["Owner"]
        A1["Options, People"]
        C1{{"Nobody else is in"}}
        A2["Search Bea's email in capitals"]
        C2{{"Person found"}}
        A3["Add"]
        C3{{"Toast Request sent, row marked Pending"}}
        A4["Search her email again"]
        C4{{"Notice: already has an invitation waiting"}}
    end
    subgraph F["Bea"]
        A5["/routines, Requests (1)"]
        C5{{"Wants to add you to Team plan"}}
        A6["Accept"]
        C6{{"Toast You are now a member, Nothing waiting"}}
        A7["Shared with me, open Team plan"]
        C7{{"Routine by owner, History link"}}
        C8{{"Menu: Leave and Save; no Delete, Rename or Make public"}}
    end
    A8["Owner reloads People"]
    C9{{"Bea no longer Pending"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4 --> A5
    A5 --> C5 --> A6 --> C6 --> A7 --> C7 --> C8 --> A8 --> C9
```

### routine members › search errors: unknown email, and your own

```mermaid
flowchart TD
    D[("Owner's complete routine Solo")]
    A1["People page, search an unknown email"]
    C1{{"Alert: No account uses that email"}}
    A2["Search your own email"]
    C2{{"Alert: This routine is already yours"}}
    D --> A1 --> C1 --> A2 --> C2
```

### routine members › the owner takes a member out, who then loses access

```mermaid
flowchart TD
    D[("Owner's routine Closed circle, member Cai")]
    subgraph O["Owner"]
        A1["People, Remove Cai Former"]
        C1{{"Dialog: Remove Cai Former from this routine?"}}
        A2["Delete"]
        C2{{"Nobody else is in"}}
    end
    subgraph M["Cai"]
        A3["Open the routine"]
        C3{{"Not found"}}
    end
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### routine members › a member can leave on their own

```mermaid
flowchart TD
    D[("Owner's routine Door open, member Dee")]
    subgraph M["Dee"]
        A1["Open it, Options, Leave routine"]
        C1{{"Dialog: You will lose access to it"}}
        A2["Confirm"]
        C2{{"On /routines/shared: Nothing shared yet"}}
    end
    subgraph O["Owner"]
        A3["People page"]
        C3{{"Nobody else is in"}}
    end
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### routine members › an invitation can be declined, or taken back by the owner

```mermaid
flowchart TD
    D[("Owner's routine; pending invitations to Eve and Fay")]
    subgraph E["Eve"]
        A1["Requests, Decline"]
        C1{{"Nothing waiting"}}
    end
    subgraph O["Owner"]
        C2{{"People page: no Eve"}}
        A2["Remove Fay Waits"]
        C3{{"Dialog: Cancel the invitation to Fay Waits?"}}
        A3["Delete"]
        C4{{"Nobody else is in"}}
    end
    subgraph Y["Fay"]
        A4["Requests"]
        C5{{"Nothing waiting"}}
    end
    D --> A1 --> C1 --> C2 --> A2 --> C3 --> A3 --> C4 --> A4 --> C5
```

### routine members › the people page is the owner's alone

```mermaid
flowchart TD
    D[("Owner's routine with a member")]
    A1["Member opens /routines/id/people"]
    C1{{"Not found"}}
    D --> A1 --> C1
```

## `sharing/send.spec.ts`

### sending a routine › send with membership, accept, and both sides see it

```mermaid
flowchart TD
    D[("Owner's complete routine Gift plan; account Gus")]
    subgraph O["Owner"]
        A1["Options, Send routine"]
        C1{{"Send disabled"}}
        A2["Gus's email, Search"]
        C2{{"Gus Receiver found"}}
        A3["Tick Add me as a member, Send routine"]
        C3{{"Toast Routine sent to Gus Receiver"}}
    end
    subgraph G["Gus"]
        A4["Requests"]
        C4{{"Wants to send you Gift plan and join it as a member"}}
        A5["Accept"]
        C5{{"Toast Gift plan is now in your routines"}}
        A6["Open it from /routines"]
        C6{{"His own copy: Set active, different id"}}
    end
    A7["Owner opens Shared with me"]
    C7{{"Gus's block lists Gift plan"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4
    A4 --> C4 --> A5 --> C5 --> A6 --> C6 --> A7 --> C7
```

### sending a routine › unknown email and sending to yourself are refused

```mermaid
flowchart TD
    D[("Owner's complete routine")]
    A1["Send routine, unknown email, Search"]
    C1{{"Alert: No account uses that email"}}
    A2["Own email, Search"]
    C2{{"Alert: You can't send the routine to yourself"}}
    C3{{"Send stays disabled"}}
    D --> A1 --> C1 --> A2 --> C2 --> C3
```

### sending a routine › a declined routine never arrives

```mermaid
flowchart TD
    D[("Pending send request of Unwanted to a friend")]
    A1["Friend opens Requests"]
    C1{{"Wants to send you Unwanted"}}
    A2["Decline"]
    C2{{"Nothing waiting"}}
    A3["Friend opens /routines"]
    C3{{"You have no routines yet."}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### sending a routine › a workout is sent to the workouts inbox

```mermaid
flowchart TD
    D[("Owner's complete workout Gift workout; account Hal")]
    subgraph O["Owner"]
        A1["Options, Send workout"]
        C1{{"No membership checkbox"}}
        A2["Hal's email, Search, Send workout"]
        C2{{"Toast Workout sent to Hal Lifter"}}
    end
    subgraph H["Hal"]
        A3["/workouts, Requests (1)"]
        C3{{"On /workouts/requests: the workout Gift workout"}}
        A4["Accept"]
        C4{{"Toast now in your workouts, listed on /workouts"}}
    end
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

## `sharing/public.spec.ts`

### public and private plans › a private routine does not exist for anyone else

```mermaid
flowchart TD
    D[("Owner's private routine")]
    U(["Stranger signed in"])
    A1["Open the routine"]
    C1{{"Not found"}}
    A2["Open its history"]
    C2{{"Not found"}}
    A3["GET its export"]
    C3{{"404"}}
    D --> U --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### public and private plans › a public routine can be read, exported and saved as a copy

```mermaid
flowchart TD
    D[("Owner's public routine Open plan")]
    U(["Visitor signed in"])
    A1["Open it"]
    C1{{"Routine by owner, two day tabs"}}
    A2["Open Options"]
    C2{{"No Edit, Delete or People; Export offered; no History link"}}
    A3["GET the export"]
    C3{{"200, spreadsheet"}}
    A4["Save routine, confirm"]
    C4{{"Toast saved to your routines; own copy with Set active"}}
    D --> U --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

### public and private plans › the creator link leads to their profile

```mermaid
flowchart TD
    D[("Owner's public routine")]
    U(["Visitor signed in"])
    A1["Click Routine by owner"]
    C1{{"On /profile/owner-id, heading owner's name"}}
    D --> U --> A1 --> C1
```

### public and private plans › a public workout can be saved; a private one is hidden

```mermaid
flowchart TD
    D[("Owner's public Open workout and private Closed workout")]
    U(["Visitor signed in"])
    A1["Open the private one"]
    C1{{"Not found"}}
    A2["Open the public one"]
    C2{{"Workout by owner, 2 exercises"}}
    A3["Save workout, confirm"]
    C3{{"Toast saved to your workouts, Start workout offered"}}
    D --> U --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

## `sharing/shared-list.spec.ts`

### shared with me › grouped by owner, three each, with a page of their own for the rest

```mermaid
flowchart TD
    D[("Kim Coach's four routines, user is a member of each")]
    A1["Open /routines/shared"]
    C1{{"Kim's block shows three"}}
    A2["View more"]
    C2{{"On /routines/shared/kim-id, all four"}}
    A3["Search peak"]
    C3{{"Only Coach Peak"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### shared with me › the full list searches by person or email

```mermaid
flowchart TD
    D[("Lena's and Omar's routines shared with the user")]
    A1["/routines/shared/all, search by Person"]
    C1{{"Placeholder Person's name"}}
    A2["Search lena"]
    C2{{"Only Lena plan"}}
    A3["Search by Email: Omar's address"]
    C3{{"Only Omar plan"}}
    A4["Search nobody at all"]
    C4{{"Nothing matches your search."}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4
```

### shared with me › an owner who shares nothing with me has no page

```mermaid
flowchart TD
    D[("Another account sharing nothing")]
    A1["Open /routines/shared/their-id"]
    C1{{"Not found, still signed in"}}
    D --> A1 --> C1
```
