'use client';

import { NAME_MAX } from '@/lib/constants';
import type { FormAction } from '@/lib/forms';
import { inputClass, primaryClass } from '@/lib/ui';
import { useT } from '@/i18n/use-t';
import { Plus } from 'lucide-react';
import { FormError } from '@/components/ui/form-error';
import { useActionState, useState } from 'react';

/** A workout is named and nothing else: it has no duration, and its one day
    is made along with it. */
export function CreateWorkoutForm({ action }: { action: FormAction }) {
    const t = useT();
    const [state, formAction, pending] = useActionState(action, {});
    const [name, setName] = useState('');

    return (
        <form
            action={formAction}
            className="border-line border-l-volt bg-surface space-y-4 rounded-md border border-l-[3px] p-5"
        >
            <h2 className="display text-4xl">{t('workouts.newTitle')}</h2>
            <input
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-label={t('routines.nameLabel')}
                placeholder={t('workouts.namePlaceholder')}
                required
                maxLength={NAME_MAX}
                className={inputClass}
            />
            <FormError message={state.error} />
            <button
                type="submit"
                disabled={pending || name.trim() === ''}
                className={`${primaryClass} flex w-full items-center justify-center gap-2`}
            >
                <Plus
                    size={16}
                    aria-hidden
                />
                {t('workouts.create')}
            </button>
        </form>
    );
}
