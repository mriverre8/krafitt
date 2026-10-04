import { SendRoutineModal } from '@/components/modal/send-routine-modal';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

const find = vi.fn();
const send = vi.fn();
const onClose = vi.fn();

const ada = { id: 'ada', name: 'Ada', image: null };

beforeEach(() => {
    vi.clearAllMocks();
    find.mockResolvedValue({ found: ada });
    send.mockResolvedValue(undefined);
});

function setup() {
    renderWithLocale(
        <SendRoutineModal
            find={find}
            send={send}
            onClose={onClose}
        />
    );
    const field = screen.getByRole('textbox', { name: "User's account" });
    const sendButton = screen.getByRole('button', { name: 'Send routine' });
    const type = (value: string) =>
        fireEvent.change(field, { target: { value } });
    const search = () =>
        fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    return { field, sendButton, type, search };
}

describe('SendRoutineModal', () => {
    it('cannot search an empty field, nor send before anyone is found', () => {
        const { sendButton } = setup();

        expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
        expect(sendButton).toBeDisabled();
    });

    it('swaps the search for a check once someone is found', async () => {
        const { sendButton, type, search } = setup();
        type('Ada@Example.com');
        search();

        expect(
            await screen.findByRole('img', { name: 'Person found' })
        ).toBeInTheDocument();
        expect(screen.queryByText('Ada')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Search' })
        ).not.toBeInTheDocument();
        expect(sendButton).toBeEnabled();
        expect(find).toHaveBeenCalledWith('ada@example.com');
    });

    // The found person is remembered with their address: editing it away
    // brings the search back, and typing it again is the check with no
    // second trip to the server.
    it('forgets the check on an edit and gets it back on the same address', async () => {
        const { sendButton, type, search } = setup();
        type('ada@example.com');
        search();
        await screen.findByRole('img', { name: 'Person found' });

        type('ada@example.co');
        expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled();
        expect(sendButton).toBeDisabled();

        type('ada@example.com');
        expect(
            screen.getByRole('img', { name: 'Person found' })
        ).toBeInTheDocument();
        expect(find).toHaveBeenCalledTimes(1);
    });

    it('reports an email no account uses', async () => {
        find.mockResolvedValue({ error: 'No account uses that email' });
        const { sendButton, type, search } = setup();
        type('nobody@example.com');
        search();

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'No account uses that email'
        );
        expect(sendButton).toBeDisabled();
    });

    it('sends to the person found, with the member choice, and closes', async () => {
        const { sendButton, type, search } = setup();
        type('ada@example.com');
        search();
        await screen.findByRole('img', { name: 'Person found' });

        fireEvent.click(
            screen.getByRole('checkbox', {
                name: 'Add me as a member of their copy',
            })
        );
        fireEvent.click(sendButton);

        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(send).toHaveBeenCalledWith('ada', true);
    });
});
