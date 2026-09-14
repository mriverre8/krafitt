'use client';

import { useT } from '@/i18n/use-t';
import type { ReactNode } from 'react';

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
