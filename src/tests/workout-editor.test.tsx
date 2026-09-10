import {
    EditModeContext,
    EditModeProvider,
    EditModeToggle,
} from '@/components/edit-mode';
import { WorkoutEditor } from '@/components/workout-editor';
import {
    fireEvent,
    render as rtlRender,
    screen,
    waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
    acceptConfirm,
    confirmDialog,
    declineConfirm,
    noopAction,
    openConfirm,
    withModals,
} from './setup-helpers';

/** The editor lives inside a routine that is read-only until Edit is pressed,
    and every test below is about what editing can do. Read mode has its own
    tests at the end, which render without this. */
const render = (ui: ReactNode) =>
    rtlRender(
        <EditModeContext
            value={{
                editing: true,
                toggle: () => {},
                discarded: 0,
                dirtyDays: new Set<string>(),
                setDirty: () => {},
            }}
        >
            {withModals(ui)}
        </EditModeContext>
    );

const workout = {
    id: 'w1',
    name: 'Push A',
    exercises: [
        {
            id: 'e1',
            name: 'Bench press',
            sets: [
                {
                    repMode: 'range',
                    repMin: 4,
                    repMax: 6,
                    technique: 'Top set',
                },
            ],
        },
    ],
};

const base = {
    workout,
    problems: [],
    faults: {},
    saveExercises: noopAction,
    onDeleteWorkout: async () => {},
};

/** A day whose only stored exercise has no name. */
const flagged = {
    problems: ['Exercise 1: give it a name.'],
    faults: { e1: { name: true, sets: [{ min: false, max: false }] } },
};

const save = () => screen.getByRole('button', { name: /Save changes/ });
const undo = () => screen.getByRole('button', { name: 'Undo changes' });
const addExercise = () => screen.getByRole('button', { name: /Add exercise/ });
const deleteExercise = (e: number) =>
    screen.getByRole('button', { name: `Delete exercise ${e}` });

