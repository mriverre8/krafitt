import {
    emptyExercise,
    emptySet,
    ExerciseFields,
    toDrafts,
    type ExerciseDraft,
    type SetDraft,
} from '@/components/workout/exercise-fields';
import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react';
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
                        kind: 'normal',
                        mode: 'fixed',
                        repMin: '8',
                        repMax: '',
                        value: '',
                        technique: 'Top set',
                    },
                ],
            },
        ]);
    });
});

/** Everything a row can be told to do now sits behind one ⋯ at its head, so
    reaching any of it means opening that row's menu first. */
const openSet = (n: string) =>
    fireEvent.click(
        screen.getByRole('button', { name: `Exercise 1, set ${n} actions` })
    );

/** The trigger and its panel are siblings, so the whole menu is what the
    trigger's parent holds — the trigger itself being the first button in it. */
const openTechnique = (n: string) =>
    fireEvent.click(
        screen.getByRole('button', { name: `Exercise 1, set ${n} technique` })
    );

const rowsOf = (label: string) =>
    within(screen.getByRole('button', { name: label }).parentElement!)
        .getAllByRole('button')
        .map((button) => button.textContent)
        .slice(1);

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
            screen.getByLabelText('Exercise 3, set 1 technique')
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

        openSet('2');
        fireEvent.click(
            screen.getByRole('button', { name: 'Exercise 1, remove set 2' })
        );
        expect(onChange.mock.calls[1][0].sets).toEqual([draft.sets[0]]);
    });

    // One mark per row, in the same place on every one of them — the working
    // set's menu carries the whole of what a set can be asked for, a drop or
    // rest-pause row's the one thing it can.
    it('gives the working set a menu and the sub row its one action', () => {
        fields({
            exercise: {
                ...draft,
                sets: [draft.sets[0], { ...draft.sets[0], kind: 'drop' }],
            },
        });
        openSet('1');
        expect(rowsOf('Exercise 1, set 1 actions')).toEqual([
            'Add drop set',
            'Remove set',
        ]);

        // One option is not a menu: the sub row wears it, in the same column.
        expect(
            screen.queryByRole('button', {
                name: 'Exercise 1, set DS1 actions',
            })
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Exercise 1, remove set DS1' })
        ).toBeInTheDocument();
    });

    describe('drop and rest-pause sets', () => {
        /** Both kinds are named in the working set's own menu, so adding one is
            open the row, pick the kind. */
        const addFrom = (n: string, name: string) => {
            openSet(n);
            fireEvent.click(screen.getByRole('button', { name }));
        };

        it('hangs a new one off the set it was added from', () => {
            const onChange = vi.fn();
            fields({ onChange });
            addFrom('1', 'Add drop set');

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

            // One working set takes one kind, not both.
            openSet('1');
            expect(
                screen.queryByRole('button', { name: 'Add rest-pause set' })
            ).not.toBeInTheDocument();

            fireEvent.click(
                screen.getByRole('button', { name: 'Add drop set' })
            );
            expect(
                onChange.mock.calls[0][0].sets.map((set: SetDraft) => set.kind)
            ).toEqual(['normal', 'drop', 'drop', 'normal']);
        });

        // Whatever the run grows to, it is the working set that carries it —
        // and the working set's menu that adds to it. The sub rows have no way
        // to add one at all, which is the other half of the same rule.
        it('adds to the run from the working set, however long it is', () => {
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
            addFrom('1', 'Add drop set');
            expect(
                onChange.mock.calls[0][0].sets.map((set: SetDraft) => set.kind)
            ).toEqual(['normal', 'drop', 'drop', 'drop']);

            // A sub row cannot add to the run at all: it carries nothing but
            // its own way out.
            expect(
                screen.queryByRole('button', { name: 'Add drop set' })
            ).not.toBeInTheDocument();
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
            addFrom('1', 'Exercise 1, remove set 1');
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
            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Exercise 1, remove set DS1',
                })
            );
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
            openSet('1');
            expect(
                screen.getByRole('button', {
                    name: 'Exercise 1, remove set 1',
                })
            ).toBeDisabled();
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
                        {
                            min: false,
                            max: false,
                            value: false,
                            technique: false,
                        },
                        {
                            min: false,
                            max: false,
                            value: true,
                            technique: false,
                        },
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
        openSet('1');
        expect(
            screen.getByRole('button', { name: 'Exercise 1, remove set 1' })
        ).toBeDisabled();
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
        // A mode that prescribes no number says so in the slot the numbers
        // would have had, rather than leaving a dash to be read as a field
        // somebody forgot to fill.
        expect(screen.getByText('To failure')).toBeInTheDocument();

        cleanup();
        fields({
            exercise: {
                ...draft,
                sets: [{ ...draft.sets[1], mode: 'unspecified' }],
            },
        });
        expect(screen.getByText('Unspecified reps')).toBeInTheDocument();

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

    // Delete is all this card can be told, so it is a mark on the name rather
    // than a menu holding one row.
    it('removes the whole exercise, unless it is the only one', () => {
        const onRemove = vi.fn();
        const del = () =>
            screen.getByRole('button', { name: 'Delete exercise 1' });

        const { unmount } = fields({ onRemove });
        expect(
            screen.queryByRole('button', { name: 'Exercise 1 actions' })
        ).not.toBeInTheDocument();
        fireEvent.click(del());
        expect(onRemove).toHaveBeenCalled();
        unmount();

        fields({ canRemove: false });
        expect(del()).toBeDisabled();
    });

    describe('with a fault to point at', () => {
        it('marks exactly the fields the fault names', () => {
            fields({
                fault: {
                    name: true,
                    sets: [
                        {
                            min: false,
                            max: true,
                            value: false,
                            technique: false,
                        },
                        {
                            min: false,
                            max: false,
                            value: false,
                            technique: false,
                        },
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

    describe('the technique', () => {
        const one = (technique: string | null) => ({
            ...draft,
            sets: [{ ...draft.sets[0], technique }],
        });
        // The slot is always on the row, and the row's own menu no longer
        // carries any of this: the field itself is the way in.
        const openMenu = () => openTechnique('1');

        it('holds a slot on the row even when the set has none', () => {
            fields({ exercise: one(null) });
            expect(
                screen.getByRole('button', {
                    name: 'Exercise 1, set 1 technique',
                })
            ).toHaveTextContent('Unspecified technique');
            expect(
                screen.queryByLabelText('Exercise 1, technique set 1')
            ).not.toBeInTheDocument();

            // Nothing to take off yet, so the list stops at Custom.
            openMenu();
            expect(rowsOf('Exercise 1, set 1 technique')).toEqual([
                'Warm-up set',
                'Straight sets',
                'Top set',
                'Back off',
                'Custom',
            ]);
        });

        it('takes what the menu was asked for, Custom taking nothing', () => {
            const onChange = vi.fn();
            fields({ exercise: one(null), onChange });
            openMenu();
            fireEvent.click(screen.getByRole('button', { name: 'Top set' }));
            expect(onChange.mock.calls[0][0].sets[0].technique).toBe('Top set');

            openMenu();
            fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
            expect(onChange.mock.calls[1][0].sets[0].technique).toBe('');
        });

        // One off the list is shown on the slot itself; anything else is a
        // field to write in, and Custom opens one by handing the set a blank.
        it('shows a listed one and gives a written one a field', () => {
            const { unmount } = fields({ exercise: one('Top set') });
            expect(
                screen.getByRole('button', {
                    name: 'Exercise 1, set 1 technique',
                })
            ).toHaveTextContent('Top set');
            expect(
                screen.queryByLabelText('Exercise 1, technique set 1')
            ).not.toBeInTheDocument();
            unmount();

            fields({ exercise: one('My own') });
            expect(
                screen.getByLabelText('Exercise 1, technique set 1')
            ).toHaveValue('My own');
            expect(
                screen.queryByRole('button', {
                    name: 'Exercise 1, set 1 technique',
                })
            ).not.toBeInTheDocument();
        });

        // Swapping one is picking again from the same list, and the way off
        // the set only appears once there is one to take off.
        it('swaps or drops a listed one from the same menu', () => {
            const onChange = vi.fn();
            fields({ exercise: one('Top set'), onChange });

            openMenu();
            // The same word the drop's per cent uses for the same move: back
            // to nothing, which destroys nothing.
            expect(rowsOf('Exercise 1, set 1 technique')).toContain(
                'Unspecified'
            );

            fireEvent.click(screen.getByRole('button', { name: 'Back off' }));
            expect(onChange.mock.calls[0][0].sets[0].technique).toBe(
                'Back off'
            );

            openMenu();
            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Exercise 1, remove technique set 1',
                })
            );
            expect(onChange).toHaveBeenLastCalledWith({
                sets: [{ ...draft.sets[0], technique: null }],
            });
        });

        it('hands a written one back to the empty slot from its own mark', () => {
            const onChange = vi.fn();
            fields({ exercise: one('My own'), onChange });
            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Exercise 1, remove technique set 1',
                })
            );
            expect(onChange).toHaveBeenLastCalledWith({
                sets: [{ ...draft.sets[0], technique: null }],
            });
        });

        // Saving a blank one is allowed; it is the routine that reports it.
        it('is marked once it has been added and left blank', () => {
            fields({
                exercise: one(''),
                fault: {
                    name: false,
                    sets: [
                        {
                            min: false,
                            max: false,
                            value: false,
                            technique: true,
                        },
                    ],
                },
            });
            expect(
                screen.getByLabelText('Exercise 1, technique set 1')
            ).toHaveClass('border-danger');
        });
    });

    describe("the drop set's per cent", () => {
        const dropped = (value: string) => ({
            ...draft,
            sets: [
                draft.sets[0],
                { ...draft.sets[0], kind: 'drop' as const, value },
            ],
        });
        const trigger = () =>
            screen.getByRole('button', { name: 'Exercise 1, DS1 amount' });

        it('is a menu, and says what it holds once it has one', () => {
            const onChange = vi.fn();
            const { unmount } = fields({ exercise: dropped(''), onChange });
            // The unit on its own, on any screen: the row above it already
            // says the set is a drop.
            expect(trigger()).toHaveTextContent('%');

            fireEvent.click(trigger());
            const menu = within(trigger().parentElement!)
                .getAllByRole('button')
                .map((button) => button.textContent);
            expect(menu.slice(1)).toEqual(['10%', '20%', '30%', '40%', '50%']);

            fireEvent.click(screen.getByRole('button', { name: '30%' }));
            expect(onChange.mock.calls[0][0].sets[1].value).toBe('30');
            unmount();

            fields({ exercise: dropped('30') });
            expect(trigger()).toHaveTextContent('30%');
        });

        // A drop with no per cent trains fine, so the row that says so is only
        // worth offering once one has been picked.
        it('offers to go back to unspecified once it holds something', () => {
            const onChange = vi.fn();
            const { unmount } = fields({ exercise: dropped('') });
            fireEvent.click(trigger());
            expect(
                screen.queryByRole('button', { name: 'Unspecified' })
            ).not.toBeInTheDocument();
            unmount();

            fields({ exercise: dropped('30'), onChange });
            fireEvent.click(trigger());
            fireEvent.click(
                screen.getByRole('button', { name: 'Unspecified' })
            );
            expect(onChange.mock.calls[0][0].sets[1].value).toBe('');
        });

        // The pause of a rest-pause is typed, not picked: it is the set's whole
        // point and any second of it counts.
        it('leaves the rest-pause seconds as a field', () => {
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
            expect(screen.getByLabelText('Exercise 1, RP1 amount')).toHaveValue(
                15
            );
        });
    });
});
