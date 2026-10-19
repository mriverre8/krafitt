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

/**
 * The days of the cursor's week that can be trained now instead of its own:
 * every one not done in full. One closed with its blanks, or due before the
 * cursor, was left incomplete and can be taken up again; the rest are still
 * to come. `complete` and `closed` hold day indexes.
 */
export function pickableDays(
    cursor: number,
    workoutCount: number,
    complete: ReadonlySet<number>,
    closed: ReadonlySet<number>
): { index: number; incomplete: boolean }[] {
    if (workoutCount <= 0) return [];
    const from = Math.max(cursor, 0) % workoutCount;
    return Array.from({ length: workoutCount }, (_, index) => index)
        .filter((index) => !complete.has(index))
        .map((index) => ({
            index,
            incomplete: closed.has(index) || index < from,
        }));
}

/**
 * The day of the cursor's week being trained: a picked day takes the place of
 * the cursor's, ahead of it or left incomplete behind it. Every move of the
 * cursor drops the pick, so none is stale. `picked` is its index, -1 for none.
 */
export function shownDay(
    cursor: number,
    workoutCount: number,
    picked: number
): number {
    return picked >= 0 ? picked : Math.max(cursor, 0) % workoutCount;
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
 * What a routine row is. A `workout` is an open-ended routine of one day,
 * trained as often as one likes: each "week" of it is one more time it was
 * done, it is never finished, and it leaves the home screen once each time is
 * over rather than putting the next one there.
 */
export const ROUTINE_KINDS = ['routine', 'workout'] as const;
export type RoutineKind = (typeof ROUTINE_KINDS)[number];

/** The rows the database holds as plain strings, read back as a kind: anything
    that is not a workout is a routine, which is the column's default. */
export const toKind = (kind: string): RoutineKind =>
    kind === 'workout' ? 'workout' : 'routine';

/** Where each kind lives. */
export const sectionOf = (kind: string) =>
    toKind(kind) === 'workout' ? '/workouts' : '/routines';

/** A workout is never finished, so it only ever wears these three. */
export const WORKOUT_STATUSES = [
    'active',
    'pending',
    'incomplete',
] as const satisfies readonly RoutineStatus[];

/**
 * The times a workout's history draws: every one done, and the one under way
 * while it is active, never the ones not started. Up to ten of them, then it
 * pages on the way an open-ended routine does, each window starting at the
 * last row of the one before.
 */
export function workoutRuns(cursor: number, isActive: boolean): number[] {
    const last = cursor + (isActive ? 1 : 0);
    if (last <= 0) return [];
    // `historyWeeks` windows on the run after the cursor; the last one drawn
    // is the one to window on here.
    return historyWeeks(null, last - 1, 1).filter((run) => run <= last);
}

/** What a set is made of, in the order it is argued over: the bar first, then
    the reps on it, then how the whole thing felt. Everything from the deciding
    part downwards is carried by its verdict, which is why the order matters
    and why it lives here rather than in the table that reads it. */
export const SET_PARTS = ['weight', 'reps', 'effort'] as const;
export type SetPart = (typeof SET_PARTS)[number];

/**
 * How a logged set stands against the last time that same set was logged:
 * which way it went, and the part that decided it. `null` is a set that
 * repeated its last performance down to how it felt.
 *
 * The bar leads, and it leads absolutely. More reps at a lighter weight is not
 * that set moving forward — it is a different set — so the weight answers
 * first, the reps only speak when the bar did not change, and effort is the
 * tie-break under both: same weight, same reps, one notch easier is the only
 * progress there was to find.
 */
export type SetMove = { dir: 'up' | 'down'; part: SetPart } | null;

export function setMove(value: SetValue, previous: SetValue): SetMove {
    if (value.weight !== previous.weight)
        return {
            dir: value.weight > previous.weight ? 'up' : 'down',
            part: 'weight',
        };
    if (value.reps !== previous.reps)
        return {
            dir: value.reps > previous.reps ? 'up' : 'down',
            part: 'reps',
        };
    // EFFORTS runs hardest first, so the higher index is the set that had more
    // left in the tank.
    const now = EFFORTS.indexOf(toEffort(value.effort));
    const before = EFFORTS.indexOf(toEffort(previous.effort));
    if (now !== before)
        return { dir: now > before ? 'up' : 'down', part: 'effort' };
    return null;
}

/** Where one day of one week sits relative to the cursor: the question the
    history page asks of every row it draws, so a blank cell can say "you
    skipped this" rather than "you have not got there yet". */
export type WeekState = 'past' | 'current' | 'upcoming';

export function weekState(
    cursor: number,
    week: number,
    workoutIndex: number,
    workoutCount: number,
    picked = -1
): WeekState {
    const position = (week - 1) * workoutCount + workoutIndex;
    // The day being trained is the picked one, when there is one: the
    // cursor's own is then still to come.
    const here =
        cursor +
        shownDay(cursor, workoutCount, picked) -
        (cursor % workoutCount);
    if (position === here) return 'current';
    return cursor > position ? 'past' : 'upcoming';
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

export const ROUTINE_STATUSES = [
    'active',
    'pending',
    'incomplete',
    'finished',
] as const;
export type RoutineStatus = (typeof ROUTINE_STATUSES)[number];

/** The one badge a routine card wears, and what the status filter on the
    routines list matches against: finished outranks active, and a routine on
    the shelf is pending if it could be set active, incomplete if not. */
export function routineStatus(routine: {
    isActive: boolean;
    finished: boolean;
    canActivate: boolean;
}): RoutineStatus {
    if (routine.finished) return 'finished';
    if (routine.isActive) return 'active';
    return routine.canActivate ? 'pending' : 'incomplete';
}

/**
 * A routine that has been lived in has its days frozen: the cursor counts them
 * by position, and the sessions were logged against them. Being active is
 * enough on its own — training starts the moment it goes live. Its exercises
 * and sets stay editable; only a routine still on the shelf, untouched, can
 * gain or lose a day.
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

/** How many sets of the workout are filled in: the progress of a day, and what
    tells a workout half done from one with nothing logged. */
export function filledSets(exercises: ExercisePlan[], logs: Logs): number {
    return flatSets(exercises).filter((s) =>
        isSetFilled(logs, s.exerciseId, s.setIndex)
    ).length;
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
