'use server';

import type { Translate } from '@/i18n/config';
import { getT } from '@/i18n/server';
import {
    requireEditableRoutine,
    requireRoutine,
    requireUnstartedRoutine,
    routineIdOfWorkout,
} from '@/lib/access';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
    DROP_PERCENT,
    EXERCISES,
    NAME_MAX,
    REPS,
    REST_SECONDS,
    maxDigits,
    SETS,
    WEEKS,
    WEIGHT,
} from '@/lib/constants';
import { isRepMode, isTimed } from '@/lib/reps';
import {
    isSetKind,
    readSetValue,
    setName,
    setPlaces,
    type Kinded,
} from '@/lib/sets';
import type {
    DayState,
    FormState,
    FoundUser,
    MemberSearchState,
} from '@/lib/forms';
import { matchExercises, setSlots, toLogs } from '@/lib/history';
import {
    currentWeek,
    isRoutineFinished,
    isSessionComplete,
    isSetEnabled,
    sectionOf,
    toEffort,
    toKind,
    type Effort,
} from '@/lib/progress';
import { isMember, planExercises, routineDetail } from '@/lib/queries';
import { isRoutineComplete, workoutProblems } from '@/lib/validate';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const str = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
const int = (data: FormData, key: string) =>
    Number.parseInt(String(data.get(key) ?? ''), 10);

const inWeekRange = (weeks: number, min: number) =>
    Number.isInteger(weeks) && weeks >= min && weeks <= WEEKS.max;

// ---------- routines ----------

export async function createRoutine(
    _previous: FormState,
    data: FormData
): Promise<FormState> {
    const user = await requireUser();
    const t = await getT();
    const name = str(data, 'name');
    // Open-ended is stated by the form, not inferred from a missing number:
    // the weeks field is disabled while it is off, so it sends nothing either way.
    const durationWeeks =
        str(data, 'indefinite') === 'on' ? null : int(data, 'durationWeeks');

    if (!name) return { error: t('error.routineName') };
    if (name.length > NAME_MAX) return { error: t('error.nameTooLong') };
    if (durationWeeks !== null && !inWeekRange(durationWeeks, WEEKS.min)) {
        return { error: t('error.duration') };
    }

    const routine = await prisma.routine.create({
        data: { name, durationWeeks, creatorId: user.id },
    });

    revalidatePath('/routines');
    redirect(`/routines/${routine.id}`);
}

/**
 * A workout is made with the one day it will ever have, under its own name,
 * and with no duration: it is done as many times as one likes.
 */
export async function createWorkout(
    _previous: FormState,
    data: FormData
): Promise<FormState> {
    const user = await requireUser();
    const t = await getT();
    const name = str(data, 'name');

    if (!name) return { error: t('error.workoutTitle') };
    if (name.length > NAME_MAX) return { error: t('error.nameTooLong') };

    const workout = await prisma.routine.create({
        data: {
            name,
            kind: 'workout',
            durationWeeks: null,
            creatorId: user.id,
            workouts: { create: { name, order: 0 } },
        },
    });

    revalidatePath('/workouts');
    redirect(`/workouts/${workout.id}`);
}

/** Starting a workout is putting it on the home screen, where it is trained:
    the same move as setting a routine active, and the same bar to clear. */
export async function startWorkout(routineId: string) {
    const result = await setActiveRoutine(routineId);
    if (result?.error) return result;
    redirect('/');
}

export async function setActiveRoutine(routineId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);

    const t = await getT();
    const routine = await routineDetail(routineId);

    if (!routine || !isRoutineComplete(routine, t)) {
        return { error: t('error.routineIncomplete') };
    }

    // A workout under way is finished or left, never pushed aside: nothing
    // takes its place on the home screen until it is done.
    const underWay = await prisma.routine.findFirst({
        where: {
            creatorId: user.id,
            kind: 'workout',
            isActive: true,
            id: { not: routineId },
        },
        select: { name: true },
    });
    if (underWay) {
        return { error: t('error.workoutInProgress', { name: underWay.name }) };
    }

    if (
        isRoutineFinished(
            routine.cursor,
            routine.workouts.length,
            routine.durationWeeks
        )
    ) {
        return { error: t('error.routineFinished') };
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
    revalidatePath('/workouts');
}

