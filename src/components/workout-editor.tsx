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
            {/* The day names the screen under the routine, so it is set at
                heading scale rather than as another card title. */}
            <div className="flex items-center justify-between gap-3">
                {/* Two lines and then an ellipsis. leading-none rather than the
                    .display 0.9 it would otherwise inherit: clamping brings
                    overflow:hidden with it, and at 0.9 the descenders on the
                    second line get sliced off. The full name stays in the DOM,
                    so only the drawing is cut. */}
                <h3 className="display line-clamp-2 min-w-0 text-4xl leading-none">
                    {workout.name}
                </h3>
                {/* Worded, and set like the card-level delete inside a day, so
                    the two destructive moves on this screen read the same.
                    Muted until hovered, and then danger rather than the pulse
                    an icon button would take — nothing that deletes should
                    light up in the colour every other control uses. */}
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

            {/* What the day is missing, as it currently stands on the server:
                the next save is what clears it. Read before the cards rather
                than after them — it says which ones to go and look at. The eye
                points at the fields below, reading the draft, so the red goes
                as they are fixed. The eye sits beside the list where there is
                room and under it on a phone, where a narrow column of errors
                and a button competing for the same line leaves neither enough
                of it. */}
            {problems.length > 0 && (
                <div className="mt-3 flex flex-col items-start gap-2 md:flex-row md:justify-between">
                    {/* Nudged down by the eye button's own padding, so the first
                        error sits level with the words next to it — only while
                        the two share a line. */}
                    <ul className="text-danger list-disc space-y-1 pl-5 text-sm md:pt-1.5">
                        {problems.map((problem, index) => (
                            <li key={index}>{problem}</li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        onClick={() => setHighlight((shown) => !shown)}
                        aria-pressed={highlight}
                        // Same string as the words inside, so what is read out
                        // is what the button says.
                        aria-label={toggleLabel}
                        title={toggleLabel}
                        // self-end rather than items-end on the row: in column
                        // mode that would drag the error list over to the right
                        // edge too. md:self-auto hands it back to the row's own
                        // items-start once the two share a line.
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
                        {/* On its own line below md, so it has room for the
                            words there too: an eye alone under a list of errors
                            reads as an icon someone forgot to label. */}
                        <span className="eyebrow">{toggleLabel}</span>
                    </button>
                </div>
            )}

            {/* Tighter under the error block on a phone: the eye is stacked
                below the list there and carries a 44px touch target, so its own
                padding already puts most of a gap under it. Nothing to make up
                for when there are no errors, or once the eye is back on the
                list's line. */}
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
                        // An exercise the draft has only just added has no
                        // id, so no error names it and nothing lights up.
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

                {/* Shaped like the card it will become, and empty, so the place
                    a new exercise lands is where the button already is. */}
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

            {/* A day is now a column of cards, so Save rides along at the foot
                of the screen instead of waiting at the end of the scroll. It
                bleeds to the page edges: the blur has to cover the gutters or
                the cards show through beside it. */}
            {/* items-stretch, not items-center: Save is the taller button by
                design (bigger type, more padding) and each button would
                otherwise size itself. Letting the row govern keeps the two
                level without pinning a height that the type could outgrow. */}
            {editing && (
                <div className="border-line bg-bg/85 sticky bottom-0 z-10 -mx-4 mt-4 flex items-stretch gap-2 border-t px-4 py-3 backdrop-blur-md">
                    <button
                        type="button"
                        disabled={pending || plan === saved}
                        // Straight back to the last save: the drafts are seeded
                        // from it in the first place.
                        onClick={() => setDrafts(toDrafts(workout.exercises))}
                        // The full wording stays the accessible name at every
                        // width; only what is drawn shortens, and the short form
                        // is a prefix of it, so what is read out still matches
                        // what is seen.
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
