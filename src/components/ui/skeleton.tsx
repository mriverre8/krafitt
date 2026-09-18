'use client';

import { useT } from '@/i18n/use-t';
import { cardClass } from '@/lib/ui';
import type { ReactNode } from 'react';

export function Bar({ className = '' }: { className?: string }) {
    return <div className={`bg-line animate-pulse rounded-xs ${className}`} />;
}

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

export function FollowRowsSkeleton() {
    return (
        <ul className="space-y-3">
            {[0, 1, 2].map((i) => (
                <li
                    key={i}
                    className={`${cardClass} flex items-center gap-3 p-2! md:p-3!`}
                >
                    <Bar className="size-8 shrink-0 rounded-md! md:size-10" />
                    <Bar className="h-7 w-40" />
                </li>
            ))}
        </ul>
    );
}
