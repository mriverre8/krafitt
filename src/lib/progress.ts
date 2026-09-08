/** Pure progression logic. No Prisma, no React: the only part with unit tests. */

export type ExercisePlan = { id: string; sets: readonly unknown[] };
export type SetValue = { weight: number; reps: number };
/** exerciseId -> setIndex -> logged value */
export type Logs = Record<
    string,
    Record<number, SetValue | undefined> | undefined
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
 * A set is only enabled when every previous one (same exercise and earlier
 * exercises) has been filled in.
 */
export function isSetEnabled(
    exercises: ExercisePlan[],
    logs: Logs,
    exerciseId: string,
    setIndex: number
): boolean {
    const flat = flatSets(exercises);
    const i = flat.findIndex(
        (s) => s.exerciseId === exerciseId && s.setIndex === setIndex
    );
    if (i < 0) return false;
    return flat
        .slice(0, i)
        .every((s) => isSetFilled(logs, s.exerciseId, s.setIndex));
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
