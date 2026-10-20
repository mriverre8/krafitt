'use client';

import type { Period } from '@/lib/period';
import { historyWeeks, weekState, type Duration } from '@/lib/progress';
import { useId, useState } from 'react';
import { DayPanel, type HistoryDay } from '@/components/history/day-panel';
import { DaySwitcher } from '@/components/routine/day-switcher';

export type { HistoryDay };

export function RoutineHistory({
    days,
    durationWeeks,
    cursor,
    picked = -1,
    initialDay = 0,
    weeks,
    period,
}: {
    days: HistoryDay[];
    durationWeeks: Duration;
    cursor: number;
    /** The day of this week picked ahead of the cursor's, -1 for none: it is
        the one being trained. */
    picked?: number;
    /** The day tab to open on, counted from 0. Past the last day means the last. */
    initialDay?: number;
    /** The rows to draw. Left out, they are a routine's: worked out from its
        duration and how far in it is. */
    weeks?: number[];
    period?: Period;
}) {
    const baseId = useId();
    const [selected, setSelected] = useState(initialDay);
    const index = Math.min(selected, Math.max(days.length - 1, 0));

    if (days.length === 0) return null;

    const rows = weeks ?? historyWeeks(durationWeeks, cursor, days.length);

    return (
        <div className="space-y-8">
            {days.length > 1 || period !== 'run' ? (
                <DaySwitcher
                    days={days.map((day) => ({
                        id: day.id,
                        name: day.name,
                        ready: true,
                        unsaved: false,
                    }))}
                    index={index}
                    baseId={baseId}
                    onSelect={setSelected}
                />
            ) : null}

            {days.map((day, position) => (
                <DayPanel
                    key={day.id}
                    day={day}
                    rows={rows.map((week) => ({
                        week,
                        state: weekState(
                            cursor,
                            week,
                            position,
                            days.length,
                            picked
                        ),
                        logs: day.weeks[week] ?? {},
                    }))}
                    id={`${baseId}-panel-${position}`}
                    labelledBy={`${baseId}-tab-${position}`}
                    hidden={position !== index}
                    period={period}
                />
            ))}
        </div>
    );
}
