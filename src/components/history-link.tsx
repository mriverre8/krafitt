'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass } from '@/lib/ui';
import { History } from 'lucide-react';
import Link from 'next/link';

/**
 * The way into a routine's history. Two entry points share it — the day you are
 * training and the routine's own card — so the two can never drift apart, and
 * both sit in the same place: on the line that already reports progress.
 *
 * Set like the "set active" button it stands next to in the list: outlined, not
 * filled. Volt is for the routine you are training, never for a link out of it.
 */
export function HistoryLink({
    routineId,
    name,
}: {
    routineId: string;
    /** Given in a list, where a column of identical "History" links leaves a
        screen reader with no way to tell one card from the next. */
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
