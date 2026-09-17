'use client';

import { useT } from '@/i18n/use-t';
import { ghostClass } from '@/lib/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

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

export function Pagination({
    page,
    totalPages,
    param = 'page',
}: {
    page: number;
    totalPages: number;
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
