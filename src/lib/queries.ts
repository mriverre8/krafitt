import { prisma } from "./db";
import { positionFromCursor, type Logs } from "./progress";

function toLogs(logs: { exerciseId: string; setIndex: number; weight: number; reps: number }[]): Logs {
  const out: Logs = {};
  for (const l of logs) (out[l.exerciseId] ??= {})[l.setIndex] = { weight: l.weight, reps: l.reps };
  return out;
}

/** Today's workout from the user's active routine. */
export async function todayWorkout(userId: string) {
  const membership = await prisma.routineMember.findFirst({
    where: { userId, isActive: true },
    include: {
      routine: {
        include: {
          workouts: {
            orderBy: { order: "asc" },
            include: { exercises: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });
  if (!membership) return null;

  const { routine } = membership;
  const position = positionFromCursor(membership.cursor, routine.workouts.length, routine.durationWeeks);
  if (!position) return { routine, finished: true as const };

  const workout = routine.workouts[position.workoutIndex];
  const week = position.week;

  const [session, previousSession] = await Promise.all([
    prisma.workoutSession.findUnique({
      where: { userId_workoutId_week: { userId, workoutId: workout.id, week } },
      include: { logs: true },
    }),
    prisma.workoutSession.findFirst({
      where: { userId, workoutId: workout.id, week: { lt: week }, completedAt: { not: null } },
      orderBy: { week: "desc" },
      include: { logs: true },
    }),
  ]);

  return {
    routine,
    finished: false as const,
    workout,
    week,
    sessionId: session?.id ?? null,
    logs: toLogs(session?.logs ?? []),
    previous: toLogs(previousSession?.logs ?? []),
    previousWeek: previousSession?.week ?? null,
  };
}

export async function myRoutines(userId: string) {
  return prisma.routineMember.findMany({
    where: { userId },
    orderBy: { routine: { createdAt: "desc" } },
    include: { routine: { include: { _count: { select: { workouts: true, members: true } } } } },
  });
}

export async function routineDetail(routineId: string) {
  return prisma.routine.findUnique({
    where: { id: routineId },
    include: {
      workouts: { orderBy: { order: "asc" }, include: { exercises: { orderBy: { order: "asc" } } } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
}
