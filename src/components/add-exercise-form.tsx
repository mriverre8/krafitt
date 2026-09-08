'use client';

import { useT } from '@/i18n/use-t';
import { NAME_MAX, REPS, SETS } from '@/lib/constants';
import type { FormAction } from '@/lib/forms';
import { REP_MODES, type RepMode } from '@/lib/reps';
import { fieldClass, inputClass, labelClass, primaryClass } from '@/lib/ui';
import { Plus, X } from 'lucide-react';
import { useActionState, useId, useState } from 'react';
import { FormError } from './form-error';

type SetDraft = {
    mode: RepMode;
    repMin: string;
    repMax: string;
    technique: string;
};

const emptySet: SetDraft = {
    mode: 'range',
    repMin: '',
    repMax: '',
    technique: '',
};

/** Numbers stay narrow, the technique takes whatever room is left. */
const numberClass = `${fieldClass} w-16 shrink-0 px-1 text-center md:w-20 md:px-3`;

/** A field the mode does not need: gone on a phone, an empty slot from md up,
    where keeping the columns aligned across rows is worth the space. */
const unusedClass = 'hidden md:invisible md:block';

export function AddExerciseForm({
    action,
    workoutId,
}: {
    action: FormAction;
    workoutId: string;
}) {
    const t = useT();
    const [state, formAction, pending] = useActionState(action, {});
    const techniqueListId = useId();
    // Every field is controlled, so a rejected submission keeps what the user
    // typed: React resets an uncontrolled form once the action settles.
    const [name, setName] = useState('');
    // Sets are added one by one: each carries its own reps and technique.
    const [sets, setSets] = useState<SetDraft[]>([emptySet]);

    // Adjusting state while rendering rather than in an effect: the reset is
    // derived from the action's answer, not synchronised with anything outside.
    const [lastState, setLastState] = useState(state);
    if (state !== lastState) {
        setLastState(state);
        if (state.ok) {
            setName('');
            setSets([emptySet]);
        }
    }

    function update(index: number, patch: Partial<SetDraft>) {
        setSets((current) =>
            current.map((set, i) => (i === index ? { ...set, ...patch } : set))
        );
    }

    return (
        <form
            action={formAction}
            className="space-y-3"
        >
            <input
                type="hidden"
                name="workoutId"
                value={workoutId}
            />
            <input
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-label={t('exercise.nameLabel')}
                placeholder={t('exercise.namePlaceholder')}
                maxLength={NAME_MAX}
                className={`${inputClass} display text-xl`}
            />

            <div className="space-y-2">
                {sets.map((set, index) => (
                    // Wraps on a phone (technique drops to its own line) and sits
                    // on a single line from md up, where there is room for it.
                    <div
                        key={index}
                        className="flex flex-wrap items-center gap-1.5 md:gap-2"
                    >
                        <span className="figure text-muted w-4 shrink-0 text-lg">
                            {index + 1}
                        </span>
                        <select
                            name="repMode"
                            value={set.mode}
                            onChange={(event) =>
                                update(index, {
                                    mode: event.target.value as RepMode,
                                })
                            }
                            aria-label={t('exercise.repMode', { n: index + 1 })}
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
                        {/* Always submitted, so the repeated fields stay aligned
                            row by row; the server reads only what the mode needs. */}
                        <input
                            name="repMin"
                            type="number"
                            min={REPS.min}
                            max={REPS.max}
                            value={set.repMin}
                            onChange={(event) =>
                                update(index, { repMin: event.target.value })
                            }
                            placeholder={t('today.reps')}
                            aria-label={t('exercise.repMin', { n: index + 1 })}
                            className={`${numberClass} ${
                                set.mode === 'amrap' ? unusedClass : ''
                            }`}
                        />
                        <input
                            name="repMax"
                            type="number"
                            min={REPS.min}
                            max={REPS.max}
                            value={set.repMax}
                            onChange={(event) =>
                                update(index, { repMax: event.target.value })
                            }
                            placeholder={t('today.reps')}
                            aria-label={t('exercise.repMax', { n: index + 1 })}
                            className={`${numberClass} ${
                                set.mode === 'range' ? '' : unusedClass
                            }`}
                        />
                        <button
                            type="button"
                            // The exercise needs at least one set, so the last row stays.
                            disabled={sets.length === 1}
                            onClick={() =>
                                setSets((current) =>
                                    current.filter((_, i) => i !== index)
                                )
                            }
                            aria-label={t('exercise.removeSet', {
                                n: index + 1,
                            })}
                            className="text-muted hover:text-danger shrink-0 rounded-lg p-1.5 transition-colors disabled:opacity-30 md:order-last"
                        >
                            <X
                                size={14}
                                aria-hidden
                            />
                        </button>
                        <input
                            name="technique"
                            list={techniqueListId}
                            value={set.technique}
                            onChange={(event) =>
                                update(index, { technique: event.target.value })
                            }
                            placeholder={t('exercise.techniquePlaceholder')}
                            aria-label={t('exercise.technique', {
                                n: index + 1,
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
                disabled={sets.length >= SETS.max}
                onClick={() => setSets((current) => [...current, emptySet])}
                className={`${labelClass} hover:text-blaze flex items-center gap-1.5 py-1 transition-colors disabled:opacity-30`}
            >
                <Plus
                    size={14}
                    aria-hidden
                />
                {t('exercise.addSet')}
            </button>

            <FormError message={state.error} />
            <button
                type="submit"
                disabled={pending}
                className={`${primaryClass} flex w-full items-center justify-center gap-2 md:ml-auto md:w-fit`}
            >
                <Plus
                    size={16}
                    aria-hidden
                />
                {t('exercise.add')}
            </button>
        </form>
    );
}
