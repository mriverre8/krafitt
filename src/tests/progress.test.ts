import {
    isRoutineFinished,
    isSessionComplete,
    isSetEnabled,
    positionFromCursor,
    type Logs,
} from '@/lib/progress';
import { describe, expect, it } from 'vitest';

/** Only the number of sets matters here, so the rows can be empty objects. */
const plan = (id: string, count: number) => ({
    id,
    sets: Array.from({ length: count }, () => ({})),
});

const exercises = [plan('a', 2), plan('b', 1)];

describe('positionFromCursor', () => {
    it('walks day by day and then week by week', () => {
        expect(positionFromCursor(0, 2, 3)).toEqual({
            week: 1,
            workoutIndex: 0,
        });
        expect(positionFromCursor(1, 2, 3)).toEqual({
            week: 1,
            workoutIndex: 1,
        });
        expect(positionFromCursor(2, 2, 3)).toEqual({
            week: 2,
            workoutIndex: 0,
        });
        expect(positionFromCursor(5, 2, 3)).toEqual({
            week: 3,
            workoutIndex: 1,
        });
    });

    it('returns null once the routine is over, or when it has no workouts', () => {
        expect(positionFromCursor(6, 2, 3)).toBeNull();
        expect(positionFromCursor(0, 0, 3)).toBeNull();
    });
});

describe('isRoutineFinished', () => {
    it('is done once the cursor has walked every week', () => {
        expect(isRoutineFinished(5, 2, 3)).toBe(false);
        expect(isRoutineFinished(6, 2, 3)).toBe(true);
        expect(isRoutineFinished(99, 2, 3)).toBe(true);
    });

    it('never calls an empty routine finished', () => {
        expect(isRoutineFinished(0, 0, 3)).toBe(false);
        expect(isRoutineFinished(10, 0, 3)).toBe(false);
    });
});

describe('isSetEnabled', () => {
    it('opens the first set of every exercise when nothing is logged', () => {
        const logs: Logs = {};
        expect(isSetEnabled(exercises, logs, 'a', 0)).toBe(true);
        expect(isSetEnabled(exercises, logs, 'a', 1)).toBe(false);
        expect(isSetEnabled(exercises, logs, 'b', 0)).toBe(true);
    });

    it('moves on to the next field once the previous one is filled', () => {
        const logs: Logs = { a: { 0: { weight: 60, reps: 8 } } };
        expect(isSetEnabled(exercises, logs, 'a', 1)).toBe(true);
    });

    it('keeps exercises independent', () => {
        const logs: Logs = { b: { 0: { weight: 20, reps: 12 } } };
        expect(isSetEnabled(exercises, logs, 'a', 1)).toBe(false);
        expect(isSetEnabled(exercises, logs, 'a', 0)).toBe(true);
    });

    it('rejects a set that does not exist', () => {
        expect(isSetEnabled(exercises, {}, 'a', 99)).toBe(false);
        expect(isSetEnabled(exercises, {}, 'nope', 0)).toBe(false);
    });

    it('accepts 0 kg (bodyweight) but not 0 reps', () => {
        expect(
            isSetEnabled(
                exercises,
                { a: { 0: { weight: 0, reps: 10 } } },
                'a',
                1
            )
        ).toBe(true);
        expect(
            isSetEnabled(
                exercises,
                { a: { 0: { weight: 60, reps: 0 } } },
                'a',
                1
            )
        ).toBe(false);
    });
});

describe('isSessionComplete', () => {
    it('is only complete once the very last set is logged', () => {
        const almost: Logs = {
            a: { 0: { weight: 60, reps: 8 }, 1: { weight: 60, reps: 7 } },
        };
        expect(isSessionComplete(exercises, almost)).toBe(false);
        expect(
            isSessionComplete(exercises, {
                ...almost,
                b: { 0: { weight: 30, reps: 12 } },
            })
        ).toBe(true);
    });

    it('never completes a workout that has no exercises', () => {
        expect(isSessionComplete([], {})).toBe(false);
    });
});