export async function deactivateRoutine(routineId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id, 'routine');

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
    const routine = await requireRoutine(routineId, user.id);

    await prisma.routine.update({
        where: { id: routineId },
        data: { isPublic },
    });
    revalidatePath(`${sectionOf(routine.kind)}/${routineId}`);
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
    const routine = await requireRoutine(routineId, user.id);
    const section = sectionOf(routine.kind);

    // A workout's one day goes by the workout's name, so the home screen and
    // the history, which title the day, say the same thing.
    await prisma.routine.update({
        where: { id: routineId },
        data: {
            name,
            workouts:
                toKind(routine.kind) === 'workout'
                    ? { updateMany: { where: {}, data: { name } } }
                    : undefined,
        },
    });
    revalidatePath(`${section}/${routineId}`);
    revalidatePath(section);
    revalidatePath('/');
    return { ok: true };
}

/**
 * The one part of a plan that stays editable once training has started: a block
 * can be cut short or run on.
 *
 * The floor is the week being trained, which ends the routine the moment it is
 * finished — behind that lie weeks already logged, and those are history. The
 * ceiling is the same 52 the form offers. An open-ended routine has no duration
 * to move; it is the one shape this refuses.
 */
export async function setRoutineDuration(
    routineId: string,
    _previous: FormState,
    data: FormData
): Promise<FormState> {
    const user = await requireUser();
    const t = await getT();
    const durationWeeks = int(data, 'durationWeeks');
    const routine = await requireRoutine(routineId, user.id, 'routine');

    if (routine.durationWeeks === null) {
        return { error: t('error.durationOpenEnded') };
    }

    const workoutCount = await prisma.workout.count({ where: { routineId } });
    const min = currentWeek(routine.cursor, workoutCount);
    if (!inWeekRange(durationWeeks, min)) {
        return { error: t('error.durationRange', { min, max: WEEKS.max }) };
    }

    await prisma.routine.update({
        where: { id: routineId },
        data: { durationWeeks },
    });
    revalidatePath(`/routines/${routineId}`);
    revalidatePath('/routines');
    revalidatePath('/');
    return { ok: true };
}

export async function deleteRoutine(routineId: string) {
    const user = await requireUser();
    const routine = await requireRoutine(routineId, user.id);
    await prisma.routine.delete({ where: { id: routineId } });
    revalidatePath('/');
    redirect(sectionOf(routine.kind));
}

/**
 * A fresh start on the same plan: days, exercises and sets are copied, and
 * nothing that was lived through them is. Being started or finished is read off
 * the cursor and the sessions, so leaving those behind is what makes the copy
 * pending — and private, like any routine that was just made.
 *
 * `memberId` lets someone in on the copy in the same write: the sender of a
 * routine watching how the recipient gets on with it.
 *
 * Not `async` on purpose: the bare Prisma query is lazy, so `acceptRequest`
 * can run it inside a `$transaction` batch.
 */
function copyRoutine(
    routine: NonNullable<Awaited<ReturnType<typeof routineDetail>>>,
    creatorId: string,
    name: string,
    memberId?: string
) {
    return prisma.routine.create({
        data: {
            name,
            // A workout copies as a workout: one day, done as often as one likes.
            kind: routine.kind,
            durationWeeks: routine.durationWeeks,
            creatorId,
            members: memberId ? { create: { userId: memberId } } : undefined,
            workouts: {
                create: routine.workouts.map((workout) => ({
                    // A workout's one day goes by the workout's own name.
                    name:
                        toKind(routine.kind) === 'workout'
                            ? name
                            : workout.name,
                    order: workout.order,
                    exercises: {
                        create: workout.exercises.map((exercise) => ({
                            name: exercise.name,
                            order: exercise.order,
                            sets: {
                                create: exercise.sets.map((set) => ({
                                    order: set.order,
                                    repMode: set.repMode,
                                    repMin: set.repMin,
                                    repMax: set.repMax,
                                    technique: set.technique,
                                    kind: set.kind,
                                    value: set.value,
                                })),
                            },
                        })),
                    },
                })),
            },
        },
    });
}

