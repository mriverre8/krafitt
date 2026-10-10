import { MemberRows } from '@/components/routine/member-rows';
import { cancelRoutineInvite, removeRoutineMember } from '@/app/actions';
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
    cancelRoutineInvite: vi.fn(),
}));

const members = vi.fn();
const invites = vi.fn();
vi.mock('@/lib/queries', () => ({
    routineMembers: (...args: unknown[]) => members(...args),
    routineInvites: (...args: unknown[]) => invites(...args),
}));

const ada = { id: 'ada', name: 'Ada', image: null };
const bob = { id: 'bob', name: 'Bob', image: null };
const cleo = { id: 'cleo', name: 'Cleo', image: null };

beforeEach(() => {
    members.mockReset().mockResolvedValue([ada, bob]);
    invites.mockReset().mockResolvedValue([]);
    vi.mocked(removeRoutineMember).mockReset().mockResolvedValue(undefined);
    vi.mocked(cancelRoutineInvite).mockReset().mockResolvedValue(undefined);
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

    // Asked but not answered: the same card, marked pending, after the members.
    it('lists whoever has not answered yet as pending', async () => {
        invites.mockResolvedValue([cleo]);
        render(await rows());

        const [, , last] = screen.getAllByRole('listitem');
        expect(last).toHaveTextContent('Cleo');
        expect(last).toHaveTextContent('Pending');
        expect(screen.getAllByText('Pending')).toHaveLength(1);
    });

    it('is not empty while somebody is still to answer', async () => {
        members.mockResolvedValue([]);
        invites.mockResolvedValue([cleo]);
        render(await rows());

        expect(
            screen.queryByRole('heading', { name: 'Nobody else is in' })
        ).not.toBeInTheDocument();
    });

    // A pending row has no member to remove: its button takes the invitation back.
    it('takes the invitation back from a pending row', async () => {
        invites.mockResolvedValue([cleo]);
        render(withModals(await rows()));

        fireEvent.click(screen.getByRole('button', { name: 'Remove Cleo' }));
        expect(
            await screen.findByText('Cancel the invitation to Cleo?')
        ).toBeInTheDocument();
        await acceptConfirm('Delete');

        expect(cancelRoutineInvite).toHaveBeenCalledWith('r1', 'cleo');
        expect(removeRoutineMember).not.toHaveBeenCalled();
    });
});
