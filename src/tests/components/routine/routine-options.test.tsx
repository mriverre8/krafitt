import {
    EditModeProvider,
    EditModeToggle,
    WhenEditing,
    WhenNotEditing,
} from '@/components/routine/edit-mode';
import { RoutineOptions } from '@/components/routine/routine-options';
import type { FormAction } from '@/lib/forms';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale, withModals } from '@/tests/setup-helpers';

/** The header of the routine page, which is the only thing that renders the
    menu — and only out of edit mode, and only for the owner. */
function setup({
    rename = vi.fn<FormAction>(async () => ({ ok: true })),
    onDelete = vi.fn(async () => {}),
    setVisibility = vi.fn(async () => {}),
    /** As the page passes them: no rename once finished, no edit once locked. */
    finished = false,
    editable = true,
    isPublic = false,
} = {}) {
    renderWithLocale(
        withModals(
            <EditModeProvider>
                <WhenNotEditing>
                    <RoutineOptions
                        name="Push Pull Legs"
                        rename={finished ? undefined : rename}
                        onDelete={onDelete}
                        editable={editable}
                        isPublic={isPublic}
                        setVisibility={setVisibility}
                    />
                </WhenNotEditing>
                <WhenEditing>
                    <EditModeToggle />
                </WhenEditing>
            </EditModeProvider>
        )
    );
    return { rename, onDelete, setVisibility };
}

const options = () => screen.getByRole('button', { name: 'Options' });

describe('RoutineOptions', () => {
    it('holds every routine-level move behind one trigger', () => {
        setup();
        expect(screen.queryByText('Rename routine')).not.toBeInTheDocument();

        fireEvent.click(options());
        expect(screen.getByText('Rename routine')).toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete routine')).toBeInTheDocument();
    });

    it('still renames a routine that is locked but not finished', () => {
        setup({ editable: false });
        fireEvent.click(options());

        expect(screen.getByText('Rename routine')).toBeInTheDocument();
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('still offers to share a routine that is finished and locked', () => {
        setup({ finished: true, editable: false });
        fireEvent.click(options());

        // A finished block is the one most worth passing on, so sharing
        // outlives both renaming and editing.
        expect(screen.queryByText('Rename routine')).not.toBeInTheDocument();
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.getByText('Make public')).toBeInTheDocument();
        expect(screen.getByText('Delete routine')).toBeInTheDocument();
    });

    it('shares a private routine from the menu', async () => {
        const { setVisibility } = setup();
        fireEvent.click(options());
        fireEvent.click(screen.getByText('Make public'));

        await waitFor(() => expect(setVisibility).toHaveBeenCalledWith(true));
    });

    it('offers the way back once it is public', async () => {
        const { setVisibility } = setup({ isPublic: true });
        fireEvent.click(options());
        expect(screen.queryByText('Make public')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Make private'));

        await waitFor(() => expect(setVisibility).toHaveBeenCalledWith(false));
    });

    it('gives way to a bare Done once editing', () => {
        setup();
        fireEvent.click(options());
        fireEvent.click(screen.getByText('Edit'));

        expect(screen.queryByRole('button', { name: 'Options' })).toBeNull();
        expect(screen.queryByText('Delete routine')).not.toBeInTheDocument();
        expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('deletes from the menu, once confirmed', async () => {
        const { onDelete } = setup();
        fireEvent.click(options());
        fireEvent.click(screen.getByText('Delete routine'));

        const dialog = await screen.findByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
        await waitFor(() => expect(onDelete).toHaveBeenCalled());
    });

    it('renames through the dialog, opening on the current name', async () => {
        const { rename } = setup();
        fireEvent.click(options());
        fireEvent.click(screen.getByText('Rename routine'));

        const dialog = await screen.findByRole('dialog');
        const field = within(dialog).getByRole('textbox');
        const save = within(dialog).getByRole('button', { name: 'Save' });
        expect(field).toHaveValue('Push Pull Legs');
        // Nothing to save until the name actually changes.
        expect(save).toBeDisabled();

        fireEvent.change(field, { target: { value: 'Upper Lower' } });
        expect(save).toBeEnabled();
        fireEvent.click(save);

        await waitFor(() => expect(rename).toHaveBeenCalled());
        expect(rename.mock.calls[0][1].get('name')).toBe('Upper Lower');

        // Saved is the one way out of the dialog that is not a cancel.
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        );
    });
});
