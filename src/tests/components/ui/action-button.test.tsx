import { ActionButton } from '@/components/ui/action-button';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    acceptConfirm,
    confirmDialog,
    declineConfirm,
    openConfirm,
    withModals,
    withToasts,
} from '@/tests/setup-helpers';

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

    it('raises the error the action answers with', async () => {
        const action = vi.fn().mockResolvedValue({ error: 'Routine finished' });
        render(withToasts(<ActionButton action={action}>Go</ActionButton>));
        fireEvent.click(screen.getByRole('button', { name: 'Go' }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Routine finished'
        );
    });

    it('reports a throw as the generic message', async () => {
        const action = vi.fn().mockRejectedValue(new Error('internal detail'));
        render(withToasts(<ActionButton action={action}>Go</ActionButton>));
        fireEvent.click(screen.getByRole('button', { name: 'Go' }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Something went wrong'
        );
    });

    it('says the success message once the action is done', async () => {
        const action = vi.fn().mockResolvedValue(undefined);
        render(
            withToasts(
                <ActionButton
                    action={action}
                    success="Sent"
                >
                    Go
                </ActionButton>
            )
        );
        fireEvent.click(screen.getByRole('button', { name: 'Go' }));
        expect(await screen.findByRole('status')).toHaveTextContent('Sent');
    });

    it('leaves a redirect to the router and raises nothing', async () => {
        const redirect = Object.assign(new Error('NEXT_REDIRECT'), {
            digest: 'NEXT_REDIRECT;push;/routines;307;',
        });
        const onError = vi.fn((event: ErrorEvent) => event.preventDefault());
        window.addEventListener('error', onError);
        const action = vi.fn().mockRejectedValue(redirect);
        render(withToasts(<ActionButton action={action}>Go</ActionButton>));
        fireEvent.click(screen.getByRole('button', { name: 'Go' }));
        await waitFor(() => expect(action).toHaveBeenCalledOnce());
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        window.removeEventListener('error', onError);
    });

    // Duplicating or saving a routine ends in a redirect to the copy: that is
    // the action succeeding, so it is said as such.
    it('says the success message when the action redirects', async () => {
        const redirect = Object.assign(new Error('NEXT_REDIRECT'), {
            digest: 'NEXT_REDIRECT;push;/routines/r2;307;',
        });
        const onError = vi.fn((event: ErrorEvent) => event.preventDefault());
        window.addEventListener('error', onError);
        const action = vi.fn().mockRejectedValue(redirect);
        render(
            withToasts(
                <ActionButton
                    action={action}
                    success="Copy created"
                >
                    Go
                </ActionButton>
            )
        );
        fireEvent.click(screen.getByRole('button', { name: 'Go' }));
        expect(await screen.findByRole('status')).toHaveTextContent(
            'Copy created'
        );
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        window.removeEventListener('error', onError);
    });
});
