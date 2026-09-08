'use client';

import { useT } from '@/i18n/use-t';
import { EXERCISES } from '@/lib/constants';
import type { FormAction } from '@/lib/forms';
import { cardClass, ghostClass, iconButtonClass, primaryClass } from '@/lib/ui';
import { Plus, Save, Trash } from 'lucide-react';
import { useActionState, useState } from 'react';
import { ActionButton } from './action-button';
import {
    emptyExercise,
    ExerciseFields,
    toDrafts,
    type ExerciseDraft,
} from './exercise-fields';
import { FormError } from './form-error';
import type { ExerciseView } from './workout-exercise';

/**
 * A whole training day is one form. Adding, editing and removing exercises all
 * happen in the draft below; nothing reaches the database until Save changes,
 * which is why that button is the only thing that talks to the server here.
 */
export function WorkoutEditor({
    workout,
    saveExercises,
    onDeleteWorkout,
}: {
    workout: { id: string; name: string; exercises: ExerciseView[] };
    saveExercises: FormAction;
    onDeleteWorkout: (workoutId: string) => Promise<void>;
}) {
    const t = useT();
    const [state, formAction, pending] = useActionState(saveExercises, {});
    const [drafts, setDrafts] = useState<ExerciseDraft[]>(() =>
        toDrafts(workout.exercises)
    );

    // What the server holds, in the exact shape the drafts take: comparing the
    // two strings is both the dirty check and the payload we submit.
    const saved = JSON.stringify(toDrafts(workout.exercises));
    const plan = JSON.stringify(drafts);

    // Adjusting state while rendering rather than in an effect: a save answers
    // with the revalidated day, so the drafts pick up the ids it just handed out.
    const [lastState, setLastState] = useState(state);
    if (state !== lastState) {
        setLastState(state);
        if (state.ok) setDrafts(toDrafts(workout.exercises));
    }

    function update(index: number, patch: Partial<ExerciseDraft>) {
        setDrafts((current) =>
            current.map((draft, i) =>
                i === index ? { ...draft, ...patch } : draft
            )
        );
    }

    return (
        <form
            action={formAction}
            className={cardClass}
        >
            <input
                type="hidden"
                name="workoutId"
                value={workout.id}
            />
            <input
                type="hidden"
                name="plan"
                value={plan}
            />

            <div className="flex items-center justify-between gap-2">
                <h3 className="display text-3xl">{workout.name}</h3>
                <ActionButton
                    action={() => onDeleteWorkout(workout.id)}
                    confirm={t('routine.deleteDayConfirm', {
                        name: workout.name,
                    })}
                    label={t('routine.deleteDay')}
                    className={iconButtonClass}
                >
                    <Trash
                        size={16}
                        aria-hidden
                    />
                </ActionButton>
            </div>

            <div className="mt-4 space-y-4">
                {drafts.map((draft, index) => (
                    <div
                        key={index}
                        className="border-line border-t pt-4"
                    >
                        <ExerciseFields
                            exercise={draft}
                            index={index}
                            onChange={(patch) => update(index, patch)}
                            onRemove={() =>
                                setDrafts((current) =>
                                    current.filter((_, i) => i !== index)
                                )
                            }
                            canRemove={drafts.length > 1}
                        />
                    </div>
                ))}
            </div>

            <FormError message={state.error} />

            {/* Save is the heavy one and takes the row; adding an exercise sits
                next to it as a secondary action, because it only edits the draft. */}
            <div className="border-line mt-4 flex items-center gap-2 border-t pt-4">
                <button
                    type="submit"
                    disabled={pending || plan === saved}
                    className={`${primaryClass} flex flex-1 items-center justify-center gap-2`}
                >
                    <Save
                        size={16}
                        aria-hidden
                    />
                    {t('exercise.saveChanges')}
                </button>
                <button
                    type="button"
                    disabled={drafts.length >= EXERCISES.max}
                    onClick={() =>
                        setDrafts((current) => [...current, emptyExercise])
                    }
                    className={`${ghostClass} flex shrink-0 items-center gap-1.5`}
                >
                    <Plus
                        size={14}
                        aria-hidden
                    />
                    {t('exercise.add')}
                </button>
            </div>
        </form>
    );
}
