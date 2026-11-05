'use client';

import { useT } from '@/i18n/use-t';
import { ghostClass, primaryClass, stickyBarClass } from '@/lib/ui';
import { Save, Undo2 } from 'lucide-react';

/**
 * Undo and Save, stuck to the bottom of the screen so they follow you down the
 * day instead of waiting under the last card.
 */
export function SaveBar({
    pending,
    onUndo,
    onSave,
}: {
    pending: boolean;
    onUndo: () => void;
    onSave: () => void;
}) {
    const t = useT();
    return (
        <div
            data-chrome="bottom"
            className={stickyBarClass}
        >
            <button
                type="button"
                disabled={pending}
                onClick={onUndo}
                aria-label={t('exercise.undo')}
                className={`${ghostClass} flex flex-1 items-center justify-center gap-1.5`}
            >
                <Undo2
                    size={14}
                    aria-hidden
                />
                <span className="md:hidden">{t('exercise.undoShort')}</span>
                <span className="hidden md:inline">{t('exercise.undo')}</span>
            </button>
            <button
                type="button"
                disabled={pending}
                onClick={onSave}
                className={`${primaryClass} flex flex-2 items-center justify-center gap-2`}
            >
                <Save
                    size={16}
                    aria-hidden
                />
                {t('exercise.saveChanges')}
            </button>
        </div>
    );
}