describe('WorkoutEditor', () => {
    it('shows one form per exercise of the day', () => {
        render(<WorkoutEditor {...base} />);
        expect(screen.getByText('Push A')).toBeInTheDocument();
        expect(screen.getByLabelText('Exercise 1 name')).toHaveValue(
            'Bench press'
        );
        expect(
            screen.queryByLabelText('Exercise 2 name')
        ).not.toBeInTheDocument();
    });

    it('starts an empty day on a single blank exercise', () => {
        render(
            <WorkoutEditor
                {...base}
                workout={{ ...workout, exercises: [] }}
            />
        );
        expect(screen.getByLabelText('Exercise 1 name')).toHaveValue('');
        expect(deleteExercise(1)).toBeDisabled();
    });

    it('adds an exercise to the draft without saving anything', () => {
        const saveExercises = vi.fn(noopAction);
        render(
            <WorkoutEditor
                {...base}
                saveExercises={saveExercises}
            />
        );
        fireEvent.click(addExercise());
        expect(screen.getByLabelText('Exercise 2 name')).toHaveValue('');
        expect(saveExercises).not.toHaveBeenCalled();
        // Two of them now, so either can go.
        expect(deleteExercise(1)).toBeEnabled();
    });

    it('only offers to save once something has changed', () => {
        render(<WorkoutEditor {...base} />);
        expect(save()).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Exercise 1 name'), {
            target: { value: 'Incline press' },
        });
        expect(save()).toBeEnabled();

        // Back to what the server holds: nothing left to save.
        fireEvent.change(screen.getByLabelText('Exercise 1 name'), {
            target: { value: 'Bench press' },
        });
        expect(save()).toBeDisabled();
    });

    it('turns adding or removing an exercise into a change to save', () => {
        render(<WorkoutEditor {...base} />);
        fireEvent.click(addExercise());
        expect(save()).toBeEnabled();
        fireEvent.click(deleteExercise(2));
        expect(save()).toBeDisabled();
    });

    it('throws the unsaved changes away on undo', () => {
        render(<WorkoutEditor {...base} />);
        expect(undo()).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Exercise 1 name'), {
            target: { value: 'Incline press' },
        });
        fireEvent.click(addExercise());
        fireEvent.click(
            screen.getByRole('button', { name: 'Add set to exercise 1' })
        );
        expect(undo()).toBeEnabled();

        fireEvent.click(undo());
        expect(screen.getByLabelText('Exercise 1 name')).toHaveValue(
            'Bench press'
        );
        expect(
            screen.queryByLabelText('Exercise 2 name')
        ).not.toBeInTheDocument();
        expect(
            screen.queryByLabelText('Exercise 1, min reps set 2')
        ).not.toBeInTheDocument();
        expect(save()).toBeDisabled();
        expect(undo()).toBeDisabled();
    });

    it('submits the whole day as one plan', async () => {
        const saveExercises = vi.fn().mockResolvedValue({ ok: true as const });
        render(
            <WorkoutEditor
                {...base}
                saveExercises={saveExercises}
            />
        );
        fireEvent.click(addExercise());
        fireEvent.change(screen.getByLabelText('Exercise 2 name'), {
            target: { value: 'Dips' },
        });
        fireEvent.click(save());

        await waitFor(() => expect(saveExercises).toHaveBeenCalled());
        const data = saveExercises.mock.calls[0][1] as FormData;
        expect(data.get('workoutId')).toBe('w1');
        expect(JSON.parse(String(data.get('plan')))).toEqual([
            {
                id: 'e1',
                name: 'Bench press',
                sets: [
                    {
                        mode: 'range',
                        repMin: '4',
                        repMax: '6',
                        technique: 'Top set',
                    },
                ],
            },
            {
                id: null,
                name: 'Dips',
                sets: [
                    {
                        mode: 'range',
                        repMin: '',
                        repMax: '',
                        technique: '',
                    },
                ],
            },
        ]);
    });

    // Dispatching the action by hand only reports `pending` from inside a
    // transition, and the button leans on it to keep a save from being sent twice.
    it('holds the button down while the save is in flight', async () => {
        let finish!: (state: { ok: true }) => void;
        render(
            <WorkoutEditor
                {...base}
                saveExercises={() =>
                    new Promise((resolve) => {
                        finish = resolve;
                    })
                }
            />
        );
        fireEvent.change(screen.getByLabelText('Exercise 1 name'), {
            target: { value: 'Incline press' },
        });
        fireEvent.click(save());

        await waitFor(() => expect(save()).toBeDisabled());
        finish({ ok: true });
        // Still unsaved as far as the props know, so it comes back for another go.
        await waitFor(() => expect(save()).toBeEnabled());
    });

    // The action can answer before the revalidated day reaches the props: going
    // back to the props then would undo the save on screen until a reload.
    it('holds on to what was saved while the day catches up', async () => {
        render(
            <WorkoutEditor
                {...base}
                saveExercises={async () => ({ ok: true as const })}
            />
        );
        const mode = screen.getByLabelText('Exercise 1, reps type set 1');
        fireEvent.change(mode, { target: { value: 'fixed' } });
        fireEvent.click(save());

        await waitFor(() => expect(save()).toBeEnabled());
        expect(mode).toHaveValue('fixed');
    });

    // Clearing the technique stores the default instead, which can leave the day
    // byte for byte as it was: there is nothing in the props for the editor to
    // notice, so it has to take the answer the save itself came back with.
    it('takes back the defaults the save filled in', async () => {
        render(
            <WorkoutEditor
                {...base}
                saveExercises={async () => ({
                    ok: true as const,
                    saved: workout.exercises,
                })}
            />
        );
        const technique = screen.getByLabelText('Exercise 1, technique set 1');
        fireEvent.change(technique, { target: { value: '' } });
        expect(save()).toBeEnabled();

        fireEvent.click(save());
        await waitFor(() => expect(technique).toHaveValue('Top set'));
        expect(save()).toBeDisabled();
    });

    it('picks up the id a brand new exercise was given', async () => {
        const saveExercises = vi.fn().mockResolvedValue({
            ok: true as const,
            saved: [
                ...workout.exercises,
                { id: 'e2', name: 'Dips', sets: workout.exercises[0].sets },
            ],
        });
        render(
            <WorkoutEditor
                {...base}
                saveExercises={saveExercises}
            />
        );
        fireEvent.click(addExercise());
        fireEvent.change(screen.getByLabelText('Exercise 2 name'), {
            target: { value: 'Dips' },
        });
        fireEvent.click(save());
        // Save is disabled the moment it is pressed, so waiting on that would
        // wait on nothing: the drafts are only back from the server once
        // exercise 2 is showing the sets the save gave it.
        await waitFor(() =>
            expect(
                screen.getByLabelText('Exercise 2, min reps set 1')
            ).toHaveValue(4)
        );
        expect(save()).toBeDisabled();

        // Saving again must update that exercise, not create a second one.
        fireEvent.change(screen.getByLabelText('Exercise 2 name'), {
            target: { value: 'Weighted dips' },
        });
        fireEvent.click(save());
        await waitFor(() => expect(saveExercises).toHaveBeenCalledTimes(2));
        const plan = JSON.parse(
            String((saveExercises.mock.calls[1][1] as FormData).get('plan'))
        );
        expect(plan[1].id).toBe('e2');
    });

    it('keeps what was typed when the save is rejected', async () => {
        render(
            <WorkoutEditor
                {...base}
                saveExercises={async () => ({ error: 'Nope' })}
            />
        );
        fireEvent.change(screen.getByLabelText('Exercise 1 name'), {
            target: { value: 'Incline press' },
        });
        fireEvent.click(save());

        await screen.findByText('Nope');
        expect(screen.getByLabelText('Exercise 1 name')).toHaveValue(
            'Incline press'
        );
        expect(save()).toBeEnabled();
    });

    it('lists what this day is still missing', () => {
        render(
            <WorkoutEditor
                {...base}
                {...flagged}
            />
        );
        expect(
            screen.getByText('Exercise 1: give it a name.')
        ).toBeInTheDocument();
    });

    it('points at the offending fields, and stops when asked again', () => {
        render(
            <WorkoutEditor
                {...base}
                {...flagged}
            />
        );
        const name = screen.getByLabelText('Exercise 1 name');
        expect(name).not.toHaveClass('border-danger');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Show errors',
            })
        );
        expect(name).toHaveClass('border-danger');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Hide errors',
            })
        );
        expect(name).not.toHaveClass('border-danger');
    });

    it('leaves an exercise the errors say nothing about alone', () => {
        render(
            <WorkoutEditor
                {...base}
                {...flagged}
            />
        );
        // Added to the draft, so it is in no error yet.
        fireEvent.click(addExercise());
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Show errors',
            })
        );
        expect(screen.getByLabelText('Exercise 1 name')).toHaveClass(
            'border-danger'
        );
        expect(screen.getByLabelText('Exercise 2 name')).not.toHaveClass(
            'border-danger'
        );
    });

    it('has nothing to point at when the day is fine', () => {
        render(<WorkoutEditor {...base} />);
        expect(
            screen.queryByRole('button', {
                name: 'Show errors',
            })
        ).not.toBeInTheDocument();
    });

    it('confirms before deleting a day', async () => {
        const onDeleteWorkout = vi.fn().mockResolvedValue(undefined);
        render(
            <WorkoutEditor
                {...base}
                onDeleteWorkout={onDeleteWorkout}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Delete day' }));
        expect(await openConfirm()).toHaveTextContent(
            'Delete Push A and its exercises?'
        );
        expect(onDeleteWorkout).not.toHaveBeenCalled();

        await acceptConfirm('Delete');
        await waitFor(() => expect(onDeleteWorkout).toHaveBeenCalledWith('w1'));
    });
});

