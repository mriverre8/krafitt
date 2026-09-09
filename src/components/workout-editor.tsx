'use client';

import { useT } from '@/i18n/use-t';
import { EXERCISES } from '@/lib/constants';
import type { DayAction } from '@/lib/forms';
import type { ExerciseFault } from '@/lib/validate';
import { cardClass, ghostClass, iconButtonClass, primaryClass } from '@/lib/ui';
import { Eye, EyeOff, Plus, Save, Trash, Undo2 } from 'lucide-react';
import { startTransition, useActionState, useState } from 'react';
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
    problems,
    faults,
    saveExercises,
    onDeleteWorkout,
}: {
    workout: { id: string; name: string; exercises: ExerciseView[] };
    /** What this day is still missing, as last saved. */
    problems: string[];
    /** The same holes as fields to paint, by exercise id. */
    faults: Record<string, ExerciseFault>;
    saveExercises: DayAction;
    onDeleteWorkout: (workoutId: string) => Promise<void>;
}) {
    const t = useT();
    const [state, formAction, pending] = useActionState(saveExercises, {});
    const [drafts, setDrafts] = useState<ExerciseDraft[]>(() =>
        toDrafts(workout.exercises)
    );
    const [highlight, setHighlight] = useState(false);
    const toggleLabel = t(
        highlight ? 'validate.hideFields' : 'validate.showFields'
    );

    // What the server holds. Its own answer to the last save outranks the props,
    // which lag behind it and sometimes never move at all: a technique left blank
    // is stored as the default, which can leave the day exactly as it was.
    const server = state.saved ?? workout.exercises;
    const saved = JSON.stringify(toDrafts(server));
    const plan = JSON.stringify(drafts);

    // Adjusting state while rendering rather than in an effect: the drafts start
    // again from the day the server sends back, defaults filled in and ids handed
    // out to whatever was new.
    const [lastState, setLastState] = useState(state);
    if (state !== lastState) {
        setLastState(state);
        if (state.saved) setDrafts(toDrafts(state.saved));
    }

    function update(index: number, patch: Partial<ExerciseDraft>) {
        setDrafts((current) =>
            current.map((draft, i) =>
                i === index ? { ...draft, ...patch } : draft
            )
        );
    }

    /**
     * The action is dispatched by hand rather than through `<form action>`.
     * React resets the form once the action settles, and that reset drops a
     * controlled `<select>` back onto its first option — the rep type would
     * spring back to Range on every save until the page was reloaded. Nothing
     * is lost by leaving the form out: the day travels as one JSON field.
     *
     * A `<form action>` opens the transition for you; dispatching by hand has to
     * open it here, or `pending` never flips and the button stays live mid-save.
     */
    function save() {
        const data = new FormData();
        data.set('workoutId', workout.id);
        data.set('plan', plan);
        startTransition(() => formAction(data));
    }

    return (
        <div className={cardClass}>
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
                            // An exercise the draft has only just added has no
                            // id, so no error names it and nothing lights up.
                            fault={
                                highlight && draft.id
                                    ? faults[draft.id]
                                    : undefined
                            }
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

            {/* Undo and adding an exercise are the secondary actions, since
                neither touches anything but the draft; Save is the heavy one
                and always comes last, on its own full-width row below them,
                same on every width. */}
            <div className="border-line mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                <button
                    type="button"
                    disabled={pending || plan === saved}
                    // Straight back to the last save: the drafts are seeded from
                    // it in the first place.
                    onClick={() => setDrafts(toDrafts(workout.exercises))}
                    // The full wording stays the accessible name at every width;
                    // only what is drawn shortens, and the short form is a prefix
                    // of it, so what is read out still matches what is seen.
                    aria-label={t('exercise.undo')}
                    className={`${ghostClass} order-1 flex flex-1 items-center justify-center gap-1.5`}
                >
                    <Undo2
                        size={14}
                        aria-hidden
                    />
                    <span className="md:hidden">{t('exercise.undoShort')}</span>
                    <span className="hidden md:inline">
                        {t('exercise.undo')}
                    </span>
                </button>
                <button
                    type="button"
                    disabled={drafts.length >= EXERCISES.max}
                    onClick={() =>
                        setDrafts((current) => [...current, emptyExercise])
                    }
                    aria-label={t('exercise.add')}
                    className={`${ghostClass} order-2 flex flex-1 items-center justify-center gap-1.5`}
                >
                    <Plus
                        size={14}
                        aria-hidden
                    />
                    <span className="md:hidden">{t('exercise.addShort')}</span>
                    <span className="hidden md:inline">
                        {t('exercise.add')}
                    </span>
                </button>
                <button
                    type="button"
                    disabled={pending || plan === saved}
                    onClick={save}
                    className={`${primaryClass} order-3 flex basis-full items-center justify-center gap-2`}
                >
                    <Save
                        size={16}
                        aria-hidden
                    />
                    {t('exercise.saveChanges')}
                </button>
            </div>

            {/* What the day is missing, as it currently stands on the server:
                the next save is what clears it. The eye points at the fields
                behind it, reading the draft, so the red goes as they are fixed. */}
            {problems.length > 0 && (
                <div className="mt-4 flex items-start justify-between gap-2">
                    {/* Nudged down by the eye button's own padding, so the first
                        error sits level with the words next to it. */}
                    <ul className="text-danger list-disc space-y-1 pt-1.5 pl-5 text-sm">
                        {problems.map((problem, index) => (
                            <li key={index}>{problem}</li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        onClick={() => setHighlight((shown) => !shown)}
                        aria-pressed={highlight}
                        // Same string as the label below, so the icon on its own
                        // is named exactly as the button reads on a wider screen.
                        aria-label={toggleLabel}
                        title={toggleLabel}
                        className={iconButtonClass}
                    >
                        {highlight ? (
                            <EyeOff
                                size={16}
                                aria-hidden
                            />
                        ) : (
                            <Eye
                                size={16}
                                aria-hidden
                            />
                        )}
                        {/* Room for the words only from md up; on a phone the
                            eye has to carry it alone. */}
                        <span className="eyebrow hidden md:inline">
                            {toggleLabel}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
