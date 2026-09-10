/** Pure progression logic. No Prisma, no React: the only part with unit tests. */

export type ExercisePlan = { id: string; sets: readonly unknown[] };
export type SetValue = { weight: number; reps: number };
/** exerciseId -> setIndex -> logged value */
export type Logs = Record<
    string,
    Record<number, SetValue | undefined> | undefined
>;
/** What a set was last given, and the week it came from. Weeks differ per set:
    a day skipped half-done leaves newer numbers on some sets than on others. */
export type PreviousValue = SetValue & { week: number };
export type PreviousLogs = Record<
    string,
    Record<number, PreviousValue | undefined> | undefined
>;

export type FlatSet = {
    exerciseId: string;
    exerciseIndex: number;
    setIndex: number;
};

/**
 * Current position inside the routine.
 * The sequence is week 1 (day 1..W), week 2 (day 1..W)... up to durationWeeks.
 * ponytail: index-based cursor; adding or deleting workouts mid-routine shifts the
 * position. Move to explicit (week, workoutId) if that ever becomes a problem.
 */
export function positionFromCursor(
    cursor: number,
    workoutCount: number,
    durationWeeks: number
): { week: number; workoutIndex: number } | null {
    if (workoutCount <= 0 || durationWeeks <= 0) return null;
    if (cursor < 0 || cursor >= workoutCount * durationWeeks) return null;
    return {
        week: Math.floor(cursor / workoutCount) + 1,
        workoutIndex: cursor % workoutCount,
    };
}

/**
 * How a logged set stands against the last time that same set was logged.
 *
 * Either number rising is progress: adding weight at the cost of a rep is how a
 * set moves forward, and so is squeezing an extra rep out of the same bar. Only
 * a set that gave ground on one number and gained on neither has gone back.
 */
export type SetTrend = 'up' | 'down' | 'same';

export function setTrend(value: SetValue, previous: SetValue): SetTrend {
    if (value.weight > previous.weight || value.reps > previous.reps)
        return 'up';
    if (value.weight === previous.weight && value.reps === previous.reps)
        return 'same';
    return 'down';
}

/** Where one day of one week sits relative to the cursor: the question the
    history page asks of every row it draws, so a blank cell can say "you
    skipped this" rather than "you have not got there yet". */
export type WeekState = 'past' | 'current' | 'upcoming';

export function weekState(
    cursor: number,
    week: number,
    workoutIndex: number,
    workoutCount: number
): WeekState {
    const position = (week - 1) * workoutCount + workoutIndex;
    if (cursor > position) return 'past';
    return cursor === position ? 'current' : 'upcoming';
}

/** Every workout of every week is behind the cursor. An empty routine is never
    finished, however far the cursor has been pushed. */
export function isRoutineFinished(
    cursor: number,
    workoutCount: number,
    durationWeeks: number
): boolean {
    const total = workoutCount * durationWeeks;
    return total > 0 && cursor >= total;
}

/**
 * A routine that has been lived in is frozen: its plan is what the sessions
 * were logged against, and what the cursor is counting. Being active is enough
 * on its own — training starts the moment it goes live. Only a routine still on
 * the shelf, untouched, can be rewritten.
 */
export function isRoutineLocked(routine: {
    isActive: boolean;
    cursor: number;
    sessionCount: number;
}): boolean {
    return routine.isActive || routine.cursor > 0 || routine.sessionCount > 0;
}

/** Every set of the workout, in the order they must be filled in. */
export function flatSets(exercises: ExercisePlan[]): FlatSet[] {
    return exercises.flatMap((e, exerciseIndex) =>
        Array.from({ length: e.sets.length }, (_, setIndex) => ({
            exerciseId: e.id,
            exerciseIndex,
            setIndex,
        }))
    );
}

export function isSetFilled(
    logs: Logs,
    exerciseId: string,
    setIndex: number
): boolean {
    const v = logs[exerciseId]?.[setIndex];
    return !!v && Number.isFinite(v.weight) && v.weight >= 0 && v.reps > 0;
}

/**
 * A set is only enabled when every earlier set of the *same* exercise has been
 * filled in. Exercises are independent: each one opens its first set right away.
 */
export function isSetEnabled(
    exercises: ExercisePlan[],
    logs: Logs,
    exerciseId: string,
    setIndex: number
): boolean {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise || setIndex < 0 || setIndex >= exercise.sets.length)
        return false;
    return Array.from({ length: setIndex }, (_, i) => i).every((i) =>
        isSetFilled(logs, exerciseId, i)
    );
}

/** The workout is done once the last set is filled in. */
export function isSessionComplete(
    exercises: ExercisePlan[],
    logs: Logs
): boolean {
    const flat = flatSets(exercises);
    return (
        flat.length > 0 &&
        flat.every((s) => isSetFilled(logs, s.exerciseId, s.setIndex))
    );
}
