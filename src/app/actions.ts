'use server';

import type { Translate } from '@/i18n/config';
import { getT } from '@/i18n/server';
import {
    requireEditableRoutine,
    requireRoutine,
    routineIdOfWorkout,
} from '@/lib/access';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
    EXERCISES,
    NAME_MAX,
    REPS,
    maxDigits,
    SETS,
    WEEKS,
    WEIGHT,
} from '@/lib/constants';
import { isRepMode } from '@/lib/reps';
import { isSetKind, readSetValue } from '@/lib/sets';
import type { DayState, FormState } from '@/lib/forms';
import {
    isRoutineFinished,
    isSessionComplete,
    isSetEnabled,
    type Logs,
} from '@/lib/progress';
import { routineDetail } from '@/lib/queries';
import { isRoutineComplete } from '@/lib/validate';
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

    const routine = await prisma.routine.create({
        data: { name, durationWeeks, creatorId: user.id },
    });

    revalidatePath('/routines');
    redirect(`/routines/${routine.id}`);
}

export async function setActiveRoutine(routineId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);

    const t = await getT();
    const routine = await routineDetail(routineId);

    if (!routine || !isRoutineComplete(routine, t)) {
        throw new Error(t('error.routineIncomplete'));
    }

    if (
        isRoutineFinished(
            routine.cursor,
            routine.workouts.length,
            routine.durationWeeks
        )
    ) {
        throw new Error(t('error.routineFinished'));
    }

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

export async function deactivateRoutine(routineId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);

    await prisma.routine.update({
        where: { id: routineId },
        data: { isActive: false },
    });
    revalidatePath('/');
    revalidatePath('/routines');
}

/**
 * Sharing is a read grant and nothing more: public only ever opens the plan to
 * whoever holds the id. Editing, activating and the logs stay with the owner,
 * which is why nothing else in here had to change.
 */
export async function setRoutineVisibility(
    routineId: string,
    isPublic: boolean
) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);

    await prisma.routine.update({
        where: { id: routineId },
        data: { isPublic },
    });
    revalidatePath(`/routines/${routineId}`);
}

export async function renameRoutine(
    routineId: string,
    _previous: FormState,
    data: FormData
): Promise<FormState> {
    const user = await requireUser();
    const t = await getT();
    const name = str(data, 'name');

    if (!name) return { error: t('error.routineName') };
    if (name.length > NAME_MAX) return { error: t('error.nameTooLong') };
    await requireRoutine(routineId, user.id);

    await prisma.routine.update({ where: { id: routineId }, data: { name } });
    revalidatePath(`/routines/${routineId}`);
    revalidatePath('/routines');
    revalidatePath('/');
    return { ok: true };
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
    await requireEditableRoutine(routineId, user.id);

    const order = await prisma.workout.count({ where: { routineId } });
    await prisma.workout.create({ data: { routineId, name, order } });
    revalidatePath(`/routines/${routineId}`);
    return { ok: true };
}

export async function addWorkoutTo(
    routineId: string,
    previous: FormState,
    data: FormData
): Promise<FormState> {
    data.set('routineId', routineId);
    return addWorkout(previous, data);
}

/**
 * A blank field, or a number the form should never have been able to produce.
 *
 * Read against what three digits can hold rather than against `REPS`: a 0 is
 * typeable, so it is saved and left to `badRepFields` to call a hole in the day
 * — same as a range that runs backwards, which has always been saved this way.
 * A refusal here would only put it under the form with nothing stored.
 */
function readReps(value: unknown): number | null | undefined {
    if (value === '' || value === null || value === undefined) return null;
    const reps = Number.parseInt(String(value), 10);
    if (!Number.isInteger(reps) || reps < 0 || reps > maxDigits(REPS.digits)) {
        return undefined;
    }
    return reps;
}

/**
 * The editor submits the whole day as JSON, so this is a trust boundary: nothing
 * about the shape is assumed. Blanks are kept as blanks — a routine is written
 * over several sittings, and `routineProblems` is what decides when it is
 * finished. Only nonsense is rejected outright.
 */
function readPlan(raw: string, t: Translate) {
    let plan: unknown;
    try {
        plan = JSON.parse(raw);
    } catch {
        return { error: t('error.exercises') };
    }
    if (
        !Array.isArray(plan) ||
        plan.length < 1 ||
        plan.length > EXERCISES.max
    ) {
        return { error: t('error.exercises') };
    }

    const exercises = [];
    for (const entry of plan) {
        const { id, name, sets } = (entry ?? {}) as Record<string, unknown>;
        if (id !== null && typeof id !== 'string') {
            return { error: t('error.exercises') };
        }
        if (typeof name !== 'string') return { error: t('error.exercises') };
        if (name.trim().length > NAME_MAX) {
            return { error: t('error.nameTooLong') };
        }
        if (
            !Array.isArray(sets) ||
            sets.length < SETS.min ||
            sets.length > SETS.max
        ) {
            return { error: t('error.sets') };
        }

        const rows = [];
        for (const [order, row] of sets.entries()) {
            const { kind, mode, repMin, repMax, value, technique } = (row ??
                {}) as Record<string, unknown>;
            if (!isRepMode(mode)) return { error: t('error.sets') };
            const setKind = kind === undefined ? 'normal' : kind;
            if (!isSetKind(setKind) || (setKind !== 'normal' && order === 0)) {
                return { error: t('error.sets') };
            }
            const min = readReps(repMin);
            const max = readReps(repMax);
            if (min === undefined || max === undefined) {
                return { error: t('error.repRange') };
            }
            const amount = readSetValue(value, setKind);
            if (amount === undefined) return { error: t('error.setValue') };
            rows.push({
                order,
                kind: setKind,
                repMode: mode,
                repMin: min,
                repMax: max,
                value: amount,
                technique:
                    setKind !== 'normal' || typeof technique !== 'string'
                        ? null
                        : technique.trim().slice(0, NAME_MAX),
            });
        }
        exercises.push({ id, name: name.trim(), sets: rows });
    }
    return { exercises };
}

