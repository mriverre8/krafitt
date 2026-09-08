'use client';

import { NAME_MAX, WEEKS } from '@/lib/constants';
import type { FormAction } from '@/lib/forms';
import { inputClass, labelClass, primaryClass } from '@/lib/ui';
import { useT } from '@/i18n/use-t';
import { Plus } from 'lucide-react';
import { FormError } from './form-error';
import { useActionState, useState } from 'react';

export function CreateRoutineForm({ action }: { action: FormAction }) {
    const t = useT();
    const [state, formAction, pending] = useActionState(action, {});
    // One validity check covers both fields, including the duration range.
    const [valid, setValid] = useState(false);

    return (
        <form
            action={formAction}
            onInput={(event) => setValid(event.currentTarget.checkValidity())}
            className="border-line bg-surface space-y-3 rounded-2xl border p-4"
        >
            <h2 className="display text-3xl">{t('routines.newTitle')}</h2>
            <input
                name="name"
                aria-label={t('routines.nameLabel')}
                placeholder={t('routines.namePlaceholder')}
                required
                maxLength={NAME_MAX}
                className={inputClass}
            />
            <label className={`block ${labelClass}`}>
                {t('routines.duration')}
                <input
                    name="durationWeeks"
                    type="number"
                    required
                    min={WEEKS.min}
                    max={WEEKS.max}
                    className={`${inputClass} mt-1`}
                />
            </label>
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
