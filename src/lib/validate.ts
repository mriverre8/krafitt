/** What still stands between a routine and being trainable. Pure: no Prisma. */

import type { Translate } from '@/i18n/config';
import { REPS, REST_SECONDS } from './constants';
import { badRepFields, isTimed, type RepSpec } from './reps';
import {
    badSetValue,
    badTechnique,
    setName,
    setPlaces,
    type KindedSet,
} from './sets';

export type PlannedSet = RepSpec & KindedSet & { technique?: string | null };

export type ExercisePlan = { name: string; sets: PlannedSet[] };

export type WorkoutPlan = { exercises: ExercisePlan[] };

export type RoutinePlan = { workouts: WorkoutPlan[] };

/** Every field of one exercise that is holding the day back, sets included.
    `value` is the pause a rest-pause set has not been given, `technique` a
    technique added to a set and never named. */
export type ExerciseFault = {
    name: boolean;
    sets: { min: boolean; max: boolean; value: boolean; technique: boolean }[];
};

function exerciseFault(exercise: ExercisePlan): ExerciseFault {
    return {
        name: !exercise.name.trim(),
        sets: exercise.sets.map((set) => ({
            ...badRepFields(set),
            value: badSetValue(set),
            technique: badTechnique(set),
        })),
    };
}

/** What a day with nothing saved yet is really holding: the editor opens one
    blank card on it, so that card is what the day is short of. Mirrors
    `emptyExercise` down to the single blank set, so the faults below line up
    with the row the editor actually draws. */
const blankExercise: ExercisePlan = {
    name: '',
    sets: [{ repMode: 'range', repMin: null, repMax: null }],
};

/** That blank card's own faults. The editor paints from `workoutFaults`, which
    files faults by exercise id, and this card has no id to be filed under: it is
    in no save. */
export const blankExerciseFault: ExerciseFault = exerciseFault(blankExercise);

/** Why the rep boxes `badRepFields` flags are wrong. One line for both: a
    range is one prescription, and an empty one is one thing to fill in. */
function repProblem(
    { repMode, repMin, repMax }: RepSpec,
    bad: { min: boolean; max: boolean },
    t: Translate
): string {
    const timed = isTimed(repMode);
    if ((bad.min && repMin === null) || (bad.max && repMax === null)) {
        return t(timed ? 'validate.noSeconds' : 'validate.noReps');
    }
    const outside = (reps: number) => reps < REPS.min || reps > REPS.max;
    if (bad.min || outside(repMax!)) {
        return t(timed ? 'validate.secondsRange' : 'validate.repsRange', REPS);
    }
    return t('validate.repOrder');
}

/** What is wrong with one set, a line per field the editor paints, so each
    line has a red box to match once the errors are shown. */
function setProblems(set: PlannedSet, t: Translate): string[] {
    const problems: string[] = [];
    const bad = badRepFields(set);
    if (bad.min || bad.max) problems.push(repProblem(set, bad, t));
    if (badSetValue(set)) {
        problems.push(
            set.value == null
                ? t('validate.noPause')
                : t('validate.pauseRange', REST_SECONDS)
        );
    }
    if (badTechnique(set)) problems.push(t('validate.noTechnique'));
    return problems;
}

/** One hole in a day: where it is, and what it is missing. Kept apart so the
    card can make the place stand out — it is what the eye scans the list for. */
export type Problem = { where: string; what: string };

/**
 * Human-readable list of holes in one day, worded for the day's own card: the
 * day is the context, so nothing here repeats its name. Each line names the set
 * by the label its fields carry, and says what it is missing.
 *
 * A day with no exercises is read as the one blank card the editor shows for it
 * — `toDrafts` never renders a day with nothing on it — so a freshly added day
 * complains about the fields on screen rather than about being empty.
 */
export function workoutProblems(workout: WorkoutPlan, t: Translate): Problem[] {
    const exercises =
        workout.exercises.length > 0 ? workout.exercises : [blankExercise];

    return exercises.flatMap((exercise, index) => {
        const where =
            exercise.name.trim() || t('validate.exerciseN', { n: index + 1 });
        const problems: Problem[] = [];
        if (!exercise.name.trim()) {
            problems.push({ where, what: t('validate.noName') });
        }
        if (exercise.sets.length === 0) {
            problems.push({ where, what: t('validate.noSets') });
        }
        const places = setPlaces(exercise.sets);
        exercise.sets.forEach((set, i) => {
            const at = t('validate.setAt', { where, set: setName(places[i]) });
            for (const what of setProblems(set, t)) {
                problems.push({ where: at, what });
            }
        });
        return problems;
    });
}

/**
 * The very same faults the problems above are worded from, addressed by exercise
 * id: the editor paints these fields red, so what the eye reveals is exactly
 * what the list complains about — never a field the user has only just typed.
 */
export function workoutFaults(
    exercises: ({ id: string } & ExercisePlan)[]
): Record<string, ExerciseFault> {
    return Object.fromEntries(
        exercises.map((exercise) => [exercise.id, exerciseFault(exercise)])
    );
}

/**
 * Whether the routine can be activated. Takes `t` only because the problems it
 * counts carry text: one code path decides this and what each day displays.
 */
export function isRoutineComplete(routine: RoutinePlan, t: Translate): boolean {
    return (
        routine.workouts.length > 0 &&
        routine.workouts.every(
            (workout) => workoutProblems(workout, t).length === 0
        )
    );
}
