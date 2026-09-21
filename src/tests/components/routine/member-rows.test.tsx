import { MemberRows } from '@/components/routine/member-rows';
import { removeRoutineMember, setRoutineMember } from '@/app/actions';
import { render, screen } from '@testing-library/react';
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

    // Only the owner reaches this page, so every row is one they may move.
    // The select is the one place a role is decided — the search says nothing
    // about roles, so there are not two controls to keep in step.
    it('gives every row a role control set to what that person holds', async () => {
        render(await rows());

        expect(
            screen.getByRole('combobox', { name: 'Role of Ada' })
        ).toHaveValue('coach');
        expect(
            screen.getByRole('combobox', { name: 'Role of Bob' })
        ).toHaveValue('scout');
    });

    // Taking somebody out is not undoable from here, so it asks first.
    it('asks before taking somebody out', async () => {
        render(withModals(await rows()));

        screen.getByRole('button', { name: 'Remove Ada' }).click();
        expect(removeRoutineMember).not.toHaveBeenCalled();

        await acceptConfirm('Delete');
        expect(removeRoutineMember).toHaveBeenCalledWith('r1', 'ada');
    });
});
