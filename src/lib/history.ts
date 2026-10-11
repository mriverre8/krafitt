/**
 * How what was logged stays attached to a plan that keeps being edited. Pure:
 * no Prisma, no React — the server files logs with it and the client asks it
 * which set it is logging.
 *
 * Two rules decide everything, and the plan itself never has to remember a
 * thing: what was logged is never touched, only matched against the plan as it
 * stands now.
 *
 * 1. Within a day an exercise is its name. A card bearing a name the day has
 *    had before *is* that exercise, history and all; any other name is a new
 *    one. An exercise with something logged is never deleted, only archived.
 * 2. A set is its slot: what it is called on screen and what it counts. Logs
 *    are filed under the slot, not under a position in the list, so slotting a
 *    drop set in shifts nothing, and a set taken out finds its numbers again
 *    when it is put back.
 */

import { isTimed } from './reps';
import { setName, setPlaces, type Kinded } from './sets';
import {
    toEffort,
    type Logs,
    type PreviousLogs,
    type SetValue,
} from './progress';

export type SlottedSet = Kinded & { repMode: string };
export type SlottedExercise = { id: string; sets: readonly SlottedSet[] };

/**
 * The slot of every set of an exercise, in order: `2` for working set 2,
 * `2.DS1` for the first drop off it, and `.t` on the end of anything held for
 * seconds — seconds are not reps, so turning a set timed starts its history
 * over, and turning it back brings the old one back.
 *
 * `prisma/backfill-set-slots.sql` spells this same rule in SQL, once, for the
 * logs written before slots existed.
 */
export function setSlots(sets: readonly SlottedSet[]): string[] {
    const places = setPlaces(sets);
    return places.map((place, index) => {
        const slot =
            place.kind === 'normal'
                ? String(place.ordinal)
                : `${places[place.parent].ordinal}.${setName(place)}`;
        return isTimed(sets[index].repMode) ? `${slot}.t` : slot;
    });
}

/** Case and the spaces round it are how it was typed, not which exercise it is. */
export const sameExercise = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

/** One exercise the day already has, in the plan or archived out of it. */
export type DayExercise = {
    id: string;
    name: string;
    archived: boolean;
    /** Something was logged against it: deleting it would lose that. */
    logged: boolean;
};

export type ExerciseCard = { id: string | null; name: string };

/**
 * Which exercise of the day every card of a save is, and what becomes of the
 * ones no card claimed.
 *
 * Two passes, so a new card can never take the exercise another card is still
 * holding: first, a card that kept its exercise's name is that exercise; then
 * any other card takes the first free exercise of the day with its name — that
 * is how an archived one comes back — or is a new exercise.
 *
 * `existing` is read in order, so listing the plan before the archive makes a
 * name shared by both resolve to the one in the plan.
 */
export function matchExercises(
    existing: readonly DayExercise[],
    cards: readonly ExerciseCard[]
): {
    /** Per card, the exercise it carries on, or null for a new one. */
    ids: (string | null)[];
    /** In the plan, claimed by no card, and logged: kept for the history. */
    archive: string[];
    /** In the plan, claimed by no card, and never logged: nothing to keep. */
    remove: string[];
} {
    const free = new Map(existing.map((exercise) => [exercise.id, exercise]));
    const take = (exercise: DayExercise | undefined) =>
        exercise && free.delete(exercise.id) ? exercise.id : null;

    const own = cards.map((card) => {
        const exercise = card.id ? free.get(card.id) : undefined;
        return exercise && sameExercise(exercise.name, card.name)
            ? take(exercise)
            : null;
    });
    const ids = own.map(
        (id, index) =>
            id ??
            take(
                [...free.values()].find((exercise) =>
                    sameExercise(exercise.name, cards[index].name)
                )
            )
    );

    const left = [...free.values()].filter((exercise) => !exercise.archived);
    return {
        ids,
        archive: left.filter((e) => e.logged).map((e) => e.id),
        remove: left.filter((e) => !e.logged).map((e) => e.id),
    };
}

/** A log as the database holds it. */
export type SlotLog = {
    exerciseId: string;
    slot: string;
    weight: number;
    reps: number;
    effort: string;
};

/**
 * Logs filed by slot, laid out by where each set sits in the plan now — the
 * shape the rest of the app reads. A slot the plan no longer has is left out
 * rather than lost: it is still stored, and shows again once the plan has it
 * back.
 */
export function toLogs(
    logs: readonly SlotLog[],
    exercises: readonly SlottedExercise[]
): Logs {
    const out: Logs = {};
    place(logs, exercises, (log, setIndex) => {
        (out[log.exerciseId] ??= {})[setIndex] = toValue(log);
    });
    return out;
}

/**
 * The last value every set of the plan was given, week by week. Sessions come
 * in oldest first so the newest week wins, and unfinished ones count too: a day
 * skipped half-done still leaves its numbers behind for the sets that were
 * logged, and the sets that were not keep whatever the week before them left.
 */
export function toPrevious(
    sessions: readonly { week: number; logs: readonly SlotLog[] }[],
    exercises: readonly SlottedExercise[]
): PreviousLogs {
    const out: PreviousLogs = {};
    for (const session of sessions)
        place(session.logs, exercises, (log, setIndex) => {
            (out[log.exerciseId] ??= {})[setIndex] = {
                ...toValue(log),
                week: session.week,
            };
        });
    return out;
}

const toValue = (log: SlotLog): SetValue => ({
    weight: log.weight,
    reps: log.reps,
    effort: toEffort(log.effort),
});

/** Hands every log whose slot the plan has to `put`, with its position. */
function place(
    logs: readonly SlotLog[],
    exercises: readonly SlottedExercise[],
    put: (log: SlotLog, setIndex: number) => void
) {
    const slots = new Map(
        exercises.map((exercise) => [exercise.id, setSlots(exercise.sets)])
    );
    for (const log of logs) {
        const setIndex = slots.get(log.exerciseId)?.indexOf(log.slot) ?? -1;
        if (setIndex >= 0) put(log, setIndex);
    }
}
