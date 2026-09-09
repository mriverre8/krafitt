'use client';

import { useT } from '@/i18n/use-t';
import type { SavedExercise } from '@/lib/forms';
import type { SetValue } from '@/lib/progress';
import { formatReps } from '@/lib/reps';
import { cardClass } from '@/lib/ui';
import { SetRow } from './set-row';

export type ExerciseView = SavedExercise;

export function WorkoutExercise({
    exercise,
    logs,
    previous,
    previousWeek,
    isSetEnabled,
    onSaveSet,
}: {
    exercise: ExerciseView;
    logs: Record<number, SetValue | undefined>;
    previous: Record<number, SetValue | undefined>;
    previousWeek: number | null;
    isSetEnabled: (setIndex: number) => boolean;
    onSaveSet: (setIndex: number, weight: number, reps: number) => void;
}) {
    const t = useT();

    return (
        <section className={cardClass}>
            <h2 className="display text-3xl">{exercise.name}</h2>

            <div className="mt-4 space-y-2.5">
                {exercise.sets.map((set, setIndex) => (
                    <div
                        key={setIndex}
                        className="space-y-1.5"
                    >
                        {/* Each set carries its own prescription. */}
                        <p className="text-muted text-xs md:text-sm">
                            <span className="text-pulse font-semibold">
                                {`${set.technique} · `}
                            </span>
                            {formatReps(set, t)}
                        </p>
                        <SetRow
                            setIndex={setIndex}
                            enabled={isSetEnabled(setIndex)}
                            saved={logs[setIndex]}
                            previous={previous[setIndex]}
                            previousWeek={previousWeek}
                            onSave={(weight, reps) =>
                                onSaveSet(setIndex, weight, reps)
                            }
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
