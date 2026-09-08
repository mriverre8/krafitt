'use server';

import { getT } from '@/i18n/server';
import {
    requireRoutine,
    routineIdOfExercise,
    routineIdOfWorkout,
} from '@/lib/access';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NAME_MAX, REPS, SETS, WEEKS, WEIGHT } from '@/lib/constants';
import type { FormState } from '@/lib/forms';
import { isSessionComplete, isSetEnabled, type Logs } from '@/lib/progress';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const str = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
const int = (data: FormData, key: string) =>
    Number.parseInt(String(data.get(key) ?? ''), 10);

// ---------- routines ----------

export async function createRoutine(
    _previous: FormState,
    data: FormData
): Promise<FormState> {
    const user = await requireUser();
    const t = await getT();
    const name = str(data, 'name');
    const durationWeeks = int(data, 'durationWeeks');

    if (!name) return { error: t('error.routineName') };
    if (name.length > NAME_MAX) return { error: t('error.nameTooLong') };
    if (
        !Number.isInteger(durationWeeks) ||
        durationWeeks < WEEKS.min ||
        durationWeeks > WEEKS.max
    ) {
        return { error: t('error.duration') };
    }

    const hasActive = await prisma.routine.findFirst({
        where: { creatorId: user.id, isActive: true },
    });
    const routine = await prisma.routine.create({
        data: { name, durationWeeks, creatorId: user.id, isActive: !hasActive },
    });

    revalidatePath('/routines');
    redirect(`/routines/${routine.id}`);
}

export async function setActiveRoutine(routineId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);
    await prisma.$transaction([
        prisma.routine.updateMany({
            where: { creatorId: user.id },
            data: { isActive: false },
        }),
        prisma.routine.update({
            where: { id: routineId },
            data: { isActive: true },
        }),
    ]);
    revalidatePath('/');
    revalidatePath('/routines');
}

export async function deleteRoutine(routineId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);
    await prisma.routine.delete({ where: { id: routineId } });
    revalidatePath('/');
    redirect('/routines');
}

// ---------- workouts and exercises ----------

export async function addWorkout(
    _previous: FormState,
    data: FormData
): Promise<FormState> {
    const user = await requireUser();
    const routineId = str(data, 'routineId');
    const name = str(data, 'name');
    const t = await getT();
    if (!name) return { error: t('error.workoutName') };
    if (name.length > NAME_MAX) return { error: t('error.nameTooLong') };
    await requireRoutine(routineId, user.id);

    const order = await prisma.workout.count({ where: { routineId } });
    await prisma.workout.create({ data: { routineId, name, order } });
    revalidatePath(`/routines/${routineId}`);
    return {};
}

export async function addExercise(
    _previous: FormState,
    data: FormData
): Promise<FormState> {
    const user = await requireUser();
    const t = await getT();
    const workoutId = str(data, 'workoutId');
    const name = str(data, 'name');
    const sets = int(data, 'sets');
    const repMin = int(data, 'repMin');
    const repMax = int(data, 'repMax');
    const technique = str(data, 'technique') || t('technique.linear');
    const rawWeight = str(data, 'targetWeight');
    const targetWeight = rawWeight === '' ? null : Number(rawWeight);

    if (!name) return { error: t('error.exerciseName') };
    if (name.length > NAME_MAX) return { error: t('error.nameTooLong') };
    if (!Number.isInteger(sets) || sets < SETS.min || sets > SETS.max)
        return { error: t('error.sets') };
    if (
        !Number.isInteger(repMin) ||
        !Number.isInteger(repMax) ||
        repMin < REPS.min ||
        repMax < repMin ||
        repMax > REPS.max
    ) {
        return { error: t('error.repRange') };
    }
    if (
        targetWeight !== null &&
        (!Number.isFinite(targetWeight) || targetWeight < 0)
    ) {
        return { error: t('error.targetWeight') };
    }

    const routineId = await routineIdOfWorkout(workoutId);
    await requireRoutine(routineId, user.id);

    const order = await prisma.exercise.count({ where: { workoutId } });
    await prisma.exercise.create({
        data: {
            workoutId,
            name,
            order,
            sets,
            repMin,
            repMax,
            technique,
            targetWeight,
        },
    });
    revalidatePath(`/routines/${routineId}`);
    return {};
}