// No provider here: a routine opens read-only, which is what the context
// defaults to.
describe('WorkoutEditor, before Edit is pressed', () => {
    it('locks every field', () => {
        rtlRender(<WorkoutEditor {...base} />);
        expect(screen.getByLabelText('Exercise 1 name')).toHaveAttribute(
            'readonly'
        );
        expect(
            screen.getByLabelText('Exercise 1, min reps set 1')
        ).toHaveAttribute('readonly');
        expect(
            screen.getByLabelText('Exercise 1, technique set 1')
        ).toHaveAttribute('readonly');
        expect(
            screen.getByLabelText('Exercise 1, reps type set 1')
        ).toHaveAttribute('aria-readonly', 'true');
    });

    // Nothing to act on here: the list is a note to whoever writes the day.
    it('keeps what the day is missing out of sight', () => {
        rtlRender(
            <WorkoutEditor
                {...base}
                {...flagged}
            />
        );
        expect(
            screen.queryByText('Exercise 1: give it a name.')
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Show errors' })
        ).not.toBeInTheDocument();
        expect(screen.getByLabelText('Exercise 1 name')).not.toHaveClass(
            'border-danger'
        );
    });

    it('hides everything that would change the day', () => {
        rtlRender(<WorkoutEditor {...base} />);
        for (const name of [
            /Save changes/,
            /Add exercise/,
            'Delete day',
            'Delete exercise 1',
            'Add set to exercise 1',
        ]) {
            expect(
                screen.queryByRole('button', { name })
            ).not.toBeInTheDocument();
        }
    });
});

