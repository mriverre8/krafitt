'use client';

import { useT } from '@/i18n/use-t';
import { NAME_MAX } from '@/lib/constants';
import type { FormAction } from '@/lib/forms';
import { ghostClass, inputClass, primaryClass } from '@/lib/ui';
import { Modal } from '@/components/modal/modal';
import { FormError } from '@/components/ui/form-error';
import { useActionState, useEffect, useState } from 'react';

export type RenameRoutineModalProps = {
    /** The name as it stands, for the field to open on. */
    name: string;
    /** Already bound to its routine or day, so this knows nothing but the new
        name. */
    rename: FormAction;
    /** What is being renamed, as the dialog's heading. */
    title: string;
    /** Accessible name for the field, since the heading is not one. */
    label: string;
    /** Supplied by the ModalHost. */
    onClose: () => void;
};

/**
 * A name the page shows as a heading rather than as a field — the routine's,
 * or one of its days'. Asked for here instead, from the options menu.
 */
export function RenameRoutineModal({
    name,
    rename,
    title,
    label,
    onClose,
}: RenameRoutineModalProps) {
    const t = useT();
    const [state, formAction, pending] = useActionState(rename, {});
    // Controlled, so Save can tell a real rename from the name already stored.
    const [value, setValue] = useState(name);
    const renamed = value.trim() !== '' && value.trim() !== name;

    // Closing on `ok` is what dismisses the dialog once the name is stored —
    // every other way out of it is a cancel.
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
                        {t('common.save')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
