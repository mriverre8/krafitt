/**
 * The editor's own shape for a day. A draft holds every field as the string the
 * form actually has in it, blanks and all, so a routine can be written a bit at
 * a time and saved half-finished — `validate.ts` is what decides whether it is
 * whole enough to activate.
 *
 * Pure, no Prisma, no React: the whole day is one form, the drafts are compared
 * as JSON to tell changed from not, and both of those want plain data.
 */

import type { SavedExercise } from './forms';
import { isRepMode, type RepMode } from './reps';
import { setKind, type SetKind } from './sets';

export type SetDraft = {
    kind: SetKind;
    mode: RepMode;
    repMin: string;
    repMax: string;
    /** Per cent for a drop, seconds for a rest-pause; blank for a working set. */
    value: string;
    /** Null until the set is given one. Blank is a technique that was added and
        has yet to be named, which is a hole in the routine rather than none. */
    technique: string | null;
};

/** `id` is null until the exercise has been saved for the first time. */
export type ExerciseDraft = {
    id: string | null;
    name: string;
    sets: SetDraft[];
};

export const emptySet: SetDraft = {
    kind: 'normal',
    mode: 'range',
    repMin: '',
    repMax: '',
    value: '',
    technique: null,
};

export const emptyExercise: ExerciseDraft = {
    id: null,
    name: '',
    sets: [emptySet],
};

/**
 * The day always shows at least one exercise, the same way an exercise always
 * shows at least one set. Key order matters: the drafts are compared and
 * submitted as JSON.
 */
export function toDrafts(exercises: SavedExercise[]): ExerciseDraft[] {
    if (exercises.length === 0) return [emptyExercise];
    return exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets.map((set) => ({
            kind: setKind(set),
            mode: isRepMode(set.repMode) ? set.repMode : 'range',
            repMin: set.repMin?.toString() ?? '',
            repMax: set.repMax?.toString() ?? '',
            value: set.value?.toString() ?? '',
            technique: set.technique,
        })),
    }));
}
