/** What still stands between a routine and being trainable. Pure: no Prisma. */

import type { Translate } from '@/i18n/config';
import { badRepFields, type RepSpec } from './reps';

export type ExercisePlan = { name: string; sets: RepSpec[] };

export type WorkoutPlan = { exercises: ExercisePlan[] };

export type RoutinePlan = { workouts: WorkoutPlan[] };

/** Every field of one exercise that is holding the day back, sets included. */
export type ExerciseFault = {
    name: boolean;
    sets: { min: boolean; max: boolean }[];
};

function exerciseFault(exercise: ExercisePlan): ExerciseFault {
    return {
        name: !exercise.name.trim(),
        sets: exercise.sets.map(badRepFields),
    };
}

/**
 * Human-readable list of holes in one day, worded for the day's own card: the
 * day is the context, so nothing here repeats its name.
 */
export function workoutProblems(workout: WorkoutPlan, t: Translate): string[] {
    if (workout.exercises.length === 0) return [t('validate.emptyDay')];

    return workout.exercises.flatMap((exercise, index) => {
        const fault = exerciseFault(exercise);
        const where =
            exercise.name.trim() || t('validate.exerciseN', { n: index + 1 });
        const problems: string[] = [];
        if (fault.name) problems.push(t('validate.noName', { where }));
        if (
            exercise.sets.length === 0 ||
            fault.sets.some((set) => set.min || set.max)
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