export async function deleteWorkout(workoutId: string) {
    const user = await requireUser();
    const routineId = await routineIdOfWorkout(workoutId);
    await requireRoutine(routineId, user.id);
    await prisma.workout.delete({ where: { id: workoutId } });
    revalidatePath(`/routines/${routineId}`);
    revalidatePath('/');
}

export async function deleteExercise(exerciseId: string) {
    const user = await requireUser();
    const routineId = await routineIdOfExercise(exerciseId);
    await requireRoutine(routineId, user.id);
    await prisma.exercise.delete({ where: { id: exerciseId } });
    revalidatePath(`/routines/${routineId}`);
    revalidatePath('/');
}

// ---------- training ----------

export async function startWorkout(workoutId: string, week: number) {
    const user = await requireUser();
    const routineId = await routineIdOfWorkout(workoutId);
    await requireRoutine(routineId, user.id);
    await prisma.workoutSession.upsert({
        where: { userId_workoutId_week: { userId: user.id, workoutId, week } },
        create: { userId: user.id, routineId, workoutId, week },
        update: {},
    });
    revalidatePath('/');
}

export async function logSet(
    sessionId: string,
    exerciseId: string,
    setIndex: number,
    weight: number,
    reps: number
) {
    const user = await requireUser();
    const t = await getT();

    if (!Number.isFinite(weight) || weight < WEIGHT.min || weight > WEIGHT.max)
        throw new Error(t('error.weight'));
    if (!Number.isInteger(reps) || reps < REPS.min || reps > REPS.max)
        throw new Error(t('error.reps'));

    const session = await prisma.workoutSession.findUnique({
        where: { id: sessionId },
        include: {
            logs: true,
            workout: { include: { exercises: { orderBy: { order: 'asc' } } } },
        },
    });
    if (!session || session.userId !== user.id)
        throw new Error(t('error.sessionNotFound'));
    if (session.completedAt) throw new Error(t('error.alreadyFinished'));

    const exercise = session.workout.exercises.find(
        (item) => item.id === exerciseId
    );
    if (!exercise) throw new Error(t('error.wrongExercise'));
    if (
        !Number.isInteger(setIndex) ||
        setIndex < 0 ||
        setIndex >= exercise.sets
    ) {
        throw new Error(t('error.setOutOfRange'));
    }

    // Sequential order is enforced here, not only by disabling inputs on the client.
    const logs: Logs = {};
    for (const log of session.logs) {
        (logs[log.exerciseId] ??= {})[log.setIndex] = {
            weight: log.weight,
            reps: log.reps,
        };
    }
    if (!isSetEnabled(session.workout.exercises, logs, exerciseId, setIndex)) {
        throw new Error(t('error.fillPrevious'));
    }

    await prisma.setLog.upsert({
        where: {
            sessionId_exerciseId_setIndex: { sessionId, exerciseId, setIndex },
        },
        create: { sessionId, exerciseId, setIndex, weight, reps },
        update: { weight, reps },
    });

    (logs[exerciseId] ??= {})[setIndex] = { weight, reps };
    if (isSessionComplete(session.workout.exercises, logs)) {
        await prisma.$transaction([
            prisma.workoutSession.update({
                where: { id: sessionId },
                data: { completedAt: new Date() },
            }),
            prisma.routine.update({
                where: { id: session.routineId },
                data: { cursor: { increment: 1 } },
            }),
        ]);
    }

    revalidatePath('/');
}

/** Move to the next day without training. */
export async function skipDay(routineId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);
    await prisma.routine.update({
        where: { id: routineId },
        data: { cursor: { increment: 1 } },
    });
    revalidatePath('/');
}
