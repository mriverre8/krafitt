'use client';

import { useT } from '@/i18n/use-t';
import type { FormAction } from '@/lib/forms';
import { cardClass, primaryClass } from '@/lib/ui';
import { showModal } from '@/store/modal';
import { EditModeContext } from '@/components/routine/edit-mode';
import { useContext } from 'react';

/**
 * What a routine with no days shows instead of its rack, and it is a different
 * card on each side of the edit.
 *
 * Out of edit mode it only describes: what a routine is made of, and what will
 * be true once it is. It presses nothing, because the way in already exists —
 * Edit, in the routine's own options — and a second door on the card would be
 * the same door drawn twice.
 *
 * Inside, it is the only place a first day can come from, so there it carries
 * the button. With no days there is no rack, and the + that adds one lives at
 * the end of that rack; until the rack exists, this card is the rack.
 *
 * Heading, body and button all hang off `asking` rather than off `editing`, so
 * the words and what is there to press can never disagree: a routine that
 * cannot take days has no action to offer, and the card goes back to
 * describing.
 *
 * The page drops this for good once a day exists.
 */
export function EmptyRoutine({ addDay }: { addDay?: FormAction }) {
    const t = useT();
    const { editing } = useContext(EditModeContext);
    // The action itself rather than a flag, so the branches below narrow it.
    const asking = editing ? addDay : undefined;

    return (
        <div className={cardClass}>
            <h2 className="display text-3xl">
                {t(asking ? 'routine.emptyTitleEditing' : 'routine.emptyTitle')}
            </h2>
            <p className="text-muted mt-2 text-sm md:text-base">
                {t(asking ? 'routine.emptyBodyEditing' : 'routine.emptyBody')}
            </p>
            {asking && (
                <button
                    type="button"
                    onClick={() =>
                        showModal('rename', {
                            name: '',
                            rename: asking,
                            title: t('routine.addDayTitle'),
                            label: t('routine.dayLabel'),
                            placeholder: t('routine.dayPlaceholder'),
                            confirmLabel: t('common.add'),
                        })
                    }
                    className={`${primaryClass} mt-5`}
                >
                    {t('routine.addDayTitle')}
                </button>
            )}
        </div>
    );
}
