import { MemberRows } from '@/components/routine/member-rows';
import { removeRoutineMember, setRoutineMember } from '@/app/actions';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { acceptConfirm, withModals } from '@/tests/setup-helpers';

// A server component: it reads the locale off the request, which no test has.
vi.mock('@/i18n/server', async () => {
    const { createT, dictionaries } = await import('@/i18n/config');
    return { getT: async () => createT(dictionaries.en) };
});

vi.mock('@/app/actions', () => ({
    setRoutineMember: vi.fn(),
    removeRoutineMember: vi.fn(),
}));

const members = vi.fn();
vi.mock('@/lib/queries', () => ({
    routineMembers: (...args: unknown[]) => members(...args),
}));

const ada = { id: 'ada', name: 'Ada', image: null, role: 'coach' as const };
const bob = { id: 'bob', name: 'Bob', image: null, role: 'scout' as const };

beforeEach(() => {
    members.mockReset().mockResolvedValue([ada, bob]);
    vi.mocked(setRoutineMember).mockReset().mockResolvedValue(undefined);
    vi.mocked(removeRoutineMember).mockReset().mockResolvedValue(undefined);
});

const rows = () => MemberRows({ routineId: 'r1' });

describe('MemberRows', () => {
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

    // A card in the home screen's empty-state language, but with no button of
    // its own: the one that fills the page stands right underneath it.
    it('says so when nobody else is in, and offers nothing', async () => {
        members.mockResolvedValue([]);
        render(await rows());

        expect(
            screen.getByRole('heading', { name: 'Nobody else is in' })
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Add a coach to work on the plan with you/)
        ).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    // The role is read, not operated: a control stating a fact would make
    // every row a thing to adjust rather than a person to look at.
    it('reads the role under the name', async () => {
        render(await rows());

        const ada = screen.getByRole('link', { name: 'Ada' })
            .parentElement as HTMLElement;
        expect(within(ada).getByText('Coach')).toBeInTheDocument();

        const bob = screen.getByRole('link', { name: 'Bob' })
            .parentElement as HTMLElement;
        expect(within(bob).getByText('Scout')).toBeInTheDocument();
    });

    // The link goes to a profile, so its name is the person and nothing else:
    // with the role inside it, a screen reader would read "Ada Coach". The
    // picture leads to the same place for a pointer that aims at it, but it is
    // hidden from the accessibility tree — one row announces one link.
    it('names one link per person, and it is only their name', async () => {
        render(await rows());

        expect(screen.getAllByRole('link')).toHaveLength(2);
    });

    // What the menu offers is its own suite's business. What this layer owns
    // is that each one is wired to the person whose row it sits in — the bug
    // this catches is every row removing the first member in the list.
    it('binds each menu to its own person', async () => {
        render(withModals(await rows()));

        fireEvent.click(
            screen.getByRole('button', { name: 'Options for Bob' })
        );
        fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
        await acceptConfirm('Delete');

        expect(removeRoutineMember).toHaveBeenCalledWith('r1', 'bob');
        expect(removeRoutineMember).not.toHaveBeenCalledWith('r1', 'ada');
    });
});
