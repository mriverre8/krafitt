'use client';

import { useT } from '@/i18n/use-t';
import { ghostClass } from '@/lib/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

/** A step is a link until there is nowhere to step to, and then it is the same
    shape greyed out: a row that keeps its height either way. */
function Step({
    href,
    disabled,
    children,
}: {
    href: string;
    disabled: boolean;
    children: ReactNode;
}) {
    const className = `${ghostClass} inline-flex items-center gap-1.5`;

    return disabled ? (
        <span
            className={`${className} opacity-40`}
            aria-hidden
        >
            {children}
        </span>
    ) : (
        <Link
            href={href}
            scroll={false}
            className={className}
        >
            {children}
        </Link>
    );
}

/**
 * Previous/next over a list that only grows. Links rather than state: the page
 * lives in the URL, so a reload, a back button or a shared link all land where
 * the user was. `scroll={false}` because the pager is usually the last thing on
 * screen — jumping to the top would throw it out from under the thumb.
 *
 * ponytail: one step at a time, no numbered pages. Add them when a list is deep
 * enough that stepping to it stops being reasonable.
 */
export function Pagination({
    page,
    totalPages,
    param = 'page',
}: {
    page: number;
    totalPages: number;
    /** Which query param carries the page, for a screen that pages more than
        one list. The href is query-only, so it keeps the path it is on. */
    param?: string;
}) {
    const t = useT();
    if (totalPages <= 1) return null;

    return (
        <nav
            aria-label={t('pagination.label')}
            className="flex items-center justify-between gap-3"
        >
            <Step
                href={`?${param}=${page - 1}`}
                disabled={page === 1}
            >
                <ChevronLeft
                    size={14}
                    aria-hidden
                />
                {t('pagination.previous')}
            </Step>

            <span
                className="figure text-muted text-sm"
                aria-live="polite"
            >
                {t('pagination.status', { page, total: totalPages })}
            </span>

            <Step
                href={`?${param}=${page + 1}`}
                disabled={page === totalPages}
            >
                {t('pagination.next')}
                <ChevronRight
                    size={14}
                    aria-hidden
                />
            </Step>
        </nav>
    );
}
