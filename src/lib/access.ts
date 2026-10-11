import { getT } from '@/i18n/server';
import { prisma } from './db';
import { isRoutineFinished, isRoutineLocked } from './progress';

/**
 * The single place permissions are checked: every server action goes through it.
 * A routine belongs to whoever created it, so writing is all or nothing —
 * sharing it public grants reading and nothing more, which is why nothing here
 * knows about `isPublic`. The pages that only read do that check themselves.
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
 * The exercises and sets of a routine stay editable while it is being
 * trained: what was logged is matched against the plan as it stands, never
 * rewritten (see `lib/history.ts`). Only a routine that is over is closed —
 * its plan is the record of what it was.
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

/**
 * Adding or deleting a day stops the moment the routine goes live: the cursor
 * counts days by position, so one more or one fewer would move it to another
 * week, and a deleted day takes its sessions with it.
 */
export async function requireUnstartedRoutine(
    routineId: string,
    userId: string
) {
    const routine = await requireRoutine(routineId, userId);
    const sessionCount = await prisma.workoutSession.count({
        where: { routineId },
    });
    if (isRoutineLocked({ ...routine, sessionCount }))
        throw new Error((await getT())('error.routineStarted'));
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
