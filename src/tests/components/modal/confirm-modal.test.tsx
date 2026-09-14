import { ConfirmModal } from '@/components/modal/confirm-modal';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const base = { title: 'Delete routine', message: 'All progress is lost.' };

function open(props: Partial<React.ComponentProps<typeof ConfirmModal>> = {}) {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
        <ConfirmModal
            {...base}
            onConfirm={onConfirm}
            onClose={onClose}
            {...props}
        />
    );
    return { onConfirm, onClose };
}

describe('ConfirmModal', () => {
    it('asks with the title and the message it was given', () => {
        open();
        expect(screen.getByRole('dialog')).toHaveAccessibleName(
            'Delete routine'
        );
        expect(screen.getByText('All progress is lost.')).toBeInTheDocument();
    });

    // Most of these guard a delete, and the button always names the move.
    it('commits under Delete, or under the label it was given', () => {
        const { unmount } = render(
            <ConfirmModal
                {...base}
                onConfirm={vi.fn()}
                onClose={vi.fn()}
            />
        );
        expect(
            screen.getByRole('button', { name: 'Delete' })
        ).toBeInTheDocument();
        unmount();

        open({ confirmLabel: 'Sign out' });
        expect(
            screen.getByRole('button', { name: 'Sign out' })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Delete' })
        ).not.toBeInTheDocument();
    });

    it('leaves the action alone when cancelled', () => {
        const { onConfirm, onClose } = open();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalledOnce();
        expect(onConfirm).not.toHaveBeenCalled();
    });

    // Closed first, then run: the action may open a modal of its own, and the
    // second one must not be the one that gets cleared.
    it('closes before running the action', () => {
        const order: string[] = [];
        render(
            <ConfirmModal
                {...base}
                onConfirm={() => order.push('confirm')}
                onClose={() => order.push('close')}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(order).toEqual(['close', 'confirm']);
    });
});
