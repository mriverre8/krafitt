'use client';

import type { DayAction } from '@/lib/forms';
import type { ExerciseFault } from '@/lib/validate';
import { useId, useState } from 'react';
import { DaySwitcher } from './day-switcher';
import { useDirtyDays } from './edit-mode';
import type { ExerciseView } from './workout-exercise';
import { WorkoutEditor } from './workout-editor';

export type RoutineDay = {
    id: string;
    name: string;
    exercises: ExerciseView[];
    /** What this day is still missing, as last saved. */
    problems: string[];
    /** The same holes as fields to paint, by exercise id. */
    faults: Record<string, ExerciseFault>;
};

/**
 * One day of the routine on screen at a time, with the rack above to move
 * between them.
 *
 * Every day is mounted, and the ones you are not on are hidden rather than
 * thrown away: each holds a draft that nothing has saved yet, and moving to
 * day 2 and back must not cost you what you typed on day 1.
 */
export function RoutineDays({
    days,
    saveExercises,
    onDeleteWorkout,
}: {
    days: RoutineDay[];
    saveExercises: DayAction;
    onDeleteWorkout: (workoutId: string) => Promise<void>;
}) {
    const baseId = useId();
    const dirtyDays = useDirtyDays();
    const [selected, setSelected] = useState(0);
    // Deleting a day can leave the selection past the end of a shorter list.
    const index = Math.min(selected, Math.max(days.length - 1, 0));

    if (days.length === 0) return null;

    return (
        <div className="space-y-8">
            <DaySwitcher
                days={days.map((day) => ({
                    id: day.id,
                    name: day.name,
                    ready: day.problems.length === 0,
                    unsaved: dirtyDays.has(day.id),
                }))}
                index={index}
                baseId={baseId}
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
                        saveExercises={saveExercises}
                        onDeleteWorkout={onDeleteWorkout}
                    />
                </div>
            ))}
        </div>
    );
}
