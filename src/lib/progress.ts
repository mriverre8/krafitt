/** Pure progression logic. No Prisma, no React */

export type ExercisePlan = { id: string; sets: readonly unknown[] };
/** How a set felt: one more in the tank, as planned, a grind, or the rep that
    did not go up. Every set has one — a set nobody marked is a normal one. */
export type Effort = 'easy' | 'normal' | 'hard' | 'fail';
/** Hardest first: the order the picker draws them in, read as a scale from
    "the bar won" to "had more left". */
export const EFFORTS: readonly Effort[] = ['fail', 'hard', 'normal', 'easy'];
/** Kept as the literal rather than widened to `Effort`, so that comparing
    against it tells the type checker which answers are left. */
export const DEFAULT_EFFORT = 'normal' satisfies Effort;
export function toEffort(value: string | undefined): Effort {
    return EFFORTS.includes(value as Effort)
        ? (value as Effort)
        : DEFAULT_EFFORT;
}
export type SetValue = { weight: number; reps: number; effort?: Effort };
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
 * How long a routine runs. `null` is open-ended: it has no last week, so it is
 * never finished and its history is a moving window rather than the whole plan.
 */
export type Duration = number | null;

/** The week the cursor is sitting in, counted from 1 and with no upper bound —
    an open-ended routine keeps counting. */
export function currentWeek(cursor: number, workoutCount: number): number {
    if (workoutCount <= 0) return 1;
    return Math.floor(Math.max(cursor, 0) / workoutCount) + 1;
}

/**
 * Current position inside the routine.
 * The sequence is week 1 (day 1..W), week 2 (day 1..W)... up to durationWeeks.
 * ponytail: index-based cursor; adding or deleting workouts mid-routine shifts the
 * position. Move to explicit (week, workoutId) if that ever becomes a problem.
 */
export function positionFromCursor(
    cursor: number,
    workoutCount: number,
    durationWeeks: Duration
): { week: number; workoutIndex: number } | null {
    if (workoutCount <= 0 || (durationWeeks !== null && durationWeeks <= 0))
        return null;
    if (cursor < 0) return null;
    if (durationWeeks !== null && cursor >= workoutCount * durationWeeks)
        return null;
    return {
        week: currentWeek(cursor, workoutCount),
        workoutIndex: cursor % workoutCount,
    };
}

/** How many weeks of an open-ended routine the history holds at once. */
export const HISTORY_WINDOW = 10;

/**
 * The weeks the history draws. A routine with a duration shows all of them.
 *
 * An open-ended one has no end to lay out, so it shows the last ten weeks and
 * starts over: filling the tenth row opens a fresh window whose first row is
 * that same week, which is the one the next week is compared against. Windows
 * therefore overlap by a week and advance nine at a time.
 */
export function historyWeeks(
    durationWeeks: Duration,
    cursor: number,
    workoutCount: number
): number[] {
    if (durationWeeks !== null)
        return Array.from({ length: durationWeeks }, (_, i) => i + 1);

    const step = HISTORY_WINDOW - 1;
    const window = Math.max(
        0,
        Math.ceil((currentWeek(cursor, workoutCount) - HISTORY_WINDOW) / step)
    );
    const first = window * step + 1;
    return Array.from({ length: HISTORY_WINDOW }, (_, i) => first + i);
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
    finished, however far the cursor has been pushed — nor is an open-ended one,
    which has no last week to reach. */
export function isRoutineFinished(
    cursor: number,
    workoutCount: number,
    durationWeeks: Duration
): boolean {
    if (durationWeeks === null) return false;
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

/**
 * What a profile shows of someone's routines: the one being trained, and the
 * list underneath it.
 *
 * A visitor only sees the active routine if its owner shared it; on your own
 * profile it is always there. The list is the plans that were shared and seen
 * through to the end — which is why it never repeats the active one.
 */
export function profileRoutines<
    T extends { isActive: boolean; isPublic: boolean; finished: boolean },
>(routines: T[], me: boolean) {
    const active = routines.find((r) => r.isActive && !r.finished);

    return {
        active: active && (me || active.isPublic) ? active : undefined,
        published: routines.filter((r) => r.isPublic && r.finished),
    };
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
