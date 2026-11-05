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
 * A routine's day always shows at least one exercise, the same way an
 * exercise always shows at least one set. A workout opens with none instead
 * (`blank` off): it says it is empty, and is filled in from the add button.
 * Key order matters: the drafts are compared and submitted as JSON.
 */
export function toDrafts(
    exercises: SavedExercise[],
    blank = true
): ExerciseDraft[] {
    if (exercises.length === 0) return blank ? [emptyExercise] : [];
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

/**
 * The day with one exercise taken out and put back in at `to`. The order the
 * cards end up in is the order saved: `saveExercises` numbers them as it goes.
 * A move off either end of the day changes nothing. Generic so the editor
 * can move its cards, each a draft with its key.
 */
export function moveExercise<T>(cards: T[], from: number, to: number): T[] {
    if (to < 0 || to >= cards.length || to === from) return cards;
    const next = [...cards];
    next.splice(to, 0, ...next.splice(from, 1));
    return next;
}
