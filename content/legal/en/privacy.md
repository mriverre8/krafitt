_Last updated: 12 September 2026_

Krafitt is a public-source personal project, maintained by one individual
developer ([@mriverre8](https://github.com/mriverre8)). This page says exactly
what the app stores about you, why it stores it, and how to get rid of it.

If anything here is unclear, write to
[krafitt@gmail.com](mailto:krafitt@gmail.com).

## What Krafitt stores

**Your account.** Your name, your email address, and your password — the
password only as a one-way hash, never in readable form. You give these when
you sign up, and they are the minimum needed to have an account at all.

**Your sessions.** When you sign in, Krafitt records a session token, when it
expires, and the IP address and browser user agent of the request that created
it. This is how the app knows the next request is still you.

**Your training.** Every routine you write and everything inside it: week
count, day names, exercise names, prescribed sets, rep ranges, techniques,
drop and rest-pause sets — plus the weight and reps you log for each set, and
when you logged them.

**Your preferences.** Theme and language. These live in cookies in your own
browser, not in the database. See the [cookie policy](/legal/cookies).

## What Krafitt does not store

No date of birth, no body weight, no height, no health or medical data, no
photos, no location, no phone number, no payment details. There is no
analytics, no advertising, no tracking pixel and no third-party script of any
kind on this site. Nothing you enter is sold, rented or shared for marketing.

## Why it is stored

Your account and session data exist to sign you in and keep you signed in.
Your training data exists because showing you what you lifted last week is the
entire point of the app. There is no secondary purpose.

Under the GDPR the legal basis is the performance of the contract between you
and Krafitt — you asked for an account so the app could hold your training
log, and it cannot do that without keeping it.

## Where it is stored

In a PostgreSQL database hosted on infrastructure inside the European Economic
Area. Traffic to and from the app is encrypted in transit (HTTPS).

## Who else sees it

Nobody. Your routines and logs are readable only by your own signed-in
account. There is no public profile, no sharing feature and no feed. The
hosting and database providers process the data on Krafitt's behalf and under
contract, and are not permitted to use it for anything else.

## How long it is kept

Account and training data are kept for as long as your account exists.
Sessions expire on their own and are removed. Deleting your account deletes
your routines, workouts, exercises, sets and logs with it — the database
cascades the deletion, so nothing is left behind.

## Your rights

You can ask for a copy of your data, ask for it to be corrected, or ask for
the account and everything in it to be deleted. You can also object to the
processing or ask for it to be restricted, and you can complain to your
national data protection authority.

To exercise any of these, email
[krafitt@gmail.com](mailto:krafitt@gmail.com). Requests are answered within 30
days.

## Children

Krafitt is not aimed at children under 16 and should not be used by them
without the consent of a parent or guardian.

## Changes to this policy

If this policy changes, the date at the top changes with it. Substantial
changes will be announced in the app before they take effect.
