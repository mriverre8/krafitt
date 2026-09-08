import { prisma } from './db';
import { positionFromCursor, type Logs } from './progress';

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

    const [session, previousSession] = await Promise.all([
        prisma.workoutSession.findUnique({
            where: {
                userId_workoutId_week: { userId, workoutId: workout.id, week },
            },
            include: { logs: true },
        }),
        prisma.workoutSession.findFirst({
            where: {
                userId,
                workoutId: workout.id,
                week: { lt: week },
                completedAt: { not: null },
            },
            orderBy: { week: 'desc' },
            include: { logs: true },
        }),
    ]);

    return {
        routine,
        finished: false as const,
        workout,
        week,
        logs: toLogs(session?.logs ?? []),
        previous: toLogs(previousSession?.logs ?? []),
        previousWeek: previousSession?.week ?? null,
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
