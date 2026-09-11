// Validation limits shared by the forms (as HTML min/max/maxLength) and by the
// server actions, which are the ones that actually enforce them.

/** Longest name we store for a routine, a day or an exercise. */
export const NAME_MAX = 60;

export const WEEKS = { min: 1, max: 52 };
export const EXERCISES = { max: 30 };
export const SETS = { min: 1, max: 20 };
export const REPS = { min: 1, max: 1000 };
/** How much weight a drop set takes off the working set. */
export const DROP_PERCENT = { min: 1, max: 99 };
/** How long the pause of a rest-pause set lasts, in seconds. */
export const REST_SECONDS = { min: 1, max: 600 };
export const WEIGHT = { min: 0, max: 1000, step: 0.5 };
