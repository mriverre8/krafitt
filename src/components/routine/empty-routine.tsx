'use client';

import { useT } from '@/i18n/use-t';
import type { FormAction } from '@/lib/forms';
import { cardClass, primaryClass } from '@/lib/ui';
import { showModal } from '@/store/modal';
import { EditModeContext } from '@/components/routine/edit-mode';
import { useContext } from 'react';

export function EmptyRoutine({ addDay }: { addDay?: FormAction }) {
    const t = useT();
    const { editing } = useContext(EditModeContext);
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
