/** What still stands between a routine and being trainable. Pure: no Prisma. */

import type { Translate } from '@/i18n/config';
import { isSetComplete, type RepSpec } from './reps';

export type RoutinePlan = {
    workouts: {
        name: string;
        exercises: { name: string; sets: RepSpec[] }[];
    }[];
};

/** Human-readable list of holes; empty means the routine can be activated. */
export function routineProblems(routine: RoutinePlan, t: Translate): string[] {
    const problems: string[] = [];
    if (routine.workouts.length === 0) problems.push(t('validate.noWorkouts'));

    for (const workout of routine.workouts) {
        if (workout.exercises.length === 0) {
            problems.push(t('validate.emptyDay', { day: workout.name }));
        }
        workout.exercises.forEach((exercise, index) => {
            const name = exercise.name.trim();
            const where = `${workout.name} · ${
                name || t('validate.exerciseN', { n: index + 1 })
            }`;
            if (!name) problems.push(t('validate.noName', { where }));
            if (
                exercise.sets.length === 0 ||
                !exercise.sets.every(isSetComplete)
            ) {
                problems.push(t('validate.badSets', { where }));
            }
        });
    }
    return problems;
}