export async function duplicateRoutine(routineId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);

    const [routine, t] = await Promise.all([routineDetail(routineId), getT()]);
    if (!routine) return { error: t('error.routineNotFound') };

    const room = NAME_MAX - t('routine.copyName', { name: '' }).length;
    const copy = await copyRoutine(
        routine,
        user.id,
        t('routine.copyName', { name: routine.name.slice(0, room) })
    );
    // A workout's copy is a workout, and opens among the workouts.
    const section = sectionOf(routine.kind);
    revalidatePath(section);
    redirect(`${section}/${copy.id}`);
}

/**
 * Someone else's plan, made one's own: whoever may read it may keep it —
 * through public, or through being let in. The name stays — in the saver's list there is no original for it to be a copy of.
 */
export async function saveRoutine(routineId: string) {
    const user = await requireUser();
    const [routine, t] = await Promise.all([routineDetail(routineId), getT()]);
    if (!routine) return { error: t('error.routineNotFound') };

    const allowed =
        routine.creatorId !== user.id &&
        (routine.isPublic || (await isMember(routineId, user.id)));
    if (!allowed) return { error: t('error.noAccess') };

    const copy = await copyRoutine(routine, user.id, routine.name);
    const section = sectionOf(routine.kind);
    revalidatePath(section);
    redirect(`${section}/${copy.id}`);
}

/**
 * Who to send a routine to, looked up by email the same way the member search
 * does. Owner-only for the same reason: never a general lookup of the app's
 * users. Being a member already is no bar — they get a copy of their own.
 */
export async function findRecipient(
    routineId: string,
    email: string
): Promise<{ found?: FoundUser; error?: string }> {
    const user = await requireUser();
    const t = await getT();
    await requireRoutine(routineId, user.id);

    const found = await userByEmail(email);
    if (!found) return { error: t('error.memberNotFound') };
    if (found.id === user.id) return { error: t('error.sendSelf') };
    return { found };
}

/**
 * The owner's plan — routine or workout — offered to someone else as one of
 * their own: the same fresh copy `saveRoutine` makes, only pushed rather than
 * pulled. Nothing is copied yet: it waits as a request until they accept it,
 * and sending again before they answer only updates the member choice. Nothing
 * on the sender's side changes, so there is nothing of theirs to revalidate.
 */
export async function sendRoutine(
    routineId: string,
    userId: string,
    addMe: boolean
) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);
    const [routine, t] = await Promise.all([routineDetail(routineId), getT()]);

    if (!routine) return { error: t('error.routineNotFound') };
    // The menu hides the option on an incomplete routine; this is what holds.
    if (!isRoutineComplete(routine, t)) {
        return { error: t('error.routineIncomplete') };
    }
    if (userId === user.id) return { error: t('error.sendSelf') };

    // A workout has no people: its copy is the recipient's alone, whatever the
    // form sent.
    const addSender = toKind(routine.kind) === 'routine' && addMe;
    await prisma.routineRequest.upsert({
        where: requestKey('send', routineId, userId),
        create: {
            kind: 'send',
            routineId,
            recipientId: userId,
            addSender,
        },
        update: { addSender },
    });
}

const requestKey = (
    kind: 'member' | 'send',
    routineId: string,
    recipientId: string
) => ({ kind_routineId_recipientId: { kind, routineId, recipientId } });

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
    await requireUnstartedRoutine(routineId, user.id);

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
 *
 * The one message the editor gets back sits under the whole day, so it says
 * where: the exercise, named the way the day's own problems name it, and the
 * set, by the label its fields carry.
 */
