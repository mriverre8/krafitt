_Last updated: 12 September 2026_

Krafitt sets three cookies. All of them are first-party, all of them are
strictly necessary for something you asked the app to do, and none of them
track you. There is no analytics, no advertising and no third-party cookie on
this site — which is also why there is no consent banner: under the ePrivacy
rules, strictly necessary cookies do not need one.

## The cookies

### `better-auth.session_token`

**Purpose:** keeps you signed in. Without it, every page load would ask for
your password again.

**Contains:** a random session token. Not your email, not your password.

**Lifetime:** it expires with the session, and is removed when you sign out.

**Flags:** `HttpOnly` (JavaScript on the page cannot read it), `Secure` in
production, `SameSite=Lax`.

### `krafitt.theme`

**Purpose:** remembers whether you chose the dark or the light theme, so the
server can render the right one immediately instead of flashing the wrong one
at you.

**Contains:** the literal text `dark` or `light`.

**Lifetime:** one year.

**Flags:** `SameSite=Lax`. Readable by the page, because the theme switch
writes it.

### `krafitt.locale`

**Purpose:** remembers whether you chose English, Spanish or Catalan. Without
it the app falls back to your browser's `Accept-Language` header.

**Contains:** the literal text `en`, `es` or `ca`.

**Lifetime:** one year.

**Flags:** `SameSite=Lax`. Readable by the page, because the language switch
writes it.

## What Krafitt does not use

No Google Analytics or any other analytics cookie. No advertising or
retargeting cookie. No social media pixel. No cross-site identifier. No
fingerprinting. No cookie is shared with anyone, because no third party has
any code on this site.

## Turning them off

You can block or delete cookies in your browser settings at any time. Blocking
`krafitt.theme` and `krafitt.locale` costs you only the preference — the app
falls back to the dark theme and your browser's language. Blocking
`better-auth.session_token` makes signing in impossible, since there is
nothing left to remember you by.

## More

What the app stores in its database, rather than in your browser, is covered
by the [privacy policy](/legal/privacy). Questions go to
[krafitt@gmail.com](mailto:krafitt@gmail.com).
