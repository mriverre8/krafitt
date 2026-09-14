'use client';

import { useT } from '@/i18n/use-t';
import { historyExercises } from '@/lib/demo';
import { useState } from 'react';
import { HistoryExercise } from '@/components/history/history-exercise';

/**
 * The history grid, with the arrows working: every cell is judged against the
 * last week that same set was logged, skipped weeks and all. The app's own
 * component, not a picture of it — paging between exercises is the thing worth
 * feeling, so this one takes input where the training screen is a still.
 */
export function ProgressDemo() {
    const t = useT();
    const [position, setPosition] = useState(0);
    const entries = historyExercises(t);
    const entry = entries[position];

    return (
        <HistoryExercise
            exercise={entry.exercise}
            rows={entry.rows}
            position={position}
            total={entries.length}
            onSelect={setPosition}
        />
    );
}
