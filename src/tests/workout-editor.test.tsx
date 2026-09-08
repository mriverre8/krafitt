import { WorkoutEditor } from '@/components/workout-editor';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { noopAction } from './setup-helpers';

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
    saveExercises: noopAction,
    onDeleteWorkout: async () => {},
};

const save = () => screen.getByRole('button', { name: /Save changes/ });
const addExercise = () => screen.getByRole('button', { name: /Add exercise/ });

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
        expect(
            screen.getByRole('button', { name: 'Delete exercise 1' })
        ).toBeDisabled();
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
        expect(
            screen.getByRole('button', { name: 'Delete exercise 1' })
        ).toBeEnabled();
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
        fireEvent.click(
            screen.getByRole('button', { name: 'Delete exercise 2' })
        );
        expect(save()).toBeDisabled();
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

    it('confirms before deleting a day', async () => {
        const onDeleteWorkout = vi.fn().mockResolvedValue(undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        render(
            <WorkoutEditor
                {...base}
                onDeleteWorkout={onDeleteWorkout}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Delete day' }));
        expect(window.confirm).toHaveBeenCalledWith(
            'Delete Push A and its exercises?'
        );
        await waitFor(() => expect(onDeleteWorkout).toHaveBeenCalledWith('w1'));
    });
});
