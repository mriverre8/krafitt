'use client';

import { useT } from '@/i18n/use-t';
import {
    DEFAULT_EFFORT,
    SET_PARTS,
    setMove,
    type SetMove,
    type SetPart,
    type SetValue,
    type WeekState,
} from '@/lib/progress';
import { EFFORT_ICON, EFFORT_SAID } from '@/lib/effort';
import { formatReps } from '@/lib/reps';
import { setName, setPlaces, setShortLabel } from '@/lib/sets';
import { cardClass, iconButtonClass } from '@/lib/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
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
    const moves = rows.map((row) => {
        const forRow: Record<number, SetMove> = {};
        exercise.sets.forEach((_, setIndex) => {
            const value = row.sets[setIndex];
            if (!value) return;
            const before = carried[setIndex];
            if (before) forRow[setIndex] = setMove(value, before);
            carried[setIndex] = value;
        });
        return forRow;
    });

    /** The verdict reaches the part that earned it and everything under it: a
        heavier bar colours the whole set, a rep added to the same bar colours
        the reps and the mark beside them, and a set that only felt easier
        colours the mark alone. */
    const tone = (move: SetMove, part: SetPart) =>
        move && SET_PARTS.indexOf(part) >= SET_PARTS.indexOf(move.part)
            ? move.dir === 'up'
                ? 'text-surge-ink'
                : 'text-danger'
            : 'text-ink';

    /** The week being trained is banded down its whole column: with ten weeks
        side by side, "where am I" has to survive a horizontal scroll. */
    const band = (row: HistoryRow) =>
        row.state === 'current' ? 'bg-surface2' : '';

    const box = useRef<HTMLDivElement>(null);
    const here = useRef<HTMLTableCellElement>(null);
    useEffect(() => {
        const cell = here.current;
        const wrap = box.current;
        if (!cell || !wrap) return;
        const corner = cell.parentElement!.firstElementChild as HTMLElement;
        const before = cell.previousElementSibling as HTMLElement;
        wrap.scrollLeft = before.offsetLeft - corner.offsetWidth;
    }, [exercise.id]);

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

            <div
                ref={box}
                className="relative mt-3 -mb-1 overflow-x-auto pb-1"
            >
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
                                className="border-line bg-surface sticky left-0 z-10 border-r border-b-2 pr-3 pb-2 text-left"
                            >
                                <span className="sr-only">
                                    {t('progress.setColumn')}
                                </span>
                            </th>
                            {rows.map((row) => {
                                const complete = exercise.sets.every(
                                    (_, setIndex) => row.sets[setIndex]
                                );
                                const current = row.state === 'current';
                                const rule = current
                                    ? 'border-b-volt'
                                    : complete
                                      ? 'border-b-surge'
                                      : 'border-b-line';

                                return (
                                    <th
                                        key={row.week}
                                        ref={current ? here : undefined}
                                        scope="col"
                                        className={`min-w-16 border-b-2 px-2 pb-2 font-normal ${rule} ${band(row)}`}
                                    >
                                        <span className="sr-only">
                                            {t('progress.weekLabel', {
                                                n: row.week,
                                            })}
                                        </span>
                                        <span
                                            aria-hidden
                                            className={`figure inline-flex text-sm leading-none ${
                                                current
                                                    ? 'text-ink'
                                                    : 'text-muted'
                                            }`}
                                        >
                                            {t('progress.week', {
                                                n: row.week,
                                            })}
                                            <span className="w-2.5 shrink-0" />
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {exercise.sets.map((set, setIndex) => {
                            const rule =
                                setIndex === exercise.sets.length - 1
                                    ? ''
                                    : 'border-b border-b-line';
                            const sub = places[setIndex].kind !== 'normal';

                            return (
                                <tr key={setIndex}>
                                    <th
                                        scope="row"
                                        className={`border-line bg-surface sticky left-0 z-10 border-r py-2.5 pr-3 text-left font-normal ${rule}`}
                                    >
                                        <span className="sr-only">
                                            {`${t('progress.setLabel', {
                                                n: names[setIndex],
                                            })}, ${formatReps(set, t)}`}
                                        </span>
                                        <span aria-hidden>
                                            <span
                                                className={`figure block text-lg leading-none ${
                                                    sub
                                                        ? 'text-muted'
                                                        : 'text-ink'
                                                }`}
                                            >
                                                {labels[setIndex]}
                                            </span>
                                            <span className="text-muted mt-1 block text-[11px] whitespace-nowrap">
                                                {formatReps(set, t)}
                                            </span>
                                        </span>
                                    </th>

                                    {rows.map((row, rowIndex) => {
                                        const value = row.sets[setIndex];
                                        const cell = `px-2 py-2.5 ${rule} ${band(row)}`;

                                        if (value) {
                                            const move =
                                                moves[rowIndex][setIndex];
                                            const mark =
                                                value.effort &&
                                                value.effort !== DEFAULT_EFFORT
                                                    ? value.effort
                                                    : undefined;
                                            const Mark =
                                                mark && EFFORT_ICON[mark];

                                            return (
                                                <td
                                                    key={row.week}
                                                    className={cell}
                                                >
                                                    <span className="sr-only">
                                                        {t('progress.logged', {
                                                            weight: value.weight,
                                                            reps: value.reps,
                                                        }) +
                                                            (move
                                                                ? `, ${t(
                                                                      move.dir ===
                                                                          'up'
                                                                          ? 'progress.up'
                                                                          : 'progress.down'
                                                                  )}`
                                                                : '') +
                                                            (mark
                                                                ? `, ${t(
                                                                      EFFORT_SAID[
                                                                          mark
                                                                      ]
                                                                  )}`
                                                                : '')}
                                                    </span>
                                                    <span
                                                        aria-hidden
                                                        className="figure inline-flex items-start text-base whitespace-nowrap"
                                                    >
                                                        <span
                                                            className={tone(
                                                                move,
                                                                'weight'
                                                            )}
                                                        >
                                                            {value.weight}×
                                                        </span>
                                                        <span
                                                            className={tone(
                                                                move,
                                                                'reps'
                                                            )}
                                                        >
                                                            {value.reps}
                                                        </span>
                                                        <span className="w-2.5 shrink-0">
                                                            {Mark && (
                                                                <Mark
                                                                    size={10}
                                                                    aria-hidden
                                                                    strokeWidth={
                                                                        3
                                                                    }
                                                                    className={`ml-0.5 ${tone(move, 'effort')}`}
                                                                />
                                                            )}
                                                        </span>
                                                    </span>
                                                </td>
                                            );
                                        }

                                        const missed = row.state === 'past';
                                        return (
                                            <td
                                                key={row.week}
                                                className={cell}
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
                                                    className={`figure inline-flex text-base ${
                                                        missed
                                                            ? 'text-muted'
                                                            : 'text-line'
                                                    }`}
                                                >
                                                    {missed ? '—' : '·'}
                                                    <span className="w-2.5 shrink-0" />
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
