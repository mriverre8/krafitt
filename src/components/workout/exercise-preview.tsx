'use client';

import { useT } from '@/i18n/use-t';
import { formatReps, isSetComplete } from '@/lib/reps';
import { setFullLabel, setPlaces } from '@/lib/sets';
import { cardClass } from '@/lib/ui';
import type { ExerciseView } from '@/components/workout/workout-exercise';

export const blankExercise: ExerciseView = {
    id: '',
    name: '',
    sets: [{ repMode: 'range', repMin: null, repMax: null, technique: null }],
};

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
