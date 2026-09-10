import { ActionButton } from '@/components/action-button';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    acceptConfirm,
    confirmDialog,
    declineConfirm,
    openConfirm,
    withModals,
} from './setup-helpers';

const confirm = { title: 'Delete routine', message: 'Sure?' };

describe('ActionButton', () => {
    it('runs the action on click', async () => {
        const action = vi.fn().mockResolvedValue(undefined);
        render(<ActionButton action={action}>Delete</ActionButton>);
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        await waitFor(() => expect(action).toHaveBeenCalledOnce());
    });

    it('asks in a modal first and skips the action when declined', async () => {
        const action = vi.fn();
        render(
            withModals(
                <ActionButton
                    action={action}
                    confirm={confirm}
                >
                    Delete
                </ActionButton>
            )
        );
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(await openConfirm()).toHaveTextContent('Sure?');
        expect(action).not.toHaveBeenCalled();

        await declineConfirm();
        expect(confirmDialog()).not.toBeInTheDocument();
        expect(action).not.toHaveBeenCalled();
    });

    it('runs the action once the modal is accepted', async () => {
        const action = vi.fn().mockResolvedValue(undefined);
        render(
            withModals(
                <ActionButton
                    action={action}
                    confirm={confirm}
                >
                    Delete
                </ActionButton>
            )
        );
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        await acceptConfirm('Delete');

        await waitFor(() => expect(action).toHaveBeenCalledOnce());
        expect(confirmDialog()).not.toBeInTheDocument();
    });
});
