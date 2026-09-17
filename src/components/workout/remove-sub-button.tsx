'use client';

import { useT } from '@/i18n/use-t';
import { removeButtonClass } from '@/lib/ui';
import { X } from 'lucide-react';

/**
 * A drop or rest-pause row has one thing it can be told: go away. One option is
 * not a menu, so the row wears that option itself — same column and same target
 * as the working set's ⋯, one tap instead of two.
 */
export function RemoveSubButton({
    exerciseNumber,
    setLabel,
    onRemove,
}: {
    /** The exercise's number in the day, and the row's name inside it (`DS1`).
        A day holds several cards, so neither one alone names the button. */
    exerciseNumber: number;
    setLabel: string;
    onRemove: () => void;
}) {
    const t = useT();
    return (
        <button
            type="button"
            onClick={onRemove}
            aria-label={t('exercise.removeSet', {
                exercise: exerciseNumber,
                set: setLabel,
            })}
            title={t('exercise.removeSetShort')}
            className={removeButtonClass}
        >
            <X
                size={16}
                aria-hidden
            />
        </button>
    );
}
