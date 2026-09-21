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
import {
    acceptConfirm,
    renderWithLocale,
    withModals,
} from '@/tests/setup-helpers';

/** The header of the routine page, which is the only thing that renders the
    menu — and only out of edit mode, and only for the owner. */
function setup({
    rename = vi.fn<FormAction>(async () => ({ ok: true })),
    setDuration = vi.fn<FormAction>(async () => ({ ok: true })),
    onDelete = vi.fn(async () => {}),
    setVisibility = vi.fn(async () => {}),
    /** As the page passes it: absent for an open-ended routine, or one over. */
    duration = { weeks: 8, min: 3 } as { weeks: number; min: number } | null,
    /** As the page passes them: no rename once finished, no edit once locked. */
    finished = false,
    editable = true,
    isPublic = false,
    /** As the page passes them: a coach is handed the menu without the rows
        that belong to the owner alone. */
    people = { href: '/routines/r1/people', count: 3 } as
        { href: string; count: number } | undefined,
    onLeave = vi.fn(async () => {}),
    owner = true,
    /** As the page passes them: a scout changes nothing, so every row but the
        people of the routine falls away. */
    editor = true,
} = {}) {
    renderWithLocale(
        withModals(
            <EditModeProvider>
                <WhenNotEditing>
                    <RoutineOptions
                        name="Push Pull Legs"
                        rename={!editor || finished ? undefined : rename}
                        duration={
                            editor && duration
                                ? { ...duration, save: setDuration }
                                : undefined
                        }
                        people={owner ? people : undefined}
                        onLeave={owner ? undefined : onLeave}
                        onDelete={owner ? onDelete : undefined}
                        editable={editor && editable}
                        isPublic={isPublic}
                        setVisibility={owner ? setVisibility : undefined}
                    />
                </WhenNotEditing>
                <WhenEditing>
                    <EditModeToggle />
                </WhenEditing>
            </EditModeProvider>
        )
    );
    return { rename, setDuration, onDelete, setVisibility };
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

    it('leaves the duration out when there is none to move', () => {
        setup({ duration: null });
        fireEvent.click(options());
        expect(screen.queryByText('Change duration')).not.toBeInTheDocument();
    });

    // Cutting a block short or running it on is the one edit a locked routine
    // still takes, so it holds the floor the page worked out.
    it('changes the duration through the dialog, no lower than its floor', async () => {
        const { setDuration } = setup({ editable: false });
        fireEvent.click(options());
        fireEvent.click(screen.getByText('Change duration'));

        const dialog = await screen.findByRole('dialog');
        const field = within(dialog).getByRole('spinbutton');
        const save = within(dialog).getByRole('button', { name: 'Save' });
        expect(field).toHaveValue(8);
        expect(field).toHaveAttribute('min', '3');
        expect(field).toHaveAttribute('max', '52');
        expect(save).toBeDisabled();

        fireEvent.change(field, { target: { value: '2' } });
        expect(save).toBeDisabled();

        fireEvent.change(field, { target: { value: '12' } });
        expect(save).toBeEnabled();
        fireEvent.click(save);

        await waitFor(() => expect(setDuration).toHaveBeenCalled());
        expect(setDuration.mock.calls[0][1].get('durationWeeks')).toBe('12');
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        );
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

describe('RoutineOptions for someone who was let in', () => {
    // Who else is watching a person's numbers is theirs to know: the list is
    // the owner's page, and nobody else is even told it is there.
    it('never points anyone but the owner at the people of the routine', async () => {
        setup({ owner: false });

        fireEvent.click(screen.getByRole('button', { name: 'Options' }));
        await screen.findByRole('button', { name: /Leave routine/ });
        expect(
            screen.queryByRole('link', { name: /People/ })
        ).not.toBeInTheDocument();
    });

    it('points the owner at them, and offers them no way out', async () => {
        setup();

        fireEvent.click(screen.getByRole('button', { name: 'Options' }));
        expect(
            await screen.findByRole('link', { name: 'People (3)' })
        ).toHaveAttribute('href', '/routines/r1/people');
        expect(
            screen.queryByRole('button', { name: /Leave routine/ })
        ).not.toBeInTheDocument();
    });

    // Nobody is put on a routine with their say-so, so walking out is what
    // makes that acceptable. It names the routine before it happens.
    it('asks, naming the routine, before letting somebody walk out', async () => {
        const onLeave = vi.fn(async () => {});
        setup({ owner: false, onLeave });

        fireEvent.click(screen.getByRole('button', { name: 'Options' }));
        fireEvent.click(
            await screen.findByRole('button', { name: /Leave routine/ })
        );
        expect(onLeave).not.toHaveBeenCalled();

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('Leave Push Pull Legs?');
        await acceptConfirm('Leave routine');

        await waitFor(() => expect(onLeave).toHaveBeenCalled());
    });

    // A coach renames, moves the duration and edits the plan. Deleting the
    // routine and publishing it stay with whoever it belongs to.
    it('keeps deleting and publishing out of a coach menu', async () => {
        setup({ owner: false });

        fireEvent.click(screen.getByRole('button', { name: 'Options' }));
        expect(
            await screen.findByRole('button', { name: 'Rename routine' })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Delete routine' })
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Make public' })
        ).not.toBeInTheDocument();
    });
});

describe('RoutineOptions for a scout', () => {
    const scout = { owner: false, editor: false };

    // Everything that would change the routine is gone; the way out is not.
    it('offers a way out and nothing else', async () => {
        setup(scout);

        fireEvent.click(screen.getByRole('button', { name: 'Options' }));
        expect(
            await screen.findByRole('button', { name: /Leave routine/ })
        ).toBeInTheDocument();

        for (const name of [
            'Rename routine',
            'Change duration',
            'Edit',
            'Make public',
            'Delete routine',
        ]) {
            expect(
                screen.queryByRole('button', { name })
            ).not.toBeInTheDocument();
        }
        expect(
            screen.queryByRole('link', { name: /People/ })
        ).not.toBeInTheDocument();
    });
});

describe('the people row of RoutineOptions', () => {
    it('counts the people who are in', async () => {
        setup();

        fireEvent.click(screen.getByRole('button', { name: 'Options' }));
        expect(
            await screen.findByRole('link', { name: 'People (3)' })
        ).toHaveAttribute('href', '/routines/r1/people');
    });

    // A count is there to say how many. None is what the page says itself the
    // moment it opens, so "(0)" would be a number nobody needed.
    it('says no number when nobody is in', async () => {
        setup({ people: { href: '/routines/r1/people', count: 0 } });

        fireEvent.click(screen.getByRole('button', { name: 'Options' }));
        expect(
            await screen.findByRole('link', { name: 'People' })
        ).toBeInTheDocument();
    });
});
