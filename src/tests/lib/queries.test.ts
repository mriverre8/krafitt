import { followList, isFollowing, routineHistory } from '@/lib/queries';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFollows = vi.fn();
const findFollow = vi.fn();
const findRoutine = vi.fn();
const findSessions = vi.fn();

vi.mock('@/lib/db', () => ({
    prisma: {
        follow: {
            findMany: (...args: unknown[]) => findFollows(...args),
            findUnique: (...args: unknown[]) => findFollow(...args),
        },
        routine: { findUnique: (...args: unknown[]) => findRoutine(...args) },
        workoutSession: {
            findMany: (...args: unknown[]) => findSessions(...args),
        },
    },
}));

const ada = { id: 'ada', name: 'Ada', image: null };
const bob = { id: 'bob', name: 'Bob', image: null };

/** Ada's routine, one day, one exercise, no sets prescribed. */
const routine = { id: 'r1', creatorId: 'ada', workouts: [] };

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
    // The point of the whole thing: a coach opening the history reads the
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
    // nobody trained: the plan says which sets it would have been.
    it('files every session under its day and week', async () => {
        findSessions.mockResolvedValue([
            {
                workoutId: 'w1',
                week: 2,
                logs: [
                    {
                        exerciseId: 'e1',
                        setIndex: 0,
                        weight: 60,
                        reps: 8,
                        effort: 'hard',
                    },
                ],
            },
        ]);
        const history = await routineHistory('r1');
        expect(history?.byDay).toEqual({
            w1: { 2: { e1: { 0: { weight: 60, reps: 8, effort: 'hard' } } } },
        });
    });
});
