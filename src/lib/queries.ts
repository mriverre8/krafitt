import { prisma } from './db';
import { positionFromCursor, type Logs, type PreviousLogs } from './progress';
import { dayKey } from './training-year';

function toLogs(
    logs: {
        exerciseId: string;
        setIndex: number;
        weight: number;
        reps: number;
    }[]
): Logs {
    const out: Logs = {};
    for (const l of logs)
        (out[l.exerciseId] ??= {})[l.setIndex] = {
            weight: l.weight,
            reps: l.reps,
        };
    return out;
}

/**
 * The last value every set was given, week by week. Sessions come in oldest
 * first so the newest week wins, and unfinished ones count too: a day skipped
 * half-done still leaves its numbers behind for the sets that were logged, and
 * the sets that were not keep whatever the week before them left.
 */
function toPrevious(
    sessions: {
        week: number;
        logs: {
            exerciseId: string;
            setIndex: number;
            weight: number;
            reps: number;
        }[];
    }[]
): PreviousLogs {
    const out: PreviousLogs = {};
    for (const session of sessions)
        for (const l of session.logs)
            (out[l.exerciseId] ??= {})[l.setIndex] = {
                weight: l.weight,
                reps: l.reps,
                week: session.week,
            };
    return out;
}

/** Today's workout from the user's active routine. */
export async function todayWorkout(userId: string) {
    const routine = await prisma.routine.findFirst({
        where: { creatorId: userId, isActive: true },
        include: {
            workouts: {
                orderBy: { order: 'asc' },
                include: {
                    exercises: {
                        orderBy: { order: 'asc' },
                        include: { sets: { orderBy: { order: 'asc' } } },
                    },
                },
            },
        },
    });
    if (!routine) return null;

    const position = positionFromCursor(
        routine.cursor,
        routine.workouts.length,
        routine.durationWeeks
    );
    if (!position) return { routine, finished: true as const };

    const workout = routine.workouts[position.workoutIndex];
    const week = position.week;

    const [session, previousSessions] = await Promise.all([
        prisma.workoutSession.findUnique({
            where: {
                userId_workoutId_week: { userId, workoutId: workout.id, week },
            },
            include: { logs: true },
        }),
        prisma.workoutSession.findMany({
            where: { userId, workoutId: workout.id, week: { lt: week } },
            orderBy: { week: 'asc' },
            include: { logs: true },
        }),
    ]);

    // The day the user finished stays on screen until the next fetch: this is
    // where it is left behind, not in `logSet`. Guarded on the cursor we read, so
    // a concurrent skip cannot make it jump two days.
    if (session?.completedAt) {
        await prisma.routine.updateMany({
            where: { id: routine.id, cursor: routine.cursor },
            data: { cursor: { increment: 1 } },
        });
        return todayWorkout(userId);
    }

    return {
        routine,
        finished: false as const,
        workout,
        week,
        logs: toLogs(session?.logs ?? []),
        previous: toPrevious(previousSessions),
    };
}

/** Name, picture and join date of any user: what a profile header shows. */
export function profileUser(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, image: true, createdAt: true },
    });
}

/**
 * The list also carries the plan itself, so each card knows if it can go active.
 *
 * `page` cuts it down at the database rather than in the screen, because every
 * row drags its whole plan — days, exercises, sets — along with it. Left out,
 * the query is the whole list: the profile needs all of them to count what the
 * user has done.
 */
export async function routinesOf(
    userId: string,
    page?: { skip: number; take: number }
) {
    return prisma.routine.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        ...page,
        include: {
            _count: { select: { workouts: true } },
            workouts: {
                orderBy: { order: 'asc' },
                select: {
                    name: true,
                    exercises: {
                        select: {
                            name: true,
                            sets: {
                                select: {
                                    repMode: true,
                                    repMin: true,
                                    repMax: true,
                                    kind: true,
                                    value: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}

export function countRoutines(userId: string) {
    return prisma.routine.count({ where: { creatorId: userId } });
}

/**
 * Every day the user logged something since `from`, as ISO date → sets logged.
 * Sessions across every routine, active or not: the graph is about the person,
 * not about one plan. A session that was opened and never logged into is not a
 * day trained, so it is left out.
 *
 * ponytail: days are keyed in UTC, which is the server's day, not necessarily
 * the user's. Send the client's offset in if a late-night set ever lands on the
 * wrong square.
 */
export async function trainingDays(userId: string, from: Date) {
    const sessions = await prisma.workoutSession.findMany({
        where: { userId, startedAt: { gte: from } },
        select: { startedAt: true, _count: { select: { logs: true } } },
    });

    const days: Record<string, number> = {};
    for (const session of sessions) {
        if (session._count.logs === 0) continue;
        const key = dayKey(session.startedAt);
        days[key] = (days[key] ?? 0) + session._count.logs;
    }
    return days;
}

/**
 * Everything the user has logged in one routine, by day and then by week.
 *
 * The plan comes along with it: a week nobody trained leaves no session behind,
 * and the history page still has to draw that week's blanks — which sets they
 * would have been is only knowable from the plan.
 */
export async function routineHistory(routineId: string, userId: string) {
    const [routine, sessions] = await Promise.all([
        prisma.routine.findUnique({
            where: { id: routineId },
            include: {
                workouts: {
                    orderBy: { order: 'asc' },
                    include: {
                        exercises: {
                            orderBy: { order: 'asc' },
                            include: { sets: { orderBy: { order: 'asc' } } },
                        },
                    },
                },
            },
        }),
        prisma.workoutSession.findMany({
            where: { routineId, userId },
            include: { logs: true },
        }),
    ]);
    if (!routine) return null;

    const byDay: Record<string, Record<number, Logs>> = {};
    for (const session of sessions)
        (byDay[session.workoutId] ??= {})[session.week] = toLogs(session.logs);

    return { routine, byDay };
}

export async function routineDetail(routineId: string) {
    return prisma.routine.findUnique({
        where: { id: routineId },
        include: {
            creator: { select: { name: true, image: true } },
            _count: { select: { sessions: true } },
            workouts: {
                orderBy: { order: 'asc' },
                include: {
                    exercises: {
                        orderBy: { order: 'asc' },
                        include: { sets: { orderBy: { order: 'asc' } } },
                    },
                },
            },
        },
    });
}
