'use client';

import { useT } from '@/i18n/use-t';
import { formatReps, isSetComplete } from '@/lib/reps';
import { setFullLabel, setPlaces } from '@/lib/sets';
import { cardClass } from '@/lib/ui';
import type { ExerciseView } from '@/components/workout/workout-exercise';

/**
 * What a day with nothing saved reads as. The editor opens such a day on one
 * blank exercise — `toDrafts` hands it `emptyExercise` — so out of edit mode it
 * shows the same card unfilled rather than a sentence saying the day is empty.
 * The card is the truer answer: it shows the shape the day is about to take,
 * and it is the shape Edit drops you straight into.
 *
 * The view's counterpart to `emptyExercise`, and it has to be its own value:
 * that one is a draft, and holds its numbers as the strings a field collects.
 */
export const blankExercise: ExerciseView = {
    id: '',
    name: '',
    sets: [{ repMode: 'range', repMin: null, repMax: null, technique: null }],
};

/**
 * One exercise of the day as it reads rather than as it is written. The editor
 * used to serve both by locking its own fields, which left a page of boxes
 * nobody could type in: a field that cannot be used should not look like one.
 *
 * So the plan is set as text — which set it is, what it is called, what it asks
 * for. The only rule drawn is the hairline that opens each working set, and
 * everything between two hairlines is one group: a drop or rest-pause set sits
 * tight under the set it hangs off, indented under it. Nothing but spacing says
 * so, which is all it takes.
 *
 * A working set opens on the same tag the editor gives it — SERIE 1, in pulse,
 * condensed and spaced — and its technique sits straight after, in the reading
 * face and in the ink. Tag then name: the first says which set of the exercise
 * you are on, the second what kind of set it is, and neither has to be read to
 * find the other. A set with no technique simply stops after the tag.
 *
 * The intervals are the editor's, to the pixel — 16 under the name, 20 above
 * the rule between two sets and 8 below it, 20 of indent on a sub row. Edit
 * swaps this list for that form in place, and a set that shifts as it is being
 * swapped reads as the page redrawing rather than as the same set becoming
 * editable.
 */
export function ExercisePreview({ exercise }: { exercise: ExerciseView }) {
    const t = useT();
    const places = setPlaces(exercise.sets);

    return (
        <div className={cardClass}>
            <h4
                className={`display text-2xl leading-[1.1] ${
                    exercise.name ? 'text-ink' : 'text-muted'
                }`}
            >
                {exercise.name || t('exercise.namePlaceholder')}
            </h4>

            <ul className="mt-4">
                {exercise.sets.map((set, index) => {
                    const place = places[index];
                    const sub = place.kind !== 'normal';
                    const noPause = place.kind === 'rest' && set.value == null;
                    const unwritten = noPause || !isSetComplete(set);
                    const label = sub
                        ? setFullLabel(set, t)
                        : t('today.set', { n: place.ordinal });
                    const technique = sub ? null : set.technique?.trim();

                    return (
                        <li
                            key={index}
                            className={`flex items-baseline gap-3 ${
                                sub
                                    ? 'py-1'
                                    : index > 0
                                      ? 'border-line mt-3 border-t pt-3 pb-1'
                                      : 'pb-1'
                            }`}
                        >
                            <span className="min-w-0 flex-1">
                                <span
                                    className={`font-display text-[13px] leading-[1.2] font-bold tracking-[0.12em] uppercase md:text-[15px] ${
                                        sub ? 'text-muted' : 'text-pulse'
                                    }`}
                                >
                                    {label}
                                    {noPause && (
                                        <span className="font-medium tracking-normal normal-case">
                                            {` · ${t('set.restUnset')}`}
                                        </span>
                                    )}
                                </span>
                                {technique && (
                                    <span className="text-ink ml-2.5 text-sm text-[12px] leading-[1.2] font-medium md:text-sm">
                                        {technique}
                                    </span>
                                )}
                            </span>
                            <span
                                className={`figure ml-auto shrink-0 text-sm md:text-base ${
                                    unwritten || sub ? 'text-muted' : 'text-ink'
                                }`}
                            >
                                {formatReps(set, t)}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
