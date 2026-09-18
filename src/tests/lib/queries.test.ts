import { followList, isFollowing } from '@/lib/queries';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFollows = vi.fn();
const findFollow = vi.fn();

vi.mock('@/lib/db', () => ({
    prisma: {
        follow: {
            findMany: (...args: unknown[]) => findFollows(...args),
            findUnique: (...args: unknown[]) => findFollow(...args),
        },
    },
}));

const ada = { id: 'ada', name: 'Ada', image: null };
const bob = { id: 'bob', name: 'Bob', image: null };

beforeEach(() => {
    findFollows
        .mockReset()
        .mockResolvedValue([{ follower: ada, following: bob }]);
    findFollow.mockReset().mockResolvedValue(null);
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
