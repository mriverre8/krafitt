import { ExerciseFields } from '@/components/workout/exercise-fields';
import { emptySet } from '@/lib/drafts';
import type { ExerciseDraft, SetDraft } from '@/lib/types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const draft: ExerciseDraft = {
    id: 'e1',
    name: 'Bench press',
    sets: [
        {
            kind: 'normal',
            mode: 'range',
            repMin: '4',
            repMax: '6',
            value: '',
            technique: 'Top set',
        },
        {
            kind: 'normal',
            mode: 'amrap',
            repMin: '',
            repMax: '',
            value: '',
            technique: 'Back off',
        },
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

    it('cuts a typed number down to the digits it is allowed', () => {
        // `maxLength` does nothing on a number input, so the cap has to hold
        // here: three digits for reps, two for a drop or rest-pause value.
        const onChange = vi.fn();
        fields({ onChange });
        fireEvent.change(screen.getByLabelText('Exercise 1, min reps set 1'), {
            target: { value: '1234' },
        });
        expect(onChange.mock.calls[0][0].sets[0].repMin).toBe('123');

        onChange.mockClear();
        fields({
            onChange,
            exercise: {
                ...draft,
                sets: [draft.sets[0], { ...emptySet, kind: 'rest' }],
            },
        });
        fireEvent.change(screen.getByPlaceholderText('sec'), {
            target: { value: '123' },
        });
        expect(onChange.mock.calls[0][0].sets[1].value).toBe('12');
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

    describe('drop and rest-pause sets', () => {
        // Both layouts render the button; jsdom hides neither.
        const add = (name: string) =>
            fireEvent.click(screen.getAllByRole('button', { name })[0]);

        it('hangs a new one off the set it was added from', () => {
            const onChange = vi.fn();
            fields({ onChange });
            add('Add drop / rest-pause to set 1');
            add('Add drop set');

            const sets = onChange.mock.calls[0][0].sets;
            expect(sets.map((set: SetDraft) => set.kind)).toEqual([
                'normal',
                'drop',
                'normal',
            ]);
        });

        it('offers only the kind the set already carries, behind the last', () => {
            const onChange = vi.fn();
            const sets = [
                draft.sets[0],
                { ...draft.sets[0], kind: 'drop' as const },
                draft.sets[1],
            ];
            fields({ exercise: { ...draft, sets }, onChange });

            // The menu is gone: one working set takes one kind, not both.
            expect(
                screen.queryByRole('button', {
                    name: 'Add drop / rest-pause to set 1',
                })
            ).not.toBeInTheDocument();

            add('Add drop set');
            expect(
                onChange.mock.calls[0][0].sets.map((set: SetDraft) => set.kind)
            ).toEqual(['normal', 'drop', 'drop', 'normal']);
        });

        // The button lives on the working set that carries the run, however
        // long the run gets. The row a control sits in is the wrapper the set
        // fields share — no Tailwind in jsdom, so the utility class is what
        // identifies it.
        const rowOf = (el: Element) => el.closest('[class*="space-y-1.5"]')!;

        it('sits on the working set while it carries no run', () => {
            fields();
            const button = screen.getAllByRole('button', {
                name: 'Add drop / rest-pause to set 1',
            })[0];
            expect(rowOf(button)).toContainElement(
                screen.getByLabelText('Exercise 1, reps type set 1')
            );
        });

        it('stays on the working set once the run has grown', () => {
            fields({
                exercise: {
                    ...draft,
                    sets: [
                        draft.sets[0],
                        { ...draft.sets[0], kind: 'drop' as const },
                        { ...draft.sets[0], kind: 'drop' as const },
                    ],
                },
            });
            const button = screen.getAllByRole('button', {
                name: 'Add drop set',
            })[0];
            expect(rowOf(button)).toContainElement(
                screen.getByLabelText('Exercise 1, reps type set 1')
            );
        });

        it('takes the whole run with the working set it hangs off', () => {
            const onChange = vi.fn();
            fields({
                exercise: {
                    ...draft,
                    sets: [
                        draft.sets[0],
                        { ...draft.sets[0], kind: 'drop' as const },
                        { ...draft.sets[0], kind: 'drop' as const },
                        draft.sets[1],
                    ],
                },
                onChange,
            });
            add('Exercise 1, remove set 1');
            expect(
                onChange.mock.calls[0][0].sets.map((set: SetDraft) => set.kind)
            ).toEqual(['normal']);
        });

        it('drops one of the run on its own', () => {
            const onChange = vi.fn();
            fields({
                exercise: {
                    ...draft,
                    sets: [
                        draft.sets[0],
                        { ...draft.sets[0], kind: 'drop' as const },
                        { ...draft.sets[0], kind: 'drop' as const },
                    ],
                },
                onChange,
            });
            add('Exercise 1, remove set DS1');
            expect(
                onChange.mock.calls[0][0].sets.map((set: SetDraft) => set.kind)
            ).toEqual(['normal', 'drop']);
        });

        it('will not empty the exercise by taking a run out with its set', () => {
            fields({
                exercise: {
                    ...draft,
                    sets: [
                        draft.sets[0],
                        { ...draft.sets[0], kind: 'drop' as const },
                    ],
                },
            });
            for (const button of screen.getAllByRole('button', {
                name: 'Exercise 1, remove set 1',
            })) {
                expect(button).toBeDisabled();
            }
        });

        it('swaps the technique field for the amount, and names the row DS1', () => {
            fields({
                exercise: {
                    ...draft,
                    sets: [
                        draft.sets[0],
                        {
                            ...draft.sets[0],
                            kind: 'rest' as const,
                            value: '15',
                        },
                    ],
                },
            });
            expect(
                screen.queryByLabelText('Exercise 1, technique set RP1')
            ).not.toBeInTheDocument();
            expect(screen.getByLabelText('Exercise 1, RP1 amount')).toHaveValue(
                15
            );
            expect(
                screen.getByLabelText('Exercise 1, min reps set RP1')
            ).toBeInTheDocument();
        });

        it('marks the pause a rest-pause set has not been given', () => {
            fields({
                exercise: {
                    ...draft,
                    sets: [
                        draft.sets[0],
                        { ...draft.sets[0], kind: 'rest' as const },
                    ],
                },
                fault: {
                    name: false,
                    sets: [
                        { min: false, max: false, value: false },
                        { min: false, max: false, value: true },
                    ],
                },
            });
            expect(screen.getByLabelText('Exercise 1, RP1 amount')).toHaveClass(
                'border-danger'
            );
        });
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
        // AMRAP needs neither number, a fixed count only the first, and a range
        // both of them joined by a word.
        fields({ exercise: { ...draft, sets: [draft.sets[1]] } });
        expect(
            screen.queryByLabelText('Exercise 1, min reps set 1')
        ).not.toBeInTheDocument();
        expect(
            screen.queryByLabelText('Exercise 1, max reps set 1')
        ).not.toBeInTheDocument();
        expect(screen.getByText('—')).toBeInTheDocument();

        cleanup();
        fields({
            exercise: {
                ...draft,
                sets: [{ ...draft.sets[0], mode: 'fixed', repMax: '' }],
            },
        });
        expect(
            screen.getByLabelText('Exercise 1, min reps set 1')
        ).toBeInTheDocument();
        expect(
            screen.queryByLabelText('Exercise 1, max reps set 1')
        ).not.toBeInTheDocument();

        cleanup();
        fields({ exercise: { ...draft, sets: [draft.sets[0]] } });
        expect(
            screen.getByLabelText('Exercise 1, max reps set 1')
        ).toBeInTheDocument();
        expect(screen.getByText('to')).toBeInTheDocument();
    });

    it('removes the whole exercise, unless it is the only one', () => {
        const onRemove = vi.fn();
        const { unmount } = fields({ onRemove });
        fireEvent.click(
            screen.getByRole('button', { name: 'Delete exercise 1' })
        );
        expect(onRemove).toHaveBeenCalled();
        unmount();

        fields({ canRemove: false });
        expect(
            screen.getByRole('button', { name: 'Delete exercise 1' })
        ).toBeDisabled();
    });

    describe('with a fault to point at', () => {
        it('marks exactly the fields the fault names', () => {
            fields({
                fault: {
                    name: true,
                    sets: [
                        { min: false, max: true, value: false },
                        { min: false, max: false, value: false },
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
        expect(options).toEqual([
            'Straight sets',
            'Warm-up set',
            'Top set',
            'Back off',
        ]);
    });
});
