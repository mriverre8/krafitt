import type { Logs } from '@/lib/progress';
import { e1rm, exerciseStats, routineStats } from '@/lib/stats';
import { describe, expect, it } from 'vitest';

/** A top set in reps and a plank held for seconds. */
const bench = {
    id: 'e1',
    sets: [{ repMode: 'range' }, { repMode: 'time' }],
};

const weeks: Record<number, Logs> = {
    1: { e1: { 0: { weight: 100, reps: 5 }, 1: { weight: 0, reps: 60 } } },
    2: { e1: { 0: { weight: 105, reps: 5, effort: 'hard' } } },
    3: { e1: { 0: { weight: 100, reps: 5 } } },
};

describe('e1rm', () => {
    it('reads a single as itself and adds a thirtieth per rep', () => {
        expect(e1rm(100, 1)).toBe(100);
        expect(e1rm(90, 10)).toBe(120);
    });
});

describe('exerciseStats', () => {
    const stats = exerciseStats(bench, weeks);

    it('finds the best set and the week it came in', () => {
        expect(stats.best).toMatchObject({ weight: 105, reps: 5, week: 2 });
    });

    // Held seconds are not kilos: the plank adds nothing to the volume. Weeks
    // 2 and 3 stopped at the top set: neither is a yardstick, so both are
    // measured against week 1, the last one done in full.
    it('adds up kilos per week against the last week done in full', () => {
        const week1 = { week: 1, kg: 500 };
        expect(stats.volume).toEqual([
            { ...week1, partial: false, against: null },
            { week: 2, kg: 525, partial: true, against: week1 },
            { week: 3, kg: 500, partial: true, against: week1 },
        ]);
    });

    it('dates a best set matched again by the last week it was done', () => {
        const set = { e1: { 0: { weight: 100, reps: 5 } } };
        expect(
            exerciseStats(bench, { 1: set, 2: set, 3: set }).best
        ).toMatchObject({ weight: 100, reps: 5, week: 3 });
    });

    // 110×5 at failure is heavier, but was not done: 100×5 stays the best,
    // and the max has not moved since week one.
    it('leaves failed sets out of the best set and the max', () => {
        const stats = exerciseStats(bench, {
            1: { e1: { 0: { weight: 100, reps: 5 } } },
            2: { e1: { 0: { weight: 110, reps: 5, effort: 'fail' } } },
            3: { e1: { 0: { weight: 100, reps: 5 } } },
        });
        expect(stats.best).toMatchObject({ weight: 100, week: 3 });
        expect(stats.change).toBe(0);
        // The kilos were still moved.
        expect(stats.volume.map((row) => row.kg)).toEqual([500, 550, 500]);
    });

    it('measures the estimated max against the first week', () => {
        expect(stats.change).toBe(0);
    });

    it('counts a week that beat every one before it as a record', () => {
        expect(stats.records).toBe(1);
    });

    // 100×6 estimates under 105×5, but no week had done six on 100 before.
    // Effort plays no part: the same reps felt easier is not a record.
    it('counts more reps on a weight already lifted as a record', () => {
        const set = (weight: number, reps: number, effort?: 'easy') => ({
            e1: { 0: { weight, reps, effort } },
        });
        expect(
            exerciseStats(bench, {
                1: set(100, 5),
                2: set(105, 5),
                3: set(100, 6),
                4: set(100, 6, 'easy'),
            }).records
        ).toBe(2);
    });

    // The failed nine, heavier or not, is no record and no bar to clear:
    // the clean nine after it is the record, measured against the eight.
    it('leaves failed sets out of the records', () => {
        const set = (weight: number, reps: number, effort?: 'fail') => ({
            e1: { 0: { weight, reps, effort } },
        });
        expect(
            exerciseStats(bench, {
                1: set(100, 8),
                2: set(100, 9, 'fail'),
                3: set(110, 8, 'fail'),
                4: set(100, 9),
            }).records
        ).toBe(1);
    });

    it('counts the weeks since a set last moved up', () => {
        expect(stats.stalled).toBe(1);
        expect(
            exerciseStats(bench, {
                ...weeks,
                4: { e1: { 0: { weight: 100, reps: 5 } } },
                5: { e1: { 0: { weight: 100, reps: 6 } } },
            }).stalled
        ).toBe(0);
    });

    describe('stalled', () => {
        const set = (reps: number, effort?: 'easy' | 'fail') => ({
            e1: { 0: { weight: 100, reps, effort } },
        });
        const stalled = (...sets: ReturnType<typeof set>[]) =>
            exerciseStats(
                bench,
                Object.fromEntries(sets.map((logs, i) => [i + 1, logs]))
            ).stalled;

        it('is not moved by a set that only felt easier', () => {
            expect(stalled(set(8), set(8, 'easy'))).toBe(1);
        });

        // 3×8, then 3×9 at failure: the ninth rep did not go up.
        it('is not moved by more reps that failed', () => {
            expect(stalled(set(8), set(9, 'fail'))).toBe(1);
        });

        // The failed nine is no yardstick: a clean nine beats the eight.
        it('is moved by doing clean what failed before', () => {
            expect(stalled(set(8), set(9, 'fail'), set(9))).toBe(0);
        });
    });

    it('has nothing to say about an exercise never logged', () => {
        expect(exerciseStats(bench, {})).toEqual({
            best: null,
            change: null,
            volume: [],
            records: 0,
            stalled: 0,
        });
    });
});

describe('routineStats', () => {
    const at = (minutes: number) => new Date(minutes * 60_000);

    it('sums the routine and takes the typical session length', () => {
        const stats = routineStats(
            [{ exercises: [bench], weeks }],
            [
                { startedAt: at(0), completedAt: at(50) },
                { startedAt: at(0), completedAt: at(60) },
                // Left open overnight: not a day trained for ten hours.
                { startedAt: at(0), completedAt: at(600) },
                { startedAt: at(0), completedAt: null },
            ],
            5
        );
        // Five weeks behind the cursor: one done in full, two stopped at the
        // top set, two never started.
        expect(stats).toEqual({
            done: 1,
            due: 5,
            setsDone: 4,
            setsDue: 10,
            stalled: 0,
            volume: 1525,
            records: 1,
            efforts: { fail: 0, hard: 1, normal: 3, easy: 0 },
            minutes: 60,
        });
    });

    // Today's day finished, the cursor not moved on yet; unfinished, it may
    // just not have been trained yet, so it is not asked for.
    it('counts the cursor day only once it is finished', () => {
        const day = (logs: Logs) => [
            { exercises: [bench], weeks: { 1: logs } },
        ];
        expect(routineStats(day(weeks[1]), [], 0)).toMatchObject({
            done: 1,
            due: 1,
            setsDone: 2,
            setsDue: 2,
        });
        expect(routineStats(day(weeks[2]), [], 0)).toMatchObject({
            due: 0,
            setsDue: 0,
        });
    });

    // Squat has not moved in three weeks; bench beat week 1 in week 2.
    it('counts the exercises stalled across every day', () => {
        const squat = { ...bench, id: 'e2' };
        const same = { e2: { 0: { weight: 140, reps: 5 } } };
        const stats = routineStats(
            [
                { exercises: [bench], weeks },
                {
                    exercises: [squat],
                    weeks: { 1: same, 2: same, 3: same, 4: same },
                },
            ],
            [],
            0
        );
        expect(stats.stalled).toBe(1);
    });
});
