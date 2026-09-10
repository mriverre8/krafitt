'use client';

import { weekState } from '@/lib/progress';
import { useId, useState } from 'react';
import { DayPanel, type HistoryDay } from './day-panel';
import { DaySwitcher } from './day-switcher';

export type { HistoryDay };

/**
 * A routine's history, one day per page — the same rack of numbered plates that
 * moves between the days of a routine, so the two views are navigated the same
 * way and neither has to be learned twice.
 *
 * Read-only, so every day could be rendered on demand instead of all at once;
 * they are all mounted anyway, because that is what keeps the tab panels' ids
 * stable and moving between days instant on a page with nothing to fetch.
 */
export function RoutineHistory({
    days,
    durationWeeks,
    cursor,
}: {
    days: HistoryDay[];
    durationWeeks: number;
    /** Where the routine has got to: what separates a week that was skipped
        from one that has not come round yet. */
    cursor: number;
}) {
    const baseId = useId();
    const [selected, setSelected] = useState(0);
    const index = Math.min(selected, Math.max(days.length - 1, 0));

    if (days.length === 0) return null;

    const weeks = Array.from({ length: durationWeeks }, (_, i) => i + 1);

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
                    durationWeeks={durationWeeks}
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
