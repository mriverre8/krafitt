'use client';

import { useT } from '@/i18n/use-t';
import { NAME_MAX, REPS, SETS } from '@/lib/constants';
import { isRepMode, REP_MODES, type RepMode } from '@/lib/reps';
import type { ExerciseFault } from '@/lib/validate';
import {
    cardClass,
    fieldClass,
    labelClass,
    removeButtonClass,
    titleInputClass,
    wrongFieldClass,
    wrongTitleInputClass,
} from '@/lib/ui';
import { Plus, X } from 'lucide-react';
import { useId } from 'react';
import type { ExerciseView } from './workout-exercise';

export type SetDraft = {
    mode: RepMode;
    repMin: string;
    repMax: string;
    technique: string;
};

/** `id` is null until the exercise has been saved for the first time. */
export type ExerciseDraft = {
    id: string | null;
    name: string;
    sets: SetDraft[];
};

export const emptySet: SetDraft = {
    mode: 'range',
    repMin: '',
    repMax: '',
    technique: '',
};

export const emptyExercise: ExerciseDraft = {
    id: null,
    name: '',
    sets: [emptySet],
};

/**
 * The day always shows at least one exercise, the same way an exercise always
 * shows at least one set. Key order matters: the drafts are compared and
 * submitted as JSON.
 */
export function toDrafts(exercises: ExerciseView[]): ExerciseDraft[] {
    if (exercises.length === 0) return [emptyExercise];
    return exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets.map((set) => ({
            mode: isRepMode(set.repMode) ? set.repMode : 'range',
            repMin: set.repMin?.toString() ?? '',
            repMax: set.repMax?.toString() ?? '',
            technique: set.technique,
        })),
    }));
}

const rowFieldClass = 'h-12';

/** The numbers share out whatever the row has left on a phone, so the line ends
    flush instead of trailing off; from md up they are a fixed column again. */
const numberClass = (wrong: boolean) =>
    `${wrong ? wrongFieldClass : fieldClass} ${rowFieldClass} min-w-0 flex-1 ` +
    `px-1 text-center md:w-20 md:flex-none md:px-3`;

const noFault = { min: false, max: false };

/** A field the mode does not need: gone on a phone, an empty slot from md up,
    where keeping the columns aligned across rows is worth the space. */
const unusedClass = 'hidden md:invisible md:block';

/**
 * One exercise of the day, in a card of its own. Holds no state: the whole day
 * is a single form, and its draft lives in the editor above so one Save covers
 * all of them. Every field can be left blank — the routine is validated as a
 * whole before it can be activated.
 */
