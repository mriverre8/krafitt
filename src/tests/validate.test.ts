import { createT } from '@/i18n/config';
import { en } from '@/i18n/en';
import type { RepSpec } from '@/lib/reps';
import {
    isRoutineComplete,
    workoutFaults,
    workoutProblems,
} from '@/lib/validate';
import { describe, expect, it } from 'vitest';

const t = createT(en);

const set: RepSpec = { repMode: 'range', repMin: 6, repMax: 8 };
const day = (sets: RepSpec[], name = 'Bench') => ({
    exercises: [{ name, sets }],
});

describe('workoutProblems', () => {
    it('passes a day with every field filled in', () => {
        expect(workoutProblems(day([set]), t)).toEqual([]);
    });

    it('catches a day with no exercises', () => {
        expect(workoutProblems({ exercises: [] }, t)).toEqual([
            'No exercises yet.',
        ]);
    });

    it('names the exercise by its position while it is still blank', () => {
        expect(
            workoutProblems(
                day([{ repMode: 'range', repMin: null, repMax: null }], ''),
                t
            )
        ).toEqual([
            'Exercise 1: give it a name.',
            'Exercise 1: the sets are not properly defined.',
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
        ).toEqual(['Bench: the sets are not properly defined.']);
    });

    it('rejects a range that starts and ends on the same number', () => {
        expect(
            workoutProblems(
                day([{ repMode: 'range', repMin: 8, repMax: 8 }]),
                t
            )
        ).toEqual(['Bench: the sets are not properly defined.']);
        // The same prescription, said the way the fixed mode says it.
        expect(
            workoutProblems(
                day([{ repMode: 'fixed', repMin: 8, repMax: null }]),
                t
            )
        ).toEqual([]);
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
            'Exercise 1: give it a name.',
            'Exercise 1: the sets are not properly defined.',
        ]);
        expect(workoutFaults(exercises)).toEqual({
            e1: { name: true, sets: [{ min: false, max: true, value: false }] },
            e2: {
                name: false,
                sets: [{ min: false, max: false, value: false }],
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
