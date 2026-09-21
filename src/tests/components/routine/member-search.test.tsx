import { MemberSearch } from '@/components/routine/member-search';
import { findRoutineMember, setRoutineMember } from '@/app/actions';
import type { MemberSearchState } from '@/lib/forms';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

vi.mock('@/app/actions', () => ({
    findRoutineMember: vi.fn(),
    setRoutineMember: vi.fn(),
}));

const search = vi.mocked(findRoutineMember);
const add = vi.mocked(setRoutineMember);

const ada = { id: 'ada', name: 'Ada', image: null };

/** Whatever the next search answers with. */
const answers = (state: MemberSearchState) =>
    search.mockResolvedValue(state as never);

beforeEach(() => {
    search.mockReset();
    add.mockReset().mockResolvedValue(undefined);
    answers({ ok: true, found: ada });
});

function setup() {
    renderWithLocale(<MemberSearch routineId="r1" />);
    const field = screen.getByRole('textbox', { name: 'Search people' });
    const button = screen.getByRole('button', { name: 'Search' });
    return { field, button };
}

const look = (email = 'ada@example.com') => {
    const { field, button } = setup();
    fireEvent.change(field, { target: { value: email } });
    fireEvent.click(button);
    return { field, button };
};

describe('MemberSearch', () => {
    // The whole reason it is a button and not a timer: one lookup per ask,
    // never one per keystroke.
    it('searches only when asked, never as you type', async () => {
        const { field, button } = setup();

        fireEvent.change(field, { target: { value: 'ada@example.com' } });
        expect(search).not.toHaveBeenCalled();

        fireEvent.click(button);
        await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
    });

    it('shows whoever it found, with a way to add them', async () => {
        look();

        expect(await screen.findByText('Ada')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });

    it('reports an email no account uses', async () => {
        answers({ error: 'No account uses that email' });
        look('nobody@example.com');

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'No account uses that email'
        );
        expect(
            screen.queryByRole('button', { name: 'Add' })
        ).not.toBeInTheDocument();
    });

    // Already in the routine is the one answer that is neither a find nor a
    // mistake: it is said plainly, and there is nothing to press. Roles are
    // moved in the list, so this is not a second place to do it.
    it('says so when the person is already in, and offers no button', async () => {
        answers({ notice: 'Ada is already on this routine' });
        look();

        expect(await screen.findByRole('status')).toHaveTextContent(
            'Ada is already on this routine'
        );
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Add' })
        ).not.toBeInTheDocument();
    });

    // Least privilege on the one click that happens before anyone thinks
    // about roles: what they may actually do is decided in the list.
    it('adds the person it found as a scout, not a coach', async () => {
        look();

        fireEvent.click(await screen.findByRole('button', { name: 'Add' }));

        await waitFor(() =>
            expect(add).toHaveBeenCalledWith('r1', 'ada', 'scout')
        );
    });

    // Once they are standing in the list below, the card has nothing left to
    // say — and pressing Add twice must not read as a second person.
    it('puts the card away once the person is in', async () => {
        look();
        fireEvent.click(await screen.findByRole('button', { name: 'Add' }));

        await waitFor(() =>
            expect(
                screen.queryByRole('button', { name: 'Add' })
            ).not.toBeInTheDocument()
        );
    });
});
