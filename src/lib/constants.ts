// Validation limits shared by the forms (as HTML min/max/maxLength) and by the
// server actions, which are the ones that actually enforce them.

/** Longest name we store for a routine, a day or an exercise. */
export const NAME_MAX = 60;

/** Longest name a user account can have, at signup and when changed later. */
export const USER_NAME_MAX = 30;

export const EMAIL_PATTERN = '[^\\s@]+@[^\\s@]+\\.[a-zA-Z]{2,}';

export const WEEKS = { min: 1, max: 52 };
export const EXERCISES = { max: 30 };
export const SETS = { min: 1, max: 20 };
/**
 * `digits` is how long a typed value may get. It is a separate number because
 * `maxLength` is ignored on `<input type="number">` — the forms cut the value
 * down as it is typed instead, so it has to be stated rather than read off the
 * attribute.
 */
export const REPS = { min: 1, max: 1000, digits: 3 };
/** How much weight a drop set takes off the working set. */
export const DROP_PERCENT = { min: 1, max: 99, digits: 2 };
/** How long the pause of a rest-pause set lasts, in seconds. */
export const REST_SECONDS = { min: 1, max: 60, digits: 2 };
export const WEIGHT = { min: 0, max: 1000, step: 0.5 };
