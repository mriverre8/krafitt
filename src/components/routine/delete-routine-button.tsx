'use client';

import { useT } from '@/i18n/use-t';
import type { RoutineKind } from '@/lib/progress';
import { Trash } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';

export function DeleteRoutineButton({
    name,
    onDelete,
    className,
    kind = 'routine',
}: {
    name: string;
    onDelete: () => Promise<unknown>;
    className?: string;
    /** Only the words change: what is lost is said differently for each. */
    kind?: RoutineKind;
}) {
    const t = useT();

    return (
        <ActionButton
            action={onDelete}
            confirm={{
                title: t(`${kind}.delete`),
                message: t(`${kind}.deleteConfirm`, { name }),
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
            {t(`${kind}.delete`)}
        </ActionButton>
    );
}
