import { getT } from '@/i18n/server';
import { prisma } from './db';
import { isRoutineFinished } from './progress';

/**
 * The single place permissions are checked: every server action goes through it.
 * A routine belongs to whoever created it, so access is all or nothing.
 */
export async function requireRoutine(routineId: string, userId: string) {
    const t = await getT();
    const routine = await prisma.routine.findUnique({
        where: { id: routineId },
    });
    if (!routine) throw new Error(t('error.routineNotFound'));
    if (routine.creatorId !== userId) throw new Error(t('error.noAccess'));
    return routine;
}

/**
 * The plan of a finished routine is history: its sessions were logged against
 * these days, so it is read-only from the moment the last week is behind the
 * cursor. Deleting it whole is still allowed.
 */
export async function requireEditableRoutine(
    routineId: string,
    userId: string
) {
    const routine = await requireRoutine(routineId, userId);
    const workoutCount = await prisma.workout.count({ where: { routineId } });
    if (isRoutineFinished(routine.cursor, workoutCount, routine.durationWeeks))
        throw new Error((await getT())('error.routineFinished'));
    return routine;
}

export async function routineIdOfWorkout(workoutId: string) {
    const workout = await prisma.workout.findUnique({
        where: { id: workoutId },
        select: { routineId: true },
    });
    if (!workout) throw new Error((await getT())('error.workoutNotFound'));
    return workout.routineId;
}
