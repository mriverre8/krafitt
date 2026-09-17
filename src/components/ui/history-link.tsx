'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass } from '@/lib/ui';
import { History } from 'lucide-react';
import Link from 'next/link';

export function HistoryLink({
    routineId,
    name,
}: {
    routineId: string;
    name?: string;
}) {
    const t = useT();

    return (
        <Link
            href={`/routines/${routineId}/progress`}
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
