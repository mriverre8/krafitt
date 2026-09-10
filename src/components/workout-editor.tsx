'use client';

import { useT } from '@/i18n/use-t';
import { EXERCISES } from '@/lib/constants';
import type { DayAction } from '@/lib/forms';
import type { ExerciseFault } from '@/lib/validate';
import {
    ghostClass,
    iconButtonClass,
    labelClass,
    primaryClass,
} from '@/lib/ui';
import { Eye, EyeOff, Plus, Save, Trash, Undo2 } from 'lucide-react';
import { startTransition, useActionState, useState } from 'react';
import { ActionButton } from './action-button';
import { useDiscardSignal, useEditMode } from './edit-mode';
import {
    emptyExercise,
    ExerciseFields,
    toDrafts,
    type ExerciseDraft,
} from './exercise-fields';
import { FormError } from './form-error';
import type { ExerciseView } from './workout-exercise';

/**
 * One training day, and the whole of it is a single form: adding, editing and
 * removing exercises all happen in the draft below, and nothing reaches the
 * database until Save changes, the only thing here that talks to the server.
 *
 * The day owns the screen, so its name is the heading and each exercise gets a
 * card of its own. Save follows you down the page rather than waiting at the
 * bottom of a column of cards you would have to scroll back past.
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
    const editing = useEditMode();
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

    // Leaving edit mode throws unsaved work away, having asked first — the
    // routine does the asking, since it is the whole set of days that is in
    // question and not this one. Same trick as above: back to the last save.
    const discarded = useDiscardSignal(workout.id, plan !== saved);
    const [lastDiscarded, setLastDiscarded] = useState(discarded);
    if (discarded !== lastDiscarded) {
        setLastDiscarded(discarded);
        setDrafts(toDrafts(server));
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
        <div>
            <div className="flex items-center justify-between gap-3">
                <h3 className="display line-clamp-2 min-w-0 text-4xl leading-none">
                    {workout.name}
                </h3>
                {editing && (
                    <ActionButton
                        action={() => onDeleteWorkout(workout.id)}
                        confirm={t('routine.deleteDayConfirm', {
                            name: workout.name,
                        })}
                        className={`${labelClass} hover:text-danger flex shrink-0 items-center gap-1.5 py-1 transition-colors`}
                    >
                        <Trash
                            size={14}
                            aria-hidden
                        />
                        {t('routine.deleteDay')}
                    </ActionButton>
                )}
            </div>

            {problems.length > 0 && (
                <div className="mt-3 flex flex-col items-start gap-2 md:flex-row md:justify-between">
                    <ul className="text-danger list-disc space-y-1 pl-5 text-sm md:pt-1.5">
                        {problems.map((problem, index) => (
                            <li key={index}>{problem}</li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        onClick={() => setHighlight((shown) => !shown)}
                        aria-pressed={highlight}
                        aria-label={toggleLabel}
                        title={toggleLabel}
                        className={`${iconButtonClass} shrink-0 self-end md:self-auto`}
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
                        <span className="eyebrow">{toggleLabel}</span>
                    </button>
                </div>
            )}

            <div
                className={`space-y-3 ${
                    problems.length > 0 ? 'mt-2 md:mt-4' : 'mt-4'
                }`}
            >
                {drafts.map((draft, index) => (
                    <ExerciseFields
                        key={index}
                        exercise={draft}
                        index={index}
                        fault={
                            highlight && draft.id ? faults[draft.id] : undefined
                        }
                        readOnly={!editing}
                        onChange={(patch) => update(index, patch)}
                        onRemove={() =>
                            setDrafts((current) =>
                                current.filter((_, i) => i !== index)
                            )
                        }
                        canRemove={drafts.length > 1}
                    />
                ))}

                {editing && (
                    <button
                        type="button"
                        disabled={drafts.length >= EXERCISES.max}
                        onClick={() =>
                            setDrafts((current) => [...current, emptyExercise])
                        }
                        className="lift border-line text-muted hover:border-pulse hover:text-pulse font-display flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-sm font-bold tracking-wide uppercase disabled:pointer-events-none disabled:opacity-40"
                    >
                        <Plus
                            size={14}
                            aria-hidden
                        />
                        {t('exercise.add')}
                    </button>
                )}
            </div>

            <FormError message={state.error} />

            {editing && (
                <div className="border-line bg-bg/85 sticky bottom-0 z-10 -mx-4 mt-4 flex items-stretch gap-2 border-t px-4 py-3 backdrop-blur-md">
                    <button
                        type="button"
                        disabled={pending || plan === saved}
                        onClick={() => setDrafts(toDrafts(workout.exercises))}
                        aria-label={t('exercise.undo')}
                        className={`${ghostClass} flex flex-1 items-center justify-center gap-1.5`}
                    >
                        <Undo2
                            size={14}
                            aria-hidden
                        />
                        <span className="md:hidden">
                            {t('exercise.undoShort')}
                        </span>
                        <span className="hidden md:inline">
                            {t('exercise.undo')}
                        </span>
                    </button>
                    <button
                        type="button"
                        disabled={pending || plan === saved}
                        onClick={save}
                        className={`${primaryClass} flex flex-[2] items-center justify-center gap-2`}
                    >
                        <Save
                            size={16}
                            aria-hidden
                        />
                        {t('exercise.saveChanges')}
                    </button>
                </div>
            )}
        </div>
    );
}
