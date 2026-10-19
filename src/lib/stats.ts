/**
 * What the history adds up to: the table reads a set week by week, these read
 * an exercise and a whole routine at once. Pure: no Prisma, no React.
 */

import { isTimed } from './reps';
import {
    EFFORTS,
    isSessionComplete,
    isSetFilled,
    setMove,
    toEffort,
    type Effort,
    type Logs,
    type SetValue,
} from './progress';

export type StatsExercise = {
    id: string;
    sets: readonly { repMode: string }[];
};
export type StatsDay = {
    exercises: readonly StatsExercise[];
    weeks: Record<number, Logs>;
};

/** Weeks in a row without a single set moving up before an exercise is
    called stalled. */
export const STALL_WEEKS = 3;

/** Estimated one-rep max (Epley). Rough past a dozen reps, but the same rough
    number every week, which is all a trend asks of it. A single is itself. */
export const e1rm = (weight: number, reps: number) =>
    reps === 1 ? weight : weight * (1 + reps / 30);

export type ExerciseStats = {
    /** The set with the highest estimated max: what the lifter could do best.
        A failed set counts the reps before the one that failed; the change
        below leaves failed sets out. */
    best: (SetValue & { week: number; e1rm: number }) | null;
    /** Estimated max of the last week against the first, as a fraction. */
    change: number | null;
    /** Kilos moved per week, only the weeks that moved any, each against the
        last week before it with every set done: a week skipped half-done
        (`partial`) is no yardstick. */
    volume: {
        week: number;
        kg: number;
        partial: boolean;
        against: { week: number; kg: number } | null;
    }[];
    /** Weeks that beat every one before them: a higher estimated max, or more
        reps on a weight already lifted. How it felt does not come into it,
        but a failed set is not counted. */
    records: number;
    /** Weeks in a row, up to the latest, where no set beat its last clean
        outing in weight or reps without failing. */
    stalled: number;
};

const sortedWeeks = (weeks: Record<number, Logs>) =>
    Object.keys(weeks)
        .map(Number)
        .sort((a, b) => a - b);

/**
 * One exercise across every week it was logged. Sets held for seconds join in
 * deciding whether it moved — `setMove` reads them like any other — but carry
 * no load, so they stay out of the kilos and the estimated max.
 */
export function exerciseStats(
    exercise: StatsExercise,
    weeks: Record<number, Logs>
): ExerciseStats {
    const carried: Record<number, SetValue> = {};
    const stats: ExerciseStats = {
        best: null,
        change: null,
        volume: [],
        records: 0,
        stalled: 0,
    };
    let first = 0;
    let last = 0;
    let top = 0;
    let yardstick: { week: number; kg: number } | null = null;
    /** Most reps ever done on each weight, by the weeks gone before. */
    const repsAt = new Map<number, number>();

    for (const week of sortedWeeks(weeks)) {
        const logged = weeks[week][exercise.id];
        if (!logged) continue;

        let kg = 0;
        let weekTop = 0;
        let compared = false;
        let up = false;
        let moreReps = false;
        const repsNow = new Map<number, number>();
        exercise.sets.forEach((set, setIndex) => {
            const value = logged[setIndex];
            if (!value) return;
            // Only the bar and the reps get an exercise moving: feeling easier
            // is not progress, and a rep that failed was not done. A failed
            // set is no yardstick either, so doing those reps clean the week
            // after is measured against the last set that was.
            const failed = toEffort(value.effort) === 'fail';
            const before = carried[setIndex];
            if (before) {
                compared = true;
                const move = setMove(value, before);
                if (!failed && move?.dir === 'up' && move.part !== 'effort')
                    up = true;
            }
            if (!failed) carried[setIndex] = value;
            if (isTimed(set.repMode)) return;

            kg += value.weight * value.reps;

            // The last rep of a failed set did not go up: the best set reads
            // it as the reps before it, so 20×9 at failure matches a clean
            // 20×8 — and, being later, takes the week.
            const done = failed ? value.reps - 1 : value.reps;
            const estimate = e1rm(value.weight, done);
            const best = stats.best;
            if (
                done > 0 &&
                (!best ||
                    estimate > best.e1rm ||
                    // A tie goes to the latest: the week it was last matched.
                    (estimate === best.e1rm && done >= best.reps))
            )
                stats.best = { ...value, reps: done, week, e1rm: estimate };

            // The kilos were moved all the same; but a failed set sets no
            // max or record, nor stands as the one to beat.
            if (failed) return;

            const most = repsAt.get(value.weight);
            if (most !== undefined && value.reps > most) moreReps = true;
            repsNow.set(
                value.weight,
                Math.max(repsNow.get(value.weight) ?? 0, value.reps)
            );
            weekTop = Math.max(weekTop, estimate);
        });

        if (compared) stats.stalled = up ? 0 : stats.stalled + 1;
        if (kg > 0) {
            const partial = !exercise.sets.every(
                (_, setIndex) => logged[setIndex]
            );
            stats.volume.push({ week, kg, partial, against: yardstick });
            if (!partial) yardstick = { week, kg };
        }
        if (weekTop > 0) {
            if (!first) first = weekTop;
            else if (weekTop > top || moreReps) stats.records++;
            top = Math.max(top, weekTop);
            last = weekTop;
        }
        for (const [weight, reps] of repsNow)
            repsAt.set(weight, Math.max(repsAt.get(weight) ?? 0, reps));
    }

    if (first && stats.volume.length > 1) stats.change = last / first - 1;
    return stats;
}

