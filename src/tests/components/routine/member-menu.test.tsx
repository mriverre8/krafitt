import { MemberMenu } from '@/components/routine/member-menu';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    acceptConfirm,
    declineConfirm,
    renderWithLocale,
    withModals,
} from '@/tests/setup-helpers';

function setup(role = 'coach') {
    const setRole = vi.fn(async () => {});
    const onRemove = vi.fn(async () => {});
    renderWithLocale(
        withModals(
            <MemberMenu
                name="Ada"
                role={role}
                setRole={setRole}
                onRemove={onRemove}
            />
        )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Options for Ada' }));
    return { setRole, onRemove };
}

describe('MemberMenu', () => {
    // With two roles there is nothing to choose from: the only move is the
    // other one, so the row names it rather than asking.
    it('offers the role the person is not', async () => {
        setup('coach');

        expect(
            await screen.findByRole('button', { name: 'Change to Scout' })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Change to Coach' })
        ).not.toBeInTheDocument();
    });

    it('offers the other way round for a scout', async () => {
        setup('scout');

        expect(
            await screen.findByRole('button', { name: 'Change to Coach' })
        ).toBeInTheDocument();
    });

    it('writes the role it named', async () => {
        const { setRole } = setup('scout');

        fireEvent.click(
            await screen.findByRole('button', { name: 'Change to Coach' })
        );

        await waitFor(() => expect(setRole).toHaveBeenCalledWith('coach'));
    });

    // Swapping a role is one click and undone by one more, so it asks nothing.
    // Taking somebody out is not undoable from here, so it does.
    it('asks before taking somebody out, and not before a swap', async () => {
        const { onRemove } = setup();

        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
        expect(onRemove).not.toHaveBeenCalled();

        await acceptConfirm('Delete');
        expect(onRemove).toHaveBeenCalled();
    });

    it('leaves the person alone when the question is declined', async () => {
        const { onRemove } = setup();

        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
        await declineConfirm();

        expect(onRemove).not.toHaveBeenCalled();
    });
});
