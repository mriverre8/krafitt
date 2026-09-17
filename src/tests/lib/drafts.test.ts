import { emptyExercise, emptySet, toDrafts } from '@/lib/drafts';
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

    // Every field is a string in the form, blanks and all, so a day can be
    // written a bit at a time — and a set with nothing on it has to survive the
    // trip rather than come back as a set that says AMRAP.
    it('turns everything the day has not filled in into a blank', () => {
        expect(
            toDrafts([
                {
                    id: 'e1',
                    name: '',
                    sets: [
                        {
                            repMode: 'range',
                            repMin: null,
                            repMax: null,
                            technique: null,
                        },
                    ],
                },
            ])[0].sets[0]
        ).toEqual(emptySet);
    });

    // A drop is an ordinary row carrying its own amount, and the amount comes
    // back as the string its field holds.
    it('keeps a drop or rest-pause row as the row it is', () => {
        expect(
            toDrafts([
                {
                    id: 'e1',
                    name: 'Bench press',
                    sets: [
                        {
                            repMode: 'amrap',
                            repMin: null,
                            repMax: null,
                            technique: null,
                            kind: 'drop',
                            value: 30,
                        },
                    ],
                },
            ])[0].sets[0]
        ).toMatchObject({ kind: 'drop', mode: 'amrap', value: '30' });
    });

    // The mode is a string in the database, so anything unreadable has to land
    // somewhere — and a range is the one mode that shows both boxes, which is
    // what makes a bad value visible rather than quietly read as AMRAP.
    it('falls back to a range when the stored mode is not one', () => {
        expect(
            toDrafts([
                {
                    id: 'e1',
                    name: 'Bench press',
                    sets: [
                        {
                            repMode: 'nonsense',
                            repMin: 4,
                            repMax: 6,
                            technique: null,
                        },
                    ],
                },
            ])[0].sets[0].mode
        ).toBe('range');
    });
});
