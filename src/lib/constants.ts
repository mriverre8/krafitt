// Validation limits shared by the forms (as HTML min/max/maxLength) and by the
// server actions, which are the ones that actually enforce them.

/** Longest name we store for a routine, a day or an exercise. */
export const NAME_MAX = 60;

export const WEEKS = { min: 1, max: 52 };
export const EXERCISES = { max: 30 };
export const SETS = { min: 1, max: 20 };
export const REPS = { min: 1, max: 1000 };
export const WEIGHT = { min: 0, max: 1000, step: 0.5 };
