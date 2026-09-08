import { getT } from '@/i18n/server';
import { prisma } from './db';

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

export async function routineIdOfWorkout(workoutId: string) {
    const workout = await prisma.workout.findUnique({
        where: { id: workoutId },
        select: { routineId: true },
    });
    if (!workout) throw new Error((await getT())('error.workoutNotFound'));
    return workout.routineId;
}
