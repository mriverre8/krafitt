/**
 * The blank shapes the exercise editor starts from, and the one function that
 * turns a saved day back into them.
 *
 * Pure: the editor holds the drafts, this only says what an empty one looks
 * like and how a stored day becomes one.
 */

import { isRepMode } from './reps';
import { setKind } from './sets';
import type { ExerciseDraft, ExerciseView, SetDraft } from './types';

export const emptySet: SetDraft = {
    kind: 'normal',
    mode: 'range',
    repMin: '',
    repMax: '',
    value: '',
    technique: '',
};

export const emptyExercise: ExerciseDraft = {
    id: null,
    name: '',
    sets: [emptySet],
};

/** Nothing wrong with this set — what a row falls back to while the eye is off
    or the exercise has never been saved. */
export const noFault = { min: false, max: false, value: false };

/**
 * The day always shows at least one exercise, the same way an exercise always
 * shows at least one set. Key order matters: the drafts are compared and
 * submitted as JSON.
 */
export function toDrafts(exercises: ExerciseView[]): ExerciseDraft[] {
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
