import { FollowRows } from '@/components/profile/follow-rows';
import { LOAD_SIZE } from '@/lib/pagination';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// A server component: it reads the locale off the request, which no test has.
vi.mock('@/i18n/server', async () => {
    const { createT, dictionaries } = await import('@/i18n/config');
    return { getT: async () => createT(dictionaries.en) };
});

// The rows carry a server component of their own, which the client renderer
// cannot await. It has its own suite: here it only has to say what it was told.
vi.mock('@/components/profile/follow-button', () => ({
    FollowButton: ({
        userId,
        following,
    }: {
        userId: string;
        following: boolean;
    }) => (
        <button data-testid={`follow-${userId}`}>
            {following ? 'Followed' : 'Follow'}
        </button>
    ),
}));

const list = vi.fn();
const among = vi.fn();
vi.mock('@/lib/queries', () => ({
    followList: (...args: unknown[]) => list(...args),
    followingAmong: (...args: unknown[]) => among(...args),
}));

const ada = { id: 'ada', name: 'Ada', image: null };
const bob = { id: 'bob', name: 'Bob', image: null };

beforeEach(() => {
    list.mockReset().mockResolvedValue([ada, bob]);
    among.mockReset().mockResolvedValue(new Set<string>());
});

const rows = (props: Partial<Parameters<typeof FollowRows>[0]> = {}) =>
    FollowRows({
        id: 'cleo',
        tab: 'followers',
        viewerId: 'cleo',
        asked: undefined,
        total: 2,
        ...props,
    });

describe('FollowRows', () => {
    it('links every person to their own profile', async () => {
        render(await rows());

        expect(screen.getByRole('link', { name: 'Ada' })).toHaveAttribute(
            'href',
            '/profile/ada'
        );
        expect(screen.getByRole('link', { name: 'Bob' })).toHaveAttribute(
            'href',
            '/profile/bob'
        );
    });

    // The list is one side of a follow, so the viewer can be standing in it —
    // and a button offering to follow yourself would be a dead end.
    it('offers a follow button for everyone but the viewer', async () => {
        render(await rows({ viewerId: 'ada' }));

        expect(screen.queryByTestId('follow-ada')).not.toBeInTheDocument();
        expect(screen.getByTestId('follow-bob')).toBeInTheDocument();
    });

    it('marks the people the viewer already follows', async () => {
        among.mockResolvedValue(new Set(['bob']));
        render(await rows());

        expect(screen.getByTestId('follow-ada')).toHaveTextContent('Follow');
        expect(screen.getByTestId('follow-bob')).toHaveTextContent('Followed');
        expect(among).toHaveBeenCalledWith('cleo', ['ada', 'bob']);
    });

    // Every press reads from the top with a bigger window rather than fetching
    // the next slice, so the rows already on screen keep their place.
    it('reads the list from the top, clamped by loadMore', async () => {
        render(await rows({ asked: '120', total: 200 }));

        expect(list).toHaveBeenCalledWith('cleo', 'followers', {
            skip: 0,
            take: 120,
        });
    });

    it('asks the next window from the tab it is showing', async () => {
        render(await rows({ tab: 'following', total: 200 }));

        expect(screen.getByRole('link', { name: 'Load more' })).toHaveAttribute(
            'href',
            `/profile/cleo/follows?tab=following&shown=${LOAD_SIZE * 2}`
        );
    });

    it('drops the button once the whole list is on screen', async () => {
        render(await rows({ total: 2 }));

        expect(
            screen.queryByRole('link', { name: 'Load more' })
        ).not.toBeInTheDocument();
    });

    it('says which side is empty, since the two read differently', async () => {
        list.mockResolvedValue([]);

        render(await rows({ tab: 'followers', total: 0 }));
        expect(screen.getByText('No followers yet.')).toBeInTheDocument();

        render(await rows({ tab: 'following', total: 0 }));
        expect(
            screen.getByText('Not following anyone yet.')
        ).toBeInTheDocument();
    });
});
