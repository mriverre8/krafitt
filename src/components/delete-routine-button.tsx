'use client';

import { useT } from '@/i18n/use-t';
import { Trash } from 'lucide-react';
import { ActionButton } from './action-button';

/**
 * Deletes the whole routine, name and all. The routine page is the only place
 * that offers it, and it always asks first: a routine carries every session
 * logged against it, and none of that comes back.
 *
 * The action arrives already bound to its routine, so this stays a client
 * component the tests can render on its own.
 */
export function DeleteRoutineButton({
    name,
    onDelete,
}: {
    name: string;
    onDelete: () => Promise<unknown>;
}) {
    const t = useT();

    return (
        <ActionButton
            action={onDelete}
            confirm={t('routine.deleteConfirm', { name })}
            className="text-danger hover:text-danger/70 eyebrow flex shrink-0 items-center gap-1.5 transition-colors"
        >
            <Trash
                size={14}
                aria-hidden
            />
            {t('routine.delete')}
        </ActionButton>
    );
}