export function ExerciseFields({
    exercise,
    index,
    fault,
    readOnly,
    onChange,
    onRemove,
    canRemove,
}: {
    exercise: ExerciseDraft;
    index: number;
    /** The fields to paint red, or nothing while the eye is off. Comes from the
        day's own errors, so it never flags something only the draft knows. */
    fault?: ExerciseFault;
    /** The routine is being read, not edited: the fields are locked and the
        buttons that add or drop rows are gone. */
    readOnly?: boolean;
    onChange: (patch: Partial<ExerciseDraft>) => void;
    onRemove: () => void;
    canRemove: boolean;
}) {
    const t = useT();
    const techniqueListId = useId();
    // Labels carry the exercise number too: a day holds several of these, and
    // "Min reps set 1" on its own would name four different inputs.
    const e = index + 1;

    function updateSet(setIndex: number, patch: Partial<SetDraft>) {
        onChange({
            sets: exercise.sets.map((set, i) =>
                i === setIndex ? { ...set, ...patch } : set
            ),
        });
    }

    // Anything at all wrong with this exercise, so the card's left rule — the
    // app's one ornament — can say so without repeating which field it is.
    const wrongAnywhere =
        !!fault && (fault.name || fault.sets.some((set) => set.min || set.max));

    return (
        // border-l-danger and border-line set different properties
        // (border-left-color vs border-color), so the left rule wins outright
        // and there is no emit-order race between the two.
        <div
            className={`${cardClass} space-y-3 ${
                wrongAnywhere ? 'border-l-danger' : ''
            }`}
        >
            <input
                value={exercise.name}
                readOnly={readOnly}
                onChange={(event) => onChange({ name: event.target.value })}
                aria-label={t('exercise.nameLabel', { e })}
                placeholder={t('exercise.namePlaceholder')}
                maxLength={NAME_MAX}
                className={`${
                    fault?.name ? wrongTitleInputClass : titleInputClass
                } display text-2xl`}
            />

            <div className="space-y-2">
                {exercise.sets.map((set, setIndex) => {
                    const wrong = fault?.sets[setIndex] ?? noFault;
                    return (
                        <div
                            key={setIndex}
                            className={`space-y-1.5 transition-colors md:border-l-4 md:pl-3 ${
                                wrong.min || wrong.max
                                    ? 'border-danger'
                                    : 'border-line'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2 md:hidden">
                                <p
                                    aria-hidden
                                    className="eyebrow text-pulse"
                                >
                                    {t('today.set', { n: setIndex + 1 })}
                                </p>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        disabled={exercise.sets.length === 1}
                                        onClick={() =>
                                            onChange({
                                                sets: exercise.sets.filter(
                                                    (_, i) => i !== setIndex
                                                ),
                                            })
                                        }
                                        aria-label={t('exercise.removeSet', {
                                            e,
                                            n: setIndex + 1,
                                        })}
                                        className={`${labelClass} hover:text-danger flex items-center gap-1.5 py-1 transition-colors disabled:opacity-30`}
                                    >
                                        <X
                                            size={14}
                                            aria-hidden
                                        />
                                        {t('exercise.removeSetShort')}
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                <span
                                    aria-hidden
                                    className="figure text-muted hidden w-4 shrink-0 text-lg md:block"
                                >
                                    {setIndex + 1}
                                </span>
                                <select
                                    value={set.mode}
                                    tabIndex={readOnly ? -1 : undefined}
                                    aria-readonly={readOnly}
                                    onChange={(event) =>
                                        updateSet(setIndex, {
                                            mode: event.target.value as RepMode,
                                        })
                                    }
                                    aria-label={t('exercise.repMode', {
                                        e,
                                        n: setIndex + 1,
                                    })}
                                    className={`${fieldClass} ${rowFieldClass} w-24 shrink-0 px-2 md:w-28 md:px-3 ${
                                        readOnly ? 'pointer-events-none' : ''
                                    }`}
                                >
                                    {REP_MODES.map((mode) => (
                                        <option
                                            key={mode}
                                            value={mode}
                                        >
                                            {t(`reps.${mode}`)}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min={REPS.min}
                                    max={REPS.max}
                                    value={set.repMin}
                                    readOnly={readOnly}
                                    onChange={(event) =>
                                        updateSet(setIndex, {
                                            repMin: event.target.value,
                                        })
                                    }
                                    placeholder={t('today.reps')}
                                    aria-label={t('exercise.repMin', {
                                        e,
                                        n: setIndex + 1,
                                    })}
                                    className={`${numberClass(wrong.min)} ${
                                        set.mode === 'amrap' ? unusedClass : ''
                                    }`}
                                />
                                <input
                                    type="number"
                                    min={REPS.min}
                                    max={REPS.max}
                                    value={set.repMax}
                                    readOnly={readOnly}
                                    onChange={(event) =>
                                        updateSet(setIndex, {
                                            repMax: event.target.value,
                                        })
                                    }
                                    placeholder={t('today.reps')}
                                    aria-label={t('exercise.repMax', {
                                        e,
                                        n: setIndex + 1,
                                    })}
                                    className={`${numberClass(wrong.max)} ${
                                        set.mode === 'range' ? '' : unusedClass
                                    }`}
                                />
                                {!readOnly && (
                                    <div className="hidden md:order-last md:block">
                                        <button
                                            type="button"
                                            disabled={
                                                exercise.sets.length === 1
                                            }
                                            onClick={() =>
                                                onChange({
                                                    sets: exercise.sets.filter(
                                                        (_, i) => i !== setIndex
                                                    ),
                                                })
                                            }
                                            aria-label={t(
                                                'exercise.removeSet',
                                                { e, n: setIndex + 1 }
                                            )}
                                            className={removeButtonClass}
                                        >
                                            <X
                                                size={14}
                                                aria-hidden
                                            />
                                        </button>
                                    </div>
                                )}
                                <input
                                    list={
                                        readOnly ? undefined : techniqueListId
                                    }
                                    value={set.technique}
                                    readOnly={readOnly}
                                    onChange={(event) =>
                                        updateSet(setIndex, {
                                            technique: event.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        'exercise.techniquePlaceholder'
                                    )}
                                    aria-label={t('exercise.technique', {
                                        e,
                                        n: setIndex + 1,
                                    })}
                                    className={`${fieldClass} ${rowFieldClass} min-w-40 basis-full md:min-w-0 md:flex-1 md:basis-auto`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <datalist id={techniqueListId}>
                <option value={t('technique.linear')} />
                <option value={t('technique.topset')} />
                <option value={t('technique.backoff')} />
            </datalist>

            {!readOnly && (
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        disabled={exercise.sets.length >= SETS.max}
                        onClick={() =>
                            onChange({ sets: [...exercise.sets, emptySet] })
                        }
                        aria-label={t('exercise.addSetLabel', { e })}
                        className={`${labelClass} hover:text-pulse flex items-center gap-1.5 py-1 transition-colors disabled:opacity-30`}
                    >
                        <Plus
                            size={14}
                            aria-hidden
                        />
                        {t('exercise.addSet')}
                    </button>
                    <button
                        type="button"
                        disabled={!canRemove}
                        onClick={onRemove}
                        aria-label={t('exercise.delete', { e })}
                        className={`${labelClass} hover:text-danger flex items-center gap-1.5 py-1 transition-colors disabled:opacity-30`}
                    >
                        <X
                            size={14}
                            aria-hidden
                        />
                        {t('exercise.removeShort')}
                    </button>
                </div>
            )}
        </div>
    );
}
