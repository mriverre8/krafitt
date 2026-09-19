'use client';

import { useT } from '@/i18n/use-t';
import { WEEKS } from '@/lib/constants';
import type { FormAction } from '@/lib/forms';
import { ghostClass, inputClass, primaryClass } from '@/lib/ui';
import { Modal } from '@/components/modal/modal';
import { FormError } from '@/components/ui/form-error';
import { useActionState, useEffect, useState } from 'react';

export type DurationModalProps = {
    durationWeeks: number;
    min: number;
    save: FormAction;
    onClose: () => void;
};

export function DurationModal({
    durationWeeks,
    min,
    save,
    onClose,
}: DurationModalProps) {
    const t = useT();
    const [state, formAction, pending] = useActionState(save, {});
    const [value, setValue] = useState(String(durationWeeks));

    const weeks = Number(value);
    const changed =
        Number.isInteger(weeks) &&
        weeks !== durationWeeks &&
        weeks >= min &&
        weeks <= WEEKS.max;

    useEffect(() => {
        if (state.ok) onClose();
    }, [state.ok, onClose]);

    return (
        <Modal
            title={t('routine.duration')}
            onClose={onClose}
        >
            <form
                action={formAction}
                className="space-y-4"
            >
                <p className="text-muted text-sm">
                    {t('routine.durationHint', { min, max: WEEKS.max })}
                </p>
                <input
                    name="durationWeeks"
                    type="number"
                    inputMode="numeric"
                    value={value}
                    onChange={(event) =>
                        setValue(event.target.value.slice(0, WEEKS.digits))
                    }
                    aria-label={t('routines.duration')}
                    required
                    min={min}
                    max={WEEKS.max}
                    autoFocus
                    className={inputClass}
                />
                <FormError message={state.error} />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className={ghostClass}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={pending || !changed}
                        className={`${primaryClass} py-2.5 text-sm`}
                    >
                        {t('common.save')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
