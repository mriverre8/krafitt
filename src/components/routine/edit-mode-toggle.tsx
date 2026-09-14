'use client';

import { useT } from '@/i18n/use-t';
import { useEditModeToggle } from '@/lib/edit-mode';
import { labelClass } from '@/lib/ui';
import { Check, Pencil } from 'lucide-react';

/** Set like the delete link it shares a line with, so the two read as one pair
    of routine-level moves — pulse rather than danger: this one breaks nothing
    that was saved. */
export function EditModeToggle() {
    const t = useT();
    const { editing, toggle } = useEditModeToggle();
    const label = t(editing ? 'routine.doneEditing' : 'routine.edit');

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={editing}
            className={`${labelClass} hover:text-pulse flex shrink-0 items-center gap-1.5 py-1 transition-colors`}
        >
            {editing ? (
                <Check
                    size={14}
                    aria-hidden
                />
            ) : (
                <Pencil
                    size={14}
                    aria-hidden
                />
            )}
            {label}
        </button>
    );
}
