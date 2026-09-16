'use client';

import { useT } from '@/i18n/use-t';
import { EXERCISES } from '@/lib/constants';
import type { DayAction, FormAction } from '@/lib/forms';
import { blankExerciseFault, type ExerciseFault } from '@/lib/validate';
import {
    cardClass,
    dashedActionClass,
    ghostClass,
    labelClass,
    menuDangerClass,
    menuItemClass,
    primaryClass,
} from '@/lib/ui';
import { showModal } from '@/store/modal';
import {
    Ellipsis,
    Plus,
    Save,
    Trash,
    TriangleAlert,
    Type,
    Undo2,
} from 'lucide-react';
import { startTransition, useActionState, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { Dropdown } from '@/components/ui/dropdown';
import { useDiscardSignal, useEditMode } from '@/components/routine/edit-mode';
import {
    emptyExercise,
    ExerciseFields,
    toDrafts,
    type ExerciseDraft,
} from '@/components/workout/exercise-fields';
import {
    blankExercise,
    ExercisePreview,
} from '@/components/workout/exercise-preview';
import { FormError } from '@/components/ui/form-error';
import type { ExerciseView } from '@/components/workout/workout-exercise';

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
    onRenameWorkout,
    onDeleteWorkout,
}: {
    workout: { id: string; name: string; exercises: ExerciseView[] };
    /** What this day is still missing, as last saved. */
    problems: string[];
    /** The same holes as fields to paint, by exercise id. */
    faults: Record<string, ExerciseFault>;
    saveExercises: DayAction;
    /** Already bound to this day. */
    onRenameWorkout: FormAction;
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

    const showProblems = editing && problems.length > 0;

    // What the server holds. Its own answer to the last save outranks the props,
    // which lag behind it and sometimes never move at all: a technique left blank
    // is stored as the default, which can leave the day exactly as it was.
    const server = state.saved ?? workout.exercises;
    const saved = JSON.stringify(toDrafts(server));
    const plan = JSON.stringify(drafts);
    const dirty = plan !== saved;

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
    const discarded = useDiscardSignal(workout.id, dirty);
    const [lastDiscarded, setLastDiscarded] = useState(discarded);
    if (discarded !== lastDiscarded) {
        setLastDiscarded(discarded);
        setDrafts(toDrafts(server));
    }

    /**
     * The saved faults this card is owed. A card the user has only just added
     * is in no save yet, so nothing is known to be wrong with it and it stays
     * unpainted — with one exception: the blank card a day with nothing saved
     * opens with is the very card the problems above are about, and it has no
     * id to be filed under.
     */
    function faultOf(draft: ExerciseDraft, index: number) {
        if (!showProblems || !highlight) return undefined;
        if (draft.id) return faults[draft.id];
        return workout.exercises.length === 0 && index === 0
            ? blankExerciseFault
            : undefined;
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
                    <Dropdown
                        label={t('routine.dayOptions')}
                        icon={
                            <Ellipsis
                                size={18}
                                aria-hidden
                            />
                        }
                    >
                        {(close) => (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        showModal('rename', {
                                            name: workout.name,
                                            rename: onRenameWorkout,
                                            title: t('routine.renameDay'),
                                            label: t('routine.dayLabel'),
                                        });
                                    }}
                                    className={menuItemClass}
                                >
                                    <Type
                                        size={14}
                                        aria-hidden
                                    />
                                    {t('routine.renameDay')}
                                </button>
                                <ActionButton
                                    action={() => onDeleteWorkout(workout.id)}
                                    confirm={{
                                        title: t('routine.deleteDay'),
                                        message: t('routine.deleteDayConfirm', {
                                            name: workout.name,
                                        }),
                                    }}
                                    className={menuDangerClass}
                                >
                                    <Trash
                                        size={14}
                                        aria-hidden
                                    />
                                    {t('routine.deleteDay')}
                                </ActionButton>
                            </>
                        )}
                    </Dropdown>
                )}
            </div>

            {showProblems && (
                <div className={`${cardClass} border-l-danger mt-4`}>
                    <div className="text-danger flex items-center gap-2">
                        <TriangleAlert
                            size={16}
                            aria-hidden
                            className="shrink-0"
                        />
                        <p className="eyebrow">
                            {problems.length === 1
                                ? t('validate.problem')
                                : t('validate.problems', {
                                      n: problems.length,
                                  })}
                        </p>
                        <button
                            type="button"
                            onClick={() => setHighlight((shown) => !shown)}
                            aria-pressed={highlight}
                            className={`${labelClass} hover:text-pulse ml-auto shrink-0 py-1 transition-colors`}
                        >
                            {toggleLabel}
                        </button>
                    </div>
                    <ul className="text-muted mt-3 space-y-1.5 text-sm">
                        {problems.map((problem, index) => (
                            <li key={index}>{problem}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-4 space-y-4">
                {editing
                    ? drafts.map((draft, index) => (
                          <ExerciseFields
                              key={index}
                              exercise={draft}
                              index={index}
                              fault={faultOf(draft, index)}
                              onChange={(patch) => update(index, patch)}
                              onRemove={() =>
                                  setDrafts((current) =>
                                      current.filter((_, i) => i !== index)
                                  )
                              }
                              canRemove={drafts.length > 1}
                          />
                      ))
                    : server.map((exercise) => (
                          <ExercisePreview
                              key={exercise.id}
                              exercise={exercise}
                          />
                      ))}

                {!editing && server.length === 0 && (
                    <ExercisePreview exercise={blankExercise} />
                )}

                {editing && (
                    <button
                        type="button"
                        disabled={drafts.length >= EXERCISES.max}
                        onClick={() =>
                            setDrafts((current) => [...current, emptyExercise])
                        }
                        className={`${dashedActionClass} w-full p-5`}
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

            {editing && dirty && (
                <div className="border-line bg-bg/85 sticky bottom-0 z-10 -mx-4 mt-4 flex items-stretch gap-2 border-t px-4 py-3 backdrop-blur-md">
                    <button
                        type="button"
                        disabled={pending}
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
                        disabled={pending}
                        onClick={save}
                        className={`${primaryClass} flex flex-2 items-center justify-center gap-2`}
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
