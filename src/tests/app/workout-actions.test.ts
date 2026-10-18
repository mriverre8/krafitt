import {
    createWorkout,
    duplicateRoutine,
    cancelDay,
    logSet,
    pickDay,
    renameWorkout,
    saveRoutine,
    sendRoutine,
    setActiveRoutine,
    skipDay,
    skipWeek,
    startDay,
} from '@/app/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFirst = vi.fn();
const update = vi.fn();
const updateMany = vi.fn();
const create = vi.fn();
const transaction = vi.fn();
const countLogs = vi.fn();
const upsertSession = vi.fn();
const deleteSessions = vi.fn();
const findSessions = vi.fn();
const countSessions = vi.fn();
const updateSessions = vi.fn();
const findWorkouts = vi.fn();
const upsertRequest = vi.fn();
const requireRoutine = vi.fn();
const routineDetail = vi.fn();
const redirect = vi.fn((to: string) => {
    throw new Error(`redirect ${to}`);
});

vi.mock('@/lib/auth', () => ({ requireUser: async () => ({ id: 'ada' }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
    redirect: (to: string) => redirect(to),
}));
vi.mock('@/lib/db', () => ({
    prisma: {
        routine: {
            findFirst: (...args: unknown[]) => findFirst(...args),
            update: (...args: unknown[]) => update(...args),
            updateMany: (...args: unknown[]) => updateMany(...args),
            create: (...args: unknown[]) => create(...args),
        },
        setLog: { count: (...args: unknown[]) => countLogs(...args) },
        workout: { findMany: (...args: unknown[]) => findWorkouts(...args) },
        workoutSession: {
            upsert: (...args: unknown[]) => upsertSession(...args),
            deleteMany: (...args: unknown[]) => deleteSessions(...args),
            findMany: (...args: unknown[]) => findSessions(...args),
            count: (...args: unknown[]) => countSessions(...args),
            updateMany: (...args: unknown[]) => updateSessions(...args),
        },
        routineRequest: {
            upsert: (...args: unknown[]) => upsertRequest(...args),
        },
        $transaction: (...args: unknown[]) => transaction(...args),
    },
}));
vi.mock('@/lib/access', () => ({
    requireRoutine: (...args: unknown[]) => requireRoutine(...args),
    requireEditableRoutine: (...args: unknown[]) => requireRoutine(...args),
    routineIdOfWorkout: async () => 'r2',
}));
vi.mock('@/lib/queries', () => ({
    routineDetail: (...args: unknown[]) => routineDetail(...args),
    isMember: async () => false,
}));

// The real translator, so the messages under test are the shipped ones.
vi.mock('@/i18n/server', async () => {
    const { createT, dictionaries } = await import('@/i18n/config');
    return { getT: async () => createT(dictionaries.en) };
});

/** A plan with nothing missing: one exercise of one set of 8–10. */
const plan = (kind: string) => ({
    id: 'r2',
    kind,
    cursor: 0,
    durationWeeks: kind === 'workout' ? null : 4,
    workouts: [
        {
            exercises: [
                {
                    name: 'Squat',
                    sets: [
                        {
                            repMode: 'range',
                            repMin: 8,
                            repMax: 10,
                            kind: 'normal',
                            value: null,
                            technique: null,
                        },
                    ],
                },
            ],
        },
    ],
});

beforeEach(() => {
    for (const mock of [
        findFirst,
        update,
        updateMany,
        create,
        transaction,
        countLogs,
        upsertSession,
        deleteSessions,
        findSessions,
        countSessions,
        updateSessions,
        findWorkouts,
        upsertRequest,
        requireRoutine,
        routineDetail,
    ])
        mock.mockReset();
    redirect.mockClear();
    requireRoutine.mockResolvedValue({ kind: 'routine' });
    updateMany.mockResolvedValue({ count: 1 });
});

describe('setActiveRoutine', () => {
    // A workout under way is never pushed off the home screen: it is finished
    // or left, and the user is told which one is in the way.
    it('refuses while a workout is being done', async () => {
        routineDetail.mockResolvedValue(plan('routine'));
        findFirst.mockResolvedValue({ name: 'Legs' });

        await expect(setActiveRoutine('r2')).resolves.toEqual({
            error: 'Finish the workout Legs first',
        });
        expect(findFirst.mock.calls[0][0].where).toEqual({
            creatorId: 'ada',
            kind: 'workout',
            isActive: true,
            id: { not: 'r2' },
        });
        expect(transaction).not.toHaveBeenCalled();
    });

    // A routine there is only set aside: it keeps its progress.
    it('takes the place of whatever else is active', async () => {
        routineDetail.mockResolvedValue(plan('workout'));
        findFirst.mockResolvedValue(null);

        await expect(setActiveRoutine('r2')).resolves.toBeUndefined();
        expect(updateMany).toHaveBeenCalledWith({
            where: { creatorId: 'ada' },
            data: { isActive: false },
        });
        expect(update).toHaveBeenCalledWith({
            where: { id: 'r2' },
            data: { isActive: true },
        });
    });
});

describe('skipDay', () => {
    it('finishes a workout and takes it off the home screen', async () => {
        requireRoutine.mockResolvedValue({
            kind: 'workout',
            isActive: true,
            cursor: 2,
        });
        countLogs.mockResolvedValue(3);
        await expect(skipDay('r2')).resolves.toBeUndefined();
        // The time under way is the third.
        expect(countLogs).toHaveBeenCalledWith({
            where: { session: { routineId: 'r2', userId: 'ada', week: 3 } },
        });
        expect(updateMany).toHaveBeenCalledWith({
            where: { id: 'r2', cursor: 2, isActive: true },
            data: {
                cursor: { increment: 1 },
                isActive: false,
                pickedWorkoutId: null,
            },
        });
    });

    // A stale button — finished on another screen, or closed by its last
    // set — must not count the same time twice.
    it('leaves a workout that is no longer under way alone', async () => {
        requireRoutine.mockResolvedValue({
            kind: 'workout',
            isActive: false,
            cursor: 3,
        });
        await expect(skipDay('r2')).resolves.toEqual({
            error: 'This workout is already finished',
        });
        expect(countLogs).not.toHaveBeenCalled();
        expect(updateMany).not.toHaveBeenCalled();
    });

    // Finished on another screen between the read and the write: the guarded
    // write finds nothing to change.
    it('says so when another screen finished it first', async () => {
        requireRoutine.mockResolvedValue({
            kind: 'workout',
            isActive: true,
            cursor: 2,
        });
        countLogs.mockResolvedValue(3);
        updateMany.mockResolvedValue({ count: 0 });
        await expect(skipDay('r2')).resolves.toEqual({
            error: 'This workout is already finished',
        });
    });

    // Nothing logged, nothing done: it is called off, and is not counted.
    it('calls off a workout with nothing logged', async () => {
        requireRoutine.mockResolvedValue({
            kind: 'workout',
            isActive: true,
            cursor: 2,
        });
        countLogs.mockResolvedValue(0);
        await skipDay('r2');
        expect(updateMany).toHaveBeenCalledWith({
            where: { id: 'r2', cursor: 2, isActive: true },
            data: {
                cursor: undefined,
                isActive: false,
                pickedWorkoutId: null,
            },
        });
    });

    // The cursor steps over it later, its session already complete.
    it('closes a picked day with its blanks, the cursor left alone', async () => {
        week2('d3');
        updateSessions.mockReturnValue('close');
        updateMany.mockReturnValue('unpick');
        await skipDay('r2');
        expect(updateSessions).toHaveBeenCalledWith({
            where: {
                userId: 'ada',
                workoutId: 'd3',
                week: 2,
                completedAt: null,
            },
            data: { completedAt: expect.any(Date) },
        });
        expect(updateMany).toHaveBeenCalledWith({
            where: { id: 'r2', pickedWorkoutId: 'd3' },
            data: { pickedWorkoutId: null },
        });
        expect(transaction).toHaveBeenCalledWith(['close', 'unpick']);
    });

    it('leaves a routine active on its next day', async () => {
        requireRoutine.mockResolvedValue({ kind: 'routine', cursor: 5 });
        await skipDay('r2');
        expect(updateMany).toHaveBeenCalledWith({
            where: { id: 'r2', cursor: 5 },
            data: {
                cursor: { increment: 1 },
                isActive: undefined,
                pickedWorkoutId: null,
            },
        });
    });
});

/** Five days a week, the cursor on week 2's first: d0 is the day in order. */
const week2 = (pickedWorkoutId: string | null = null) => {
    requireRoutine.mockResolvedValue({
        kind: 'routine',
        isActive: true,
        cursor: 5,
        durationWeeks: 4,
        pickedWorkoutId,
    });
    findWorkouts.mockResolvedValue(
        ['d0', 'd1', 'd2', 'd3', 'd4'].map((id) => ({ id }))
    );
};

describe('pickDay', () => {
    it('puts another day of the week on screen, the cursor left alone', async () => {
        week2();
        findSessions.mockResolvedValue([]);
        await expect(pickDay('r2', 'd3')).resolves.toBeUndefined();
        expect(requireRoutine).toHaveBeenCalledWith('r2', 'ada', 'routine');
        expect(findSessions.mock.calls[0][0].where).toEqual({
            userId: 'ada',
            routineId: 'r2',
            week: 2,
        });
        expect(updateMany).toHaveBeenCalledWith({
            where: { id: 'r2', cursor: 5 },
            data: { pickedWorkoutId: 'd3' },
        });
    });

    it("goes back to the order on the cursor's own day", async () => {
        week2('d3');
        findSessions.mockResolvedValue([]);
        await pickDay('r2', 'd0');
        expect(updateMany).toHaveBeenCalledWith({
            where: { id: 'r2', cursor: 5 },
            data: { pickedWorkoutId: null },
        });
    });

    it('refuses a day already done this week', async () => {
        week2();
        findSessions.mockResolvedValue([
            { workoutId: 'd3', completedAt: new Date() },
        ]);
        await expect(pickDay('r2', 'd3')).resolves.toEqual({
            error: 'That day cannot be trained now',
        });
        expect(updateMany).not.toHaveBeenCalled();
    });

    it('refuses a day that is not one of the routine', async () => {
        week2();
        await expect(pickDay('r2', 'other')).resolves.toEqual({
            error: 'That day cannot be trained now',
        });
        expect(updateMany).not.toHaveBeenCalled();
    });

    it('refuses while the day on screen is under way', async () => {
        week2('d2');
        findSessions.mockResolvedValue([
            { workoutId: 'd2', completedAt: null },
        ]);
        await expect(pickDay('r2', 'd3')).resolves.toEqual({
            error: 'Finish or call off the day under way first',
        });
        expect(updateMany).not.toHaveBeenCalled();
    });
});

describe('skipWeek', () => {
    // Cursor 5 on five days a week is week 2's first: week 3 starts at 10.
    it("moves the cursor to next week's first day and drops a pick", async () => {
        week2('d3');
        countSessions.mockResolvedValue(0);
        await expect(skipWeek('r2')).resolves.toBeUndefined();
        expect(requireRoutine).toHaveBeenCalledWith('r2', 'ada', 'routine');
        // The day on screen is the picked one.
        expect(countSessions.mock.calls[0][0].where).toMatchObject({
            workoutId: 'd3',
            week: 2,
            completedAt: null,
        });
        expect(updateMany).toHaveBeenCalledWith({
            where: { id: 'r2', cursor: 5 },
            data: { cursor: 10, pickedWorkoutId: null },
        });
    });

    it('refuses while the day on screen is under way', async () => {
        week2();
        countSessions.mockResolvedValue(1);
        await expect(skipWeek('r2')).resolves.toEqual({
            error: 'Finish or call off the day under way first',
        });
        expect(updateMany).not.toHaveBeenCalled();
    });

    it('refuses a routine that is over', async () => {
        week2();
        requireRoutine.mockResolvedValue({
            kind: 'routine',
            isActive: true,
            cursor: 20,
            durationWeeks: 4,
            pickedWorkoutId: null,
        });
        await expect(skipWeek('r2')).resolves.toEqual({
            error: 'This routine is already finished',
        });
        expect(updateMany).not.toHaveBeenCalled();
    });
});

describe('renameWorkout', () => {
    // A workout's day carries the workout's name, and is renamed with it.
    it("refuses a workout's day on its own", async () => {
        requireRoutine.mockResolvedValue({ kind: 'workout' });
        const data = new FormData();
        data.set('name', 'Push');
        await expect(renameWorkout('d1', {}, data)).rejects.toThrow(
            'You do not have access to this routine'
        );
    });
});

describe('logSet', () => {
    // A screen left open after the workout was finished or called off: the
    // closed time stays as it was, and the next one is not opened early.
    it.each([
        ['no longer under way', { isActive: false, cursor: 2 }, 3],
        [
            'at another time than the one under way',
            { isActive: true, cursor: 2 },
            4,
        ],
    ])('refuses a workout %s', async (_, state, week) => {
        requireRoutine.mockResolvedValue({ kind: 'workout', ...state });
        await expect(logSet('d1', week, 'e1', 's1', 60, 8)).resolves.toEqual({
            error: 'This workout is already finished',
        });
        expect(upsertSession).not.toHaveBeenCalled();
    });
});

describe('startDay', () => {
    // The session is what says the day was started, so it outlives the app.
    it('opens the session for the day', async () => {
        await startDay('d1', 3);
        expect(requireRoutine).toHaveBeenCalledWith('r2', 'ada', 'routine');
        expect(upsertSession).toHaveBeenCalledWith(
            expect.objectContaining({
                create: {
                    userId: 'ada',
                    routineId: 'r2',
                    workoutId: 'd1',
                    week: 3,
                },
            })
        );
    });
});

describe('cancelDay', () => {
    // A set logged from another screen keeps the day under way.
    it('drops the session only while nothing is logged in it', async () => {
        await cancelDay('d1', 3);
        expect(deleteSessions).toHaveBeenCalledWith({
            where: {
                userId: 'ada',
                workoutId: 'd1',
                week: 3,
                completedAt: null,
                logs: { none: {} },
            },
        });
    });
});

describe('createWorkout', () => {
    const form = (name: string) => {
        const data = new FormData();
        data.set('name', name);
        return data;
    };

    it('makes an open-ended workout with its one day', async () => {
        create.mockResolvedValue({ id: 'w9' });
        await expect(createWorkout({}, form(' Legs '))).rejects.toThrow(
            'redirect /workouts/w9'
        );
        expect(create).toHaveBeenCalledWith({
            data: {
                name: 'Legs',
                kind: 'workout',
                durationWeeks: null,
                creatorId: 'ada',
                workouts: { create: { name: 'Legs', order: 0 } },
            },
        });
    });

    it('asks for a name', async () => {
        await expect(createWorkout({}, form('  '))).resolves.toEqual({
            error: 'Give the workout a name',
        });
        expect(create).not.toHaveBeenCalled();
    });
});

describe('sendRoutine', () => {
    // A workout has no people: its copy is the recipient's alone, whatever
    // the form asked for.
    it('never adds the sender to a sent workout', async () => {
        routineDetail.mockResolvedValue(plan('workout'));
        await sendRoutine('r2', 'bob', true);
        expect(upsertRequest.mock.calls[0][0]).toMatchObject({
            create: { kind: 'send', recipientId: 'bob', addSender: false },
            update: { addSender: false },
        });
    });

    it('keeps the member choice on a routine', async () => {
        routineDetail.mockResolvedValue(plan('routine'));
        await sendRoutine('r2', 'bob', true);
        expect(upsertRequest.mock.calls[0][0]).toMatchObject({
            create: { addSender: true },
        });
    });
});

describe('duplicateRoutine', () => {
    // The copy is a workout of its own, its day under the copy's name, and it
    // opens among the workouts.
    it('copies a workout as a workout', async () => {
        routineDetail.mockResolvedValue({ ...plan('workout'), name: 'Legs' });
        create.mockResolvedValue({ id: 'w9' });

        await expect(duplicateRoutine('r2')).rejects.toThrow(
            'redirect /workouts/w9'
        );
        const { data } = create.mock.calls[0][0];
        expect(data).toMatchObject({
            name: 'Legs (copy)',
            kind: 'workout',
            durationWeeks: null,
            creatorId: 'ada',
        });
        expect(data.workouts.create[0].name).toBe('Legs (copy)');
    });
});

describe('saveRoutine', () => {
    // Someone else's public workout, kept: it lands among the workouts.
    it('keeps a copy of a public workout as a workout', async () => {
        routineDetail.mockResolvedValue({
            ...plan('workout'),
            name: 'Legs',
            creatorId: 'bob',
            isPublic: true,
        });
        create.mockResolvedValue({ id: 'w7' });

        await expect(saveRoutine('r2')).rejects.toThrow(
            'redirect /workouts/w7'
        );
        expect(create.mock.calls[0][0].data).toMatchObject({
            name: 'Legs',
            kind: 'workout',
            creatorId: 'ada',
        });
    });
});
