import { DeleteRoutineButton } from '@/components/delete-routine-button';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    acceptConfirm,
    declineConfirm,
    openConfirm,
    withModals,
} from './setup-helpers';

const button = () => screen.getByRole('button', { name: /Delete routine/ });

const renderButton = (onDelete: () => Promise<unknown>) =>
    render(
        withModals(
            <DeleteRoutineButton
                name="Strength"
                onDelete={onDelete}
            />
        )
    );

describe('DeleteRoutineButton', () => {
    it('deletes the routine once the confirmation is accepted', async () => {
        const onDelete = vi.fn().mockResolvedValue(undefined);
        renderButton(onDelete);

        fireEvent.click(button());
        await acceptConfirm('Delete');
        await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
    });

    // Nothing about a deleted routine comes back, so a mis-click must cost
    // nothing.
    it('keeps the routine when the confirmation is declined', async () => {
        const onDelete = vi.fn();
        renderButton(onDelete);

        fireEvent.click(button());
        await declineConfirm();
        expect(onDelete).not.toHaveBeenCalled();
    });

    it('names the routine in the confirmation', async () => {
        renderButton(vi.fn());

        fireEvent.click(button());
        expect(await openConfirm()).toHaveTextContent(
            'Delete the routine Strength? All progress is lost.'
        );
    });
});
