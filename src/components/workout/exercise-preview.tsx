'use client';

import { useT } from '@/i18n/use-t';
import { formatReps, isSetComplete } from '@/lib/reps';
import { setFullLabel, setPlaces } from '@/lib/sets';
import { cardClass } from '@/lib/ui';
import type { ExerciseView } from '@/components/workout/workout-exercise';

/**
 * One exercise of the day as it reads rather than as it is written. The editor
 * used to serve both by locking its own fields, which left a page of boxes
 * nobody could type in: a field that cannot be used should not look like one.
 *
 * So the plan is set as text — number, what the set is called, what it asks
 * for. The only rule drawn is the hairline that opens each working set, and
 * everything between two hairlines is one group: a drop or rest-pause set sits
 * tight under the set it hangs off, indented into the number's own column.
 * Nothing but spacing says so, which is all it takes — the gap inside a group
 * is a third of the gap between two of them.
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

            <ul className="mt-5">
                {exercise.sets.map((set, index) => {
                    const place = places[index];
                    const sub = place.kind !== 'normal';
                    const noPause = place.kind === 'rest' && set.value == null;
                    const unwritten = noPause || !isSetComplete(set);

                    return (
                        <li
                            key={index}
                            className={`flex items-baseline gap-3 ${
                                sub
                                    ? 'py-1 pl-8 md:pl-9'
                                    : index > 0
                                      ? 'border-line mt-2 border-t pt-3 pb-1'
                                      : 'pb-1'
                            }`}
                        >
                            {!sub && (
                                <span className="figure text-ink w-5 shrink-0 text-lg leading-none md:w-6">
                                    {place.ordinal}
                                </span>
                            )}
                            <span
                                className={`font-display min-w-0 flex-1 text-[13px] leading-[1.2] font-bold tracking-[0.12em] uppercase md:text-[15px] ${
                                    sub ? 'text-muted' : 'text-pulse'
                                }`}
                            >
                                {sub
                                    ? setFullLabel(set, t)
                                    : set.technique?.trim() ||
                                      t('today.set', { n: place.ordinal })}
                                {noPause && (
                                    <span className="font-medium tracking-normal normal-case">
                                        {` · ${t('set.restUnset')}`}
                                    </span>
                                )}
                            </span>
                            <span
                                className={`figure shrink-0 text-sm md:text-base ${
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
