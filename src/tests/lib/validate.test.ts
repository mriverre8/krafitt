import { createT } from '@/i18n/config';
import { en } from '@/i18n/en';
import type { RepSpec } from '@/lib/reps';
import {
    blankExerciseFault,
    isRoutineComplete,
    workoutFaults,
    workoutProblems,
    type PlannedSet,
} from '@/lib/validate';
import { describe, expect, it } from 'vitest';

const t = createT(en);

const set: RepSpec = { repMode: 'range', repMin: 6, repMax: 8 };
const day = (sets: PlannedSet[], name = 'Bench') => ({
    exercises: [{ name, sets }],
});

describe('workoutProblems', () => {
    it('passes a day with every field filled in', () => {
        expect(workoutProblems(day([set]), t)).toEqual([]);
    });

    // A day is added with nothing on it, but the editor opens a blank card on
    // it straight away: the complaints have to be about that card's fields, or
    // they point at nothing the user can see.
    it('reads a day with no exercises as the blank card shown for it', () => {
        expect(workoutProblems({ exercises: [] }, t)).toEqual([
            { where: 'Exercise 1', what: 'give it a name' },
            { where: 'Exercise 1, set 1', what: 'the reps are missing' },
        ]);
    });

    // Show errors paints from this one, since the blank card is in no save and
    // so has no id in workoutFaults. It has to cover the row the editor draws:
    // the name and the set's two rep boxes.
    it('flags every field of that blank card for the highlight', () => {
        expect(blankExerciseFault).toEqual({
            name: true,
            sets: [{ min: true, max: true, value: false, technique: false }],
        });
    });

    it('names the exercise by its position while it is still blank', () => {
        expect(
            workoutProblems(
                day([{ repMode: 'range', repMin: null, repMax: null }], ''),
                t
            )
        ).toEqual([
            { where: 'Exercise 1', what: 'give it a name' },
            { where: 'Exercise 1, set 1', what: 'the reps are missing' },
        ]);
    });

    it('accepts AMRAP but not a half-written range', () => {
        expect(
            workoutProblems(
                day([{ repMode: 'amrap', repMin: null, repMax: null }]),
                t
            )
        ).toEqual([]);
        expect(
            workoutProblems(
                day([{ repMode: 'range', repMin: 6, repMax: null }]),
                t
            )
        ).toEqual([{ where: 'Bench, set 1', what: 'the reps are missing' }]);
    });

    it('rejects a range that starts and ends on the same number', () => {
        expect(
            workoutProblems(
                day([{ repMode: 'range', repMin: 8, repMax: 8 }]),
                t
            )
        ).toEqual([
            {
                where: 'Bench, set 1',
                what: 'max reps must be higher than min reps',
            },
        ]);
        // The same prescription, said the way the fixed mode says it.
        expect(
            workoutProblems(
                day([{ repMode: 'fixed', repMin: 8, repMax: null }]),
                t
            )
        ).toEqual([]);
    });

    // A set is free to have no technique at all — the plan then calls it by its
    // number. One that was added and left blank names nothing, and is a hole.
    it('accepts a set with no technique but not a blank one', () => {
        expect(workoutProblems(day([{ ...set, technique: null }]), t)).toEqual(
            []
        );
        expect(
            workoutProblems(day([{ ...set, technique: 'Top set' }]), t)
        ).toEqual([]);
        expect(workoutProblems(day([{ ...set, technique: '  ' }]), t)).toEqual([
            { where: 'Bench, set 1', what: 'name the technique or remove it' },
        ]);
    });

    // The list sits apart from the fields, so each line says which set and
    // what it is missing rather than that something, somewhere, is wrong.
    it('says which set is wrong and why', () => {
        expect(
            workoutProblems(
                day([
                    set,
                    { repMode: 'fixed', repMin: 0, repMax: null },
                    { repMode: 'time', repMin: null, repMax: null },
                    { ...set, kind: 'rest', value: null },
                    { ...set, kind: 'rest', value: 90 },
                ]),
                t
            )
        ).toEqual([
            { where: 'Bench, set 2', what: 'reps must be between 1 and 1000' },
            { where: 'Bench, set 3', what: 'the seconds are missing' },
            { where: 'Bench, set RP1', what: 'the pause is missing' },
            {
                where: 'Bench, set RP2',
                what: 'the pause must be between 1 and 60 seconds',
            },
        ]);
    });
});

describe('workoutFaults', () => {
    it('flags the same fields the problems are worded from', () => {
        const exercises = [
            {
                id: 'e1',
                name: '',
                sets: [{ repMode: 'range', repMin: 6, repMax: null }],
            },
            { id: 'e2', name: 'Dips', sets: [set] },
        ];
        expect(workoutProblems({ exercises }, t)).toEqual([
            { where: 'Exercise 1', what: 'give it a name' },
            { where: 'Exercise 1, set 1', what: 'the reps are missing' },
        ]);
        expect(workoutFaults(exercises)).toEqual({
            e1: {
                name: true,
                sets: [
                    { min: false, max: true, value: false, technique: false },
                ],
            },
            e2: {
                name: false,
                sets: [
                    { min: false, max: false, value: false, technique: false },
                ],
            },
        });
    });
});

describe('isRoutineComplete', () => {
    it('needs at least one day', () => {
        expect(isRoutineComplete({ workouts: [] }, t)).toBe(false);
    });

    it('needs every day to be complete', () => {
        expect(
            isRoutineComplete({ workouts: [day([set]), day([set])] }, t)
        ).toBe(true);
        expect(
            isRoutineComplete({ workouts: [day([set]), { exercises: [] }] }, t)
        ).toBe(false);
    });
});
