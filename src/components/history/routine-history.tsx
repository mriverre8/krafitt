'use client';

import { historyWeeks, weekState, type Duration } from '@/lib/progress';
import { useId, useState } from 'react';
import { DayPanel, type HistoryDay } from '@/components/history/day-panel';
import { DaySwitcher } from '@/components/routine/day-switcher';

export type { HistoryDay };

export function RoutineHistory({
    days,
    durationWeeks,
    cursor,
}: {
    days: HistoryDay[];
    durationWeeks: Duration;
    cursor: number;
}) {
    const baseId = useId();
    const [selected, setSelected] = useState(0);
    const index = Math.min(selected, Math.max(days.length - 1, 0));

    if (days.length === 0) return null;

    const weeks = historyWeeks(durationWeeks, cursor, days.length);

    return (
        <div className="space-y-8">
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

            {days.map((day, position) => (
                <DayPanel
                    key={day.id}
                    day={day}
                    rows={weeks.map((week) => ({
                        week,
                        state: weekState(cursor, week, position, days.length),
                        logs: day.weeks[week] ?? {},
                    }))}
                    id={`${baseId}-panel-${position}`}
                    labelledBy={`${baseId}-tab-${position}`}
                    hidden={position !== index}
                />
            ))}
        </div>
    );
}
