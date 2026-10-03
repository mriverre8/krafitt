import { MemberRows } from '@/components/routine/member-rows';
import { removeRoutineMember } from '@/app/actions';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    acceptConfirm,
    declineConfirm,
    withModals,
} from '@/tests/setup-helpers';

// A server component: it reads the locale off the request, which no test has.
vi.mock('@/i18n/server', async () => {
    const { createT, dictionaries } = await import('@/i18n/config');
    return { getT: async () => createT(dictionaries.en) };
});

vi.mock('@/app/actions', () => ({
    removeRoutineMember: vi.fn(),
}));

const members = vi.fn();
vi.mock('@/lib/queries', () => ({
    routineMembers: (...args: unknown[]) => members(...args),
}));

const ada = { id: 'ada', name: 'Ada', image: null };
const bob = { id: 'bob', name: 'Bob', image: null };

beforeEach(() => {
    members.mockReset().mockResolvedValue([ada, bob]);
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
            screen.getByText(/Add someone so they can follow the plan/)
        ).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    // The picture leads to the profile too for a pointer that aims at it, but
    // it is hidden from the accessibility tree — one row announces one link.
    it('names one link per person, and it is only their name', async () => {
        render(await rows());

        expect(screen.getAllByRole('link')).toHaveLength(2);
    });

    // Each button is wired to the person whose row it sits in — the bug this
    // catches is every row removing the first member in the list.
    it('binds each remove button to its own person', async () => {
        render(withModals(await rows()));

        fireEvent.click(screen.getByRole('button', { name: 'Remove Bob' }));
        await acceptConfirm('Delete');

        expect(removeRoutineMember).toHaveBeenCalledWith('r1', 'bob');
        expect(removeRoutineMember).not.toHaveBeenCalledWith('r1', 'ada');
    });

    // Taking somebody out is not undoable from here, so it asks first.
    it('leaves the person alone when the question is declined', async () => {
        render(withModals(await rows()));

        fireEvent.click(screen.getByRole('button', { name: 'Remove Ada' }));
        await declineConfirm();

        expect(removeRoutineMember).not.toHaveBeenCalled();
    });
});
