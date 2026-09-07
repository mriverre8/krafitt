'use client';

import type { FormAction } from '@/lib/forms';
import { inputClass, labelClass, primaryClass } from '@/lib/ui';
import { useT } from '@/i18n/use-t';
import { Plus } from 'lucide-react';
import { FormError } from './form-error';
import { useActionState } from 'react';

export function CreateRoutineForm({ action }: { action: FormAction }) {
    const t = useT();
    const [state, formAction, pending] = useActionState(action, {});

    return (
        <form
            action={formAction}
            className="border-line bg-surface space-y-3 rounded-2xl border p-4"
        >
            <h2 className="display text-3xl">{t('routines.newTitle')}</h2>
            <input
                name="name"
                aria-label={t('routines.nameLabel')}
                placeholder={t('routines.namePlaceholder')}
                className={inputClass}
            />
            <label className={`block ${labelClass}`}>
                {t('routines.duration')}
                <input
                    name="durationWeeks"
                    type="number"
                    min="1"
                    max="52"
                    defaultValue={8}
                    className={`${inputClass} mt-1`}
                />
            </label>
            <FormError message={state.error} />
            <button
                type="submit"
                disabled={pending}
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
