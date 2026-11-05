'use client';

import type { DayAction, FormAction, FormState } from '@/lib/forms';
import type { ExerciseFault, Problem } from '@/lib/validate';
import { useId, useState } from 'react';
import { DaySwitcher } from '@/components/routine/day-switcher';
import { useDirtyDays } from '@/components/routine/edit-mode';
import type { ExerciseView } from '@/components/workout/workout-exercise';
import { WorkoutEditor } from '@/components/workout/workout-editor';

export type RoutineDay = {
    id: string;
    name: string;
    exercises: ExerciseView[];
    problems: Problem[];
    faults: Record<string, ExerciseFault>;
    /** Exercises the day archived, by name: what its name fields offer back. */
    retired: string[];
};

export function RoutineDays({
    days,
    addDay,
    saveExercises,
    renameWorkout,
    onDeleteWorkout,
    reorderDays,
}: {
    days: RoutineDay[];
    addDay?: FormAction;
    saveExercises: DayAction;
    renameWorkout: (
        workoutId: string,
        previous: FormState,
        data: FormData
    ) => Promise<FormState>;
    /** Absent once the routine has started: its days are fixed from then on. */
    onDeleteWorkout?: (workoutId: string) => Promise<void>;
    /** Same: the cursor walks the days in their order. */
    reorderDays?: (ids: string[]) => Promise<void>;
}) {
    const baseId = useId();
    const dirtyDays = useDirtyDays();
    const [selected, setSelected] = useState(0);

    // A day just added is the one to fill in, so it comes up on screen as
    // soon as the page brings it back. Adjusted while rendering rather than in
    // an effect, so there is no frame with the old day still showing.
    const ids = days.map((day) => day.id).join();
    const [lastIds, setLastIds] = useState(ids);
    if (ids !== lastIds) {
        setLastIds(ids);
        const before = lastIds.split(',');
        const added = days.findIndex((day) => !before.includes(day.id));
        if (added >= 0) setSelected(added);
    }

    const index = Math.min(selected, Math.max(days.length - 1, 0));

    if (days.length === 0) return null;

    // The day on screen stays on screen once the days are moved, wherever it
    // has gone — the tabs are by position, and that position now holds another.
    const onReorder =
        reorderDays &&
        (async (ids: string[]) => {
            await reorderDays(ids);
            setSelected(Math.max(ids.indexOf(days[index].id), 0));
        });

    return (
        <div className="space-y-6">
            <DaySwitcher
                days={days.map((day) => ({
                    id: day.id,
                    name: day.name,
                    ready: day.problems.length === 0,
                    unsaved: dirtyDays.has(day.id),
                }))}
                index={index}
                baseId={baseId}
                addDay={addDay}
                onReorder={onReorder}
                onSelect={setSelected}
            />

            {days.map((day, position) => (
                <div
                    key={day.id}
                    role="tabpanel"
                    id={`${baseId}-panel-${position}`}
                    aria-labelledby={`${baseId}-tab-${position}`}
                    hidden={position !== index}
                >
                    <WorkoutEditor
                        workout={day}
                        problems={day.problems}
                        faults={day.faults}
                        retired={day.retired}
                        saveExercises={saveExercises}
                        onRenameWorkout={renameWorkout.bind(null, day.id)}
                        onDeleteWorkout={onDeleteWorkout}
                    />
                </div>
            ))}
        </div>
    );
}
