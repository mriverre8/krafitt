import { emptyExercise, emptySet, noFault, toDrafts } from '@/lib/drafts';
import { describe, expect, it } from 'vitest';

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

    // A set the database never gave a kind to is a plain working set, and a
    // rep mode it does not recognise falls back to the one the editor opens on
    // rather than leaving the <select> on a value none of its options carry.
    it('falls back to a working set in range mode', () => {
        const [exercise] = toDrafts([
            {
                id: 'e1',
                name: 'Row',
                sets: [
                    {
                        repMode: 'nonsense',
                        repMin: null,
                        repMax: null,
                        technique: '',
                    },
                ],
            },
        ]);
        expect(exercise.sets[0].kind).toBe('normal');
        expect(exercise.sets[0].mode).toBe('range');
        expect(exercise.sets[0].repMin).toBe('');
    });

    // The drafts are compared and submitted as JSON, so a blank exercise must
    // serialise the same way every time it is built.
    it('starts a new exercise from one blank set', () => {
        expect(emptyExercise.id).toBeNull();
        expect(emptyExercise.sets).toEqual([emptySet]);
        expect(JSON.stringify(toDrafts([]))).toBe(
            JSON.stringify([emptyExercise])
        );
    });

    it('flags nothing until the day has been validated', () => {
        expect(noFault).toEqual({ min: false, max: false, value: false });
    });
});