export async function saveExercises(
    _previous: DayState,
    data: FormData
): Promise<DayState> {
    const user = await requireUser();
    const t = await getT();
    const workoutId = str(data, 'workoutId');
    const parsed = readPlan(String(data.get('plan') ?? ''), t);
    if ('error' in parsed) return parsed;

    const routineId = await routineIdOfWorkout(workoutId);
    await requireEditableRoutine(routineId, user.id);

    const existing = await prisma.exercise.findMany({
        where: { workoutId },
        select: { id: true },
    });
    const own = new Set(existing.map((exercise) => exercise.id));
    const kept = new Set(
        parsed.exercises
            .map((exercise) => exercise.id)
            .filter((id): id is string => !!id && own.has(id))
    );

    await prisma.$transaction([
        prisma.exercise.deleteMany({
            where: {
                workoutId,
                id: { notIn: [...kept] },
            },
        }),
        ...parsed.exercises.map((exercise, order) =>
            exercise.id && kept.has(exercise.id)
                ? prisma.exercise.update({
                      where: { id: exercise.id },
                      data: {
                          name: exercise.name,
                          order,
                          sets: { deleteMany: {}, create: exercise.sets },
                      },
                  })
                : prisma.exercise.create({
                      data: {
                          workoutId,
                          name: exercise.name,
                          order,
                          sets: { create: exercise.sets },
                      },
                  })
        ),
    ]);

    revalidatePath(`/routines/${routineId}`);
    revalidatePath('/');

    const saved = await prisma.exercise.findMany({
        where: { workoutId },
        orderBy: { order: 'asc' },
        select: {
            id: true,
            name: true,
            sets: {
                orderBy: { order: 'asc' },
                select: {
                    repMode: true,
                    repMin: true,
                    repMax: true,
                    technique: true,
                    kind: true,
                    value: true,
                },
            },
        },
    });
    return { ok: true, saved };
}

export async function renameWorkout(
    workoutId: string,
    _previous: FormState,
    data: FormData
): Promise<FormState> {
    const user = await requireUser();
    const t = await getT();
    const name = str(data, 'name');

    if (!name) return { error: t('error.workoutName') };
    if (name.length > NAME_MAX) return { error: t('error.nameTooLong') };
    const routineId = await routineIdOfWorkout(workoutId);
    await requireEditableRoutine(routineId, user.id);

    await prisma.workout.update({ where: { id: workoutId }, data: { name } });
    revalidatePath(`/routines/${routineId}`);
    return { ok: true };
}

export async function deleteWorkout(workoutId: string) {
    const user = await requireUser();
    const routineId = await routineIdOfWorkout(workoutId);
    await requireEditableRoutine(routineId, user.id);
    await prisma.workout.delete({ where: { id: workoutId } });
    revalidatePath(`/routines/${routineId}`);
    revalidatePath('/');
}

// ---------- training ----------

export async function logSet(
    workoutId: string,
    week: number,
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

    const routineId = await routineIdOfWorkout(workoutId);
    await requireRoutine(routineId, user.id);

    // The first logged set is what opens the session for this week.
    const session = await prisma.workoutSession.upsert({
        where: { userId_workoutId_week: { userId: user.id, workoutId, week } },
        create: { userId: user.id, routineId, workoutId, week },
        update: {},
        include: {
            logs: true,
            workout: {
                include: {
                    exercises: {
                        orderBy: { order: 'asc' },
                        include: { sets: true },
                    },
                },
            },
        },
    });
    if (session.completedAt) throw new Error(t('error.alreadyFinished'));

    const exercise = session.workout.exercises.find(
        (item) => item.id === exerciseId
    );
    if (!exercise) throw new Error(t('error.wrongExercise'));
    if (
        !Number.isInteger(setIndex) ||
        setIndex < 0 ||
        setIndex >= exercise.sets.length
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
            sessionId_exerciseId_setIndex: {
                sessionId: session.id,
                exerciseId,
                setIndex,
            },
        },
        create: { sessionId: session.id, exerciseId, setIndex, weight, reps },
        update: { weight, reps },
    });

    (logs[exerciseId] ??= {})[setIndex] = { weight, reps };

    if (isSessionComplete(session.workout.exercises, logs)) {
        await prisma.workoutSession.update({
            where: { id: session.id },
            data: { completedAt: new Date() },
        });
    }
}

export async function skipDay(routineId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);
    await prisma.routine.update({
        where: { id: routineId },
        data: { cursor: { increment: 1 } },
    });
    revalidatePath('/');
}
