import {
    EditModeProvider,
    EditModeToggle,
} from '@/components/routine/edit-mode';
import {
    RoutineDays,
    type RoutineDay,
} from '@/components/routine/routine-days';
import { ModalHost } from '@/components/modal/modal-host';
import { closeModal } from '@/store/modal';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { noopAction } from './setup-helpers';

const sets = [{ repMode: 'range', repMin: 4, repMax: 6, technique: 'Top set' }];

const day = (
    id: string,
    name: string,
    problems: string[] = []
): RoutineDay => ({
    id,
    name,
    exercises: [{ id: `${id}-e1`, name: `${name} press`, sets }],
    problems,
    faults: {},
});

const days = [
    day('w1', 'Push A'),
    day('w2', 'Pull A', ['Exercise 1: give it a name.']),
    day('w3', 'Legs'),
];

const base = {
    days,
    saveExercises: noopAction,
    renameWorkout: noopAction,
    onDeleteWorkout: async () => {},
};

// `hidden: true` so the days that are off screen can be found at all — that
// they are hidden is the thing being asserted.
const panelOf = (name: string) =>
    screen
        .getByRole('heading', { name, hidden: true })
        .closest('[role="tabpanel"]');

const tab = (n: number) =>
    screen.getByRole('tab', { name: new RegExp(`^Day ${n},`) });

/** The rack with the real toggle above it: everything it says about a day is
    said while editing only. */
const renderEditing = (
    props: Partial<Parameters<typeof RoutineDays>[0]> = {}
) =>
    render(
        <EditModeProvider>
            <EditModeToggle />
            <RoutineDays
                {...base}
                {...props}
            />
            <ModalHost />
        </EditModeProvider>
    );

// The store outlives a render, so a dialog left open would greet the next test.
afterEach(() => closeModal());

describe('RoutineDays', () => {
    it('shows the first day and hides the rest', () => {
        render(<RoutineDays {...base} />);
        expect(panelOf('Push A')).toBeVisible();
        expect(panelOf('Pull A')).not.toBeVisible();
        expect(panelOf('Legs')).not.toBeVisible();
    });

    it('swaps which day is on screen', () => {
        render(<RoutineDays {...base} />);
        fireEvent.click(tab(3));
        expect(panelOf('Legs')).toBeVisible();
        expect(panelOf('Push A')).not.toBeVisible();
        expect(tab(3)).toHaveAttribute('aria-selected', 'true');
        expect(tab(1)).toHaveAttribute('aria-selected', 'false');
    });

    it('offers the workouts label and chevrons to move between days', () => {
        render(<RoutineDays {...base} />);
        expect(
            screen.getByRole('tablist', { name: 'Workouts' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Previous day' })
        ).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Next day' })).toBeEnabled();

        fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
        expect(panelOf('Pull A')).toBeVisible();
        expect(
            screen.getByRole('button', { name: 'Previous day' })
        ).toBeEnabled();
    });

    // A new day belongs at the end of the rack it will appear in, and only
    // while the routine is open for editing.
    it('offers the new day from the end of the rack, in edit mode only', async () => {
        renderEditing({ addDay: noopAction });
        expect(
            screen.queryByRole('button', { name: 'Add day' })
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        fireEvent.click(screen.getByRole('button', { name: 'Add day' }));

        // The same dialog the renames use, asking the same question — but with
        // nothing to open on, so it suggests instead, and its button says which
        // of the two things it is about to do.
        const field = await screen.findByRole('textbox', { name: 'Day name' });
        expect(field).toHaveValue('');
        expect(field).toHaveAttribute(
            'placeholder',
            'e.g. Push, Legs, Upper A'
        );
        expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Save' })
        ).not.toBeInTheDocument();
    });

    it('moves with the arrow keys too', () => {
        render(<RoutineDays {...base} />);
        fireEvent.keyDown(tab(1), { key: 'ArrowRight' });
        expect(panelOf('Pull A')).toBeVisible();
        fireEvent.keyDown(tab(2), { key: 'End' });
        expect(panelOf('Legs')).toBeVisible();
        fireEvent.keyDown(tab(3), { key: 'Home' });
        expect(panelOf('Push A')).toBeVisible();
    });

    // The whole reason every day stays mounted: each one holds a draft that no
    // save has taken yet, and stepping away must not throw it out.
    it('keeps an unsaved draft while you look at another day', () => {
        renderEditing();
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        fireEvent.change(screen.getAllByLabelText('Exercise 1 name')[0], {
            target: { value: 'Incline press' },
        });

        fireEvent.click(tab(2));
        fireEvent.click(tab(1));
        expect(screen.getAllByLabelText('Exercise 1 name')[0]).toHaveValue(
            'Incline press'
        );
    });

    // The rack is a status board, and the colour on it is never the only teller.
    it('names the days that are not trainable yet', () => {
        renderEditing();
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        expect(tab(2)).toHaveAccessibleName('Day 2, Pull A, Incomplete');
        expect(tab(1)).toHaveAccessibleName('Day 1, Push A');
    });

    // Reading a routine, the rack is only a way to walk between the days: no
    // rule under the plates and no verdict in their names.
    it('keeps the verdicts out of read mode', () => {
        render(<RoutineDays {...base} />);
        expect(tab(2)).toHaveAccessibleName('Day 2, Pull A');
        expect(tab(2).lastElementChild).toHaveTextContent('2');
    });

    // Trainable-or-not is a verdict on what was saved, so an edited day drops
    // both colours until it is saved again.
    it('marks a day yellow while its draft is unsaved', () => {
        renderEditing();
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

        const rule = (n: number) => tab(n).lastElementChild;
        expect(rule(1)).toHaveClass('bg-surge');
        expect(rule(2)).toHaveClass('bg-danger');

        fireEvent.change(screen.getAllByLabelText('Exercise 1 name')[0], {
            target: { value: 'Incline press' },
        });
        expect(rule(1)).toHaveClass('bg-draft');
        expect(tab(1)).toHaveAccessibleName('Day 1, Push A, unsaved changes');
        // Only the day that was touched.
        expect(rule(2)).toHaveClass('bg-danger');
    });

    it('has nothing to show for a routine with no days', () => {
        const { container } = render(
            <RoutineDays
                {...base}
                days={[]}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });
});