describe('leaving edit mode with unsaved work', () => {
    /** The real toggle over the real editor: the count of dirty days lives in
        one and the draft in the other, so only the pair proves the discard. */
    const renderRoutine = () =>
        rtlRender(
            withModals(
                <EditModeProvider>
                    <EditModeToggle />
                    <WorkoutEditor {...base} />
                </EditModeProvider>
            )
        );

    const edit = () => screen.getByRole('button', { name: 'Edit' });
    const done = () => screen.getByRole('button', { name: 'Done' });
    const name = () => screen.getByLabelText('Exercise 1 name');

    it('leaves quietly when nothing was touched', () => {
        renderRoutine();
        fireEvent.click(edit());
        fireEvent.click(done());
        expect(confirmDialog()).not.toBeInTheDocument();
        expect(name()).toHaveAttribute('readonly');
    });

    it('asks first, then throws the draft away', async () => {
        renderRoutine();
        fireEvent.click(edit());
        fireEvent.change(name(), { target: { value: 'Incline press' } });
        fireEvent.click(done());
        expect(await openConfirm()).toHaveTextContent(
            'You have changes that were never saved. Leave editing and lose them?'
        );

        await acceptConfirm('Discard changes');
        expect(name()).toHaveValue('Bench press');
        expect(name()).toHaveAttribute('readonly');
    });

    it('stays in edit mode, draft intact, when the ask is refused', async () => {
        renderRoutine();
        fireEvent.click(edit());
        fireEvent.change(name(), { target: { value: 'Incline press' } });
        fireEvent.click(done());
        await declineConfirm();
        expect(name()).toHaveValue('Incline press');
        expect(name()).not.toHaveAttribute('readonly');
    });

    it('has nothing to ask about once the draft is back where it started', () => {
        renderRoutine();
        fireEvent.click(edit());
        fireEvent.change(name(), { target: { value: 'Incline press' } });
        fireEvent.change(name(), { target: { value: 'Bench press' } });
        fireEvent.click(done());
        expect(confirmDialog()).not.toBeInTheDocument();
    });
});
