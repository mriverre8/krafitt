'use client';

import { useT } from '@/i18n/use-t';
import { NAME_MAX, REPS, SETS } from '@/lib/constants';
import { isRepMode, REP_MODES, type RepMode } from '@/lib/reps';
import { fieldClass, inputClass, labelClass } from '@/lib/ui';
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

/** Numbers stay narrow, the technique takes whatever room is left. */
const numberClass = `${fieldClass} w-16 shrink-0 px-1 text-center md:w-20 md:px-3`;

/** A field the mode does not need: gone on a phone, an empty slot from md up,
    where keeping the columns aligned across rows is worth the space. */
const unusedClass = 'hidden md:invisible md:block';

/**
 * One exercise of the day. Holds no state of its own: the whole day is a single
 * form, and its draft lives in the editor above so one Save covers all of them.
 * Every field can be left blank — the routine is validated as a whole before it
 * can be activated.
 */
export function ExerciseFields({
    exercise,
    index,
    onChange,
    onRemove,
    canRemove,
}: {
    exercise: ExerciseDraft;
    index: number;
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

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <input
                    value={exercise.name}
                    onChange={(event) => onChange({ name: event.target.value })}
                    aria-label={t('exercise.nameLabel', { e })}
                    placeholder={t('exercise.namePlaceholder')}
                    maxLength={NAME_MAX}
                    className={`${inputClass} display text-xl`}
                />
                <button
                    type="button"
                    // The day needs at least one exercise, so the last one stays.
                    disabled={!canRemove}
                    onClick={onRemove}
                    aria-label={t('exercise.delete', { e })}
                    className="text-muted hover:text-danger shrink-0 rounded-md p-2 transition-colors disabled:opacity-30"
                >
                    <X
                        size={16}
                        aria-hidden
                    />
                </button>
            </div>

            <div className="space-y-2">
                {exercise.sets.map((set, setIndex) => (
                    // Wraps on a phone (technique drops to its own line) and sits
                    // on a single line from md up, where there is room for it.
                    <div
                        key={setIndex}
                        className="flex flex-wrap items-center gap-1.5 md:gap-2"
                    >
                        <span className="figure text-muted w-4 shrink-0 text-lg">
                            {setIndex + 1}
                        </span>
                        <select
                            value={set.mode}
                            onChange={(event) =>
                                updateSet(setIndex, {
                                    mode: event.target.value as RepMode,
                                })
                            }
                            aria-label={t('exercise.repMode', {
                                e,
                                n: setIndex + 1,
                            })}
                            className={`${fieldClass} w-24 shrink-0 px-2 md:w-28 md:px-3`}
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
                        {/* Both number fields are always rendered, so the columns
                            stay aligned row by row; the mode says which one counts. */}
                        <input
                            type="number"
                            min={REPS.min}
                            max={REPS.max}
                            value={set.repMin}
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
                            className={`${numberClass} ${
                                set.mode === 'amrap' ? unusedClass : ''
                            }`}
                        />
                        <input
                            type="number"
                            min={REPS.min}
                            max={REPS.max}
                            value={set.repMax}
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
                            className={`${numberClass} ${
                                set.mode === 'range' ? '' : unusedClass
                            }`}
                        />
                        <button
                            type="button"
                            // The exercise needs at least one set, so the last row stays.
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
                            className="text-muted hover:text-danger shrink-0 rounded-lg p-1.5 transition-colors disabled:opacity-30 md:order-last"
                        >
                            <X
                                size={14}
                                aria-hidden
                            />
                        </button>
                        <input
                            list={techniqueListId}
                            value={set.technique}
                            onChange={(event) =>
                                updateSet(setIndex, {
                                    technique: event.target.value,
                                })
                            }
                            placeholder={t('exercise.techniquePlaceholder')}
                            aria-label={t('exercise.technique', {
                                e,
                                n: setIndex + 1,
                            })}
                            className={`${fieldClass} min-w-40 basis-full md:min-w-0 md:flex-1 md:basis-auto`}
                        />
                    </div>
                ))}
            </div>
            <datalist id={techniqueListId}>
                <option value={t('technique.linear')} />
                <option value={t('technique.topset')} />
                <option value={t('technique.backoff')} />
                <option value={t('technique.dropset')} />
            </datalist>

            <button
                type="button"
                disabled={exercise.sets.length >= SETS.max}
                onClick={() => onChange({ sets: [...exercise.sets, emptySet] })}
                aria-label={t('exercise.addSetLabel', { e })}
                className={`${labelClass} hover:text-pulse flex items-center gap-1.5 py-1 transition-colors disabled:opacity-30`}
            >
                <Plus
                    size={14}
                    aria-hidden
                />
                {t('exercise.addSet')}
            </button>
        </div>
    );
}