function readPlan(raw: string, t: Translate) {
    let plan: unknown;
    try {
        plan = JSON.parse(raw);
    } catch {
        return { error: t('error.planUnreadable') };
    }
    if (!Array.isArray(plan)) return { error: t('error.planUnreadable') };
    if (plan.length < 1 || plan.length > EXERCISES.max) {
        return { error: t('error.exercises', { max: EXERCISES.max }) };
    }

    const exercises = [];
    for (const [index, entry] of plan.entries()) {
        const { id, name, sets } = (entry ?? {}) as Record<string, unknown>;
        if (
            (id !== null && typeof id !== 'string') ||
            typeof name !== 'string'
        ) {
            return { error: t('error.planUnreadable') };
        }
        const numbered = t('validate.exerciseN', { n: index + 1 });
        if (name.trim().length > NAME_MAX) {
            return {
                error: t('error.planName', { where: numbered, max: NAME_MAX }),
            };
        }
        const where = name.trim() || numbered;
        if (
            !Array.isArray(sets) ||
            sets.length < SETS.min ||
            sets.length > SETS.max
        ) {
            return {
                error: t('error.sets', {
                    where,
                    min: SETS.min,
                    max: SETS.max,
                }),
            };
        }

        const places = setPlaces(sets.map((row) => (row ?? {}) as Kinded));
        const rows = [];
        for (const [order, row] of sets.entries()) {
            const { kind, mode, repMin, repMax, value, technique } = (row ??
                {}) as Record<string, unknown>;
            const at = { where, set: setName(places[order]) };
            if (!isRepMode(mode)) return { error: t('error.planRepMode', at) };
            const setKind = kind === undefined ? 'normal' : kind;
            if (!isSetKind(setKind)) {
                return { error: t('error.planSetKind', at) };
            }
            if (setKind !== 'normal' && order === 0) {
                return { error: t('error.planSubFirst', { where }) };
            }
            const min = readReps(repMin);
            const max = readReps(repMax);
            if (min === undefined || max === undefined) {
                return {
                    error: t(
                        isTimed(mode) ? 'error.planSeconds' : 'error.planReps',
                        { ...at, max: maxDigits(REPS.digits) }
                    ),
                };
            }
            const amount = readSetValue(value, setKind);
            if (amount === undefined) {
                const drop = setKind === 'drop';
                return {
                    error: t(drop ? 'error.planDrop' : 'error.planRest', {
                        ...at,
                        max: maxDigits(
                            (drop ? DROP_PERCENT : REST_SECONDS).digits
                        ),
                    }),
                };
            }
            rows.push({
                order,
                kind: setKind,
                repMode: mode,
                repMin: min,
                // A timed set names one number at most.
                repMax: mode === 'time' ? null : max,
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

/**
 * Saves a whole day, while it is being trained too. What was logged is never
 * rewritten: the plan is, and the history matches the logs against it (see
 * `lib/history.ts`). So the sets are simply written out again, and the only
 * thing to settle is which exercise every card is — the one it was, one the
 * day archived and now gets back, or a new one. An exercise no card claims is
 * archived if anything was logged against it, and deleted if not.
 */
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
    const routine = await requireEditableRoutine(routineId, user.id);

    // The active routine is the one on the home screen, so it has to stay
    // trainable — the same bar `setActiveRoutine` sets to get there. Any other
    // can still be saved half-written.
    if (routine.isActive) {
        const [problem] = workoutProblems({ exercises: parsed.exercises }, t);
        if (problem) return { error: t('error.activeDayIncomplete', problem) };
    }

    const existing = await prisma.exercise.findMany({
        where: { workoutId },
        // The plan before the archive: a name both hold resolves to the plan's.
        orderBy: [{ archived: 'asc' }, { order: 'asc' }],
        select: {
            id: true,
            name: true,
            archived: true,
            _count: { select: { logs: true } },
        },
    });
    const { ids, archive, remove } = matchExercises(
        existing.map(({ _count, ...exercise }) => ({
            ...exercise,
            logged: _count.logs > 0,
        })),
        parsed.exercises
    );

    await prisma.$transaction([
        prisma.exercise.deleteMany({ where: { id: { in: remove } } }),
        // With the sets it had: the history reads its logs against them.
        prisma.exercise.updateMany({
            where: { id: { in: archive } },
            data: { archived: true },
        }),
        ...parsed.exercises.map((exercise, order) => {
            const id = ids[order];
            const fields = { name: exercise.name, order, archived: false };
            return id
                ? prisma.exercise.update({
                      where: { id },
                      data: {
                          ...fields,
                          sets: { deleteMany: {}, create: exercise.sets },
                      },
                  })
                : prisma.exercise.create({
                      data: {
                          ...fields,
                          workoutId,
                          sets: { create: exercise.sets },
                      },
                  });
        }),
    ]);

    // The page the editor is on, whichever kind it is: its badge and its list
    // of what is missing are drawn from what was just saved.
    revalidatePath(`${sectionOf(routine.kind)}/${routineId}`);
    revalidatePath(`/progress/${routineId}`);
    revalidatePath('/');

    const saved = await prisma.exercise.findMany({
        where: { workoutId, archived: false },
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
    await requireUnstartedRoutine(routineId, user.id);
    await prisma.workout.delete({ where: { id: workoutId } });
    revalidatePath(`/routines/${routineId}`);
    revalidatePath('/');
}

// ---------- training ----------

/**
 * The set is named by its slot (`lib/history.ts`), not by its place in the
 * list: the plan can be edited while a screen is open on it, and a place sent
 * from before an edit could point at whichever set has moved into it since.
 */
export async function logSet(
    workoutId: string,
    week: number,
    exerciseId: string,
    slot: string,
    weight: number,
    reps: number,
    rawEffort?: string
) {
    const user = await requireUser();
    const effort: Effort = toEffort(rawEffort);
    const t = await getT();

    if (!Number.isFinite(weight) || weight < WEIGHT.min || weight > WEIGHT.max)
        return { error: t('error.weight') };
    if (!Number.isInteger(reps) || reps < REPS.min || reps > REPS.max)
        return { error: t('error.reps') };

    const routineId = await routineIdOfWorkout(workoutId);
    await requireRoutine(routineId, user.id);

    // The first logged set is what opens the session for this week.
    const session = await prisma.workoutSession.upsert({
        where: { userId_workoutId_week: { userId: user.id, workoutId, week } },
        create: { userId: user.id, routineId, workoutId, week },
        update: {},
        include: {
            logs: true,
            workout: { include: { exercises: planExercises } },
        },
    });
    if (session.completedAt) return { error: t('error.alreadyFinished') };

    const exercise = session.workout.exercises.find(
        (item) => item.id === exerciseId
    );
    if (!exercise) return { error: t('error.wrongExercise') };
    const setIndex = setSlots(exercise.sets).indexOf(slot);
    if (setIndex < 0) return { error: t('error.planChanged') };

    // Sequential order is enforced here, not only by disabling inputs on the client.
    const logs = toLogs(session.logs, session.workout.exercises);
    if (!isSetEnabled(session.workout.exercises, logs, exerciseId, setIndex)) {
        return { error: t('error.fillPrevious') };
    }

    await prisma.setLog.upsert({
        where: {
            sessionId_exerciseId_slot: {
                sessionId: session.id,
                exerciseId,
                slot,
            },
        },
        create: {
            sessionId: session.id,
            exerciseId,
            slot,
            weight,
            reps,
            effort,
        },
        update: { weight, reps, effort },
    });

    (logs[exerciseId] ??= {})[setIndex] = { weight, reps, effort };

    if (isSessionComplete(session.workout.exercises, logs)) {
        await prisma.workoutSession.update({
            where: { id: session.id },
            data: { completedAt: new Date() },
        });
    }
}

/**
 * Moving on with what was left blank. On a workout this is "Finish workout":
 * the time counts like a skipped day does, with its blanks — unless nothing
 * at all was logged — and the workout leaves the home screen rather than
 * starting over.
 */
export async function skipDay(routineId: string) {
    const user = await requireUser();
    const routine = await requireRoutine(routineId, user.id);
    const workout = toKind(routine.kind) === 'workout';
    // Only a workout under way can be finished: a stale button — it was
    // finished elsewhere, or closed by its last set — must not count it twice.
    if (workout && !routine.isActive) return;
    // A workout finished with nothing logged was never done: it is called off
    // rather than counted, and leaves no row in the history. The time under
    // way is the one after the cursor.
    const counts =
        !workout ||
        (await prisma.setLog.count({
            where: {
                session: {
                    routineId,
                    userId: user.id,
                    week: routine.cursor + 1,
                },
            },
        })) > 0;
    await prisma.routine.update({
        where: { id: routineId },
        data: {
            cursor: counts ? { increment: 1 } : undefined,
            isActive: workout ? false : undefined,
        },
    });
    revalidatePath('/');
    if (workout) {
        revalidatePath('/workouts');
        revalidatePath(`/workouts/${routineId}`);
    }
}

// ---------- people on a routine ----------

/**
 * Who to add, looked up by email. The id is unique but nobody knows anyone
 * else's, and names are not unique at all: the address is the one thing a
 * person can be asked for and typed in.
 *
 * Case is folded on both sides because Postgres compares it and BetterAuth
 * stores whatever the provider handed over — `Ada@x.com` and `ada@x.com` are
 * one account, and a search that missed on capitals would be unexplainable.
 *
 * ponytail: answering "no account with that email" tells the asker whether an
 * address is registered. The price of inviting accounts rather than
 * addresses; key the invite by email instead if that ever matters.
 */
export async function findRoutineMember(
    routineId: string,
    _previous: MemberSearchState,
    data: FormData
): Promise<MemberSearchState> {
    const user = await requireUser();
    const t = await getT();
    // Owner-only, so this is never a general lookup of the app's users.
    await requireRoutine(routineId, user.id, 'routine');

    const email = str(data, 'email');
    if (!email) return { error: t('error.memberEmail') };

    const found = await userByEmail(email);
    if (!found) return { error: t('error.memberNotFound') };
    if (found.id === user.id) return { error: t('error.memberSelf') };

    // Already in: say so and hand back no one.
    if (await isMember(routineId, found.id))
        return { notice: t('members.already', { name: found.name }) };

    // Asked already and not answered yet: a second ask would change nothing.
    const invited = await prisma.routineRequest.findUnique({
        where: requestKey('member', routineId, found.id),
        select: { id: true },
    });
    if (invited) return { notice: t('members.invited', { name: found.name }) };

    return { ok: true, found };
}

const userByEmail = (email: string) =>
    prisma.user.findFirst({
        where: { email: { equals: email.trim(), mode: 'insensitive' } },
        select: { id: true, name: true, image: true },
    });

/**
 * Asking someone in as a member: once they accept they read, keep a copy, and
 * walk out. Nobody is let in without their say-so, so this only leaves a
 * request, which the people page lists as pending. Idempotent on purpose — a
 * double click or a stale card is a no-op, the same way `toggleFollow` is.
 */
export async function inviteRoutineMember(routineId: string, userId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id, 'routine');
    const t = await getT();

    if (userId === user.id) return { error: t('error.memberSelf') };

    await prisma.routineRequest.upsert({
        where: requestKey('member', routineId, userId),
        create: { kind: 'member', routineId, recipientId: userId },
        update: {},
    });
    revalidatePath(`/routines/${routineId}/people`);
}

/** Taking back an invitation nobody has answered yet. A stale button — they
    answered in the meantime — is a no-op. */
export async function cancelRoutineInvite(routineId: string, userId: string) {
    const user = await requireUser();
    await requireRoutine(routineId, user.id);

    await prisma.routineRequest.deleteMany({
        where: { kind: 'member', routineId, recipientId: userId },
    });
    revalidatePath(`/routines/${routineId}/people`);
}

/**
 * Taking someone out, or walking out yourself. The owner needs nobody's say-so
 * to take a member out, and anyone may leave what they agreed to join.
 */
export async function removeRoutineMember(routineId: string, userId: string) {
    const user = await requireUser();
    const leaving = userId === user.id;
    if (!leaving) await requireRoutine(routineId, user.id);

    await prisma.routineMember.deleteMany({ where: { routineId, userId } });
    revalidatePath(`/routines/${routineId}/people`);
    revalidatePath(`/routines/${routineId}`);
    revalidatePath('/routines');
    revalidatePath('/routines/shared');

    if (leaving) redirect('/routines/shared');
}

// ---------- requests ----------

/**
 * Saying yes: the write the creator asked for runs now, and the request goes
 * in the same transaction — a request answered twice fails rather than
 * copying twice. Only the recipient can answer, so a request that is not
 * theirs is no request at all.
 *
 * ponytail: a sent routine is copied as it stands now, not as it was sent. It
 * locks once started, so the gap is edits made before then; snapshot the plan
 * on the request if that ever matters.
 */
export async function acceptRequest(requestId: string) {
    const user = await requireUser();
    const t = await getT();
    const request = await prisma.routineRequest.findFirst({
        where: { id: requestId, recipientId: user.id },
    });
    if (!request) return { error: t('error.requestNotFound') };

    const { routineId } = request;
    const answered = prisma.routineRequest.delete({ where: { id: requestId } });

    if (request.kind === 'member') {
        await prisma.$transaction([
            prisma.routineMember.upsert({
                where: { routineId_userId: { routineId, userId: user.id } },
                create: { routineId, userId: user.id },
                update: {},
            }),
            answered,
        ]);
        revalidatePath(`/routines/${routineId}/people`);
        // The share badge shows on a private routine once somebody is in it.
        revalidatePath(`/routines/${routineId}`);
        revalidatePath('/routines/shared');
    } else {
        const routine = await routineDetail(routineId);
        if (!routine) return { error: t('error.routineNotFound') };
        // It was complete when sent, but it may have been edited since.
        if (!isRoutineComplete(routine, t))
            return { error: t('error.routineIncomplete') };

        await prisma.$transaction([
            copyRoutine(
                routine,
                user.id,
                routine.name,
                request.addSender ? routine.creatorId : undefined
            ),
            answered,
        ]);
    }
    // Either inbox, and the list the copy joins: a routine or a workout.
    revalidatePath('/routines/requests');
    revalidatePath('/routines');
    revalidatePath('/workouts/requests');
    revalidatePath('/workouts');
}

/** Saying no: the request goes and nothing else happens. A stale button is a
    no-op, the same way `toggleFollow` is. */
export async function declineRequest(requestId: string) {
    const user = await requireUser();
    await prisma.routineRequest.deleteMany({
        where: { id: requestId, recipientId: user.id },
    });
    revalidatePath('/routines/requests');
    revalidatePath('/routines');
    revalidatePath('/workouts/requests');
    revalidatePath('/workouts');
}

// ---------- follows ----------

/**
 * Follow or unfollow someone. Both halves are written so they do not care what
 * was there before: a second click on a stale button is a no-op rather than an
 * error, and the composite key means the row can never be stored twice.
 */
export async function toggleFollow(userId: string, follow: boolean) {
    const user = await requireUser();
    if (userId === user.id)
        return { error: (await getT())('error.followSelf') };

    const pair = { followerId: user.id, followingId: userId };
    if (follow)
        await prisma.follow.upsert({
            where: { followerId_followingId: pair },
            create: pair,
            update: {},
        });
    else await prisma.follow.deleteMany({ where: pair });

    // Both profiles move — theirs gains a follower, yours gains a following —
    // and so does any follows list either of them shows up in. The pattern
    // covers the lot; naming the two ids would miss a third user's list.
    revalidatePath('/profile/[id]', 'layout');
}
