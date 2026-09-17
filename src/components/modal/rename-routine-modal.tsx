'use client';

import { useT } from '@/i18n/use-t';
import { NAME_MAX } from '@/lib/constants';
import type { FormAction } from '@/lib/forms';
import { ghostClass, inputClass, primaryClass } from '@/lib/ui';
import { Modal } from '@/components/modal/modal';
import { FormError } from '@/components/ui/form-error';
import { useActionState, useEffect, useState } from 'react';

export type RenameRoutineModalProps = {
    name: string;
    rename: FormAction;
    title: string;
    label: string;
    placeholder?: string;
    confirmLabel?: string;
    onClose: () => void;
};

export function RenameRoutineModal({
    name,
    rename,
    title,
    label,
    placeholder,
    confirmLabel,
    onClose,
}: RenameRoutineModalProps) {
    const t = useT();
    const [state, formAction, pending] = useActionState(rename, {});
    const [value, setValue] = useState(name);
    const renamed = value.trim() !== '' && value.trim() !== name;

    useEffect(() => {
        if (state.ok) onClose();
    }, [state.ok, onClose]);

    return (
        <Modal
            title={title}
            onClose={onClose}
        >
            <form
                action={formAction}
                className="space-y-4"
            >
                <input
                    name="name"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    aria-label={label}
                    placeholder={placeholder}
                    required
                    maxLength={NAME_MAX}
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
                        disabled={pending || !renamed}
                        className={`${primaryClass} py-2.5 text-sm`}
                    >
                        {confirmLabel ?? t('common.save')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
