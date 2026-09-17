'use client';

import { useState } from 'react';
import { useT } from '@/i18n/use-t';
import { HistoryExercise } from '@/components/history/history-exercise';
import { historyExercises } from '@/lib/landing';

export function ProgressPreview() {
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
