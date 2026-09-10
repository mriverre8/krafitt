'use client';

import { useT } from '@/i18n/use-t';
import { cardClass } from '@/lib/ui';
import type { ReactNode } from 'react';

/**
 * One placeholder bar. Its size is the caller's business: a skeleton exists to
 * hold exactly the space the real thing will take, so nothing jumps when the
 * content lands. `line` rather than `surface2` because a bar has to read both on
 * the page background and inside a card, and only one of the two greys does.
 */
export function Bar({ className = '' }: { className?: string }) {
    return <div className={`bg-line animate-pulse rounded-xs ${className}`} />;
}

/**
 * The shell every loading.tsx wears. The bars themselves say nothing worth
 * announcing, so they are hidden and the busy status is the whole message.
 * The pulse stands itself down under prefers-reduced-motion (globals.css).
 */
export function Skeleton({ children }: { children: ReactNode }) {
    const t = useT();

    return (
        <div
            role="status"
            aria-busy="true"
        >
            <span className="sr-only">{t('common.loading')}</span>
            <div
                aria-hidden
                className="space-y-6"
            >
                {children}
            </div>
        </div>
    );
}

/** A routine as both lists draw it: name, meta, badge, ladder, count. */
export function RoutineCardSkeleton({ accent = false }: { accent?: boolean }) {
    return (
        <div
            className={`${cardClass} ${
                accent ? 'border-l-volt border-l-[6px]' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                    <Bar className="h-7 w-2/3" />
                    <Bar className="h-3 w-1/3" />
                </div>
                <Bar className="h-7 w-24 shrink-0" />
            </div>
            <div className="mt-5 space-y-2">
                <Bar className="h-2 w-full" />
                <Bar className="h-4 w-28" />
            </div>
        </div>
    );
}
