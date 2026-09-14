'use client';

import { useT } from '@/i18n/use-t';
import { EditModeContext, noDirtyDays } from '@/lib/edit-mode';
import { showModal } from '@/store/modal';
import { useCallback, useState, type ReactNode } from 'react';

/**
 * Holds the routine's edit mode and the set of days with unsaved drafts.
 *
 * Leaving edit mode throws those drafts away, having asked first, so what is on
 * screen in read mode is what the database holds and nothing else. The days
 * keep their own drafts — this only knows which ones are dirty, and bumps
 * `discarded` to tell them all to start over.
 */
export function EditModeProvider({ children }: { children: ReactNode }) {
    const t = useT();
    const [editing, setEditing] = useState(false);
    const [discarded, setDiscarded] = useState(0);
    const [dirtyDays, setDirtyDays] =
        useState<ReadonlySet<string>>(noDirtyDays);

    // Stable, so the days' effects fire on their own dirtiness and nothing else.
    // Handing back the same set when the answer has not changed is what stops a
    // day's own re-render from feeding straight back into its effect.
    const setDirty = useCallback((id: string, isDirty: boolean) => {
        setDirtyDays((current) => {
            if (current.has(id) === isDirty) return current;
            const next = new Set(current);
            if (isDirty) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    function leaveEditing() {
        setDirtyDays(noDirtyDays);
        setDiscarded((n) => n + 1);
        setEditing(false);
    }

    function toggle() {
        if (!editing) return setEditing(true);
        if (dirtyDays.size > 0)
            return showModal('confirm', {
                title: t('routine.discardTitle'),
                message: t('routine.discardConfirm'),
                confirmLabel: t('routine.discard'),
                onConfirm: leaveEditing,
            });
        leaveEditing();
    }

    return (
        <EditModeContext
            value={{ editing, toggle, discarded, dirtyDays, setDirty }}
        >
            {children}
        </EditModeContext>
    );
}
