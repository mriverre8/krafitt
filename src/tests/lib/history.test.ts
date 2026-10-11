import {
    matchExercises,
    sameExercise,
    setSlots,
    toLogs,
    toPrevious,
    type DayExercise,
    type SlotLog,
} from '@/lib/history';
import { describe, expect, it } from 'vitest';

const reps = (kind = 'normal') => ({ kind, repMode: 'range' });
const timed = (kind = 'normal') => ({ kind, repMode: 'time' });

describe('setSlots', () => {
    it('names working sets by number and the rest by the set they hang off', () => {
        expect(
            setSlots([reps(), reps('drop'), reps('drop'), reps(), reps('rest')])
        ).toEqual(['1', '1.DS1', '1.DS2', '2', '2.RP1']);
    });

    // The whole reason for slots: a position shifts when a drop is slotted in,
    // the name a set goes by does not.
    it('leaves the sets behind a new drop where they were', () => {
        const before = setSlots([reps(), reps(), reps()]);
        const after = setSlots([reps(), reps('drop'), reps(), reps()]);
        expect(after.filter((slot) => before.includes(slot))).toEqual(before);
    });

    it('files a timed set apart from the same set counted in reps', () => {
        expect(setSlots([reps(), timed(), timed('drop')])).toEqual([
            '1',
            '2.t',
            '2.DS1.t',
        ]);
    });
});

describe('sameExercise', () => {
    it('ignores case and the spaces round the name', () => {
        expect(sameExercise(' Bench press ', 'bench Press')).toBe(true);
        expect(sameExercise('Bench press', 'Incline press')).toBe(false);
    });
});

const day = (...exercises: Partial<DayExercise>[]): DayExercise[] =>
    exercises.map((exercise, index) => ({
        id: `e${index + 1}`,
        name: `Exercise ${index + 1}`,
        archived: false,
        logged: true,
        ...exercise,
    }));

describe('matchExercises', () => {
    it('keeps a card that kept its name on its own exercise', () => {
        expect(
            matchExercises(day({ name: 'Bench' }), [
                { id: 'e1', name: 'bench' },
            ])
        ).toEqual({ ids: ['e1'], archive: [], remove: [] });
    });

    // Swapping an exercise for another: the one that goes keeps its history,
    // the one that comes in starts with none.
    it('archives a logged exercise whose card now names another', () => {
        expect(
            matchExercises(day({ name: 'Bench' }), [
                { id: 'e1', name: 'Incline' },
            ])
        ).toEqual({ ids: [null], archive: ['e1'], remove: [] });
    });

    it('deletes one that was never logged, having nothing to keep', () => {
        expect(
            matchExercises(day({ name: 'Bench', logged: false }), [
                { id: 'e1', name: 'Incline' },
            ])
        ).toEqual({ ids: [null], archive: [], remove: ['e1'] });
    });

    it('brings an archived exercise back by its name', () => {
        expect(
            matchExercises(
                day({ name: 'Incline' }, { name: 'Bench', archived: true }),
                [{ id: 'e1', name: 'Bench' }]
            )
        ).toEqual({ ids: ['e2'], archive: ['e1'], remove: [] });
    });

    it('never archives again what is already archived', () => {
        expect(
            matchExercises(day({ name: 'Bench', archived: true }), [
                { id: null, name: 'Squat' },
            ])
        ).toEqual({ ids: [null], archive: [], remove: [] });
    });

    it('follows two exercises whose names were swapped', () => {
        expect(
            matchExercises(day({ name: 'Bench' }, { name: 'Squat' }), [
                { id: 'e1', name: 'Squat' },
                { id: 'e2', name: 'Bench' },
            ])
        ).toEqual({ ids: ['e2', 'e1'], archive: [], remove: [] });
    });

    // A new card earlier in the day must not take the exercise a later card
    // is still holding under the same name.
    it('lets a card keep its own exercise before others look by name', () => {
        expect(
            matchExercises(day({ name: 'Curl' }), [
                { id: null, name: 'Curl' },
                { id: 'e1', name: 'Curl' },
            ])
        ).toEqual({ ids: [null, 'e1'], archive: [], remove: [] });
    });
});

const log = (slot: string, weight: number): SlotLog => ({
    exerciseId: 'e1',
    slot,
    weight,
    reps: 8,
    effort: 'normal',
});

const value = (weight: number) => ({ weight, reps: 8, effort: 'normal' });

describe('toLogs', () => {
    const logs = [log('1', 60), log('2', 70), log('3', 80)];

    it('lays the logs out by where each set sits now', () => {
        expect(
            toLogs(logs, [
                { id: 'e1', sets: [reps(), reps('drop'), reps(), reps()] },
            ])
        ).toEqual({ e1: { 0: value(60), 2: value(70), 3: value(80) } });
    });

    // Set 3 taken out and put back: its numbers were never thrown away.
    it('hides a set the plan no longer has, and shows it again once it is back', () => {
        expect(toLogs(logs, [{ id: 'e1', sets: [reps(), reps()] }])).toEqual({
            e1: { 0: value(60), 1: value(70) },
        });
        expect(
            toLogs(logs, [{ id: 'e1', sets: [reps(), reps(), reps()] }])
        ).toEqual({ e1: { 0: value(60), 1: value(70), 2: value(80) } });
    });

    it('starts a set over when it turns timed', () => {
        expect(
            toLogs(logs, [{ id: 'e1', sets: [reps(), timed(), reps()] }])
        ).toEqual({ e1: { 0: value(60), 2: value(80) } });
    });

    it('leaves out an exercise the plan does not have', () => {
        expect(toLogs(logs, [{ id: 'e2', sets: [reps()] }])).toEqual({});
    });
});

describe('toPrevious', () => {
    it('keeps the newest week each set was given', () => {
        expect(
            toPrevious(
                [
                    { week: 1, logs: [log('1', 60), log('2', 60)] },
                    { week: 2, logs: [log('1', 65)] },
                ],
                [{ id: 'e1', sets: [reps(), reps()] }]
            )
        ).toEqual({
            e1: { 0: { ...value(65), week: 2 }, 1: { ...value(60), week: 1 } },
        });
    });
});
