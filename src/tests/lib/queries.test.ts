import {
    followList,
    isFollowing,
    routineHistory,
    countRequests,
    requestsOf,
    routinesOf,
    todayWorkout,
} from '@/lib/queries';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFollows = vi.fn();
const findFollow = vi.fn();
const findRoutine = vi.fn();
const findSessions = vi.fn();
const findActive = vi.fn();
const findRoutines = vi.fn();
const moveRoutine = vi.fn();
const findSession = vi.fn();
const closeSession = vi.fn();
const transaction = vi.fn();
const findRequests = vi.fn();
const countRequestRows = vi.fn();

vi.mock('@/lib/db', () => ({
    prisma: {
        follow: {
            findMany: (...args: unknown[]) => findFollows(...args),
            findUnique: (...args: unknown[]) => findFollow(...args),
        },
        routine: {
            findUnique: (...args: unknown[]) => findRoutine(...args),
            findFirst: (...args: unknown[]) => findActive(...args),
            findMany: (...args: unknown[]) => findRoutines(...args),
            updateMany: (...args: unknown[]) => moveRoutine(...args),
        },
        workoutSession: {
            findMany: (...args: unknown[]) => findSessions(...args),
            findUnique: (...args: unknown[]) => findSession(...args),
            updateMany: (...args: unknown[]) => closeSession(...args),
        },
        routineRequest: {
            findMany: (...args: unknown[]) => findRequests(...args),
            count: (...args: unknown[]) => countRequestRows(...args),
        },
        $transaction: (...args: unknown[]) => transaction(...args),
    },
}));

const ada = { id: 'ada', name: 'Ada', image: null };
const bob = { id: 'bob', name: 'Bob', image: null };

/** Ada's routine: one day, one exercise of two working sets. */
const routine = {
    id: 'r1',
    creatorId: 'ada',
    workouts: [
        {
            id: 'w1',
            exercises: [
                {
                    id: 'e1',
                    sets: [
                        { kind: 'normal', repMode: 'range' },
                        { kind: 'normal', repMode: 'range' },
                    ],
                },
            ],
        },
    ],
};

beforeEach(() => {
    findFollows
        .mockReset()
        .mockResolvedValue([{ follower: ada, following: bob }]);
    findFollow.mockReset().mockResolvedValue(null);
    findRoutine.mockReset().mockResolvedValue(routine);
    findSessions.mockReset().mockResolvedValue([]);
});

const page = { skip: 0, take: 10 };

describe('followList', () => {
    // The two tabs read the same table from opposite ends, and getting the end
    // wrong would quietly show a profile its own follows back.
    it('asks for the rows pointing at the user, and lists who sent them', async () => {
        await expect(followList('bob', 'followers', page)).resolves.toEqual([
            ada,
        ]);
        expect(findFollows.mock.calls[0][0]).toMatchObject({
            where: { followingId: 'bob' },
            skip: 0,
            take: 10,
        });
    });

    it('asks for the rows the user sent, and lists who they point at', async () => {
        await expect(followList('ada', 'following', page)).resolves.toEqual([
            bob,
        ]);
        expect(findFollows.mock.calls[0][0]).toMatchObject({
            where: { followerId: 'ada' },
        });
    });
});

describe('isFollowing', () => {
    it('is false when there is no row', async () => {
        await expect(isFollowing('ada', 'bob')).resolves.toBe(false);
    });

    it('is true when there is one', async () => {
        findFollow.mockResolvedValue({ followerId: 'ada' });
        await expect(isFollowing('ada', 'bob')).resolves.toBe(true);
        expect(findFollow.mock.calls[0][0]).toMatchObject({
            where: {
                followerId_followingId: {
                    followerId: 'ada',
                    followingId: 'bob',
                },
            },
        });
    });
});

describe('routineHistory', () => {
    // The point of the whole thing: a member opening the history reads the
    // numbers of whoever trains the routine, never their own blank. Nothing
    // about who is looking reaches this function, which is what makes that
    // impossible to get wrong later.
    it('reads the log of whoever the routine belongs to', async () => {
        await routineHistory('r1');
        expect(findSessions).toHaveBeenCalledWith({
            where: { routineId: 'r1', userId: 'ada' },
            include: { logs: true },
        });
    });

    it('answers with nothing for a routine that is not there', async () => {
        findRoutine.mockResolvedValue(null);
        await expect(routineHistory('r1')).resolves.toBeNull();
        expect(findSessions).not.toHaveBeenCalled();
    });

    // Weeks are filed by day and then by week, so the history can draw a week
    // nobody trained: the plan says which sets it would have been. A log is
    // stored by slot and lands on wherever that set sits in the plan now.
    it('files every session under its day and week', async () => {
        findSessions.mockResolvedValue([
            {
                workoutId: 'w1',
                week: 2,
                completedAt: null,
                logs: [
                    {
                        exerciseId: 'e1',
                        slot: '2',
                        weight: 60,
                        reps: 8,
                        effort: 'hard',
                    },
                ],
            },
        ]);
        const history = await routineHistory('r1');
        expect(history?.byDay).toEqual({
            w1: { 2: { e1: { 1: { weight: 60, reps: 8, effort: 'hard' } } } },
        });
    });

    // An archived exercise keeps its logs for when it is named again, but the
    // history only draws what is being trained.
    it('reads only the exercises in the plan', async () => {
        await routineHistory('r1');
        expect(findRoutine.mock.calls[0][0]).toMatchObject({
            include: {
                workouts: {
                    include: { exercises: { where: { archived: false } } },
                },
            },
        });
    });
});

