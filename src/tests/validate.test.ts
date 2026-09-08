import { createT } from '@/i18n/config';
import { en } from '@/i18n/en';
import type { RepSpec } from '@/lib/reps';
import { routineProblems } from '@/lib/validate';
import { describe, expect, it } from 'vitest';

const t = createT(en);

const set: RepSpec = { repMode: 'range', repMin: 6, repMax: 8 };

describe('routineProblems', () => {
    it('passes a routine with every field filled in', () => {
        expect(
            routineProblems(
                {
                    workouts: [
                        {
                            name: 'Push A',
                            exercises: [{ name: 'Bench press', sets: [set] }],
                        },
                    ],
                },
                t
            )
        ).toEqual([]);
    });

    it('catches a routine with no days', () => {
        expect(routineProblems({ workouts: [] }, t)).toEqual([
            'The routine has no days.',
        ]);
    });

    it('catches a day with no exercises', () => {
        expect(
            routineProblems({ workouts: [{ name: 'Legs', exercises: [] }] }, t)
        ).toEqual(['Legs: no exercises yet.']);
    });

    it('names the exercise that is still blank', () => {
        expect(
            routineProblems(
                {
                    workouts: [
                        {
                            name: 'Push A',
                            exercises: [
                                {
                                    name: '',
                                    sets: [
                                        {
                                            repMode: 'range',
                                            repMin: null,
                                            repMax: null,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                t
            )
        ).toEqual([
            'Push A · exercise 1: give it a name.',
            'Push A · exercise 1: the sets are not fully defined.',
        ]);
    });

    it('accepts AMRAP but not a half-written range', () => {
        const workouts = (sets: RepSpec[]) => ({
            workouts: [
                { name: 'Push A', exercises: [{ name: 'Bench', sets }] },
            ],
        });
        expect(
            routineProblems(
                workouts([{ repMode: 'amrap', repMin: null, repMax: null }]),
                t
            )
        ).toEqual([]);
        expect(
            routineProblems(
                workouts([{ repMode: 'range', repMin: 6, repMax: null }]),
                t
            )
        ).toEqual(['Push A · Bench: the sets are not fully defined.']);
    });
});