export type SessionTiming = { startedAt: Date; completedAt: Date | null };

export type RoutineStats = {
    /** Days finished in full. */
    done: number;
    /** Days the routine has asked for so far. */
    due: number;
    /** Sets logged on those days: a day skipped half-done still counts the
        half that was done. */
    setsDone: number;
    /** Sets those days asked for. */
    setsDue: number;
    /** Exercises in the plan stalled for `STALL_WEEKS` or more. */
    stalled: number;
    volume: number;
    records: number;
    /** Every logged set, by how it felt. */
    efforts: Record<Effort, number>;
    /** Typical length of a day done in full in one sitting, in minutes. */
    minutes: number | null;
};

/** Sessions open at the first set logged, so a day left open overnight is
    not a day trained for nine hours: past this it is left out. */
const LONGEST_SESSION_MS = 4 * 60 * 60 * 1000;

export function routineStats(
    days: readonly StatsDay[],
    sessions: readonly SessionTiming[],
    cursor: number
): RoutineStats {
    const efforts = Object.fromEntries(EFFORTS.map((e) => [e, 0])) as Record<
        Effort,
        number
    >;
    let volume = 0;
    let records = 0;
    let stalled = 0;

    for (const day of days) {
        for (const exercise of day.exercises) {
            const stats = exerciseStats(exercise, day.weeks);
            volume += stats.volume.reduce((sum, w) => sum + w.kg, 0);
            records += stats.records;
            if (stats.stalled >= STALL_WEEKS) stalled++;
        }
        for (const logs of Object.values(day.weeks))
            for (const sets of Object.values(logs))
                for (const value of Object.values(sets ?? {}))
                    if (value) efforts[toEffort(value.effort)]++;
    }

    const lengths = sessions
        .filter((s) => s.completedAt)
        .map((s) => s.completedAt!.getTime() - s.startedAt.getTime())
        .filter((ms) => ms > 0 && ms <= LONGEST_SESSION_MS)
        .sort((a, b) => a - b);
    // Median rather than mean: one long day should not move it.
    const middle = lengths[Math.floor(lengths.length / 2)];

    // Every day behind the cursor was due, in the order the cursor walks
    // them. The cursor's own day only once it is finished — it moves on at
    // the next visit to today's workout — since until then it may simply not
    // have been trained yet.
    let done = 0;
    let due = 0;
    let setsDone = 0;
    let setsDue = 0;
    for (let position = 0; days.length && position <= cursor; position++) {
        const day = days[position % days.length];
        const logs = day.weeks[Math.floor(position / days.length) + 1] ?? {};
        const complete = isSessionComplete([...day.exercises], logs);
        if (position === cursor && !complete) break;
        const filled = day.exercises.flatMap((exercise) =>
            exercise.sets.map((_, setIndex) =>
                isSetFilled(logs, exercise.id, setIndex)
            )
        );

        due++;
        if (complete) done++;
        setsDue += filled.length;
        setsDone += filled.filter(Boolean).length;
    }

    return {
        done,
        due,
        setsDone,
        setsDue,
        stalled,
        volume,
        records,
        efforts,
        minutes: middle === undefined ? null : Math.round(middle / 60_000),
    };
}
