import { getT } from '@/i18n/server';
import { prisma } from './db';
import { isRoutineLocked } from './progress';
import { canEditPlan, canManage, toRole, type Grant } from './roles';

/**
 * The single place permissions are checked: every server action goes through it.
 * A routine is its creator's, and by default that is the only answer — every
 * caller that says nothing keeps asking exactly what it used to. Handing it a
 * wider rule from `roles.ts` is what lets a coach in.
 *
 * The rule is a predicate rather than a list of roles so that it is the same
 * one the screens hide with: two spellings of "owner or coach" would be two
 * things to keep in step. Sharing a routine public still grants reading and
 * nothing more, which is why nothing here knows about `isPublic`; the pages
 * that only read do that check themselves.
 */
export async function requireRoutine(
    routineId: string,
    userId: string,
    allow: (role: Grant) => boolean = canManage
) {
    const t = await getT();
    const routine = await prisma.routine.findUnique({
        where: { id: routineId },
    });
    if (!routine) throw new Error(t('error.routineNotFound'));

    // Being the creator is a role nobody was granted, so it is never looked up.
    // Anyone else holds whatever row they were given, or none at all.
    const role: Grant =
        routine.creatorId === userId
            ? 'owner'
            : toRole(
                  (
                      await prisma.routineMember.findUnique({
                          where: { routineId_userId: { routineId, userId } },
                          select: { role: true },
                      })
                  )?.role
              );

    if (!allow(role)) throw new Error(t('error.noAccess'));
    return routine;
}

/**
 * The plan of a routine that is already being trained — or was, or is over — is
 * history: those sessions were logged against these very exercises. Editing
 * stops the moment it goes live. Deleting it whole is still allowed.
 *
 * A coach edits under the very same conditions the owner does: the gate below
 * is the routine's state, and it does not care who is asking.
 */
export async function requireEditableRoutine(
    routineId: string,
    userId: string
) {
    const routine = await requireRoutine(routineId, userId, canEditPlan);
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
