'use client';

import { useT } from '@/i18n/use-t';
import type { SavedExercise } from '@/lib/forms';
import type { PreviousValue, SetValue } from '@/lib/progress';
import { formatReps } from '@/lib/reps';
import { setFullLabel, setName, setPlaces, setShortLabel } from '@/lib/sets';
import { cardClass } from '@/lib/ui';
import { SetRow } from '@/components/workout/set-row';

export type ExerciseView = SavedExercise;

export function WorkoutExercise({
    exercise,
    logs,
    previous,
    isSetEnabled,
    onSaveSet,
}: {
    exercise: ExerciseView;
    logs: Record<number, SetValue | undefined>;
    previous: Record<number, PreviousValue | undefined>;
    isSetEnabled: (setIndex: number) => boolean;
    onSaveSet: (setIndex: number, weight: number, reps: number) => void;
}) {
    const t = useT();
    const places = setPlaces(exercise.sets);

    return (
        <section className={cardClass}>
            <h2 className="display text-3xl">{exercise.name}</h2>

            <div className="mt-4 space-y-2.5">
                {exercise.sets.map((set, setIndex) => {
                    const place = places[setIndex];
                    const sub = place.kind !== 'normal';
                    return (
                        <div
                            key={setIndex}
                            className="space-y-1.5"
                        >
                            <p className="text-muted text-xs md:text-sm">
                                <span className="eyebrow text-pulse">
                                    {`${
                                        sub
                                            ? setFullLabel(set, t)
                                            : set.technique
                                    } · `}
                                </span>
                                {formatReps(set, t)}
                            </p>
                            <SetRow
                                setIndex={setIndex}
                                label={setShortLabel(place)}
                                name={setName(place)}
                                sub={sub}
                                enabled={isSetEnabled(setIndex)}
                                saved={logs[setIndex]}
                                previous={previous[setIndex]}
                                onSave={(weight, reps) =>
                                    onSaveSet(setIndex, weight, reps)
                                }
                            />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
