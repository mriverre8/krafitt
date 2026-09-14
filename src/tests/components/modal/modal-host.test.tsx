import { ModalHost } from '@/components/modal/modal-host';
import { showModal, useModalStore } from '@/store/modal';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const confirm = (onConfirm = vi.fn()) => ({
    title: 'Delete routine',
    message: 'All progress is lost.',
    onConfirm,
});

describe('ModalHost', () => {
    it('shows nothing while nothing is open', () => {
        const { container } = render(<ModalHost />);
        expect(container).toBeEmptyDOMElement();
    });

    // Rendered is the same thing as open: the store is the whole lifecycle.
    it('mounts whichever modal the store opened, with its props', async () => {
        render(<ModalHost />);
        act(() => showModal('confirm', confirm()));

        expect(
            await screen.findByRole('dialog', { name: 'Delete routine' })
        ).toHaveTextContent('All progress is lost.');
    });

    // Nothing that opens a modal has to know how to close it, so the onClose
    // the host supplies is the one that clears the store.
    it('hands the modal an onClose that empties the store', async () => {
        render(<ModalHost />);
        act(() => showModal('confirm', confirm()));
        await screen.findByRole('dialog');

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(useModalStore.getState().open).toBeNull();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
