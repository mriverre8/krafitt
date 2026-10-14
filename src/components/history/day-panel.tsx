'use client';

import { useT } from '@/i18n/use-t';
import type { Period } from '@/lib/period';
import type { Logs, WeekState } from '@/lib/progress';
import { useState } from 'react';
import { ExerciseStats } from '@/components/history/exercise-stats';
import { HistoryExercise } from '@/components/history/history-exercise';
import type { ExerciseView } from '@/components/workout/workout-exercise';

export type HistoryDay = {
    id: string;
    name: string;
    exercises: ExerciseView[];
    weeks: Record<number, Logs>;
};

export type WeekRow = { week: number; state: WeekState; logs: Logs };

export function DayPanel({
    day,
    rows,
    id,
    labelledBy,
    hidden,
    period,
}: {
    day: HistoryDay;
    rows: WeekRow[];
    id: string;
    labelledBy: string;
    hidden: boolean;
    period?: Period;
}) {
    const t = useT();
    const [selected, setSelected] = useState(0);
    const position = Math.min(selected, Math.max(day.exercises.length - 1, 0));
    const exercise = day.exercises[position];

    return (
        <div
            role="tabpanel"
            id={id}
            aria-labelledby={labelledBy}
            hidden={hidden}
            className="space-y-4"
        >
            <h2 className="display min-w-0 text-4xl">{day.name}</h2>

            {!exercise ? (
                <p className="border-line text-muted rounded-md border-2 border-dashed p-6 text-center text-sm">
                    {t('today.noExercises')}
                </p>
            ) : (
                <>
                    <p className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="text-surge-ink font-semibold">
                            {t('progress.up')}
                        </span>
                        <span className="text-danger font-semibold">
                            {t('progress.down')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span
                                aria-hidden
                                className="figure text-muted text-base"
                            >
                                —
                            </span>
                            {t('progress.missed')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span
                                aria-hidden
                                className="figure text-line text-base"
                            >
                                ·
                            </span>
                            {t('progress.upcoming')}
                        </span>
                    </p>

                    <HistoryExercise
                        exercise={exercise}
                        rows={rows.map((row) => ({
                            week: row.week,
                            state: row.state,
                            sets: row.logs[exercise.id] ?? {},
                        }))}
                        position={position}
                        total={day.exercises.length}
                        onSelect={setSelected}
                        period={period}
                    />

                    <ExerciseStats
                        exercise={exercise}
                        weeks={day.weeks}
                        period={period}
                    />
                </>
            )}
        </div>
    );
}
