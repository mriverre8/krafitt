import {
    isRoutineFinished,
    isRoutineLocked,
    isSessionComplete,
    isSetEnabled,
    positionFromCursor,
    setTrend,
    weekState,
    type Logs,
} from '@/lib/progress';
import { describe, expect, it } from 'vitest';

/** Only the number of sets matters here, so the rows can be empty objects. */
const plan = (id: string, count: number) => ({
    id,
    sets: Array.from({ length: count }, () => ({})),
});

const exercises = [plan('a', 2), plan('b', 1)];

describe('setTrend', () => {
    const before = { weight: 80, reps: 8 };

    it('counts either number rising as progress', () => {
        expect(setTrend({ weight: 82.5, reps: 8 }, before)).toBe('up');
        expect(setTrend({ weight: 80, reps: 9 }, before)).toBe('up');
    });

    // The usual shape of a working set moving forward: more bar, fewer reps.
    it('still counts more weight as progress when the reps give way', () => {
        expect(setTrend({ weight: 85, reps: 6 }, before)).toBe('up');
        expect(setTrend({ weight: 75, reps: 12 }, before)).toBe('up');
    });

    it('calls it a drop only when nothing gained', () => {
        expect(setTrend({ weight: 75, reps: 8 }, before)).toBe('down');
        expect(setTrend({ weight: 80, reps: 6 }, before)).toBe('down');
        expect(setTrend({ weight: 75, reps: 6 }, before)).toBe('down');
    });

    it('says nothing about a set that repeated itself', () => {
        expect(setTrend({ weight: 80, reps: 8 }, before)).toBe('same');
    });
});

describe('weekState', () => {
    // Two days a week, so the cursor walks 0=W1D1, 1=W1D2, 2=W2D1, 3=W2D2...
    it('splits the weeks around the cursor, day by day', () => {
        expect(weekState(3, 1, 0, 2)).toBe('past');
        expect(weekState(3, 2, 0, 2)).toBe('past');
        expect(weekState(3, 2, 1, 2)).toBe('current');
        expect(weekState(3, 3, 0, 2)).toBe('upcoming');
    });

    it('leaves every week ahead of a routine that has not started', () => {
        expect(weekState(0, 1, 0, 2)).toBe('current');
        expect(weekState(0, 1, 1, 2)).toBe('upcoming');
    });

    it('puts every week behind a routine that is over', () => {
        expect(weekState(6, 3, 1, 2)).toBe('past');
    });
});

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

describe('isRoutineLocked', () => {
    const shelved = { isActive: false, cursor: 0, sessionCount: 0 };

    it('leaves an untouched routine editable', () => {
        expect(isRoutineLocked(shelved)).toBe(false);
    });

    it('locks it as soon as it is being trained', () => {
        expect(isRoutineLocked({ ...shelved, isActive: true })).toBe(true);
        expect(isRoutineLocked({ ...shelved, cursor: 1 })).toBe(true);
    });

    // Activated, the first day half logged, then another routine took over:
    // the cursor never moved, but those sets point at these exercises.
    it('locks one that was left behind with sets logged against it', () => {
        expect(isRoutineLocked({ ...shelved, sessionCount: 1 })).toBe(true);
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
