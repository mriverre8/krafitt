'use client';

import { useT } from '@/i18n/use-t';
import { cardClass, primaryClass } from '@/lib/ui';
import { EditModeContext } from '@/components/routine/edit-mode';
import { useContext } from 'react';

/**
 * What a routine with no days shows instead of its rack: the one move that
 * fills it. Pressing the button is pressing Edit, so the day form it opens is
 * the same one the options menu leads to.
 *
 * Hides itself in edit mode — that form is already on screen by then — and the
 * page drops it for good once a day exists.
 */
export function EmptyRoutine() {
    const t = useT();
    const { editing, toggle } = useContext(EditModeContext);
    if (editing) return null;

    return (
        <div className={cardClass}>
            <h2 className="display text-3xl">{t('routine.emptyTitle')}</h2>
            <p className="text-muted mt-2 text-sm md:text-base">
                {t('routine.emptyBody')}
            </p>
            <button
                type="button"
                onClick={toggle}
                className={`${primaryClass} mt-5`}
            >
                {t('routine.build')}
            </button>
        </div>
    );
}
