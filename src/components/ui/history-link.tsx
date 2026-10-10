'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass } from '@/lib/ui';
import { History } from 'lucide-react';
import Link from 'next/link';

export function HistoryLink({
    routineId,
    name,
    day,
}: {
    routineId: string;
    name?: string;
    /** The day tab the history opens on, counted from 0. */
    day?: number;
}) {
    const t = useT();
    const query = day === undefined ? '' : `?currentDay=${day}`;

    return (
        <Link
            href={`/progress/${routineId}${query}`}
            aria-label={name ? t('progress.linkLabel', { name }) : undefined}
            className={`${badgeClass} lift border-line text-muted hover:border-pulse hover:text-pulse shrink-0 border-2`}
        >
            <History
                size={13}
                aria-hidden
            />
            {t('progress.link')}
        </Link>
    );
}
