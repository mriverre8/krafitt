import {
    EditModeProvider,
    EditModeToggle,
} from '@/components/routine/edit-mode';
import { EmptyRoutine } from '@/components/routine/empty-routine';
import { ModalHost } from '@/components/modal/modal-host';
import { closeModal } from '@/store/modal';
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

/** As the routine page renders it: inside the provider, with the real toggle
    standing in for the routine's own Edit — the card no longer carries a way
    in, so the way in has to come from outside it — and the host that answers
    the dialog its button asks for. */
function setup() {
    renderWithLocale(
        <EditModeProvider>
            <EditModeToggle />
            <EmptyRoutine addDay={async () => ({})} />
            <ModalHost />
        </EditModeProvider>
    );
}

const edit = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

// The store outlives a render, so a dialog left open would greet the next test.
afterEach(() => closeModal());

describe('EmptyRoutine', () => {
    // Out of edit mode the card only describes. Edit already exists in the
    // routine's own options, and a second one here would be the same door
    // drawn twice.
    it('describes the shape of a routine, and presses nothing', () => {
        setup();
        expect(
            screen.getByRole('heading', { name: 'This routine is empty' })
        ).toBeInTheDocument();
        expect(
            screen.getByText(/One day for each session/)
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Add day' })
        ).not.toBeInTheDocument();
    });

    // There is no rack for it to step aside for — with no days there is nothing
    // to hang the + off — so inside the edit this card becomes the rack.
    it('asks for the first day once edit mode is open', async () => {
        setup();
        edit();

        // Heading, body and button all turn over together.
        expect(
            screen.getByRole('heading', { name: 'Start with the first day' })
        ).toBeInTheDocument();
        expect(screen.getByText(/Name the session/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Add day' }));
        expect(
            await screen.findByRole('textbox', { name: 'Day name' })
        ).toBeInTheDocument();
    });

    // A routine that can take no more days has nothing to ask for, so the card
    // goes back to describing however the edit mode reads.
    it('offers nothing when there is no day to add', () => {
        renderWithLocale(
            <EditModeProvider>
                <EditModeToggle />
                <EmptyRoutine />
            </EditModeProvider>
        );
        edit();
        expect(
            screen.getByRole('heading', { name: 'This routine is empty' })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Add day' })
        ).not.toBeInTheDocument();
    });
});
