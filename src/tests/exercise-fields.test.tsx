import {
    emptyExercise,
    ExerciseFields,
    toDrafts,
    type ExerciseDraft,
} from '@/components/exercise-fields';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const draft: ExerciseDraft = {
    id: 'e1',
    name: 'Bench press',
    sets: [
        { mode: 'range', repMin: '4', repMax: '6', technique: 'Top set' },
        { mode: 'amrap', repMin: '', repMax: '', technique: 'Drop set' },
    ],
};

const fields = (props: Partial<Parameters<typeof ExerciseFields>[0]> = {}) =>
    render(
        <ExerciseFields
            exercise={draft}
            index={0}
            onChange={() => {}}
            onRemove={() => {}}
            canRemove
            {...props}
        />
    );

describe('toDrafts', () => {
    it('gives an empty day one blank exercise to start from', () => {
        expect(toDrafts([])).toEqual([emptyExercise]);
    });

    it('reads a stored exercise back into the form', () => {
        expect(
            toDrafts([
                {
                    id: 'e1',
                    name: 'Bench press',
                    sets: [
                        {
                            repMode: 'fixed',
                            repMin: 8,
                            repMax: null,
                            technique: 'Top set',
                        },
                    ],
                },
            ])
        ).toEqual([
            {
                id: 'e1',
                name: 'Bench press',
                sets: [
                    {
                        mode: 'fixed',
                        repMin: '8',
                        repMax: '',
                        technique: 'Top set',
                    },
                ],
            },
        ]);
    });
});

describe('ExerciseFields', () => {
    it('opens on what the draft holds', () => {
        fields();
        expect(screen.getByLabelText('Exercise 1 name')).toHaveValue(
            'Bench press'
        );
        expect(screen.getByLabelText('Exercise 1, min reps set 1')).toHaveValue(
            4
        );
        expect(
            screen.getByLabelText('Exercise 1, reps type set 2')
        ).toHaveValue('amrap');
    });

    it('numbers its labels after its position in the day', () => {
        fields({ index: 2 });
        expect(screen.getByLabelText('Exercise 3 name')).toBeInTheDocument();
        expect(
            screen.getByLabelText('Exercise 3, technique set 1')
        ).toBeInTheDocument();
    });

    it('reports a changed field to the day above it', () => {
        const onChange = vi.fn();
        fields({ onChange });
        fireEvent.change(screen.getByLabelText('Exercise 1 name'), {
            target: { value: 'Incline press' },
        });
        expect(onChange).toHaveBeenCalledWith({ name: 'Incline press' });
    });

    it('adds and removes sets one at a time', () => {
        const onChange = vi.fn();
        fields({ onChange });
        fireEvent.click(
            screen.getByRole('button', { name: 'Add set to exercise 1' })
        );
        expect(onChange.mock.calls[0][0].sets).toHaveLength(3);

        // Same action exists as both a desktop icon button and a mobile text
        // link; only one is ever visible, but jsdom does not evaluate the
        // media query that hides the other.
        fireEvent.click(
            screen.getAllByRole('button', {
                name: 'Exercise 1, remove set 2',
            })[0]
        );
        expect(onChange.mock.calls[1][0].sets).toEqual([draft.sets[0]]);
    });

    it('keeps the last set of the exercise', () => {
        fields({ exercise: { ...draft, sets: [draft.sets[0]] } });
        for (const button of screen.getAllByRole('button', {
            name: 'Exercise 1, remove set 1',
        })) {
            expect(button).toBeDisabled();
        }
    });

    // jsdom has no Tailwind, so the utility class is what we can assert on.
    it('shows only the inputs the rep type needs', () => {
        fields({ exercise: { ...draft, sets: [draft.sets[1]] } });
        expect(screen.getByLabelText('Exercise 1, min reps set 1')).toHaveClass(
            'hidden'
        );
        expect(screen.getByLabelText('Exercise 1, max reps set 1')).toHaveClass(
            'hidden'
        );
    });

    it('removes the whole exercise, unless it is the only one', () => {
        const onRemove = vi.fn();
        const { unmount } = fields({ onRemove });
        // Same action exists as both a desktop icon button and a mobile text
        // link; only one is ever visible, but jsdom does not evaluate the
        // media query that hides the other.
        fireEvent.click(
            screen.getAllByRole('button', { name: 'Delete exercise 1' })[0]
        );
        expect(onRemove).toHaveBeenCalled();
        unmount();

        fields({ canRemove: false });
        for (const button of screen.getAllByRole('button', {
            name: 'Delete exercise 1',
        })) {
            expect(button).toBeDisabled();
        }
    });

    describe('with a fault to point at', () => {
        it('marks exactly the fields the fault names', () => {
            fields({
                fault: {
                    name: true,
                    sets: [
                        { min: false, max: true },
                        { min: false, max: false },
                    ],
                },
            });
            expect(screen.getByLabelText('Exercise 1 name')).toHaveClass(
                'border-danger'
            );
            expect(
                screen.getByLabelText('Exercise 1, min reps set 1')
            ).not.toHaveClass('border-danger');
            expect(
                screen.getByLabelText('Exercise 1, max reps set 1')
            ).toHaveClass('border-danger');
            expect(
                screen.getByLabelText('Exercise 1, max reps set 2')
            ).not.toHaveClass('border-danger');
        });

        it('marks nothing without one', () => {
            fields({ exercise: { ...draft, name: '' } });
            expect(screen.getByLabelText('Exercise 1 name')).not.toHaveClass(
                'border-danger'
            );
        });

        // A set the draft has added since the fault was worked out.
        it('leaves a set the fault says nothing about alone', () => {
            fields({ fault: { name: false, sets: [] } });
            expect(
                screen.getByLabelText('Exercise 1, min reps set 1')
            ).not.toHaveClass('border-danger');
        });
    });

    it('suggests the known techniques', () => {
        const { container } = fields();
        const options = [...container.querySelectorAll('datalist option')].map(
            (option) => option.getAttribute('value')
        );
        expect(options).toEqual(['Straight sets', 'Top set', 'Back off']);
    });
});
