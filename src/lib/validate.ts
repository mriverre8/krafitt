/** What still stands between a routine and being trainable. Pure: no Prisma. */

import type { Translate } from '@/i18n/config';
import { badRepFields, type RepSpec } from './reps';
import { badSetValue, type KindedSet } from './sets';

export type PlannedSet = RepSpec & KindedSet;

export type ExercisePlan = { name: string; sets: PlannedSet[] };

export type WorkoutPlan = { exercises: ExercisePlan[] };

export type RoutinePlan = { workouts: WorkoutPlan[] };

/** Every field of one exercise that is holding the day back, sets included.
    `value` is the pause a rest-pause set has not been given. */
export type ExerciseFault = {
    name: boolean;
    sets: { min: boolean; max: boolean; value: boolean }[];
};

function exerciseFault(exercise: ExercisePlan): ExerciseFault {
    return {
        name: !exercise.name.trim(),
        sets: exercise.sets.map((set) => ({
            ...badRepFields(set),
            value: badSetValue(set),
        })),
    };
}

/** What a day with nothing saved yet is really holding: the editor opens one
    blank card on it, so that card is what the day is short of. Mirrors
    `emptyExercise` down to the single blank set, so the faults below line up
    with the row the editor actually draws. */
const blankExercise: ExercisePlan = {
    name: '',
    sets: [{ repMode: 'range', repMin: null, repMax: null }],
};

/** That blank card's own faults. The editor paints from `workoutFaults`, which
    files faults by exercise id, and this card has no id to be filed under: it is
    in no save. */
export const blankExerciseFault: ExerciseFault = exerciseFault(blankExercise);

/**
 * Human-readable list of holes in one day, worded for the day's own card: the
 * day is the context, so nothing here repeats its name.
 *
 * A day with no exercises is read as the one blank card the editor shows for it
 * — `toDrafts` never renders a day with nothing on it — so a freshly added day
 * complains about the fields on screen rather than about being empty.
 */
export function workoutProblems(workout: WorkoutPlan, t: Translate): string[] {
    const exercises =
        workout.exercises.length > 0 ? workout.exercises : [blankExercise];

    return exercises.flatMap((exercise, index) => {
        const fault = exerciseFault(exercise);
        const where =
            exercise.name.trim() || t('validate.exerciseN', { n: index + 1 });
        const problems: string[] = [];
        if (fault.name) problems.push(t('validate.noName', { where }));
        if (
            exercise.sets.length === 0 ||
            fault.sets.some((set) => set.min || set.max || set.value)
        ) {
            problems.push(t('validate.badSets', { where }));
        }
        return problems;
    });
}

/**
 * The very same faults the problems above are worded from, addressed by exercise
 * id: the editor paints these fields red, so what the eye reveals is exactly
 * what the list complains about — never a field the user has only just typed.
 */
export function workoutFaults(
    exercises: ({ id: string } & ExercisePlan)[]
): Record<string, ExerciseFault> {
    return Object.fromEntries(
        exercises.map((exercise) => [exercise.id, exerciseFault(exercise)])
    );
}

/**
 * Whether the routine can be activated. Takes `t` only because the problems it
 * counts carry text: one code path decides this and what each day displays.
 */
export function isRoutineComplete(routine: RoutinePlan, t: Translate): boolean {
    return (
        routine.workouts.length > 0 &&
        routine.workouts.every(
            (workout) => workoutProblems(workout, t).length === 0
        )
    );
}
