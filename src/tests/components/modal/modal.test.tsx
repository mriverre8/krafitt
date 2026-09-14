import { Modal } from '@/components/modal/modal';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

function open() {
    const onClose = vi.fn();
    render(
        <Modal
            title="Settings"
            onClose={onClose}
        >
            <button type="button">inside</button>
        </Modal>
    );
    return { onClose, dialog: screen.getByRole('dialog') };
}

describe('Modal', () => {
    // showModal(), never the open attribute: mounting is the whole lifecycle.
    it('opens itself, under its title', () => {
        const { dialog } = open();
        expect(dialog).toHaveAttribute('open');
        expect(dialog).toHaveAccessibleName('Settings');
    });

    it('closes from its own close button', () => {
        const { onClose } = open();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    // The card fills the dialog edge to edge, so a click that lands on the
    // dialog itself came from the backdrop.
    it('closes on the backdrop and stays put on the card', () => {
        const { onClose, dialog } = open();
        fireEvent.click(screen.getByText('inside'));
        expect(onClose).not.toHaveBeenCalled();

        fireEvent.click(dialog);
        expect(onClose).toHaveBeenCalledOnce();
    });

    // Escape has to close through the host: the native close would leave this
    // mounted and invisible with the store still saying it is open.
    it('routes Escape through onClose rather than closing itself', () => {
        const { onClose, dialog } = open();
        const cancel = new Event('cancel', { cancelable: true });
        fireEvent(dialog, cancel);

        expect(onClose).toHaveBeenCalledOnce();
        expect(cancel.defaultPrevented).toBe(true);
    });
});
