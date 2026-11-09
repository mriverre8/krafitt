# Profile and account flows

[← All flows](README.md)

## `profile/profile.spec.ts`

### profiles and follows › my profile: reached from the menu, empty to begin with

```mermaid
flowchart TD
    U(["New signed-in user on /"])
    A1["Menu, Profile"]
    C1{{"On /profile/own-id, heading own name, Member since"}}
    C2{{"0 followers, 0 following, Training year"}}
    C3{{"No active routine, No public routines yet., no Follow button"}}
    U --> A1 --> C1 --> C2 --> C3
```

### profiles and follows › a profile shows the active routine and the finished public ones

```mermaid
flowchart TD
    D[("Owner: active public Current block; finished public Shown off; unfinished public Not done yet; finished private Kept quiet")]
    U(["Visitor signed in"])
    A1["Open the owner's profile"]
    C1{{"Active routine: Current block"}}
    C2{{"Public: Shown off only"}}
    A2["Click Shown off"]
    C3{{"Heading Shown off"}}
    D --> U --> A1 --> C1 --> C2 --> A2 --> C3
```

### profiles and follows › follow and unfollow, with the counts and lists to match

```mermaid
flowchart TD
    D[("Account Ivy Star")]
    A1["Open Ivy's profile"]
    C1{{"0 followers"}}
    A2["Follow"]
    C2{{"Button now Following, 1 follower"}}
    A3["Click 1 follower"]
    C3{{"Followers tab current, lists the user"}}
    A4["0 following tab"]
    C4{{"Not following anyone yet."}}
    A5["Own Following tab, unfollow Ivy"]
    C5{{"Follow button back"}}
    A6["Ivy's profile"]
    C6{{"0 followers"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3 --> A4 --> C4 --> A5 --> C5 --> A6 --> C6
```

### profiles and follows › followers can be followed back from the list

```mermaid
flowchart TD
    D[("Jo Fan follows the user")]
    A1["Own followers list"]
    C1{{"Jo Fan listed"}}
    A2["Follow on Jo's row"]
    C2{{"Row says Following"}}
    A3["Own profile"]
    C3{{"1 following"}}
    D --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### profiles and follows › an empty followers tab says so

```mermaid
flowchart TD
    U(["New signed-in user"])
    A1["Open own followers"]
    C1{{"No followers yet."}}
    U --> A1 --> C1
```

### profiles: long lists and sharing › followers load fifty at a time

```mermaid
flowchart TD
    D[("55 followers")]
    A1["Open own followers"]
    C1{{"50 listed"}}
    A2["Load more"]
    C2{{"shown=100 in the URL, 55 listed, no Load more"}}
    D --> A1 --> C1 --> A2 --> C2
```

### profiles: long lists and sharing › share copies the profile link

Chromium only (clipboard permissions).

```mermaid
flowchart TD
    U(["Signed-in user on own profile"])
    A1["Grant clipboard access, Share"]
    C1{{"Button says Link copied"}}
    C2{{"Clipboard holds the profile URL"}}
    U --> A1 --> C1 --> C2
```

## `profile/account.spec.ts`

Every test opens Settings from the user menu first.

### account settings (signed in) › change the username

```mermaid
flowchart TD
    U(["Signed-in user, Settings open"])
    C1{{"Save disabled"}}
    A1["Username Renamed Athlete, Save"]
    C2{{"Save disabled again: saved"}}
    A2["Close, then reload"]
    C3{{"Menu shows Renamed Athlete both times"}}
    U --> C1 --> A1 --> C2 --> A2 --> C3
```

### account settings (signed in) › upload and remove a profile picture

```mermaid
flowchart TD
    U(["Signed-in user, Settings open"])
    A1["Upload a PNG"]
    C1{{"Remove picture offered"}}
    A2["Reload"]
    C2{{"Menu draws the picture as a data URL"}}
    A3["Settings, Remove picture"]
    C3{{"Remove picture gone"}}
    U --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### account settings (signed in) › a file that is not an image is refused with a message

```mermaid
flowchart TD
    U(["Signed-in user, Settings open"])
    A1["Upload text named notes.png"]
    C1{{"Alert: Could not read that image"}}
    C2{{"No Remove picture: nothing saved"}}
    U --> A1 --> C1 --> C2
```

### account settings (signed in) › delete the account: asks, then it is gone for good

```mermaid
flowchart TD
    U(["Signed-in user, Settings open"])
    A1["Delete"]
    C1{{"Dialog Delete account: This cannot be undone."}}
    A2["Confirm Delete account"]
    C2{{"Landing shown"}}
    A3["Sign in with the old credentials"]
    C3{{"Refused"}}
    U --> A1 --> C1 --> A2 --> C2 --> A3 --> C3
```

### account settings (signed in) › the language chosen here applies to the app pages

```mermaid
flowchart TD
    U(["Signed-in user, Settings open"])
    A1["Pick ca"]
    C1{{"Dialog is Configuració"}}
    A2["Open /routines"]
    C2{{"Heading Rutines, Encara no tens rutines."}}
    U --> A1 --> C1 --> A2 --> C2
```
