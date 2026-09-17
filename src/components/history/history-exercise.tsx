'use client';

import { useT } from '@/i18n/use-t';
import {
    setTrend,
    type SetTrend,
    type SetValue,
    type WeekState,
} from '@/lib/progress';
import { formatReps } from '@/lib/reps';
import { setName, setPlaces, setShortLabel } from '@/lib/sets';
import { cardClass, iconButtonClass } from '@/lib/ui';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ExerciseView } from '@/components/workout/workout-exercise';

export type HistoryRow = {
    week: number;
    state: WeekState;
    sets: Record<number, SetValue | undefined>;
};

export function HistoryExercise({
    exercise,
    rows,
    position,
    total,
    onSelect,
}: {
    exercise: ExerciseView;
    rows: HistoryRow[];
    position: number;
    total: number;
    onSelect: (position: number) => void;
}) {
    const t = useT();
    const places = setPlaces(exercise.sets);
    const labels = places.map(setShortLabel);
    const names = places.map(setName);
    const count = {
        name: exercise.name,
        n: position + 1,
        total,
    };

    const carried: Record<number, SetValue | undefined> = {};
    const trends = rows.map((row) => {
        const forRow: Record<number, SetTrend | undefined> = {};
        exercise.sets.forEach((_, setIndex) => {
            const value = row.sets[setIndex];
            if (!value) return;
            const before = carried[setIndex];
            if (before) forRow[setIndex] = setTrend(value, before);
            carried[setIndex] = value;
        });
        return forRow;
    });

    return (
        <section className={cardClass}>
            <div className="flex items-center justify-between gap-2">
                <h3 className="display min-w-0 truncate text-3xl">
                    {exercise.name}
                </h3>

                {total > 1 && (
                    <div className="flex shrink-0 items-center">
                        <button
                            type="button"
                            disabled={position === 0}
                            onClick={() => onSelect(position - 1)}
                            aria-label={t('progress.prevExercise')}
                            className={`${iconButtonClass} disabled:pointer-events-none disabled:opacity-30`}
                        >
                            <ChevronLeft
                                size={18}
                                aria-hidden
                            />
                        </button>
                        <p
                            role="status"
                            className="figure text-muted min-w-9 text-center text-sm"
                        >
                            <span className="sr-only">
                                {t('progress.exerciseCount', count)}
                            </span>
                            <span aria-hidden>
                                {t('progress.counter', count)}
                            </span>
                        </p>
                        <button
                            type="button"
                            disabled={position === total - 1}
                            onClick={() => onSelect(position + 1)}
                            aria-label={t('progress.nextExercise')}
                            className={`${iconButtonClass} disabled:pointer-events-none disabled:opacity-30`}
                        >
                            <ChevronRight
                                size={18}
                                aria-hidden
                            />
                        </button>
                    </div>
                )}
            </div>

            <div className="relative mt-3 -mb-1 overflow-x-auto pb-1">
                <table className="w-full min-w-max border-separate border-spacing-0 text-center">
                    <caption className="sr-only">
                        {t('progress.tableCaption', {
                            exercise: exercise.name,
                        })}
                    </caption>
                    <thead>
                        <tr>
                            <th
                                scope="col"
                                className="border-line bg-surface sticky left-0 z-10 w-10 border-b-2 pr-2 pb-2 text-left"
                            >
                                <span className="sr-only">
                                    {t('progress.weekColumn')}
                                </span>
                            </th>
                            {exercise.sets.map((set, setIndex) => (
                                <th
                                    key={setIndex}
                                    scope="col"
                                    className="border-line min-w-14 border-b-2 px-2 pb-2 font-normal"
                                >
                                    <span className="sr-only">
                                        {`${t('progress.setLabel', {
                                            n: names[setIndex],
                                        })}, ${formatReps(set, t)}`}
                                    </span>
                                    <span aria-hidden>
                                        <span className="figure text-ink block text-lg leading-none">
                                            {labels[setIndex]}
                                        </span>
                                        <span className="text-muted mt-1 block text-[11px] whitespace-nowrap">
                                            {formatReps(set, t)}
                                        </span>
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((row, rowIndex) => {
                            const complete = exercise.sets.every(
                                (_, setIndex) => row.sets[setIndex]
                            );
                            const current = row.state === 'current';
                            const rule =
                                rowIndex === rows.length - 1
                                    ? ''
                                    : 'border-b border-b-line';

                            return (
                                <tr key={row.week}>
                                    <th
                                        scope="row"
                                        className={`bg-surface sticky left-0 z-10 border-l-4 py-2.5 pr-2 pl-2 text-left ${rule} ${
                                            current
                                                ? 'border-l-volt'
                                                : complete
                                                  ? 'border-l-surge'
                                                  : 'border-l-line'
                                        }`}
                                    >
                                        <span className="sr-only">
                                            {t('progress.weekLabel', {
                                                n: row.week,
                                            })}
                                        </span>
                                        <span
                                            aria-hidden
                                            className={`figure text-sm ${
                                                current
                                                    ? 'text-ink'
                                                    : 'text-muted'
                                            }`}
                                        >
                                            {t('progress.week', {
                                                n: row.week,
                                            })}
                                        </span>
                                    </th>

                                    {exercise.sets.map((_, setIndex) => {
                                        const value = row.sets[setIndex];
                                        if (value) {
                                            const trend =
                                                trends[rowIndex][setIndex];
                                            return (
                                                <td
                                                    key={setIndex}
                                                    className={`px-2 py-2.5 ${rule}`}
                                                >
                                                    <span className="sr-only">
                                                        {t('progress.logged', {
                                                            weight: value.weight,
                                                            reps: value.reps,
                                                        }) +
                                                            (trend &&
                                                            trend !== 'same'
                                                                ? `, ${t(
                                                                      trend ===
                                                                          'up'
                                                                          ? 'progress.up'
                                                                          : 'progress.down'
                                                                  )}`
                                                                : '')}
                                                    </span>
                                                    <span
                                                        aria-hidden
                                                        className="figure text-ink inline-flex items-center gap-0.5 text-base whitespace-nowrap"
                                                    >
                                                        {t('progress.value', {
                                                            weight: value.weight,
                                                            reps: value.reps,
                                                        })}
                                                        {trend === 'up' && (
                                                            <ArrowUp
                                                                size={12}
                                                                aria-hidden
                                                                className="text-surge"
                                                            />
                                                        )}
                                                        {trend === 'down' && (
                                                            <ArrowDown
                                                                size={12}
                                                                aria-hidden
                                                                className="text-danger"
                                                            />
                                                        )}
                                                    </span>
                                                </td>
                                            );
                                        }

                                        const missed = row.state === 'past';
                                        return (
                                            <td
                                                key={setIndex}
                                                className={`px-2 py-2.5 ${rule}`}
                                            >
                                                <span className="sr-only">
                                                    {t(
                                                        missed
                                                            ? 'progress.missed'
                                                            : 'progress.upcoming'
                                                    )}
                                                </span>
                                                <span
                                                    aria-hidden
                                                    className={`figure text-base ${
                                                        missed
                                                            ? 'text-muted'
                                                            : 'text-line'
                                                    }`}
                                                >
                                                    {missed ? '—' : '·'}
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
