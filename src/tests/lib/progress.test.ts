import {
    HISTORY_WINDOW,
    historyWeeks,
    isRoutineFinished,
    isRoutineLocked,
    isSessionComplete,
    isSetEnabled,
    positionFromCursor,
    profileRoutines,
    setMove,
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

describe('setMove', () => {
    const before = { weight: 80, reps: 8 };

    // The usual shape of a working set moving forward: more bar, fewer reps.
    it('answers on the weight whatever the reps did', () => {
        expect(setMove({ weight: 82.5, reps: 8 }, before)).toEqual({
            dir: 'up',
            part: 'weight',
        });
        expect(setMove({ weight: 85, reps: 6 }, before)).toEqual({
            dir: 'up',
            part: 'weight',
        });
    });

    // The bar leads absolutely: extra reps do not buy back a lighter bar.
    it('calls a lighter bar a drop however many reps came with it', () => {
        expect(setMove({ weight: 75, reps: 12 }, before)).toEqual({
            dir: 'down',
            part: 'weight',
        });
    });

    it('lets the reps answer once the bar has not moved', () => {
        expect(setMove({ weight: 80, reps: 9 }, before)).toEqual({
            dir: 'up',
            part: 'reps',
        });
        expect(setMove({ weight: 80, reps: 6 }, before)).toEqual({
            dir: 'down',
            part: 'reps',
        });
    });

    // Same bar, same reps, one notch easier: the only progress there was.
    it('falls through to how it felt when both numbers repeated', () => {
        expect(
            setMove({ weight: 80, reps: 8, effort: 'easy' }, before)
        ).toEqual({ dir: 'up', part: 'effort' });
        expect(
            setMove({ weight: 80, reps: 8, effort: 'fail' }, before)
        ).toEqual({ dir: 'down', part: 'effort' });
        expect(
            setMove(
                { weight: 80, reps: 8, effort: 'normal' },
                { ...before, effort: 'hard' }
            )
        ).toEqual({ dir: 'up', part: 'effort' });
    });

    // An unmarked set is a normal one, so it neither gains nor loses against
    // another unmarked set.
    it('says nothing about a set that repeated itself down to the feel', () => {
        expect(setMove({ weight: 80, reps: 8 }, before)).toBeNull();
        expect(
            setMove(
                { weight: 80, reps: 8, effort: 'normal' },
                { ...before, effort: 'normal' }
            )
        ).toBeNull();
        expect(
            setMove({ weight: 80, reps: 8, effort: 'normal' }, before)
        ).toBeNull();
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

    it('keeps walking an open-ended routine past any week', () => {
        expect(positionFromCursor(6, 2, null)).toEqual({
            week: 4,
            workoutIndex: 0,
        });
        expect(positionFromCursor(999, 2, null)).not.toBeNull();
        expect(positionFromCursor(0, 0, null)).toBeNull();
    });
});

describe('historyWeeks', () => {
    it('lays out every week of a routine that has an end', () => {
        expect(historyWeeks(3, 4, 2)).toEqual([1, 2, 3]);
    });

    // Ten rows, and the tenth week of one window is the first row of the next:
    // the week just finished stays on screen as the one to beat.
    it('holds an open-ended routine to a rolling ten weeks', () => {
        const window = (cursor: number) => historyWeeks(null, cursor, 2);
        const first = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        expect(window(0)).toEqual(first);
        // Week 10, still being trained: the window it belongs to is intact.
        expect(window(18)).toEqual(first);
        // Week 11: the ten weeks start again on the week just finished.
        expect(window(20)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
        expect(window(36)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
        expect(window(38)).toEqual([19, 20, 21, 22, 23, 24, 25, 26, 27, 28]);
    });

    it('always draws the same number of rows, days or no days', () => {
        expect(historyWeeks(null, 0, 0)).toHaveLength(HISTORY_WINDOW);
        expect(historyWeeks(null, 500, 3)).toHaveLength(HISTORY_WINDOW);
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

    it('never calls an open-ended routine finished', () => {
        expect(isRoutineFinished(999, 2, null)).toBe(false);
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

describe('profileRoutines', () => {
    const routine = (id: string, extra: Record<string, boolean> = {}) => ({
        id,
        isActive: false,
        isPublic: false,
        finished: false,
        ...extra,
    });

    const active = routine('active', { isActive: true });
    const publicActive = routine('active', { isActive: true, isPublic: true });
    const done = routine('done', { isPublic: true, finished: true });
    const quiet = routine('quiet', { finished: true });
    const shared = routine('shared', { isPublic: true });

    it('shows me my own active routine even when it is private', () => {
        expect(profileRoutines([active, done], true).active).toBe(active);
    });

    it('hides a private active routine from a visitor', () => {
        expect(profileRoutines([active, done], false).active).toBeUndefined();
        expect(profileRoutines([publicActive], false).active).toBe(
            publicActive
        );
    });

    it('lists the finished routines that were shared, and nothing else', () => {
        const { published } = profileRoutines(
            [done, quiet, shared, publicActive],
            true
        );
        expect(published.map((r) => r.id)).toEqual(['done']);
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
