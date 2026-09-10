import { prisma } from './db';
import { positionFromCursor, type Logs, type PreviousLogs } from './progress';

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

/** The list also carries the plan itself, so each card knows if it can go active. */
export async function myRoutines(userId: string) {
    return prisma.routine.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
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
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}

export async function routineDetail(routineId: string) {
    return prisma.routine.findUnique({
        where: { id: routineId },
        include: {
            // What tells a routine that was activated and left alone from one
            // whose first day is half logged: both sit on cursor 0.
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
