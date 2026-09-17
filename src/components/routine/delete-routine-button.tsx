'use client';

import { useT } from '@/i18n/use-t';
import { Trash } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';

export function DeleteRoutineButton({
    name,
    onDelete,
    className,
}: {
    name: string;
    onDelete: () => Promise<unknown>;
    className?: string;
}) {
    const t = useT();

    return (
        <ActionButton
            action={onDelete}
            confirm={{
                title: t('routine.delete'),
                message: t('routine.deleteConfirm', { name }),
            }}
            className={
                className ??
                'text-danger hover:text-danger/70 eyebrow flex shrink-0 items-center gap-1.5 transition-colors'
            }
        >
            <Trash
                size={14}
                aria-hidden
            />
            {t('routine.delete')}
        </ActionButton>
    );
}