describe('routinesOf', () => {
    // The routines pages and the profile call it bare: workouts must not show
    // up on them.
    it('lists routines unless asked for workouts', async () => {
        findRoutines.mockReset().mockResolvedValue([]);
        await routinesOf('ada');
        expect(findRoutines.mock.calls[0][0].where).toMatchObject({
            creatorId: 'ada',
            kind: 'routine',
        });
        await routinesOf('ada', { kind: 'workout' });
        expect(findRoutines.mock.calls[1][0].where).toMatchObject({
            kind: 'workout',
        });
    });
});

describe('todayWorkout', () => {
    /** One day of one exercise of one set, done twice before and on the
        home screen for the third time. */
    const active = (kind: string) => ({
        id: 'r1',
        kind,
        isActive: true,
        cursor: 2,
        durationWeeks: null,
        workouts: [
            {
                id: 'w1',
                name: 'Legs',
                exercises: [
                    {
                        id: 'e1',
                        sets: [{ kind: 'normal', repMode: 'range' }],
                    },
                ],
            },
        ],
    });

    beforeEach(() => {
        findActive.mockReset();
        findSessions.mockResolvedValue([]);
        // Its one set is in: this time is over.
        findSession.mockReset().mockResolvedValue({
            id: 's3',
            workoutId: 'w1',
            completedAt: null,
            logs: [
                {
                    exerciseId: 'e1',
                    slot: '1',
                    weight: 60,
                    reps: 8,
                    effort: 'normal',
                },
            ],
        });
        moveRoutine.mockReset().mockReturnValue('move');
        closeSession.mockReset().mockReturnValue('close');
        transaction.mockReset().mockResolvedValue([]);
    });

    it('takes a finished workout off the home screen', async () => {
        findActive.mockResolvedValue(active('workout'));

        await expect(todayWorkout('ada')).resolves.toBeNull();
        expect(findSession.mock.calls[0][0].where).toEqual({
            userId_workoutId_week: { userId: 'ada', workoutId: 'w1', week: 3 },
        });
        expect(moveRoutine).toHaveBeenCalledWith({
            where: { id: 'r1', cursor: 2 },
            data: {
                cursor: { increment: 1 },
                isActive: false,
                pickedWorkoutId: null,
            },
        });
        expect(transaction).toHaveBeenCalledWith(['close', 'move']);
        // No next time is put in its place.
        expect(findActive).toHaveBeenCalledTimes(1);
    });

    it('moves a routine on to its next day and stays on it', async () => {
        findActive
            .mockResolvedValueOnce(active('routine'))
            .mockResolvedValueOnce(null);

        await todayWorkout('ada');
        expect(moveRoutine).toHaveBeenCalledWith({
            where: { id: 'r1', cursor: 2 },
            data: {
                cursor: { increment: 1 },
                isActive: undefined,
                pickedWorkoutId: null,
            },
        });
        expect(findActive).toHaveBeenCalledTimes(2);
    });

    // Two days a week, the cursor on week 2's last.
    const lastDay = () => {
        const routine = active('routine');
        return {
            ...routine,
            cursor: 3,
            pickedWorkoutId: null,
            workouts: [
                routine.workouts[0],
                { ...routine.workouts[0], id: 'w2', name: 'Push' },
            ],
        };
    };
    const w1 = (logs: unknown[]) => ({
        workoutId: 'w1',
        completedAt: new Date(),
        logs,
    });

    // The week still has a day to take up again: done, the last day stays
    // on screen as done, and the cursor in its week.
    it('keeps the last day of a week with days left incomplete', async () => {
        findActive.mockResolvedValueOnce(lastDay());
        findSession.mockResolvedValueOnce({
            id: 's3',
            workoutId: 'w2',
            completedAt: null,
            logs: [
                {
                    exerciseId: 'e1',
                    slot: '1',
                    weight: 60,
                    reps: 8,
                    effort: 'normal',
                },
            ],
        });
        // w2 is the one on screen, its one set just in.
        findSessions.mockResolvedValue([
            w1([]),
            {
                workoutId: 'w2',
                completedAt: null,
                logs: [
                    {
                        exerciseId: 'e1',
                        slot: '1',
                        weight: 60,
                        reps: 8,
                        effort: 'normal',
                    },
                ],
            },
        ]);

        const today = await todayWorkout('ada');
        expect(moveRoutine).not.toHaveBeenCalled();
        expect(closeSession).toHaveBeenCalled();
        expect(today).toMatchObject({
            workout: { id: 'w2' },
            started: true,
            choices: [{ id: 'w1', incomplete: true }],
        });
    });

    it('moves on from the last day once the week is done in full', async () => {
        findActive.mockResolvedValueOnce(lastDay()).mockResolvedValueOnce(null);
        findSession.mockResolvedValueOnce({
            id: 's3',
            workoutId: 'w2',
            completedAt: null,
            logs: [
                {
                    exerciseId: 'e1',
                    slot: '1',
                    weight: 60,
                    reps: 8,
                    effort: 'normal',
                },
            ],
        });
        findSessions.mockResolvedValue([
            w1([
                {
                    exerciseId: 'e1',
                    slot: '1',
                    weight: 60,
                    reps: 8,
                    effort: 'normal',
                },
            ]),
        ]);

        await todayWorkout('ada');
        expect(moveRoutine).toHaveBeenCalledWith({
            where: { id: 'r1', cursor: 3 },
            data: {
                cursor: { increment: 1 },
                isActive: undefined,
                pickedWorkoutId: null,
            },
        });
    });

    // Two days a week, the cursor on week 2's first and its second picked.
    const picked = () => {
        const routine = active('routine');
        return {
            ...routine,
            pickedWorkoutId: 'w2',
            workouts: [
                routine.workouts[0],
                { ...routine.workouts[0], id: 'w2', name: 'Push' },
            ],
        };
    };

    it('puts the picked day on screen, with the days left to pick', async () => {
        findActive.mockResolvedValueOnce(picked());
        findSession.mockResolvedValueOnce(null);

        const today = await todayWorkout('ada');
        expect(findSession.mock.calls[0][0].where).toEqual({
            userId_workoutId_week: { userId: 'ada', workoutId: 'w2', week: 2 },
        });
        expect(today).toMatchObject({
            day: 1,
            workout: { id: 'w2' },
            choices: [
                { id: 'w1', name: 'Legs', index: 0 },
                { id: 'w2', name: 'Push', index: 1 },
            ],
        });
    });

    // The cursor steps over it once it gets there, already complete.
    it('drops the pick once done and leaves the cursor where it was', async () => {
        findActive.mockResolvedValueOnce(picked()).mockResolvedValueOnce(null);

        await todayWorkout('ada');
        expect(moveRoutine).toHaveBeenCalledTimes(1);
        expect(moveRoutine).toHaveBeenCalledWith({
            where: { id: 'r1', pickedWorkoutId: 'w2' },
            data: { pickedWorkoutId: null },
        });
        expect(findActive).toHaveBeenCalledTimes(2);
    });

    // Closed with its blanks and picked to be taken up again: read until
    // started, and marked in what the day can be changed to.
    it('shows a picked day left incomplete, not under way', async () => {
        const closed = { workoutId: 'w2', completedAt: new Date(), logs: [] };
        findActive.mockResolvedValueOnce(picked());
        findSession.mockResolvedValueOnce({ id: 's2', ...closed });
        findSessions.mockResolvedValue([closed]);

        const today = await todayWorkout('ada');
        expect(moveRoutine).not.toHaveBeenCalled();
        expect(today).toMatchObject({
            workout: { id: 'w2' },
            started: false,
            choices: [
                { id: 'w1', incomplete: false },
                { id: 'w2', incomplete: true },
            ],
        });
    });

    // What it had when it was left is handed over, not to be edited; what
    // went in since is not.
    it('hands over what a day taken up again had when it was left', async () => {
        const routine = picked();
        const set = { kind: 'normal', repMode: 'range' };
        routine.workouts[1] = {
            ...routine.workouts[1],
            exercises: [{ id: 'e1', sets: [set, set, set] }],
        };
        const log = (slot: string, at: string) => ({
            exerciseId: 'e1',
            slot,
            weight: 60,
            reps: 8,
            effort: 'normal',
            createdAt: new Date(at),
        });
        findActive.mockResolvedValueOnce(routine);
        findSession.mockResolvedValueOnce({
            id: 's2',
            completedAt: null,
            leftAt: new Date('2026-10-01T10:00:00Z'),
            logs: [
                log('1', '2026-10-01T09:30:00Z'),
                log('2', '2026-10-02T18:00:00Z'),
            ],
        });

        const today = await todayWorkout('ada');
        expect(today).toMatchObject({ started: true });
        expect(today && 'locked' in today && today.locked).toEqual({
            e1: { 0: { weight: 60, reps: 8, effort: 'normal' } },
        });
    });
});

describe('the inboxes', () => {
    // Each section answers its own: routines in one, workouts in the other.
    it('keeps the routines and the workouts apart', async () => {
        findRequests.mockReset().mockResolvedValue([]);
        countRequestRows.mockReset().mockResolvedValue(0);

        await requestsOf('ada', page);
        await countRequests('ada');
        await requestsOf('ada', page, 'workout');
        await countRequests('ada', 'workout');

        const routines = { recipientId: 'ada', routine: { kind: 'routine' } };
        const workouts = { recipientId: 'ada', routine: { kind: 'workout' } };
        expect(findRequests.mock.calls.map(([q]) => q.where)).toEqual([
            routines,
            workouts,
        ]);
        expect(countRequestRows.mock.calls.map(([q]) => q.where)).toEqual([
            routines,
            workouts,
        ]);
    });
});
