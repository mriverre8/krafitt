'use client';

import { NAME_MAX, WEEKS } from '@/lib/constants';
import type { FormAction } from '@/lib/forms';
import { ghostClass, inputClass, labelClass, primaryClass } from '@/lib/ui';
import { useT } from '@/i18n/use-t';
import { Infinity as InfinityIcon, Plus } from 'lucide-react';
import { FormError } from '@/components/ui/form-error';
import { useActionState, useState } from 'react';

export function CreateRoutineForm({ action }: { action: FormAction }) {
    const t = useT();
    const [state, formAction, pending] = useActionState(action, {});
    const [openEnded, setOpenEnded] = useState(false);
    const [name, setName] = useState('');
    const [weeks, setWeeks] = useState('');

    // Whether the button is live, read off the two fields rather than off the
    // form's own validity: `checkValidity` answers for the DOM as it stands,
    // which is one render behind a clipped value or a side just switched. The
    // browser still holds the same rules through the attributes below.
    const typedWeeks = Number(weeks);
    const valid =
        name.trim() !== '' &&
        (openEnded ||
            (weeks !== '' &&
                typedWeeks >= WEEKS.min &&
                typedWeeks <= WEEKS.max));

    return (
        <form
            action={formAction}
            className="border-line border-l-volt bg-surface space-y-4 rounded-md border border-l-[3px] p-5"
        >
            <h2 className="display text-4xl">{t('routines.newTitle')}</h2>
            <input
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-label={t('routines.nameLabel')}
                placeholder={t('routines.namePlaceholder')}
                required
                maxLength={NAME_MAX}
                className={inputClass}
            />
            <fieldset>
                <legend className={`${labelClass} mb-1`}>
                    {t('routines.durationTitle')}
                </legend>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Two halves of one choice, so each says whether it is
                        the one picked rather than leaving it to the colour. */}
                    <button
                        type="button"
                        aria-pressed={openEnded}
                        onClick={() => setOpenEnded(true)}
                        className={`${ghostClass} inline-flex shrink-0 items-center gap-1.5 ${
                            openEnded ? 'border-pulse text-pulse' : ''
                        }`}
                    >
                        <InfinityIcon
                            size={14}
                            aria-hidden
                        />
                        {t('routines.openEnded')}
                    </button>
                    <button
                        type="button"
                        aria-pressed={!openEnded}
                        onClick={() => setOpenEnded(false)}
                        className={`${ghostClass} shrink-0 ${
                            openEnded ? '' : 'border-pulse text-pulse'
                        }`}
                    >
                        {t('routines.fixed')}
                    </button>
                    <input
                        name="durationWeeks"
                        type="number"
                        inputMode="numeric"
                        aria-label={t('routines.duration')}
                        placeholder={t('routines.durationPlaceholder', {
                            min: WEEKS.min,
                            max: WEEKS.max,
                        })}
                        required={!openEnded}
                        disabled={openEnded}
                        min={WEEKS.min}
                        max={WEEKS.max}
                        value={weeks}
                        onChange={(event) =>
                            setWeeks(event.target.value.slice(0, WEEKS.digits))
                        }
                        className={`${inputClass} w-20 flex-1`}
                    />
                </div>
            </fieldset>
            {/* A disabled field sends nothing, so open-ended is said outright
                rather than read off an absent value. */}
            <input
                type="hidden"
                name="indefinite"
                value={openEnded ? 'on' : ''}
            />
            <FormError message={state.error} />
            <button
                type="submit"
                disabled={pending || !valid}
                className={`${primaryClass} flex w-full items-center justify-center gap-2`}
            >
                <Plus
                    size={16}
                    aria-hidden
                />
                {t('routines.create')}
            </button>
        </form>
    );
}
